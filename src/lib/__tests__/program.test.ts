import { describe, expect, it } from 'vitest'
import type { Exercise } from '../../types'
import { exerciseCountForPainScore, getTodayProgram, pickDailyVariation } from '../program'

const THRESHOLDS = { painThresholdGroenMax: 1, painThresholdOranjeMax: 3 }

function makeExercise(id: string, category: Exercise['category'], enabled = true): Exercise {
  return {
    id,
    name: id,
    goal: '',
    cue: '',
    sets: 2,
    reps: 10,
    durationSec: null,
    enabled,
    isCustom: false,
    level: 'basis',
    category,
  }
}

const EXERCISES: Exercise[] = [
  makeExercise('kracht-1', 'kracht'),
  makeExercise('kracht-2', 'kracht'),
  makeExercise('mobiliteit-1', 'mobiliteit'),
  makeExercise('mobiliteit-2', 'mobiliteit'),
  makeExercise('stretch-1', 'stretch'),
  makeExercise('stretch-2', 'stretch'),
  makeExercise('uitgeschakeld', 'stretch', false),
]

describe('exerciseCountForPainScore', () => {
  it('geeft het maximum bij pijn op of onder de groen-drempel', () => {
    expect(exerciseCountForPainScore(0, THRESHOLDS)).toBe(10)
    expect(exerciseCountForPainScore(1, THRESHOLDS)).toBe(10)
  })

  it('geeft 7 bij pijnscore 2 (midden van de amber-band, met standaarddrempels)', () => {
    expect(exerciseCountForPainScore(2, THRESHOLDS)).toBe(7)
  })

  it('geeft 5 bij pijnscore op de amber-drempel (net voor een rustdag)', () => {
    expect(exerciseCountForPainScore(3, THRESHOLDS)).toBe(5)
  })

  it('geeft ook 5 boven de amber-drempel (al is dat in de praktijk een rustdag)', () => {
    expect(exerciseCountForPainScore(6, THRESHOLDS)).toBe(5)
  })

  it('schaalt mee als de drempels breder ingesteld staan', () => {
    const wideThresholds = { painThresholdGroenMax: 0, painThresholdOranjeMax: 5 }
    expect(exerciseCountForPainScore(0, wideThresholds)).toBe(10)
    expect(exerciseCountForPainScore(5, wideThresholds)).toBe(5)
    // Middenwaarde binnen een bredere amber-band ligt tussen 7 en 5 in.
    const mid = exerciseCountForPainScore(3, wideThresholds)
    expect(mid).toBeLessThanOrEqual(7)
    expect(mid).toBeGreaterThanOrEqual(5)
  })
})

describe('pickDailyVariation', () => {
  it('geeft dezelfde selectie voor dezelfde datum en pool (stabiel binnen één dag)', () => {
    const first = pickDailyVariation(EXERCISES, 3, '2026-01-10')
    const second = pickDailyVariation(EXERCISES, 3, '2026-01-10')
    expect(first.map((e) => e.id)).toEqual(second.map((e) => e.id))
  })

  it('geeft niet altijd dezelfde selectie op een andere datum', () => {
    const day1 = pickDailyVariation(EXERCISES, 3, '2026-01-10').map((e) => e.id)
    const day2 = pickDailyVariation(EXERCISES, 3, '2026-01-11').map((e) => e.id)
    expect(day1).not.toEqual(day2)
  })

  it('geeft nooit meer terug dan er in de pool zitten', () => {
    const result = pickDailyVariation(EXERCISES.slice(0, 2), 10, '2026-01-10')
    expect(result.length).toBe(2)
  })
})

describe('getTodayProgram', () => {
  it('kiest bij groen een gevarieerde subset uit alle categorieën, gelimiteerd door de score', () => {
    const settings = { ...THRESHOLDS, showOptionalStretchOnRestDay: true }
    const program = getTodayProgram('groen', EXERCISES, 0, settings, '2026-01-10')
    // 6 ingeschakelde oefeningen in totaal, score 0 geeft een cap van 10 -> alles wat enabled is.
    expect(program.exercises.length).toBe(6)
    expect(program.exercises.every((e) => e.enabled)).toBe(true)
    expect(program.optional).toBe(false)
  })

  it('sluit kracht-oefeningen uit bij oranje, en beperkt het aantal op basis van de score', () => {
    const settings = { ...THRESHOLDS, showOptionalStretchOnRestDay: true }
    const program = getTodayProgram('oranje', EXERCISES, 3, settings, '2026-01-10')
    expect(program.exercises.every((e) => e.category !== 'kracht')).toBe(true)
    expect(program.exercises.length).toBeLessThanOrEqual(5)
  })

  it('toont bij rood standaard alleen een optionele stretch, ongecapt', () => {
    const settings = { ...THRESHOLDS, showOptionalStretchOnRestDay: true }
    const program = getTodayProgram('rood', EXERCISES, 6, settings, '2026-01-10')
    expect(program.exercises.map((e) => e.id)).toEqual(['stretch-1', 'stretch-2'])
    expect(program.optional).toBe(true)
  })

  it('toont bij rood geen enkele oefening als showOptionalStretchOnRestDay uit staat', () => {
    const settings = { ...THRESHOLDS, showOptionalStretchOnRestDay: false }
    const program = getTodayProgram('rood', EXERCISES, 6, settings, '2026-01-10')
    expect(program.exercises).toEqual([])
    expect(program.optional).toBe(true)
  })

  it('toont bij rode vlag nooit oefeningen, ongeacht de instelling', () => {
    const onSettings = { ...THRESHOLDS, showOptionalStretchOnRestDay: true }
    const offSettings = { ...THRESHOLDS, showOptionalStretchOnRestDay: false }
    expect(getTodayProgram('rode_vlag', EXERCISES, 8, onSettings, '2026-01-10').exercises).toEqual([])
    expect(getTodayProgram('rode_vlag', EXERCISES, 8, offSettings, '2026-01-10').exercises).toEqual([])
  })
})
