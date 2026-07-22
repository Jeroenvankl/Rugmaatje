import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  AppData,
  CheckIn,
  CyclingLog,
  Exercise,
  ExerciseCompletionLog,
  PhysioNote,
  RestLog,
  Settings,
  StoplightLevel,
} from '../types'
import { describeStorageError, loadData, resetAllData, saveData } from './storage'
import { recalculateStreak } from './streak'
import { getNewlyEarnedBadges, type BadgeDef } from './badges'
import { addDays, daysBetween, todayKey } from './dates'
import { v4 as uuid } from 'uuid'

// Hoeveel opeenvolgende gemiste dagen we nog aanbieden om achteraf in te
// vullen. Langer geleden is retroactief invullen niet meer zinvol (te weinig
// betrouwbare herinnering) en hoort de streak gewoon te resetten.
const MAX_RETROACTIVE_DAYS = 3

interface AppDataContextValue {
  data: AppData
  addCheckIn: (input: Omit<CheckIn, 'id' | 'timestamp' | 'date' | 'retroactive'>, forDate?: string) => CheckIn
  addExerciseCompletion: (exerciseIds: string[], level: StoplightLevel) => void
  addCyclingLog: (input: Omit<CyclingLog, 'id' | 'timestamp' | 'date'>) => void
  addRestLog: (note?: string) => void
  updateExercise: (exercise: Exercise) => void
  addExercise: (exercise: Omit<Exercise, 'id' | 'isCustom'>) => void
  removeExercise: (id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  applyProgressionForExercise: (exerciseId: string) => void
  applyDegressionForExercise: (exerciseId: string) => void
  addPhysioNote: (note: string) => void
  removePhysioNote: (id: string) => void
  resetData: () => void
  importData: (data: AppData) => void
  todayCheckIn: CheckIn | null
  todayExerciseDone: boolean
  todayRestLogged: boolean
  todayCyclingLogged: boolean
  missedCheckInDates: string[]
  lastEarnedBadges: BadgeDef[]
  clearLastEarnedBadges: () => void
  storageError: string | null
  clearStorageError: () => void
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData())
  const [lastEarnedBadges, setLastEarnedBadges] = useState<BadgeDef[]>([])
  const [storageError, setStorageError] = useState<string | null>(null)

  // Bewaart altijd de laatst gecommitte data, zodat elke mutatie synchroon
  // (in dezelfde call-stack als de gebruikersactie) kan lezen-en-schrijven.
  // Dit is bewust GEEN useEffect: op iOS kan de pagina vlak na een tik al
  // gepauzeerd/afgesloten worden (achtergrond, scherm op slot), waardoor een
  // schrijfactie die pas ná render via een effect zou lopen soms nooit meer
  // uitgevoerd wordt. Zo ging eerder ingevoerde data verloren. Door synchroon
  // te schrijven staat de data al veilig in localStorage vóórdat React klaar
  // is met deze call.
  const dataRef = useRef<AppData>(data)

  const commit = useCallback((next: AppData) => {
    const earned = getNewlyEarnedBadges(next)
    const finalData =
      earned.length > 0
        ? {
            ...next,
            streak: { ...next.streak, badgesEarned: [...next.streak.badgesEarned, ...earned.map((b) => b.id)] },
          }
        : next

    dataRef.current = finalData
    // Zelfs als opslaan mislukt, blijft de actie voor deze sessie wel
    // zichtbaar (setData loopt altijd door) — maar dan WEL met een
    // duidelijke waarschuwing, in plaats van dat de wijziging straks
    // stilzwijgend weg blijkt te zijn na een herlaad/sluiten van de app.
    try {
      saveData(finalData)
      setStorageError(null)
    } catch (e) {
      console.error('RugMaatje: opslaan mislukt', e)
      setStorageError(describeStorageError(e).message)
    }
    setData(finalData)
    if (earned.length > 0) setLastEarnedBadges((prev) => [...prev, ...earned])
  }, [])

  const addCheckIn = useCallback<AppDataContextValue['addCheckIn']>((input, forDate) => {
    const date = forDate ?? todayKey()
    const checkIn: CheckIn = {
      ...input,
      id: uuid(),
      date,
      timestamp: Date.now(),
      ...(forDate ? { retroactive: true } : {}),
    }
    const current = dataRef.current
    const nextCheckIns = [...current.checkIns, checkIn]
    const nextStreak = recalculateStreak(nextCheckIns, current.streak, todayKey())
    commit({ ...current, checkIns: nextCheckIns, streak: nextStreak })
    return checkIn
  }, [commit])

