import db from '../db'
import type { DbHanfuItem, DbOrder, DbProduct, DbRentalOrder } from '../db'

export async function getHanfuItems(): Promise<DbHanfuItem[]> {
  return db.hanfuItems.toArray()
}

export async function addHanfuItem(item: DbHanfuItem): Promise<void> {
  await db.hanfuItems.put(item)
}

export async function updateHanfuItem(id: string, updates: Partial<DbHanfuItem>): Promise<void> {
  await db.hanfuItems.update(id, updates)
}

export async function seedHanfuItemsIfEmpty(items: DbHanfuItem[]): Promise<void> {
  const count = await db.hanfuItems.count()
  if (count === 0 && items.length > 0) {
    await db.hanfuItems.bulkPut(items)
  }
}

export async function getRentalOrders(accountId?: string): Promise<DbRentalOrder[]> {
  if (accountId) return db.rentalOrders.where('accountId').equals(accountId).toArray()
  return db.rentalOrders.toArray()
}

export async function placeRentalOrder(order: DbRentalOrder): Promise<void> {
  await db.rentalOrders.put(order)
}

export async function updateRentalOrder(id: string, updates: Partial<DbRentalOrder>): Promise<void> {
  await db.rentalOrders.update(id, updates)
}

export async function updateRentalOrderStatus(id: string, status: DbRentalOrder['status'], returnedAt?: string): Promise<void> {
  const updates: Partial<DbRentalOrder> = { status }
  if (returnedAt) updates.returnedAt = returnedAt
  await updateRentalOrder(id, updates)
}

export async function getProducts(): Promise<DbProduct[]> {
  return db.products.toArray()
}

export async function addProduct(product: DbProduct): Promise<void> {
  await db.products.put(product)
}

export async function updateProduct(id: string, updates: Partial<DbProduct>): Promise<void> {
  await db.products.update(id, updates)
}

export async function deleteProduct(id: string): Promise<void> {
  await db.products.delete(id)
}

export async function seedProductsIfEmpty(items: DbProduct[]): Promise<void> {
  const count = await db.products.count()
  if (count === 0 && items.length > 0) {
    await db.products.bulkPut(items)
  }
}

export async function getShopOrders(accountId?: string): Promise<DbOrder[]> {
  if (accountId) return db.orders.where('accountId').equals(accountId).toArray()
  return db.orders.toArray()
}

export async function placeShopOrder(order: DbOrder): Promise<void> {
  await db.orders.put(order)
}

export function saveCache(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data))
}

export function loadCache<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) as T : fallback
  } catch {
    return fallback
  }
}
