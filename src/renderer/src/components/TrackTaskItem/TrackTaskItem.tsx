import classes from './style.module.css'
import { Button, Text, TextInput, NumberInput } from "@gravity-ui/uikit"
import { useEffect, useState } from "react"
import { TrackTask } from "@renderer/hooks/useTracker"

interface TrackTaskItemProps {
  task: TrackTask
  date: string
  onSave: (key: string, time: number, comment: string, date: string) => void
  onDelete: (key: string, date: string) => void
}

export default function TrackTaskItem({ task, onSave, onDelete, date }: TrackTaskItemProps) {
  const [editing, setEditing] = useState(false)
  const [comment, setComment] = useState(task.comment ?? '')
  const [hours, setHours] = useState(Math.floor(task.time / 3600))
  const [minutes, setMinutes] = useState(Math.floor((task.time % 3600) / 60))

  useEffect(() => {
    setComment(task.comment ?? '')
    setHours(Math.floor(task.time / 3600))
    setMinutes(Math.floor((task.time % 3600) / 60))
  }, [task])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    return [h ? `${h}ч` : '', m ? `${m}м` : ''].filter(Boolean).join(' ') || '0м'
  }

  const handleSave = () => {
    const totalSeconds = (hours * 60 + minutes) * 60
    onSave(task.key, totalSeconds, comment, date)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className={classes.editTask}>
        <div className={classes.editHeader}>
          <Text variant="caption-2" color="warning">{task.key}</Text>
        </div>

        <div className={classes.editRow}>
          <NumberInput
            label="часы:"
            value={hours}
            onUpdate={(v) => setHours(v ?? 0)}
            min={0}
          />
        </div>

        <div className={classes.editMin}>
          <NumberInput
            label="мин:"
            value={minutes}
            onUpdate={(v) => setMinutes(Math.max(0, Math.min(59, v ?? 0)))}
            min={0}
            max={59}
          />
          <Button onClick={()=> setMinutes(0)}>
            0м
          </Button>
          <Button onClick={() => setMinutes(30)}>
            30м
          </Button>
        </div>

        <div className={classes.editRow}>
          <TextInput
            label="комент:"
            value={comment}
            onUpdate={setComment}
          />
        </div>

        <div className={classes.editActions}>
          <Button size="s" view="action" onClick={handleSave}>Сохранить</Button>
          <Button size="s" view="outlined-danger" onClick={() => onDelete(task.key, date)}>Удалить</Button>
          <Button size="s" view="flat" onClick={() => setEditing(false)}>Отмена</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={classes.task} onClick={() => setEditing(true)}>
      <div className={classes.left}>
        <Text variant="caption-2" color="warning">{task.key}</Text>
        {task.comment && <Text variant="caption-1" color="secondary">{task.comment}</Text>}
      </div>
      <div className={classes.right}>
        <Text variant="subheader-1" color="warning">{formatTime(task.time)}</Text>
      </div>
    </div>
  )
}
