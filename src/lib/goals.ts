import type { AppData } from '../types'
import { addDays } from './dates'

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

export interface WeeklyGoalProgress {
  goal: number
  achieved: number
  activeDays: string[]
  reached: boolean
}

/**
 * Voortgang op het flexibele weekdoel: het aantal ACTIEVE dagen deze week
 * (maandag t/m zondag). Een dag telt als actief zodra er die dag geoefend of
 * gefietst is. Rustdagen tellen bewust niet mee als "actief" (dat is prima —
 * het weekdoel gaat over beweging), maar breken ook niets: je verliest niets
 * door een rustdag te nemen.
 */
export function computeWeeklyGoalProgress(data: AppData, today: string): WeeklyGoalProgress {
  const weekStart = startOfWeek(today)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const activeDays = weekDays.filter(
    (day) =>
      data.exerciseCompletions.some((c) => c.date === day) || data.cyclingLogs.some((c) => c.date === day),
  )

  const goal = Math.max(1, data.settings.weeklyMovementGoal)
  return {
    goal,
    achieved: activeDays.length,
    activeDays,
    reached: activeDays.length >= goal,
  }
}
