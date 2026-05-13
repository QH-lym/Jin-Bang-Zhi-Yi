import { promises as fs } from 'fs'
import path from 'path'

type CollectionStore = Record<string, Record<string, any>>

const STORE_PATH = process.env.SYNC_STORE_PATH || path.resolve(process.cwd(), 'data', 'sync-store.json')

let cache: CollectionStore | null = null
let writeQueue = Promise.resolve()

async function ensureStore(): Promise<CollectionStore> {
  if (cache) return cache

  try {
    const text = await fs.readFile(STORE_PATH, 'utf8')
    cache = JSON.parse(text) as CollectionStore
  } catch (error: any) {
    if (error.code !== 'ENOENT') throw error
    cache = {}
  }

  return cache
}

async function persist(store: CollectionStore) {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true })
    await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
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
