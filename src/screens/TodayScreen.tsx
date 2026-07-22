import { useMemo, useState } from 'react'
import { useAppData } from '../lib/AppDataContext'
import { evaluateStoplight, isProgressionEligible } from '../lib/stoplight'
import { getTodayProgram } from '../lib/program'
import { comparePainTrend, hasEnoughDataForTrend } from '../lib/trends'
import { todayKey, formatNiceDate } from '../lib/dates'
import { StopScreen } from '../components/StopScreen'
import { Card, Pill, PrimaryButton, SecondaryButton } from '../components/ui'
import { StreakBadge } from '../components/StreakBadge'
import { DailyMissionCard } from '../components/DailyMissionCard'
import { ExerciseChecklist } from '../components/ExerciseChecklist'
import { CyclingRestCard } from '../components/CyclingRestCard'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CelebrationToast } from '../components/CelebrationToast'
import { BadgeEarnedModal } from '../components/BadgeEarnedModal'
import { RetroactiveCheckInModal } from '../components/RetroactiveCheckInModal'
import type { Exercise, StoplightLevel } from '../types'

function formatDose(ex: Pick<Exercise, 'sets' | 'reps' | 'durationSec'>): string {
  if (ex.reps != null) return `${ex.sets} x ${ex.reps}`
  if (ex.durationSec != null) return `${ex.sets} x ${ex.durationSec} sec`
  return `${ex.sets} set(s)`
}

function bumpedDose(ex: Exercise): string {
  return formatDose({
    sets: ex.sets,
    reps: ex.reps ? Math.max(ex.reps, Math.round(ex.reps * 1.1)) : ex.reps,
    durationSec: ex.durationSec ? Math.max(ex.durationSec, Math.round(ex.durationSec * 1.1)) : ex.durationSec,
  })
}

const LEVEL_STYLES: Record<Exclude<StoplightLevel, 'rode_vlag'>, { bg: string; text: string; label: string; emoji: string }> = {
  groen: { bg: 'bg-stoplicht-groen', text: 'text-stoplicht-groen-tekst', label: 'Groen: het gaat goed', emoji: '🟢' },
  oranje: { bg: 'bg-stoplicht-amber', text: 'text-stoplicht-amber-tekst', label: 'Amber: rustig aan', emoji: '🟡' },
  rood: { bg: 'bg-stoplicht-rood', text: 'text-stoplicht-rood-tekst', label: 'Rood: rustdag', emoji: '🌷' },
}

