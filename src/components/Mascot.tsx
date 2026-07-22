export type MascotMood = 'blij' | 'trots' | 'rustig' | 'zorgzaam' | 'neutraal'

const FUR = '#c06b3a' // warme roodbruine vacht (bovenkant)
const FUR_DARK = '#7c4326' // donkere strepen / accent
const BELLY = '#4b2f20' // donkere buik/poten, kenmerkend voor de rode panda
const CREAM = '#f5e7d1' // gezicht, oorranden, staartringen
const EYE = '#2f241e'

function Mouth({ mood }: { mood: MascotMood }) {
  switch (mood) {
    case 'trots':
      return <path d="M34 41 Q40 48 46 41 Q40 45 34 41 Z" fill="#6d3526" />
    case 'blij':
      return <path d="M35 41 Q40 46 45 41" stroke="#6d3526" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    case 'rustig':
      return <path d="M36 42 Q40 45 44 42" stroke="#6d3526" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    case 'zorgzaam':
      return <path d="M36 44 Q40 41 44 44" stroke="#6d3526" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    case 'neutraal':
      return <path d="M37 43 H43" stroke="#6d3526" strokeWidth="2.2" fill="none" strokeLinecap="round" />
  }
}

// Een rode panda in animatiestijl met een voller lijf: zittend, met pootjes en
// een grote geringde staart. Licht geanimeerd (deint, kwispelt, knippert).
// Puur presentatie; stemming en tekst komen van buitenaf.
export function Mascot({ mood, message, size = 88 }: { mood: MascotMood; message?: string; size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        className="shrink-0"
        role="img"
        aria-label={`RugMaatje (rode panda) is ${mood}`}
      >
        <ellipse cx="40" cy="75" rx="24" ry="3.5" fill="#000" opacity="0.07" />

        <g className="mascot-bob">
          {/* Grote geringde staart: dikke basisstreek + crème ringen eroverheen */}
          <g className="mascot-tail">
            <path
              d="M50 62 Q72 60 68 34 Q66 22 55 25"
              fill="none"
              stroke={FUR}
              strokeWidth="13"
              strokeLinecap="round"
            />
            <path
              d="M50 62 Q72 60 68 34 Q66 22 55 25"
              fill="none"
              stroke={CREAM}
              strokeWidth="13"
              strokeLinecap="butt"
              strokeDasharray="4 12"
              strokeDashoffset="-10"
              opacity="0.9"
            />
          </g>

          {/* Achterpoten / voetjes (donker) */}
          <ellipse cx="30" cy="68" rx="7" ry="5" fill={BELLY} />
          <ellipse cx="50" cy="68" rx="7" ry="5" fill={BELLY} />

          {/* Lijf (zittend), roodbruin met donkere buik */}
          <path
            d="M40 34 C25 34 21 50 24 61 C26 69 33 72 40 72 C47 72 54 69 56 61 C59 50 55 34 40 34 Z"
            fill={FUR}
          />
          <path
            d="M40 44 C33 44 30 54 32 62 C34 68 37 70 40 70 C43 70 46 68 48 62 C50 54 47 44 40 44 Z"
            fill={BELLY}
          />

          {/* Voorpootjes samen vooraan */}
          <ellipse cx="35" cy="66" rx="4.5" ry="6" fill={BELLY} />
          <ellipse cx="45" cy="66" rx="4.5" ry="6" fill={BELLY} />

          {/* Oren */}
          <circle cx="26" cy="15" r="8.5" fill={FUR} />
          <circle cx="26" cy="15.5" r="4.3" fill={CREAM} />
          <circle cx="54" cy="15" r="8.5" fill={FUR} />
          <circle cx="54" cy="15.5" r="4.3" fill={CREAM} />

          {/* Hoofd */}
          <circle cx="40" cy="28" r="19" fill={FUR} />

          {/* Witte gezichtsmarkering (wangen + snuit) */}
          <ellipse cx="29" cy="32" rx="8.5" ry="8" fill={CREAM} />
          <ellipse cx="51" cy="32" rx="8.5" ry="8" fill={CREAM} />
          <ellipse cx="40" cy="35" rx="8.5" ry="8" fill={CREAM} />
          <ellipse cx="31" cy="19" rx="4.2" ry="3.2" fill={CREAM} />
          <ellipse cx="49" cy="19" rx="4.2" ry="3.2" fill={CREAM} />

          {/* Kenmerkende roodbruine traanstrepen van oog naar snuit */}
          <path d="M32 26 Q30 33 33 39 Q35 33 34 27 Z" fill={FUR_DARK} opacity="0.6" />
          <path d="M48 26 Q50 33 47 39 Q45 33 46 27 Z" fill={FUR_DARK} opacity="0.6" />

          {/* Ogen (knipperen) */}
          <g className="mascot-eyes">
            <ellipse cx="32.5" cy="27" rx="3.4" ry="3.8" fill={EYE} />
            <ellipse cx="47.5" cy="27" rx="3.4" ry="3.8" fill={EYE} />
            <circle cx="33.7" cy="25.8" r="1.1" fill="#fff" />
            <circle cx="48.7" cy="25.8" r="1.1" fill="#fff" />
          </g>

          {/* Blosjes */}
          <circle cx="26" cy="34" r="2.6" fill="#eaa0a6" opacity="0.7" />
          <circle cx="54" cy="34" r="2.6" fill="#eaa0a6" opacity="0.7" />

          {/* Neus + mond */}
          <path d="M37.5 35.5 h5 l-2.5 3 Z" fill="#3a2a22" />
          <Mouth mood={mood} />
        </g>
      </svg>
      {message && <p className="text-sm font-bold leading-snug text-[#4a4453]">{message}</p>}
    </div>
  )
}
