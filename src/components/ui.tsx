import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl bg-white/80 p-5 shadow-[0_8px_24px_-12px_rgba(120,100,140,0.25)] ${className}`}>
      {children}
    </div>
  )
}

export function PrimaryButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      className={`w-full rounded-2xl bg-mint-300 px-5 py-4 text-lg font-extrabold text-white shadow-[0_6px_16px_-6px_rgba(111,194,150,0.7)] transition active:scale-[0.98] active:shadow-none disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      className={`w-full rounded-2xl border-2 border-lavender-200 bg-white px-5 py-4 text-lg font-bold text-lavender-300 transition active:scale-[0.98] disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      className={`rounded-xl px-4 py-2 text-sm font-bold text-[#8a7f96] underline decoration-dotted underline-offset-4 active:scale-[0.98] ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-xl font-extrabold text-[#4a4453]">{children}</h2>
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'mint' | 'blush' | 'lavender' | 'peach' }) {
  const tones: Record<string, string> = {
    neutral: 'bg-[#f2eef7] text-[#6b6375]',
    mint: 'bg-mint-100 text-mint-400',
    blush: 'bg-blush-100 text-blush-300',
    lavender: 'bg-lavender-100 text-lavender-300',
    peach: 'bg-peach-100 text-[#c67b3e]',
  }
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>
}
