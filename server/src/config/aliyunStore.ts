/**
 * Alibaba Cloud OSS-backed data store
 * Replaces localStore.ts and Tencent CloudBase
 *
 * All collection data is stored as a single JSON file on OSS.
 * Compatibility: same exported interface as localStore.ts
 */

import OSS from 'ali-oss'

type CollectionStore = Record<string, Record<string, any>>

// ─── Configuration ─────────────────────────────────

const OSS_REGION = process.env.ALIYUN_OSS_REGION || 'oss-cn-shanghai'
const OSS_BUCKET = process.env.ALIYUN_OSS_BUCKET || 'jinbang-sync'
const OSS_KEY = process.env.ALIYUN_OSS_KEY || 'sync-store.json'
const ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID || ''
const ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET || ''

// Fallback local path when OSS is not configured
const FALLBACK_PATH = process.env.SYNC_STORE_PATH || ''

let ossClient: OSS | null = null
let cache: CollectionStore | null = null
let writeQueue = Promise.resolve()
let ossConfigured = false

function initOSS(): boolean {
  if (ossClient) return true
  if (!ACCESS_KEY_ID || !ACCESS_KEY_SECRET) return false

  try {
    ossClient = new OSS({
      region: OSS_REGION,
      bucket: OSS_BUCKET,
      accessKeyId: ACCESS_KEY_ID,
      accessKeySecret: ACCESS_KEY_SECRET,
      secure: true,
    })
    ossConfigured = true
    return true
  } catch (error) {
    console.warn('[aliyunStore] Failed to initialize OSS client:', error)
    return false
  }
}

export function checkOSSConfig() {
  return {
    configured: ossConfigured || initOSS(),
    region: OSS_REGION,
    bucket: OSS_BUCKET,
    key: OSS_KEY,
  }
}

// ─── Load / Save helpers ──────────────────────────

async function loadFromOSS(): Promise<CollectionStore | null> {
  if (!initOSS()) return null
  try {
    const result = await ossClient!.get(OSS_KEY)
    if (!result.content) return null
    const text = result.content.toString('utf8')
    return JSON.parse(text) as CollectionStore
  } catch (error: any) {
    if (error.code === 'NoSuchKey' || error.status === 404) {
      return {}
    }
    console.warn('[aliyunStore] OSS load failed, falling back:', error.message)
    return null
  }
}

async function loadFromLocal(): Promise<CollectionStore> {
  try {
    const { promises: fs } = await import('fs')
    const text = await fs.readFile(FALLBACK_PATH, 'utf8')
    return JSON.parse(text) as CollectionStore
  } catch {
    return {}
  }
}

async function saveToOSS(store: CollectionStore): Promise<boolean> {
  if (!initOSS()) return false
  try {
    const json = JSON.stringify(store)
    await ossClient!.put(OSS_KEY, Buffer.from(json, 'utf8'))
    return true
  } catch (error) {
    console.warn('[aliyunStore] OSS save failed:', error)
    return false
  }
}

async function saveToLocal(store: CollectionStore): Promise<void> {
  const { promises: fs } = await import('fs')
  const path = await import('path')
  const dir = path.default.dirname(FALLBACK_PATH)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(FALLBACK_PATH, JSON.stringify(store, null, 2), 'utf8')
}

// ─── Public API ───────────────────────────────────

async function ensureStore(): Promise<CollectionStore> {
  if (cache) return cache

  let store: CollectionStore | null = null

  if (FALLBACK_PATH) {
    store = await loadFromLocal()
  }

  if (!store || Object.keys(store).length === 0) {
    store = await loadFromOSS()
  }

  if (!store) {
    store = {}
  }

  cache = store
  return cache
}

async function persist(store: CollectionStore) {
  writeQueue = writeQueue.then(async () => {
    let ossOk = false
    if (ossConfigured || initOSS()) {
      ossOk = await saveToOSS(store)
    }
    if (!ossOk && FALLBACK_PATH) {
      await saveToLocal(store)
    }
  })
  return writeQueue
}

export async function listDocuments(collection: string) {
  const store = await ensureStore()
  return Object.values(store[collection] || {})
}

export async function getDocument(collection: string, id: string) {
  const store = await ensureStore()
  return store[collection]?.[id] || null
}

export async function setDocument(collection: string, id: string, data: Record<string, any>) {
  const store = await ensureStore()
  if (!store[collection]) store[collection] = {}
  store[collection][id] = data
  await persist(store)
  return data
}

export async function removeDocument(collection: string, id: string) {
  const store = await ensureStore()
  if (store[collection]) delete store[collection][id]
  await persist(store)
}
