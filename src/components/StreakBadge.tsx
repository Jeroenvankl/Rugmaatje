import type { StreakData } from '../types'

export function StreakBadge({ streak }: { streak: StreakData }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-butter-100 px-4 py-2 shadow-sm">
      <span className="text-xl">🔥</span>
      <div className="leading-tight">
        <div className="text-sm font-black text-[#8a6a1a]">{streak.currentStreak} {streak.currentStreak === 1 ? 'dag' : 'dagen'}</div>
        <div className="text-[10px] font-bold text-[#a98d3f]">op rij ingecheckt</div>
      </div>
    </div>
  )
}
