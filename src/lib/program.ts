import type { Exercise, StoplightLevel } from '../types'

export interface TodayProgram {
  exercises: Exercise[]
  optional: boolean
  intro: string
}

/** Bepaalt welke oefeningen vandaag getoond worden, op basis van het stoplicht-niveau. */
export function getTodayProgram(level: StoplightLevel, allExercises: Exercise[]): TodayProgram {
  const enabled = allExercises.filter((e) => e.enabled)

  switch (level) {
    case 'groen':
      return {
        exercises: enabled,
        optional: false,
        intro: 'Je volledige oefenset van vandaag:',
      }
    case 'oranje':
      return {
        exercises: enabled.filter((e) => e.category === 'mobiliteit' || e.category === 'stretch'),
        optional: false,
        intro: 'Vandaag alleen zachte mobiliteit en stretches, je niveau blijft gelijk:',
      }
    case 'rood':
      return {
        exercises: enabled.filter((e) => e.category === 'stretch'),
        optional: true,
        intro: 'Vandaag is een rustdag. Een lichte stretch mag, maar hoeft niet:',
      }
    case 'rode_vlag':
      return { exercises: [], optional: true, intro: '' }
  }
}
