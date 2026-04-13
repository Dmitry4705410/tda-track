import { useState, useEffect } from 'react'

export interface Setting {
  token: string
  organizationId: string
  uid: string
}

const defaultSettings: Setting = {
  token: '',
  organizationId: '',
  uid: ''
}

export function useSettings() {
  const [settings, setSettings] = useState<Setting>(defaultSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.getStore('settings').then((saved) => {
      if (saved && typeof saved === 'object') {
        setSettings({ ...defaultSettings, ...(saved as Partial<Setting>) })
      }
      setLoading(false)
    })
  }, [])

  const save = async (newSettings: Setting) => {
    setSettings(newSettings)
    await window.api.setStore('settings', newSettings)
  }

  return { settings, save, loading }
}
