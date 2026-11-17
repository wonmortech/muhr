// SPDX-FileCopyrightText: 2026 Wonmor and Muhr contributors
// SPDX-License-Identifier: Apache-2.0

// Smoke tests for the concept demo (demo/), built by tools/build-demo.mjs and served under the production CSP
// at /demo/muhr/. Separate from playwright.config.mjs, so the home page tests and the coverage gate stay as they are.
//   npm run test:demo
import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.DEMO_PORT) || 4176
const executablePath = process.env.PW_CHROMIUM_PATH || undefined

export default defineConfig({
  testDir: 'tests/demo',
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: { baseURL: `http://127.0.0.1:${PORT}/demo/muhr/` },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: executablePath ? { executablePath } : {} } }],
  webServer: {
    command: 'node tools/build-demo.mjs && node tools/serve-demo.mjs',
    env: { PORT: String(PORT) },
    url: `http://127.0.0.1:${PORT}/demo/muhr/`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  }
})
