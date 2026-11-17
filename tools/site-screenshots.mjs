// SPDX-FileCopyrightText: 2026 Wonmor and Muhr contributors
// SPDX-License-Identifier: Apache-2.0

// README screenshots from the concept demo: builds it, serves it under the production CSP, visits every screen
// (dialogs open, samples run, forms filled) and writes 1440x900 JPEGs plus one phone shot to docs/screenshots/.
// Run again whenever the demo UI changes:  npm run site:screenshots
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { build } from './build-demo.mjs'
import { start, BASE } from './serve-demo.mjs'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const DIR = join(ROOT, 'docs', 'screenshots')
mkdirSync(DIR, { recursive: true })
build()
const server = await start(4175)
const url = `http://127.0.0.1:4175${BASE}`
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined })

async function shot (name, hash, act, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.phone ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: opts.phone ? 2 : 1, colorScheme: opts.dark ? 'dark' : 'light' })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto(url + '#' + hash)
  await page.waitForSelector('html[data-ready="1"]')
  await page.waitForTimeout(200)
  if (act) await act(page)
  await page.waitForTimeout(350)
  await page.screenshot({ path: join(DIR, name + '.jpg'), type: 'jpeg', quality: 78 })
  if (errors.length) throw new Error(name + ': ' + errors.join('; '))
  console.log('shot', name)
  await ctx.close()
}

try {
  await shot('overview', '/')
  await shot('stamp', '/stamp', async (p) => {
    await p.click('#tab-text')
    await p.click('#stamp-sample')
    await p.check('#salted')
    await p.waitForSelector('#stamp-hash')
    await p.click('#stamp-go')
    await p.waitForSelector('#stamp-receipt')
  })
  await shot('receipts', '/receipts')
  await shot('receipt', '/receipts/r-contract')
  await shot('receipt-eimzo', '/receipts/r1000', async (p) => { await p.locator('.card', { hasText: 'Inclusion proof' }).scrollIntoViewIfNeeded() })
  await shot('verify', '/verify', async (p) => { await p.click('[data-case="good"]'); await p.waitForSelector('.verdict.v-ok') })
  await shot('verify-tampered', '/verify', async (p) => { await p.click('[data-case="tampered"]'); await p.waitForSelector('.verdict.v-bad') })
  await shot('log', '/log')
  await shot('consistency', '/log/consistency')
  await shot('integrations', '/integrations')
  await shot('bot', '/bot', async (p) => { await p.click('text=/help') })
  await shot('overview-dark', '/', null, { dark: true })
  await shot('delete-dialog', '/receipts/r1003', async (p) => { await p.click('#rc-delete'); await p.waitForSelector('#del-dialog[open]') })
  await shot('phone', '/verify', async (p) => { await p.click('[data-case="good"]'); await p.waitForSelector('.verdict.v-ok'); await p.locator('#verify-result').scrollIntoViewIfNeeded() }, { phone: true })
} finally {
  await browser.close()
  server.close()
}
