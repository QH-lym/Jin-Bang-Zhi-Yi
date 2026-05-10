import { loginPromise, getDb } from './cloudbase'

// ═══════════════════════════════════════════════
//  类型定义
// ═══════════════════════════════════════════════

export interface CloudDanmu {
  id?: string | number
  text: string
  user?: string
  author?: string
  color?: string
  position?: 'top' | 'bottom' | 'middle'
  top?: number
  delay?: number
  tone?: string
  createdAt?: string
}

export interface CloudOrder {
  id: string
  product: string
  buyer: string
  phone?: string
  address?: string
  amount: number
  status: string
  createdAt?: string
}

export interface CloudRentalOrder {
  id: string
  hanfuName: string
  renter: string
  phone?: string
  startDate?: string
  endDate?: string
  amount: number
  status: string
  createdAt?: string
}

export interface CloudUser {
  id: string
  username?: string
  email?: string
  phone?: string
  avatar?: string
  createdAt?: string
}

// ═══════════════════════════════════════════════
//  弹幕同步（先插入新数据再删除旧数据，防丢失）
// ═══════════════════════════════════════════════

export async function syncDanmuToCloud(danmu: CloudDanmu[]): Promise<boolean> {
  try {
    await loginPromise
    const collection = getDb().collection('danmu')
    
    // 方案：用一个固定 _id 的文档存储所有弹幕，upsert 模式
    await collection.add([{
      _id: 'danmu_list',
      items: danmu,
      updatedAt: new Date().toISOString(),
    }])
    return true
  } catch (err) {
    console.error('[Cloud] 同步弹幕失败:', err)
    return false
  }
}

export async function loadDanmuFromCloud(): Promise<CloudDanmu[]> {
  try {
    await loginPromise
    const collection = getDb().collection('danmu')
    const result: any = await collection.doc('danmu_list').get()
    return (result.data && result.data.items) || []
  } catch (err) {
    console.error('[Cloud] 加载弹幕失败:', err)
    return []
  }
}

// ═══════════════════════════════════════════════
//  订单同步
// ═══════════════════════════════════════════════

export async function syncOrderToCloud(order: CloudOrder): Promise<boolean> {
  try {
    await loginPromise
    const collection = getDb().collection('orders')
    await collection.add({
      ...order,
      createdAt: order.createdAt || new Date().toISOString(),
    })
    return true
  } catch (err) {
    console.error('[Cloud] 同步订单失败:', err)
    return false
  }
}

export async function syncRentalOrderToCloud(order: CloudRentalOrder): Promise<boolean> {
  try {
    await loginPromise
    const collection = getDb().collection('rentalOrders')
    await collection.add({
      ...order,
      createdAt: order.createdAt || new Date().toISOString(),
    })
    return true
  } catch (err) {
    console.error('[Cloud] 同步租赁订单失败:', err)
    return false
  }
}

// ═══════════════════════════════════════════════
//  收藏同步（使用 upsert 模式，避免竞态）
// ═══════════════════════════════════════════════

export async function syncFavoritesToCloud(accountId: string, productIds: string[]): Promise<boolean> {
  try {
    await loginPromise
    const collection = getDb().collection('favorites')
    // 先查询是否已有记录
    const existing = await collection.where({ accountId }).limit(1).get()
    if (existing.data && existing.data.length > 0) {
      // 更新已有记录
      await collection.where({ accountId }).update({
        productIds,
        updatedAt: new Date().toISOString(),
      })
    } else {
      // 创建新记录
      await collection.add({
        accountId,
        productIds,
        updatedAt: new Date().toISOString(),
      })
    }
    return true
  } catch (err) {
    console.error('[Cloud] 同步收藏失败:', err)
    return false
  }
}

export async function loadFavoritesFromCloud(accountId: string): Promise<string[]> {
  try {
    await loginPromise
    const collection = getDb().collection('favorites')
    const result = await collection.where({ accountId }).limit(1).get()
    if (result.data && result.data.length > 0) {
      return (result.data[0].productIds as string[]) || []
    }
    return []
  } catch (err) {
    console.error('[Cloud] 加载收藏失败:', err)
    return []
  }
}

// ═══════════════════════════════════════════════
//  用户同步
// ═══════════════════════════════════════════════

export async function syncUserToCloud(user: CloudUser): Promise<boolean> {
  try {
    await loginPromise
    const collection = getDb().collection('users')
    // 用 upsert 模式
    const existing = await collection.where({ id: user.id }).limit(1).get()
    if (existing.data && existing.data.length > 0) {
      await collection.where({ id: user.id }).update({
        ...user,
        updatedAt: new Date().toISOString(),
      })
    } else {
      await collection.add({
        ...user,
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    return true
  } catch (err) {
    console.error('[Cloud] 同步用户失败:', err)
    return false
  }
}

export async function loadUserFromCloud(userId: string): Promise<CloudUser | null> {
  try {
    await loginPromise
    const collection = getDb().collection('users')
    const result = await collection.where({ id: userId }).limit(1).get()
    return (result.data && result.data.length > 0) ? result.data[0] as CloudUser : null
  } catch (err) {
    console.error('[Cloud] 加载用户失败:', err)
    return null
  }
}

// ═══════════════════════════════════════════════
//  全量同步（一键将所有数据推送到腾讯云）
// ═══════════════════════════════════════════════

export async function syncAllToCloud(): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {}
  
  // 同步弹幕
  const cachedDanmu = (window as any).__LOCAL_DANMU__
  if (cachedDanmu && cachedDanmu.length > 0) {
    results.danmu = await syncDanmuToCloud(cachedDanmu)
  } else {
    results.danmu = false
    console.warn('[Cloud] 暂无弹幕数据可同步')
  }
  
  // 同步订单
  const shopOrders = JSON.parse(localStorage.getItem('jh_orders') || '[]')
  for (const o of shopOrders) {
    results[`order_${o.orderNo}`] = await syncOrderToCloud({
      id: o.orderNo,
      product: o.product || '商品',
      buyer: o.recip || '用户',
      phone: o.phone,
      address: o.address,
      amount: o.total || 0,
      status: 'paid',
      createdAt: o.createdAt,
    })
  }
  
  // 同步租赁订单
  const { loadOrders } = await import('../data/hanfuData')
  const rentalOrders = loadOrders()
  for (const o of rentalOrders) {
    results[`rental_${o.id}`] = await syncRentalOrderToCloud({
      id: o.id,
      hanfuName: o.items?.map((i: any) => i.name).join(', ') || '汉服',
      renter: o.renter?.name || '用户',
      phone: o.renter?.phone,
      startDate: (o as any).rentStart || (o as any).rentStart,
      endDate: (o as any).rentEnd || (o as any).rentEnd,
      amount: (o as any).grandTotal || 0,
      status: (o as any).status || 'pending_pickup',
      createdAt: (o as any).createTime || (o as any).createTime,
    })
  }

  // 同步收藏
  const accounts = JSON.parse(localStorage.getItem('jh_accounts') || '[]')
  for (const acc of accounts) {
    const favs = (window as any).__LOCAL_FAVORITES__
    if (favs) {
      results[`fav_${acc.id}`] = await syncFavoritesToCloud(acc.id, favs[acc.id] || [])
    }
  }
  
  // 同步用户
  for (const acc of accounts) {
    results[`user_${acc.id}`] = await syncUserToCloud({
      id: acc.id,
      username: acc.username,
      email: acc.email,
      phone: acc.phone,
      avatar: acc.avatar,
      createdAt: acc.createdAt,
    })
  }
  
  return results
}
