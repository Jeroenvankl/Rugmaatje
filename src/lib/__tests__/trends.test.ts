import { describe, expect, it } from 'vitest'
import type { CheckIn } from '../../types'
import { comparePainTrend, hasEnoughDataForTrend, MIN_DAYS_FOR_TREND } from '../trends'
import { addDays, todayKey } from '../dates'

let idCounter = 0
function makeCheckIn(date: string, painScore: number): CheckIn {
  idCounter += 1
  return {
    id: `checkin-${idCounter}`,
    date,
    timestamp: new Date(`${date}T08:00:00`).getTime(),
    painScore,
    locations: [],
    radiating: 'geen',
  }
}

describe('comparePainTrend', () => {
  it('berekent een negatieve delta als de pijn is afgenomen t.o.v. de vorige periode', () => {
    const today = todayKey()
    const checkIns: CheckIn[] = []
    // Huidige periode (dag -0 t/m -6): gemiddeld laag.
    for (let i = 0; i < 7; i++) checkIns.push(makeCheckIn(addDays(today, -i), 1))
    // Vorige periode (dag -7 t/m -13): gemiddeld hoger.
    for (let i = 7; i < 14; i++) checkIns.push(makeCheckIn(addDays(today, -i), 4))

    const trend = comparePainTrend(checkIns, today, 7)
    expect(trend.current.avgPainScore).toBe(1)
    expect(trend.previous.avgPainScore).toBe(4)
    expect(trend.delta).toBe(-3)
  })

  it('geeft delta null als een van beide periodes geen check-ins heeft', () => {
    const today = todayKey()
    const checkIns: CheckIn[] = [makeCheckIn(today, 2)]
    const trend = comparePainTrend(checkIns, today, 7)
    expect(trend.current.avgPainScore).toBe(2)
    expect(trend.previous.avgPainScore).toBeNull()
    expect(trend.delta).toBeNull()
  })
})

describe('hasEnoughDataForTrend', () => {
  it('is false als een van beide periodes te weinig gelogde dagen heeft', () => {
    const today = todayKey()
    const checkIns: CheckIn[] = [makeCheckIn(today, 2)]
    const trend = comparePainTrend(checkIns, today, 7)
    expect(hasEnoughDataForTrend(trend)).toBe(false)
  })

  it('is true zodra beide periodes minstens het minimum aantal dagen hebben', () => {
    const today = todayKey()
    const checkIns: CheckIn[] = []
    for (let i = 0; i < MIN_DAYS_FOR_TREND; i++) checkIns.push(makeCheckIn(addDays(today, -i), 2))
    for (let i = 7; i < 7 + MIN_DAYS_FOR_TREND; i++) checkIns.push(makeCheckIn(addDays(today, -i), 3))
    const trend = comparePainTrend(checkIns, today, 7)
    expect(hasEnoughDataForTrend(trend)).toBe(true)
  })
})
