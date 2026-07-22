import { useEffect, useState } from 'react'

const DISMISS_KEY = 'rugmaatje_install_banner_dismissed_at'
const DISMISS_DAYS = 30

function isIos(): boolean {
  const ua = navigator.userAgent
  const isIphoneOrIpad = /iPad|iPhone|iPod/.test(ua)
  // iPadOS 13+ meldt zich als "Mac" in de user agent, maar heeft wél touch.
  const isIpadOS13Plus = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return isIphoneOrIpad || isIpadOS13Plus
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

// Alleen relevant op iOS: Safari heeft geen "installeren"-prompt zoals Android
// Chrome, dus zonder deze banner installeert bijna niemand de app ooit via
// "Zet op beginscherm" — en blijft RugMaatje in een gewone Safari-tab open,
// waar tabbeheer/opschonen eerder tot dataverlies kan leiden dan in de
// geïnstalleerde app.
export function InstallBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isIos() || isStandalone()) return
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0)
    const daysSinceDismiss = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24)
    if (dismissedAt && daysSinceDismiss < DISMISS_DAYS) return
    setVisible(true)
  }, [])

  if (!visible) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setVisible(false)
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-3">
      <div className="flex items-start gap-3 rounded-2xl border-2 border-lavender-200 bg-lavender-50 p-4">
        <span className="text-xl">📲</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-[#4a4453]">Zet RugMaatje op je beginscherm</p>
          <p className="mt-1 text-xs leading-relaxed text-[#7a7285]">
            Tik onderin Safari op het deel-icoon (vierkant met pijl omhoog) en kies "Zet op
            beginscherm". Dan open je RugMaatje voortaan als app, sneller en betrouwbaarder.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 text-lg font-bold leading-none text-[#9d93a8]"
          aria-label="Banner sluiten"
        >
          ×
        </button>
      </div>
    </div>
  )
}
