import { useAppData } from '../lib/AppDataContext'

// Toont een duidelijke waarschuwing zodra een schrijfactie naar localStorage
// is mislukt (opslag vol of geblokkeerd), in plaats van dat dit stil
// voorbijgaat en er later data blijkt te ontbreken.
export function StorageErrorBanner() {
  const { storageError, clearStorageError } = useAppData()

  if (!storageError) return null

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-3">
      <div className="flex items-start gap-3 rounded-2xl border-2 border-blush-200 bg-blush-50 p-4">
        <span className="text-xl">⚠️</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-blush-300">Niet opgeslagen</p>
          <p className="mt-1 text-xs leading-relaxed text-[#7a3441]">{storageError}</p>
        </div>
        <button
          onClick={clearStorageError}
          className="shrink-0 text-lg font-bold leading-none text-[#9d93a8]"
          aria-label="Melding sluiten"
        >
          ×
        </button>
      </div>
    </div>
  )
}
