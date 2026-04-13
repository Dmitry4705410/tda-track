import Header from "@renderer/components/header/Header";
import Bottom from "@renderer/components/bottom/Bottom";
import Settings from "@renderer/components/settings/Settings";
import { useRef, useState } from "react";
import { useSettings } from "@renderer/hooks/useSettings";
import Tasks from "@renderer/components/Tasks/Tasks";

function App(): React.JSX.Element {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings, save } = useSettings()
  const fetchRef = useRef<() => void>(() => {})
  return (
    <>
      <Header onSettingsClick={() => setSettingsOpen(prev => !prev)} onRefresh={() => fetchRef.current()}/>
      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        setting={settings}
        onSave={save}
      />
      <Tasks setting={settings}  fetchRef={fetchRef}/>
      <Bottom />
    </>
  )
}

export default App
