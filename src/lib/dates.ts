// Datumhelpers. We werken met lokale (device-)datums in YYYY-MM-DD formaat,
// zodat "vandaag" altijd klopt met de tijdzone van het toestel.

export function todayKey(): string {
  return toKey(new Date())
}

export function toKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return toKey(date)
}

export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const da = new Date(ay, am - 1, ad)
  const db = new Date(by, bm - 1, bd)
  return Math.round((db.getTime() - da.getTime()) / 86_400_000)
}

export function isYesterday(key: string, referenceToday: string): boolean {
  return daysBetween(key, referenceToday) === 1
}

export function formatNiceDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function formatShortDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

export function lastNDays(n: number, endKey: string = todayKey()): string[] {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    out.push(addDays(endKey, -i))
  }
  return out
}
