import classes from './style.module.css'
import { Button, Text, TextInput } from "@gravity-ui/uikit"
import { useEffect, useMemo, useRef, useState } from "react"
import { Setting } from "@renderer/hooks/useSettings";
import { useTrackerTask } from "@renderer/float/hooks/useTrackerTask";
import { useYandexAuth } from "@renderer/hooks/useYandexAuth";
import { useTracker } from "@renderer/hooks/useTracker";

type TimerState = 'idle' | 'running' | 'paused'

interface props {
  setting: Setting
}

export default function Body({setting}: props) {
  const { tracks, saveTrack, getTaskTime } = useTracker()
  const { checkTasks } = useTrackerTask(setting.organizationId);
  const { getToken } = useYandexAuth(setting.token);
  const [issueKey, setIssueKey] = useState('')
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [seconds, setSeconds] = useState(0)
  const [isInvalid, setIsInvalid] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSavedSecondsRef = useRef(0)

  const trackedSeconds = useMemo(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const date = `${year}-${month}-${day}`

    return tracks
      .find(d => d.date === date)
      ?.tasks.find(t => t.key === issueKey)
      ?.time ?? 0
  }, [tracks, issueKey])

  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => {
        setSeconds(s => s + 1)
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timerState])

  useEffect(() => {
    if (timerState !== 'running') return
    if (seconds > 0 && seconds % 60 === 0) {
      lastSavedSecondsRef.current = seconds
      saveTrack(issueKey, seconds)
    }
  }, [seconds, timerState, issueKey, saveTrack])

  useEffect(() => {
    if (!issueKey || timerState === 'idle') return

    if (timerState === 'paused') {
      setSeconds(trackedSeconds)
      lastSavedSecondsRef.current = trackedSeconds
      return
    }

    if (timerState === 'running') {
      if (trackedSeconds !== lastSavedSecondsRef.current) {
        setSeconds(trackedSeconds)
        lastSavedSecondsRef.current = trackedSeconds
      }
    }
  }, [trackedSeconds, timerState, issueKey])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0')
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  const handlePlay = async () => {
    try {
      const exists = await checkTasks(await getToken(), issueKey)
      if (!exists) {
        setIsInvalid(true)
        return
      }
    } catch (e) {
      setIsInvalid(true)
      return
    }

    const accumulated = getTaskTime(issueKey)
    lastSavedSecondsRef.current = accumulated
    setSeconds(accumulated)
    setIsInvalid(false)
    setTimerState('running')
  }

  const handlePause = () => {
    if (timerState === 'running') {
      lastSavedSecondsRef.current = seconds
      saveTrack(issueKey, seconds)
    }

    setTimerState(prev => prev === 'running' ? 'paused' : 'running')
  }

  const handleReset = () => {
    setTimerState('idle')
    setSeconds(0)
    setIssueKey('')
    setIsInvalid(false)
    lastSavedSecondsRef.current = 0
  }

  const hint = timerState === 'idle'
    ? 'Введите номер задачи для начала'
    : timerState === 'running'
      ? 'В работе'
      : 'Пауза'

  const hintColor = timerState === 'running' ? 'positive' : timerState === 'paused' ? 'warning' : 'secondary'

  return (
    <div className={classes.body}>
      <div className={classes.inputRow}>
        <TextInput
          label="Задача:"
          value={issueKey}
          onUpdate={setIssueKey}
          disabled={timerState !== 'idle'}
          validationState={isInvalid ? 'invalid' : undefined}
        />
      </div>

      <div className={classes.timer}>
        <Text variant="subheader-3">{formatTime(seconds)}</Text>
      </div>

      <div className={classes.controls}>
        {timerState === 'idle' && (
          <Button
            view="action"
            size="m"
            width="max"
            disabled={!issueKey.trim()}
            onClick={handlePlay}
          >
            Пуск
          </Button>
        )}

        {timerState !== 'idle' && (
          <Button
            view={timerState === 'running' ? 'outlined-warning' : 'outlined-success'}
            size="m"
            width="max"
            onClick={handlePause}
          >
            {timerState === 'running' ? 'Пауза' : 'Продолжить'}
          </Button>
        )}

        {timerState === 'paused' && (
          <Button
            view="outlined-danger"
            size="m"
            width="max"
            onClick={handleReset}
          >
            Сброс
          </Button>
        )}
      </div>

      <div className={classes.hint}>
        <Text variant="caption-1" color={hintColor}>{hint}</Text>
      </div>
    </div>
  )
}
