import type { AppData, CheckIn, PainLocation } from '../types'
import { addDays, formatShortDate } from './dates'

function startOfWeek(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay() // 0 = zondag ... 6 = zaterdag
  const diffToMonday = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diffToMonday)
  const yy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export interface WeekSummary {
  weekStart: string
  label: string
  daysLogged: number
  avgPainScore: number | null
  exerciseDays: number
  restDays: number
  cyclingDays: number
  avgSleepQuality: number | null
  avgMorningStiffness: number | null
}

/**
 * Groepeert de laatste `weeks` weken (maandag t/m zondag) tot samenvattingen.
 * Eén functie voor alle week-inzichten (pijn, slaap/stijfheid, activiteit),
 * zodat de grafiek en het weekoverzicht altijd exact dezelfde cijfers tonen.
 */
export function buildWeeklySummaries(data: AppData, weeks: number, today: string): WeekSummary[] {
  const currentWeekStart = startOfWeek(today)
  const weekStarts: string[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    weekStarts.push(addDays(currentWeekStart, -7 * i))
  }

  return weekStarts.map((weekStart) => {
    let painSum = 0
    let painCount = 0
    let sleepSum = 0
    let sleepCount = 0
    let stiffnessSum = 0
    let stiffnessCount = 0
    const exerciseDays = new Set<string>()
    const restDays = new Set<string>()
    const cyclingDays = new Set<string>()

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i)
      const checkIn = data.checkIns.filter((c) => c.date === day).sort((a, b) => b.timestamp - a.timestamp)[0]
      if (checkIn) {
        painSum += checkIn.painScore
        painCount += 1
        if (checkIn.sleepQuality != null) {
          sleepSum += checkIn.sleepQuality
          sleepCount += 1
        }
        if (checkIn.morningStiffness != null) {
          stiffnessSum += checkIn.morningStiffness
          stiffnessCount += 1
        }
      }
      if (data.exerciseCompletions.some((c) => c.date === day)) exerciseDays.add(day)
      if (data.restLogs.some((r) => r.date === day)) restDays.add(day)
      if (data.cyclingLogs.some((c) => c.date === day)) cyclingDays.add(day)
    }

    return {
      weekStart,
      label: formatShortDate(weekStart),
      daysLogged: painCount,
      avgPainScore: painCount > 0 ? Math.round((painSum / painCount) * 10) / 10 : null,
      exerciseDays: exerciseDays.size,
      restDays: restDays.size,
      cyclingDays: cyclingDays.size,
      avgSleepQuality: sleepCount > 0 ? Math.round((sleepSum / sleepCount) * 10) / 10 : null,
      avgMorningStiffness: stiffnessCount > 0 ? Math.round((stiffnessSum / stiffnessCount) * 10) / 10 : null,
    }
  })
}

/** Telt hoe vaak elke pijnlocatie voorkomt in een gegeven set check-ins. */
export function countLocations(checkIns: CheckIn[]): Partial<Record<PainLocation, number>> {
  const counts: Partial<Record<PainLocation, number>> = {}
  for (const checkIn of checkIns) {
    for (const location of checkIn.locations) {
      counts[location] = (counts[location] ?? 0) + 1
    }
  }
  return counts
}
