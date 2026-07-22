import { describe, expect, it } from 'vitest'
import type { AppData, CheckIn, Exercise } from '../../types'
import { getNewlyEarnedBadges } from '../badges'
import { DEFAULT_SETTINGS, DEFAULT_STREAK } from '../storage'
import { addDays, todayKey } from '../dates'

function makeAppData(overrides: Partial<AppData> = {}): AppData {
  return {
    checkIns: [],
    exercises: [],
    cyclingLogs: [],
    restLogs: [],
    exerciseCompletions: [],
    physioNotes: [],
    settings: DEFAULT_SETTINGS,
    streak: DEFAULT_STREAK,
    ...overrides,
  }
}

let idCounter = 0
function makeCheckIn(overrides: Partial<CheckIn> & { date: string }): CheckIn {
  idCounter += 1
  return {
    id: `checkin-${idCounter}`,
    timestamp: new Date(`${overrides.date}T08:00:00`).getTime(),
    painScore: 0,
    locations: [],
    radiating: 'geen',
    ...overrides,
  }
}

function makeExercise(overrides: Partial<Exercise> & { id: string }): Exercise {
  return {
    name: overrides.id,
    goal: '',
    cue: '',
    sets: 2,
    reps: 10,
    durationSec: null,
    enabled: true,
    isCustom: false,
    level: 'basis',
    category: 'kracht',
    ...overrides,
  }
}

describe('getNewlyEarnedBadges', () => {
  it('kent "eerste-check-in" toe zodra er 1 check-in is geweest', () => {
    const data = makeAppData({ streak: { ...DEFAULT_STREAK, totalCheckIns: 1 } })
    const earned = getNewlyEarnedBadges(data)
    expect(earned.some((b) => b.id === 'eerste-check-in')).toBe(true)
  })

  it('filtert al verdiende badges eruit, ook al voldoet de check nog steeds', () => {
    const data = makeAppData({
      streak: { ...DEFAULT_STREAK, totalCheckIns: 1, badgesEarned: ['eerste-check-in'] },
    })
    const earned = getNewlyEarnedBadges(data)
    expect(earned.some((b) => b.id === 'eerste-check-in')).toBe(false)
  })

  it('kent "streak-3" pas toe bij een streak van 3 of meer', () => {
    const tooShort = makeAppData({ streak: { ...DEFAULT_STREAK, currentStreak: 2, totalCheckIns: 2 } })
    expect(getNewlyEarnedBadges(tooShort).some((b) => b.id === 'streak-3')).toBe(false)

    const longEnough = makeAppData({ streak: { ...DEFAULT_STREAK, currentStreak: 3, totalCheckIns: 3 } })
    expect(getNewlyEarnedBadges(longEnough).some((b) => b.id === 'streak-3')).toBe(true)
  })

  it('kent "eerste-rustdag" toe op basis van restLogs, zonder dat er een check-in nodig is', () => {
    const data = makeAppData({
      restLogs: [{ id: 'r1', date: todayKey(), timestamp: Date.now() }],
    })
    const earned = getNewlyEarnedBadges(data)
    expect(earned.some((b) => b.id === 'eerste-rustdag')).toBe(true)
    // Geen check-ins gelogd, dus check-in-gerelateerde badges mogen niet meekomen.
    expect(earned.some((b) => b.id === 'eerste-check-in')).toBe(false)
  })

  it('kent "eerste-fietsrit" toe zodra er een fietslog is', () => {
    const data = makeAppData({
      cyclingLogs: [{ id: 'c1', date: todayKey(), timestamp: Date.now(), durationMin: 20, feeling: 'geen_last' }],
    })
    const earned = getNewlyEarnedBadges(data)
    expect(earned.some((b) => b.id === 'eerste-fietsrit')).toBe(true)
  })

  it('geeft niets terug als er niets nieuws is verdiend', () => {
    const data = makeAppData()
    expect(getNewlyEarnedBadges(data)).toEqual([])
  })

  it('kent "twee-weken-geen-rode-vlag" pas toe na voldoende gelogde dagen zonder rode vlag', () => {
    const today = todayKey()
    const teWeinigDagen = makeAppData({
      checkIns: [0, 1, 2].map((i) => makeCheckIn({ date: addDays(today, -i), painScore: 0 })),
    })
    expect(getNewlyEarnedBadges(teWeinigDagen).some((b) => b.id === 'twee-weken-geen-rode-vlag')).toBe(false)

    const genoegVeiligeDagen = makeAppData({
      checkIns: Array.from({ length: 10 }, (_, i) => makeCheckIn({ date: addDays(today, -i), painScore: 0 })),
    })
    expect(getNewlyEarnedBadges(genoegVeiligeDagen).some((b) => b.id === 'twee-weken-geen-rode-vlag')).toBe(true)
  })

  it('kent "twee-weken-geen-rode-vlag" niet toe als er een rode vlag tussen zat', () => {
    const today = todayKey()
    const checkIns = Array.from({ length: 9 }, (_, i) => makeCheckIn({ date: addDays(today, -i), painScore: 0 }))
    checkIns.push(makeCheckIn({ date: addDays(today, -9), painScore: 0, radiating: 'tintelingen' }))
    const data = makeAppData({ checkIns })
    expect(getNewlyEarnedBadges(data).some((b) => b.id === 'twee-weken-geen-rode-vlag')).toBe(false)
  })

  it('kent "eerste-opgebouwd" toe zodra een oefening het niveau opgebouwd heeft', () => {
    const data = makeAppData({ exercises: [makeExercise({ id: 'crunch', level: 'opgebouwd' })] })
    expect(getNewlyEarnedBadges(data).some((b) => b.id === 'eerste-opgebouwd')).toBe(true)

    const nogNiet = makeAppData({ exercises: [makeExercise({ id: 'crunch', level: 'basis' })] })
    expect(getNewlyEarnedBadges(nogNiet).some((b) => b.id === 'eerste-opgebouwd')).toBe(false)
  })

  it('kent "pijn-neemt-af" toe bij een duidelijk dalende pijntrend', () => {
    const today = todayKey()
    const checkIns = [
      ...Array.from({ length: 5 }, (_, i) => makeCheckIn({ date: addDays(today, -i), painScore: 1 })),
      ...Array.from({ length: 5 }, (_, i) => makeCheckIn({ date: addDays(today, -(14 + i)), painScore: 5 })),
    ]
    const data = makeAppData({ checkIns })
    expect(getNewlyEarnedBadges(data).some((b) => b.id === 'pijn-neemt-af')).toBe(true)
  })

  it('kent "pijn-neemt-af" niet toe bij een stabiele of oplopende trend', () => {
    const today = todayKey()
    const checkIns = [
      ...Array.from({ length: 5 }, (_, i) => makeCheckIn({ date: addDays(today, -i), painScore: 3 })),
      ...Array.from({ length: 5 }, (_, i) => makeCheckIn({ date: addDays(today, -(14 + i)), painScore: 3 })),
    ]
    const data = makeAppData({ checkIns })
    expect(getNewlyEarnedBadges(data).some((b) => b.id === 'pijn-neemt-af')).toBe(false)
  })
})
