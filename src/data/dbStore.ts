import db from '../db'
import type { DbHanfuItem, DbRentalOrder, DbProduct, DbOrder } from '../db'

// ═══════════════════════════════════════════════
// 汉服数据  read/write
// ═══════════════════════════════════════════════

export async function getHanfuItems(): Promise<DbHanfuItem[]> {
  return db.hanfuItems.toArray()
}

export async function addHanfuItem(item: DbHanfuItem): Promise<void> {
  await db.hanfuItems.add(item)
}

export async function updateHanfuItem(id: string, updates: Partial<DbHanfuItem>): Promise<void> {
  await db.hanfuItems.update(id, updates)
}

/** 如果 Dexie 中汉服表为空，则从静态数据导入 */
export async function seedHanfuItemsIfEmpty(items: DbHanfuItem[]): Promise<void> {
  const count = await db.hanfuItems.count()
  if (count === 0 && items.length > 0) {
    await db.hanfuItems.bulkAdd(items)
  }
}

// ═══════════════════════════════════════════════
// 租赁订单
// ═══════════════════════════════════════════════

export async function getRentalOrders(accountId?: string): Promise<DbRentalOrder[]> {
  if (accountId) return db.rentalOrders.where('accountId').equals(accountId).toArray()
  return db.rentalOrders.toArray()
}

export async function placeRentalOrder(order: DbRentalOrder): Promise<void> {
  await db.rentalOrders.add(order)
}

export async function updateRentalOrder(id: string, updates: Partial<DbRentalOrder>): Promise<void> {
  await db.rentalOrders.update(id, updates)
}

export async function updateRentalOrderStatus(id: string, status: DbRentalOrder['status'], returnedAt?: string): Promise<void> {
  const updates: Partial<DbRentalOrder> = { status }
  if (returnedAt) updates.returnedAt = returnedAt
  await db.rentalOrders.update(id, updates)
}

// ═══════════════════════════════════════════════
// 商城商品
// ═══════════════════════════════════════════════

export async function getProducts(): Promise<DbProduct[]> {
  return db.products.toArray()
}

export async function addProduct(product: DbProduct): Promise<void> {
  await db.products.add(product)
}

export async function updateProduct(id: string, updates: Partial<DbProduct>): Promise<void> {
  await db.products.update(id, updates)
}

export async function deleteProduct(id: string): Promise<void> {
  await db.products.delete(id)
}

/** 如果 Dexie 商品表为空，则从静态数据导入 */
export async function seedProductsIfEmpty(items: DbProduct[]): Promise<void> {
  const count = await db.products.count()
  if (count === 0 && items.length > 0) {
    await db.products.bulkAdd(items)
  }
}

// ═══════════════════════════════════════════════
// 商城订单
// ═══════════════════════════════════════════════

export async function getShopOrders(accountId?: string): Promise<DbOrder[]> {
  if (accountId) return db.orders.where('accountId').equals(accountId).toArray()
  return db.orders.toArray()
}

export async function placeShopOrder(order: DbOrder): Promise<void> {
  await db.orders.add(order)
}

// ═══════════════════════════════════════════════
// 本地缓存：Dexie → localStorage 同步
// ═══════════════════════════════════════════════

export function saveCache(key: string, data: any) {
  localStorage.setItem(key, JSON.stringify(data))
}

export function loadCache<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}
