import { useState } from 'react'
import { useAppData } from '../lib/AppDataContext'
import { Card, GhostButton, Pill, PrimaryButton, SecondaryButton } from '../components/ui'
import { AVOID_LIST } from '../data/defaultExercises'
import { EXERCISE_CATEGORY_LABELS, type Exercise, type ExerciseCategory } from '../types'

const emptyForm = {
  name: '',
  goal: '',
  cue: '',
  category: 'mobiliteit' as ExerciseCategory,
  sets: 2,
  useReps: true,
  reps: 10,
  durationSec: 30,
}

export function ExercisesScreen() {
  const { data, updateExercise, addExercise, removeExercise } = useAppData()
  const [editing, setEditing] = useState<Exercise | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const startEdit = (ex: Exercise) => {
    setEditing(ex)
    setForm({
      name: ex.name,
      goal: ex.goal,
      cue: ex.cue,
      category: ex.category,
      sets: ex.sets,
      useReps: ex.reps != null,
      reps: ex.reps ?? 10,
      durationSec: ex.durationSec ?? 30,
    })
  }

  const startAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowAdd(true)
  }

  const closeForm = () => {
    setEditing(null)
    setShowAdd(false)
  }

  const saveForm = () => {
    const payload = {
      name: form.name.trim() || 'Nieuwe oefening',
      goal: form.goal.trim(),
      cue: form.cue.trim(),
      category: form.category,
      sets: form.sets,
      reps: form.useReps ? form.reps : null,
      durationSec: form.useReps ? null : form.durationSec,
      enabled: true,
      level: 'basis' as const,
    }
    if (editing) {
      updateExercise({ ...editing, ...payload })
    } else {
      addExercise(payload)
    }
    closeForm()
  }

  const isFormOpen = showAdd || editing !== null

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-5 pb-28 pt-6">
      <h1 className="mb-1 text-xl font-extrabold text-[#4a4453]">Oefeningenbibliotheek</h1>
      <p className="mb-4 text-sm text-[#7a7285]">
        Rug altijd plat of bol, nooit hol. Herhalingen en sets zijn per oefening instelbaar.
      </p>

      <div className="mb-4 space-y-3">
        {data.exercises.map((ex) => (
          <Card key={ex.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="font-extrabold text-[#4a4453]">{ex.name}</p>
                  <Pill tone={ex.category === 'kracht' ? 'blush' : ex.category === 'stretch' ? 'lavender' : 'mint'}>
                    {EXERCISE_CATEGORY_LABELS[ex.category]}
                  </Pill>
                  {ex.level === 'opgebouwd' && <Pill tone="peach">opgebouwd 🌟</Pill>}
                </div>
                <p className="text-sm text-[#7a7285]">{ex.goal}</p>
                <p className="mt-1 text-xs italic text-[#9d93a8]">{ex.cue}</p>
                <p className="mt-2 text-sm font-bold text-[#4a4453]">
                  {ex.sets} x {ex.reps != null ? ex.reps : `${ex.durationSec} sec`}
                </p>
              </div>
              <label className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-[#7a7285]">
                <input
                  type="checkbox"
                  checked={ex.enabled}
                  onChange={() => updateExercise({ ...ex, enabled: !ex.enabled })}
                  className="h-4 w-4 accent-mint-300"
                />
                aan
              </label>
            </div>
            <div className="mt-3 flex gap-3">
              <GhostButton onClick={() => startEdit(ex)}>Aanpassen</GhostButton>
              {ex.isCustom && (
                <GhostButton onClick={() => removeExercise(ex.id)}>Verwijderen</GhostButton>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Card className="mb-4 border-2 border-blush-100 bg-blush-50">
        <p className="mb-2 font-extrabold text-blush-300">Vermijden</p>
        <ul className="list-inside list-disc space-y-1 text-sm text-[#7a4551]">
          {AVOID_LIST.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>

      <p className="mb-3 text-center text-xs text-[#9d93a8]">
        Nieuwe oefening toevoegen? Overleg dit eerst met je fysio.
      </p>
      <SecondaryButton onClick={startAdd}>+ Eigen oefening toevoegen</SecondaryButton>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center sm:p-4">
          <div className="animate-fade-slide-up max-h-[85svh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <h2 className="mb-4 text-lg font-extrabold text-[#4a4453]">
              {editing ? 'Oefening aanpassen' : 'Eigen oefening toevoegen'}
            </h2>

            <label className="mb-1 block text-sm font-bold text-[#7a7285]">Naam</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mb-3 w-full rounded-2xl border-2 border-[#ece7ef] p-3 text-sm outline-none focus:border-lavender-300"
            />

            <label className="mb-1 block text-sm font-bold text-[#7a7285]">Doel</label>
            <input
              value={form.goal}
              onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
              className="mb-3 w-full rounded-2xl border-2 border-[#ece7ef] p-3 text-sm outline-none focus:border-lavender-300"
            />

            <label className="mb-1 block text-sm font-bold text-[#7a7285]">Houdingscue</label>
            <input
              value={form.cue}
              onChange={(e) => setForm((f) => ({ ...f, cue: e.target.value }))}
              placeholder="bv. rug blijft plat of bol, nooit hol"
              className="mb-3 w-full rounded-2xl border-2 border-[#ece7ef] p-3 text-sm outline-none focus:border-lavender-300"
            />

            <label className="mb-1 block text-sm font-bold text-[#7a7285]">Categorie</label>
            <div className="mb-3 flex gap-2">
              {(Object.keys(EXERCISE_CATEGORY_LABELS) as ExerciseCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setForm((f) => ({ ...f, category: cat }))}
                  className={`flex-1 rounded-xl border-2 px-2 py-2 text-xs font-bold ${
                    form.category === cat ? 'border-lavender-300 bg-lavender-100' : 'border-[#ece7ef]'
                  }`}
                >
                  {EXERCISE_CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            <label className="mb-1 block text-sm font-bold text-[#7a7285]">Sets</label>
            <input
              type="number"
              min={1}
              value={form.sets}
              onChange={(e) => setForm((f) => ({ ...f, sets: Number(e.target.value) }))}
              className="mb-3 w-full rounded-2xl border-2 border-[#ece7ef] p-3 text-sm outline-none focus:border-lavender-300"
            />

            <div className="mb-3 flex gap-2">
              <button
                onClick={() => setForm((f) => ({ ...f, useReps: true }))}
                className={`flex-1 rounded-xl border-2 px-2 py-2 text-xs font-bold ${form.useReps ? 'border-lavender-300 bg-lavender-100' : 'border-[#ece7ef]'}`}
              >
                Herhalingen
              </button>
              <button
                onClick={() => setForm((f) => ({ ...f, useReps: false }))}
                className={`flex-1 rounded-xl border-2 px-2 py-2 text-xs font-bold ${!form.useReps ? 'border-lavender-300 bg-lavender-100' : 'border-[#ece7ef]'}`}
              >
                Duur (sec)
              </button>
            </div>

            {form.useReps ? (
              <input
                type="number"
                min={1}
                value={form.reps}
                onChange={(e) => setForm((f) => ({ ...f, reps: Number(e.target.value) }))}
                className="mb-4 w-full rounded-2xl border-2 border-[#ece7ef] p-3 text-sm outline-none focus:border-lavender-300"
              />
            ) : (
              <input
                type="number"
                min={1}
                value={form.durationSec}
                onChange={(e) => setForm((f) => ({ ...f, durationSec: Number(e.target.value) }))}
                className="mb-4 w-full rounded-2xl border-2 border-[#ece7ef] p-3 text-sm outline-none focus:border-lavender-300"
              />
            )}

            <div className="flex gap-2">
              <SecondaryButton onClick={closeForm}>Annuleren</SecondaryButton>
              <PrimaryButton onClick={saveForm}>Opslaan</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
