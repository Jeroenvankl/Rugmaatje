import { expect, test, type Page } from '@playwright/test'

// Dekt de kritieke, veiligheidsgevoelige flow van RugMaatje in een echte
// browser: disclaimer -> check-in -> stoplicht/oefeningen -> afronden, en
// het achteraf invullen van een gemiste dag (streak-herstel). Dit vult de
// Vitest-unittests aan, die losse functies testen maar niet of de schermen
// elkaar in de praktijk correct opvolgen.

async function acceptDisclaimer(page: Page) {
  await page.getByRole('button', { name: 'Ik begrijp het, ga verder' }).click()
}

async function completeCheckIn(page: Page) {
  // Stap 0: pijnscore (standaardwaarde laten staan) -> Volgende
  await page.getByRole('button', { name: 'Volgende' }).click()
  // Stap 1: locatie (overslaan) -> Volgende
  await page.getByRole('button', { name: 'Volgende' }).click()
  // Stap 2: uitstraling (standaard "Geen" laten staan) -> Volgende
  await page.getByRole('button', { name: 'Volgende' }).click()
  // Stap 3: notitie (overslaan) -> Volgende
  await page.getByRole('button', { name: 'Volgende' }).click()
  // Stap 4: optionele vragen (overslaan) -> Check-in afronden
  await page.getByRole('button', { name: 'Check-in afronden' }).click()
}

test('check-in, oefening afronden en gemiste dag herstellen houdt de streak in leven', async ({ page }) => {
  await page.goto('/')

  await acceptDisclaimer(page)
  await completeCheckIn(page)

  // Een eerste check-in verdient meteen de "Eerste stap"-badge; die modal
  // moet weg voordat we verder kunnen klikken.
  const badgeYesButton = page.getByRole('button', { name: 'Yes!' })
  if (await badgeYesButton.isVisible().catch(() => false)) {
    await badgeYesButton.click()
  }

  // Na de check-in landen we op het Vandaag-scherm met een stoplicht-status.
  await expect(page.getByRole('heading', { name: 'Vandaag' })).toBeVisible()
  await expect(page.getByText(/Groen|Amber|Rood/)).toBeVisible()

  // Er staat minstens één oefening klaar; vink de eerste aan en rond af.
  const firstExercise = page.locator('ul li button').first()
  await expect(firstExercise).toBeVisible()
  await firstExercise.click()
  await page.getByRole('button', { name: 'Oefeningen afronden' }).click()
  await expect(page.getByText('Dagoefeningen afgerond')).toBeVisible()

  // Simuleer een gemiste dag: laatste check-in was 2 dagen geleden i.p.v. gisteren.
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('rugmaatje_data_v1')!)
    const today = new Date()
    const twoDaysAgo = new Date(today)
    twoDaysAgo.setDate(today.getDate() - 2)
    const toKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const todayKey = toKey(today)
    const twoDaysAgoKey = toKey(twoDaysAgo)

    raw.data.checkIns = raw.data.checkIns.filter((c: { date: string }) => c.date === todayKey)
    raw.data.checkIns.push({
      id: 'seed-2-days-ago',
      date: twoDaysAgoKey,
      timestamp: twoDaysAgo.getTime(),
      painScore: 1,
      locations: [],
      radiating: 'geen',
    })
    raw.data.streak.lastCheckInDate = twoDaysAgoKey
    raw.data.streak.currentStreak = 1
    localStorage.setItem('rugmaatje_data_v1', JSON.stringify(raw))
  })
  await page.reload()

  // De banner om de gemiste dag (gisteren) alsnog in te vullen moet verschijnen.
  await expect(page.getByText('Dag gemist door drukte? Geen probleem')).toBeVisible()
  await page.getByRole('button', { name: 'Invullen' }).click()
  await expect(page.getByRole('heading', { name: 'Gemiste dag invullen' })).toBeVisible()
  await page.getByRole('button', { name: 'Opslaan' }).click()

  // Het invullen kan een nieuwe streak-badge opleveren (bijv. "Drie op rij").
  if (await badgeYesButton.isVisible().catch(() => false)) {
    await badgeYesButton.click()
  }

  // Streak loopt weer door: de gemiste-dag-banner is verdwenen en de
  // streak-badge staat er nog steeds (exacte telling wordt al gedekt door
  // de Vitest-unittests voor recalculateStreak).
  await expect(page.getByText('Dag gemist door drukte? Geen probleem')).not.toBeVisible()
  await expect(page.getByText('op rij ingecheckt')).toBeVisible()
})