  const addExerciseCompletion = useCallback<AppDataContextValue['addExerciseCompletion']>((exerciseIds, level) => {
    const log: ExerciseCompletionLog = { id: uuid(), date: todayKey(), timestamp: Date.now(), exerciseIds, level }
    const current = dataRef.current
    commit({ ...current, exerciseCompletions: [...current.exerciseCompletions, log] })
  }, [commit])

  const addCyclingLog = useCallback<AppDataContextValue['addCyclingLog']>((input) => {
    const log: CyclingLog = { ...input, id: uuid(), date: todayKey(), timestamp: Date.now() }
    const current = dataRef.current
    commit({ ...current, cyclingLogs: [...current.cyclingLogs, log] })
  }, [commit])

  const addRestLog = useCallback<AppDataContextValue['addRestLog']>((note) => {
    const log: RestLog = { id: uuid(), date: todayKey(), timestamp: Date.now(), note }
    const current = dataRef.current
    commit({ ...current, restLogs: [...current.restLogs, log] })
  }, [commit])

  const updateExercise = useCallback<AppDataContextValue['updateExercise']>((exercise) => {
    const current = dataRef.current
    commit({ ...current, exercises: current.exercises.map((e) => (e.id === exercise.id ? exercise : e)) })
  }, [commit])

  const addExercise = useCallback<AppDataContextValue['addExercise']>((exercise) => {
    const newExercise: Exercise = { ...exercise, id: uuid(), isCustom: true }
    const current = dataRef.current
    commit({ ...current, exercises: [...current.exercises, newExercise] })
  }, [commit])

  const removeExercise = useCallback<AppDataContextValue['removeExercise']>((id) => {
    const current = dataRef.current
    commit({ ...current, exercises: current.exercises.filter((e) => e.id !== id) })
  }, [commit])

  const updateSettings = useCallback<AppDataContextValue['updateSettings']>((patch) => {
    const current = dataRef.current
    commit({ ...current, settings: { ...current.settings, ...patch } })
  }, [commit])

  // Progressie/degressie zijn bewust PER OEFENING, nooit een blanket bump
  // over alles: zo kan iemand bijv. wel verder met de crunch maar de stretch
  // gelijk houden, en andersom weer een stapje terug zetten als het minder gaat.
  const applyProgressionForExercise = useCallback<AppDataContextValue['applyProgressionForExercise']>((exerciseId) => {
    const current = dataRef.current
    commit({
      ...current,
      exercises: current.exercises.map((e) => {
        if (e.id !== exerciseId || !e.enabled) return e
        return {
          ...e,
          reps: e.reps ? Math.max(e.reps, Math.round(e.reps * 1.1)) : e.reps,
          durationSec: e.durationSec ? Math.max(e.durationSec, Math.round(e.durationSec * 1.1)) : e.durationSec,
          level: 'opgebouwd' as const,
        }
      }),
    })
  }, [commit])

  const applyDegressionForExercise = useCallback<AppDataContextValue['applyDegressionForExercise']>((exerciseId) => {
    const current = dataRef.current
    commit({
      ...current,
      exercises: current.exercises.map((e) => {
        if (e.id !== exerciseId || !e.enabled) return e
        return {
          ...e,
          reps: e.reps ? Math.max(1, Math.round(e.reps * 0.9)) : e.reps,
          durationSec: e.durationSec ? Math.max(5, Math.round(e.durationSec * 0.9)) : e.durationSec,
          level: 'basis' as const,
        }
      }),
    })
  }, [commit])

  // Notities over wat de fysio heeft gezegd/geadviseerd, zodat de app ook
  // input vanuit de behandeling vasthoudt en niet alleen data naar buiten
  // stuurt (zie het fysio-overzicht in Instellingen).
  const addPhysioNote = useCallback<AppDataContextValue['addPhysioNote']>((note) => {
    const trimmed = note.trim()
    if (!trimmed) return
    const entry: PhysioNote = { id: uuid(), date: todayKey(), timestamp: Date.now(), note: trimmed }
    const current = dataRef.current
    commit({ ...current, physioNotes: [...current.physioNotes, entry] })
  }, [commit])

