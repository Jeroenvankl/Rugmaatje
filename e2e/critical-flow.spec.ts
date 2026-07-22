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

test('duimpje-snelkeuze vult de check-in van vandaag in op basis van de vorige keer', async ({ page }) => {
  await page.goto('/')
  await acceptDisclaimer(page)
  await completeCheckIn(page)

  const badgeYesButton = page.getByRole('button', { name: 'Yes!' })
  if (await badgeYesButton.isVisible().catch(() => false)) {
    await badgeYesButton.click()
  }

  // Simuleer "de volgende dag": verwijder de check-in van vandaag zodat het
  // CheckInScreen opnieuw verschijnt, met gisteren als vorige check-in.
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('rugmaatje_data_v1')!)
    const today = new Date()
    const toKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const todayKey = toKey(today)
    raw.data.checkIns.forEach((c: { date: string }) => {
      if (c.date === todayKey) c.date = '2020-01-01'
    })
    raw.data.streak.lastCheckInDate = '2020-01-01'
    localStorage.setItem('rugmaatje_data_v1', JSON.stringify(raw))
  })
  await page.reload()

  // Stap 0 (pijnscore) -> Volgende brengt ons nu op de duimpje-stap.
  await page.getByRole('button', { name: 'Volgende' }).click()
  await expect(page.getByText('Verder nog bijzonderheden, of net als de vorige keer?')).toBeVisible()
  await page.getByRole('button', { name: '👍 Net als de vorige keer, verder niks bijzonders' }).click()

  // Direct afgerond: we landen op het Vandaag-scherm zonder de tussenliggende stappen.
  await expect(page.getByRole('heading', { name: 'Vandaag' })).toBeVisible()
})

test('timer bij tijd-oefeningen telt af en biedt de oefening als afgerond aan', async ({ page }) => {
  // De countdown gebruikt een kettende setTimeout (elke tik plant de
  // volgende), wat niet betrouwbaar samengaat met Playwright's fake clock
  // (React's effect-scheduling loopt net iets anders dan de virtuele klok
  // verwacht). Daarom hier gewoon echte tijd afwachten i.p.v. clock-mocking;
  // dat is voor déze ene test de simpelste en meest betrouwbare aanpak.
  test.setTimeout(60_000)
  await page.goto('/')

  await acceptDisclaimer(page)
  await completeCheckIn(page)

  const badgeYesButton = page.getByRole('button', { name: 'Yes!' })
  if (await badgeYesButton.isVisible().catch(() => false)) {
    await badgeYesButton.click()
  }

  const startButton = page.getByRole('button', { name: /Start oefening/ }).first()
  await expect(startButton).toBeVisible()
  await startButton.click()

  await expect(page.getByText(/Set 1 van/)).toBeVisible()

  // Alle standaard tijd-oefeningen duren maximaal 30 sec per set; ruim
  // daarboven wachten is altijd genoeg om de eerste set te laten aflopen.
  await expect(page.getByText(/klaar! 🔔/)).toBeVisible({ timeout: 33_000 })
})
