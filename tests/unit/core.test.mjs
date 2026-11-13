// SPDX-FileCopyrightText: 2026 Wonmor and Muhr contributors
// SPDX-License-Identifier: Apache-2.0

// Unit tests for site/assets/core.js (the pure logic behind the in-browser demo).
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { createHash, webcrypto, randomBytes } from 'node:crypto'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const core = require('../../site/assets/core.js')
const enc = new TextEncoder()
const ref = (bytes) => createHash('sha256').update(bytes).digest('hex')

describe('shaJs (pure-JS SHA-256)', () => {
  // FIPS 180-4 / NIST CAVP examples.
  const vectors = [
    ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
    ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
    ['abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq', '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1'],
    ['abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu', 'cf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1']
  ]
  for (const [msg, want] of vectors) {
    test(`NIST vector ${JSON.stringify(msg.slice(0, 12))}${msg.length > 12 ? '…' : ''}`, () => {
      assert.equal(core.shaJs(enc.encode(msg)), want)
    })
  }

  test('one million "a"', () => {
    assert.equal(core.shaJs(new Uint8Array(1e6).fill(0x61)), 'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0')
  })

  test('every length across the padding boundaries matches node:crypto', () => {
    // 55/56/63/64 bytes are where the length field spills into an extra block.
    for (let n = 0; n <= 200; n++) {
      const b = randomBytes(n)
      assert.equal(core.shaJs(b), ref(b), `length ${n}`)
    }
  })

  test('UTF-8 text (Uzbek, Russian) matches node:crypto', () => {
    for (const s of ['Muhr — oʻzgarmagan', 'Хеш SHA-256: проверка', '😀 emoji']) {
      assert.equal(core.shaJs(enc.encode(s)), ref(Buffer.from(s, 'utf8')))
    }
  })
})

describe('hex', () => {
  test('pads every byte to two lowercase digits', () => {
    assert.equal(core.hex(new Uint8Array([0, 1, 15, 16, 171, 255]).buffer), '00010f10abff')
  })
  test('empty buffer', () => { assert.equal(core.hex(new ArrayBuffer(0)), '') })
})

describe('sha256 (WebCrypto with fallback)', () => {
  const bytes = enc.encode('hello')
  const want = ref(Buffer.from('hello'))

  test('uses WebCrypto in a secure context', async () => {
    let called = 0
    const env = { isSecureContext: true, crypto: { subtle: { digest: (a, b) => { called++; return webcrypto.subtle.digest(a, b) } } } }
    assert.equal(await core.sha256(bytes, env), want)
    assert.equal(called, 1)
  })

  test('falls back to pure JS in an insecure context', async () => {
    const env = { isSecureContext: false, crypto: { subtle: { digest: () => { throw new Error('must not be called') } } } }
    assert.equal(await core.sha256(bytes, env), want)
  })

  test('falls back to pure JS when WebCrypto throws synchronously', async () => {
    const env = { isSecureContext: true, crypto: { subtle: { digest: () => { throw new Error('blocked') } } } }
    assert.equal(await core.sha256(bytes, env), want)
  })

  test('falls back when there is no crypto at all', async () => {
    assert.equal(await core.sha256(bytes, {}), want)
  })

  test('defaults to globalThis (Node: no isSecureContext, so pure JS)', async () => {
    assert.equal(await core.sha256(bytes), want)
  })
})

describe('withSalt', () => {
  test('prepends the salt', () => {
    const r = core.withSalt(new Uint8Array([1, 2]), new Uint8Array([3, 4, 5]))
    assert.deepEqual([...r], [1, 2, 3, 4, 5])
  })
  test('salted hash differs from the plain hash', () => {
    const data = enc.encode('same text')
    assert.notEqual(core.shaJs(core.withSalt(randomBytes(16), data)), core.shaJs(data))
  })
})

describe('normalizeHash / isHash / verdict (compare and tamper check)', () => {
  const h = ref(Buffer.from('abc'))

  test('normalizes case, a "sha256:" prefix and whitespace', () => {
    assert.equal(core.normalizeHash('  SHA256: ' + h.toUpperCase().replace(/(.{16})/g, '$1 \n') + '  '), h)
    assert.equal(core.normalizeHash('sha256 ' + h), h)
    assert.equal(core.normalizeHash(null), '')
    assert.equal(core.normalizeHash(undefined), '')
  })

  test('a value that cannot be turned into text gives "" instead of throwing', () => {
    assert.equal(core.normalizeHash({ toString: null }), '')
    assert.equal(core.normalizeHash(Object.create(null)), '')
    assert.equal(core.verdict({ toString: null }, 'a'.repeat(64)), 'empty')
  })

  test('isHash accepts exactly 64 hex digits', () => {
    assert.equal(core.isHash(h), true)
    assert.equal(core.isHash(h.slice(1)), false)
    assert.equal(core.isHash(h + '0'), false)
    assert.equal(core.isHash('g'.repeat(64)), false)
  })

  test('empty input', () => { assert.equal(core.verdict('   ', h), 'empty') })
  test('malformed input', () => {
    assert.equal(core.verdict('xyz', h), 'badHex')
    assert.equal(core.verdict('<img src=x onerror=alert(1)>', h), 'badHex')
  })
  test('match', () => { assert.equal(core.verdict(h.toUpperCase(), h), 'ok') })
  test('tampered: one changed byte gives a mismatch', () => {
    const tampered = ref(Buffer.from('abd'))
    assert.equal(core.verdict(tampered, h), 'bad')
  })
})

