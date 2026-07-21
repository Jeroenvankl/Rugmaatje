import { useState } from 'react'
import { useAppData } from '../lib/AppDataContext'
import { Card, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui'
import { DisclaimerContent } from '../components/DisclaimerModal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { requestNotificationPermission } from '../lib/notifications'

export function SettingsScreen() {
  const { data, updateSettings, resetData } = useAppData()
  const [showReset, setShowReset] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  const { settings } = data

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-5 pb-28 pt-6">
      <h1 className="mb-4 text-xl font-extrabold text-[#4a4453]">Instellingen</h1>

      <SectionTitle>Pijndrempels (stoplicht)</SectionTitle>
      <Card className="mb-5">
        <label className="mb-1 block text-sm font-bold text-[#7a7285]">
          Groen tot en met pijnscore: {settings.painThresholdGroenMax}
        </label>
        <input
          type="range"
          min={0}
          max={5}
          value={settings.painThresholdGroenMax}
          onChange={(e) =>
            updateSettings({
              painThresholdGroenMax: Math.min(Number(e.target.value), settings.painThresholdOranjeMax - 1),
            })
          }
          className="mb-4 w-full text-mint-300"
        />
        <label className="mb-1 block text-sm font-bold text-[#7a7285]">
          Amber tot en met pijnscore: {settings.painThresholdOranjeMax}
        </label>
        <input
          type="range"
          min={settings.painThresholdGroenMax + 1}
          max={9}
          value={settings.painThresholdOranjeMax}
          onChange={(e) => updateSettings({ painThresholdOranjeMax: Number(e.target.value) })}
          className="w-full text-stoplicht-amber"
        />
        <p className="mt-2 text-xs text-[#9d93a8]">Daarboven geldt automatisch rood.</p>
      </Card>

      <SectionTitle>Volleybal</SectionTitle>
      <Card className="mb-5">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-[#4a4453]">Volleybal vrijgegeven door fysio</span>
          <input
            type="checkbox"
            checked={settings.volleyball.unlockedByPhysio}
            onChange={(e) => updateSettings({ volleyball: { ...settings.volleyball, unlockedByPhysio: e.target.checked } })}
            className="h-5 w-5 accent-lavender-300"
          />
        </label>
        <p className="mt-2 text-xs text-[#9d93a8]">
          Zet dit alleen aan als je fysiotherapeut expliciet heeft aangegeven dat volleybal weer mag.
        </p>
      </Card>

      <SectionTitle>Herinnering</SectionTitle>
      <Card className="mb-5">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-[#4a4453]">Dagelijkse herinnering om in te checken</span>
          <input
            type="checkbox"
            checked={settings.reminder.enabled}
            onChange={async (e) => {
              const enabled = e.target.checked
              if (enabled) await requestNotificationPermission()
              updateSettings({ reminder: { ...settings.reminder, enabled } })
            }}
            className="h-5 w-5 accent-sky-200"
          />
        </label>
        {settings.reminder.enabled && (
          <div className="mt-3">
            <label className="mb-1 block text-sm font-bold text-[#7a7285]">Tijdstip</label>
            <input
              type="time"
              value={settings.reminder.time}
              onChange={(e) => updateSettings({ reminder: { ...settings.reminder, time: e.target.value } })}
              className="w-full rounded-2xl border-2 border-[#ece7ef] p-3 text-sm outline-none focus:border-sky-200"
            />
            <p className="mt-2 text-xs text-[#9d93a8]">
              Werkt alleen zolang RugMaatje geïnstalleerd is en je toestel dit toestaat. Geen pushmeldingen
              zonder server, dus dit is een lokale herinnering.
            </p>
          </div>
        )}
      </Card>

      <SectionTitle>Over RugMaatje</SectionTitle>
      <Card className="mb-5">
        <SecondaryButton onClick={() => setShowDisclaimer(true)}>Bekijk disclaimer</SecondaryButton>
      </Card>

      <SectionTitle>Gegevens</SectionTitle>
      <Card className="mb-5">
        <p className="mb-3 text-sm text-[#7a7285]">
          Al je gegevens staan alleen lokaal op dit toestel. Reset wist alles definitief.
        </p>
        <SecondaryButton onClick={() => setShowReset(true)}>Alles wissen</SecondaryButton>
      </Card>

      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-4">
          <div className="animate-fade-slide-up w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
            <h2 className="mb-3 text-lg font-extrabold text-[#4a4453]">Disclaimer</h2>
            <DisclaimerContent />
            <div className="mt-5">
              <PrimaryButton onClick={() => setShowDisclaimer(false)}>Sluiten</PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {showReset && (
        <ConfirmDialog
          title="Weet je het zeker?"
          message="Dit wist al je check-ins, oefeningen en geschiedenis definitief van dit toestel. Dit kan niet ongedaan gemaakt worden."
          confirmLabel="Ja, alles wissen"
          cancelLabel="Nee, annuleren"
          onCancel={() => setShowReset(false)}
          onConfirm={() => {
            resetData()
            setShowReset(false)
          }}
        />
      )}
    </div>
  )
}
