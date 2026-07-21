import type { BadgeDef } from '../lib/badges'
import { Confetti } from './Confetti'
import { PrimaryButton } from './ui'

export function BadgeEarnedModal({ badge, onClose }: { badge: BadgeDef; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-5">
      <div className="animate-pop-in relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <Confetti pieces={20} />
        <div className="mb-2 text-6xl">{badge.emoji}</div>
        <p className="mb-1 text-xs font-black uppercase tracking-wide text-blush-300">Nieuwe badge!</p>
        <h2 className="mb-2 text-xl font-extrabold text-[#4a4453]">{badge.name}</h2>
        <p className="mb-5 text-sm text-[#7a7285]">{badge.description}</p>
        <PrimaryButton onClick={onClose}>Yes!</PrimaryButton>
      </div>
    </div>
  )
}
