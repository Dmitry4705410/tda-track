import classes from './style.module.css'
import { Text } from "@gravity-ui/uikit"

interface TaskItemProps {
  issueKey: string
  display: string
  duration: string
  comment?: string
}

export default function TaskItem({ issueKey, display, duration, comment }: TaskItemProps) {
  const getTaskLink = async (key: string) => {
    window.api.openExternal("https://tracker.yandex.ru/"+ key)
  }
  return (
    <div className={classes.task}>
      <div className={classes.left} onClick={() => getTaskLink(issueKey)}>
        <Text variant="caption-2" color="warning" className={classes.key}>{issueKey}</Text>
        <Text variant="body-1" className={classes.name}>{display}</Text>
        {comment && <Text variant="caption-1" color="secondary">{comment}</Text>}
      </div>
      <div className={classes.right}>
        <Text variant="subheader-1" color="warning">{formatDuration(duration)}</Text>
      </div>
    </div>
  )
}

function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return iso
  const h = match[1] ? `${match[1]}ч` : ''
  const m = match[2] ? `${match[2]}м` : ''
  return [h, m].filter(Boolean).join(' ')
}
