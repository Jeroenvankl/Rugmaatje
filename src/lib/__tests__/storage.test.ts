import { beforeEach, describe, expect, it } from 'vitest'
import { loadData, parseBackupJson } from '../storage'
import { DEFAULT_EXERCISES } from '../../data/defaultExercises'

const STORAGE_KEY = 'rugmaatje_data_v1'

function createMockLocalStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => store.clear(),
    get length() {
      return store.size
    },
    key: () => null,
  } satisfies Storage
}

beforeEach(() => {
  globalThis.localStorage = createMockLocalStorage()
})

describe('loadData migratie naar nieuwe standaardoefeningen (v1 -> v2)', () => {
  it('vult ontbrekende default-oefeningen aan zonder bestaande (aangepaste) oefeningen te overschrijven', () => {
    const aangepasteOefening = { ...DEFAULT_EXERCISES[0], name: 'Door gebruiker aangepaste naam' }
    const legacyEnvelope = {
      schemaVersion: 1,
      data: {
        checkIns: [],
        exercises: [aangepasteOefening], // oude gebruiker had (nog) maar 1 van de standaardoefeningen
        cyclingLogs: [],
        restLogs: [],
        exerciseCompletions: [],
        settings: {
          disclaimerSeenAt: null,
          painThresholdGroenMax: 1,
          painThresholdOranjeMax: 3,
          volleyball: { unlockedByPhysio: false, currentPhase: 1 },
          reminder: { enabled: false, time: '08:00' },
        },
        streak: { currentStreak: 2, longestStreak: 5, lastCheckInDate: '2026-01-01', totalCheckIns: 5, badgesEarned: [] },
      },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyEnvelope))

    const result = loadData()

    // De aangepaste oefening blijft behouden zoals de gebruiker die had...
    const kept = result.exercises.find((e) => e.id === aangepasteOefening.id)
    expect(kept?.name).toBe('Door gebruiker aangepaste naam')
    // ...en alle andere (ontbrekende) standaardoefeningen zijn aangevuld.
    expect(result.exercises.length).toBe(DEFAULT_EXERCISES.length)
    // Streak-data van vóór de migratie blijft intact.
    expect(result.streak.currentStreak).toBe(2)
    expect(result.streak.longestStreak).toBe(5)
  })
})

describe('parseBackupJson', () => {
  it('gooit een duidelijke fout bij ongeldige JSON', () => {
    expect(() => parseBackupJson('dit is geen json')).toThrow(/geldige JSON/)
  })

  it('gooit een duidelijke fout bij een onherkenbaar object', () => {
    expect(() => parseBackupJson(JSON.stringify({ foo: 'bar' }))).toThrow(/geen herkenbare RugMaatje-gegevens/)
  })

  it('accepteert een kaal AppData-object zonder envelope', () => {
    const bare = {
      checkIns: [],
      exercises: DEFAULT_EXERCISES,
      cyclingLogs: [],
      restLogs: [],
      exerciseCompletions: [],
      settings: {},
      streak: {},
    }
    const result = parseBackupJson(JSON.stringify(bare))
    expect(result.exercises.length).toBe(DEFAULT_EXERCISES.length)
  })
})
