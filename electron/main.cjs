const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const net = require('net')

const isDev = !app.isPackaged
let mainWindow = null
let syncServerStarted = false

function isPortListening(port) {
  return new Promise(resolve => {
    const socket = net.createConnection({ host: '127.0.0.1', port: Number(port) })
    socket.setTimeout(500)
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => resolve(false))
  })
}

async function startSyncServer() {
  if (syncServerStarted || process.env.JINBANG_DISABLE_SYNC_SERVER === '1') return
  const port = process.env.PORT || '3001'

  if (await isPortListening(port)) {
    console.log('[sync-server] reusing existing server on port', port)
    syncServerStarted = true
    return
  }

  const serverEntry = isDev
    ? path.join(__dirname, '../server/dist/index.js')
    : path.join(process.resourcesPath, 'server/dist/index.js')

  if (!fs.existsSync(serverEntry)) {
    console.warn('[sync-server] server entry not found:', serverEntry)
    return
  }

  process.env.PORT = port
  process.env.SYNC_STORE_PATH = process.env.SYNC_STORE_PATH || path.join(app.getPath('userData'), 'sync-store.json')

  try {
    require(serverEntry)
    syncServerStarted = true
    console.log('[sync-server] started on port', port)
  } catch (error) {
    console.error('[sync-server] failed to start:', error)
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    frame: false,
    backgroundColor: '#090405',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  })
  mainWindow = win

  if (isDev) {
    win.loadURL('http://localhost:3000')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })
}

ipcMain.on('window-minimize', () => mainWindow?.minimize())
ipcMain.on('window-maximize', () => {
  if (!mainWindow) return
  if (mainWindow.isMaximized()) mainWindow.unmaximize()
  else mainWindow.maximize()
})
ipcMain.on('window-close', () => mainWindow?.close())

app.whenReady().then(async () => {
  await startSyncServer()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
