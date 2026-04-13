import { useCallback } from 'react'

interface TrackerUser {
  uid: string
  display: string
}

export function useTrackerUser(organizationId: string) {
  const getMyself = useCallback(async (token: string): Promise<TrackerUser> => {
    const res = await fetch('https://api.tracker.yandex.net/v3/myself', {
      headers: {
        'Authorization': token,
        'X-Cloud-Org-ID': organizationId,
      },
    })

    if (!res.ok) {
      throw new Error(`${res.status}`)
    }

    const data = await res.json()

    return {
      uid: data.uid,
      display: data.display,
    }
  }, [organizationId])

  return { getMyself }
}
