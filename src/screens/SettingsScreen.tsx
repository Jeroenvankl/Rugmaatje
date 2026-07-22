import { useRef, useState } from 'react'
import { useAppData } from '../lib/AppDataContext'
import { Card, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui'
import { DisclaimerContent } from '../components/DisclaimerModal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { requestNotificationPermission } from '../lib/notifications'
import { BackupParseError, exportBackupJson, parseBackupJson } from '../lib/storage'
import { buildPhysioReport, formatPhysioReportText } from '../lib/report'
import { shareOrDownloadFile } from '../lib/share'
import { playChime, primeAudio } from '../lib/sound'
import { todayKey, formatShortDate } from '../lib/dates'
import { TIMER_SOUND_LABELS, type AppData, type TimerSound } from '../types'

const TIMER_SOUND_OPTIONS: TimerSound[] = ['chime', 'beep', 'bell']

export function SettingsScreen() {
  const { data, updateSettings, resetData, importData, addPhysioNote, removePhysioNote } = useAppData()
  const [showReset, setShowReset] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const [pendingRestore, setPendingRestore] = useState<AppData | null>(null)
  const [newPhysioNote, setNewPhysioNote] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const recentPhysioNotes = data.physioNotes.slice().sort((a, b) => b.timestamp - a.timestamp)

  const handleAddPhysioNote = () => {
    if (!newPhysioNote.trim()) return
    addPhysioNote(newPhysioNote)
    setNewPhysioNote('')
  }

  const { settings } = data

  const handleBackupShare = () => {
    const json = exportBackupJson(data)
    shareOrDownloadFile(json, `rugmaatje-backup-${todayKey()}.json`, 'application/json')
  }

  const handlePhysioReportShare = () => {
    const report = buildPhysioReport(data, 28)
    const text = formatPhysioReportText(report)
    shareOrDownloadFile(text, `rugmaatje-fysio-overzicht-${todayKey()}.txt`, 'text/plain')
  }

  const handleFileChosen = async (file: File) => {
    setRestoreError(null)
    try {
      const text = await file.text()
      const restored = parseBackupJson(text)
      setPendingRestore(restored)
    } catch (e) {
      setRestoreError(e instanceof BackupParseError ? e.message : 'Kon dit bestand niet lezen als RugMaatje-back-up.')
    }
  }

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

      <SectionTitle>Rustdag-gedrag</SectionTitle>
      <Card className="mb-5">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-[#4a4453]">Optionele lichte stretch tonen bij rood</span>
          <input
            type="checkbox"
            checked={settings.showOptionalStretchOnRestDay}
            onChange={(e) => updateSettings({ showOptionalStretchOnRestDay: e.target.checked })}
            className="h-5 w-5 accent-sky-200"
          />
        </label>
        <p className="mt-2 text-xs text-[#9d93a8]">
          Staat dit uit, dan toont RugMaatje bij een rustdag (rood) helemaal geen oefeningen meer, alleen
          de melding om rust te nemen. Overleg dit met je fysio als je twijfelt wat het beste past.
        </p>
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

      <SectionTitle>Timer-geluid</SectionTitle>
      <Card className="mb-5">
        <p className="mb-3 text-sm text-[#7a7285]">
          Geluid dat de oefentimer afspeelt als een set voorbij is. Werkt dit niet goed op je iPhone
          (bijv. bij stille stand of schermvergrendeling)? Probeer een ander geluidje en test het hier
          direct.
        </p>
        <div className="mb-3 flex gap-2">
          {TIMER_SOUND_OPTIONS.map((sound) => (
            <button
              key={sound}
              onClick={() => updateSettings({ timerSound: sound })}
              className={`flex-1 rounded-xl border-2 px-2 py-2.5 text-sm font-bold ${
                settings.timerSound === sound ? 'border-sky-200 bg-sky-50 text-[#3d6d85]' : 'border-[#ece7ef] text-[#7a7285]'
              }`}
            >
              {TIMER_SOUND_LABELS[sound]}
            </button>
          ))}
        </div>
        <SecondaryButton
          onClick={() => {
            primeAudio()
            playChime(settings.timerSound)
          }}
        >
          🔊 Test geluid
        </SecondaryButton>
      </Card>

      <SectionTitle>Notities van je fysio</SectionTitle>
      <Card className="mb-5">
        <p className="mb-3 text-sm text-[#7a7285]">
          Leg vast wat je fysiotherapeut heeft gezegd of geadviseerd, bijvoorbeeld na een afspraak. Zo
          blijft dat advies bij de hand, en komt het straks ook mee in je fysio-overzicht.
        </p>
        <textarea
          value={newPhysioNote}
          onChange={(e) => setNewPhysioNote(e.target.value)}
          rows={2}
          placeholder="Bijvoorbeeld: bekkenkanteling nu 3x daags, lichte core-oefeningen mogen weer."
          className="mb-2 w-full rounded-2xl border-2 border-[#ece7ef] p-3 text-sm outline-none focus:border-lavender-300"
        />
        <SecondaryButton onClick={handleAddPhysioNote} className="mb-4">
          Notitie toevoegen
        </SecondaryButton>

        {recentPhysioNotes.length > 0 && (
          <div className="space-y-2">
            {recentPhysioNotes.map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-2 rounded-2xl border-2 border-[#ece7ef] p-3">
                <div>
                  <p className="text-xs font-bold text-[#9d93a8]">{formatShortDate(n.date)}</p>
                  <p className="text-sm text-[#4a4453]">{n.note}</p>
                </div>
                <button
                  onClick={() => removePhysioNote(n.id)}
                  className="shrink-0 text-lg font-bold leading-none text-[#9d93a8]"
                  aria-label="Notitie verwijderen"
                >
                  ×
                </button>
              </div>
            ))}
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
          Al je gegevens staan alleen lokaal op dit toestel. Maak regelmatig een back-up, zeker
          voor je van toestel wisselt — reset wist alles definitief.
        </p>

        <p className="mb-1 text-sm font-bold text-[#4a4453]">Overzicht voor je fysiotherapeut</p>
        <p className="mb-2 text-xs text-[#9d93a8]">
          Een leesbare samenvatting van de laatste 4 weken (gemiddelde pijn, stoplicht-verdeling,
          streak en bijzondere momenten). Op je iPhone kun je dit direct delen (bijv. via Berichten,
          Mail of AirDrop); anders wordt het gedownload.
        </p>
        <SecondaryButton onClick={handlePhysioReportShare} className="mb-4">
          Fysio-overzicht delen
        </SecondaryButton>

        <div className="my-4 h-px bg-[#ece7ef]" />

        <p className="mb-1 text-sm font-bold text-[#4a4453]">Back-up maken</p>
        <p className="mb-2 text-xs text-[#9d93a8]">
          Al je gegevens als één bestand (.json), dat je zelf kunt bewaren (bijv. in Bestanden/iCloud)
          om later terug te zetten. Op je iPhone kun je dit direct delen naar de Bestanden-app.
        </p>
        <SecondaryButton onClick={handleBackupShare} className="mb-4">
          Back-up delen
        </SecondaryButton>

        <p className="mb-1 text-sm font-bold text-[#4a4453]">Back-up herstellen</p>
        <p className="mb-2 text-xs text-[#9d93a8]">
          Let op: dit overschrijft je huidige gegevens op dit toestel met de inhoud van het
          back-upbestand.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileChosen(file)
            e.target.value = ''
          }}
        />
        <SecondaryButton onClick={() => fileInputRef.current?.click()} className="mb-2">
          Kies back-upbestand…
        </SecondaryButton>
        {restoreError && <p className="mb-2 text-xs font-bold text-blush-300">{restoreError}</p>}

        <div className="my-4 h-px bg-[#ece7ef]" />

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

      {pendingRestore && (
        <ConfirmDialog
          title="Back-up terugzetten?"
          message="Dit overschrijft al je huidige gegevens op dit toestel met de inhoud van dit back-upbestand. Dit kan niet ongedaan gemaakt worden."
          confirmLabel="Ja, terugzetten"
          cancelLabel="Nee, annuleren"
          onCancel={() => setPendingRestore(null)}
          onConfirm={() => {
            importData(pendingRestore)
            setPendingRestore(null)
          }}
        />
      )}
    </div>
  )
}
