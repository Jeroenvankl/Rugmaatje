import { useEffect, useRef, useState } from 'react'
import type { Exercise } from '../types'
import { playChime, primeAudio } from '../lib/sound'

function formatDose(ex: Exercise): string {
  if (ex.reps != null) return `${ex.sets} x ${ex.reps}`
  if (ex.durationSec != null) return `${ex.sets} x ${ex.durationSec} sec`
  return `${ex.sets} set(s)`
}

// Timer per set voor tijd-gebaseerde oefeningen (bijv. stretches van "2x20
// sec"). Bewust HANDMATIG tussen sets (geen automatische rust-countdown):
// bij veel stretches wissel je van kant of houding, en dat tempo bepaal je
// zelf. Als de laatste set klaar is, wordt de oefening automatisch afgevinkt.
function DurationTimer({
  durationSec,
  sets,
  onAllSetsComplete,
}: {
  durationSec: number
  sets: number
  onAllSetsComplete: () => void
}) {
  const [setIndex, setSetIndex] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'running' | 'set-done'>('idle')
  const [remaining, setRemaining] = useState(durationSec)
  const completedRef = useRef(false)

  useEffect(() => {
    if (phase !== 'running') return
    if (remaining <= 0) {
      if (!completedRef.current) {
        completedRef.current = true
        playChime()
        navigator.vibrate?.([120, 80, 120])
        setPhase('set-done')
      }
      return
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, remaining])

  const isLastSet = setIndex + 1 >= sets

  const beginSet = () => {
    primeAudio()
    completedRef.current = false
    setRemaining(durationSec)
    setPhase('running')
  }

  const advance = () => {
    if (isLastSet) {
      setPhase('idle')
      setSetIndex(0)
      onAllSetsComplete()
    } else {
      setSetIndex((i) => i + 1)
      beginSet()
    }
  }

  const cancel = () => {
    setPhase('idle')
    setSetIndex(0)
    setRemaining(durationSec)
  }

  if (phase === 'idle') {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          beginSet()
        }}
        className="w-full rounded-xl border-2 border-sky-200 bg-sky-50 py-2.5 text-sm font-bold text-[#3d6d85] transition active:scale-[0.98]"
      >
        ⏱️ Start oefening ({sets} x {durationSec} sec)
      </button>
    )
  }

  if (phase === 'running') {
    const progress = ((durationSec - remaining) / durationSec) * 100
    return (
      <div className="rounded-xl border-2 border-sky-200 bg-sky-50 p-3 text-center" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs font-bold text-[#3d6d85]">
          Set {setIndex + 1} van {sets}
        </p>
        <p className="my-1 text-3xl font-black text-[#3d6d85]">{remaining}</p>
        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-white">
          <div className="h-full bg-sky-300 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <button onClick={cancel} className="text-xs font-bold text-[#9d93a8] underline">
          Annuleren
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border-2 border-mint-200 bg-mint-50 p-3 text-center" onClick={(e) => e.stopPropagation()}>
      <p className="mb-2 text-sm font-bold text-mint-400">
        {isLastSet ? `Set ${setIndex + 1} klaar! 🔔` : `Set ${setIndex + 1} van ${sets} klaar! 🔔`}
      </p>
      <button
        onClick={advance}
        className="w-full rounded-xl bg-mint-300 py-2.5 text-sm font-bold text-white transition active:scale-[0.98]"
      >
        {isLastSet ? 'Oefening afronden ✅' : `Set ${setIndex + 2} starten`}
      </button>
    </div>
  )
}

export function ExerciseChecklist({
  exercises,
  checked,
  onToggle,
}: {
  exercises: Exercise[]
  checked: Set<string>
  onToggle: (id: string) => void
}) {
  if (exercises.length === 0) {
    return <p className="text-sm text-[#9d93a8]">Geen oefeningen voor vandaag.</p>
  }

  return (
    <ul className="space-y-2.5">
      {exercises.map((ex) => {
        const isChecked = checked.has(ex.id)
        return (
          <li key={ex.id}>
            <div
              className={`w-full rounded-2xl border-2 p-3.5 transition ${
                isChecked ? 'border-mint-300 bg-mint-50' : 'border-[#ece7ef] bg-white'
              }`}
            >
              <button onClick={() => onToggle(ex.id)} className="flex w-full items-start gap-3 text-left active:scale-[0.99]">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                    isChecked ? 'bg-mint-300 text-white' : 'border-2 border-[#d8d2df] text-transparent'
                  }`}
                >
                  ✓
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-[#4a4453]">{ex.name}</p>
                    <span className="shrink-0 rounded-full bg-[#f2eef7] px-2.5 py-0.5 text-xs font-bold text-[#7a7285]">
                      {formatDose(ex)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#9d93a8]">{ex.cue}</p>
                  {ex.dailyLifeBenefit && (
                    <p className="mt-0.5 text-xs text-mint-400">💡 {ex.dailyLifeBenefit}</p>
                  )}
                </div>
              </button>

              {ex.durationSec != null && (
                <div className="mt-3">
                  <DurationTimer
                    durationSec={ex.durationSec}
                    sets={ex.sets}
                    onAllSetsComplete={() => {
                      if (!isChecked) onToggle(ex.id)
                    }}
                  />
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
