import cloudbase from '@cloudbase/node-sdk'

const envId = process.env.TCB_ENV_ID || 'sjy-d0gxtaklr8e1be761'
const region = process.env.TCB_REGION || 'ap-shanghai'
const serverKey = process.env.TCB_SERVER_KEY

let app: any = null
let db: any = null
let storage: any = null
let functions: any = null
let auth: any = null

if (serverKey) {
  app = cloudbase.init({
    env: envId,
    region,
    accessKey: serverKey,
  })
  db = app.database()
  storage = app.storage()
  functions = app.functions()
  auth = app.auth()

  console.log('CloudBase initialized for optional legacy routes')
  console.log(`   env: ${envId}`)
  console.log(`   region: ${region}`)
} else {
  console.warn('TCB_SERVER_KEY is not configured; legacy CloudBase routes are disabled.')
}

export { app, db, storage, functions, auth }

export const cloudbaseConfig = {
  envId,
  region,
  hasServerKey: !!serverKey,
  enabled: !!serverKey,
}
