// ═══════════════════════════════════════════════
//  云函数：用户认证 (auth)
// ═══════════════════════════════════════════════
//  路由 action:
//    register   — 注册
//    login      — 登录（用户名+密码）
//    anonymous  — 匿名登录
//    profile    — 获取/更新用户资料
//    list       — 获取用户列表（管理员）
//    setRole    — 设置用户角色（管理员）
//    remove     — 删除用户（管理员）

const cloudbase = require('@cloudbase/node-sdk')
const { success, fail, requireParams, queryDocs, getDocById, addDoc, updateDoc, removeDoc, countDocs } = require('../_shared/utils')

const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV })
const db = app.database()
const auth = app.auth()

// ─── 简易密码哈希（生产环境建议用 bcrypt） ───

async function hashPassword(pwd: string): Promise<string> {
  const crypto = await import('crypto')
  return crypto.createHash('sha256').update(pwd + '_sjy_salt_2024').digest('hex')
}

async function verifyPassword(pwd: string, hash: string): Promise<boolean> {
  return (await hashPassword(pwd)) === hash
}

// ─── 生成简易 Token ─────────────────────────

async function generateToken(userId: string): Promise<string> {
  const crypto = await import('crypto')
  const payload = JSON.stringify({
    uid: userId,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 天
  })
  return crypto.createHash('sha256').update(payload + '_sjy_token_secret').digest('hex')
}

// ─── 主入口 ─────────────────────────────────

exports.main = async (event: any, context: any) => {
  const { action } = event

  try {
    switch (action) {
      // ── 注册 ──
      case 'register': {
        const err = requireParams(event, 'username', 'password')
        if (err) return err

        const { username, password, displayName, email, phone, avatar } = event

        // 检查用户名是否已存在
        const existing = await queryDocs('users', {
          condition: { username },
          limit: 1,
        })
        if (existing.length > 0) {
          return fail('用户名已存在', 409)
        }

        const hashedPwd = await hashPassword(password)
        const userId = await addDoc('users', {
          username,
          password: hashedPwd,
          displayName: displayName || username,
          email: email || '',
          phone: phone || '',
          avatar: avatar || '',
          role: 'user',
          status: 'active',
          lastLoginAt: new Date().toISOString(),
        })

        return success({ userId, username }, '注册成功')
      }

      // ── 登录 ──
      case 'login': {
        const err = requireParams(event, 'username', 'password')
        if (err) return err

        const { username, password } = event

        const users = await queryDocs('users', {
          condition: { username },
          limit: 1,
        })
        if (users.length === 0) {
          return fail('用户名或密码错误', 401)
        }

        const user = users[0]
        if (user.status === 'disabled') {
          return fail('账号已被禁用', 403)
        }

        const valid = await verifyPassword(password, user.password)
        if (!valid) {
          return fail('用户名或密码错误', 401)
        }

        // 更新最后登录时间
        await updateDoc('users', user._id, { lastLoginAt: new Date().toISOString() })

        const token = await generateToken(user._id)

        return success({
          token,
          user: {
            id: user._id,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            role: user.role,
          },
        }, '登录成功')
      }

      // ── 匿名登录 ──
      case 'anonymous': {
        const loginResult = await auth.anonymousAuthProvider().signIn()
        return success({
          uid: loginResult.uid,
          token: loginResult.token,
        }, '匿名登录成功')
      }

      // ── 获取/更新用户资料 ──
      case 'profile': {
        const { userId, updates } = event
        if (!userId) return fail('缺少 userId')

        if (updates && Object.keys(updates).length > 0) {
          // 不允许直接更新的字段
          const forbidden = ['password', 'role', 'status', 'createdAt']
          for (const key of forbidden) {
            if (key in updates) delete updates[key]
          }
          await updateDoc('users', userId, updates)
        }

        const user = await getDocById('users', userId)
        if (!user) return fail('用户不存在', 404)

        // 返回脱敏信息
        const { password: _, ...safeUser } = user
        return success(safeUser)
      }

      // ── 用户列表（管理员） ──
      case 'list': {
        const { page = 1, pageSize = 20, keyword, role } = event

        let condition: any = {}
        if (keyword) {
          condition = db.command.or([
            { username: db.RegExp({ regexp: keyword, options: 'i' }) },
            { displayName: db.RegExp({ regexp: keyword, options: 'i' }) },
          ])
        }
        if (role) {
          condition.role = role
        }

        const [users, total] = await Promise.all([
          queryDocs('users', {
            condition,
            orderBy: 'createdAt',
            order: 'desc',
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          countDocs('users', condition),
        ])

        // 脱敏
        const safeUsers = users.map(({ password: _, ...u }: any) => u)

        return success({
          list: safeUsers,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        })
      }

      // ── 设置用户角色（管理员） ──
      case 'setRole': {
        const err = requireParams(event, 'userId', 'role')
        if (err) return err

        const { userId, role } = event
        if (!['admin', 'user'].includes(role)) {
          return fail('无效的角色', 400)
        }

        const ok = await updateDoc('users', userId, { role })
        return ok ? success(null, '角色更新成功') : fail('角色更新失败')
      }

      // ── 删除用户（管理员） ──
      case 'remove': {
        const err = requireParams(event, 'userId')
        if (err) return err

        const ok = await removeDoc('users', event.userId)
        return ok ? success(null, '用户已删除') : fail('删除失败')
      }

      default:
        return fail(`未知 action: ${action}`, 400)
    }
  } catch (error: any) {
    console.error('[auth] 错误:', error)
    return fail(`服务器错误: ${error.message}`, 500)
  }
}
