import { useCallback, useEffect, useRef } from 'react'
import { useToaster } from "@gravity-ui/uikit";

interface IamToken {
  iamToken: string
  expiresAt: string
}

export function useYandexAuth(oauthToken: string) {
  const tokenRef = useRef<IamToken | null>(null)
  const { add } = useToaster()

  const getToken = useCallback(async (): Promise<string> => {
    const now = new Date()

    if (tokenRef.current) {
      const expiresAt = new Date(tokenRef.current.expiresAt)
      if (expiresAt.getTime() - now.getTime() > 60_000) {
        return "Bearer " + tokenRef.current.iamToken
      }
    }

    const res = await fetch('https://iam.api.cloud.yandex.net/iam/v1/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yandexPassportOauthToken: oauthToken }),
    })

    if (!res.ok) {
      add({
        name: 'get-aim-token-error',
        title: 'Ошибка получения IAM токена',
        content: `Статус: ${res.status}.`,
        theme: 'danger',
      })
      throw new Error(`${res.status}`)
    }

    tokenRef.current = await res.json()

    return "Bearer " + tokenRef.current!.iamToken
  }, [oauthToken])

  const ping = useCallback(async (): Promise<number> => {
    const res = await fetch('https://iam.api.cloud.yandex.net/iam/v1/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yandexPassportOauthToken: oauthToken }),
    })

    if (res.ok) {
      tokenRef.current = await res.json()
    }

    return res.status
  }, [oauthToken])

  useEffect(() => {
    tokenRef.current = null
  }, [oauthToken])

  return { getToken, ping }
}
