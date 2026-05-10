// ═══════════════════════════════════════════════
//  云函数：文件存储 (storage)
// ═══════════════════════════════════════════════
//  路由 action:
//    uploadUrl   — 获取上传链接（客户端直传）
//    deleteFile  — 删除云存储文件
//    getFileUrl  — 获取文件临时下载链接
//    listFiles   — 列出指定目录下的文件
//    getTempUrl  — 获取带签名的临时访问URL

const cloudbase = require('@cloudbase/node-sdk')
const { success, fail, requireParams } = require('../_shared/utils')

const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV })

// 允许的文件类型
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav', 'audio/ogg',
  'application/pdf',
  'application/json',
  'text/plain', 'text/csv',
]

// 文件大小限制（字节）
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

/** 校验文件类型 */
function validateMimeType(mimeType: string) {
  if (!mimeType) return false
  return ALLOWED_MIME_TYPES.includes(mimeType) || mimeType.startsWith('image/')
}

/** 生成云存储路径 */
function generateCloudPath(prefix: string, filename: string, userId?: string): string {
  const date = new Date()
  const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
  const ext = filename.split('.').pop() || ''
  const randomName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const baseName = randomName + (ext ? `.${ext}` : '')

  if (userId) {
    return `${prefix}/${userId}/${dateStr}/${baseName}`
  }
  return `${prefix}/${dateStr}/${baseName}`
}

// ─── 主入口 ─────────────────────────────────

exports.main = async (event: any) => {
  const { action } = event

  try {
    switch (action) {
      // ── 获取上传信息（返回 cloudPath 供客户端直传） ──
      case 'uploadUrl': {
        const { filename, prefix = 'uploads', mimeType, userId, maxSize } = event

        if (!filename) return requireParams(event, 'filename')

        // 校验文件类型
        if (mimeType && !validateMimeType(mimeType)) {
          return fail(`不支持的文件类型: ${mimeType}`, 400)
        }

        // 校验文件大小
        const limit = maxSize || MAX_FILE_SIZE
        if (event.fileSize && event.fileSize > limit) {
          return fail(`文件大小超过限制 (${Math.round(limit / 1024 / 1024)}MB)`, 400)
        }

        const cloudPath = generateCloudPath(prefix, filename, userId)

        return success({
          cloudPath,
          // 客户端使用 cloudbase.uploadFile({ cloudPath, filePath }) 直传
          uploadTip: '使用 CloudBase SDK 的 uploadFile 方法上传',
        })
      }

      // ── 删除文件 ──
      case 'deleteFile': {
        const err = requireParams(event, 'fileId')
        if (err) return err

        const { fileId } = event
        const result = await app.deleteFile({ fileList: [fileId] })

        if (result.code === 0 || result.fileList?.[0]?.code === 'SUCCESS') {
          return success(null, '文件已删除')
        }
        return fail('文件删除失败')
      }

      // ── 批量删除文件 ──
      case 'batchDelete': {
        const err = requireParams(event, 'fileIds')
        if (err) return err

        const { fileIds } = event
        if (!Array.isArray(fileIds) || fileIds.length === 0) {
          return fail('fileIds 必须是非空数组', 400)
        }

        const result = await app.deleteFile({ fileList: fileIds })
        return success(result, '批量删除完成')
      }

      // ── 获取文件下载链接 ──
      case 'getFileUrl': {
        const err = requireParams(event, 'fileId')
        if (err) return err

        const { fileId } = event
        const result = await app.getTempFileURL({ fileList: [fileId] })

        const file = result.fileList?.[0]
        if (file?.code === 'SUCCESS' || file?.download_url) {
          return success({
            fileId,
            url: file.download_url,
            expire: file.expire_time,
          })
        }
        return fail('获取文件链接失败')
      }

      // ── 批量获取下载链接 ──
      case 'batchGetUrl': {
        const err = requireParams(event, 'fileIds')
        if (err) return err

        const { fileIds } = event
        const result = await app.getTempFileURL({ fileList: fileIds })

        const urls = (result.fileList || []).map((f: any) => ({
          fileId: f.fileID,
          url: f.download_url,
          code: f.code,
        }))

        return success(urls)
      }

      // ── 获取带签名的临时访问URL ──
      case 'getTempUrl': {
        const err = requireParams(event, 'fileId')
        if (err) return err

        const { fileId, expire = 3600 } = event // 默认1小时
        const result = await app.getTempFileURL({
          fileList: [fileId],
          expire: Math.min(expire, 86400), // 最长24小时
        })

        const file = result.fileList?.[0]
        if (file?.download_url) {
          return success({
            url: file.download_url,
            expire: file.expire_time,
          })
        }
        return fail('获取临时链接失败')
      }

      default:
        return fail(`未知 action: ${action}`, 400)
    }
  } catch (error: any) {
    console.error('[storage] 错误:', error)
    return fail(`服务器错误: ${error.message}`, 500)
  }
}
