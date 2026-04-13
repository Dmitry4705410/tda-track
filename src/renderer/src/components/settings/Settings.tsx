import classes from './style.module.css'
import { Button, PasswordInput, Progress, Text, TextInput, useToaster, } from "@gravity-ui/uikit";
import { useEffect, useState } from "react";
import { Setting } from "../../hooks/useSettings";
import { useUpdater } from "../../hooks/useUpdater";
import { useYandexAuth } from "@renderer/hooks/useYandexAuth";
import { useTrackerUser } from "@renderer/hooks/useTrackerUser";

interface SettingsProps {
  isOpen: boolean,
  onClose: () => void,
  setting: Setting
  onSave: (s: Setting) => Promise<void>
}

const tokenLink = "https://oauth.yandex.ru/authorize?response_type=token&client_id=1a6990aa636648e9b2ef855fa7bec2fb";

export default function Settings({ isOpen, onClose, setting, onSave }: SettingsProps) {
  const [loadingCheckConnect, setLoadingCheckConnect] = useState(false);
  const [form, setForm] = useState(setting);
  const { add } = useToaster()
  const { ping, getToken } = useYandexAuth(form.token)
  const { getMyself } = useTrackerUser(form.organizationId)

  useEffect(() => {
    setForm(setting)
  }, [setting])

  useEffect(() => {
    setForm(setting)
  }, [isOpen])

  const handleSave = async () => {
    await onSave(form)
    onClose()
  }

  const handleCheck = async () => {
    setLoadingCheckConnect(true)
    try {
      const status = await ping()
      if (status === 401) {
        add({ name: `ping`, title: 'Неверный токен', theme: 'danger' })
        return
      } else if (status !== 200) {
        add({ name: `ping`, title: 'Неизвестная ошибка', content: `Код: ${status}`, theme: 'warning' })
        return
      }

      const token = await getToken()
      const user = await getMyself(token);
      setForm({ ...form, uid: user.uid })
      await onSave(form)
      add({ name: `ping`, title: 'Подключение успешно', content: `Привет, ${user.display}`, theme: 'success' })
    } catch {
      add({ name: `ping`, title: 'Неизвестная ошибка', theme: 'warning' })
    } finally {
      setLoadingCheckConnect(false)
    }
  }

  const getTokenLink = async () => {
    window.api.openExternal(tokenLink)
  }
  const { updateStatus, downloadProgress, downloadUpdate, installUpdate } = useUpdater()
  return (
    <>
      {isOpen && <div className={classes.overlay} onClick={onClose}/>}
        <div className={`${classes.settings} ${isOpen ? classes.open : ''}`}>
          <div className={classes.header}><Text variant={"header-1"}>Настройки</Text></div>
          <div className={classes.input}>
            <PasswordInput
              size={"l"}
              label={"OAuth токен:"}
              value={form.token}
              onUpdate={(v) => setForm(prev => ({ ...prev, token: v }))}
            />
            <div className={classes.tokenLink}>
              <Text variant={"caption-1"} color={"link"} onClick={getTokenLink}>
                * Получить токен
              </Text>
            </div>
          </div>
          <div className={classes.input}>
            <TextInput
              size={"l"}
              label={"ID организации:"}
              value={form.organizationId}
              onUpdate={(v) => setForm(prev => ({ ...prev, organizationId: v }))}
            />
          </div>

          <Text variant={"caption-1"} color={"secondary"}>
            * Данные хранятся локально на вашем устройстве и никуда не передаются
          </Text>

          <div className={classes.button}>
            <Button loading={loadingCheckConnect} onClick={handleCheck} size={"l"} width={"max"}>Проверить
              подключение</Button>
          </div>
          {updateStatus === 'available' && (
            <div className={classes.button}>
              <Button onClick={downloadUpdate} view={"outlined-info"} size={"l"} width={"max"}>
                Скачать обновление
              </Button>
            </div>
          )}

          {updateStatus === 'downloading' && (
            <div className={classes.input}>
              <Text variant="body-1">Загрузка... {downloadProgress}%</Text>
              <Progress value={downloadProgress} size="s"/>
            </div>
          )}

          {updateStatus === 'ready' && (
            <div className={classes.button}>
              <Button onClick={installUpdate} view={"outlined-success"} size={"l"} width={"max"}>
                Установить и перезапустить
              </Button>
            </div>
          )}
          <div className={classes.button}>
            <Button onClick={handleSave} view={"action"} size={"l"} width={"max"}>Сохранить</Button>
          </div>

        </div>
    </>
  )
}
