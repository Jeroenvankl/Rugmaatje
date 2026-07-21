export type TabKey = 'vandaag' | 'oefeningen' | 'geschiedenis' | 'volleybal' | 'instellingen'

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: 'vandaag', label: 'Vandaag', emoji: '🏡' },
  { key: 'oefeningen', label: 'Oefeningen', emoji: '🧘' },
  { key: 'geschiedenis', label: 'Historie', emoji: '📈' },
  { key: 'volleybal', label: 'Volleybal', emoji: '🏐' },
  { key: 'instellingen', label: 'Instellingen', emoji: '⚙️' },
]

export function BottomNav({ active, onChange }: { active: TabKey; onChange: (tab: TabKey) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#f0ebf4] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-bold transition ${
              active === tab.key ? 'text-lavender-300' : 'text-[#b3a9bd]'
            }`}
          >
            <span className={`text-xl transition ${active === tab.key ? 'scale-110' : ''}`}>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
