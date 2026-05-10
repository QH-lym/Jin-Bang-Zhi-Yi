// ═══════════════════════════════════════════════
//  存储路由 - 文件上传/下载
// ═══════════════════════════════════════════════

import { Router } from 'express'
import { storage } from '../config/cloudbase'

const router = Router()

// 获取上传签名（用于客户端直传）
router.post('/signature', async (req, res) => {
  try {
    const { cloudPath } = req.body
    
    if (!cloudPath) {
      return res.status(400).json({ code: 400, message: '缺少 cloudPath' })
    }

    // 使用 Server Key 获取上传签名
    const result = await storage.getUploadMetadata(cloudPath)
    
    res.json({ code: 0, data: result })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

// 获取文件下载链接
router.get('/url', async (req, res) => {
  try {
    const { fileId } = req.query
    
    if (!fileId) {
      return res.status(400).json({ code: 400, message: '缺少 fileId' })
    }

    const result = await storage.getTemporaryUrl({
      fileList: [String(fileId)],
    })

    res.json({ code: 0, data: result })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

// 删除文件
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params

    await storage.deleteFile({ fileList: [fileId] })

    res.json({ code: 0, message: '文件已删除' })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

export default router
