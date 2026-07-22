import { describe, expect, it } from 'vitest'
import type { Exercise } from '../../types'
import { getTodayProgram } from '../program'

const EXERCISES: Exercise[] = [
  {
    id: 'kracht-1',
    name: 'Kracht oefening',
    goal: '',
    cue: '',
    sets: 2,
    reps: 10,
    durationSec: null,
    enabled: true,
    isCustom: false,
    level: 'basis',
    category: 'kracht',
  },
  {
    id: 'stretch-1',
    name: 'Stretch oefening',
    goal: '',
    cue: '',
    sets: 2,
    reps: null,
    durationSec: 30,
    enabled: true,
    isCustom: false,
    level: 'basis',
    category: 'stretch',
  },
  {
    id: 'uitgeschakeld',
    name: 'Uitgeschakelde oefening',
    goal: '',
    cue: '',
    sets: 1,
    reps: 5,
    durationSec: null,
    enabled: false,
    isCustom: false,
    level: 'basis',
    category: 'stretch',
  },
]

describe('getTodayProgram', () => {
  it('toont bij groen de volledige (ingeschakelde) set', () => {
    const program = getTodayProgram('groen', EXERCISES)
    expect(program.exercises.map((e) => e.id)).toEqual(['kracht-1', 'stretch-1'])
    expect(program.optional).toBe(false)
  })

  it('toont bij rood standaard alleen een optionele stretch', () => {
    const program = getTodayProgram('rood', EXERCISES, true)
    expect(program.exercises.map((e) => e.id)).toEqual(['stretch-1'])
    expect(program.optional).toBe(true)
  })

  it('toont bij rood geen enkele oefening als showOptionalStretchOnRestDay uit staat', () => {
    const program = getTodayProgram('rood', EXERCISES, false)
    expect(program.exercises).toEqual([])
    expect(program.optional).toBe(true)
  })

  it('toont bij rode vlag nooit oefeningen, ongeacht de instelling', () => {
    expect(getTodayProgram('rode_vlag', EXERCISES, true).exercises).toEqual([])
    expect(getTodayProgram('rode_vlag', EXERCISES, false).exercises).toEqual([])
  })
})
