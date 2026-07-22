import type { CheckIn } from '../types'
import { addDays } from './dates'

export interface WindowAverage {
  avgPainScore: number | null
  daysLogged: number
}

function averagePainInWindow(checkIns: CheckIn[], startDate: string, days: number): WindowAverage {
  let sum = 0
  let count = 0
  for (let i = 0; i < days; i++) {
    const day = addDays(startDate, i)
    const checkIn = checkIns.filter((c) => c.date === day).sort((a, b) => b.timestamp - a.timestamp)[0]
    if (!checkIn) continue
    sum += checkIn.painScore
    count += 1
  }
  return { avgPainScore: count > 0 ? Math.round((sum / count) * 10) / 10 : null, daysLogged: count }
}

export interface PainTrend {
  windowDays: number
  current: WindowAverage
  previous: WindowAverage
  // Negatief = verbetering (minder pijn), positief = toegenomen. Null als er
  // te weinig data is in één van beide periodes om te vergelijken.
  delta: number | null
}

/**
 * Vergelijkt de gemiddelde pijnscore van de afgelopen `windowDays` met de
 * `windowDays` daarvoor. Dit maakt vooruitgang concreet zichtbaar ("deze 2
 * weken gemiddeld lager dan de 2 weken ervoor") in plaats van alleen een
 * grafiek die je zelf moet interpreteren.
 */
export function comparePainTrend(checkIns: CheckIn[], today: string, windowDays: number = 14): PainTrend {
  const currentStart = addDays(today, -(windowDays - 1))
  const previousStart = addDays(currentStart, -windowDays)

  const current = averagePainInWindow(checkIns, currentStart, windowDays)
  const previous = averagePainInWindow(checkIns, previousStart, windowDays)

  const delta =
    current.avgPainScore != null && previous.avgPainScore != null
      ? Math.round((current.avgPainScore - previous.avgPainScore) * 10) / 10
      : null

  return { windowDays, current, previous, delta }
}

/** Minimaal aantal gelogde dagen per periode voordat een trend betrouwbaar genoeg is om te tonen. */
export const MIN_DAYS_FOR_TREND = 4

export function hasEnoughDataForTrend(trend: PainTrend): boolean {
  return trend.current.daysLogged >= MIN_DAYS_FOR_TREND && trend.previous.daysLogged >= MIN_DAYS_FOR_TREND
}
