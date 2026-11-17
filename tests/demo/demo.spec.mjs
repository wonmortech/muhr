// SPDX-FileCopyrightText: 2026 Wonmor and Muhr contributors
// SPDX-License-Identifier: Apache-2.0

// Every screen of the concept demo renders real content, shows the demo note and logs no errors; the main flows work.
import { test, expect } from '@playwright/test'

const ROUTES = [
  ['/', 'Umumiy koʻrinish'], ['/stamp', 'Faylni muhrlash'], ['/receipts', 'Kvitansiyalarim'], ['/receipts/r-contract', 'Inclusion proof'],
  ['/receipts/r1000', 'EIMZO imzosi'], ['/receipts/nope', 'Bunday kvitansiya topilmadi'], ['/verify', 'Kvitansiyani tekshirish'],
  ['/log', 'Ildizlar (STH)'], ['/log/entries', 'Barg hashi'], ['/log/consistency', 'Jurnal barqaror'], ['/log/monitors', 'Kuzatuvchi C'],
  ['/integrations', 'Action bilan muhrlangan relizlar'], ['/bot', 'Muhr bot'], ['/about', 'Nima haqiqiy'], ['/no-such-page', 'Sahifa topilmadi']
]

function watch (page) {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  return errors
}

for (const [route, text] of ROUTES) {
  test(`renders ${route}`, async ({ page }) => {
    const errors = watch(page)
    await page.goto('./#' + route)
    await expect(page.locator('html[data-ready="1"]')).toHaveCount(1)
    await expect(page.locator('main')).toContainText(text)
    await expect(page.locator('.demo-pill')).toContainText('qayta yuklanganda tiklanadi')
    expect(errors).toEqual([])
  })
}

test('a path deep link becomes a hash route', async ({ page }) => {
  const errors = watch(page)
  await page.goto('./log/consistency')
  await expect(page.locator('main')).toContainText('Barqarorlik isboti')
  expect(page.url()).toContain('#/log/consistency')
  expect(errors).toEqual([])
})

test('stamp text, get a receipt, advance to Bitcoin', async ({ page }) => {
  const errors = watch(page)
  await page.goto('./#/stamp')
  await page.click('#tab-text')
  await page.fill('textarea', 'smoke test ' + Date.now())
  await expect(page.locator('#stamp-hash')).toHaveText(/^[0-9a-f]{64}$/)
  await page.click('#stamp-go')
  await expect(page.locator('#stamp-receipt')).toContainText('"inclusion_proof"')
  for (let i = 0; i < 3; i++) await page.click('#stamp-advance')
  await expect(page.locator('.result-head')).toContainText('Bitcoinʼda')
  await page.goto('./#/receipts')
  await expect(page.locator('tbody tr').first()).toContainText('matn-')
  expect(errors).toEqual([])
})

test('verifier: every sample gives the right verdict', async ({ page }) => {
  const errors = watch(page)
  await page.goto('./#/verify')
  const cases = { good: ['v-ok', 'Isbot toʻgʻri'], tampered: ['v-bad', 'Mos kelmaydi'], badpath: ['v-bad', 'Isbot buzilgan'], unknown: ['v-bad', 'Notanish jurnal'], pending: ['v-wait', 'Bitcoin kutilmoqda'], salted: ['v-ok', 'Isbot toʻgʻri'] }
  for (const [key, [cls, text]] of Object.entries(cases)) {
    await page.click(`[data-case="${key}"]`)
    await expect(page.locator('.verdict.' + cls)).toContainText(text)
  }
  expect(errors).toEqual([])
})

test('consistency proof fails for a forged old root', async ({ page }) => {
  await page.goto('./#/log/consistency')
  await expect(page.locator('.verdict.v-ok')).toBeVisible()
  await page.check('#c-forge')
  await expect(page.locator('.verdict.v-bad')).toContainText('buzilgan')
})

test('receipts: filter, upgrade all, delete with dialog', async ({ page }) => {
  const errors = watch(page)
  await page.goto('./#/receipts')
  const rows = page.locator('tbody tr')
  const all = await rows.count()
  expect(all).toBeGreaterThan(40)
  await page.getByRole('button', { name: /Kalendarda/ }).click()
  expect(await rows.count()).toBeLessThan(all)
  await page.getByRole('button', { name: /^Hammasi \d/ }).click()
  await page.click('#upgrade-all')
  await expect(page.locator('#upgrade-all')).toHaveCount(0)
  await page.fill('#rc-search', 'zzzz-yoq')
  await expect(page.locator('.empty')).toContainText('Hech narsa topilmadi')
  await page.goto('./#/receipts/r1003')
  await page.click('#rc-delete')
  await page.click('#del-confirm')
  await expect(page.locator('main h1')).toHaveText('Kvitansiyalarim')
  expect(await rows.count()).toBe(all - 1)
  expect(errors).toEqual([])
})

test('bot: send a sample and verify it', async ({ page }) => {
  const errors = watch(page)
  await page.goto('./#/bot')
  const msgs = page.locator('.msg')
  const before = await msgs.count()
  await page.getByRole('button', { name: 'Namuna yuborish' }).click()
  await expect(page.locator('.msg').last()).toContainText('Muhrlandi')
  await page.getByRole('button', { name: '/verify namuna' }).click()
  await expect(page.locator('.msg.good').last()).toContainText('Mos keladi')
  expect(await msgs.count()).toBeGreaterThan(before + 3)
  expect(errors).toEqual([])
})

test('log: load more heads and search entries', async ({ page }) => {
  await page.goto('./#/log')
  await expect(page.locator('tbody tr')).toHaveCount(25)
  await page.click('#more-heads')
  await expect(page.locator('tbody tr')).toHaveCount(50)
  await page.goto('./#/log/entries')
  await page.fill('#log-search', 'ffffffffff')
  await expect(page.locator('.empty')).toContainText('jurnalda yoʻq')
})
