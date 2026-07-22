import { describe, expect, it } from 'vitest'
import type { AppData } from '../../types'
import { computeWeeklyGoalProgress } from '../goals'
import { DEFAULT_SETTINGS, DEFAULT_STREAK } from '../storage'
import { addDays, todayKey } from '../dates'

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

describe('computeWeeklyGoalProgress', () => {
  it('telt dagen met oefenen of fietsen als actief, uniek per dag', () => {
    const today = todayKey()
    const data = makeAppData({
      exerciseCompletions: [
        { id: 'e1', date: today, timestamp: 0, exerciseIds: [], level: 'groen' },
        { id: 'e2', date: today, timestamp: 1, exerciseIds: [], level: 'groen' }, // zelfde dag, telt 1x
        { id: 'e3', date: addDays(today, -1), timestamp: 0, exerciseIds: [], level: 'groen' },
      ],
      cyclingLogs: [{ id: 'c1', date: addDays(today, -2), timestamp: 0, durationMin: 20, feeling: 'geen_last' }],
    })
    const p = computeWeeklyGoalProgress(data, today)
    expect(p.achieved).toBe(3)
  })

  it('markeert het doel als gehaald zodra het aantal actieve dagen het doel bereikt', () => {
    const today = todayKey()
    const data = makeAppData({
      settings: { ...DEFAULT_SETTINGS, weeklyMovementGoal: 2 },
      exerciseCompletions: [
        { id: 'e1', date: today, timestamp: 0, exerciseIds: [], level: 'groen' },
        { id: 'e2', date: addDays(today, -1), timestamp: 0, exerciseIds: [], level: 'groen' },
      ],
    })
    const p = computeWeeklyGoalProgress(data, today)
    expect(p.goal).toBe(2)
    expect(p.reached).toBe(true)
  })

  it('telt rustdagen niet mee als actief, maar straft ze ook niet af', () => {
    const today = todayKey()
    const data = makeAppData({ restLogs: [{ id: 'r1', date: today, timestamp: 0 }] })
    const p = computeWeeklyGoalProgress(data, today)
    expect(p.achieved).toBe(0)
    expect(p.reached).toBe(false)
  })
})
