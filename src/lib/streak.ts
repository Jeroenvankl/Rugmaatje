import type { StreakData } from '../types'
import { addDays } from './dates'

/**
 * Werkt de streak bij wanneer er een check-in wordt gelogd op `date`.
 * Rust nemen breekt de streak NIET: de streak gaat over "elke dag inchecken",
 * niet over "elke dag oefenen". Zo blijft rust nemen altijd winst.
 */
export function updateStreakForCheckIn(streak: StreakData, date: string): StreakData {
  if (streak.lastCheckInDate === date) {
    // Al ingecheckt vandaag, niets te doen.
    return streak
  }

  const wasYesterday = streak.lastCheckInDate === addDays(date, -1)
  const newStreak = wasYesterday ? streak.currentStreak + 1 : 1

  return {
    ...streak,
    currentStreak: newStreak,
    longestStreak: Math.max(streak.longestStreak, newStreak),
    lastCheckInDate: date,
    totalCheckIns: streak.totalCheckIns + 1,
  }
}
