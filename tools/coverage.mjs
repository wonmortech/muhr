// SPDX-FileCopyrightText: 2026 Wonmor and Muhr contributors
// SPDX-License-Identifier: Apache-2.0

// Combined JavaScript coverage of every file under site/: Node V8 coverage from the unit tests plus
// Chromium V8 coverage from the Playwright e2e run (tests/e2e/fixtures.mjs), merged per file.
// Usage:
//   node tools/coverage.mjs clean             remove .coverage/ and coverage/
//   node tools/coverage.mjs node <args...>    run `node <args...>` with NODE_V8_COVERAGE=.coverage/node
//   node tools/coverage.mjs report            merge, print per-file numbers, fail below the gate
import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CoverageReport } from 'monocart-coverage-reports'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const RAW = join(ROOT, '.coverage')
const OUT = join(ROOT, 'coverage')
// Gate on the combined numbers over all site JavaScript (OpenSSF Best Practices gold: 90 % statements, 80 % branches).
const GATE = { statements: 90, lines: 90, branches: 80 }

const [cmd, ...rest] = process.argv.slice(2)

if (cmd === 'clean') {
  rmSync(RAW, { recursive: true, force: true }); rmSync(OUT, { recursive: true, force: true })
} else if (cmd === 'node') {
  const r = spawnSync(process.execPath, rest, { stdio: 'inherit', env: { ...process.env, NODE_V8_COVERAGE: join(RAW, 'node') } })
  process.exit(r.status === null ? 1 : r.status)
} else if (cmd === 'report') {
  await report()
} else {
  console.error('usage: node tools/coverage.mjs clean | node <args...> | report'); process.exit(2)
}

async function report () {
  const site = new URL('../site/', import.meta.url).href
  const isSite = (url) => url.startsWith(site) && url.endsWith('.js')
  const mcr = new CoverageReport({
    name: 'Muhr site JavaScript',
    outputDir: OUT,
    cleanCache: true,
    reports: [['console-details', { skipPercent: 0 }], ['json-summary'], ['lcovonly'], ['v8']],
    entryFilter: (e) => isSite(e.url),
    all: { dir: [join(ROOT, 'site')], filter: { '**/*.js': true } },
    logging: 'error'
  })
  const nodeDir = join(RAW, 'node'), e2eDir = join(RAW, 'e2e')
  if (!existsSync(nodeDir) || !existsSync(e2eDir)) {
    console.error('coverage: run the unit and e2e tests first (npm test)'); process.exit(1)
  }
  // NODE_V8_COVERAGE files: { result: [ScriptCoverage] }; Node gives no source, so read it from disk.
  for (const f of readdirSync(nodeDir)) {
    const entries = JSON.parse(readFileSync(join(nodeDir, f), 'utf8')).result.filter((e) => isSite(e.url))
    for (const e of entries) e.source = readFileSync(fileURLToPath(e.url), 'utf8')
    if (entries.length) await mcr.add(entries)
  }
  for (const f of readdirSync(e2eDir)) await mcr.add(JSON.parse(readFileSync(join(e2eDir, f), 'utf8')))
  const res = await mcr.generate()
  const s = res.summary
  const fails = Object.entries(GATE).filter(([k, min]) => !(s[k].pct >= min)).map(([k, min]) => `${k} ${s[k].pct}% < ${min}%`)
  console.log(`coverage (site/**/*.js, unit + e2e): statements ${s.statements.pct}%, lines ${s.lines.pct}%, branches ${s.branches.pct}%, functions ${s.functions.pct}%`)
  if (fails.length) { console.error('coverage gate failed: ' + fails.join(', ')); process.exit(1) }
  console.log(`coverage gate ok (statements >= ${GATE.statements}%, lines >= ${GATE.lines}%, branches >= ${GATE.branches}%)`)
}
