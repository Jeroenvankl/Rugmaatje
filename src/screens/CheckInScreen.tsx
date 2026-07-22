import { useMemo, useState } from 'react'
import type { PainLocation, RadiatingSymptom } from '../types'
import { PAIN_LOCATION_LABELS, RADIATING_LABELS } from '../types'
import { useAppData } from '../lib/AppDataContext'
import { Card, PrimaryButton, SecondaryButton } from '../components/ui'

const LOCATIONS: PainLocation[] = ['onderrug_links', 'onderrug_rechts', 'onderrug_midden', 'bil_been', 'heup', 'anders']
const RADIATING_OPTIONS: RadiatingSymptom[] = ['geen', 'licht', 'toegenomen', 'zakt_onder_knie', 'tintelingen', 'krachtsverlies']

export function CheckInScreen({ onDone }: { onDone: () => void }) {
  const { addCheckIn, data } = useAppData()
  const [step, setStep] = useState(0)
  const [painScore, setPainScore] = useState(2)
  const [locations, setLocations] = useState<PainLocation[]>([])
  const [radiating, setRadiating] = useState<RadiatingSymptom>('geen')
  const [freeText, setFreeText] = useState('')
  const [sleepQuality, setSleepQuality] = useState<number | null>(null)
  const [morningStiffness, setMorningStiffness] = useState<number | null>(null)
  const [showOptional, setShowOptional] = useState(false)

  const previousCheckIn = useMemo(
    () => data.checkIns.slice().sort((a, b) => b.timestamp - a.timestamp)[0] ?? null,
    [data.checkIns],
  )

  const toggleLocation = (loc: PainLocation) => {
    setLocations((prev) => (prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]))
  }

  // Na de pijnscore bieden we, als er een eerdere check-in is, een duimpje-
  // snelkeuze aan: "net als de vorige keer" neemt locatie/uitstraling van
  // toen over en rondt meteen af. Er gaat geen data verloren (de pijnscore
  // van vandaag wordt altijd apart gevraagd) — het scheelt alleen de
  // stappen die op een rustige/drukke dag vaak toch hetzelfde antwoord
  // zouden krijgen.
  const steps = previousCheckIn
    ? ['pijn', 'duimpje', 'locatie', 'uitstraling', 'notitie', 'optioneel']
    : ['pijn', 'locatie', 'uitstraling', 'notitie', 'optioneel']
  const currentStepName = steps[step]

  const submit = (overrides?: { locations?: PainLocation[]; radiating?: RadiatingSymptom }) => {
    addCheckIn({
      painScore,
      locations: overrides?.locations ?? locations,
      radiating: overrides?.radiating ?? radiating,
      freeText: freeText.trim() || undefined,
      sleepQuality: sleepQuality ?? undefined,
      morningStiffness: morningStiffness ?? undefined,
    })
    onDone()
  }

  const submitSameAsLastTime = () => {
    if (!previousCheckIn) return
    submit({ locations: previousCheckIn.locations, radiating: previousCheckIn.radiating })
  }

  const goNext = () => {
    if (step === steps.length - 2 && !showOptional) {
      // vraag of ze optionele vragen willen invullen, ga anders meteen door
      setStep(step + 1)
      return
    }
    if (step < steps.length - 1) setStep(step + 1)
    else submit()
  }

  const goBack = () => {
    if (step > 0) setStep(step - 1)
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col px-5 pb-8 pt-8">
      <div className="mb-6 flex items-center justify-center gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-blush-300' : i < step ? 'w-2 bg-blush-200' : 'w-2 bg-[#eee3e6]'}`}
          />
        ))}
      </div>

      <div className="mb-2 text-center text-2xl">🌻</div>
      <h1 className="mb-6 text-center text-xl font-extrabold text-[#4a4453]">Goedemorgen! Hoe gaat het vandaag met je rug?</h1>

      <Card className="mb-6 flex-1">
        {currentStepName === 'pijn' && (
          <div>
            <p className="mb-4 font-bold text-[#4a4453]">Hoeveel pijn of last heb je op dit moment?</p>
            <div className="mb-2 text-center text-5xl font-black text-blush-300">{painScore}</div>
            <input
              type="range"
              min={0}
              max={10}
              value={painScore}
              onChange={(e) => setPainScore(Number(e.target.value))}
              className="w-full text-blush-300"
            />
            <div className="mt-1 flex justify-between text-xs font-semibold text-[#9d93a8]">
              <span>0 · geen last</span>
              <span>10 · heel veel last</span>
            </div>
          </div>
        )}

        {currentStepName === 'duimpje' && previousCheckIn && (
          <div>
            <p className="mb-2 font-bold text-[#4a4453]">Verder nog bijzonderheden, of net als de vorige keer?</p>
            <p className="mb-4 text-sm text-[#7a7285]">
              Vorige keer:{' '}
              {previousCheckIn.locations.length > 0
                ? previousCheckIn.locations.map((l) => PAIN_LOCATION_LABELS[l]).join(', ')
                : 'geen locatie opgegeven'}
              , uitstraling: {RADIATING_LABELS[previousCheckIn.radiating]}.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={submitSameAsLastTime}
                className="rounded-2xl border-2 border-mint-200 bg-mint-50 px-4 py-4 text-left font-bold text-[#4a4453] transition active:scale-[0.98]"
              >
                👍 Net als de vorige keer, verder niks bijzonders
              </button>
              <button
                onClick={() => setStep(step + 1)}
                className="rounded-2xl border-2 border-[#ece7ef] bg-white px-4 py-4 text-left font-bold text-[#7a7285] transition active:scale-[0.98]"
              >
                📝 Nee, ik wil dit aanvullen
              </button>
            </div>
          </div>
        )}

        {currentStepName === 'locatie' && (
          <div>
            <p className="mb-4 font-bold text-[#4a4453]">Waar voel je het? (meerdere mogelijk)</p>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  onClick={() => toggleLocation(loc)}
                  className={`rounded-2xl border-2 px-4 py-3 text-sm font-bold transition active:scale-[0.97] ${
                    locations.includes(loc)
                      ? 'border-lavender-300 bg-lavender-100 text-[#4a4453]'
                      : 'border-[#ece7ef] bg-white text-[#7a7285]'
                  }`}
                >
                  {PAIN_LOCATION_LABELS[loc]}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStepName === 'uitstraling' && (
          <div>
            <p className="mb-4 font-bold text-[#4a4453]">Uitstraling in je been?</p>
            <div className="flex flex-col gap-2">
              {RADIATING_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setRadiating(opt)}
                  className={`rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition active:scale-[0.98] ${
                    radiating === opt
                      ? 'border-blush-300 bg-blush-100 text-[#4a4453]'
                      : 'border-[#ece7ef] bg-white text-[#7a7285]'
                  }`}
                >
                  {RADIATING_LABELS[opt]}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStepName === 'notitie' && (
          <div>
            <p className="mb-4 font-bold text-[#4a4453]">Wat voel je precies? (optioneel)</p>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              rows={4}
              placeholder="Bijvoorbeeld: trekkend gevoel bij het bukken..."
              className="w-full rounded-2xl border-2 border-[#ece7ef] p-3 text-sm outline-none focus:border-lavender-300"
            />
          </div>
        )}

        {currentStepName === 'optioneel' && (
          <div>
            <p className="mb-1 font-bold text-[#4a4453]">Nog twee optionele vragen</p>
            <p className="mb-4 text-sm text-[#9d93a8]">Mag je overslaan als je wilt.</p>

            <p className="mb-1 text-sm font-bold text-[#4a4453]">Hoe was je slaap? (1-5)</p>
            <div className="mb-4 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setSleepQuality(n)}
                  className={`h-10 flex-1 rounded-xl border-2 font-bold ${sleepQuality === n ? 'border-sky-200 bg-sky-100' : 'border-[#ece7ef] bg-white'}`}
                >
                  {n}
                </button>
              ))}
            </div>

            <p className="mb-1 text-sm font-bold text-[#4a4453]">Ochtendstijfheid? (0-10)</p>
            <input
              type="range"
              min={0}
              max={10}
              value={morningStiffness ?? 0}
              onChange={(e) => setMorningStiffness(Number(e.target.value))}
              className="w-full text-sky-200"
            />
            <div className="text-center text-sm font-bold text-[#4a4453]">{morningStiffness ?? 0}</div>
            <button className="hidden" onClick={() => setShowOptional(true)} />
          </div>
        )}
      </Card>

      <div className="flex gap-3">
        {step > 0 && <SecondaryButton onClick={goBack}>Terug</SecondaryButton>}
        {currentStepName !== 'duimpje' && (
          <PrimaryButton onClick={goNext}>{step === steps.length - 1 ? 'Check-in afronden' : 'Volgende'}</PrimaryButton>
        )}
      </div>
    </div>
  )
}
