// Alle datamodellen voor RugMaatje.
// Let op: alles wordt lokaal opgeslagen (localStorage), er is geen backend.

export type PainLocation =
  | 'onderrug_links'
  | 'onderrug_rechts'
  | 'onderrug_midden'
  | 'bil_been'
  | 'heup'
  | 'anders'

export const PAIN_LOCATION_LABELS: Record<PainLocation, string> = {
  onderrug_links: 'Onderrug links',
  onderrug_rechts: 'Onderrug rechts',
  onderrug_midden: 'Onderrug midden',
  bil_been: 'Bil-been (uitstraling)',
  heup: 'Heup',
  anders: 'Anders',
}

export type RadiatingSymptom =
  | 'geen'
  | 'licht'
  | 'toegenomen'
  | 'zakt_onder_knie'
  | 'tintelingen'
  | 'krachtsverlies'

export const RADIATING_LABELS: Record<RadiatingSymptom, string> = {
  geen: 'Geen',
  licht: 'Licht, zoals eerder',
  toegenomen: 'Toegenomen',
  zakt_onder_knie: 'Zakt onder de knie',
  tintelingen: 'Tintelingen of doof gevoel',
  krachtsverlies: 'Krachtsverlies',
}

// Symptomen die altijd een rode vlag zijn, ongeacht pijnscore.
export const RED_FLAG_SYMPTOMS: RadiatingSymptom[] = [
  'toegenomen',
  'zakt_onder_knie',
  'tintelingen',
  'krachtsverlies',
]

export interface CheckIn {
  id: string
  date: string // YYYY-MM-DD
  timestamp: number
  painScore: number // 0-10
  locations: PainLocation[]
  radiating: RadiatingSymptom
  freeText?: string
  sleepQuality?: number // 1-5, optioneel
  morningStiffness?: number // 0-10, optioneel
  retroactive?: boolean // true als dit achteraf ingevuld is voor een gemiste dag
}

export type StoplightLevel = 'rode_vlag' | 'groen' | 'oranje' | 'rood'

export type ExerciseCategory = 'kracht' | 'mobiliteit' | 'stretch'

export const EXERCISE_CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  kracht: 'Kracht',
  mobiliteit: 'Mobiliteit',
  stretch: 'Stretch',
}

export interface Exercise {
  id: string
  name: string
  goal: string
  cue: string
  sets: number
  reps: number | null // null = geen herhalingen, gebruik duration
  durationSec: number | null // null = geen tijdsduur, gebruik reps
  enabled: boolean
  isCustom: boolean
  level: 'basis' | 'opgebouwd' // voor progressie
  category: ExerciseCategory
  dailyLifeBenefit?: string // waarom dit helpt in het dagelijks leven, bijv. "makkelijker bukken bij het aankleden"
}

export type DayActivityType = 'oefenen' | 'rust' | 'fietsen'

export interface CyclingLog {
  id: string
  date: string
  timestamp: number
  durationMin: number
  feeling: 'geen_last' | 'lichte_last' | 'meer_last'
}

export interface RestLog {
  id: string
  date: string
  timestamp: number
  note?: string
}

export interface ExerciseCompletionLog {
  id: string
  date: string
  timestamp: number
  exerciseIds: string[]
  level: StoplightLevel
}

export type ExerciseFeeling = 'fijn' | 'neutraal' | 'vervelend'

export const EXERCISE_FEELING_LABELS: Record<ExerciseFeeling, string> = {
  fijn: 'Fijn',
  neutraal: 'Neutraal',
  vervelend: 'Vervelend',
}

export const EXERCISE_FEELING_EMOJI: Record<ExerciseFeeling, string> = {
  fijn: '😊',
  neutraal: '😐',
  vervelend: '😣',
}

// Hoe een oefening aanvoelde, gelogd na een sessie. Append-only, net als de
// andere logs; hieruit leiden we een voorkeurslijst af (welke oefeningen
// prettig zijn en welke vervelend), die de dagelijkse selectie licht bijstuurt.
export interface ExerciseFeedbackLog {
  id: string
  exerciseId: string
  feeling: ExerciseFeeling
  date: string
  timestamp: number
}

export type VolleyballPhase = 1 | 2 | 3 | 4

export interface VolleyballState {
  unlockedByPhysio: boolean
  currentPhase: VolleyballPhase
}

export type TimerSound = 'chime' | 'beep' | 'bell'

export const TIMER_SOUND_LABELS: Record<TimerSound, string> = {
  chime: 'Zachte chime',
  beep: 'Dubbele piep',
  bell: 'Bel',
}

export interface Settings {
  disclaimerSeenAt: number | null
  painThresholdGroenMax: number // pijn 0..deze waarde = groen (mits geen uitstraling)
  painThresholdOranjeMax: number // pijn tot deze waarde = oranje
  volleyball: VolleyballState
  reminder: {
    enabled: boolean
    time: string // HH:MM
  }
  // Bij niveau 'rood' een optionele lichte stretch tonen, of liever helemaal
  // geen oefeningen tonen op een rustdag. Instelbaar zodat dit aansluit bij
  // het advies van de fysio.
  showOptionalStretchOnRestDay: boolean
  // Welk geluidje de set-timer afspeelt als een set voorbij is. Instelbaar
  // omdat Web Audio op iOS niet altijd hoorbaar is (stil/mute-standje,
  // schermvergrendeling); een duidelijkere piep kan dan beter opvallen.
  timerSound: TimerSound
  // Persoonlijk weekdoel: aantal actieve dagen (oefenen of fietsen) per week.
  // Bewust flexibel i.p.v. een harde dagelijkse eis, zodat een drukke dag
  // geen schuldgevoel geeft.
  weeklyMovementGoal: number
}

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastCheckInDate: string | null
  totalCheckIns: number
  badgesEarned: string[] // badge ids
}

// Aantekening over wat de fysiotherapeut heeft gezegd/geadviseerd, zodat de
// app ook input vanuit de behandeling vasthoudt, niet alleen data die naar
// buiten gaat.
export interface PhysioNote {
  id: string
  date: string
  timestamp: number
  note: string
}

export interface AppData {
  checkIns: CheckIn[]
  exercises: Exercise[]
  cyclingLogs: CyclingLog[]
  restLogs: RestLog[]
  exerciseCompletions: ExerciseCompletionLog[]
  exerciseFeedback: ExerciseFeedbackLog[]
  physioNotes: PhysioNote[]
  settings: Settings
  streak: StreakData
}
