import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  closeWindow: () => ipcRenderer.send('window:close'),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),

  getStore: (key: string) => ipcRenderer.invoke('store-get', key),
  setStore: (key: string, value: unknown) => ipcRenderer.invoke('store-set', key, value),
  onStoreChanged: (callback: (payload: { key: string; value: unknown }) => void) => {
    const listener = (_: Electron.IpcRendererEvent, payload: { key: string; value: unknown }) => {
      callback(payload)
    }

    ipcRenderer.on('store-changed', listener)

    return () => {
      ipcRenderer.removeListener('store-changed', listener)
    }
  },

  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

  onUpdateAvailable: (callback: (info: { version: string }) => void) =>
    ipcRenderer.on('update-available', (_, info) => callback(info)),
  onUpdateDownloaded: (callback: () => void) =>
    ipcRenderer.on('update-downloaded', () => callback()),
  onUpdateProgress: (callback: (progress: { percent: number }) => void) =>
    ipcRenderer.on('update-progress', (_, progress) => callback(progress)),
  onUpdateError: (callback: (message: string) => void) =>
    ipcRenderer.on('update-error', (_, msg) => callback(msg)),
  downloadUpdate: () => ipcRenderer.invoke('update-download'),
  installUpdate: () => ipcRenderer.invoke('update-install'),
  removeAllUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update-available')
    ipcRenderer.removeAllListeners('update-downloaded')
    ipcRenderer.removeAllListeners('update-progress')
    ipcRenderer.removeAllListeners('update-error')
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
