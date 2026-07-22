import type { AppData, Settings, StreakData } from '../types'
import { DEFAULT_EXERCISES } from '../data/defaultExercises'

const STORAGE_KEY = 'rugmaatje_data_v1'

/**
 * Schema-versie van de opgeslagen data. Verhoog dit bij elke structurele
 * wijziging aan AppData en voeg een stap toe aan MIGRATIONS, zodat bestaande
 * gebruikers hun gegevens nooit kwijtraken bij een app-update.
 *
 * Verwijder NOOIT een bestaande migratiestap: ook gebruikers die al twee jaar
 * niet hebben geüpdatet moeten in één keer kunnen doorschakelen naar de
 * huidige versie.
 */
export const SCHEMA_VERSION = 2

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
  showOptionalStretchOnRestDay: true,
}

export const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastCheckInDate: null,
  totalCheckIns: 0,
  badgesEarned: [],
}

function cloneDefaultExercises() {
  return DEFAULT_EXERCISES.map((e) => ({ ...e }))
}

function defaultData(): AppData {
  return {
    checkIns: [],
    exercises: cloneDefaultExercises(),
    cyclingLogs: [],
    restLogs: [],
    exerciseCompletions: [],
    settings: DEFAULT_SETTINGS,
    streak: DEFAULT_STREAK,
  }
}

/**
 * Vult ontbrekende/onbekende velden defensief aan met defaults. Dit vangt
 * zowel "kale" oudere data op als een onvolledig/handmatig bewerkt
 * back-upbestand, zodat we nooit crashen op ontbrekende velden.
 */
function normalizeAppData(parsed: Partial<AppData> | null | undefined): AppData {
  const p = parsed ?? {}
  return {
    checkIns: p.checkIns ?? [],
    exercises: p.exercises && p.exercises.length > 0 ? p.exercises : cloneDefaultExercises(),
    cyclingLogs: p.cyclingLogs ?? [],
    restLogs: p.restLogs ?? [],
    exerciseCompletions: p.exerciseCompletions ?? [],
    settings: {
      ...DEFAULT_SETTINGS,
      ...p.settings,
      volleyball: { ...DEFAULT_SETTINGS.volleyball, ...p.settings?.volleyball },
      reminder: { ...DEFAULT_SETTINGS.reminder, ...p.settings?.reminder },
    },
    streak: { ...DEFAULT_STREAK, ...p.streak },
  }
}

/**
 * Eén migratiestap per versienummer: MIGRATIONS[0] tilt data van v0 naar v1,
 * MIGRATIONS[1] zou v1 naar v2 tillen, enz. Nieuwe stappen hier toevoegen,
 * nooit bestaande stappen wijzigen of verwijderen.
 */
const MIGRATIONS: Record<number, (data: unknown) => unknown> = {
  // v0 = "kaal" AppData-object van vóór schema-versionering (geen envelope).
  0: (data) => normalizeAppData(data as Partial<AppData>),
  // v1 -> v2: 15 nieuwe standaardoefeningen toegevoegd aan de bibliotheek.
  // Vul ontbrekende default-oefeningen aan voor bestaande gebruikers, zonder
  // hun eigen aanpassingen of custom-oefeningen aan te raken.
  1: (data) => {
    const d = data as AppData
    const existingIds = new Set(d.exercises.map((e) => e.id))
    const missingDefaults = cloneDefaultExercises().filter((e) => !existingIds.has(e.id))
    return { ...d, exercises: [...d.exercises, ...missingDefaults] }
  },
}

function migrate(data: unknown, fromVersion: number): AppData {
  let current = data
  for (let v = fromVersion; v < SCHEMA_VERSION; v++) {
    const step = MIGRATIONS[v]
    if (step) current = step(current)
  }
  return normalizeAppData(current as Partial<AppData>)
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData()
    const parsed = JSON.parse(raw) as unknown

    if (parsed && typeof parsed === 'object' && typeof (parsed as { schemaVersion?: unknown }).schemaVersion === 'number' && 'data' in parsed) {
      const envelope = parsed as { schemaVersion: number; data: unknown }
      return migrate(envelope.data, envelope.schemaVersion)
    }
    // Geen envelope herkend -> data van vóór schema-versionering (v0).
    return migrate(parsed, 0)
  } catch (e) {
    console.error('RugMaatje: kon data niet laden, start met lege data.', e)
    return defaultData()
  }
}

export function saveData(data: AppData): void {
  const envelope = { schemaVersion: SCHEMA_VERSION, data }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
}

export function resetAllData(): AppData {
  localStorage.removeItem(STORAGE_KEY)
  const fresh = defaultData()
  saveData(fresh)
  return fresh
}

// --- Back-up: volledige export/import als JSON -----------------------------
// Zodat gebruikers hun gegevens kunnen bewaren of overzetten naar een nieuw
// toestel, zonder account en zonder server: gewoon een bestand dat je zelf
// bewaart (bijv. in Bestanden/iCloud) en later weer kunt inladen.

export interface BackupFile {
  app: 'rugmaatje'
  schemaVersion: number
  exportedAt: number
  data: AppData
}

export function createBackup(data: AppData): BackupFile {
  return { app: 'rugmaatje', schemaVersion: SCHEMA_VERSION, exportedAt: Date.now(), data }
}

export function exportBackupJson(data: AppData): string {
  return JSON.stringify(createBackup(data), null, 2)
}

export class BackupParseError extends Error {}

export function parseBackupJson(json: string): AppData {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new BackupParseError('Dit bestand is geen geldige JSON en kan niet gelezen worden.')
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new BackupParseError('Dit bestand bevat geen herkenbare RugMaatje-gegevens.')
  }
  const obj = parsed as Record<string, unknown>

  // Envelope-back-upformaat (met app/schemaVersion/data).
  if ('data' in obj && typeof obj.schemaVersion === 'number') {
    return migrate(obj.data, obj.schemaVersion)
  }
  // Ook een "kaal" AppData-object accepteren (bijv. handmatig bewerkt).
  if ('checkIns' in obj && 'exercises' in obj) {
    return migrate(obj, 0)
  }
  throw new BackupParseError('Dit bestand bevat geen herkenbare RugMaatje-gegevens.')
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
