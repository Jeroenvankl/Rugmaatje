import type { CheckIn, StreakData } from '../types'
import { daysBetween } from './dates'

/**
 * Herberekent de volledige streak vanuit ALLE check-ins, in plaats van
 * incrementeel bij te werken op basis van alleen de vorige streak-waarde.
 *
 * Waarom: incrementeel bijwerken gaat ervan uit dat check-ins altijd in
 * chronologische volgorde binnenkomen. Zodra iemand een gemiste dag alsnog
 * achteraf invult (zie AppDataContext), klopt die aanname niet meer. Door
 * hier steeds vanaf nul te herberekenen op basis van de unieke check-in
 * datums, werkt terugvullen altijd correct, ongeacht in welke volgorde
 * check-ins zijn toegevoegd, en herstelt deze functie zichzelf ook als een
 * eerdere (buggy) berekening ooit een verkeerde streak heeft opgeslagen.
 */
export function recalculateStreak(checkIns: CheckIn[], previous: StreakData, today: string): StreakData {
  const uniqueDates = Array.from(new Set(checkIns.map((c) => c.date))).sort()

  if (uniqueDates.length === 0) {
    return { ...previous, currentStreak: 0, longestStreak: 0, lastCheckInDate: null, totalCheckIns: 0 }
  }

  let longest = 1
  let run = 1
  for (let i = 1; i < uniqueDates.length; i++) {
    run = daysBetween(uniqueDates[i - 1], uniqueDates[i]) === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
  }

  const lastDate = uniqueDates[uniqueDates.length - 1]

  // De huidige streak telt alleen mee als de laatste check-in vandaag of
  // gisteren was; anders is de streak al verbroken, ongeacht wat er verder
  // aan geschiedenis in de data staat.
  let current = 0
  if (daysBetween(lastDate, today) <= 1) {
    current = 1
    for (let i = uniqueDates.length - 1; i > 0; i--) {
      if (daysBetween(uniqueDates[i - 1], uniqueDates[i]) === 1) current += 1
      else break
    }
  }

  return {
    ...previous,
    currentStreak: current,
    longestStreak: longest,
    lastCheckInDate: lastDate,
    totalCheckIns: uniqueDates.length,
  }
}
