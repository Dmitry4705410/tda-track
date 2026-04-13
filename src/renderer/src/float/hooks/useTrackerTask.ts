import { useCallback } from 'react'

export function useTrackerTask(organizationId: string) {
  const checkTasks = useCallback(async (token: string, key: string): Promise<Boolean> => {
    const res = await fetch(`https://api.tracker.yandex.net/v3/issues/${key}`, {
      headers: {
        'Authorization': token,
        'X-Cloud-Org-ID': organizationId,
      },
    })

    return res.ok;
  }, [organizationId])

  return { checkTasks }
}
