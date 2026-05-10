// ═══════════════════════════════════════════════
//  CloudBase 配置 - 使用 Server Key
// ═══════════════════════════════════════════════

import cloudbase from '@cloudbase/node-sdk'

const envId = process.env.TCB_ENV_ID || 'sjy-d0gxtaklr8e1be761'
const region = process.env.TCB_REGION || 'ap-shanghai'
const serverKey = process.env.TCB_SERVER_KEY

if (!serverKey) {
  console.error('❌ 错误：未配置 TCB_SERVER_KEY 环境变量')
  console.error('请复制 .env.example 为 .env 并填入 Server Key')
  process.exit(1)
}

// 使用 Server Key 初始化 CloudBase（管理员权限）
export const app = cloudbase.init({
  env: envId,
  region,
  accessKey: serverKey,
})

// 数据库实例
export const db = app.database()

// 云存储实例
export const storage = app.storage()

// 云函数实例
export const functions = app.functions()

// 认证实例
export const auth = app.auth()

// 导出配置信息
export const cloudbaseConfig = {
  envId,
  region,
  hasServerKey: !!serverKey,
}

console.log('✅ CloudBase 已初始化（Server Key 模式）')
console.log(`   环境: ${envId}`)
console.log(`   地域: ${region}`)
