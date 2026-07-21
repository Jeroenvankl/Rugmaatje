import { describe, expect, it } from 'vitest'
import type { StreakData } from '../../types'
import { updateStreakForCheckIn } from '../streak'
import { addDays, todayKey } from '../dates'

const BASE: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastCheckInDate: null,
  totalCheckIns: 0,
  badgesEarned: [],
}

describe('updateStreakForCheckIn', () => {
  it('start een nieuwe streak van 1 bij de allereerste check-in', () => {
    const today = todayKey()
    const result = updateStreakForCheckIn(BASE, today)
    expect(result.currentStreak).toBe(1)
    expect(result.longestStreak).toBe(1)
    expect(result.lastCheckInDate).toBe(today)
    expect(result.totalCheckIns).toBe(1)
  })

  it('telt de streak op bij een check-in op de opeenvolgende dag', () => {
    const today = todayKey()
    const yesterday = addDays(today, -1)
    const streak: StreakData = { ...BASE, currentStreak: 4, longestStreak: 4, lastCheckInDate: yesterday, totalCheckIns: 4 }
    const result = updateStreakForCheckIn(streak, today)
    expect(result.currentStreak).toBe(5)
    expect(result.longestStreak).toBe(5)
    expect(result.totalCheckIns).toBe(5)
  })

  it('is idempotent: nogmaals inchecken op dezelfde dag verandert niets', () => {
    const today = todayKey()
    const streak: StreakData = { ...BASE, currentStreak: 3, longestStreak: 3, lastCheckInDate: today, totalCheckIns: 3 }
    const result = updateStreakForCheckIn(streak, today)
    expect(result).toEqual(streak)
    expect(result.totalCheckIns).toBe(3)
  })

  it('reset de streak naar 1 als er een dag is overgeslagen', () => {
    const today = todayKey()
    const twoDaysAgo = addDays(today, -2)
    const streak: StreakData = { ...BASE, currentStreak: 6, longestStreak: 6, lastCheckInDate: twoDaysAgo, totalCheckIns: 6 }
    const result = updateStreakForCheckIn(streak, today)
    expect(result.currentStreak).toBe(1)
    expect(result.totalCheckIns).toBe(7)
  })

  it('behoudt de langste streak ooit, ook nadat de huidige streak is gereset', () => {
    const today = todayKey()
    const twoDaysAgo = addDays(today, -2)
    const streak: StreakData = { ...BASE, currentStreak: 10, longestStreak: 10, lastCheckInDate: twoDaysAgo, totalCheckIns: 20 }
    const result = updateStreakForCheckIn(streak, today)
    expect(result.currentStreak).toBe(1)
    expect(result.longestStreak).toBe(10)
  })
})
