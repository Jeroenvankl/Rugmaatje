import type { AppData, Settings, StreakData } from '../types'
import { DEFAULT_EXERCISES } from '../data/defaultExercises'

const STORAGE_KEY = 'rugmaatje_data_v1'

export const DEFAULT_SETTINGS: Settings = {
  disclaimerSeenAt: null,
  painThresholdGroenMax: 1,
  painThresholdOranjeMax: 3,
  volleyball: {
    unlockedByPhysio: false,
    currentPhase: 1,
  },
  reminder: {
    enabled: false,
    time: '08:00',
  },
}

export const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastCheckInDate: null,
  totalCheckIns: 0,
  badgesEarned: [],
}

function defaultData(): AppData {
  return {
    checkIns: [],
    exercises: DEFAULT_EXERCISES,
    cyclingLogs: [],
    restLogs: [],
    exerciseCompletions: [],
    settings: DEFAULT_SETTINGS,
    streak: DEFAULT_STREAK,
  }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData()
    const parsed = JSON.parse(raw) as Partial<AppData>
    // Defensief samenvoegen zodat nieuwe velden bij updates niet ontbreken.
    return {
      checkIns: parsed.checkIns ?? [],
      exercises: parsed.exercises && parsed.exercises.length > 0 ? parsed.exercises : DEFAULT_EXERCISES,
      cyclingLogs: parsed.cyclingLogs ?? [],
      restLogs: parsed.restLogs ?? [],
      exerciseCompletions: parsed.exerciseCompletions ?? [],
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings, volleyball: { ...DEFAULT_SETTINGS.volleyball, ...parsed.settings?.volleyball }, reminder: { ...DEFAULT_SETTINGS.reminder, ...parsed.settings?.reminder } },
      streak: { ...DEFAULT_STREAK, ...parsed.streak },
    }
  } catch (e) {
    console.error('RugMaatje: kon data niet laden, start met lege data.', e)
    return defaultData()
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function resetAllData(): AppData {
  localStorage.removeItem(STORAGE_KEY)
  const fresh = defaultData()
  saveData(fresh)
  return fresh
}

export function exportAsCsv(data: AppData): string {
  const header = [
    'datum',
    'tijd',
    'pijnscore',
    'locaties',
    'uitstraling',
    'notitie',
    'slaap',
    'ochtendstijfheid',
  ].join(';')
  const rows = data.checkIns
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((c) => {
      const time = new Date(c.timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
      return [
        c.date,
        time,
        c.painScore,
        c.locations.join(' | '),
        c.radiating,
        (c.freeText ?? '').replace(/;/g, ','),
        c.sleepQuality ?? '',
        c.morningStiffness ?? '',
      ].join(';')
    })
  return [header, ...rows].join('\n')
}

export function exportAsText(data: AppData): string {
  const lines = data.checkIns
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((c) => {
      const time = new Date(c.timestamp).toLocaleString('nl-NL')
      return `${c.date} (${time})\n  Pijnscore: ${c.painScore}/10\n  Locatie(s): ${c.locations.join(', ') || '-'}\n  Uitstraling: ${c.radiating}\n  Notitie: ${c.freeText || '-'}\n`
    })
  return `RugMaatje - overzicht check-ins\n\n${lines.join('\n')}`
}
