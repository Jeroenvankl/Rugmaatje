import { useAppData } from '../lib/AppDataContext'
import { journeyProgress } from '../lib/journey'
import { Card } from './ui'

// De herstelreis als verticaal pad: behaalde mijlpalen zijn ingekleurd, de
// volgende is licht geaccentueerd zodat je ziet waar je naartoe werkt.
export function RecoveryJourney() {
  const { data } = useAppData()
  const { milestones, achievedCount, total, nextMilestone } = journeyProgress(data)

  return (
    <Card className="mb-4">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="font-extrabold text-[#4a4453]">Jouw herstelreis</p>
        <p className="text-sm font-bold text-[#9d93a8]">
          {achievedCount}/{total}
        </p>
      </div>

      <ol className="relative space-y-3 pl-1">
        {milestones.map((m, i) => {
          const isNext = nextMilestone?.id === m.id
          return (
            <li key={m.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base ${
                    m.achieved
                      ? 'bg-mint-100'
                      : isNext
                        ? 'border-2 border-lavender-300 bg-lavender-50'
                        : 'border-2 border-[#ece7ef] bg-white opacity-60'
                  }`}
                >
                  {m.achieved ? m.emoji : isNext ? m.emoji : '🔒'}
                </div>
                {i < milestones.length - 1 && (
                  <div className={`mt-1 w-0.5 flex-1 ${m.achieved ? 'bg-mint-200' : 'bg-[#ece7ef]'}`} style={{ minHeight: 14 }} />
                )}
              </div>
              <div className={`pb-1 ${m.achieved || isNext ? '' : 'opacity-60'}`}>
                <p className="text-sm font-bold text-[#4a4453]">
                  {m.title}
                  {isNext && <span className="ml-2 text-xs font-bold text-lavender-300">volgende</span>}
                </p>
                <p className="text-xs text-[#7a7285]">{m.description}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
