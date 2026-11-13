// Muhr pure logic: SHA-256, hex helpers, hash comparison, receipt model, UI strings.
// No DOM, no network. Loaded as a classic script in the browser (exposes globalThis.MuhrCore)
// and by Node for the unit tests (module.exports).
(function (root, factory) {
  'use strict'
  var api = factory()
  if (typeof module === 'object' && module && module.exports) module.exports = api
  else root.MuhrCore = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict'

  // ---------- UI strings ----------
  var STRINGS = {
    uz: { copied: 'Nusxalandi', noFile: 'yoki shu yerga tashlang', ok: 'Mos keladi: fayl oʻzgarmagan', bad: 'Mos kelmaydi: fayl boshqa yoki oʻzgargan', badHex: 'Hash 64 ta belgidan iborat boʻlishi kerak (0-9, a-f)', hashIs: 'SHA-256 hash: ', reading: 'oʻqilmoqda…', readFail: 'faylni oʻqib boʻlmadi', light: 'Yorugʻ mavzuga oʻtish', dark: 'Qorongʻi mavzuga oʻtish',
      c: { local: 'brauzer vaqti, isbot emas', salt: 'faqat sizda saqlanadi', soon: 'tez kunda', never: 'fayl va matn yuborilmaydi' } },
    en: { copied: 'Copied', noFile: 'or drop it here', ok: 'Match: the file is unchanged', bad: 'No match: a different or changed file', badHex: 'A hash is 64 characters (0-9, a-f)', hashIs: 'SHA-256 hash: ', reading: 'reading…', readFail: 'could not read the file', light: 'Switch to light theme', dark: 'Switch to dark theme',
      c: { local: 'browser clock, not a proof', salt: 'kept only by you', soon: 'soon', never: 'file and text are never sent' } },
    ru: { copied: 'Скопировано', noFile: 'или перетащите сюда', ok: 'Совпадает: файл не изменён', bad: 'Не совпадает: файл другой или изменён', badHex: 'Хеш состоит из 64 символов (0-9, a-f)', hashIs: 'Хеш SHA-256: ', reading: 'читаем…', readFail: 'не удалось прочитать файл', light: 'Включить светлую тему', dark: 'Включить тёмную тему',
      c: { local: 'время браузера, не доказательство', salt: 'хранится только у вас', soon: 'скоро', never: 'файл и текст не отправляются' } }
  }
  // Language from the <html lang> attribute; only the three known keys, never inherited properties.
  function strings (lang) {
    var k = String(lang == null ? '' : lang).slice(0, 2).toLowerCase()
    return Object.prototype.hasOwnProperty.call(STRINGS, k) ? STRINGS[k] : null
  }

  // ---------- SHA-256 (FIPS 180-4), pure JS fallback for insecure contexts ----------
  var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]
  function shaJs (bytes) {
    var l = bytes.length, bl = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(bl)
    m.set(bytes); m[l] = 0x80
    var bits = l * 8, dv = new DataView(m.buffer)
    dv.setUint32(bl - 4, bits >>> 0); dv.setUint32(bl - 8, Math.floor(bits / 4294967296))
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19], W = new Uint32Array(64)
    for (var o = 0; o < bl; o += 64) {
      for (var i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4)
      for (i = 16; i < 64; i++) {
        var a0 = W[i - 15], a1 = W[i - 2]
        var s0 = ((a0 >>> 7) | (a0 << 25)) ^ ((a0 >>> 18) | (a0 << 14)) ^ (a0 >>> 3)
        var s1 = ((a1 >>> 17) | (a1 << 15)) ^ ((a1 >>> 19) | (a1 << 13)) ^ (a1 >>> 10)
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7]
      for (i = 0; i < 64; i++) {
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))
        var t1 = (h + S1 + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))
        var t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) | 0
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0
    }
    return H.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8) }).join('')
  }
  function hex (buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2) }).join('') }
  // WebCrypto when the context is secure, the pure-JS digest otherwise. `env` defaults to globalThis.
  function sha256 (bytes, env) {
    var g = env || (typeof globalThis !== 'undefined' ? globalThis : {})
    try {
      if (g.crypto && g.crypto.subtle && g.isSecureContext) return g.crypto.subtle.digest('SHA-256', bytes).then(hex)
    } catch (e) { /* fall through to the pure-JS digest */ }
    return Promise.resolve(shaJs(bytes))
  }

  // ---------- salt: salt || data ----------
  function withSalt (salt, data) {
    var m = new Uint8Array(salt.length + data.length); m.set(salt); m.set(data, salt.length); return m
  }

  // ---------- comparison ----------
  // Accepts "SHA256: ABC...", spaces and line breaks; returns lowercase hex or ''.
  function normalizeHash (s) {
    return String(s == null ? '' : s).trim().toLowerCase().replace(/^sha256[:\s]*/, '').replace(/\s+/g, '')
  }
  function isHash (s) { return /^[0-9a-f]{64}$/.test(s) }
  // 'empty' | 'badHex' | 'ok' | 'bad'
  function verdict (expected, current) {
    var want = normalizeHash(expected)
    if (!want) return 'empty'
    if (!isHash(want)) return 'badHex'
    return want === current ? 'ok' : 'bad'
  }

  // ---------- fingerprint mini demo: which of the 64 digits changed ----------
  function changedDigits (prev, h) {
    var out = []
    for (var i = 0; i < 64; i++) out.push(!!prev && prev[i] !== h[i])
    return out
  }

  // ---------- formatting ----------
  function sizeLabel (n) {
    return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'
  }
  // Local wall-clock time as YYYY-MM-DDTHH:MM:SS (no zone): what the browser clock says.
  function localIso (d) {
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19)
  }

  // ---------- receipt model ----------
  // Lines of segments [cls, text]; cls '' is plain text. The page renders it with text nodes only.
  function receipt (h, opts) {
    var T = opts.strings
    function k (s) { return ['k', '"' + s + '"'] }
    function v (s) { return ['s', '"' + s + '"'] }
    function cm (s) { return ['c', '  // ' + s] }
    var soon = ['soonv', '"soon"']
    function p (s) { return ['', s] }
    var lines = [
      [p('{')],
      [p('  '), k('muhr'), p(': '), v('0-draft'), p(',')],
      [p('  '), k('hash'), p(': { '), k('alg'), p(': '), v('sha-256'), p(', '), k('value'), p(': '), v(h), p(' },')]
    ]
    if (opts.salted) lines.push([p('  '), k('salted'), p(': true,'), cm(T.c.salt)])
    lines.push([p('  '), k('log'), p(': { '), k('type'), p(': '), v('rfc9162'), p(', '), k('status'), p(': '), soon, p(' },')])
    lines.push([p('  '), k('anchors'), p(': [ { '), k('type'), p(': '), v('opentimestamps'), p(', '), k('status'), p(': '), soon, p(' } ],')])
    lines.push([p('  '), k('created_local'), p(': '), v(localIso(opts.now)), cm(T.c.local)])
    lines.push([p('}'), cm(T.c.never)])
    return lines
  }
  function receiptText (lines) {
    return lines.map(function (l) { return l.map(function (s) { return s[1] }).join('') }).join('\n')
  }

  return {
    STRINGS: STRINGS, strings: strings, shaJs: shaJs, hex: hex, sha256: sha256, withSalt: withSalt,
    normalizeHash: normalizeHash, isHash: isHash, verdict: verdict, changedDigits: changedDigits,
    sizeLabel: sizeLabel, localIso: localIso, receipt: receipt, receiptText: receiptText
  }
})
