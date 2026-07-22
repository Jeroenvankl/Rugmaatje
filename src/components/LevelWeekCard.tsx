import { useAppData } from '../lib/AppDataContext'
import { getLevelInfo } from '../lib/gamification'
import { computeWeeklyGoalProgress } from '../lib/goals'
import { todayKey } from '../lib/dates'
import { LevelPlant, PLANT_STAGE_LABELS, plantStage } from './LevelPlant'
import { Card } from './ui'

// Klein voortgangs-ringetje (SVG) voor het weekdoel.
function GoalRing({ achieved, goal }: { achieved: number; goal: number }) {
  const pct = Math.min(1, achieved / goal)
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#ece7ef" strokeWidth="7" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="#8fd3a6"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="34" textAnchor="middle" dominantBaseline="middle" className="fill-[#4a4453] text-[15px] font-black">
        {achieved}/{goal}
      </text>
    </svg>
  )
}

export function LevelWeekCard() {
  const { data } = useAppData()
  const level = getLevelInfo(data)
  const goal = computeWeeklyGoalProgress(data, todayKey())

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex flex-col items-center">
            <LevelPlant level={level.level} />
            <p className="text-[10px] font-bold text-mint-400">{PLANT_STAGE_LABELS[plantStage(level.level)]}</p>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <p className="font-extrabold text-[#4a4453]">Level {level.level}</p>
              <p className="truncate text-xs font-bold text-[#9d93a8]">{level.title}</p>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#ece7ef]">
              <div
                className="h-full rounded-full bg-lavender-300 transition-all"
                style={{ width: `${Math.round(level.progress * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-[#9d93a8]">
              Nog {Math.max(0, level.xpForNextLevel - level.xpIntoLevel)} XP tot level {level.level + 1}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <GoalRing achieved={goal.achieved} goal={goal.goal} />
          <p className="mt-1 text-[11px] font-bold text-[#9d93a8]">weekdoel</p>
        </div>
      </div>
      {goal.reached && (
        <p className="mt-3 text-sm font-bold text-mint-400">🎯 Weekdoel gehaald — sterk gedaan!</p>
      )}
    </Card>
  )
}
