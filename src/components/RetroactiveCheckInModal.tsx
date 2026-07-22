import { useState } from 'react'
import type { PainLocation, RadiatingSymptom } from '../types'
import { PAIN_LOCATION_LABELS, RADIATING_LABELS } from '../types'
import { useAppData } from '../lib/AppDataContext'
import { Card, PrimaryButton, SecondaryButton } from './ui'
import { formatNiceDate } from '../lib/dates'

const LOCATIONS: PainLocation[] = ['onderrug_links', 'onderrug_rechts', 'onderrug_midden', 'bil_been', 'heup', 'anders']
const RADIATING_OPTIONS: RadiatingSymptom[] = ['geen', 'licht', 'toegenomen', 'zakt_onder_knie', 'tintelingen', 'krachtsverlies']

// Bewust een los, compact formulier (geen multi-step wizard zoals de
// dagelijkse check-in): dit is een terugblik op een gemiste dag, niet een
// actuele triage. Daarom leidt dit ook nooit naar het stopscherm — als er nu
// nog steeds een rode vlag speelt, komt dat vanzelf naar voren bij de
// check-in van vandaag.
export function RetroactiveCheckInModal({ date, onClose }: { date: string; onClose: () => void }) {
  const { addCheckIn } = useAppData()
  const [painScore, setPainScore] = useState(2)
  const [locations, setLocations] = useState<PainLocation[]>([])
  const [radiating, setRadiating] = useState<RadiatingSymptom>('geen')
  const [freeText, setFreeText] = useState('')

  const toggleLocation = (loc: PainLocation) => {
    setLocations((prev) => (prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]))
  }

  const submit = () => {
    addCheckIn({ painScore, locations, radiating, freeText: freeText.trim() || undefined }, date)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-4">
      <div className="animate-fade-slide-up max-h-[85svh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl">
        <h2 className="mb-1 text-lg font-extrabold text-[#4a4453]">Gemiste dag invullen</h2>
        <p className="mb-4 text-sm text-[#7a7285]">
          Vul voor {formatNiceDate(date)} zo goed mogelijk terugkijkend in hoe het toen ging.
        </p>

        <Card className="mb-4">
          <p className="mb-3 font-bold text-[#4a4453]">Hoeveel pijn of last had je toen ongeveer?</p>
          <div className="mb-2 text-center text-4xl font-black text-blush-300">{painScore}</div>
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
        </Card>

        <Card className="mb-4">
          <p className="mb-3 font-bold text-[#4a4453]">Waar voelde je het? (meerdere mogelijk)</p>
          <div className="flex flex-wrap gap-2">
            {LOCATIONS.map((loc) => (
              <button
                key={loc}
                onClick={() => toggleLocation(loc)}
                className={`rounded-2xl border-2 px-3 py-2 text-sm font-bold transition active:scale-[0.97] ${
                  locations.includes(loc)
                    ? 'border-lavender-300 bg-lavender-100 text-[#4a4453]'
                    : 'border-[#ece7ef] bg-white text-[#7a7285]'
                }`}
              >
                {PAIN_LOCATION_LABELS[loc]}
              </button>
            ))}
          </div>
        </Card>

        <Card className="mb-4">
          <p className="mb-3 font-bold text-[#4a4453]">Uitstraling in je been?</p>
          <div className="flex flex-col gap-2">
            {RADIATING_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setRadiating(opt)}
                className={`rounded-2xl border-2 px-4 py-2.5 text-left text-sm font-bold transition active:scale-[0.98] ${
                  radiating === opt
                    ? 'border-blush-300 bg-blush-100 text-[#4a4453]'
                    : 'border-[#ece7ef] bg-white text-[#7a7285]'
                }`}
              >
                {RADIATING_LABELS[opt]}
              </button>
            ))}
          </div>
        </Card>

        <Card className="mb-5">
          <p className="mb-2 font-bold text-[#4a4453]">Notitie (optioneel)</p>
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={3}
            placeholder="Bijvoorbeeld: was druk, voelde ongeveer zoals normaal..."
            className="w-full rounded-2xl border-2 border-[#ece7ef] p-3 text-sm outline-none focus:border-lavender-300"
          />
        </Card>

        <div className="flex gap-2">
          <SecondaryButton onClick={onClose}>Annuleren</SecondaryButton>
          <PrimaryButton onClick={submit}>Opslaan</PrimaryButton>
        </div>
      </div>
    </div>
  )
}
