import { describe, expect, it } from 'vitest'
import type { AppData, Exercise, ExerciseFeedbackLog } from '../../types'
import { preferenceWeights, rankPreferences } from '../preferences'
import { DEFAULT_SETTINGS, DEFAULT_STREAK } from '../storage'

function makeExercise(id: string): Exercise {
  return {
    id,
    name: id,
    goal: '',
    cue: '',
    sets: 2,
    reps: 10,
    durationSec: null,
    enabled: true,
    isCustom: false,
    level: 'basis',
    category: 'kracht',
  }
}

let n = 0
function fb(exerciseId: string, feeling: ExerciseFeedbackLog['feeling']): ExerciseFeedbackLog {
  n += 1
  return { id: `f${n}`, exerciseId, feeling, date: '2026-01-01', timestamp: n }
}

function makeAppData(overrides: Partial<AppData> = {}): AppData {
  return {
    checkIns: [],
    exercises: [makeExercise('a'), makeExercise('b')],
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

describe('rankPreferences', () => {
  it('sorteert oefeningen van meest fijn naar meest vervelend', () => {
    const data = makeAppData({
      exerciseFeedback: [fb('a', 'vervelend'), fb('a', 'vervelend'), fb('b', 'fijn'), fb('b', 'fijn')],
    })
    const ranked = rankPreferences(data)
    expect(ranked.map((r) => r.exerciseId)).toEqual(['b', 'a'])
    expect(ranked[0].score).toBe(2)
    expect(ranked[1].score).toBe(-2)
  })

  it('negeert feedback voor oefeningen die niet meer bestaan', () => {
    const data = makeAppData({ exerciseFeedback: [fb('bestaat-niet', 'fijn')] })
    expect(rankPreferences(data)).toHaveLength(0)
  })
})

describe('preferenceWeights', () => {
  it('begrenst het gewicht tot [-2, 2] zodat één oefening de selectie niet domineert', () => {
    const data = makeAppData({
      exerciseFeedback: [fb('a', 'fijn'), fb('a', 'fijn'), fb('a', 'fijn'), fb('a', 'fijn'), fb('a', 'fijn')],
    })
    expect(preferenceWeights(data).get('a')).toBe(2)
  })
})
