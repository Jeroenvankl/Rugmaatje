import { useMemo } from 'react'
import { useAppData } from '../lib/AppDataContext'
import { Card, Pill, PrimaryButton } from '../components/ui'
import { isProgressionEligible } from '../lib/stoplight'
import { todayKey } from '../lib/dates'
import type { VolleyballPhase } from '../types'

const PHASES: { phase: VolleyballPhase; title: string; description: string }[] = [
  { phase: 1, title: 'Fase 1: techniek zonder belasting', description: 'Balcontact en techniek oefenen, zonder sprongen of smashes.' },
  { phase: 2, title: 'Fase 2: sprong opbouwen', description: 'Rustig opbouwen van sprongkracht en landingstechniek.' },
  { phase: 3, title: 'Fase 3: smash/serve opbouwen', description: 'Smash en opslag geleidelijk op kracht brengen.' },
  { phase: 4, title: 'Fase 4: volledige training', description: 'Volledig meetrainen; wedstrijden pas daarna, in overleg met je fysio.' },
]

export function VolleyballScreen() {
  const { data, updateSettings } = useAppData()
  const { unlockedByPhysio, currentPhase } = data.settings.volleyball

  const eligibleForNextPhase = useMemo(
    () => isProgressionEligible(data.checkIns, data.settings, todayKey()),
    [data.checkIns, data.settings],
  )

  if (!unlockedByPhysio) {
    return (
      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-28 pt-6">
        <h1 className="mb-4 text-xl font-extrabold text-[#4a4453]">Volleybal</h1>
        <Card className="border-2 border-lavender-100 bg-lavender-50 text-center">
          <div className="mb-2 text-3xl">🔒</div>
          <p className="mb-2 font-extrabold text-[#4a4453]">Nog vergrendeld</p>
          <p className="text-sm text-[#7a7285]">
            Volleybal is uitgesteld tot je fysio het expliciet vrijgeeft. Je kunt dit zelf aanzetten in
            Instellingen, zodra je die vrijgave hebt gekregen.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-5 pb-28 pt-6">
      <h1 className="mb-1 text-xl font-extrabold text-[#4a4453]">Volleybal — terugkeerschema</h1>
      <p className="mb-4 text-sm text-[#7a7285]">
        Gefaseerd opbouwen, met dezelfde stoplicht-regels per fase. Alleen bij consequent groen ga je door.
      </p>

      <div className="space-y-3">
        {PHASES.map((p) => {
          const status = p.phase < currentPhase ? 'afgerond' : p.phase === currentPhase ? 'actief' : 'op-slot'
          return (
            <Card
              key={p.phase}
              className={
                status === 'actief'
                  ? 'border-2 border-mint-200 bg-mint-50'
                  : status === 'op-slot'
                    ? 'opacity-50'
                    : ''
              }
            >
              <div className="mb-1 flex items-center justify-between">
                <p className="font-extrabold text-[#4a4453]">{p.title}</p>
                {status === 'actief' && <Pill tone="mint">actief</Pill>}
                {status === 'afgerond' && <Pill>afgerond</Pill>}
              </div>
              <p className="text-sm text-[#7a7285]">{p.description}</p>
            </Card>
          )
        })}
      </div>

      {currentPhase < 4 && (
        <Card className="mt-4">
          {eligibleForNextPhase ? (
            <>
              <p className="mb-2 text-sm font-bold text-[#4a4453]">
                Je stoplicht-geschiedenis is de afgelopen week consequent groen. Je mag door naar de
                volgende fase.
              </p>
              <PrimaryButton
                onClick={() => updateSettings({ volleyball: { ...data.settings.volleyball, currentPhase: (currentPhase + 1) as VolleyballPhase } })}
              >
                Naar {PHASES[currentPhase].title}
              </PrimaryButton>
            </>
          ) : (
            <p className="text-sm text-[#7a7285]">
              Blijf nog even in deze fase: pas bij een week met consequent groen kun je doorschuiven naar
              de volgende fase.
            </p>
          )}
        </Card>
      )}
    </div>
  )
}
