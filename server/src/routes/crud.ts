// ═══════════════════════════════════════════════
//  CRUD 路由 - 通用数据操作
// ═══════════════════════════════════════════════

import { Router } from 'express'
import { db } from '../config/cloudbase'

const router = Router()
const _ = db.command

// 支持的集合白名单
const ALLOWED_COLLECTIONS = [
  'products', 'hanfuItems', 'orders', 'rentalOrders',
  'users', 'favorites', 'danmus', 'posts'
]

function validateCollection(collection: string): boolean {
  return ALLOWED_COLLECTIONS.includes(collection)
}

// 查询列表
router.get('/:collection', async (req, res) => {
  try {
    const { collection } = req.params
    if (!validateCollection(collection)) {
      return res.status(403).json({ code: 403, message: '不允许操作的集合' })
    }

    const { page = 1, pageSize = 20, orderBy = 'createdAt', order = 'desc' } = req.query

    const { data, total } = await db.collection(collection)
      .skip((Number(page) - 1) * Number(pageSize))
      .limit(Number(pageSize))
      .orderBy(orderBy as string, order as any)
      .get()

    res.json({
      code: 0,
      data: {
        list: data,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

// 根据 ID 获取
router.get('/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params
    if (!validateCollection(collection)) {
      return res.status(403).json({ code: 403, message: '不允许操作的集合' })
    }

    const { data } = await db.collection(collection).doc(id).get()
    
    if (!data) {
      return res.status(404).json({ code: 404, message: '文档不存在' })
    }

    res.json({ code: 0, data })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

// 创建
router.post('/:collection', async (req, res) => {
  try {
    const { collection } = req.params
    if (!validateCollection(collection)) {
      return res.status(403).json({ code: 403, message: '不允许操作的集合' })
    }

    const result = await db.collection(collection).add({
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    res.json({ code: 0, message: '创建成功', data: { id: result.id } })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

// 更新
router.put('/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params
    if (!validateCollection(collection)) {
      return res.status(403).json({ code: 403, message: '不允许操作的集合' })
    }

    await db.collection(collection).doc(id).update({
      ...req.body,
      updatedAt: new Date().toISOString(),
    })

    res.json({ code: 0, message: '更新成功' })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

// 删除
router.delete('/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params
    if (!validateCollection(collection)) {
      return res.status(403).json({ code: 403, message: '不允许操作的集合' })
    }

    await db.collection(collection).doc(id).remove()

    res.json({ code: 0, message: '删除成功' })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

export default router
