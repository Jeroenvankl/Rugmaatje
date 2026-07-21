// Lokale (client-side) herinnering. Zonder backend kan een PWA geen echte
// push-meldingen versturen als hij niet open is; dit is een best-effort
// herinnering die werkt zolang RugMaatje open staat of recent geopend is.

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

let lastFiredKey = ''

export function checkAndFireReminder(enabled: boolean, time: string, alreadyCheckedInToday: boolean): void {
  if (!enabled || alreadyCheckedInToday) return
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const now = new Date()
  const [h, m] = time.split(':').map(Number)
  const todayStr = now.toDateString()
  const key = `${todayStr}-${time}`

  const scheduledMinutes = h * 60 + m
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  if (nowMinutes >= scheduledMinutes && lastFiredKey !== key) {
    lastFiredKey = key
    new Notification('RugMaatje', {
      body: 'Even een moment voor je ochtend check-in? Helemaal in jouw tempo. 🌷',
      icon: '/icons/icon-192.png',
    })
  }
}
