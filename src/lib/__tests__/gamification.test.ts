import { describe, expect, it } from 'vitest'
import type { AppData } from '../../types'
import { computeLevel, computeTotalXp, getLevelInfo, xpThreshold } from '../gamification'
import { DEFAULT_SETTINGS, DEFAULT_STREAK } from '../storage'

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

describe('computeTotalXp', () => {
  it('telt XP op uit check-ins, oefensessies, rustdagen en fietsritten', () => {
    const data = makeAppData({
      streak: { ...DEFAULT_STREAK, totalCheckIns: 2 }, // 2 * 10 = 20
      exerciseCompletions: [{ id: 'e1', date: '2026-01-01', timestamp: 0, exerciseIds: [], level: 'groen' }], // 15
      restLogs: [{ id: 'r1', date: '2026-01-01', timestamp: 0 }], // 15
      cyclingLogs: [{ id: 'c1', date: '2026-01-01', timestamp: 0, durationMin: 20, feeling: 'geen_last' }], // 10
    })
    expect(computeTotalXp(data)).toBe(20 + 15 + 15 + 10)
  })

  it('geeft rust evenveel XP als een oefensessie (geen prikkel tot overbelasting)', () => {
    const rustOnly = makeAppData({ restLogs: [{ id: 'r1', date: '2026-01-01', timestamp: 0 }] })
    const oefenOnly = makeAppData({
      exerciseCompletions: [{ id: 'e1', date: '2026-01-01', timestamp: 0, exerciseIds: [], level: 'groen' }],
    })
    expect(computeTotalXp(rustOnly)).toBe(computeTotalXp(oefenOnly))
  })
})

describe('computeLevel', () => {
  it('start op level 1 bij 0 XP', () => {
    const info = computeLevel(0)
    expect(info.level).toBe(1)
    expect(info.progress).toBe(0)
  })

  it('gaat naar level 2 zodra de drempel is gehaald', () => {
    expect(computeLevel(xpThreshold(2)).level).toBe(2)
    expect(computeLevel(xpThreshold(2) - 1).level).toBe(1)
  })

  it('berekent de voortgang binnen een level correct', () => {
    const base = xpThreshold(2)
    const span = xpThreshold(3) - base
    const info = computeLevel(base + Math.floor(span / 2))
    expect(info.level).toBe(2)
    expect(info.progress).toBeGreaterThan(0.4)
    expect(info.progress).toBeLessThan(0.6)
  })
})

describe('getLevelInfo', () => {
  it('combineert XP-berekening en levelbepaling', () => {
    const data = makeAppData({ streak: { ...DEFAULT_STREAK, totalCheckIns: 1 } })
    const info = getLevelInfo(data)
    expect(info.totalXp).toBe(10)
    expect(info.level).toBe(1)
  })
})
