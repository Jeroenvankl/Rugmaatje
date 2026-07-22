import { describe, expect, it } from 'vitest'
import type { CheckIn, StreakData } from '../../types'
import { recalculateStreak } from '../streak'
import { addDays, todayKey } from '../dates'

const BASE: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastCheckInDate: null,
  totalCheckIns: 0,
  badgesEarned: ['eerste-check-in'],
}

let idCounter = 0
function makeCheckIn(date: string): CheckIn {
  idCounter += 1
  return {
    id: `checkin-${idCounter}`,
    date,
    timestamp: new Date(`${date}T08:00:00`).getTime(),
    painScore: 0,
    locations: [],
    radiating: 'geen',
  }
}

describe('recalculateStreak', () => {
  it('geeft alles op 0 zonder check-ins, maar behoudt overige streak-velden', () => {
    const result = recalculateStreak([], BASE, todayKey())
    expect(result.currentStreak).toBe(0)
    expect(result.longestStreak).toBe(0)
    expect(result.lastCheckInDate).toBeNull()
    expect(result.totalCheckIns).toBe(0)
    expect(result.badgesEarned).toEqual(BASE.badgesEarned)
  })

  it('geeft een streak van 1 bij een enkele check-in vandaag', () => {
    const today = todayKey()
    const result = recalculateStreak([makeCheckIn(today)], BASE, today)
    expect(result.currentStreak).toBe(1)
    expect(result.longestStreak).toBe(1)
    expect(result.totalCheckIns).toBe(1)
    expect(result.lastCheckInDate).toBe(today)
  })

  it('telt een reeks opeenvolgende dagen correct op', () => {
    const today = todayKey()
    const checkIns = [4, 3, 2, 1, 0].map((i) => makeCheckIn(addDays(today, -i)))
    const result = recalculateStreak(checkIns, BASE, today)
    expect(result.currentStreak).toBe(5)
    expect(result.longestStreak).toBe(5)
    expect(result.totalCheckIns).toBe(5)
  })

  it('is idempotent voor dubbele check-ins op dezelfde dag', () => {
    const today = todayKey()
    const checkIns = [makeCheckIn(today), makeCheckIn(today), makeCheckIn(addDays(today, -1))]
    const result = recalculateStreak(checkIns, BASE, today)
    expect(result.currentStreak).toBe(2)
    expect(result.totalCheckIns).toBe(2)
  })

  it('reset de huidige streak naar 0 als de laatste check-in langer dan gisteren geleden is', () => {
    const today = todayKey()
    const checkIns = [makeCheckIn(addDays(today, -5)), makeCheckIn(addDays(today, -4))]
    const result = recalculateStreak(checkIns, BASE, today)
    expect(result.currentStreak).toBe(0)
    expect(result.longestStreak).toBe(2)
    expect(result.lastCheckInDate).toBe(addDays(today, -4))
  })

  it('herstelt de streak correct als een gemiste dag achteraf wordt ingevuld (backfill)', () => {
    const today = todayKey()
    // Eerst: check-in van 2 dagen geleden en van vandaag, met een gat op gisteren.
    const withGap = [makeCheckIn(addDays(today, -2)), makeCheckIn(today)]
    const beforeFill = recalculateStreak(withGap, BASE, today)
    expect(beforeFill.currentStreak).toBe(1) // gisteren ontbreekt, dus geen doorlopende reeks

    // Nu vult de gebruiker gisteren alsnog retroactief in (los toegevoegd, dus
    // niet noodzakelijk chronologisch aan het einde van de array).
    const backfilled = [...withGap, makeCheckIn(addDays(today, -1))]
    const afterFill = recalculateStreak(backfilled, BASE, today)
    expect(afterFill.currentStreak).toBe(3)
    expect(afterFill.longestStreak).toBe(3)
    expect(afterFill.totalCheckIns).toBe(3)
  })

  it('herberekent de langste streak zelfs als eerdere (buggy) data een verkeerde waarde had opgeslagen', () => {
    const today = todayKey()
    const checkIns = [3, 2, 1, 0].map((i) => makeCheckIn(addDays(today, -i)))
    const corruptPrevious: StreakData = { ...BASE, longestStreak: 999 }
    const result = recalculateStreak(checkIns, corruptPrevious, today)
    expect(result.longestStreak).toBe(4)
  })
})
