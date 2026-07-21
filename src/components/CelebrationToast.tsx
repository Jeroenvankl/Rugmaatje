import { useEffect } from 'react'
import { Confetti } from './Confetti'

export function CelebrationToast({
  message,
  onClose,
  withConfetti = true,
}: {
  message: string
  onClose: () => void
  withConfetti?: boolean
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white px-5 py-4 text-center shadow-xl">
        {withConfetti && <Confetti />}
        <p className="font-bold text-[#4a4453]">{message}</p>
      </div>
    </div>
  )
}
