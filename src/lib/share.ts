// Deelt een bestand via de native share-sheet (AirDrop/Berichten/Mail/Bestanden
// op iOS) als dat beschikbaar is, met download als fallback voor browsers/
// desktops zonder Web Share API-ondersteuning voor bestanden.
export async function shareOrDownloadFile(content: string, filename: string, mime: string): Promise<void> {
  const file = new File([content], filename, { type: mime })
  const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean; share?: (data: ShareData) => Promise<void> }

  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file] })
      return
    } catch (e) {
      // Gebruiker annuleerde de share-sheet zelf: geen download-fallback nodig.
      if (e instanceof Error && e.name === 'AbortError') return
      // Andere fout (bijv. niet ondersteund in de praktijk ondanks canShare) -> val terug op downloaden.
    }
  }

  downloadFile(content, filename, mime)
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
