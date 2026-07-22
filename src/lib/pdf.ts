import { jsPDF } from 'jspdf'
import type { AppData } from '../types'
import { buildPhysioReport } from './report'

// Genereert een net, printbaar PDF-overzicht voor de fysiotherapeut. Bewust
// een aparte module met een zware afhankelijkheid (jsPDF), die alleen via een
// dynamische import wordt geladen op het moment dat iemand echt op de knop
// drukt — zo blijft de hoofdbundel klein.
export function buildPhysioReportPdf(data: AppData, days = 28): Blob {
  const report = buildPhysioReport(data, days)
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const marginX = 48
  let y = 60
  const lineGap = 18
  const pageHeight = doc.internal.pageSize.getHeight()

  const ensureSpace = (needed = lineGap) => {
    if (y + needed > pageHeight - 48) {
      doc.addPage()
      y = 60
    }
  }

  const heading = (text: string) => {
    ensureSpace(26)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(74, 68, 83)
    doc.text(text, marginX, y)
    y += lineGap + 4
  }

  const line = (text: string, opts: { bold?: boolean; indent?: number } = {}) => {
    ensureSpace()
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    doc.setFontSize(11)
    doc.setTextColor(60, 55, 70)
    const wrapped = doc.splitTextToSize(text, 500 - (opts.indent ?? 0))
    for (const w of wrapped) {
      ensureSpace()
      doc.text(w, marginX + (opts.indent ?? 0), y)
      y += lineGap
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(74, 68, 83)
  doc.text('RugMaatje — fysio-overzicht', marginX, y)
  y += lineGap + 8
  line(`Periode: ${report.periodLabel} (${report.totalDays} dagen)`)
  y += 6

  heading('Samenvatting')
  line(`Check-ins ingevuld: ${report.daysWithCheckIn} van ${report.totalDays} dagen`)
  if (report.retroactiveCheckIns > 0) {
    line(`Waarvan ${report.retroactiveCheckIns} achteraf ingevuld voor een gemiste dag`, { indent: 12 })
  }
  line(
    report.avgPainScore != null
      ? `Gemiddelde pijnscore: ${report.avgPainScore}/10`
      : 'Gemiddelde pijnscore: geen check-ins in deze periode',
  )
  line(`Huidige streak: ${report.currentStreak} dagen (langste: ${report.longestStreak})`)
  line(`Oefensessies: ${report.exerciseSessions} · rustdagen: ${report.restDays} · fietsritten: ${report.cyclingSessions}`)
  y += 6

  heading('Stoplicht-verdeling')
  line(`Groen: ${report.levelCounts.groen} dagen`, { indent: 12 })
  line(`Oranje: ${report.levelCounts.oranje} dagen`, { indent: 12 })
  line(`Rood: ${report.levelCounts.rood} dagen`, { indent: 12 })
  line(`Rode vlag: ${report.levelCounts.rode_vlag} dagen`, { indent: 12 })
  y += 6

  heading('Bijzondere momenten')
  if (report.redFlagMoments.length > 0) {
    report.redFlagMoments.forEach(({ date, reasons }) => line(`${date}: ${reasons.join(' ')}`, { indent: 12 }))
  } else {
    line('Geen rode-vlag-momenten in deze periode.', { indent: 12 })
  }
  y += 6

  if (report.physioNotes.length > 0) {
    heading('Notities van de fysiotherapeut')
    report.physioNotes.forEach(({ date, note }) => line(`${date}: ${note}`, { indent: 12 }))
    y += 6
  }

  ensureSpace()
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(150, 145, 160)
  doc.text('Gegenereerd door RugMaatje. Geen medisch hulpmiddel; vervangt geen zorgverlener.', marginX, y)

  return doc.output('blob')
}
