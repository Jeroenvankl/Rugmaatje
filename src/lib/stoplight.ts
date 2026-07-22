import type { CheckIn, Settings, StoplightLevel } from '../types'
import { RED_FLAG_SYMPTOMS } from '../types'
import { addDays, lastNDays } from './dates'

export interface StoplightResult {
  level: StoplightLevel
  reasons: string[]
  twoDaysRoodInARow: boolean
}

/**
 * Bepaalt het stoplicht-niveau voor een check-in, volgens de vaste volgorde:
 * A) Rode vlag heeft altijd voorrang.
 * B) Anders: groen / oranje / rood op basis van pijnscore en drempels,
 *    plus "duidelijk erger dan gisteren" telt ook als rood.
 */
export function evaluateStoplight(
  checkIn: CheckIn,
  allCheckIns: CheckIn[],
  settings: Settings,
): StoplightResult {
  const reasons: string[] = []

  // A. Rode vlag: voorrang boven alles.
  if (RED_FLAG_SYMPTOMS.includes(checkIn.radiating)) {
    reasons.push('Uitstraling in het been vraagt om direct rust en contact met je fysio of huisarts.')
    return { level: 'rode_vlag', reasons, twoDaysRoodInARow: false }
  }

  const yesterdayKey = addDays(checkIn.date, -1)
  const yesterdayCheckIn = allCheckIns
    .filter((c) => c.date === yesterdayKey)
    .sort((a, b) => b.timestamp - a.timestamp)[0]

  const clearlyWorseThanYesterday =
    !!yesterdayCheckIn && checkIn.painScore - yesterdayCheckIn.painScore >= 3

  const groenMax = settings.painThresholdGroenMax
  const oranjeMax = settings.painThresholdOranjeMax

  let level: StoplightLevel

  if (checkIn.painScore >= oranjeMax + 1 || clearlyWorseThanYesterday) {
    level = 'rood'
    if (clearlyWorseThanYesterday) {
      reasons.push('Je pijn is duidelijk toegenomen ten opzichte van gisteren.')
    } else {
      reasons.push('Je pijnscore vraagt vandaag om een rustdag.')
    }
  } else if (checkIn.painScore >= groenMax + 1 && checkIn.painScore <= oranjeMax) {
    level = 'oranje'
    reasons.push('Alleen zachte mobiliteit en stretches vandaag, geen progressie.')
  } else if (checkIn.painScore <= groenMax && (checkIn.radiating === 'geen' || checkIn.radiating === 'licht')) {
    level = 'groen'
    reasons.push('Je mag vandaag flink wat oefeningen doen, gevarieerd gekozen.')
  } else {
    // Randgeval: lage pijnscore maar toch niet "geen/licht" (zou al rode vlag zijn afgehandeld)
    level = 'oranje'
    reasons.push('Voor de zekerheid vandaag rustig aan met alleen mobiliteit.')
  }

  // Check: 2 dagen achter elkaar rood?
  const dayBeforeYesterdayKey = addDays(checkIn.date, -2)
  const yesterdayLevel =
    yesterdayCheckIn && !RED_FLAG_SYMPTOMS.includes(yesterdayCheckIn.radiating)
      ? quickLevel(yesterdayCheckIn, settings)
      : null
  const twoDaysRoodInARow = level === 'rood' && yesterdayLevel === 'rood'
  if (twoDaysRoodInARow) {
    reasons.push('Dit is de tweede dag op rij met rood: neem contact op met je fysio.')
  }
  void dayBeforeYesterdayKey

  return { level, reasons, twoDaysRoodInARow }
}

function quickLevel(checkIn: CheckIn, settings: Settings): StoplightLevel {
  if (RED_FLAG_SYMPTOMS.includes(checkIn.radiating)) return 'rode_vlag'
  const groenMax = settings.painThresholdGroenMax
  const oranjeMax = settings.painThresholdOranjeMax
  if (checkIn.painScore >= oranjeMax + 1) return 'rood'
  if (checkIn.painScore >= groenMax + 1) return 'oranje'
  if (checkIn.radiating === 'geen' || checkIn.radiating === 'licht') return 'groen'
  return 'oranje'
}

/**
 * Progressie mag alleen worden AANGEBODEN (nooit automatisch toegepast) als
 * van de afgelopen 7 dagen minstens 5 dagen groen waren en 0 dagen rood.
 */
export function isProgressionEligible(allCheckIns: CheckIn[], settings: Settings, todayKey: string): boolean {
  const window = lastNDays(7, todayKey)
  const levels = window.map((day) => {
    const dayCheckIn = allCheckIns
      .filter((c) => c.date === day)
      .sort((a, b) => b.timestamp - a.timestamp)[0]
    if (!dayCheckIn) return null
    return quickLevel(dayCheckIn, settings)
  })
  const groenCount = levels.filter((l) => l === 'groen').length
  const roodCount = levels.filter((l) => l === 'rood' || l === 'rode_vlag').length
  return groenCount >= 5 && roodCount === 0
}
