import { crudApi } from './cloudFunctions'
import db from '../db'

export interface SyncProgress {
  collection: string
  current: number
  total: number
  status: 'pending' | 'syncing' | 'success' | 'error'
  message?: string
}

export interface SyncResult {
  success: boolean
  collection: string
  total: number
  successCount: number
  failCount: number
  errors: Array<{ id: string; error: string }>
  duration: number
}

export interface SyncAllResult {
  overallSuccess: boolean
  results: SyncResult[]
  totalDuration: number
  summary: {
    totalRecords: number
    successRecords: number
    failRecords: number
  }
}

export type ProgressCallback = (progress: SyncProgress) => void

const SYNC_BATCH_SIZE = 50

interface SyncConfig {
  collection: string
  getData: () => Promise<any[]>
  transform?: (item: any) => Record<string, any>
}

const syncConfigs: SyncConfig[] = [
  {
    collection: 'products',
    getData: () => db.products.toArray(),
  },
  {
    collection: 'hanfuItems',
    getData: () => db.hanfuItems.toArray(),
  },
  {
    collection: 'orders',
    getData: () => db.orders.toArray(),
  },
  {
    collection: 'rentalOrders',
    getData: () => db.rentalOrders.toArray(),
  },
  {
    collection: 'users',
    getData: async () => {
      const accounts = await db.accounts.toArray()
      return accounts.map(acc => ({
        id: acc.id,
        username: acc.username,
        displayName: acc.displayName,
        email: acc.email,
        phone: acc.phone,
        avatar: acc.avatar,
        role: acc.role,
        createdAt: acc.createdAt,
        lastLoginAt: acc.lastLoginAt,
      }))
    },
  },
  {
    collection: 'favorites',
    getData: () => db.favorites.toArray(),
  },
]

export async function syncCollectionToCloud(
  config: SyncConfig,
  onProgress?: ProgressCallback,
): Promise<SyncResult> {
  const startTime = Date.now()
  const { collection, getData, transform } = config

  onProgress?.({
    collection,
    current: 0,
    total: 0,
    status: 'syncing',
    message: 'Reading local data...',
  })

  try {
    const localData = await getData()
    const total = localData.length

    if (total === 0) {
      return {
        success: true,
        collection,
        total: 0,
        successCount: 0,
        failCount: 0,
        errors: [],
        duration: Date.now() - startTime,
      }
    }

    onProgress?.({
      collection,
      current: 0,
      total,
      status: 'syncing',
      message: `Found ${total} records, starting server sync...`,
    })

    const errors: Array<{ id: string; error: string }> = []
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < total; i += SYNC_BATCH_SIZE) {
      const batch = localData.slice(i, i + SYNC_BATCH_SIZE)
      const batchNum = Math.floor(i / SYNC_BATCH_SIZE) + 1
      const totalBatches = Math.ceil(total / SYNC_BATCH_SIZE)

      onProgress?.({
        collection,
        current: i,
        total,
        status: 'syncing',
        message: `Syncing batch ${batchNum}/${totalBatches} (${batch.length} records)...`,
      })

      const transformedBatch = batch.map(item => {
        const value = transform ? transform(item) : item
        return {
          ...value,
          id: String(value.id),
        }
      })

      const result = await crudApi.batchCreate(collection, transformedBatch)

      if (result.code === 0) {
        successCount += transformedBatch.length
      } else {
        for (const item of transformedBatch) {
          try {
            const singleResult = await crudApi.create(collection, item)
            if (singleResult.code === 0) {
              successCount++
            } else {
              failCount++
              errors.push({ id: item.id, error: singleResult.message || 'Create failed' })
            }
          } catch (error: any) {
            failCount++
            errors.push({ id: item.id, error: error.message || 'Unknown error' })
          }
        }
      }

      onProgress?.({
        collection,
        current: Math.min(i + SYNC_BATCH_SIZE, total),
        total,
        status: 'syncing',
        message: `Synced ${Math.min(i + SYNC_BATCH_SIZE, total)}/${total} records`,
      })

      if (i + SYNC_BATCH_SIZE < total) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    const success = failCount === 0
    onProgress?.({
      collection,
      current: total,
      total,
      status: success ? 'success' : 'error',
      message: success
        ? `Server sync complete: ${successCount} records succeeded`
        : `Server sync complete: ${successCount} succeeded, ${failCount} failed`,
    })

    return {
      success,
      collection,
      total,
      successCount,
      failCount,
      errors: errors.slice(0, 10),
      duration: Date.now() - startTime,
    }
  } catch (error: any) {
    onProgress?.({
      collection,
      current: 0,
      total: 0,
      status: 'error',
      message: `Server sync failed: ${error.message}`,
    })

    return {
      success: false,
      collection,
      total: 0,
      successCount: 0,
      failCount: 0,
      errors: [{ id: 'global', error: error.message }],
      duration: Date.now() - startTime,
    }
  }
}

export async function syncAllToCloud(
  onProgress?: ProgressCallback,
  onCollectionComplete?: (result: SyncResult) => void,
): Promise<SyncAllResult> {
  const startTime = Date.now()
  const results: SyncResult[] = []

  for (const config of syncConfigs) {
    const result = await syncCollectionToCloud(config, onProgress)
    results.push(result)
    onCollectionComplete?.(result)
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  const totalRecords = results.reduce((sum, r) => sum + r.total, 0)
  const successRecords = results.reduce((sum, r) => sum + r.successCount, 0)
  const failRecords = results.reduce((sum, r) => sum + r.failCount, 0)

  return {
    overallSuccess: results.every(r => r.success),
    results,
    totalDuration: Date.now() - startTime,
    summary: {
      totalRecords,
      successRecords,
      failRecords,
    },
  }
}

export async function syncSpecificCollections(
  collectionNames: string[],
  onProgress?: ProgressCallback,
): Promise<SyncAllResult> {
  const startTime = Date.now()
  const results: SyncResult[] = []
  const configs = syncConfigs.filter(c => collectionNames.includes(c.collection))

  for (const config of configs) {
    const result = await syncCollectionToCloud(config, onProgress)
    results.push(result)
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  const totalRecords = results.reduce((sum, r) => sum + r.total, 0)
  const successRecords = results.reduce((sum, r) => sum + r.successCount, 0)
  const failRecords = results.reduce((sum, r) => sum + r.failCount, 0)

  return {
    overallSuccess: results.every(r => r.success),
    results,
    totalDuration: Date.now() - startTime,
    summary: {
      totalRecords,
      successRecords,
      failRecords,
    },
  }
}

export async function getLocalStats(): Promise<Record<string, number>> {
  const [products, hanfuItems, orders, rentalOrders, accounts, favorites] = await Promise.all([
    db.products.count(),
    db.hanfuItems.count(),
    db.orders.count(),
    db.rentalOrders.count(),
    db.accounts.count(),
    db.favorites.count(),
  ])

  return {
    products,
    hanfuItems,
    orders,
    rentalOrders,
    users: accounts,
    favorites,
  }
}

export default syncAllToCloud
