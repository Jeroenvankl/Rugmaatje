// Groeiend plantje als visuele beloning bij je level: van een klein takje met
// blaadje naar een steeds vollere bonsai. Hoe hoger je level, hoe verder de
// plant is gegroeid — een rustige, positieve motivator.

const LEAF = '#8fd3a6'
const LEAF_DARK = '#6cc296'
const TRUNK = '#8a5a3b'
const POT = '#cf8a63'
const POT_DARK = '#b9744f'
const SOIL = '#6f4a30'

export function plantStage(level: number): number {
  if (level <= 1) return 1
  if (level <= 3) return 2
  if (level <= 5) return 3
  if (level <= 7) return 4
  if (level <= 9) return 5
  return 6
}

export const PLANT_STAGE_LABELS: Record<number, string> = {
  1: 'Takje',
  2: 'Jong plantje',
  3: 'Groeiend',
  4: 'Jonge bonsai',
  5: 'Bonsai',
  6: 'Volle bonsai',
}

function Pot() {
  return (
    <>
      <path d="M15 38 L33 38 L31 47 Q24 49 17 47 Z" fill={POT} />
      <rect x="13" y="35" width="22" height="4.5" rx="2" fill={POT_DARK} />
      <ellipse cx="24" cy="37.2" rx="9" ry="1.6" fill={SOIL} />
    </>
  )
}

function Foliage({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={LEAF_DARK} />
      <circle cx={cx - r * 0.5} cy={cy + r * 0.2} r={r * 0.7} fill={LEAF} />
      <circle cx={cx + r * 0.55} cy={cy + r * 0.1} r={r * 0.65} fill={LEAF} />
      <circle cx={cx} cy={cy - r * 0.5} r={r * 0.6} fill={LEAF} />
    </g>
  )
}

function Leaf({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  return (
    <path
      d={`M${x} ${y} q ${flip ? -6 : 6} -3 ${flip ? -7 : 7} -9 q ${flip ? -4 : 4} 5 ${flip ? -2 : 2} 10 Z`}
      fill={LEAF}
    />
  )
}

function StageArt({ stage }: { stage: number }) {
  switch (stage) {
    case 1:
      // Takje met één blaadje in aarde
      return (
        <>
          <ellipse cx="24" cy="42" rx="10" ry="3" fill={SOIL} />
          <path d="M24 42 V30" stroke={TRUNK} strokeWidth="2.4" strokeLinecap="round" />
          <Leaf x={24} y={31} />
        </>
      )
    case 2:
      return (
        <>
          <Pot />
          <path d="M24 37 V26" stroke={TRUNK} strokeWidth="2.6" strokeLinecap="round" />
          <Leaf x={24} y={27} />
          <Leaf x={24} y={31} flip />
          <Leaf x={24} y={30} />
        </>
      )
    case 3:
      return (
        <>
          <Pot />
          <path d="M24 37 V22" stroke={TRUNK} strokeWidth="3" strokeLinecap="round" />
          <Foliage cx={24} cy={18} r={9} />
        </>
      )
    case 4:
      return (
        <>
          <Pot />
          <path d="M24 37 Q22 28 27 22" stroke={TRUNK} strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <Foliage cx={27} cy={19} r={8} />
          <Foliage cx={17} cy={24} r={6} />
        </>
      )
    case 5:
      return (
        <>
          <Pot />
          <path d="M24 37 Q20 28 26 21" stroke={TRUNK} strokeWidth="3.6" fill="none" strokeLinecap="round" />
          <path d="M23 30 Q17 28 14 24" stroke={TRUNK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <Foliage cx={27} cy={18} r={8} />
          <Foliage cx={13} cy={22} r={6.5} />
          <Foliage cx={33} cy={24} r={6} />
        </>
      )
    default:
      // Volle bonsai met meerdere aftakkingen
      return (
        <>
          <Pot />
          <path d="M24 37 Q19 27 24 19" stroke={TRUNK} strokeWidth="4.2" fill="none" strokeLinecap="round" />
          <path d="M23 29 Q15 27 11 22" stroke={TRUNK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M24 25 Q32 23 37 19" stroke={TRUNK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <Foliage cx={24} cy={15} r={8.5} />
          <Foliage cx={10} cy={19} r={7} />
          <Foliage cx={38} cy={16} r={7.5} />
          <Foliage cx={33} cy={26} r={6} />
          <Foliage cx={15} cy={27} r={5.5} />
        </>
      )
  }
}

export function LevelPlant({ level, size = 52 }: { level: number; size?: number }) {
  const stage = plantStage(level)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className="shrink-0"
      role="img"
      aria-label={`Level-plant: ${PLANT_STAGE_LABELS[stage]}`}
    >
      <StageArt stage={stage} />
    </svg>
  )
}