describe('changedDigits', () => {
  const a = 'a'.repeat(64)
  test('no previous hash: nothing is marked', () => {
    assert.deepEqual(core.changedDigits('', a), new Array(64).fill(false))
  })
  test('marks exactly the digits that differ', () => {
    const b = 'b' + a.slice(1, 63) + 'c'
    const r = core.changedDigits(a, b)
    assert.equal(r.length, 64)
    assert.equal(r.filter(Boolean).length, 2)
    assert.equal(r[0], true); assert.equal(r[63], true); assert.equal(r[5], false)
  })
})

describe('sizeLabel', () => {
  test('small files round up to at least 1 KB', () => {
    assert.equal(core.sizeLabel(0), '1 KB')
    assert.equal(core.sizeLabel(1536), '2 KB')
  })
  test('megabytes with one decimal', () => {
    assert.equal(core.sizeLabel(1048576), '1.0 MB')
    assert.equal(core.sizeLabel(5.25 * 1048576), '5.3 MB')
  })
})

describe('localIso', () => {
  test('formats the local wall clock without a zone', () => {
    const d = new Date(2026, 10, 14, 9, 5, 7)
    assert.equal(core.localIso(d), '2026-11-14T09:05:07')
  })
})

describe('receipt', () => {
  const h = ref(Buffer.from('abc'))
  const now = new Date(2026, 0, 2, 3, 4, 5)

  for (const lang of ['uz', 'en', 'ru']) {
    test(`${lang}: well-formed segments and the exact text`, () => {
      const T = core.strings(lang)
      const lines = core.receipt(h, { strings: T, salted: false, now })
      for (const l of lines) for (const s of l) {
        assert.equal(s.length, 2)
        assert.ok(['', 'k', 's', 'c', 'soonv'].includes(s[0]))
        assert.equal(typeof s[1], 'string')
      }
      const text = core.receiptText(lines)
      assert.equal(text, [
        '{',
        '  "muhr": "0-draft",',
        `  "hash": { "alg": "sha-256", "value": "${h}" },`,
        '  "log": { "type": "rfc9162", "status": "soon" },',
        '  "anchors": [ { "type": "opentimestamps", "status": "soon" } ],',
        `  "created_local": "2026-01-02T03:04:05"  // ${T.c.local}`,
        `}  // ${T.c.never}`
      ].join('\n'))
    })
  }

  test('salted receipt adds the salted line', () => {
    const T = core.strings('en')
    const text = core.receiptText(core.receipt(h, { strings: T, salted: true, now }))
    assert.match(text, /\n {2}"salted": true, {2}\/\/ kept only by you\n/)
  })

  test('the value is carried as text, never as markup', () => {
    const T = core.strings('en')
    const evil = '<img src=x onerror=alert(1)>'
    const lines = core.receipt(evil, { strings: T, salted: false, now })
    assert.ok(lines.flat().some((s) => s[0] === 's' && s[1] === `"${evil}"`))
  })
})

describe('strings (i18n selection)', () => {
  test('known languages, including region subtags and case', () => {
    assert.equal(core.strings('uz'), core.STRINGS.uz)
    assert.equal(core.strings('en-GB'), core.STRINGS.en)
    assert.equal(core.strings('RU'), core.STRINGS.ru)
  })
  test('unknown, empty and inherited keys give null', () => {
    for (const k of ['de', '', null, undefined, '__proto__', 'constructor', 'toString', 'hasOwnProperty']) assert.equal(core.strings(k), null, String(k))
  })
  test('every language has the same keys and non-empty strings', () => {
    const shape = (o) => Object.keys(o).sort().map((k) => typeof o[k] === 'object' ? k + '{' + shape(o[k]) + '}' : k).join(',')
    const base = shape(core.STRINGS.uz)
    for (const lang of Object.keys(core.STRINGS)) {
      assert.equal(shape(core.STRINGS[lang]), base, lang)
      const walk = (o) => { for (const v of Object.values(o)) typeof v === 'object' ? walk(v) : assert.ok(typeof v === 'string' && v.trim().length > 0, lang) }
      walk(core.STRINGS[lang])
    }
  })
  test('no markup in any UI string (they are rendered as text)', () => {
    assert.doesNotMatch(JSON.stringify(core.STRINGS), /[<>]/)
  })
})

describe('browser loading', () => {
  test('as a classic script it exposes globalThis.MuhrCore and nothing else', () => {
    const src = readFileSync(new URL('../../site/assets/core.js', import.meta.url), 'utf8')
    const ctx = vm.createContext({})
    const before = new Set(Object.getOwnPropertyNames(vm.runInContext('globalThis', ctx)))
    vm.runInContext(src, ctx)
    const added = Object.getOwnPropertyNames(vm.runInContext('globalThis', ctx)).filter((k) => !before.has(k))
    assert.deepEqual(added, ['MuhrCore'])
    assert.equal(vm.runInContext('MuhrCore.shaJs(new Uint8Array(0))', ctx), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })
})
