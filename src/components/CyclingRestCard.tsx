import { useState } from 'react'
import { useAppData } from '../lib/AppDataContext'
import { Card, PrimaryButton, SecondaryButton } from './ui'
import type { CyclingLog } from '../types'

export function CyclingRestCard({ onCelebrate }: { onCelebrate: (message: string) => void }) {
  const { addCyclingLog, addRestLog, todayRestLogged, todayCyclingLogged } = useAppData()
  const [mode, setMode] = useState<'none' | 'fietsen' | 'rust'>('none')
  // Duur bewaren we als tekst (niet als number), zodat het invoerveld nooit een
  // niet-verwijderbare "0" forceert. Bij een number-state werd een leeg veld
  // teruggezet naar 0, wat leidde tot "060" i.p.v. "60".
  const [durationText, setDurationText] = useState('20')
  const [feeling, setFeeling] = useState<CyclingLog['feeling']>('geen_last')
  const [restNote, setRestNote] = useState('')

  const submitCycling = () => {
    const duration = Math.max(0, Number(durationText) || 0)
    addCyclingLog({ durationMin: duration, feeling })
    setMode('none')
    setDurationText('20')
    if (feeling === 'meer_last') {
      onCelebrate('Fietsrit gelogd. Voel je meer last? Neem het dan rustiger aan, dat is een prima keuze. 🌤️')
    } else {
      onCelebrate('Fietsrit gelogd, fijn dat je in beweging bent gebleven! 🚲')
    }
  }

  const submitRest = () => {
    addRestLog(restNote.trim() || undefined)
    setMode('none')
    setRestNote('')
    onCelebrate('Rustdag gelogd. Rust is hier pure winst, goed gedaan! 🌸')
  }

  if (mode === 'fietsen') {
    return (
      <Card>
        <p className="mb-3 font-extrabold text-[#4a4453]">Fietsrit loggen</p>
        <label className="mb-1 block text-sm font-bold text-[#7a7285]">Duur (minuten)</label>
        <input
          type="text"
          inputMode="numeric"
          value={durationText}
          onChange={(e) => {
            // Alleen cijfers, en verwijder overbodige voorloopnullen (zodat
            // "060" automatisch "60" wordt en "0" of leeg gewoon blijven kan).
            const cleaned = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '')
            setDurationText(cleaned)
          }}
          className="mb-4 w-full rounded-2xl border-2 border-[#ece7ef] p-3 text-sm outline-none focus:border-sky-200"
        />
        <label className="mb-1 block text-sm font-bold text-[#7a7285]">Hoe voelde je rug?</label>
        <div className="mb-4 flex flex-col gap-2">
          {(
            [
              ['geen_last', 'Geen last'],
              ['lichte_last', 'Lichte last'],
              ['meer_last', 'Meer last'],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFeeling(val)}
              className={`rounded-2xl border-2 px-4 py-2.5 text-left text-sm font-bold ${
                feeling === val ? 'border-sky-200 bg-sky-50 text-[#4a4453]' : 'border-[#ece7ef] text-[#7a7285]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => setMode('none')}>Annuleren</SecondaryButton>
          <PrimaryButton onClick={submitCycling}>Opslaan</PrimaryButton>
        </div>
      </Card>
    )
  }

  if (mode === 'rust') {
    return (
      <Card>
        <p className="mb-1 font-extrabold text-[#4a4453]">Rustdag loggen</p>
        <p className="mb-3 text-sm text-[#7a7285]">Rust nemen is hier winst, niet iets om je voor te verontschuldigen. 🌸</p>
        <textarea
          value={restNote}
          onChange={(e) => setRestNote(e.target.value)}
          rows={2}
          placeholder="Notitie (optioneel)"
          className="mb-4 w-full rounded-2xl border-2 border-[#ece7ef] p-3 text-sm outline-none focus:border-mint-200"
        />
        <div className="flex gap-2">
          <SecondaryButton onClick={() => setMode('none')}>Annuleren</SecondaryButton>
          <PrimaryButton onClick={submitRest}>Rust loggen</PrimaryButton>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <p className="mb-3 font-extrabold text-[#4a4453]">Ook nog dit vandaag?</p>
      <div className="flex gap-2">
        <button
          onClick={() => setMode('fietsen')}
          disabled={todayCyclingLogged}
          className="flex-1 rounded-2xl border-2 border-sky-200 bg-sky-50 px-3 py-3 text-sm font-bold text-[#4a4453] disabled:opacity-50"
        >
          🚲 {todayCyclingLogged ? 'Fietsrit gelogd' : 'Fietsen loggen'}
        </button>
        <button
          onClick={() => setMode('rust')}
          disabled={todayRestLogged}
          className="flex-1 rounded-2xl border-2 border-mint-200 bg-mint-50 px-3 py-3 text-sm font-bold text-[#4a4453] disabled:opacity-50"
        >
          🌸 {todayRestLogged ? 'Rust gelogd' : 'Rustdag loggen'}
        </button>
      </div>
    </Card>
  )
}