export function TodayScreen() {
  const {
    data,
    todayCheckIn,
    todayExerciseDone,
    todayRestLogged,
    addExerciseCompletion,
    applyProgressionForExercise,
    missedCheckInDates,
    lastEarnedBadges,
    clearLastEarnedBadges,
  } = useAppData()

  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [overrideFullProgram, setOverrideFullProgram] = useState(false)
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false)
  const [celebration, setCelebration] = useState<string | null>(null)
  const [showProgressionOffer, setShowProgressionOffer] = useState(true)
  const [retroactiveDate, setRetroactiveDate] = useState<string | null>(null)

  const stoplight = useMemo(() => {
    if (!todayCheckIn) return null
    return evaluateStoplight(todayCheckIn, data.checkIns, data.settings)
  }, [todayCheckIn, data.checkIns, data.settings])

  const progressionEligible = useMemo(
    () => stoplight?.level === 'groen' && isProgressionEligible(data.checkIns, data.settings, todayKey()),
    [stoplight, data.checkIns, data.settings],
  )

  // Alleen een positieve trend hier tonen (nooit "meer pijn"): dit is het
  // scherm dat je elke dag ziet, dus dit moet motiveren, niet dagelijks
  // ontmoedigen. De volledige trend (ook stabiel/oplopend) staat in Historie.
  const showsPositiveTrend = useMemo(() => {
    const trend = comparePainTrend(data.checkIns, todayKey(), 14)
    return hasEnoughDataForTrend(trend) && (trend.delta ?? 0) <= -0.5
  }, [data.checkIns])

  // Progressie wordt per oefening aangeboden (nooit als één blanket bump over
  // alles), zodat je zelf kunt kiezen welke oefening al klaar is voor een
  // volgende stap en welke nog even op hetzelfde niveau mag blijven.
  const basisExercises = useMemo(
    () => data.exercises.filter((e) => e.enabled && e.level === 'basis'),
    [data.exercises],
  )

  if (!todayCheckIn || !stoplight) return null

  if (stoplight.level === 'rode_vlag') {
    return <StopScreen reasons={stoplight.reasons} />
  }

  const style = LEVEL_STYLES[stoplight.level]
  const baseProgram = getTodayProgram(stoplight.level, data.exercises, todayCheckIn.painScore, data.settings, todayKey())
  // "Toch alles doen" toont echt de volledige bibliotheek, zonder de
  // dagelijkse cap/willekeur — dat is precies het doel van deze bewuste keuze.
  const program = overrideFullProgram
    ? { exercises: data.exercises.filter((e) => e.enabled), optional: false, intro: 'Je eigen keuze: volledige set doen.' }
    : baseProgram

  const toggleExercise = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const finishExercises = () => {
    addExerciseCompletion(Array.from(checked), stoplight.level)
    setCelebration('Dagoefeningen afgerond, wat goed dat je er weer was! 🎉')
  }

  // Bij groen is er geen medisch advies om te overschrijven (alleen minder
  // variatie tonen), dus daar meteen de volledige bibliotheek tonen zonder
  // waarschuwingsdialoog. Bij oranje/rood overschrijf je wél het rustadvies,
  // dus daar blijft de bevestigingsvraag staan.
  const requestOverride = () => {
    if (stoplight.level === 'groen') setOverrideFullProgram(true)
    else setShowOverrideConfirm(true)
  }

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-5 pb-28 pt-6">
      {celebration && <CelebrationToast message={celebration} onClose={() => setCelebration(null)} />}
      {lastEarnedBadges[0] && (
        <BadgeEarnedModal badge={lastEarnedBadges[0]} onClose={() => clearLastEarnedBadges()} />
      )}
      {showOverrideConfirm && (
        <ConfirmDialog
          title="Weet je het zeker?"
          message={
            stoplight.level === 'rood'
              ? 'Je fysio adviseert nu rust. Weet je zeker dat je toch wilt oefenen?'
              : 'Je fysio adviseert vandaag alleen zachte mobiliteit, geen volledige set. Weet je zeker dat je toch de volledige set wilt doen?'
          }
          onCancel={() => setShowOverrideConfirm(false)}
          onConfirm={() => {
            setOverrideFullProgram(true)
            setShowOverrideConfirm(false)
          }}
        />
      )}

      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#9d93a8]">{formatNiceDate(todayKey())}</p>
          <h1 className="text-xl font-extrabold text-[#4a4453]">Vandaag</h1>
        </div>
        <StreakBadge streak={data.streak} />
      </div>

      {showsPositiveTrend && (
        <p className="mb-3 text-sm font-bold text-mint-400">
          📉 Je pijn is de laatste 2 weken gemiddeld lager dan de 2 weken ervoor — mooi bezig!
        </p>
      )}

      <Card className={`mb-4 ${style.bg}/40`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{style.emoji}</span>
          <p className={`font-extrabold ${style.text}`}>{style.label}</p>
        </div>
        {stoplight.reasons.map((r) => (
          <p key={r} className={`mt-1 text-sm ${style.text}`}>
            {r}
          </p>
        ))}
      </Card>

      {retroactiveDate && (
        <RetroactiveCheckInModal
          date={retroactiveDate}
          onClose={() => {
            setRetroactiveDate(null)
            setCelebration('Gemiste dag ingevuld, je streak loopt weer door! 🔥')
          }}
        />
      )}

      {missedCheckInDates.length > 0 && (
        <Card className="mb-4 border-2 border-sky-200 bg-sky-50">
          <p className="mb-2 font-extrabold text-[#4a4453]">Dag gemist door drukte? Geen probleem 🌤️</p>
          <p className="mb-3 text-sm text-[#7a7285]">
            Vul de gemiste dag(en) alsnog terugkijkend in, dan loopt je streak gewoon door.
          </p>
          <div className="space-y-2">
            {missedCheckInDates.map((date) => (
              <div
                key={date}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-sky-100 bg-white/70 p-3"
              >
                <p className="text-sm font-bold text-[#4a4453]">{formatNiceDate(date)}</p>
                <SecondaryButton className="w-auto px-4 py-2 text-sm" onClick={() => setRetroactiveDate(date)}>
                  Invullen
                </SecondaryButton>
              </div>
            ))}
          </div>
        </Card>
      )}

      {progressionEligible && showProgressionOffer && !overrideFullProgram && basisExercises.length > 0 && (
        <Card className="mb-4 border-2 border-butter-200 bg-butter-50">
          <p className="mb-2 font-extrabold text-[#8a6a1a]">Je houdt dit heel goed vol! 🌟</p>
          <p className="mb-3 text-sm text-[#8a6a1a]">
            De afgelopen week ging het vaak groen. Kies zelf per oefening of je een klein stapje
            verder wilt (ongeveer 10% meer volume) — helemaal jouw keuze, per oefening apart.
          </p>
          <div className="space-y-2">
            {basisExercises.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-butter-100 bg-white/70 p-3"
              >
                <div>
                  <p className="text-sm font-bold text-[#4a4453]">{ex.name}</p>
                  <p className="text-xs text-[#8a7f96]">
                    {formatDose(ex)} → {bumpedDose(ex)}
                  </p>
                </div>
                <SecondaryButton
                  className="w-auto px-4 py-2 text-sm"
                  onClick={() => {
                    applyProgressionForExercise(ex.id)
                    setCelebration(`${ex.name}: volume rustig verhoogd. Fijn opgebouwd! 🌟`)
                  }}
                >
                  Toepassen
                </SecondaryButton>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowProgressionOffer(false)}
            className="mt-3 text-xs font-bold text-[#9d93a8] underline"
          >
            Niet nu, voor geen van deze oefeningen
          </button>
        </Card>
      )}

      <DailyMissionCard
        items={[
          { label: 'Ochtend check-in gedaan', done: true },
          { label: 'Oefeningen of rust van vandaag afgerond', done: todayExerciseDone || todayRestLogged },
        ]}
      />

      <div className="mt-4">
        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="font-extrabold text-[#4a4453]">{program.intro}</p>
            {program.optional && <Pill tone="blush">optioneel</Pill>}
          </div>

          <ExerciseChecklist exercises={program.exercises} checked={checked} onToggle={toggleExercise} />

          {!overrideFullProgram && (
            <button onClick={requestOverride} className="mt-4 text-xs font-bold text-[#9d93a8] underline">
              {stoplight.level === 'groen' ? 'Liever de volledige bibliotheek zien?' : 'Toch de volledige set doen vandaag?'}
            </button>
          )}

          {program.exercises.length > 0 && (
            <div className="mt-4">
              <PrimaryButton onClick={finishExercises} disabled={checked.size === 0 || todayExerciseDone}>
                {todayExerciseDone ? 'Al afgerond vandaag ✓' : 'Oefeningen afronden'}
              </PrimaryButton>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-4">
        <CyclingRestCard onCelebrate={setCelebration} />
      </div>

      {stoplight.twoDaysRoodInARow && (
        <Card className="mt-4 border-2 border-blush-200 bg-blush-50">
          <p className="text-sm font-bold text-blush-300">
            Twee dagen op rij rood: neem contact op met je fysiotherapeut om samen verder te kijken.
          </p>
        </Card>
      )}

      <p className="mt-6 text-center text-xs text-[#b3a9bd]">
        RugMaatje is geen medisch hulpmiddel en vervangt geen zorgverlener.
      </p>
    </div>
  )
}
