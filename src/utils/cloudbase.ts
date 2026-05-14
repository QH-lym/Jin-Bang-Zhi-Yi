import { getServerApiBase } from './cloudFunctions'

// ─── 阿里云 Server Proxy 文件上传 ────────────

// CloudBase auth 不再可用，保留 stub 避免已有代码报错
const stubAuth = {
  async signInAnonymously() { return null },
  async getVerification(_params?: any) { return null },
  async signInWithEmail(_params?: any) { throw new Error('CloudBase 已迁移至阿里云，邮箱验证不可用') },
  async signInWithSms(_params?: any) { throw new Error('CloudBase 已迁移至阿里云，短信验证不可用') },
}

/** @deprecated CloudBase 已被阿里云 OSS 替代 */
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
  // 不再依赖 CloudBase，始终可用
  return true
}

export default { uploadFile, getFileUrl, isCloudBaseReady }
