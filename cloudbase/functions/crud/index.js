// ═══════════════════════════════════════════════
//  云函数：数据 CRUD (crud)
// ═══════════════════════════════════════════════
//  action: list / get / create / update / remove / batchCreate / batchRemove / count

const cloudbase = require('@cloudbase/node-sdk')
const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV })
const db = app.database()

// ─── 工具函数（内联） ───────────────────────

function success(data, message) { return { code: 0, message: message || 'ok', data } }
function fail(message, code) { return { code: code || -1, message } }

// ─── 集合白名单 ─────────────────────────────

const ALLOWED = ['products', 'hanfuItems', 'orders', 'rentalOrders', 'users', 'favorites', 'danmus', 'posts']

// ─── 主入口 ─────────────────────────────────

exports.main = async (event) => {
  const { action, collection } = event

  if (!collection) return fail('缺少 collection')
  if (!ALLOWED.includes(collection)) return fail('不允许的集合: ' + collection, 403)

  try {
    switch (action) {

      case 'list': {
        const { condition = {}, orderBy = 'createdAt', order = 'desc', page = 1, pageSize = 20 } = event
        let ref = db.collection(collection).where(condition)
        ref = ref.orderBy(orderBy, order).skip((page - 1) * pageSize).limit(Math.min(pageSize, 100))
        const { data } = await ref.get()
        const { total } = await db.collection(collection).where(condition).count()
        return success({ list: data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
      }

      case 'get': {
        if (!event.id) return fail('缺少 id', 400)
        const { data } = await db.collection(collection).doc(event.id).get()
        if (!data) return fail('不存在', 404)
        return success(data)
      }

      case 'create': {
        if (!event.data) return fail('缺少 data', 400)
        const now = new Date().toISOString()
        const result = await db.collection(collection).add({ ...event.data, createdAt: now, updatedAt: now })
        return success({ id: result.id }, '创建成功')
      }

      case 'update': {
        if (!event.id || !event.data) return fail('缺少 id 或 data', 400)
        await db.collection(collection).doc(event.id).update({ ...event.data, updatedAt: new Date().toISOString() })
        return success(null, '更新成功')
      }

      case 'remove': {
        if (!event.id) return fail('缺少 id', 400)
        await db.collection(collection).doc(event.id).remove()
        return success(null, '删除成功')
      }

      case 'batchCreate': {
        if (!Array.isArray(event.dataList) || event.dataList.length === 0) return fail('dataList 必须是非空数组', 400)
        const now = new Date().toISOString()
        const ids = []
        for (const item of event.dataList) {
          const result = await db.collection(collection).add({ ...item, createdAt: now, updatedAt: now })
          ids.push(result.id)
        }
        return success({ count: ids.length, ids }, '批量创建 ' + ids.length + ' 条')
      }

      case 'batchRemove': {
        if (!Array.isArray(event.ids)) return fail('ids 必须是数组', 400)
        let count = 0
        for (const id of event.ids) {
          try { await db.collection(collection).doc(id).remove(); count++ } catch (e) {}
        }
        return success({ count }, '删除 ' + count + ' 条')
      }

      case 'count': {
        const { total } = await db.collection(collection).where(event.condition || {}).count()
        return success({ collection, total })
      }

      default:
        return fail('未知 action: ' + action, 400)
    }
  } catch (error) {
    console.error('[crud]', action, collection, error)
    return fail('服务器错误: ' + (error.message || error), 500)
  }
}
