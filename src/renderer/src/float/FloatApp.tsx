import { useSettings } from "@renderer/hooks/useSettings";
import HeaderFloat from "@renderer/float/componens/header/HeaderFloat";
import Body from "@renderer/float/componens/Body/Body";

function FloatApp(): React.JSX.Element {
  const { settings } = useSettings()
  return (
    <div>
      <HeaderFloat />
      <Body setting={settings} />
    </div>
  )
}

export default FloatApp
