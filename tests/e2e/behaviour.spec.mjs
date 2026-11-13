// SPDX-FileCopyrightText: 2026 Wonmor and Muhr contributors
// SPDX-License-Identifier: Apache-2.0

// Behaviour of the page scripts beyond the demo's happy path: the hero animation under normal and
// reduced motion, theme changes, the header menu, pointer effects, copy, drag and drop, and the
// fallbacks for browsers without canvas, observers or a readable file.
import { test, expect } from './fixtures.mjs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'

const core = createRequire(import.meta.url)('../../site/assets/core.js')
const T = core.strings('en')
const sha = (s) => createHash('sha256').update(s).digest('hex')

function watch (page) {
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  return errors
}
const frame = (page) => page.locator('#seal').evaluate((c) => c.toDataURL())
const pressed = (page) => page.locator('.steps button[aria-pressed="true"]')

test.describe('hero animation', () => {
  // the fake clock runs every animation frame of the 17 s loop, which takes a while on a busy machine
  test.slow()

  test('plays the four chapters in order and loops (normal motion)', async ({ page }) => {
    const errors = watch(page)
    await page.clock.install()
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/en/')
    await expect(page.locator('#seal')).toHaveClass(/\bready\b/)
    const seen = []
    // 17 s loop; step through it on the fake clock and record the highlighted chapter.
    for (let t = 0; t < 18000; t += 400) {
      await page.clock.runFor(400)
      const s = await pressed(page).getAttribute('data-step')
      if (seen[seen.length - 1] !== s) seen.push(s)
    }
    expect(seen.slice(0, 5)).toEqual(['0', '1', '2', '3', '0'])
    expect(errors).toEqual([])
  })

  test('a chapter button jumps the animation to that chapter', async ({ page }) => {
    await page.clock.install()
    await page.goto('/en/')
    await page.clock.runFor(500)
    for (const i of [3, 1, 2, 0]) {
      const before = await frame(page)
      await page.locator(`.steps button[data-step="${i}"]`).click()
      await page.clock.runFor(2500)
      await expect(pressed(page)).toHaveAttribute('data-step', String(i))
      expect(await frame(page)).not.toBe(before)
    }
  })

  test('stops drawing in a hidden tab and resumes when visible again', async ({ page }) => {
    await page.clock.install()
    await page.goto('/en/')
    await page.clock.runFor(1000)
    const setHidden = (h) => page.evaluate((hidden) => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
      document.dispatchEvent(new Event('visibilitychange'))
    }, h)
    await setHidden(true)
    const still = await frame(page)
    await page.clock.runFor(3000)
    expect(await frame(page)).toBe(still)
    await setHidden(false)
    await page.clock.runFor(3000)
    expect(await frame(page)).not.toBe(still)
  })

  test('the pointer moves the light on the seal (mouse only)', async ({ page }) => {
    await page.clock.install()
    await page.goto('/en/')
    await page.locator('.steps button[data-step="3"]').click()
    await page.clock.runFor(2000)
    const box = await page.locator('#seal').boundingBox()
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.9)
    await page.clock.runFor(1500)
    const lit = await frame(page)
    await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.1)
    await page.clock.runFor(1500)
    expect(await frame(page)).not.toBe(lit)
    await page.mouse.move(0, 0) // leaves: the light drifts back to rest
    await page.clock.runFor(1500)
  })

  test('reduced motion: one still frame per chapter, no loop', async ({ page }) => {
    const errors = watch(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/en/')
    await expect(page.locator('#seal')).toHaveClass(/\bready\b/)
    await expect(pressed(page)).toHaveAttribute('data-step', '3') // the finished picture
    const end = await frame(page)
    await page.waitForTimeout(400)
    expect(await frame(page)).toBe(end)
    const frames = new Set([end])
    for (const i of [0, 1, 2]) {
      await page.locator(`.steps button[data-step="${i}"]`).click()
      await expect(pressed(page)).toHaveAttribute('data-step', String(i))
      frames.add(await frame(page))
    }
    expect(frames.size).toBe(4)
    // content is revealed at once, without waiting for scroll
    expect(await page.locator('.rv:not(.in)').count()).toBe(0)
    expect(errors).toEqual([])
  })

  test('without canvas support the page marks itself and keeps working', async ({ page }) => {
    const errors = watch(page)
    await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null })
    await page.goto('/en/')
    await expect(page.locator('html')).toHaveClass(/\bno-canvas\b/)
    await page.locator('#d-text').fill('abc')
    await expect(page.locator('#hash-sr')).toHaveText(T.hashIs + sha('abc'))
    expect(errors).toEqual([])
  })

  test('browsers without IntersectionObserver or ResizeObserver still show everything', async ({ page }) => {
    const errors = watch(page)
    await page.addInitScript(() => { delete window.IntersectionObserver; delete window.ResizeObserver })
    await page.goto('/en/')
    expect(await page.locator('.rv:not(.in), .draw:not(.in)').count()).toBe(0)
    await expect(page.locator('#seal')).toHaveClass(/\bready\b/)
    const a = await frame(page)
    await page.setViewportSize({ width: 900, height: 700 }) // resize listener redraws at the new size
    await page.waitForTimeout(300)
    expect(await frame(page)).not.toBe(a)
    expect(errors).toEqual([])
  })
})

