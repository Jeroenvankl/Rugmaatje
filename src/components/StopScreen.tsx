// Bewust NIET speels: geen confetti, geen grapjes, rustige en heldere waarschuwing.
export function StopScreen({ reasons }: { reasons: string[] }) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="rounded-3xl border-2 border-[#e3b3bd] bg-[#fdf1f3] p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#9c2f43] text-xl text-white">
            !
          </div>
          <h1 className="text-xl font-extrabold text-[#7a1f2b]">Neem vandaag rust</h1>
        </div>

        <p className="mb-4 text-[15px] leading-relaxed text-[#5c2530]">
          Je uitstraling wijst erop dat het verstandig is om vandaag géén oefeningen te doen.
          Neem rust en neem contact op met je fysiotherapeut of huisarts.
        </p>

        {reasons.length > 0 && (
          <ul className="mb-4 list-inside list-disc space-y-1 text-sm text-[#7a3441]">
            {reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}

        <div className="rounded-2xl border-2 border-[#9c2f43] bg-white p-4">
          <p className="text-sm font-extrabold text-[#7a1f2b]">Directe spoedmelding</p>
          <p className="mt-1 text-sm leading-relaxed text-[#5c2530]">
            Heb je problemen met plassen of ontlasting, of een doof gevoel rond het zadelgebied?
            Neem dan direct contact op met medische spoedhulp (huisartsenpost / 112).
          </p>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-[#9d93a8]">
        RugMaatje is geen medisch hulpmiddel en vervangt geen zorgverlener.
      </p>
    </div>
  )
}
