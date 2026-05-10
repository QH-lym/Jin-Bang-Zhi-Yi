import db, { type DbAccount } from './db'

export type { DbAccount as Account }
export type AccountRole = 'admin' | 'user'

function hashPassword(pw: string): string {
  let masked = ''
  for (let i = 0; i < pw.length; i++) {
    masked += String.fromCharCode(pw.charCodeAt(i) ^ 0x2a)
  }
  return btoa(masked)
}

function normalize(v: string) { return v.trim().toLowerCase() }

export async function findAccount(identifier: string): Promise<DbAccount | undefined> {
  const key = normalize(identifier)
  return db.accounts
    .filter(a => normalize(a.username) === key || normalize(a.email) === key || normalize(a.phone) === key)
    .first()
}

export async function loginAccount(identifier: string, password: string): Promise<DbAccount | null> {
  const account = await findAccount(identifier)
  if (!account || account.password !== hashPassword(password)) return null
  await db.accounts.update(account.id, { lastLoginAt: new Date().toISOString() })
  return { ...account, lastLoginAt: new Date().toISOString() }
}

export async function registerAccount(input: {
  username: string
  displayName: string
  email: string
  phone: string
  password: string
}): Promise<DbAccount> {
  const username = input.username.trim()
  const email = input.email.trim()
  const phone = input.phone.trim()

  if (!username || !email || !phone || !input.password) throw new Error('请填写完整账户资料')

  const existing = await db.accounts
    .filter(a => normalize(a.username) === normalize(username) || normalize(a.email) === normalize(email) || normalize(a.phone) === normalize(phone))
    .first()
  if (existing) {
    if (normalize(existing.username) === normalize(username)) throw new Error('账号已存在')
    if (normalize(existing.email) === normalize(email)) throw new Error('邮箱已被注册')
    throw new Error('手机号已被注册')
  }

  const id = `user-${Date.now()}`
  const account: DbAccount = {
    id,
    username,
    displayName: input.displayName.trim() || username,
    email,
    phone,
    password: hashPassword(input.password),
    role: 'user',
    createdAt: new Date().toISOString(),
  }
  await db.accounts.add(account)
  return account
}

export async function resetAccountPassword(identifier: string, newPassword: string): Promise<void> {
  const account = await findAccount(identifier)
  if (!account) throw new Error('未找到账户')
  if (account.role === 'admin') throw new Error('管理员账号请使用默认密码登录')
  if (!newPassword.trim()) throw new Error('请填写新密码')
  await db.accounts.update(account.id, { password: hashPassword(newPassword) })
}

export async function getAccounts(): Promise<DbAccount[]> {
  try {
    return await db.accounts.toArray()
  } catch {
    return []
  }
}

export async function updateAccount(id: string, updates: Partial<Pick<DbAccount, 'displayName' | 'email' | 'phone' | 'avatar'>>): Promise<void> {
  const account = await db.accounts.get(id)
  if (!account) throw new Error('账户不存在')
  await db.accounts.update(id, updates)
}

export async function changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
  const account = await db.accounts.get(id)
  if (!account) throw new Error('账户不存在')
  if (account.password !== hashPassword(oldPassword)) throw new Error('原密码错误')
  if (!newPassword.trim()) throw new Error('新密码不能为空')
  await db.accounts.update(id, { password: hashPassword(newPassword) })
}

export async function updateAccountRole(id: string, role: 'admin' | 'user'): Promise<void> {
  await db.accounts.update(id, { role })
}

// Sync fallback for backward compat — returns empty (admin handled separately)
export function getAccountsSync(): DbAccount[] { return [] }
