// ═══════════════════════════════════════════════
//  云函数公共工具模块
// ═══════════════════════════════════════════════

const cloudbase = require('@cloudbase/node-sdk')

// 初始化（云函数环境中自动获取环境变量）
const app = cloudbase.init({
  env: cloudbase.SYMBOL_CURRENT_ENV,
})

/** 云数据库实例 */
const db = app.database()

/** 云存储实例 */
const _storage = app.uploadFile

// ─── 统一响应格式 ───────────────────────────

export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
  error?: string
}

/** 成功响应 */
export function success<T = any>(data: T, message = 'ok'): ApiResponse<T> {
  return { code: 0, message, data }
}

/** 失败响应 */
export function fail(message: string, code = -1): ApiResponse {
  return { code, message }
}

/** 参数缺失 */
export function paramMissing(name: string): ApiResponse {
  return fail(`缺少必要参数: ${name}`, 400)
}

/** 未授权 */
export function unauthorized(message = '未授权，请先登录'): ApiResponse {
  return fail(message, 401)
}

/** 禁止访问 */
export function forbidden(message = '无权限执行此操作'): ApiResponse {
  return fail(message, 403)
}

/** 未找到 */
export function notFound(message = '资源不存在'): ApiResponse {
  return fail(message, 404)
}

// ─── 参数校验 ───────────────────────────────

/** 校验必填参数，缺失则返回错误响应 */
export function requireParams(
  body: Record<string, any>,
  ...keys: string[]
): ApiResponse | null {
  for (const key of keys) {
    if (body[key] === undefined || body[key] === null || body[key] === '') {
      return paramMissing(key)
    }
  }
  return null
}

// ─── 数据库操作封装 ─────────────────────────

/** 获取集合引用 */
export function collection(name: string) {
  return db.collection(name)
}

/** 查询文档列表 */
export async function queryDocs(
  collectionName: string,
  options?: {
    condition?: Record<string, any>
    orderBy?: string
    order?: 'asc' | 'desc'
    limit?: number
    offset?: number
    field?: Record<string, boolean>
  },
) {
  let ref = db.collection(collectionName)

  if (options?.condition) {
    ref = ref.where(options.condition)
  }
  if (options?.orderBy) {
    ref = ref.orderBy(options.orderBy, options.order || 'desc')
  }
  if (options?.field) {
    ref = ref.field(options.field)
  }
  if (options?.offset) {
    ref = ref.skip(options.offset)
  }

  const limit = options?.limit || 100
  ref = ref.limit(limit)

  const { data } = await ref.get()
  return data
}

/** 根据 ID 获取单个文档 */
export async function getDocById(collectionName: string, docId: string) {
  const { data } = await db.collection(collectionName).doc(docId).get()
  return data
}

/** 添加文档 */
export async function addDoc(collectionName: string, doc: Record<string, any>) {
  const now = new Date().toISOString()
  const result = await db.collection(collectionName).add({
    ...doc,
    createdAt: now,
    updatedAt: now,
  })
  return result.id
}

/** 更新文档 */
export async function updateDoc(
  collectionName: string,
  docId: string,
  updates: Record<string, any>,
) {
  const result = await db.collection(collectionName).doc(docId).update({
    ...updates,
    updatedAt: new Date().toISOString(),
  })
  return result.updated === 1
}

/** 删除文档 */
export async function removeDoc(collectionName: string, docId: string) {
  const result = await db.collection(collectionName).doc(docId).remove()
  return result.deleted === 1
}

/** 统计集合文档数 */
export async function countDocs(
  collectionName: string,
  condition?: Record<string, any>,
) {
  let ref = db.collection(collectionName)
  if (condition) {
    ref = ref.where(condition)
  }
  const { total } = await ref.count()
  return total
}

// ─── 导出 ───────────────────────────────────

export { db, app }
export default { db, app }