test.describe('theme follows the system and redraws the hero', () => {
  test('system dark/light switch relabels the button when no theme is chosen', async ({ page }) => {
    const errors = watch(page)
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
    await page.goto('/en/')
    const btn = page.locator('#theme')
    await expect(btn).toHaveAttribute('aria-label', T.dark)
    const light = await frame(page)
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(btn).toHaveAttribute('aria-label', T.light)
    await expect(btn.locator('use')).toHaveAttribute('href', '#i-sun')
    expect(await frame(page)).not.toBe(light) // the canvas reads the new colours
    await btn.click() // explicit choice wins over the system
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    expect(errors).toEqual([])
  })
})

test.describe('header and pointer effects', () => {
  test('mobile menu opens, closes on a link, and closes with Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto('/en/')
    const menu = page.locator('#menu'), nav = page.locator('#nav')
    await menu.click()
    await expect(menu).toHaveAttribute('aria-expanded', 'true')
    await expect(nav).toHaveClass(/\bopen\b/)
    await nav.locator('a').first().click()
    await expect(menu).toHaveAttribute('aria-expanded', 'false')
    await expect(nav).not.toHaveClass(/\bopen\b/)
    await menu.click()
    await page.keyboard.press('Escape')
    await expect(menu).toHaveAttribute('aria-expanded', 'false')
    await expect(menu).toBeFocused()
  })

  test('the header gets a border once the page is scrolled', async ({ page }) => {
    await page.goto('/en/')
    await expect(page.locator('#top')).not.toHaveClass(/\bscrolled\b/)
    await page.mouse.wheel(0, 600)
    await expect(page.locator('#top')).toHaveClass(/\bscrolled\b/)
  })

  test('the primary button follows the mouse and springs back', async ({ page }) => {
    await page.goto('/en/')
    const b = page.locator('.magnet').first()
    const box = await b.boundingBox()
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.7)
    await expect.poll(() => b.evaluate((el) => el.style.getPropertyValue('--mx'))).not.toBe('0px')
    await page.mouse.move(0, 0)
    await expect.poll(() => b.evaluate((el) => el.style.getPropertyValue('--mx'))).toBe('0px')
  })

  test('reduced motion: the primary button stays put', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/en/')
    const b = page.locator('.magnet').first()
    const box = await b.boundingBox()
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.7)
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.6)
    expect(await b.evaluate((el) => el.style.getPropertyValue('--mx'))).toBe('')
  })
})

