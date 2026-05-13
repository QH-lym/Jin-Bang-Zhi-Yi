function getDefaultApiBase() {
  if (typeof window === 'undefined') return '/api'
  if (window.location.protocol === 'file:') return 'http://localhost:3001/api'

  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return '/api'

  return 'http://118.178.109.63:3001/api'
}

const DEFAULT_API_BASE = getDefaultApiBase()

const API_BASE = (import.meta.env.VITE_CLOUD_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '')

export function getServerApiBase() {
  return API_BASE
}

export interface CloudFunctionResponse<T = any> {
  code: number
  message: string
  data?: T
  error?: string
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<CloudFunctionResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    })
    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        code: body.code ?? response.status,
        message: body.message || `Server request failed: ${response.status}`,
        error: body.error,
      }
    }

    return {
      code: body.code ?? 0,
      message: body.message ?? 'ok',
      data: body.data,
      error: body.error,
    }
  } catch (error: any) {
    return {
      code: -1,
      message: `Server request failed: ${error.message || error}`,
    }
  }
}

function toQuery(params?: Record<string, unknown>) {
  if (!params) return ''
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (typeof value === 'object') query.set(key, JSON.stringify(value))
    else query.set(key, String(value))
  })

  const value = query.toString()
  return value ? `?${value}` : ''
}

export async function callFunction<T = any>(
  name: string,
  data: Record<string, any>,
): Promise<CloudFunctionResponse<T>> {
  return request<T>(`/${name}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const authApi = {
  register: (data: { username: string; password: string; displayName?: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { username: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  anonymous: () =>
    Promise.resolve({ code: 0, message: 'ok', data: { uid: 'server-anonymous', token: '' } }),

  getProfile: (userId: string) =>
    crudApi.get('users', userId),

  updateProfile: (userId: string, updates: Record<string, any>) =>
    crudApi.update('users', userId, updates),

  listUsers: (params?: { page?: number; pageSize?: number; keyword?: string; role?: string }) =>
    request(`/auth/users${toQuery(params)}`),

  setRole: (userId: string, role: 'admin' | 'user') =>
    crudApi.update('users', userId, { role }),

  removeUser: (userId: string) =>
    crudApi.remove('users', userId),
}

export const crudApi = {
  list: <T = any>(collection: string, params?: {
    condition?: Record<string, any>
    orderBy?: string
    order?: 'asc' | 'desc'
    page?: number
    pageSize?: number
  }) => request<{ list: T[]; total: number; totalPages?: number }>(`/crud/${collection}${toQuery(params)}`),

  get: <T = any>(collection: string, id: string) =>
    request<T>(`/crud/${collection}/${encodeURIComponent(id)}`),

  create: (collection: string, data: Record<string, any>) =>
    request<{ id: string }>(`/crud/${collection}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (collection: string, id: string, data: Record<string, any>) =>
    request(`/crud/${collection}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  remove: (collection: string, id: string) =>
    request(`/crud/${collection}/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  batchCreate: (collection: string, dataList: Record<string, any>[]) =>
    request<{ count: number; ids: string[] }>(`/crud/${collection}/batch`, {
      method: 'POST',
      body: JSON.stringify({ dataList }),
    }),

  batchRemove: (collection: string, ids: string[]) =>
    request<{ count: number }>(`/crud/${collection}/batch-delete`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  count: (collection: string, condition?: Record<string, any>) =>
    request<{ total: number }>(`/crud/${collection}/count${toQuery({ condition })}`),
}

export const storageApi = {
  getUploadPath: (params: { filename: string; prefix?: string; mimeType?: string; userId?: string }) =>
    request<{ cloudPath: string }>('/storage/signature', {
      method: 'POST',
      body: JSON.stringify({ cloudPath: `${params.prefix || 'uploads'}/${params.filename}` }),
    }),

  deleteFile: (fileId: string) =>
    request(`/storage/${encodeURIComponent(fileId)}`, { method: 'DELETE' }),

  batchDelete: (fileIds: string[]) =>
    Promise.all(fileIds.map(fileId => storageApi.deleteFile(fileId))).then(() => ({ code: 0, message: 'ok' })),

  getFileUrl: (fileId: string) =>
    request<{ url: string }>(`/storage/url${toQuery({ fileId })}`),

  batchGetUrl: (fileIds: string[]) =>
    Promise.all(fileIds.map(fileId => storageApi.getFileUrl(fileId))),

  getTempUrl: (fileId: string, expire?: number) =>
    request<{ url: string }>(`/storage/url${toQuery({ fileId, expire })}`),
}

export const businessApi = {
  createOrder: (data: {
    product: string
    buyer: string
    phone?: string
    address?: string
    amount: number
    items?: any[]
    remark?: string
  }) => request<{ orderId: string }>('/business/orders', { method: 'POST', body: JSON.stringify(data) }),

  updateOrderStatus: (orderId: string, status: string, remark?: string) =>
    request(`/business/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remark }),
    }),

  createRentalOrder: (data: {
    hanfuName: string
    hanfuId?: string
    renter: string
    phone?: string
    startDate: string
    endDate: string
    amount: number
    remark?: string
  }) => request<{ orderId: string; rentalDays: number }>('/business/rental-orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateRentalStatus: (orderId: string, status: string, remark?: string) =>
    request(`/business/rental-orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remark }),
    }),

  getDashboard: () =>
    request('/business/dashboard'),

  getSalesStats: (period?: 'week' | 'month' | 'year') =>
    request(`/business/sales-stats${toQuery({ period })}`),

  getPopularProducts: (limit?: number) =>
    request(`/business/popular-products${toQuery({ limit })}`),
}

export default callFunction
