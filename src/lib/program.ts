import type { Exercise, Settings, StoplightLevel } from '../types'

export interface TodayProgram {
  exercises: Exercise[]
  optional: boolean
  intro: string
}

type ThresholdSettings = Pick<Settings, 'painThresholdGroenMax' | 'painThresholdOranjeMax'>

// Hoeveel oefeningen/stretches er maximaal getoond worden, op basis van de
// pijnscore van vandaag. Bij pijn 0..groenMax het meest (top), aflopend naar
// het minst bij de bovenkant van de amber-band (net voor een rustdag).
// Geschaald op de (instelbare) pijndrempels, zodat dit blijft kloppen als
// iemand zijn/haar drempels in Instellingen aanpast.
const TOP_COUNT = 10
const BOTTOM_COUNT = 5

export function exerciseCountForPainScore(painScore: number, settings: ThresholdSettings): number {
  const { painThresholdGroenMax: groenMax, painThresholdOranjeMax: oranjeMax } = settings
  if (painScore <= groenMax) return TOP_COUNT
  if (painScore >= oranjeMax || oranjeMax <= groenMax + 1) return BOTTOM_COUNT

  const midCount = 7
  const span = oranjeMax - (groenMax + 1)
  const t = (painScore - (groenMax + 1)) / span
  return Math.round(midCount - t * (midCount - BOTTOM_COUNT))
}

// Kleine, deterministische pseudo-random generator (mulberry32): met
// dezelfde seed komt altijd dezelfde reeks getallen uit. Geen afhankelijkheid
// van Math.random, zodat de dagelijkse selectie stabiel blijft zolang je de
// app dezelfde dag opnieuw opent, maar wél wisselt op een andere dag.
function mulberry32(seed: number): () => number {
  let state = seed | 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(text: string): number {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0
  }
  return hash >>> 0
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = items.slice()
  const random = mulberry32(seed)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Kiest een dagelijks wisselende, maar voor die dag stabiele, subset van
 * maximaal `count` oefeningen uit `pool`. Dezelfde datum + dezelfde pool
 * geeft altijd dezelfde selectie (zo verandert de lijst niet halverwege de
 * dag als je de app een keer sluit en heropent), een andere datum geeft een
 * andere volgorde, zodat het niet elke dag dezelfde oefeningen zijn.
 */
export function pickDailyVariation(pool: Exercise[], count: number, dateKey: string): Exercise[] {
  const seed = hashSeed(`${dateKey}|${pool.map((e) => e.id).sort().join(',')}`)
  return seededShuffle(pool, seed).slice(0, Math.min(count, pool.length))
}

/** Bepaalt welke oefeningen vandaag getoond worden, op basis van het stoplicht-niveau en de pijnscore. */
export function getTodayProgram(
  level: StoplightLevel,
  allExercises: Exercise[],
  painScore: number,
  settings: ThresholdSettings & { showOptionalStretchOnRestDay: boolean },
  dateKey: string,
): TodayProgram {
  const enabled = allExercises.filter((e) => e.enabled)
  const count = exerciseCountForPainScore(painScore, settings)

  switch (level) {
    case 'groen':
      return {
        exercises: pickDailyVariation(enabled, count, dateKey),
        optional: false,
        intro: `Vandaag voor jou gekozen (wisselt elke dag):`,
      }
    case 'oranje':
      return {
        exercises: pickDailyVariation(
          enabled.filter((e) => e.category === 'mobiliteit' || e.category === 'stretch'),
          count,
          dateKey,
        ),
        optional: false,
        intro: 'Vandaag alleen zachte mobiliteit en stretches, gevarieerd gekozen:',
      }
    case 'rood':
      return settings.showOptionalStretchOnRestDay
        ? {
            exercises: enabled.filter((e) => e.category === 'stretch'),
            optional: true,
            intro: 'Vandaag is een rustdag. Een lichte stretch mag, maar hoeft niet:',
          }
        : {
            exercises: [],
            optional: true,
            intro: 'Vandaag is een rustdag. Focus vooral op rust.',
          }
    case 'rode_vlag':
      return { exercises: [], optional: true, intro: '' }
  }
}
