// Deelt een bestand via de native share-sheet (AirDrop/Berichten/Mail/Bestanden
// op iOS) als dat beschikbaar is, met download als fallback voor browsers/
// desktops zonder Web Share API-ondersteuning voor bestanden.

async function shareOrDownload(file: File): Promise<void> {
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

  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function shareOrDownloadFile(content: string, filename: string, mime: string): Promise<void> {
  return shareOrDownload(new File([content], filename, { type: mime }))
}

export function shareOrDownloadBlob(blob: Blob, filename: string): Promise<void> {
  return shareOrDownload(new File([blob], filename, { type: blob.type || 'application/octet-stream' }))
}
