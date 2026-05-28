import { getServerApiBase } from './cloudFunctions'

// ─── 阿里云 Server Proxy 文件上传 ────────────

// 兼容旧的验证码登录调用；当前版本仅保留本地账号登录。
const stubAuth = {
  async signInAnonymously() { return null },
  async getVerification(_params?: Record<string, unknown>) { return null },
  async signInWithEmail(_params?: Record<string, unknown>) { throw new Error('邮箱验证码登录不可用') },
  async signInWithSms(_params?: Record<string, unknown>) { throw new Error('短信验证码登录不可用') },
}

/** @deprecated 兼容旧调用，请优先使用本地账号登录和服务端文件上传 */
export const cloudbase = {
  auth: () => stubAuth,
  database: () => null,
  rdb: () => null,
}

/** 上传文件到服务器（阿里云 OSS 由服务端处理） */
export async function uploadFile(file: File, _path?: string): Promise<string | null> {
  const apiBase = getServerApiBase().replace(/\/api$/, '')
  try {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${apiBase}/api/upload`, {
      method: 'POST',
      body: form,
    })
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
    const data = await res.json()
    if (data?.code === 0 && data?.data?.url) {
      return `${apiBase}${data.data.url}`
    }
    return null
  } catch (error) {
    console.warn('[Upload] 文件上传失败:', error)
    return null
  }
}

/** 获取文件访问 URL */
export function getFileUrl(fileUrl: string): string {
  return fileUrl
}

/** 检查后端存储是否已配置 */
export function isCloudBaseReady(): boolean {
  // 当前上传服务由独立后端处理，前端始终可调用。
  return true
}

export default { uploadFile, getFileUrl, isCloudBaseReady }
