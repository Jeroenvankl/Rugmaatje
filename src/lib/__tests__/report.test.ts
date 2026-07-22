import { describe, expect, it } from 'vitest'
import type { AppData, CheckIn } from '../../types'
import { buildPhysioReport, formatPhysioReportText } from '../report'
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
    settings: DEFAULT_SETTINGS,
    streak: DEFAULT_STREAK,
    ...overrides,
  }
}

describe('buildPhysioReport', () => {
  it('berekent de gemiddelde pijnscore en stoplicht-verdeling over de gekozen periode', () => {
    const today = todayKey()
    const checkIns = [
      makeCheckIn({ date: addDays(today, -2), painScore: 0 }), // groen
      makeCheckIn({ date: addDays(today, -1), painScore: 2 }), // oranje
      makeCheckIn({ date: today, painScore: 0 }), // groen
    ]
    const data = makeAppData({ checkIns })
    const report = buildPhysioReport(data, 3)

    expect(report.daysWithCheckIn).toBe(3)
    // buildPhysioReport rondt het gemiddelde af op 1 decimaal.
    expect(report.avgPainScore).toBeCloseTo(0.7, 5)
    expect(report.levelCounts.groen).toBe(2)
    expect(report.levelCounts.oranje).toBe(1)
  })

  it('signaleert rode-vlag-momenten in de periode', () => {
    const today = todayKey()
    const checkIns = [makeCheckIn({ date: today, painScore: 0, radiating: 'tintelingen' })]
    const data = makeAppData({ checkIns })
    const report = buildPhysioReport(data, 7)

    expect(report.levelCounts.rode_vlag).toBe(1)
    expect(report.redFlagMoments).toHaveLength(1)
    expect(report.redFlagMoments[0].date).toBe(today)
  })

  it('telt retroactief ingevulde check-ins apart, voor transparantie richting de fysio', () => {
    const today = todayKey()
    const checkIns = [
      makeCheckIn({ date: addDays(today, -1), painScore: 1, retroactive: true }),
      makeCheckIn({ date: today, painScore: 1 }),
    ]
    const report = buildPhysioReport(makeAppData({ checkIns }), 7)
    expect(report.retroactiveCheckIns).toBe(1)
  })

  it('telt dagen zonder check-in niet mee voor het gemiddelde', () => {
    const today = todayKey()
    const data = makeAppData({ checkIns: [makeCheckIn({ date: today, painScore: 4 })] })
    const report = buildPhysioReport(data, 7)

    expect(report.daysWithCheckIn).toBe(1)
    expect(report.avgPainScore).toBe(4)
  })

  it('geeft null voor het gemiddelde als er helemaal geen check-ins zijn', () => {
    const report = buildPhysioReport(makeAppData(), 7)
    expect(report.avgPainScore).toBeNull()
    expect(report.daysWithCheckIn).toBe(0)
  })
})

describe('formatPhysioReportText', () => {
  it('bevat de belangrijkste onderdelen van het rapport als leesbare tekst', () => {
    const today = todayKey()
    const data = makeAppData({ checkIns: [makeCheckIn({ date: today, painScore: 1 })] })
    const text = formatPhysioReportText(buildPhysioReport(data, 7))

    expect(text).toContain('RugMaatje')
    expect(text).toContain('Stoplicht-verdeling')
    expect(text).toContain('Huidige streak')
    expect(text).toContain('Geen rode-vlag-momenten in deze periode.')
  })
})
