const COLORS = ['#B7E4C7', '#F6C6D0', '#D9C6EC', '#FFD3AB', '#B3D3EA', '#FFE98A']

/** Lichte confetti-burst voor een klein feestelijk momentje. Geen geluid, subtiel. */
export function Confetti({ pieces = 14 }: { pieces?: number }) {
  const items = Array.from({ length: pieces }, (_, i) => i)
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-32 overflow-hidden" aria-hidden="true">
      {items.map((i) => {
        const left = 5 + ((i * 97) % 90)
        const delay = (i % 7) * 40
        const color = COLORS[i % COLORS.length]
        return (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${left}%`,
              background: color,
              animationDelay: `${delay}ms`,
            }}
          />
        )
      })}
    </div>
  )
}
