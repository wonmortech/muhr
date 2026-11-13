// Property-based tests (fast-check): random inputs against node:crypto and the comparison rules.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import fc from 'fast-check'

const core = createRequire(import.meta.url)('../../site/assets/core.js')
const ref = (u8) => createHash('sha256').update(u8).digest('hex')
const RUNS = { numRuns: 300 }

test('pure-JS SHA-256 equals node:crypto for any bytes', () => {
  fc.assert(fc.property(fc.uint8Array({ maxLength: 4096 }), (b) => core.shaJs(b) === ref(b)), RUNS)
})

test('salted hash is the hash of salt || data', () => {
  fc.assert(fc.property(fc.uint8Array({ maxLength: 64 }), fc.uint8Array({ maxLength: 1024 }), (s, d) =>
    core.shaJs(core.withSalt(s, d)) === ref(Buffer.concat([s, d]))), RUNS)
})

test('verdict accepts any formatting of the same hash and rejects any other hash', () => {
  const hash = fc.uint8Array({ minLength: 32, maxLength: 32 }).map((b) => Buffer.from(b).toString('hex'))
  fc.assert(fc.property(hash, hash, fc.boolean(), (a, b, upper) => {
    const typed = 'SHA256: ' + (upper ? a.toUpperCase() : a).replace(/(.{8})/g, '$1 ')
    assert.equal(core.verdict(typed, a), 'ok')
    if (a !== b) assert.equal(core.verdict(a, b), 'bad')
  }), RUNS)
})

test('normalizeHash never throws and isHash only accepts 64 lowercase hex digits', () => {
  fc.assert(fc.property(fc.anything(), (x) => {
    const n = core.normalizeHash(x)
    assert.equal(typeof n, 'string')
    if (core.isHash(n)) assert.match(n, /^[0-9a-f]{64}$/)
  }), RUNS)
})
