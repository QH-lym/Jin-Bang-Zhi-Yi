// ═══════════════════════════════════════════════
//  业务路由 - 订单/统计等
// ═══════════════════════════════════════════════

import { Router } from 'express'
import { db } from '../config/cloudbase'

const router = Router()
const _ = db.command

// 创建订单
router.post('/orders', async (req, res) => {
  try {
    const { product, buyer, amount, items, address, phone } = req.body

    if (!product || !buyer || !amount) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' })
    }

    const result = await db.collection('orders').add({
      product,
      buyer,
      amount: Number(amount),
      items: items || [],
      address: address || '',
      phone: phone || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    res.json({ code: 0, message: '订单创建成功', data: { orderId: result.id } })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

// 更新订单状态
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status, remark } = req.body

    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ code: 400, message: '无效的状态' })
    }

    await db.collection('orders').doc(id).update({
      status,
      remark: remark || '',
      updatedAt: new Date().toISOString(),
    })

    res.json({ code: 0, message: '状态更新成功' })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

// 仪表盘统计
router.get('/dashboard', async (req, res) => {
  try {
    // 使用 Server Key 权限获取所有统计
    const [
      productCount,
      orderCount,
      rentalCount,
      userCount,
    ] = await Promise.all([
      db.collection('products').count(),
      db.collection('orders').count(),
      db.collection('rentalOrders').count(),
      db.collection('users').count(),
    ])

    // 今日订单
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { total: todayOrders } = await db.collection('orders')
      .where({ createdAt: _.gte(today.toISOString()) })
      .count()

    // 总收入
    const { data: allOrders } = await db.collection('orders').limit(1000).get()
    const totalRevenue = allOrders.reduce((sum: number, o: any) => sum + (Number(o.amount) || 0), 0)

    res.json({
      code: 0,
      data: {
        overview: {
          productCount: productCount.total,
          orderCount: orderCount.total,
          rentalCount: rentalCount.total,
          userCount: userCount.total,
          todayOrders,
          totalRevenue,
        },
      },
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

export default router
