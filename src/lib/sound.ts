// Zachte, oplopende drieklank (C5-E5-G5) via de Web Audio API, i.p.v. een
// audiobestand: geen extra download/asset nodig en werkt ook offline (PWA).
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx = new AudioContextClass()
  }
  return audioCtx
}

/**
 * "Warmt" de AudioContext op binnen een echte user-gesture (bijv. een tik op
 * "Start oefening"). Browsers staan geluid afspelen later (via een timer)
 * alleen toe als de context al eerder, binnen een gebruikersactie, is
 * gestart/hervat.
 */
export function primeAudio(): void {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
}

export function playChime(): void {
  const ctx = getAudioContext()
  const now = ctx.currentTime
  const notes = [523.25, 659.25, 783.99]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const start = now + i * 0.12
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.2, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.35)
  })
}
