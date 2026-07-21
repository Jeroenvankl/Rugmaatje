import { describe, expect, it } from 'vitest'
import type { CheckIn, Settings } from '../../types'
import { evaluateStoplight, isProgressionEligible } from '../stoplight'
import { addDays, todayKey } from '../dates'

const SETTINGS: Settings = {
  disclaimerSeenAt: Date.now(),
  painThresholdGroenMax: 1,
  painThresholdOranjeMax: 3,
  volleyball: { unlockedByPhysio: false, currentPhase: 1 },
  reminder: { enabled: false, time: '08:00' },
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

describe('evaluateStoplight', () => {
  it('geeft altijd voorrang aan rode-vlag-symptomen, ongeacht pijnscore', () => {
    const checkIn = makeCheckIn({ date: '2026-01-10', painScore: 0, radiating: 'tintelingen' })
    const result = evaluateStoplight(checkIn, [checkIn], SETTINGS)
    expect(result.level).toBe('rode_vlag')
    expect(result.reasons[0]).toMatch(/rust en contact/)
  })

  it('geeft groen bij lage pijn zonder (of lichte) uitstraling', () => {
    const checkIn = makeCheckIn({ date: '2026-01-10', painScore: 1, radiating: 'geen' })
    const result = evaluateStoplight(checkIn, [checkIn], SETTINGS)
    expect(result.level).toBe('groen')
  })

  it('geeft oranje bij matige pijn binnen de amber-drempel', () => {
    const checkIn = makeCheckIn({ date: '2026-01-10', painScore: 2, radiating: 'geen' })
    const result = evaluateStoplight(checkIn, [checkIn], SETTINGS)
    expect(result.level).toBe('oranje')
  })

  it('geeft rood bij pijnscore boven de amber-drempel', () => {
    const checkIn = makeCheckIn({ date: '2026-01-10', painScore: 4, radiating: 'geen' })
    const result = evaluateStoplight(checkIn, [checkIn], SETTINGS)
    expect(result.level).toBe('rood')
  })

  it('geeft rood wanneer duidelijk erger dan gisteren, ook al valt de score zelf binnen amber', () => {
    const yesterday = makeCheckIn({ date: '2026-01-09', painScore: 0 })
    const today = makeCheckIn({ date: '2026-01-10', painScore: 3 }) // diff = 3
    const result = evaluateStoplight(today, [yesterday, today], SETTINGS)
    expect(result.level).toBe('rood')
    expect(result.reasons.some((r) => r.includes('toegenomen'))).toBe(true)
  })

  it('signaleert twee dagen op rij rood en adviseert de fysio te bellen', () => {
    const yesterday = makeCheckIn({ date: '2026-01-09', painScore: 5 })
    const today = makeCheckIn({ date: '2026-01-10', painScore: 5 })
    const result = evaluateStoplight(today, [yesterday, today], SETTINGS)
    expect(result.level).toBe('rood')
    expect(result.twoDaysRoodInARow).toBe(true)
    expect(result.reasons.some((r) => r.includes('tweede dag'))).toBe(true)
  })

  it('vlagt geen "twee dagen op rij rood" als gisteren geen rood was', () => {
    const yesterday = makeCheckIn({ date: '2026-01-09', painScore: 0 })
    const today = makeCheckIn({ date: '2026-01-10', painScore: 5 })
    const result = evaluateStoplight(today, [yesterday, today], SETTINGS)
    expect(result.level).toBe('rood')
    expect(result.twoDaysRoodInARow).toBe(false)
  })
})

describe('isProgressionEligible', () => {
  it('is true bij 5+ groene dagen en 0 rode dagen in de laatste 7 dagen', () => {
    const today = todayKey()
    const checkIns: CheckIn[] = [0, 1, 2, 3, 4].map((i) =>
      makeCheckIn({ date: addDays(today, -i), painScore: 0, radiating: 'geen' }),
    )
    expect(isProgressionEligible(checkIns, SETTINGS, today)).toBe(true)
  })

  it('is false zodra er ook maar 1 rode dag tussen zit, zelfs met 5+ groene dagen', () => {
    const today = todayKey()
    const checkIns: CheckIn[] = [0, 1, 2, 3, 4].map((i) =>
      makeCheckIn({ date: addDays(today, -i), painScore: 0, radiating: 'geen' }),
    )
    checkIns.push(makeCheckIn({ date: addDays(today, -5), painScore: 8 }))
    expect(isProgressionEligible(checkIns, SETTINGS, today)).toBe(false)
  })

  it('is false met minder dan 5 groene dagen', () => {
    const today = todayKey()
    const checkIns: CheckIn[] = [0, 1, 2].map((i) =>
      makeCheckIn({ date: addDays(today, -i), painScore: 0, radiating: 'geen' }),
    )
    expect(isProgressionEligible(checkIns, SETTINGS, today)).toBe(false)
  })
})
