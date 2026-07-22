import type { AppData, Exercise, ExerciseFeedbackLog } from '../types'

export interface ExercisePreference {
  exerciseId: string
  fijn: number
  neutraal: number
  vervelend: number
  score: number // fijn - vervelend
  total: number
}

/** Telt de feedback per oefening op tot een voorkeurs-score (fijn min vervelend). */
export function computePreferences(feedback: ExerciseFeedbackLog[]): Map<string, ExercisePreference> {
  const map = new Map<string, ExercisePreference>()
  for (const f of feedback) {
    const p =
      map.get(f.exerciseId) ??
      { exerciseId: f.exerciseId, fijn: 0, neutraal: 0, vervelend: 0, score: 0, total: 0 }
    p[f.feeling] += 1
    p.total += 1
    p.score = p.fijn - p.vervelend
    map.set(f.exerciseId, p)
  }
  return map
}

export interface RankedPreference extends ExercisePreference {
  exercise: Exercise
}

/** Voorkeurslijst (oefeningen met feedback), gesorteerd van meest fijn naar meest vervelend. */
export function rankPreferences(data: AppData): RankedPreference[] {
  const prefs = computePreferences(data.exerciseFeedback)
  const byId = new Map(data.exercises.map((e) => [e.id, e]))
  const out: RankedPreference[] = []
  for (const p of prefs.values()) {
    const exercise = byId.get(p.exerciseId)
    if (exercise) out.push({ ...p, exercise })
  }
  out.sort((a, b) => b.score - a.score || b.total - a.total)
  return out
}

/**
 * Voorkeurs-gewicht per oefening-id, om de dagelijkse selectie licht bij te
 * sturen: prettige oefeningen komen iets vaker naar voren, als "vervelend"
 * ervaren oefeningen iets minder — maar nooit helemaal weg (de fysio-set blijft
 * gevarieerd en volledig beschikbaar). 0 = neutraal.
 */
export function preferenceWeights(data: AppData): Map<string, number> {
  const prefs = computePreferences(data.exerciseFeedback)
  const weights = new Map<string, number>()
  for (const p of prefs.values()) {
    // Begrens de invloed zodat één oefening de selectie niet kan domineren.
    weights.set(p.exerciseId, Math.max(-2, Math.min(2, p.score)))
  }
  return weights
}
