// ═══════════════════════════════════════════════
//  独立后端服务入口（阿里云 OSS 存储）
// ═══════════════════════════════════════════════

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import fs from 'fs'
import https from 'https'
import { checkOSSConfig } from './config/aliyunStore'

// 导入路由
import crudRoutes from './routes/crud'
import uploadRoutes from './routes/upload'

const app = express()
const PORT = process.env.PORT || 3001
const ossConfig = checkOSSConfig()

// ─── 中间件 ─────────────────────────────────

app.use(helmet())

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}))

app.use(morgan('dev'))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── 路由 ───────────────────────────────────

app.use('/api/crud', crudRoutes)
app.use('/api/upload', uploadRoutes)

// 静态文件服务（上传文件）
const uploadsDir = path.resolve(process.cwd(), 'uploads')
app.use('/uploads', express.static(uploadsDir))

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    storage: ossConfig.configured ? 'oss' : 'local',
    oss: ossConfig,
  })
})

// 根路径
app.get('/', (req, res) => {
  res.json({
    name: 'SJY Server',
    version: '2.0.0',
    description: '独立后端服务 - 阿里云 OSS 数据同步',
    endpoints: {
      crud: '/api/crud',
      upload: '/api/upload',
      files: '/uploads/*',
      health: '/health',
    },
  })
})

// 404 处理
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' })
})

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err)
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

// ─── 启动 ───────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 服务器已启动`)
  console.log(`   HTTP 地址: http://localhost:${PORT}`)
  console.log(`   环境: ${process.env.NODE_ENV || 'development'}`)
  console.log(`\n📚 API 文档:`)
  console.log(`   http://localhost:${PORT}/`)
  console.log(`   http://localhost:${PORT}/health`)
  console.log()
})

// ─── HTTPS 启动（使用已安装的 SSL 证书）─────────────────────────────

const HTTPS_PORT = process.env.HTTPS_PORT || 3002
const SSL_CERT = process.env.SSL_CERT || ''
const SSL_KEY = process.env.SSL_KEY || ''

if (SSL_CERT && SSL_KEY && fs.existsSync(SSL_CERT) && fs.existsSync(SSL_KEY)) {
  const sslOptions = {
    key: fs.readFileSync(SSL_KEY),
    cert: fs.readFileSync(SSL_CERT),
  }
  https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
    console.log(`\n🔒 HTTPS 服务器已启动`)
    console.log(`   HTTPS 地址: https://localhost:${HTTPS_PORT}`)
    console.log(`   证书: ${SSL_CERT}`)
    console.log()
  })
} else {
  console.log(`\n⚠️  未配置 SSL 证书，HTTPS 未启用`)
  console.log(`   设置环境变量 SSL_CERT 和 SSL_KEY 以启用 HTTPS`)
  console.log(`   示例:`)
  console.log(`   SSL_CERT=C:\\inetpub\\wwwroot\\cert\\cert.pem`)
  console.log(`   SSL_KEY=C:\\inetpub\\wwwroot\\cert\\privkey.pem`)
  console.log()
}

export default app
