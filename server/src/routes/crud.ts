import { Router } from 'express'
import { randomUUID } from 'crypto'
import { getDocument, listDocuments, removeDocument, setDocument } from '../config/aliyunStore'

const router = Router()

const ALLOWED_COLLECTIONS = [
  'products',
  'hanfuItems',
  'orders',
  'rentalOrders',
  'users',
  'favorites',
  'danmus',
  'danmu',
  'posts',
]

function validateCollection(collection: string): boolean {
  return ALLOWED_COLLECTIONS.includes(collection)
}

function docId(id: string | number): string {
  return String(id).replace(/[/.#[\]\s]/g, '_')
}

function guardCollection(collection: string, res: any): boolean {
  if (validateCollection(collection)) return true
  res.status(403).json({ code: 403, message: 'Collection is not allowed' })
  return false
}

function parseCondition(value: unknown): Record<string, unknown> | undefined {
  if (!value) return undefined
  if (typeof value === 'object') return value as Record<string, unknown>
  try {
    return JSON.parse(String(value))
  } catch {
    return undefined
  }
}

function matchesCondition(row: Record<string, any>, condition?: Record<string, unknown>) {
  if (!condition || Object.keys(condition).length === 0) return true
  return Object.entries(condition).every(([key, value]) => row[key] === value)
}

function sortRows(rows: Record<string, any>[], orderBy: string, order: string) {
  return rows.sort((a, b) => {
    const av = a[orderBy] ?? ''
    const bv = b[orderBy] ?? ''
    if (av === bv) return 0
    const result = av > bv ? 1 : -1
    return order === 'asc' ? result : -result
  })
}

router.get('/:collection/count', async (req, res) => {
  try {
    const { collection } = req.params
    if (!guardCollection(collection, res)) return

    const condition = parseCondition(req.query.condition)
    const total = (await listDocuments(collection)).filter(row => matchesCondition(row, condition)).length
    res.json({ code: 0, data: { total } })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

router.post('/:collection/batch', async (req, res) => {
  try {
    const { collection } = req.params
    if (!guardCollection(collection, res)) return

    const dataList = Array.isArray(req.body?.dataList) ? req.body.dataList : []
    if (dataList.length === 0) {
      return res.json({ code: 0, message: 'No data to sync', data: { count: 0, ids: [] } })
    }

    const now = new Date().toISOString()
    const ids: string[] = []

    for (const item of dataList) {
      const id = docId(item.id || item._id || randomUUID())
      ids.push(id)
      await setDocument(collection, id, {
        ...item,
        id: item.id || id,
        updatedAt: now,
        createdAt: item.createdAt || now,
      })
    }

    res.json({ code: 0, message: 'Batch sync succeeded', data: { count: ids.length, ids } })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

router.post('/:collection/batch-delete', async (req, res) => {
  try {
    const { collection } = req.params
    if (!guardCollection(collection, res)) return

    const ids = Array.isArray(req.body?.ids) ? req.body.ids : []
    for (const id of ids) {
      await removeDocument(collection, docId(id))
    }

    res.json({ code: 0, message: 'Batch delete succeeded', data: { count: ids.length } })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

router.get('/:collection', async (req, res) => {
  try {
    const { collection } = req.params
    if (!guardCollection(collection, res)) return

    const { page = 1, pageSize = 20, orderBy = 'createdAt', order = 'desc' } = req.query
    const condition = parseCondition(req.query.condition)
    const offset = (Number(page) - 1) * Number(pageSize)
    const rows = sortRows(
      (await listDocuments(collection)).filter(row => matchesCondition(row, condition)),
      String(orderBy),
      String(order),
    )

    res.json({
      code: 0,
      data: {
        list: rows.slice(offset, offset + Number(pageSize)),
        total: rows.length,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

router.get('/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params
    if (!guardCollection(collection, res)) return

    const data = await getDocument(collection, docId(id))
    if (!data) return res.status(404).json({ code: 404, message: 'Document not found' })

    res.json({ code: 0, data })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

router.post('/:collection', async (req, res) => {
  try {
    const { collection } = req.params
    if (!guardCollection(collection, res)) return

    const now = new Date().toISOString()
    const id = req.body?.id ? docId(req.body.id) : randomUUID()

    await setDocument(collection, id, {
      ...req.body,
      id: req.body?.id || id,
      createdAt: req.body?.createdAt || now,
      updatedAt: now,
    })

    res.json({ code: 0, message: 'Create succeeded', data: { id } })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

router.put('/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params
    if (!guardCollection(collection, res)) return

    const now = new Date().toISOString()
    await setDocument(collection, docId(id), {
      ...req.body,
      id: req.body?.id || id,
      updatedAt: now,
      createdAt: req.body?.createdAt || now,
    })

    res.json({ code: 0, message: 'Update succeeded' })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

router.delete('/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params
    if (!guardCollection(collection, res)) return

    await removeDocument(collection, docId(id))
    res.json({ code: 0, message: 'Delete succeeded' })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

export default router
