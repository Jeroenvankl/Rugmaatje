import type { AppData, StoplightLevel } from '../types'
import { evaluateStoplight } from './stoplight'
import { addDays, formatShortDate, todayKey } from './dates'

export interface PhysioReport {
  periodLabel: string
  totalDays: number
  daysWithCheckIn: number
  retroactiveCheckIns: number
  avgPainScore: number | null
  levelCounts: Record<StoplightLevel, number>
  redFlagMoments: { date: string; reasons: string[] }[]
  currentStreak: number
  longestStreak: number
  exerciseSessions: number
  restDays: number
  cyclingSessions: number
  physioNotes: { date: string; note: string }[]
}

/** Bouwt een samenvatting van de afgelopen `days` dagen, bedoeld om te delen met de fysiotherapeut. */
export function buildPhysioReport(data: AppData, days: number = 28): PhysioReport {
  const today = todayKey()
  const startDate = addDays(today, -(days - 1))

  const levelCounts: Record<StoplightLevel, number> = { groen: 0, oranje: 0, rood: 0, rode_vlag: 0 }
  const redFlagMoments: PhysioReport['redFlagMoments'] = []
  let painSum = 0
  let painCount = 0
  let daysWithCheckIn = 0
  let retroactiveCheckIns = 0

  for (let i = 0; i < days; i++) {
    const day = addDays(startDate, i)
    const checkIn = data.checkIns.filter((c) => c.date === day).sort((a, b) => b.timestamp - a.timestamp)[0]
    if (!checkIn) continue

    daysWithCheckIn += 1
    if (checkIn.retroactive) retroactiveCheckIns += 1
    painSum += checkIn.painScore
    painCount += 1

    const result = evaluateStoplight(checkIn, data.checkIns, data.settings)
    levelCounts[result.level] += 1
    if (result.level === 'rode_vlag' || result.twoDaysRoodInARow) {
      redFlagMoments.push({ date: day, reasons: result.reasons })
    }
  }

  return {
    periodLabel: `${formatShortDate(startDate)} – ${formatShortDate(today)}`,
    totalDays: days,
    daysWithCheckIn,
    retroactiveCheckIns,
    avgPainScore: painCount > 0 ? Math.round((painSum / painCount) * 10) / 10 : null,
    levelCounts,
    redFlagMoments,
    currentStreak: data.streak.currentStreak,
    longestStreak: data.streak.longestStreak,
    exerciseSessions: data.exerciseCompletions.filter((c) => c.date >= startDate).length,
    restDays: data.restLogs.filter((r) => r.date >= startDate).length,
    cyclingSessions: data.cyclingLogs.filter((c) => c.date >= startDate).length,
    physioNotes: data.physioNotes
      .filter((n) => n.date >= startDate)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((n) => ({ date: n.date, note: n.note })),
  }
}

export function formatPhysioReportText(report: PhysioReport): string {
  const lines: string[] = []
  lines.push('RugMaatje - overzicht voor je fysiotherapeut')
  lines.push(`Periode: ${report.periodLabel} (${report.totalDays} dagen)`)
  lines.push('')
  lines.push(`Check-ins ingevuld: ${report.daysWithCheckIn} van ${report.totalDays} dagen`)
  if (report.retroactiveCheckIns > 0) {
    lines.push(`  Waarvan ${report.retroactiveCheckIns} achteraf (terugkijkend) ingevuld voor een gemiste dag`)
  }
  lines.push(
    report.avgPainScore != null
      ? `Gemiddelde pijnscore: ${report.avgPainScore}/10`
      : 'Gemiddelde pijnscore: geen check-ins in deze periode',
  )
  lines.push('')
  lines.push('Stoplicht-verdeling:')
  lines.push(`  Groen: ${report.levelCounts.groen} dagen`)
  lines.push(`  Oranje: ${report.levelCounts.oranje} dagen`)
  lines.push(`  Rood: ${report.levelCounts.rood} dagen`)
  lines.push(`  Rode vlag: ${report.levelCounts.rode_vlag} dagen`)
  lines.push('')
  lines.push(`Huidige streak: ${report.currentStreak} dagen (langste: ${report.longestStreak} dagen)`)
  lines.push(
    `Oefensessies: ${report.exerciseSessions}, rustdagen: ${report.restDays}, fietsritten: ${report.cyclingSessions}`,
  )
  lines.push('')
  if (report.redFlagMoments.length > 0) {
    lines.push('Let op - bijzondere momenten:')
    report.redFlagMoments.forEach(({ date, reasons }) => {
      lines.push(`  ${date}: ${reasons.join(' ')}`)
    })
  } else {
    lines.push('Geen rode-vlag-momenten in deze periode.')
  }
  lines.push('')
  if (report.physioNotes.length > 0) {
    lines.push('Notities van de fysiotherapeut in deze periode:')
    report.physioNotes.forEach(({ date, note }) => {
      lines.push(`  ${date}: ${note}`)
    })
    lines.push('')
  }
  lines.push('Dit overzicht is gegenereerd door RugMaatje en vervangt geen medisch advies.')
  return lines.join('\n')
}
