import { ElectronAPI } from '@electron-toolkit/preload'
type __TEST__ = NotExistingType
declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      closeWindow: () => void
      minimizeWindow: () => void

      getStore: (key: string) => Promise<unknown>
      setStore: (key: string, value: unknown) => Promise<void>
      onStoreChanged: (
        callback: (payload: { key: string; value: unknown }) => void
      ) => () => void

      openExternal: (url: string) => Promise<void>
      onUpdateAvailable: (callback: (info: { version: string }) => void) => void
      onUpdateDownloaded: (callback: () => void) => void
      onUpdateProgress: (callback: (progress: { percent: number }) => void) => void
      onUpdateError: (callback: (message: string) => void) => void
      downloadUpdate: () => Promise<void>
      installUpdate: () => Promise<void>
      removeAllUpdateListeners: () => void
    }
  }
}
export {}
