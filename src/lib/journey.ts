import type { AppData } from '../types'
import { evaluateSafetyWindow } from './stoplight'
import { comparePainTrend, hasEnoughDataForTrend } from './trends'
import { todayKey } from './dates'

export interface Milestone {
  id: string
  title: string
  description: string
  emoji: string
  achieved: boolean
}

/**
 * De herstelreis: een vast pad van mijlpalen dat de grote lijn van het
 * herstel zichtbaar maakt (i.t.t. badges, die losse prestaties vieren). Dit
 * geeft antwoord op "doe ik dit ergens voor?" op de moeilijke dagen.
 *
 * Volgorde is bewust van eerste stapjes naar grote mijlpalen, zodat het echt
 * als een reis leest.
 */
export function buildJourney(data: AppData): Milestone[] {
  const today = todayKey()
  const safety14 = evaluateSafetyWindow(data.checkIns, data.settings, 14, today)
  const trend = comparePainTrend(data.checkIns, today, 14)
  const painDropping = hasEnoughDataForTrend(trend) && (trend.delta ?? 0) <= -1

  return [
    {
      id: 'eerste-check-in',
      title: 'De eerste stap',
      description: 'Je allereerste check-in gedaan.',
      emoji: '🌱',
      achieved: data.streak.totalCheckIns >= 1,
    },
    {
      id: 'eerste-beweging',
      title: 'Weer in beweging',
      description: 'Je eerste oefensessie of fietsrit gelogd.',
      emoji: '🚶',
      achieved: data.exerciseCompletions.length >= 1 || data.cyclingLogs.length >= 1,
    },
    {
      id: 'eerste-rust',
      title: 'Rust durven nemen',
      description: 'Je eerste bewuste rustdag gelogd.',
      emoji: '🌸',
      achieved: data.restLogs.length >= 1,
    },
    {
      id: 'eerste-week',
      title: 'Een week volgehouden',
      description: '7 dagen op rij ingecheckt.',
      emoji: '🗓️',
      achieved: data.streak.longestStreak >= 7,
    },
    {
      id: 'opgebouwd',
      title: 'Een stap vooruit',
      description: 'Een oefening opgebouwd naar een hoger niveau.',
      emoji: '🌿',
      achieved: data.exercises.some((e) => e.level === 'opgebouwd'),
    },
    {
      id: 'twee-weken-veilig',
      title: 'Twee sterke weken',
      description: '14 dagen zonder rode vlag.',
      emoji: '🛡️',
      achieved: safety14.daysLogged >= 10 && !safety14.hadRedFlag,
    },
    {
      id: 'pijn-daalt',
      title: 'De goede kant op',
      description: 'Je gemiddelde pijn duidelijk lager dan de periode ervoor.',
      emoji: '📉',
      achieved: painDropping,
    },
    {
      id: 'maand',
      title: 'Een hele maand',
      description: '30 dagen op rij ingecheckt.',
      emoji: '🏵️',
      achieved: data.streak.longestStreak >= 30,
    },
    {
      id: 'volleybal-vrij',
      title: 'Volleybal vrijgegeven',
      description: 'Je fysio heeft volleybal weer vrijgegeven.',
      emoji: '🏐',
      achieved: data.settings.volleyball.unlockedByPhysio,
    },
    {
      id: 'volleybal-terug',
      title: 'Terug op het veld',
      description: 'Volleybal-opbouw fase 3 of hoger bereikt.',
      emoji: '🏆',
      achieved: data.settings.volleyball.unlockedByPhysio && data.settings.volleyball.currentPhase >= 3,
    },
  ]
}

export interface JourneyProgress {
  milestones: Milestone[]
  achievedCount: number
  total: number
  nextMilestone: Milestone | null
}

export function journeyProgress(data: AppData): JourneyProgress {
  const milestones = buildJourney(data)
  const achievedCount = milestones.filter((m) => m.achieved).length
  const nextMilestone = milestones.find((m) => !m.achieved) ?? null
  return { milestones, achievedCount, total: milestones.length, nextMilestone }
}
