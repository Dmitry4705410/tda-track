import { useCallback } from 'react'
import { DateTime } from '@gravity-ui/date-utils'

export interface WorklogItem {
  id: number
  issue: {
    key: string
    display: string
  }
  comment: string
  duration: string
}

export interface TrackInfoRequest {
  start: string
  duration: string
  comment?: string
}

export function useWorklogs(organizationId: string, createdBy: string) {
  const getWorklogs = useCallback(async (token: string, date: DateTime): Promise<WorklogItem[]> => {
    const startOfDay = date.startOf('day').toISOString()
    const endOfDay = date.endOf('day').toISOString()

    const res = await fetch('https://api.tracker.yandex.net/v3/worklog/_search?perPage=1000', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'X-Cloud-Org-ID': organizationId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        createdBy,
        start: {
          from: startOfDay,
          to: endOfDay,
        },
      }),
    })
    if (!res.ok) {
      throw new Error(`${res.status}`)
    }

    return res.json()
  }, [organizationId])

  const addWorklog = useCallback(
    async (
      token: string,
      issueKey: string,
      data: TrackInfoRequest
    ): Promise<Boolean> => {
      const res = await fetch(
        `https://api.tracker.yandex.net/v3/issues/${issueKey}/worklog`,
        {
          method: 'POST',
          headers: {
            Authorization: token,
            'X-Cloud-Org-ID': organizationId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      )

      return res.ok;
    },
    [organizationId]
  )

  return { getWorklogs, addWorklog }
}
