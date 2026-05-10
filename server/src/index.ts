// ═══════════════════════════════════════════════
//  独立后端服务入口
// ═══════════════════════════════════════════════

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { cloudbaseConfig } from './config/cloudbase'

// 导入路由
import authRoutes from './routes/auth'
import crudRoutes from './routes/crud'
import storageRoutes from './routes/storage'
import businessRoutes from './routes/business'

const app = express()
const PORT = process.env.PORT || 3000

// ─── 中间件 ─────────────────────────────────

// 安全头
app.use(helmet())

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}))

// 日志
app.use(morgan('dev'))

// 解析 JSON
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── 路由 ───────────────────────────────────

app.use('/api/auth', authRoutes)
app.use('/api/crud', crudRoutes)
app.use('/api/storage', storageRoutes)
app.use('/api/business', businessRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cloudbase: cloudbaseConfig,
  })
})

// 根路径
app.get('/', (req, res) => {
  res.json({
    name: 'SJY Server',
    version: '1.0.0',
    description: '独立后端服务 - 使用 Server Key 调用腾讯云 CloudBase',
    endpoints: {
      auth: '/api/auth',
      crud: '/api/crud',
      storage: '/api/storage',
      business: '/api/business',
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
  console.log(`   地址: http://localhost:${PORT}`)
  console.log(`   环境: ${process.env.NODE_ENV || 'development'}`)
  console.log(`\n📚 API 文档:`)
  console.log(`   http://localhost:${PORT}/`)
  console.log(`   http://localhost:${PORT}/health`)
  console.log()
})

export default app
