import { useEffect, useState } from 'react'
import { useToaster } from '@gravity-ui/uikit'

const GITHUB_REPO = 'Dmitry4705410/tda-track'

export type UpdateStatus = 'idle' | 'available' | 'downloading' | 'ready' | 'error'

export function useUpdater() {
  const { add } = useToaster()
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle')
  const [downloadProgress, setDownloadProgress] = useState(0)

  useEffect(() => {
    const api = window.api

    api.onUpdateAvailable((info: { version: string }) => {
      setUpdateStatus('available')
      add({
        name: 'update-available',
        title: `Доступно обновление v${info.version}`,
        content: 'Откройте настройки для установки',
        theme: 'info',
        actions: [
          {
            label: 'Открыть changelog',
            onClick: () => window.api.openExternal(
              `https://github.com/${GITHUB_REPO}/releases/tag/v${info.version}`
            ),
          }
        ]
      })
    })

    api.onUpdateProgress((progress: { percent: number }) => {
      setUpdateStatus('downloading')
      setDownloadProgress(Math.round(progress.percent))
    })

    api.onUpdateDownloaded(() => {
      setUpdateStatus('ready')
      add({
        name: 'update-ready',
        title: 'Обновление загружено',
        content: 'Нажмите "Установить" в настройках',
        theme: 'success'
      })
    })

    api.onUpdateError((msg: string) => {
      setUpdateStatus('error')
      add({
        name: 'update-error',
        title: 'Ошибка обновления',
        content: msg,
        theme: 'danger',
      })
    })

    return () => {
      api.removeAllUpdateListeners?.()
    }
  }, [])

  const downloadUpdate = async () => {
    setUpdateStatus('downloading')
    await window.api.downloadUpdate()
  }

  const installUpdate = () => {
    window.api.installUpdate()
  }

  return { updateStatus, downloadProgress, downloadUpdate, installUpdate }
}
