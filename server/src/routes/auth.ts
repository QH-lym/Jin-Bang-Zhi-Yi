// ═══════════════════════════════════════════════
//  认证路由
// ═══════════════════════════════════════════════

import { Router } from 'express'
import { auth, db } from '../config/cloudbase'

const router = Router()
const _ = db.command

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码必填' })
    }

    // 检查用户是否已存在
    const { data: existing } = await db.collection('users')
      .where({ username })
      .limit(1)
      .get()

    if (existing.length > 0) {
      return res.status(409).json({ code: 409, message: '用户名已存在' })
    }

    // 创建用户（使用 Server Key 权限）
    const result = await db.collection('users').add({
      username,
      password, // 生产环境应哈希处理
      displayName: displayName || username,
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    res.json({ code: 0, message: '注册成功', data: { userId: result.id } })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码必填' })
    }

    const { data: users } = await db.collection('users')
      .where({ username, password }) // 生产环境应比对哈希
      .limit(1)
      .get()

    if (users.length === 0) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' })
    }

    const user = users[0]
    
    // 更新最后登录时间
    await db.collection('users').doc(user._id).update({
      lastLoginAt: new Date().toISOString(),
    })

    // 脱敏返回
    const { password: _, ...safeUser } = user

    res.json({
      code: 0,
      message: '登录成功',
      data: {
        user: safeUser,
        token: 'jwt-token-placeholder', // 实际应生成 JWT
      },
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

// 获取用户列表（管理员功能，展示 Server Key 权限）
router.get('/users', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query

    const { data: users, total } = await db.collection('users')
      .skip((Number(page) - 1) * Number(pageSize))
      .limit(Number(pageSize))
      .orderBy('createdAt', 'desc')
      .get()

    // 脱敏
    const safeUsers = users.map((u: any) => {
      const { password, ...rest } = u
      return rest
    })

    res.json({
      code: 0,
      data: {
        list: safeUsers,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message })
  }
})

export default router
