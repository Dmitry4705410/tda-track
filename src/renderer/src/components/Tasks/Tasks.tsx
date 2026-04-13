import classes from './style.module.css'
import DateControl from "@renderer/components/DateControl/DateControl";
import { DateTime, dateTime } from "@gravity-ui/date-utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Setting } from "@renderer/hooks/useSettings";
import { useWorklogs, WorklogItem } from "@renderer/hooks/useWorklogs";
import { useYandexAuth } from "@renderer/hooks/useYandexAuth";
import { Button, ClipboardButton, Skeleton, Text, useToaster } from "@gravity-ui/uikit";
import TaskItem from "@renderer/components/TaskItem/TaskItem";
import TrackTaskItem from "@renderer/components/TrackTaskItem/TrackTaskItem";
import { useTracker } from "@renderer/hooks/useTracker";

interface props {
  setting: Setting,
  fetchRef: React.MutableRefObject<() => void>
}
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
export default function Tasks({ setting, fetchRef }: props) {
  const { add } = useToaster()
  const [date, setDate] = useState<DateTime | null>(dateTime())
  const { getWorklogs, addWorklog  } = useWorklogs(setting.organizationId, setting.uid)
  const { getToken } = useYandexAuth(setting.token)
  const [worklogs, setWorklogs] = useState<WorklogItem[]>([])
  const [loading, setLoading] = useState(false);

  const [trackingLoading, setTrackingLoading] = useState(false);

  const { tracks, updateTask, deleteTask } = useTracker()
  const today = date?.format('YYYY-MM-DD') ?? null
  const todayTasks = today ? (tracks.find(d => d.date === today)?.tasks ?? []) : []

  const loadWorklogs = useCallback(async (d: DateTime) => {
    setLoading(true);
    setWorklogs([]);

    try {
      const token = await getToken()
      const result = await getWorklogs(token, d)
      setWorklogs(result)
    } catch {
      add({ name: 'worklog-get-error', title: 'Ошибка получения списанного времени', theme: 'warning' })
    } finally {
      setLoading(false);
    }
  }, [getToken, getWorklogs, add])

  useEffect(() => {
    if (!date || !setting.uid) return

    fetchRef.current = () => {
      if (date) {
        void loadWorklogs(date)
      }
    }

    void loadWorklogs(date)
  }, [date, setting.uid, loadWorklogs, fetchRef])

  const parseIsoDurationToSeconds = (iso: string): number => {
    const match = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0

    const days = Number(match[1] ?? 0)
    const hours = Number(match[2] ?? 0)
    const minutes = Number(match[3] ?? 0)
    const seconds = Number(match[4] ?? 0)

    return days * 86400 + hours * 3600 + minutes * 60 + seconds
  }

  const formatTotalTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)

    if (h > 0 && m > 0) return `${h}ч ${m}м`
    if (h > 0) return `${h}ч`
    return `${m}м`
  }

  const secondsToIsoDuration = (seconds: number): string => {
    const safeSeconds = Math.max(0, Math.floor(seconds))

    const hours = Math.floor(safeSeconds / 3600)
    const minutes = Math.floor((safeSeconds % 3600) / 60)

    let result = 'PT'

    if (hours > 0) result += `${hours}H`
    if (minutes > 0) result += `${minutes}M`

    return result
  }

  const handleTrackAll = async () => {
    if (!date || !today || todayTasks.length === 0) return

    setTrackingLoading(true)

    try {
      const token = await getToken()

      for (const task of todayTasks) {
        const success = await addWorklog(token, task.key, {
          start: date.startOf('day').toISOString(),
          duration: secondsToIsoDuration(task.time),
          comment: task.comment ?? '',
        })

        if (!success) {
          add({
            name: `worklog-track-error-${task.key}`,
            title: `Ошибка списания времени для ${task.key}`,
            theme: 'warning',
          })
          continue
        }

        await deleteTask(task.key, today)
      }
      await sleep(2000)
      await loadWorklogs(date)
    } catch {
      add({
        name: 'worklog-track-common-error',
        title: 'Ошибка при списании времени',
        theme: 'warning',
      })
    } finally {
      setTrackingLoading(false)
    }
  }

  const clipboardText = useMemo(() => {
    return worklogs
      .map((w) => {
        const time = formatTotalTime(parseIsoDurationToSeconds(w.duration))
        const commentPart = w.comment?.trim() ? ` (${w.comment.trim()})` : ''
        return `${w.issue.key}: ${w.issue.display}${commentPart}(${time})`
      })
      .join('\n')
  }, [worklogs])

  const totalSeconds =
    todayTasks.reduce((sum, task) => sum + task.time, 0) +
    worklogs.reduce((sum, w) => sum + parseIsoDurationToSeconds(w.duration), 0)
  return (
    <div className={classes.body}>
      <DateControl date={date} onDateChange={setDate}/>
      <div className={classes.tasks}>
        <div className={classes.taskFromTracker}>
          <div className={classes.header}>
            <Text variant="subheader-1" color="secondary">НЕ СПИСАНО:</Text>
          </div>
          {todayTasks.length === 0 ? (
            <div className={classes.empty}>
              <Text color="secondary">Нет задач</Text>
            </div>
          ) : (
            todayTasks.map(task => (
              <TrackTaskItem
                key={task.key}
                task={task}
                onSave={updateTask}
                onDelete={deleteTask}
              />
            ))
          )}
          {todayTasks.length > 0 && (
            <Button
              view="action"
              width={"max"}
              loading={trackingLoading}
              onClick={() => void handleTrackAll()}
            >
              Списать в Яндекс Трекер
            </Button>
          )}
        </div>
        <div className={classes.taskFromTracker}>
          <div className={classes.header}>
            <Text variant={"subheader-1"} color={"secondary"}>УЖЕ СПИСАНО:</Text> <ClipboardButton text={clipboardText} disabled={worklogs.length === 0} />
          </div>
          {loading ? (
            <div className={classes.loader}>
              <Skeleton style={{ width: '100%', height: 56, marginBottom: 8 }}/>
              <Skeleton style={{ width: '100%', height: 56, marginBottom: 8 }}/>
              <Skeleton style={{ width: '100%', height: 56 }}/>
            </div>
          ) : worklogs.length === 0 ? (
            <div className={classes.empty}>
              <Text color="secondary">Нет списанного времени</Text>
            </div>
          ) : (
            worklogs.map((w) => (
              <TaskItem
                key={w.id}
                issueKey={w.issue.key}
                display={w.issue.display}
                duration={w.duration}
                comment={w.comment}
              />
            ))
          )}
        </div>
      </div>
      <div className={classes.allTime}>
        <Text variant="subheader-1" color="warning">
          ВСЕГО: {formatTotalTime(totalSeconds)}
        </Text>
      </div>
    </div>

  )
}
