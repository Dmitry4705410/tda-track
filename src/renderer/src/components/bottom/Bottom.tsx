import classes from './style.module.css'
import { Text } from "@gravity-ui/uikit"
import { version } from '../../../../../package.json'

export default function Bottom() {
  return (
    <div className={classes.bottom}>
      <div className={classes.version}>
        <Text variant="caption-1" color="light-hint">Версия: v{version}</Text>
      </div>
    </div>
  )
}
