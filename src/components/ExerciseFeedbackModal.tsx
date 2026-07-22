import { useState } from 'react'
import type { Exercise, ExerciseFeeling } from '../types'
import { EXERCISE_FEELING_EMOJI, EXERCISE_FEELING_LABELS } from '../types'
import { useAppData } from '../lib/AppDataContext'
import { PrimaryButton } from './ui'

const FEELINGS: ExerciseFeeling[] = ['fijn', 'neutraal', 'vervelend']

// Vraagt na een sessie kort hoe elke gedane oefening aanvoelde. Volledig
// optioneel (je kunt sluiten zonder in te vullen). De antwoorden vormen samen
// je voorkeurslijst en sturen de dagelijkse selectie licht bij.
export function ExerciseFeedbackModal({ exercises, onClose }: { exercises: Exercise[]; onClose: () => void }) {
  const { addExerciseFeedback } = useAppData()
  const [answers, setAnswers] = useState<Record<string, ExerciseFeeling>>({})

  const setAnswer = (exerciseId: string, feeling: ExerciseFeeling) => {
    setAnswers((prev) => ({ ...prev, [exerciseId]: feeling }))
  }

  const save = () => {
    for (const [exerciseId, feeling] of Object.entries(answers)) {
      addExerciseFeedback(exerciseId, feeling)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-4">
      <div className="animate-fade-slide-up max-h-[85svh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl">
        <h2 className="mb-1 text-lg font-extrabold text-[#4a4453]">Hoe voelden de oefeningen?</h2>
        <p className="mb-4 text-sm text-[#7a7285]">
          Optioneel — hiermee leren we welke oefeningen fijn voor je zijn en welke minder. Dat sturen we
          mee in wat je de komende dagen aangeboden krijgt.
        </p>

        <div className="space-y-3">
          {exercises.map((ex) => (
            <div key={ex.id} className="rounded-2xl border-2 border-[#ece7ef] p-3">
              <p className="mb-2 text-sm font-bold text-[#4a4453]">{ex.name}</p>
              <div className="flex gap-2">
                {FEELINGS.map((feeling) => (
                  <button
                    key={feeling}
                    onClick={() => setAnswer(ex.id, feeling)}
                    className={`flex-1 rounded-xl border-2 px-2 py-2 text-xs font-bold ${
                      answers[ex.id] === feeling
                        ? 'border-mint-300 bg-mint-50 text-[#4a4453]'
                        : 'border-[#ece7ef] text-[#7a7285]'
                    }`}
                  >
                    {EXERCISE_FEELING_EMOJI[feeling]} {EXERCISE_FEELING_LABELS[feeling]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <PrimaryButton onClick={save}>
            {Object.keys(answers).length > 0 ? 'Opslaan' : 'Overslaan'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
