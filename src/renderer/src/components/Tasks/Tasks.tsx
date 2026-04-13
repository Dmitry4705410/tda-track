import classes from './style.module.css'
import DateControl from "@renderer/components/DateControl/DateControl";
import { DateTime, dateTime } from "@gravity-ui/date-utils";
import { useEffect, useState } from "react";
import { Setting } from "@renderer/hooks/useSettings";
import { useWorklogs, WorklogItem } from "@renderer/hooks/useWorklogs";
import { useYandexAuth } from "@renderer/hooks/useYandexAuth";
import { Skeleton, Text, useToaster } from "@gravity-ui/uikit";
import TaskItem from "@renderer/components/TaskItem/TaskItem";
import TrackTaskItem from "@renderer/components/TrackTaskItem/TrackTaskItem";
import { useTracker } from "@renderer/hooks/useTracker";

interface props {
  setting: Setting,
  fetchRef: React.MutableRefObject<() => void>
}

export default function Tasks({ setting, fetchRef }: props) {
  const { add } = useToaster()
  const [date, setDate] = useState<DateTime | null>(dateTime())
  const { getWorklogs } = useWorklogs(setting.organizationId, setting.uid)
  const { getToken } = useYandexAuth(setting.token)
  const [worklogs, setWorklogs] = useState<WorklogItem[]>([])
  const [loading, setLoading] = useState(false);

  const { tracks, updateTask, deleteTask } = useTracker()
  const today = date?.format('YYYY-MM-DD') ?? null
  const todayTasks = today ? (tracks.find(d => d.date === today)?.tasks ?? []) : []

  useEffect(() => {
    if (!date || !setting.uid) return

    const loadWorklogs = async (d: DateTime) => {
      setLoading(true);
      setWorklogs([]);
      const token = await getToken()
      try {
        const result = await getWorklogs(token, d)
        setWorklogs(result)
      } catch {
        add({ name: 'worklog-get-error', title: 'Ошибка получения списанного времени', theme: 'warning' })
      } finally {
        setLoading(false);
      }
    }

    fetchRef.current = () => loadWorklogs(date)
    loadWorklogs(date)
  }, [date, setting.uid])

  const parseIsoDurationToSeconds = (iso: string): number => {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0

    const hours = Number(match[1] ?? 0)
    const minutes = Number(match[2] ?? 0)
    const seconds = Number(match[3] ?? 0)

    return hours * 3600 + minutes * 60 + seconds
  }

  const formatTotalTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)

    if (h > 0 && m > 0) return `${h}ч ${m}м`
    if (h > 0) return `${h}ч`
    return `${m}м`
  }

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
        </div>
        <div className={classes.taskFromTracker}>
          <div className={classes.header}>
            <Text variant={"subheader-1"} color={"secondary"}>УЖЕ СПИСАНО:</Text>
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
