import { describe, expect, it } from 'vitest'
import type { AppData } from '../../types'
import { journeyProgress } from '../journey'
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

describe('journeyProgress', () => {
  it('heeft bij een lege app nog geen mijlpalen behaald en wijst "de eerste stap" aan', () => {
    const p = journeyProgress(makeAppData())
    expect(p.achievedCount).toBe(0)
    expect(p.nextMilestone?.id).toBe('eerste-check-in')
    expect(p.total).toBeGreaterThan(0)
  })

  it('markeert de eerste mijlpaal als behaald na een check-in', () => {
    const p = journeyProgress(makeAppData({ streak: { ...DEFAULT_STREAK, totalCheckIns: 1 } }))
    const first = p.milestones.find((m) => m.id === 'eerste-check-in')
    expect(first?.achieved).toBe(true)
    expect(p.achievedCount).toBe(1)
  })

  it('ontgrendelt de week-mijlpaal bij een langste streak van 7', () => {
    const p = journeyProgress(makeAppData({ streak: { ...DEFAULT_STREAK, longestStreak: 7 } }))
    expect(p.milestones.find((m) => m.id === 'eerste-week')?.achieved).toBe(true)
  })

  it('ontgrendelt "volleybal vrijgegeven" op basis van de fysio-instelling', () => {
    const p = journeyProgress(
      makeAppData({ settings: { ...DEFAULT_SETTINGS, volleyball: { unlockedByPhysio: true, currentPhase: 1 } } }),
    )
    expect(p.milestones.find((m) => m.id === 'volleybal-vrij')?.achieved).toBe(true)
  })
})
