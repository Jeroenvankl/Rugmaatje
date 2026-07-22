import { describe, expect, it } from 'vitest'
import type { AppData, CheckIn } from '../../types'
import { buildWeeklySummaries, countLocations } from '../weekly'
import { DEFAULT_SETTINGS, DEFAULT_STREAK } from '../storage'
import { addDays, todayKey } from '../dates'

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

function makeAppData(overrides: Partial<AppData> = {}): AppData {
  return {
    checkIns: [],
    exercises: [],
    cyclingLogs: [],
    restLogs: [],
    exerciseCompletions: [],
    exerciseFeedback: [],
    physioNotes: [],
    settings: DEFAULT_SETTINGS,
    streak: DEFAULT_STREAK,
    ...overrides,
  }
}

describe('buildWeeklySummaries', () => {
  it('groepeert check-ins per week (maandag t/m zondag) en berekent het gemiddelde', () => {
    const today = todayKey()
    const checkIns = [0, 1, 2, 3, 4, 5, 6].map((i) => makeCheckIn({ date: addDays(today, -i), painScore: 2 }))
    const data = makeAppData({ checkIns })
    const summaries = buildWeeklySummaries(data, 2, today)

    expect(summaries).toHaveLength(2)
    const totalLogged = summaries.reduce((sum, w) => sum + w.daysLogged, 0)
    expect(totalLogged).toBe(7)
    const weekWithData = summaries.find((w) => w.daysLogged > 0)
    expect(weekWithData?.avgPainScore).toBe(2)
  })

  it('telt oefen-, rust- en fietsdagen per week', () => {
    const today = todayKey()
    const data = makeAppData({
      exerciseCompletions: [{ id: 'e1', date: today, timestamp: Date.now(), exerciseIds: ['x'], level: 'groen' }],
      restLogs: [{ id: 'r1', date: addDays(today, -1), timestamp: Date.now() }],
      cyclingLogs: [{ id: 'c1', date: addDays(today, -2), timestamp: Date.now(), durationMin: 20, feeling: 'geen_last' }],
    })
    const summaries = buildWeeklySummaries(data, 1, today)
    const week = summaries[0]
    expect(week.exerciseDays).toBe(1)
    expect(week.restDays).toBe(1)
    expect(week.cyclingDays).toBe(1)
  })

  it('berekent het gemiddelde van slaapkwaliteit en ochtendstijfheid, alleen over dagen waar dat is ingevuld', () => {
    const today = todayKey()
    const checkIns = [
      makeCheckIn({ date: today, painScore: 1, sleepQuality: 4, morningStiffness: 2 }),
      makeCheckIn({ date: addDays(today, -1), painScore: 1 }), // geen slaap/stijfheid ingevuld
    ]
    const data = makeAppData({ checkIns })
    const week = buildWeeklySummaries(data, 1, today)[0]
    expect(week.avgSleepQuality).toBe(4)
    expect(week.avgMorningStiffness).toBe(2)
  })

  it('geeft null voor gemiddeldes als er geen check-ins in de week zitten', () => {
    const today = todayKey()
    const week = buildWeeklySummaries(makeAppData(), 1, today)[0]
    expect(week.avgPainScore).toBeNull()
    expect(week.avgSleepQuality).toBeNull()
    expect(week.avgMorningStiffness).toBeNull()
    expect(week.daysLogged).toBe(0)
  })
})

describe('countLocations', () => {
  it('telt hoe vaak elke locatie voorkomt', () => {
    const checkIns = [
      makeCheckIn({ date: '2026-01-01', locations: ['onderrug_rechts', 'heup'] }),
      makeCheckIn({ date: '2026-01-02', locations: ['onderrug_rechts'] }),
    ]
    const counts = countLocations(checkIns)
    expect(counts.onderrug_rechts).toBe(2)
    expect(counts.heup).toBe(1)
    expect(counts.onderrug_links).toBeUndefined()
  })
})
