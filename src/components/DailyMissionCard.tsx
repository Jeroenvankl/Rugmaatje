import { Card } from './ui'

interface MissionItem {
  label: string
  done: boolean
}

export function DailyMissionCard({ items }: { items: MissionItem[] }) {
  const doneCount = items.filter((i) => i.done).length
  const pct = Math.round((doneCount / items.length) * 100)
  const complete = doneCount === items.length

  return (
    <Card className={complete ? 'bg-mint-50/80' : ''}>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-extrabold text-[#4a4453]">Dagelijkse missie</p>
        <span className="text-sm font-bold text-[#8a7f96]">
          {doneCount}/{items.length}
        </span>
      </div>
      <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-[#f2eef7]">
        <div
          className="h-full rounded-full bg-mint-300 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                item.done ? 'bg-mint-300 text-white' : 'bg-[#f2eef7] text-transparent'
              }`}
            >
              ✓
            </span>
            <span className={item.done ? 'font-bold text-[#4a4453] line-through decoration-mint-300/60' : 'text-[#7a7285]'}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
      {complete && (
        <p className="mt-3 text-center text-sm font-bold text-mint-400">Helemaal klaar voor vandaag, wat fijn! 🌿</p>
      )}
    </Card>
  )
}
