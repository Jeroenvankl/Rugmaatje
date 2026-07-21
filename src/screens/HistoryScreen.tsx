import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'
import { useAppData } from '../lib/AppDataContext'
import { Card, Pill, SecondaryButton } from '../components/ui'
import { exportAsCsv, exportAsText } from '../lib/storage'
import { formatShortDate, lastNDays } from '../lib/dates'
import { PAIN_LOCATION_LABELS, RADIATING_LABELS } from '../types'

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function HistoryScreen() {
  const { data } = useAppData()
  const [rangeDays, setRangeDays] = useState(30)

  const chartData = useMemo(() => {
    const days = lastNDays(rangeDays)
    return days.map((day) => {
      const checkIn = data.checkIns
        .filter((c) => c.date === day)
        .sort((a, b) => b.timestamp - a.timestamp)[0]
      const exercised = data.exerciseCompletions.some((c) => c.date === day)
      const rested = data.restLogs.some((r) => r.date === day)
      const cycled = data.cyclingLogs.some((c) => c.date === day)
      return {
        day,
        label: formatShortDate(day),
        pijn: checkIn ? checkIn.painScore : null,
        exercised,
        rested,
        cycled,
      }
    })
  }, [data, rangeDays])

  const recentCheckIns = useMemo(
    () => data.checkIns.slice().sort((a, b) => b.timestamp - a.timestamp).slice(0, 30),
    [data.checkIns],
  )

  const handleExportText = () => downloadFile(exportAsText(data), 'rugmaatje-overzicht.txt', 'text/plain')
  const handleExportCsv = () => downloadFile(exportAsCsv(data), 'rugmaatje-overzicht.csv', 'text/csv')

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-5 pb-28 pt-6">
      <h1 className="mb-1 text-xl font-extrabold text-[#4a4453]">Geschiedenis</h1>
      <p className="mb-4 text-sm text-[#7a7285]">Pijnscore over tijd, met markers voor oefen-, rust- en fietsdagen.</p>

      <div className="mb-3 flex gap-2">
        {[14, 30, 90].map((n) => (
          <button
            key={n}
            onClick={() => setRangeDays(n)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${
              rangeDays === n ? 'bg-lavender-200 text-[#4a4453]' : 'bg-white text-[#9d93a8]'
            }`}
          >
            {n} dagen
          </button>
        ))}
      </div>

      <Card className="mb-4">
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f2eef7" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9d93a8' }} interval={Math.ceil(rangeDays / 6)} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#9d93a8' }} allowDecimals={false} />
              <Tooltip
                formatter={((value: unknown) => [value == null ? '-' : `${value}/10`, 'Pijnscore']) as never}
                labelStyle={{ fontWeight: 700, color: '#4a4453' }}
                contentStyle={{ borderRadius: 12, border: '1px solid #ece7ef' }}
              />
              <Line type="monotone" dataKey="pijn" stroke="#c6aee0" strokeWidth={3} dot={{ r: 3 }} connectNulls />
              {chartData.map(
                (d) =>
                  d.exercised && (
                    <ReferenceDot key={`ex-${d.day}`} x={d.label} y={d.pijn ?? 0} r={4} fill="#8fd3a6" stroke="none" />
                  ),
              )}
              {chartData.map(
                (d) =>
                  d.rested && (
                    <ReferenceDot key={`rest-${d.day}`} x={d.label} y={d.pijn ?? 0} r={4} fill="#f0a8b8" stroke="none" />
                  ),
              )}
              {chartData.map(
                (d) =>
                  d.cycled && (
                    <ReferenceDot key={`cyc-${d.day}`} x={d.label} y={d.pijn ?? 0} r={4} fill="#b3d3ea" stroke="none" />
                  ),
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#7a7285]">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-mint-300" /> Oefendag</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blush-300" /> Rustdag</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-sky-200" /> Fietsdag</span>
        </div>
      </Card>

      <div className="mb-3 flex gap-2">
        <SecondaryButton onClick={handleExportText}>Exporteer als tekst</SecondaryButton>
        <SecondaryButton onClick={handleExportCsv}>Exporteer als CSV</SecondaryButton>
      </div>

      <h2 className="mb-2 mt-5 font-extrabold text-[#4a4453]">Dagoverzicht</h2>
      <div className="space-y-2">
        {recentCheckIns.map((c) => (
          <Card key={c.id} className="py-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-bold text-[#4a4453]">{formatShortDate(c.date)}</p>
              <Pill tone={c.painScore <= 1 ? 'mint' : c.painScore <= 3 ? 'peach' : 'blush'}>{c.painScore}/10</Pill>
            </div>
            <p className="text-xs text-[#7a7285]">
              {c.locations.map((l) => PAIN_LOCATION_LABELS[l]).join(', ') || 'Geen locatie opgegeven'}
            </p>
            <p className="text-xs text-[#7a7285]">Uitstraling: {RADIATING_LABELS[c.radiating]}</p>
            {c.freeText && <p className="mt-1 text-xs italic text-[#9d93a8]">"{c.freeText}"</p>}
          </Card>
        ))}
        {recentCheckIns.length === 0 && <p className="text-sm text-[#9d93a8]">Nog geen check-ins gelogd.</p>}
      </div>
    </div>
  )
}
