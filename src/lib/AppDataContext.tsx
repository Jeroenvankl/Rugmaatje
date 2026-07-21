import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  AppData,
  CheckIn,
  CyclingLog,
  Exercise,
  ExerciseCompletionLog,
  RestLog,
  Settings,
  StoplightLevel,
} from '../types'
import { loadData, resetAllData, saveData } from './storage'
import { updateStreakForCheckIn } from './streak'
import { getNewlyEarnedBadges, type BadgeDef } from './badges'
import { todayKey } from './dates'
import { v4 as uuid } from 'uuid'

interface AppDataContextValue {
  data: AppData
  addCheckIn: (input: Omit<CheckIn, 'id' | 'timestamp' | 'date'>) => CheckIn
  addExerciseCompletion: (exerciseIds: string[], level: StoplightLevel) => void
  addCyclingLog: (input: Omit<CyclingLog, 'id' | 'timestamp' | 'date'>) => void
  addRestLog: (note?: string) => void
  updateExercise: (exercise: Exercise) => void
  addExercise: (exercise: Omit<Exercise, 'id' | 'isCustom'>) => void
  removeExercise: (id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  applyProgressionBump: () => void
  resetData: () => void
  todayCheckIn: CheckIn | null
  todayExerciseDone: boolean
  todayRestLogged: boolean
  todayCyclingLogged: boolean
  lastEarnedBadges: BadgeDef[]
  clearLastEarnedBadges: () => void
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

// NB: setData-updaters hieronder zijn bewust PUUR (geen side effects zoals
// localStorage schrijven of badges toekennen). React (StrictMode / concurrent
// features) kan een updater-functie meerdere keren aanroepen; side effects
// horen daarom in een useEffect die op `data` reageert, niet in de updater.
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData())
  const [lastEarnedBadges, setLastEarnedBadges] = useState<BadgeDef[]>([])
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Voorkom een overbodige schrijfactie direct bij het opstarten (data is
    // net van localStorage geladen).
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    saveData(data)

    const newBadges = getNewlyEarnedBadges(data)
    if (newBadges.length > 0) {
      const withBadges: AppData = {
        ...data,
        streak: { ...data.streak, badgesEarned: [...data.streak.badgesEarned, ...newBadges.map((b) => b.id)] },
      }
      saveData(withBadges)
      setData(withBadges)
      setLastEarnedBadges((prev) => [...prev, ...newBadges])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const addCheckIn = useCallback<AppDataContextValue['addCheckIn']>((input) => {
    const date = todayKey()
    const checkIn: CheckIn = {
      ...input,
      id: uuid(),
      date,
      timestamp: Date.now(),
    }
    setData((current) => {
      const nextStreak = updateStreakForCheckIn(current.streak, date)
      return { ...current, checkIns: [...current.checkIns, checkIn], streak: nextStreak }
    })
    return checkIn
  }, [])

  const addExerciseCompletion = useCallback<AppDataContextValue['addExerciseCompletion']>((exerciseIds, level) => {
    const log: ExerciseCompletionLog = {
      id: uuid(),
      date: todayKey(),
      timestamp: Date.now(),
      exerciseIds,
      level,
    }
    setData((current) => ({ ...current, exerciseCompletions: [...current.exerciseCompletions, log] }))
  }, [])

  const addCyclingLog = useCallback<AppDataContextValue['addCyclingLog']>((input) => {
    const log: CyclingLog = { ...input, id: uuid(), date: todayKey(), timestamp: Date.now() }
    setData((current) => ({ ...current, cyclingLogs: [...current.cyclingLogs, log] }))
  }, [])

  const addRestLog = useCallback<AppDataContextValue['addRestLog']>((note) => {
    const log: RestLog = { id: uuid(), date: todayKey(), timestamp: Date.now(), note }
    setData((current) => ({ ...current, restLogs: [...current.restLogs, log] }))
  }, [])

  const updateExercise = useCallback<AppDataContextValue['updateExercise']>((exercise) => {
    setData((current) => ({
      ...current,
      exercises: current.exercises.map((e) => (e.id === exercise.id ? exercise : e)),
    }))
  }, [])

  const addExercise = useCallback<AppDataContextValue['addExercise']>((exercise) => {
    const newExercise: Exercise = { ...exercise, id: uuid(), isCustom: true }
    setData((current) => ({ ...current, exercises: [...current.exercises, newExercise] }))
  }, [])

  const removeExercise = useCallback<AppDataContextValue['removeExercise']>((id) => {
    setData((current) => ({ ...current, exercises: current.exercises.filter((e) => e.id !== id) }))
  }, [])

  const updateSettings = useCallback<AppDataContextValue['updateSettings']>((patch) => {
    setData((current) => ({ ...current, settings: { ...current.settings, ...patch } }))
  }, [])

  const applyProgressionBump = useCallback(() => {
    setData((current) => ({
      ...current,
      exercises: current.exercises.map((e) => {
        if (!e.enabled) return e
        return {
          ...e,
          reps: e.reps ? Math.max(e.reps, Math.round(e.reps * 1.1)) : e.reps,
          durationSec: e.durationSec ? Math.max(e.durationSec, Math.round(e.durationSec * 1.1)) : e.durationSec,
          level: 'opgebouwd' as const,
        }
      }),
    }))
  }, [])

  const resetData = useCallback(() => {
    const fresh = resetAllData()
    isFirstRender.current = true
    setData(fresh)
    setLastEarnedBadges([])
  }, [])

  const clearLastEarnedBadges = useCallback(() => setLastEarnedBadges([]), [])

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
    applyProgressionBump,
    resetData,
    todayCheckIn,
    todayExerciseDone,
    todayRestLogged,
    todayCyclingLogged,
    lastEarnedBadges,
    clearLastEarnedBadges,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData moet binnen AppDataProvider gebruikt worden')
  return ctx
}
