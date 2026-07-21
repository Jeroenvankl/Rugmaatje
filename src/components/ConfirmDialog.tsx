import { SecondaryButton } from './ui'

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Ja, toch doen',
  cancelLabel = 'Nee, advies volgen',
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-5">
      <div className="animate-pop-in w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="mb-2 text-lg font-extrabold text-[#4a4453]">{title}</h2>
        <p className="mb-5 text-sm leading-relaxed text-[#6b6375]">{message}</p>
        <div className="flex flex-col gap-2">
          <SecondaryButton onClick={onCancel}>{cancelLabel}</SecondaryButton>
          <button onClick={onConfirm} className="w-full rounded-2xl px-5 py-3 text-sm font-bold text-[#9d93a8] underline">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
