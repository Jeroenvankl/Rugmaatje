import type { TimerSound } from '../types'

// Geluidjes via de Web Audio API, i.p.v. een audiobestand: geen extra
// download/asset nodig en werkt ook offline (PWA).
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

interface Tone {
  freq: number
  start: number
  duration: number
}

function scheduleTones(ctx: AudioContext, tones: Tone[]) {
  const now = ctx.currentTime
  tones.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const startTime = now + start
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(startTime)
    osc.stop(startTime + duration + 0.05)
  })
}

const SOUND_DEFINITIONS: Record<TimerSound, (ctx: AudioContext) => void> = {
  // Zachte, oplopende drieklank (C5-E5-G5).
  chime: (ctx) =>
    scheduleTones(ctx, [
      { freq: 523.25, start: 0, duration: 0.3 },
      { freq: 659.25, start: 0.12, duration: 0.3 },
      { freq: 783.99, start: 0.24, duration: 0.3 },
    ]),
  // Duidelijke dubbele piep, beter hoorbaar als je niet actief oplet.
  beep: (ctx) =>
    scheduleTones(ctx, [
      { freq: 880, start: 0, duration: 0.15 },
      { freq: 880, start: 0.22, duration: 0.15 },
    ]),
  // Bel-achtig timbre: grondtoon + boventoon, iets langer uitklinkend.
  bell: (ctx) =>
    scheduleTones(ctx, [
      { freq: 987.77, start: 0, duration: 0.7 },
      { freq: 1975.53, start: 0, duration: 0.5 },
    ]),
}

export function playChime(sound: TimerSound = 'chime'): void {
  const ctx = getAudioContext()
  const play = () => SOUND_DEFINITIONS[sound](ctx)
  // Belangrijk voor iOS: de context kan tussentijds gesuspend zijn geraakt
  // (bijv. na de ~20-30 sec wachttijd van een set), ook al was hij bij het
  // starten van de set al "geprimed". Daarom hier vlak vóór het afspelen
  // nóg een keer hervatten, i.p.v. te vertrouwen op de eenmalige prime.
  if (ctx.state === 'suspended') {
    ctx.resume().then(play).catch(() => {})
  } else {
    play()
  }
}
