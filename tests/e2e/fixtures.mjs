// SPDX-FileCopyrightText: 2026 Wonmor and Muhr contributors
// SPDX-License-Identifier: Apache-2.0

// Playwright fixtures: every test's page records Chromium V8 JavaScript coverage of the site scripts.
// The raw entries go to .coverage/e2e/ and tools/coverage.mjs merges them with the unit-test coverage.
import { test as base, expect } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SITE = fileURLToPath(new URL('../../site/', import.meta.url))
const OUT = fileURLToPath(new URL('../../.coverage/e2e/', import.meta.url))

// http://127.0.0.1:port/assets/app.js?v=1 -> file:///…/site/assets/app.js, so both runs name the same file.
function toFileUrl (url) {
  const u = new URL(url)
  if (u.hostname !== '127.0.0.1' || !u.pathname.endsWith('.js')) return null
  return pathToFileURL(SITE + decodeURIComponent(u.pathname).slice(1)).href
}

export async function saveCoverage (entries) {
  const keep = []
  for (const e of entries) {
    const url = toFileUrl(e.url)
    if (url) keep.push({ ...e, url })
  }
  if (!keep.length) return
  mkdirSync(OUT, { recursive: true })
  writeFileSync(OUT + randomUUID() + '.json', JSON.stringify(keep))
}

export async function withCoverage (page, fn) {
  await page.coverage.startJSCoverage({ resetOnNavigation: false })
  try { await fn(page) } finally { await saveCoverage(await page.coverage.stopJSCoverage()) }
}

export const test = base.extend({
  page: async ({ page }, use) => { await withCoverage(page, use) }
})

export { expect }
