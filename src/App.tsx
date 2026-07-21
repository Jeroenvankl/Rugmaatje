import { useEffect, useState } from 'react'
import { AppDataProvider, useAppData } from './lib/AppDataContext'
import { DisclaimerModal } from './components/DisclaimerModal'
import { CheckInScreen } from './screens/CheckInScreen'
import { TodayScreen } from './screens/TodayScreen'
import { ExercisesScreen } from './screens/ExercisesScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { VolleyballScreen } from './screens/VolleyballScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { BottomNav, type TabKey } from './components/BottomNav'
import { checkAndFireReminder } from './lib/notifications'

function AppShell() {
  const { data, updateSettings, todayCheckIn } = useAppData()
  const [tab, setTab] = useState<TabKey>('vandaag')

  useEffect(() => {
    const interval = setInterval(() => {
      checkAndFireReminder(data.settings.reminder.enabled, data.settings.reminder.time, !!todayCheckIn)
    }, 60_000)
    return () => clearInterval(interval)
  }, [data.settings.reminder.enabled, data.settings.reminder.time, todayCheckIn])

  if (!data.settings.disclaimerSeenAt) {
    return <DisclaimerModal onAccept={() => updateSettings({ disclaimerSeenAt: Date.now() })} />
  }

  if (!todayCheckIn) {
    return <CheckInScreen onDone={() => {}} />
  }

  return (
    <div className="flex min-h-svh flex-1 flex-col">
      <div className="flex-1">
        {tab === 'vandaag' && <TodayScreen />}
        {tab === 'oefeningen' && <ExercisesScreen />}
        {tab === 'geschiedenis' && <HistoryScreen />}
        {tab === 'volleybal' && <VolleyballScreen />}
        {tab === 'instellingen' && <SettingsScreen />}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

function App() {
  return (
    <AppDataProvider>
      <AppShell />
    </AppDataProvider>
  )
}

export default App
