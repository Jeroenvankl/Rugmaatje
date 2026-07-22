import type { Exercise } from '../types'

function formatDose(ex: Exercise): string {
  if (ex.reps != null) return `${ex.sets} x ${ex.reps}`
  if (ex.durationSec != null) return `${ex.sets} x ${ex.durationSec} sec`
  return `${ex.sets} set(s)`
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
            <button
              onClick={() => onToggle(ex.id)}
              className={`w-full rounded-2xl border-2 p-3.5 text-left transition active:scale-[0.99] ${
                isChecked ? 'border-mint-300 bg-mint-50' : 'border-[#ece7ef] bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
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
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
