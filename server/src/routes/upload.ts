import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { promises as fs } from 'fs'
import { randomUUID } from 'crypto'

const router = Router()

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads')

// Ensure upload directory exists
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(() => {})

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin'
    const name = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`
    cb(null, name)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(png|jpg|jpeg|gif|webp|svg|bmp|ico|pdf|zip|json)$/i
    if (allowed.test(path.extname(file.originalname))) return cb(null, true)
    cb(new Error('File type not allowed'))
  },
})

// POST /api/upload — upload a single file
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 400, message: 'No file uploaded' })
  }

  const fileUrl = `/uploads/${req.file.filename}`
  res.json({
    code: 0,
    message: 'Upload successful',
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      url: fileUrl,
    },
  })
})

// GET /uploads/:filename — serve uploaded files
// This route is registered separately in index.ts

export default router
