// ═══════════════════════════════════════════════
//  CloudBase 统一入口 — 所有引用都从这里导入
// ═══════════════════════════════════════════════

import cloudbaseSDK from '@cloudbase/js-sdk'

const envId = import.meta.env.VITE_CLOUDBASE_ENV_ID || 'sjy-d0gxtaklr8e1be761'
const region = import.meta.env.VITE_CLOUDBASE_REGION || 'ap-shanghai'
const publishableKey = import.meta.env.VITE_TCB_PUBLISHABLE_KEY || ''
const serverKey = import.meta.env.VITE_TCB_SERVER_KEY || ''

// 统一初始化
export const cloudbase = cloudbaseSDK.init({
  env: envId,
  region,
  accessKey: publishableKey,
})

// 匿名登录 Promise（确保数据库操作在登录完成后执行）
let loginPromise: Promise<any>
try {
  const authObj: any = cloudbase.auth()
  if (typeof authObj.login === 'function') {
    loginPromise = authObj.login({ anonymous: true }).catch((e: any) => {
      console.warn('[CloudBase] 匿名登录失败:', e)
      return null
    })
  } else {
    // SDK 版本差异：没有 login 方法时直接解析，避免 TS 报错
    loginPromise = Promise.resolve(null)
  }
} catch (e) {
  loginPromise = Promise.resolve(null)
}

export const auth = cloudbase.auth()

// 导出登录 Promise 供其他模块使用
export { loginPromise }

export const tcbConfig = {
  env: envId,
  region,
  publishableKey,
  serverKey,
  endpoints: {
    storage: `https://${envId}-1429062856.tcb.qcloud.la`,
    auth: `https://${envId}.${region}.tcb-api.tencentcloudapi.com`,
    http: `https://${envId}-1429062856.${region}.app.tcloudbase.com`,
  },
} as const

// 数据库实例
let dbInstance: ReturnType<typeof cloudbase.database> | null = null
export function getDb() {
  if (!dbInstance) dbInstance = cloudbase.database()
  return dbInstance
}

/** 检查 CloudBase 是否已配置 */
export function isCloudBaseReady(): boolean {
  return !!(publishableKey && envId)
}

/** 获取匿名访问令牌 */
export async function getAnonymousToken(): Promise<{ access_token: string; expires_in: number } | null> {
  if (!publishableKey) return null
  try {
    const res = await fetch(tcbConfig.endpoints.auth + '/auth/v1/signin/anonymously', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publishableKey}`,
      },
      body: JSON.stringify({}),
    })
    if (!res.ok) throw new Error(`Auth failed: ${res.status}`)
    return await res.json()
  } catch (e) {
    console.warn('[CloudBase] Anonymous auth failed:', e)
    return null
  }
}

/** 上传文件到云存储 */
export async function uploadFile(file: File, path: string): Promise<string | null> {
  const token = await getAnonymousToken()
  if (!token) return null
  try {
    const url = `${tcbConfig.endpoints.storage}/upload?cloudPath=${encodeURIComponent(path)}`
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token.access_token}` },
      body: form,
    })
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
    const data = await res.json()
    return data?.fileId || data?.download_url || null
  } catch (e) {
    console.warn('[CloudBase] Upload failed:', e)
    return null
  }
}

/** 获取云存储文件下载URL */
export function getFileUrl(fileId: string): string {
  return `${tcbConfig.endpoints.storage}/${fileId}`
}

// 默认导出，兼容旧引用
export default cloudbase
