import classes from './style.module.css'
import { Icon, Text } from "@gravity-ui/uikit";
import {Xmark, Minus, Gear, ArrowsRotateLeft} from '@gravity-ui/icons';

interface Props {
  onSettingsClick: () => void,
  onRefresh: () => void
}

export default function Header( { onSettingsClick, onRefresh }: Props) {
  return (
    <div className={classes.header}>
      <div className={classes.headerItems}>
        <div className={classes.logo}>
          <Text className={classes.logo} variant={"subheader-3"} color={"warning"}>
            TDA-Track
          </Text>
        </div>
        <div>
          <div className={classes.headerRight}>
            <div onClick={onRefresh}>
              <Icon className={classes.refresh} data={ArrowsRotateLeft} size={20} color={"warning"}/>
            </div>
            <div onClick={onSettingsClick}>
              <Icon className={classes.settings} data={Gear} size={20} color={"warning"}/>
            </div>
            <div onClick={() => window.api.minimizeWindow()}>
              <Icon className={classes.hide} data={Minus} size={20} color={"warning"}/>
            </div>
            <div onClick={() => window.api.closeWindow()}>
              <Icon className={classes.close} data={Xmark} size={20} color={"warning"}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
