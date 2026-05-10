// ═══════════════════════════════════════════════
//  云函数：业务逻辑 (business)
// ═══════════════════════════════════════════════
//  路由 action:
//    createOrder       — 创建商品订单
//    updateOrderStatus — 更新订单状态
//    createRentalOrder — 创建租赁订单
//    updateRentalStatus — 更新租赁订单状态
//    getDashboard      — 获取仪表盘统计数据
//    getSalesStats     — 获取销售统计
//    getPopularProducts — 获取热门商品

const cloudbase = require('@cloudbase/node-sdk')
const { success, fail, requireParams, queryDocs, getDocById, addDoc, updateDoc, countDocs } = require('../_shared/utils')

const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV })
const db = app.database()
const _ = db.command

// ─── 订单状态流转 ───────────────────────────

const ORDER_STATUS_FLOW: Record<string, string[]> = {
  pending:   ['paid', 'cancelled'],
  paid:      ['shipped', 'refunding'],
  shipped:   ['delivered', 'refunding'],
  delivered: ['completed', 'refunding'],
  completed: [],
  cancelled: [],
  refunding: ['refunded', 'paid'],
  refunded:  [],
}

/** 校验订单状态流转是否合法 */
function validateStatusTransition(current: string, next: string): boolean {
  const allowed = ORDER_STATUS_FLOW[current]
  return allowed ? allowed.includes(next) : false
}

// ─── 主入口 ─────────────────────────────────

exports.main = async (event: any) => {
  const { action } = event

  try {
    switch (action) {
      // ── 创建商品订单 ──
      case 'createOrder': {
        const err = requireParams(event, 'product', 'buyer', 'amount')
        if (err) return err

        const { product, buyer, phone, address, amount, items, remark } = event

        const orderId = await addDoc('orders', {
          product,
          buyer,
          phone: phone || '',
          address: address || '',
          amount: Number(amount),
          items: items || [],
          remark: remark || '',
          status: 'pending',
        })

        return success({ orderId }, '订单创建成功')
      }

      // ── 更新订单状态 ──
      case 'updateOrderStatus': {
        const err = requireParams(event, 'orderId', 'status')
        if (err) return err

        const { orderId, status, remark } = event

        // 获取当前订单
        const order = await getDocById('orders', orderId)
        if (!order) return fail('订单不存在', 404)

        // 校验状态流转
        if (!validateStatusTransition(order.status, status)) {
          return fail(`不允许从 "${order.status}" 变更为 "${status}"`, 400)
        }

        const updates: any = { status }
        if (remark) updates.remark = remark

        // 状态变更时记录日志
        updates.statusHistory = _.push({
          from: order.status,
          to: status,
          time: new Date().toISOString(),
          remark: remark || '',
        })

        const ok = await updateDoc('orders', orderId, updates)
        return ok ? success(null, `订单状态已更新为: ${status}`) : fail('状态更新失败')
      }

      // ── 创建租赁订单 ──
      case 'createRentalOrder': {
        const err = requireParams(event, 'hanfuName', 'renter', 'startDate', 'endDate', 'amount')
        if (err) return err

        const { hanfuName, hanfuId, renter, phone, startDate, endDate, amount, remark } = event

        // 校验日期
        const start = new Date(startDate)
        const end = new Date(endDate)
        if (end <= start) {
          return fail('结束日期必须晚于开始日期', 400)
        }

        const rentalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

        const orderId = await addDoc('rentalOrders', {
          hanfuName,
          hanfuId: hanfuId || '',
          renter,
          phone: phone || '',
          startDate,
          endDate,
          rentalDays,
          amount: Number(amount),
          remark: remark || '',
          status: 'pending',
        })

        return success({ orderId, rentalDays }, '租赁订单创建成功')
      }

      // ── 更新租赁订单状态 ──
      case 'updateRentalStatus': {
        const err = requireParams(event, 'orderId', 'status')
        if (err) return err

        const { orderId, status, remark } = event

        const order = await getDocById('rentalOrders', orderId)
        if (!order) return fail('租赁订单不存在', 404)

        const rentalStatusFlow: Record<string, string[]> = {
          pending:   ['confirmed', 'cancelled'],
          confirmed: ['renting', 'cancelled'],
          renting:   ['returned', 'overdue'],
          returned:  ['completed'],
          overdue:   ['returned', 'completed'],
          completed: [],
          cancelled: [],
        }

        const allowed = rentalStatusFlow[order.status]
        if (!allowed?.includes(status)) {
          return fail(`不允许从 "${order.status}" 变更为 "${status}"`, 400)
        }

        const updates: any = { status }
        if (remark) updates.remark = remark

        const ok = await updateDoc('rentalOrders', orderId, updates)
        return ok ? success(null, `租赁状态已更新为: ${status}`) : fail('状态更新失败')
      }

      // ── 仪表盘统计 ──
      case 'getDashboard': {
        const [productCount, orderCount, rentalCount, userCount] = await Promise.all([
          countDocs('products'),
          countDocs('orders'),
          countDocs('rentalOrders'),
          countDocs('users'),
        ])

        // 今日订单数
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayOrders = await countDocs('orders', {
          createdAt: _.gte(todayStart.toISOString()),
        })

        // 待处理订单
        const pendingOrders = await countDocs('orders', { status: 'pending' })
        const pendingRentals = await countDocs('rentalOrders', { status: 'pending' })

        // 总收入
        const allOrders = await queryDocs('orders', { limit: 1000 })
        const totalRevenue = allOrders.reduce((sum: number, o: any) => sum + (Number(o.amount) || 0), 0)

        return success({
          overview: {
            productCount,
            orderCount,
            rentalCount,
            userCount,
            todayOrders,
            totalRevenue,
          },
          pending: {
            orders: pendingOrders,
            rentals: pendingRentals,
          },
        })
      }

      // ── 销售统计 ──
      case 'getSalesStats': {
        const { period = 'month' } = event

        const now = new Date()
        let startDate: Date

        switch (period) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1)
            break
          default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }

        const orders = await queryDocs('orders', {
          condition: {
            createdAt: _.gte(startDate.toISOString()),
          },
          orderBy: 'createdAt',
          order: 'desc',
          limit: 500,
        })

        // 按状态分组统计
        const statusStats: Record<string, number> = {}
        let totalAmount = 0
        for (const order of orders) {
          const s = (order as any).status || 'unknown'
          statusStats[s] = (statusStats[s] || 0) + 1
          totalAmount += Number((order as any).amount) || 0
        }

        // 按日分组（最近7天）
        const dailyStats: Record<string, { count: number; amount: number }> = {}
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const key = `${d.getMonth() + 1}/${d.getDate()}`
          dailyStats[key] = { count: 0, amount: 0 }
        }
        for (const order of orders) {
          const d = new Date((order as any).createdAt)
          const key = `${d.getMonth() + 1}/${d.getDate()}`
          if (dailyStats[key]) {
            dailyStats[key].count++
            dailyStats[key].amount += Number((order as any).amount) || 0
          }
        }

        return success({
          period,
          startDate: startDate.toISOString(),
          totalOrders: orders.length,
          totalAmount,
          statusStats,
          dailyStats,
        })
      }

      // ── 热门商品 ──
      case 'getPopularProducts': {
        const { limit = 10 } = event

        const products = await queryDocs('products', {
          orderBy: 'salesCount',
          order: 'desc',
          limit: Math.min(limit, 50),
        })

        return success(products)
      }

      default:
        return fail(`未知 action: ${action}`, 400)
    }
  } catch (error: any) {
    console.error('[business] 错误:', error)
    return fail(`服务器错误: ${error.message}`, 500)
  }
}