test.describe('demo extras', () => {
  test('copy puts the current hash on the clipboard and confirms', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/en/')
    await page.locator('#d-text').fill('abc')
    await expect(page.locator('#hash-sr')).toHaveText(T.hashIs + sha('abc'))
    const copy = page.locator('#copy'), label = await copy.textContent()
    await copy.click()
    await expect(copy).toHaveText(T.copied)
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(sha('abc'))
    await expect(copy).toHaveText(label) // the label comes back
  })

  test('arrow keys move between the two tabs', async ({ page }) => {
    await page.goto('/en/')
    await page.locator('#tab-stamp').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('#tab-cmp')).toBeFocused()
    await expect(page.locator('#tab-cmp')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#tab-cmp')).toHaveAttribute('tabindex', '0')
    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('#tab-stamp')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#demo-panel')).toHaveAttribute('aria-labelledby', 'tab-stamp')
  })

  test('a file dropped on the drop zone is hashed', async ({ page }) => {
    await page.goto('/en/')
    const drop = page.locator('#drop')
    const dt = await page.evaluateHandle(() => {
      const d = new DataTransfer()
      d.items.add(new File(['dropped bytes'], 'note.txt', { type: 'text/plain' }))
      return d
    })
    await drop.dispatchEvent('dragenter', { dataTransfer: dt })
    await expect(drop).toHaveClass(/\bover\b/)
    await drop.dispatchEvent('dragleave', { dataTransfer: dt })
    await expect(drop).not.toHaveClass(/\bover\b/)
    await drop.dispatchEvent('dragover', { dataTransfer: dt })
    await drop.dispatchEvent('drop', { dataTransfer: dt })
    await expect(drop).not.toHaveClass(/\bover\b/)
    await expect(page.locator('#d-fname')).toHaveText('note.txt · 1 KB')
    await expect(page.locator('#hash-sr')).toHaveText(T.hashIs + sha('dropped bytes'))
  })

  test('a file that cannot be read says so and keeps the previous hash', async ({ page }) => {
    const errors = watch(page)
    await page.goto('/en/')
    await page.locator('#d-text').fill('abc')
    await expect(page.locator('#hash-sr')).toHaveText(T.hashIs + sha('abc'))
    await page.evaluate(() => { File.prototype.arrayBuffer = () => Promise.reject(new Error('NotReadableError')) })
    await page.locator('#d-file').setInputFiles({ name: 'gone.pdf', mimeType: 'application/pdf', buffer: Buffer.from('x') })
    await expect(page.locator('#d-fname')).toHaveText('gone.pdf · ' + T.readFail)
    await expect(page.locator('#hash-sr')).toHaveText(T.hashIs + sha('abc'))
    expect(errors).toEqual([])
  })

  test('only the last of two quickly chosen files is used', async ({ page }) => {
    await page.goto('/en/')
    // the first file resolves after the second one
    await page.evaluate(() => {
      const orig = File.prototype.arrayBuffer
      File.prototype.arrayBuffer = function () {
        const p = orig.call(this)
        return this.name === 'slow.txt' ? p.then((b) => new Promise((resolve) => setTimeout(() => resolve(b), 300))) : p
      }
    })
    const input = page.locator('#d-file')
    await input.setInputFiles({ name: 'slow.txt', mimeType: 'text/plain', buffer: Buffer.from('slow') })
    await input.setInputFiles({ name: 'fast.txt', mimeType: 'text/plain', buffer: Buffer.from('fast') })
    await expect(page.locator('#hash-sr')).toHaveText(T.hashIs + sha('fast'))
    await page.waitForTimeout(500)
    await expect(page.locator('#hash-sr')).toHaveText(T.hashIs + sha('fast'))
    await expect(page.locator('#d-fname')).toHaveText('fast.txt · 1 KB')
  })

  test('reduced motion: the hash grid updates without flip animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/en/')
    await page.locator('#d-text').fill('abc')
    await expect(page.locator('#grid')).toHaveText(sha('abc'))
    expect(await page.locator('#grid .flip').count()).toBe(0)
    await page.locator('#fp-in').fill('abd')
    await expect(page.locator('#fp-out')).toHaveText(sha('abd'))
    expect(await page.locator('#fp-out .ch').count()).toBeGreaterThan(0) // changed digits stay marked
  })
})
