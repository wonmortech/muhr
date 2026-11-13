// SPDX-FileCopyrightText: 2026 Wonmor and Muhr contributors
// SPDX-License-Identifier: Apache-2.0

// End-to-end tests of the static site in Chromium, served with the production CSP.
import { test, expect } from './fixtures.mjs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const core = require('../../site/assets/core.js')
const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex')

const PAGES = [
  { path: '/', lang: 'uz' },
  { path: '/en/', lang: 'en' },
  { path: '/ru/', lang: 'ru' }
]

// Collects console errors (CSP violations land here too) and uncaught page errors.
function watch (page) {
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  return errors
}

for (const { path, lang } of PAGES) {
  test.describe(`${path} (${lang})`, () => {
    test('loads with no console errors and no page errors', async ({ page }) => {
      const errors = watch(page)
      const res = await page.goto(path)
      expect(res.status()).toBe(200)
      const h = res.headers()
      expect(h['content-security-policy']).toMatch(/^default-src 'self'; script-src 'self';/)
      expect(h['content-security-policy']).toContain("object-src 'none'")
      expect(h['content-security-policy']).toContain("frame-ancestors 'none'")
      expect(h['x-content-type-options']).toBe('nosniff')
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      await expect(page.locator('html')).toHaveClass(/\bjs\b/)
      // the demo has run once: the screen-reader line carries the real hash
      await expect(page.locator('#hash-sr')).toContainText(/[0-9a-f]{64}/)
      await page.mouse.wheel(0, 4000)
      await page.waitForTimeout(300)
      expect(errors).toEqual([])
    })

    test('hashes a known text with the correct SHA-256', async ({ page }) => {
      const errors = watch(page)
      const T = core.strings(lang)
      await page.goto(path)
      const text = `Muhr e2e ${lang}: oʻzgarmagan — проверка`
      const want = sha(text)
      await page.locator('#d-text').fill(text)
      await expect(page.locator('#hash-sr')).toHaveText(T.hashIs + want)
      await expect(page.locator('#grid')).toHaveText(want)
      await expect(page.locator('#receipt')).toContainText(`"value": "${want}"`)
      await expect(page.locator('#receipt')).toContainText(T.c.never)
      // the fingerprint mini demo
      await page.locator('#fp-in').fill('abc')
      await expect(page.locator('#fp-out')).toHaveText(sha('abc'))
      await expect(page.locator('#fp-out')).toHaveAttribute('aria-label', T.hashIs + sha('abc'))
      expect(errors).toEqual([])
    })
  })
}

