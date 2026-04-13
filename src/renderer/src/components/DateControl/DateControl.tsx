import classes from './style.module.css'
import { DatePicker } from "@gravity-ui/date-components"
import { Button } from "@gravity-ui/uikit"
import { dateTime, DateTime } from "@gravity-ui/date-utils"

interface DateControlProps {
  date: DateTime | null
  onDateChange: (date: DateTime | null) => void
}

export default function DateControl({ date, onDateChange }: DateControlProps) {
  return (
    <div className={classes.body}>
      <div>
        <DatePicker
          label="с:"
          size="m"
          format="DD/MM/YYYY"
          value={date}
          onUpdate={onDateChange}
        />
      </div>
      <div>
        <Button size="m" view="action" onClick={() => onDateChange(dateTime())}>
          Сегодня
        </Button>
      </div>
    </div>
  )
}
