import { useState, useEffect, useCallback } from 'react'

export interface TrackTask {
  key: string
  time: number
  comment?: string
}

export interface TrackDay {
  date: string
  tasks: TrackTask[]
}

function getLocalDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeTracks(data: unknown): TrackDay[] {
  return Array.isArray(data) ? (data as TrackDay[]) : []
}

function cloneTracks(tracks: TrackDay[]): TrackDay[] {
  return tracks.map(day => ({
    ...day,
    tasks: day.tasks.map(task => ({ ...task }))
  }))
}

export function useTracker() {
  const [tracks, setTracks] = useState<TrackDay[]>([])

  const loadTracks = useCallback(async () => {
    const saved = await window.api.getStore('tracks')
    setTracks(normalizeTracks(saved))
  }, [])

  useEffect(() => {
    loadTracks()

    const unsubscribe = window.api.onStoreChanged((payload) => {
      if (payload.key === 'tracks') {
        setTracks(normalizeTracks(payload.value))
      }
    })

    return () => {
      unsubscribe()
    }
  }, [loadTracks])

  const saveTrack = useCallback(async (key: string, seconds: number, date?: string) => {
    const targetDate = date ?? getLocalDateString()
    const saved = await window.api.getStore('tracks')
    const next = cloneTracks(normalizeTracks(saved))

    const dayIndex = next.findIndex(d => d.date === targetDate)

    if (dayIndex === -1) {
      next.push({ date: targetDate, tasks: [{ key, time: seconds }] })
    } else {
      const taskIndex = next[dayIndex].tasks.findIndex(t => t.key === key)
      if (taskIndex === -1) {
        next[dayIndex].tasks.push({ key, time: seconds })
      } else {
        next[dayIndex].tasks[taskIndex].time = seconds
      }
    }

    await window.api.setStore('tracks', next)
  }, [])

  const getTaskTime = useCallback((key: string, date?: string): number => {
    const targetDate = date ?? getLocalDateString()

    return tracks
      .find(d => d.date === targetDate)
      ?.tasks.find(t => t.key === key)
      ?.time ?? 0
  }, [tracks])

  const clearDay = useCallback(async (date: string) => {
    const saved = await window.api.getStore('tracks')
    const next = normalizeTracks(saved).filter(d => d.date !== date)
    await window.api.setStore('tracks', next)
  }, [])

  const updateTask = useCallback(async (key: string, time: number, comment: string, date?: string) => {
    const targetDate = date ?? getLocalDateString()
    const saved = await window.api.getStore('tracks')
    const next = cloneTracks(normalizeTracks(saved))

    const dayIndex = next.findIndex(d => d.date === targetDate)
    if (dayIndex === -1) return

    const taskIndex = next[dayIndex].tasks.findIndex(t => t.key === key)
    if (taskIndex === -1) return

    next[dayIndex].tasks[taskIndex] = {
      ...next[dayIndex].tasks[taskIndex],
      time,
      comment
    }

    await window.api.setStore('tracks', next)
  }, [])

  const deleteTask = useCallback(async (key: string, date?: string) => {
    const targetDate = date ?? getLocalDateString()
    const saved = await window.api.getStore('tracks')
    const next = cloneTracks(normalizeTracks(saved))

    const dayIndex = next.findIndex(d => d.date === targetDate)
    if (dayIndex === -1) return

    next[dayIndex].tasks = next[dayIndex].tasks.filter(t => t.key !== key)

    await window.api.setStore('tracks', next)
  }, [])

  return { tracks, saveTrack, getTaskTime, clearDay, updateTask, deleteTask, loadTracks }
}