test.describe('demo (en)', () => {
  const T = core.strings('en')

  test('compare: match, then tampered text gives a mismatch', async ({ page }) => {
    const errors = watch(page)
    await page.goto('/en/')
    const original = 'Contract no. 17, signed copy'
    await page.locator('#d-text').fill(original)
    await page.locator('#tab-cmp').click()
    await expect(page.locator('#tab-cmp')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#opt-salt')).toBeHidden()

    await page.locator('#d-expect').fill('SHA256: ' + sha(original).toUpperCase())
    await expect(page.locator('#verdict')).toHaveClass(/\bok\b/)
    await expect(page.locator('#verdict')).toHaveText(T.ok)

    await page.locator('#d-text').fill(original + '.') // one byte changed
    await expect(page.locator('#verdict')).toHaveClass(/\bbad\b/)
    await expect(page.locator('#verdict')).toHaveText(T.bad)

    await page.locator('#d-expect').fill('not a hash')
    await expect(page.locator('#verdict')).toHaveText(T.badHex)

    await page.locator('#d-expect').fill('')
    await expect(page.locator('#verdict')).toHaveText('')
    expect(errors).toEqual([])
  })

  test('markup typed into the inputs is shown as text, never parsed', async ({ page }) => {
    const errors = watch(page)
    await page.goto('/en/')
    const evil = '<img src=x onerror="window.__pwned=1">'
    await page.locator('#d-text').fill(evil)
    await expect(page.locator('#hash-sr')).toHaveText(T.hashIs + sha(evil))
    await page.locator('#tab-cmp').click()
    await page.locator('#d-expect').fill(evil)
    await expect(page.locator('#verdict')).toHaveText(T.badHex)
    await page.locator('#fp-in').fill(evil)
    await expect(page.locator('#fp-out')).toHaveText(sha(evil))
    expect(await page.locator('#demo img, #receipt img, #verdict img, #fp-out img').count()).toBe(0)
    expect(await page.evaluate(() => window.__pwned)).toBeUndefined()
    expect(errors).toEqual([])
  })

  test('a chosen file is hashed locally and never uploaded', async ({ page }) => {
    const errors = watch(page)
    const requests = []
    page.on('request', (r) => requests.push(r))
    await page.goto('/en/')
    await page.waitForLoadState('networkidle')
    const before = requests.length
    const bytes = Buffer.from('%PDF-1.7\nnot really a pdf\n')
    await page.locator('#d-file').setInputFiles({ name: 'contract.pdf', mimeType: 'application/pdf', buffer: bytes })
    await expect(page.locator('#hash-sr')).toHaveText(T.hashIs + createHash('sha256').update(bytes).digest('hex'))
    await expect(page.locator('#d-fname')).toHaveText('contract.pdf · 1 KB')
    // no request carries the file: nothing at all is sent after it was chosen
    expect(requests.slice(before).filter((r) => r.method() !== 'GET' || r.postData())).toEqual([])
    // typing again drops the file
    await page.locator('#d-text').fill('abc')
    await expect(page.locator('#d-fname')).toHaveText(T.noFile)
    await expect(page.locator('#hash-sr')).toHaveText(T.hashIs + sha('abc'))
    expect(errors).toEqual([])
  })

  test('salt changes the hash and is marked in the receipt', async ({ page }) => {
    await page.goto('/en/')
    await page.locator('#d-text').fill('abc')
    await expect(page.locator('#hash-sr')).toHaveText(T.hashIs + sha('abc'))
    await page.locator('#d-salt').check()
    await expect(page.locator('#receipt')).toContainText('"salted": true')
    await expect(page.locator('#hash-sr')).not.toHaveText(T.hashIs + sha('abc'))
    await page.locator('#d-salt').uncheck()
    await expect(page.locator('#hash-sr')).toHaveText(T.hashIs + sha('abc'))
    await expect(page.locator('#receipt')).not.toContainText('"salted"')
  })
})

test.describe('theme and language', () => {
  test('theme toggle flips the theme, relabels the button and persists', async ({ page }) => {
    const errors = watch(page)
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/en/')
    const html = page.locator('html'), btn = page.locator('#theme')
    await expect(btn).toHaveAttribute('aria-label', core.strings('en').dark)
    await btn.click()
    await expect(html).toHaveAttribute('data-theme', 'dark')
    await expect(btn).toHaveAttribute('aria-label', core.strings('en').light)
    await expect(btn.locator('use')).toHaveAttribute('href', '#i-sun')
    await page.reload()
    await expect(html).toHaveAttribute('data-theme', 'dark')
    await btn.click()
    await expect(html).toHaveAttribute('data-theme', 'light')
    await expect(btn.locator('use')).toHaveAttribute('href', '#i-moon')
    expect(errors).toEqual([])
  })

  test('a stored theme value outside light/dark is ignored', async ({ page }) => {
    await page.goto('/en/')
    await page.evaluate(() => localStorage.setItem('muhr-theme', '"><script>x</script>'))
    await page.reload()
    expect(await page.locator('html').getAttribute('data-theme')).toBeNull()
  })

  for (const [from, to, lang] of [['/', '/en/', 'en'], ['/en/', '/ru/', 'ru'], ['/ru/', '/', 'uz']]) {
    test(`language link ${from} -> ${to}`, async ({ page }) => {
      const errors = watch(page)
      await page.goto(from)
      const link = page.locator(`.lang a[hreflang="${lang}"]`)
      await expect(link).toHaveAttribute('href', to)
      await link.click()
      await expect(page).toHaveURL(to)
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      await expect(page.locator(`.lang a[hreflang="${lang}"]`)).toHaveAttribute('aria-current', 'true')
      expect(errors).toEqual([])
    })
  }
})

test.describe('404', () => {
  test('unknown path returns the 404 page with links home', async ({ page }) => {
    const errors = watch(page)
    const res = await page.goto('/no/such/page')
    expect(res.status()).toBe(404)
    await expect(page).toHaveTitle(/Page not found/)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
    for (const href of ['/', '/en/', '/ru/']) await expect(page.locator(`main a[href="${href}"]`)).toBeVisible()
    await page.locator('main a[href="/en/"]').click()
    await expect(page).toHaveURL('/en/')
    // the only expected console error is the 404 status of the document itself
    expect(errors.filter((e) => !/status of 404/.test(e))).toEqual([])
  })

  test('path traversal does not leave site/', async ({ request }) => {
    for (const p of ['/..%2f..%2fpackage.json', '/%2e%2e/deploy/Caddyfile', '/assets/..%5c..%5cpackage.json']) {
      const res = await request.get(p)
      expect([403, 404]).toContain(res.status())
      expect(await res.text()).not.toContain('"devDependencies"')
    }
  })
})