  const removePhysioNote = useCallback<AppDataContextValue['removePhysioNote']>((id) => {
    const current = dataRef.current
    commit({ ...current, physioNotes: current.physioNotes.filter((n) => n.id !== id) })
  }, [commit])

  const resetData = useCallback(() => {
    try {
      const fresh = resetAllData()
      dataRef.current = fresh
      setData(fresh)
      setStorageError(null)
    } catch (e) {
      console.error('RugMaatje: resetten mislukt', e)
      setStorageError(describeStorageError(e).message)
    }
    setLastEarnedBadges([])
  }, [])

  // Data herstellen vanuit een back-up: vervangt alle huidige data. We slaan
  // hier bewust de badge-diffing over (net als bij resetData), zodat je niet
  // ineens een stapel badge-popups krijgt voor prestaties die al in het
  // verleden zijn behaald.
  const importData = useCallback<AppDataContextValue['importData']>((restored) => {
    try {
      saveData(restored)
      setStorageError(null)
    } catch (e) {
      console.error('RugMaatje: back-up terugzetten kon niet opgeslagen worden', e)
      setStorageError(describeStorageError(e).message)
    }
    dataRef.current = restored
    setData(restored)
    setLastEarnedBadges([])
  }, [])

  const clearLastEarnedBadges = useCallback(() => setLastEarnedBadges([]), [])
  const clearStorageError = useCallback(() => setStorageError(null), [])

  const today = todayKey()
  const todayCheckIn = useMemo(
    () => data.checkIns.filter((c) => c.date === today).sort((a, b) => b.timestamp - a.timestamp)[0] ?? null,
    [data.checkIns, today],
  )
  const todayExerciseDone = useMemo(
    () => data.exerciseCompletions.some((c) => c.date === today),
    [data.exerciseCompletions, today],
  )
  const todayRestLogged = useMemo(() => data.restLogs.some((r) => r.date === today), [data.restLogs, today])
  const todayCyclingLogged = useMemo(
    () => data.cyclingLogs.some((c) => c.date === today),
    [data.cyclingLogs, today],
  )

  // Gemiste dagen: het gat tussen de laatste check-in VÓÓR vandaag en
  // vandaag, tot een redelijk maximum. Zo kan iemand die de app een dag door
  // drukte gemist heeft dit alsnog invullen en de streak laten doorlopen,
  // zonder dat "achteraf invullen" een manier wordt om weken data te
  // reconstrueren.
  //
  // Bewust NIET gebaseerd op data.streak.lastCheckInDate: zodra de
  // check-in van vandaag zelf is ingevuld, wordt dat direct de nieuwe
  // lastCheckInDate en zou het gat daarvóór (bijv. gisteren gemist)
  // onzichtbaar worden, precies op het moment dat we het willen tonen.
  const missedCheckInDates = useMemo(() => {
    const priorDates = Array.from(new Set(data.checkIns.map((c) => c.date)))
      .filter((d) => d !== today)
      .sort()
    if (priorDates.length === 0) return []
    const lastPriorDate = priorDates[priorDates.length - 1]
    const gap = daysBetween(lastPriorDate, today)
    if (gap <= 1 || gap - 1 > MAX_RETROACTIVE_DAYS) return []
    const missed: string[] = []
    for (let i = 1; i < gap; i++) missed.push(addDays(lastPriorDate, i))
    return missed.filter((d) => !data.checkIns.some((c) => c.date === d))
  }, [data.checkIns, today])

  const value: AppDataContextValue = {
    data,
    addCheckIn,
    addExerciseCompletion,
    addCyclingLog,
    addRestLog,
    updateExercise,
    addExercise,
    removeExercise,
    updateSettings,
    applyProgressionForExercise,
    applyDegressionForExercise,
    addPhysioNote,
    removePhysioNote,
    resetData,
    importData,
    todayCheckIn,
    todayExerciseDone,
    todayRestLogged,
    todayCyclingLogged,
    missedCheckInDates,
    lastEarnedBadges,
    clearLastEarnedBadges,
    storageError,
    clearStorageError,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData moet binnen AppDataProvider gebruikt worden')
  return ctx
}
