import { tcbConfig } from '../utils/cloudbase'

type CollectionName = 'products' | 'orders' | 'rentalOrders' | 'posts' | 'hanfuItems'

const HTTP_BASE = tcbConfig.endpoints.http

interface TcbResponse<T = any> {
  documents?: T[]
  data?: T[]
  [key: string]: any
}

/** 通用 HTTP 请求封装 */
async function tcbRequest<T = any>(path: string, method: string = 'GET', body?: any): Promise<T | null> {
  if (!tcbConfig.serverKey) {
    console.warn('[Cloud] Server key not configured')
    return null
  }
  try {
    const res = await fetch(`${HTTP_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tcbConfig.serverKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new Error(`TCB ${method} ${path} failed: ${res.status}`)
    return await res.json()
  } catch (e) {
    console.warn(`[Cloud] ${method} ${path} failed:`, e)
    return null
  }
}

/** 查询集合数据 */
export async function queryCollection(collection: CollectionName, limit: number = 100): Promise<any[]> {
  const data = await tcbRequest<TcbResponse>(`/api/v1/collections/${collection}/documents?limit=${limit}`, 'GET')
  return data?.documents || data?.data || []
}

/** 添加文档 */
export async function addDocument(collection: CollectionName, doc: Record<string, any>): Promise<string | null> {
  const result = await tcbRequest<TcbResponse<{ _id: string }>>(`/api/v1/collections/${collection}/documents`, 'POST', doc)
  return result?._id || result?.id || result?.documents?.[0]?._id || null
}

/** 更新文档 */
export async function updateDocument(collection: CollectionName, docId: string, updates: Record<string, any>): Promise<boolean> {
  const result = await tcbRequest(`/api/v1/collections/${collection}/documents/${docId}`, 'PATCH', updates)
  return result !== null
}

/** 云端同步状态 */
export function getCloudSyncStatus() {
  return {
    ready: !!(tcbConfig.serverKey && tcbConfig.env),
    env: tcbConfig.env,
    region: tcbConfig.region,
  }
}

/** 上传文件到云存储 */
export async function uploadToCloud(_file: File, _path: string): Promise<string | null> {
  const res = await fetch(`/api/v1/files/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tcbConfig.serverKey}` },
    body: _file,
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  const data = await res.json()
  return data?.fileId || null
}
