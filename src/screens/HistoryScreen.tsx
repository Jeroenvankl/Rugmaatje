import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts'
import { useAppData } from '../lib/AppDataContext'
import { Card, Pill, SecondaryButton } from '../components/ui'
import { exportAsCsv, exportAsText } from '../lib/storage'
import { shareOrDownloadFile } from '../lib/share'
import { comparePainTrend, hasEnoughDataForTrend } from '../lib/trends'
import { buildWeeklySummaries, countLocations } from '../lib/weekly'
import { formatShortDate, lastNDays, todayKey } from '../lib/dates'
import { PAIN_LOCATION_LABELS, RADIATING_LABELS, type PainLocation } from '../types'

const TREND_WINDOW_DAYS = 14
const DAY_RANGES = [14, 30, 90]
const WEEK_RANGES = [4, 12, 26]

function trendMessage(delta: number): string {
  if (delta <= -0.5) return '📉 Het gaat de goede kant op: duidelijk minder pijn dan de periode ervoor.'
  if (delta >= 0.5) return '📈 Iets meer pijn dan de periode ervoor. Blijf je stoplicht-advies volgen.'
  return '➡️ Ongeveer stabiel ten opzichte van de periode ervoor.'
}

export function HistoryScreen() {
  const { data } = useAppData()
  const [viewMode, setViewMode] = useState<'dag' | 'week'>('dag')
  const [rangeDays, setRangeDays] = useState(30)
  const [rangeWeeks, setRangeWeeks] = useState(12)

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

  const weekSummaries = useMemo(
    () => buildWeeklySummaries(data, rangeWeeks, todayKey()),
    [data, rangeWeeks],
  )

  const locationCounts = useMemo(() => {
    if (weekSummaries.length === 0) return {}
    const earliestWeekStart = weekSummaries[0].weekStart
    return countLocations(data.checkIns.filter((c) => c.date >= earliestWeekStart))
  }, [data.checkIns, weekSummaries])

  const rankedLocations = useMemo(
    () =>
      (Object.entries(locationCounts) as [PainLocation, number][])
        .sort((a, b) => b[1] - a[1]),
    [locationCounts],
  )

  const recentCheckIns = useMemo(
    () => data.checkIns.slice().sort((a, b) => b.timestamp - a.timestamp).slice(0, 30),
    [data.checkIns],
  )

  const trend = useMemo(
    () => comparePainTrend(data.checkIns, todayKey(), TREND_WINDOW_DAYS),
    [data.checkIns],
  )

  const handleExportText = () => shareOrDownloadFile(exportAsText(data), 'rugmaatje-overzicht.txt', 'text/plain')
  const handleExportCsv = () => shareOrDownloadFile(exportAsCsv(data), 'rugmaatje-overzicht.csv', 'text/csv')

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-5 pb-28 pt-6">
      <h1 className="mb-1 text-xl font-extrabold text-[#4a4453]">Geschiedenis</h1>
      <p className="mb-4 text-sm text-[#7a7285]">Pijnscore over tijd, met markers voor oefen-, rust- en fietsdagen.</p>

      <Card className="mb-4 border-2 border-lavender-100 bg-lavender-50">
        <p className="mb-2 font-extrabold text-[#4a4453]">Jouw trend</p>
        {hasEnoughDataForTrend(trend) ? (
          <>
            <p className="text-sm text-[#5c5566]">
              Laatste {trend.windowDays} dagen gemiddeld <span className="font-extrabold">{trend.current.avgPainScore}/10</span>,
              de {trend.windowDays} dagen ervoor gemiddeld <span className="font-extrabold">{trend.previous.avgPainScore}/10</span>.
            </p>
            <p className="mt-2 text-sm font-bold text-[#4a4453]">{trendMessage(trend.delta ?? 0)}</p>
          </>
        ) : (
          <p className="text-sm text-[#7a7285]">
            Blijf inchecken — na een paar dagen zie je hier hoe je pijn zich ontwikkelt ten opzichte van de
            periode ervoor.
          </p>
        )}
      </Card>

      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setViewMode('dag')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-bold ${
            viewMode === 'dag' ? 'bg-lavender-300 text-white' : 'bg-white text-[#9d93a8]'
          }`}
        >
          Per dag
        </button>
        <button
          onClick={() => setViewMode('week')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-bold ${
            viewMode === 'week' ? 'bg-lavender-300 text-white' : 'bg-white text-[#9d93a8]'
          }`}
        >
          Per week
        </button>
      </div>

      {viewMode === 'dag' ? (
        <>
          <div className="mb-3 flex gap-2">
            {DAY_RANGES.map((n) => (
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
        </>
      ) : (
        <>
          <div className="mb-3 flex gap-2">
            {WEEK_RANGES.map((n) => (
              <button
                key={n}
                onClick={() => setRangeWeeks(n)}
                className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                  rangeWeeks === n ? 'bg-lavender-200 text-[#4a4453]' : 'bg-white text-[#9d93a8]'
                }`}
              >
                {n} weken
              </button>
            ))}
          </div>

          <Card className="mb-4">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekSummaries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f2eef7" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9d93a8' }} interval={Math.ceil(rangeWeeks / 6)} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#9d93a8' }} allowDecimals={false} />
                  <Tooltip
                    formatter={((value: unknown) => [value == null ? '-' : `${value}/10`, 'Gemiddelde pijnscore']) as never}
                    labelStyle={{ fontWeight: 700, color: '#4a4453' }}
                    contentStyle={{ borderRadius: 12, border: '1px solid #ece7ef' }}
                  />
                  <Bar dataKey="avgPainScore" fill="#c6aee0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-[#9d93a8]">Weekgemiddelde, week begint op maandag.</p>
          </Card>

          {rankedLocations.length > 0 && (
            <Card className="mb-4">
              <p className="mb-2 font-extrabold text-[#4a4453]">Pijnlocaties</p>
              <div className="space-y-1.5">
                {rankedLocations.map(([location, count]) => (
                  <div key={location} className="flex items-center justify-between text-sm">
                    <span className="text-[#5c5566]">{PAIN_LOCATION_LABELS[location]}</span>
                    <span className="font-bold text-[#4a4453]">{count}x</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <h2 className="mb-2 mt-5 font-extrabold text-[#4a4453]">Weekoverzicht</h2>
          <div className="space-y-2">
            {weekSummaries
              .slice()
              .reverse()
              .map((w) => (
                <Card key={w.weekStart} className="py-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#4a4453]">Week van {w.label}</p>
                    {w.avgPainScore != null ? (
                      <Pill tone={w.avgPainScore <= 1 ? 'mint' : w.avgPainScore <= 3 ? 'peach' : 'blush'}>
                        {w.avgPainScore}/10
                      </Pill>
                    ) : (
                      <Pill>geen data</Pill>
                    )}
                  </div>
                  <p className="text-xs text-[#7a7285]">
                    {w.daysLogged} check-in(s) · {w.exerciseDays}x geoefend · {w.restDays}x gerust · {w.cyclingDays}x gefietst
                  </p>
                  {(w.avgSleepQuality != null || w.avgMorningStiffness != null) && (
                    <p className="mt-1 text-xs text-[#7a7285]">
                      {w.avgSleepQuality != null && <>Slaap: {w.avgSleepQuality}/5</>}
                      {w.avgSleepQuality != null && w.avgMorningStiffness != null && ' · '}
                      {w.avgMorningStiffness != null && <>Ochtendstijfheid: {w.avgMorningStiffness}/10</>}
                    </p>
                  )}
                </Card>
              ))}
          </div>
        </>
      )}

      <div className="mb-3 mt-4 flex gap-2">
        <SecondaryButton onClick={handleExportText}>Exporteer als tekst</SecondaryButton>
        <SecondaryButton onClick={handleExportCsv}>Exporteer als CSV</SecondaryButton>
      </div>

      <h2 className="mb-2 mt-5 font-extrabold text-[#4a4453]">Dagoverzicht</h2>
      <div className="space-y-2">
        {recentCheckIns.map((c) => (
          <Card key={c.id} className="py-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-[#4a4453]">{formatShortDate(c.date)}</p>
                {c.retroactive && <Pill tone="lavender">achteraf ingevuld</Pill>}
              </div>
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
