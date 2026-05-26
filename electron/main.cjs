const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const net = require('net')

const isDev = !app.isPackaged
let mainWindow = null
let syncServerStarted = false

function getIndexPath() {
  return isDev
    ? path.join(__dirname, '../dist/index.html')
    : path.join(app.getAppPath(), 'dist/index.html')
}

function loadErrorPage(win, message, detail = '') {
  const escapedMessage = String(message).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]))
  const escapedDetail = String(detail).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]))
  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>晋梆智绎加载失败</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #090405; color: #f8e8c8; font-family: "Microsoft YaHei", system-ui, sans-serif; }
    main { width: min(560px, calc(100vw - 48px)); border: 1px solid rgba(255,255,255,.14); border-radius: 24px; padding: 28px; background: rgba(255,255,255,.07); box-shadow: 0 20px 80px rgba(0,0,0,.45); }
    h1 { margin: 0 0 12px; font-size: 24px; }
    p { margin: 8px 0; color: rgba(248,232,200,.72); line-height: 1.7; }
    code { display: block; margin-top: 14px; padding: 12px; overflow: auto; color: #ffd37a; background: rgba(0,0,0,.32); border-radius: 12px; font-size: 12px; }
  </style>
</head>
<body>
  <main>
    <h1>应用页面加载失败</h1>
    <p>${escapedMessage}</p>
    ${escapedDetail ? `<code>${escapedDetail}</code>` : ''}
  </main>
</body>
</html>`)}`)
}

async function loadApp(win) {
  const indexPath = getIndexPath()

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000'
    const devPort = new URL(devUrl).port || '80'
    if (await isPortListening(devPort)) {
      await win.loadURL(devUrl)
      return
    }
    if (fs.existsSync(indexPath)) {
      console.warn('[app] dev server unavailable, loading built app:', indexPath)
      await win.loadFile(indexPath)
      return
    }
    loadErrorPage(win, '开发服务未启动，且未找到 dist/index.html。请先运行 npm run dev，或运行 npm run build 后再启动桌面应用。', `Missing: ${indexPath}`)
    return
  }

  if (!fs.existsSync(indexPath)) {
    loadErrorPage(win, '打包应用缺少前端入口文件。请重新执行 npm run build:electron。', `Missing: ${indexPath}`)
    return
  }

  await win.loadFile(indexPath)
}

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

async function createWindow() {
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

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame === false || errorCode === -3) return
    console.error('[app] failed to load:', errorCode, errorDescription, validatedURL)
    loadErrorPage(win, '页面资源加载失败。', `${errorCode} ${errorDescription}\n${validatedURL || ''}`)
  })
  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('[app] render process gone:', details)
    loadErrorPage(win, '渲染进程异常退出，请重新启动应用。', JSON.stringify(details, null, 2))
  })

  try {
    await loadApp(win)
  } catch (error) {
    console.error('[app] load failed:', error)
    loadErrorPage(win, '应用启动时发生异常。', error?.stack || error?.message || String(error))
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
  await createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
