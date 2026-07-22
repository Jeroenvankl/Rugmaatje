import type { AppData } from '../types'
import { evaluateSafetyWindow } from './stoplight'
import { comparePainTrend, hasEnoughDataForTrend } from './trends'
import { todayKey } from './dates'

export interface BadgeDef {
  id: string
  name: string
  description: string
  emoji: string
  check: (data: AppData) => boolean
}

export const BADGE_DEFS: BadgeDef[] = [
  {
    id: 'eerste-check-in',
    name: 'Eerste stap',
    description: 'Je hebt je allereerste check-in gelogd. Welkom!',
    emoji: '🌱',
    check: (d) => d.streak.totalCheckIns >= 1,
  },
  {
    id: 'streak-3',
    name: 'Drie op rij',
    description: '3 dagen achter elkaar ingecheckt.',
    emoji: '🌤️',
    check: (d) => d.streak.currentStreak >= 3,
  },
  {
    id: 'streak-7',
    name: 'Een hele week',
    description: '7 dagen achter elkaar ingecheckt. Wat fijn dat je er steeds bent.',
    emoji: '🌈',
    check: (d) => d.streak.currentStreak >= 7,
  },
  {
    id: 'streak-30',
    name: 'Een hele maand',
    description: '30 dagen achter elkaar ingecheckt. Enorm knap volgehouden!',
    emoji: '🏵️',
    check: (d) => d.streak.currentStreak >= 30,
  },
  {
    id: 'eerste-rustdag',
    name: 'Rust-kampioen',
    description: 'Je hebt je eerste rustdag gelogd. Rust is hier pure winst!',
    emoji: '🌸',
    check: (d) => d.restLogs.length >= 1,
  },
  {
    id: 'vijf-rustdagen',
    name: 'Meester in ontspannen',
    description: '5 rustdagen gelogd. Je luistert goed naar je lijf.',
    emoji: '🛋️',
    check: (d) => d.restLogs.length >= 5,
  },
  {
    id: 'eerste-oefendag',
    name: 'Eerste keer bewogen',
    description: 'Je hebt je eerste oefensessie afgerond.',
    emoji: '🎀',
    check: (d) => d.exerciseCompletions.length >= 1,
  },
  {
    id: 'tien-oefendagen',
    name: 'Tien keer bewogen',
    description: '10 oefensessies afgerond volgens jouw eigen schema.',
    emoji: '🎗️',
    check: (d) => d.exerciseCompletions.length >= 10,
  },
  {
    id: 'eerste-fietsrit',
    name: 'Eerste fietsrit',
    description: 'Je hebt je eerste fietsrit gelogd.',
    emoji: '🚲',
    check: (d) => d.cyclingLogs.length >= 1,
  },
  {
    id: 'dertig-check-ins',
    name: 'Trouwe volhouder',
    description: '30 check-ins in totaal. Je bouwt aan een mooie gewoonte.',
    emoji: '💐',
    check: (d) => d.streak.totalCheckIns >= 30,
  },
  // De badges hierboven vieren vooral AANWEZIGHEID (streaks, aantallen).
  // Deze drie vieren echte HERSTEL-vooruitgang, zodat de app ook beloont
  // waar het je uiteindelijk om gaat: beter worden, niet alleen "de app
  // geopend hebben".
  {
    id: 'twee-weken-geen-rode-vlag',
    name: 'Twee sterke weken',
    description: '14 dagen op rij geen rode vlag gehad.',
    emoji: '🛡️',
    check: (d) => {
      const w = evaluateSafetyWindow(d.checkIns, d.settings, 14, todayKey())
      return w.daysLogged >= 10 && !w.hadRedFlag
    },
  },
  {
    id: 'eerste-opgebouwd',
    name: 'Eerste stap vooruit',
    description: 'Je eerste oefening is opgebouwd naar een volgend niveau.',
    emoji: '🌿',
    check: (d) => d.exercises.some((e) => e.level === 'opgebouwd'),
  },
  {
    id: 'pijn-neemt-af',
    name: 'Het gaat de goede kant op',
    description: 'Je gemiddelde pijn is duidelijk lager dan de periode ervoor.',
    emoji: '📉',
    check: (d) => {
      const trend = comparePainTrend(d.checkIns, todayKey(), 14)
      return hasEnoughDataForTrend(trend) && (trend.delta ?? 0) <= -1
    },
  },
]

/** Bepaalt welke badges nieuw verdiend zijn t.o.v. de al opgeslagen badges. */
export function getNewlyEarnedBadges(data: AppData): BadgeDef[] {
  const already = new Set(data.streak.badgesEarned)
  return BADGE_DEFS.filter((b) => !already.has(b.id) && b.check(data))
}
