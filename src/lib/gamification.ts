import type { AppData } from '../types'

// XP wordt AFGELEID uit de bestaande logs (niet apart opgeslagen), zodat het
// altijd klopt met de data en er niets kan ontsporen bij een migratie.
//
// Belangrijk ontwerpprincipe: rust levert EVENVEEL op als oefenen. Zo beloont
// de app consistentie en herstel, en nooit "meer, meer, meer" — bij rugklachten
// is doorgaan door pijn schadelijk, dus rust moet net zo waardevol voelen.
export const XP_PER_CHECKIN = 10
export const XP_PER_EXERCISE_SESSION = 15
export const XP_PER_REST_DAY = 15
export const XP_PER_CYCLING = 10

export function computeTotalXp(data: AppData): number {
  return (
    data.streak.totalCheckIns * XP_PER_CHECKIN +
    data.exerciseCompletions.length * XP_PER_EXERCISE_SESSION +
    data.restLogs.length * XP_PER_REST_DAY +
    data.cyclingLogs.length * XP_PER_CYCLING
  )
}

/**
 * Totale XP die nodig is om level `level` te BEREIKEN. Level 1 = 0 XP; de
 * gaten tussen levels groeien geleidelijk (100, 200, 300, ...), zodat de
 * eerste niveaus snel voelen en latere iets meer moeite kosten — zonder ooit
 * onhaalbaar te worden.
 */
export function xpThreshold(level: number): number {
  if (level <= 1) return 0
  return 50 * level * (level - 1)
}

// Optionele titel per niveau-reeks, voor een beetje warmte/flavor.
const LEVEL_TITLES: { min: number; title: string }[] = [
  { min: 1, title: 'Startend' },
  { min: 3, title: 'Op weg' },
  { min: 6, title: 'Doorzetter' },
  { min: 10, title: 'Volhouder' },
  { min: 15, title: 'Herstel-held' },
]

export function levelTitle(level: number): string {
  let title = LEVEL_TITLES[0].title
  for (const t of LEVEL_TITLES) {
    if (level >= t.min) title = t.title
  }
  return title
}

export interface LevelInfo {
  totalXp: number
  level: number
  title: string
  xpIntoLevel: number
  xpForNextLevel: number
  progress: number // 0..1 richting het volgende niveau
}

export function computeLevel(totalXp: number): LevelInfo {
  let level = 1
  while (xpThreshold(level + 1) <= totalXp) level++

  const base = xpThreshold(level)
  const next = xpThreshold(level + 1)
  const xpIntoLevel = totalXp - base
  const xpForNextLevel = next - base

  return {
    totalXp,
    level,
    title: levelTitle(level),
    xpIntoLevel,
    xpForNextLevel,
    progress: xpForNextLevel > 0 ? xpIntoLevel / xpForNextLevel : 0,
  }
}

export function getLevelInfo(data: AppData): LevelInfo {
  return computeLevel(computeTotalXp(data))
}
