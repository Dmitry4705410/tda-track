import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import Store from 'electron-store'
import icon from '../../resources/icon.png?asset'

const isDev = process.env.NODE_ENV === 'development'
const store = new Store()

function setupAutoUpdater(mainWindow: BrowserWindow): void {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  if (isDev) {
    autoUpdater.forceDevUpdateConfig = true
  }

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', info)
  })
  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded')
  })
  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('update-progress', progress)
  })
  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('update-error', err.message)
  })

  autoUpdater.checkForUpdates()
}

function setupIpcHandlers(): void {
  ipcMain.handle('store-get', (_, key: string) => store.get(key))
  ipcMain.handle('store-set', (_, key: string, value: unknown) => {
    store.set(key, value)

    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('store-changed', { key, value })
    }

    return true
  })

  ipcMain.handle('open-external', (_, url: string) => shell.openExternal(url))
  ipcMain.handle('update-download', () => autoUpdater.downloadUpdate())
  ipcMain.handle('update-install', () => autoUpdater.quitAndInstall())
}

function createFloatWindow(): BrowserWindow {
  const floatWindow = new BrowserWindow({
    width: 200,
    height: 150,
    resizable: false,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    icon,
    webPreferences: {
      webSecurity: false,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    floatWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/float.html`)
    // floatWindow.webContents.openDevTools()
  } else {
    floatWindow.loadFile(join(__dirname, '../renderer/float.html'))
  }

  return floatWindow
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 450,
    height: 650,
    resizable: false,
    show: false,
    frame: false,
    transparent: true,
    icon,
    webPreferences: {
      webSecurity: false,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  const floatWindow = createFloatWindow()

  mainWindow.on('ready-to-show', () => mainWindow.show())
  mainWindow.on('minimize', () => {
    floatWindow.show()
  })
  mainWindow.on('restore', () => {
    floatWindow.hide()
  })
  mainWindow.on('close', () => {
    floatWindow.destroy()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    // mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  ipcMain.on('window:minimize', () => mainWindow.minimize())
  ipcMain.on('window:close', () => mainWindow.close())

  setupAutoUpdater(mainWindow)
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.tda.track')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  setupIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
