import { PrimaryButton } from './ui'

export function DisclaimerContent() {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-[#5b5364]">
      <p>
        RugMaatje is een hulpmiddel om je oefeningen en rust bij te houden, volgens het
        advies van jouw fysiotherapeut.
      </p>
      <p className="font-extrabold text-[#4a4453]">
        RugMaatje is geen medisch hulpmiddel en vervangt geen zorgverlener.
      </p>
      <p>
        Twijfel je over je klachten, of nemen ze toe? Neem dan altijd contact op met je
        fysiotherapeut of huisarts.
      </p>
      <p className="rounded-2xl bg-blush-50 p-3 text-sm font-bold text-blush-300">
        Bij problemen met plassen of ontlasting, of een doof gevoel rond het zadelgebied:
        neem direct contact op met medische spoedhulp.
      </p>
      <p>Al je gegevens blijven op jouw toestel. Er is geen account, geen server, geen tracking.</p>
    </div>
  )
}

export function DisclaimerModal({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-4">
      <div className="animate-fade-slide-up w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-3 text-center text-3xl">🌷</div>
        <h1 className="mb-3 text-center text-2xl font-extrabold text-[#4a4453]">Welkom bij RugMaatje</h1>
        <DisclaimerContent />
        <div className="mt-5">
          <PrimaryButton onClick={onAccept}>Ik begrijp het, ga verder</PrimaryButton>
        </div>
      </div>
    </div>
  )
}
