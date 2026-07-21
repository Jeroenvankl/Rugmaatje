import { describe, expect, it } from 'vitest'
import type { AppData } from '../../types'
import { getNewlyEarnedBadges } from '../badges'
import { DEFAULT_SETTINGS, DEFAULT_STREAK } from '../storage'
import { todayKey } from '../dates'

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
})
