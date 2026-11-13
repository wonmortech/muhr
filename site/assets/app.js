// Muhr home page behaviour. No dependencies, no network requests.
(function () {
  'use strict'
  var doc = document.documentElement
  var lang = (doc.getAttribute('lang') || 'uz').slice(0, 2)
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  var T = {
    uz: { copied: 'Nusxalandi', noFile: 'yoki shu yerga tashlang', ok: 'Mos keladi: fayl oʻzgarmagan', bad: 'Mos kelmaydi: fayl boshqa yoki oʻzgargan', badHex: 'Hash 64 ta belgidan iborat boʻlishi kerak (0-9, a-f)', hashIs: 'SHA-256 hash: ', reading: 'oʻqilmoqda…', light: 'Yorugʻ mavzuga oʻtish', dark: 'Qorongʻi mavzuga oʻtish',
      c: { local: 'brauzer vaqti, isbot emas', salt: 'faqat sizda saqlanadi', soon: 'tez kunda', never: 'fayl va matn yuborilmaydi' } },
    en: { copied: 'Copied', noFile: 'or drop it here', ok: 'Match: the file is unchanged', bad: 'No match: a different or changed file', badHex: 'A hash is 64 characters (0-9, a-f)', hashIs: 'SHA-256 hash: ', reading: 'reading…', light: 'Switch to light theme', dark: 'Switch to dark theme',
      c: { local: 'browser clock, not a proof', salt: 'kept only by you', soon: 'soon', never: 'file and text are never sent' } },
    ru: { copied: 'Скопировано', noFile: 'или перетащите сюда', ok: 'Совпадает: файл не изменён', bad: 'Не совпадает: файл другой или изменён', badHex: 'Хеш состоит из 64 символов (0-9, a-f)', hashIs: 'Хеш SHA-256: ', reading: 'читаем…', light: 'Включить светлую тему', dark: 'Включить тёмную тему',
      c: { local: 'время браузера, не доказательство', salt: 'хранится только у вас', soon: 'скоро', never: 'файл и текст не отправляются' } }
  }[lang] || null
  if (!T) return

  // ---------- SHA-256: WebCrypto, with a small pure-JS fallback for insecure contexts ----------
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
  function sha256 (bytes) {
    try {
      if (window.crypto && crypto.subtle && window.isSecureContext) return crypto.subtle.digest('SHA-256', bytes).then(hex)
    } catch (e) { /* fall through */ }
    return Promise.resolve(shaJs(bytes))
  }
  var enc = new TextEncoder()
  window.Muhr = { sha256: sha256, text: function (s) { return sha256(enc.encode(s)) }, reduce: reduce }

  // ---------- theme ----------
  var themeBtn = document.getElementById('theme')
  function effective () {
    var t = doc.getAttribute('data-theme')
    if (t) return t
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  function paintThemeBtn () {
    if (!themeBtn) return
    var dark = effective() === 'dark'
    themeBtn.innerHTML = '<svg aria-hidden="true"><use href="#' + (dark ? 'i-sun' : 'i-moon') + '"/></svg>'
    themeBtn.setAttribute('aria-label', dark ? T.light : T.dark)
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = effective() === 'dark' ? 'light' : 'dark'
      doc.setAttribute('data-theme', next)
      try { localStorage.setItem('muhr-theme', next) } catch (e) { /* not persisted */ }
      paintThemeBtn()
      document.dispatchEvent(new CustomEvent('muhr:theme'))
    })
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { paintThemeBtn(); document.dispatchEvent(new CustomEvent('muhr:theme')) })
    paintThemeBtn()
  }

  // ---------- header ----------
  var top = document.getElementById('top')
  var ticking = false
  function onScroll () {
    if (ticking) return
    ticking = true
    requestAnimationFrame(function () { ticking = false; if (top) top.classList.toggle('scrolled', window.scrollY > 8) })
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll()

  var menu = document.getElementById('menu'), nav = document.getElementById('nav')
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = nav.classList.toggle('open')
      menu.setAttribute('aria-expanded', String(open))
    })
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false') }
    })
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.focus() }
    })
  }

  var mark = document.querySelector('.brand .mark')
  if (mark) {
    var pressMark = function () { mark.classList.remove('press'); void mark.getBoundingClientRect(); mark.classList.add('press') }
    document.querySelector('.brand').addEventListener('mouseenter', pressMark)
    setTimeout(pressMark, 300)
  }

  // ---------- reveal + stroke drawing ----------
  var targets = document.querySelectorAll('.rv, .draw')
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return
        var el = e.target
        var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0
        setTimeout(function () { el.classList.add('in') }, Math.min(sib, 6) * 70)
        io.unobserve(el)
      })
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
    targets.forEach(function (el) { io.observe(el) })
  } else {
    targets.forEach(function (el) { el.classList.add('in') })
  }

  // ---------- magnetic primary button (mouse only) ----------
  document.querySelectorAll('.magnet').forEach(function (b) {
    b.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || reduce) return
      var r = b.getBoundingClientRect()
      b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px')
      b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + 'px')
    })
    b.addEventListener('pointerleave', function () { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px') })
  })

  // ---------- fingerprint mini demo: one letter, different hash ----------
  var fpIn = document.getElementById('fp-in'), fpOut = document.getElementById('fp-out')
  var fpPrev = ''
  function renderFp (h) {
    var html = ''
    for (var i = 0; i < 64; i++) html += '<span class="d' + (fpPrev && fpPrev[i] !== h[i] ? ' ch' : '') + '">' + h[i] + '</span>'
    fpOut.innerHTML = html
    fpOut.setAttribute('aria-label', T.hashIs + h)
    fpPrev = h
    if (!reduce) setTimeout(function () { fpOut.querySelectorAll('.ch').forEach(function (s) { s.classList.remove('ch') }) }, 900)
  }
  if (fpIn && fpOut) {
    var fpRun = function () { window.Muhr.text(fpIn.value).then(renderFp) }
    fpIn.addEventListener('input', fpRun); fpRun()
  }

  // ---------- main demo ----------
  var ta = document.getElementById('d-text')
  if (!ta) return
  var fileIn = document.getElementById('d-file'), fname = document.getElementById('d-fname'), drop = document.getElementById('drop')
  var saltBox = document.getElementById('d-salt'), optSalt = document.getElementById('opt-salt')
  var grid = document.getElementById('grid'), sr = document.getElementById('hash-sr'), receipt = document.getElementById('receipt')
  var copyBtn = document.getElementById('copy'), cmp = document.getElementById('cmp'), expect = document.getElementById('d-expect'), verdict = document.getElementById('verdict')
  var tabS = document.getElementById('tab-stamp'), tabC = document.getElementById('tab-cmp'), panel = document.getElementById('demo-panel')
  var miniSeal = document.querySelector('.receipt .mini-seal')
  var mode = 'stamp', fileBytes = null, fileLabel = '', salt = null, current = '', seq = 0

  var cells = []
  for (var i = 0; i < 64; i++) { var s = document.createElement('span'); s.textContent = '0'; grid.appendChild(s); cells.push(s) }

  function paintGrid (h) {
    cells.forEach(function (c, k) {
      if (c.textContent === h[k]) return
      var go = function () {
        c.textContent = h[k]
        if (reduce) return
        c.classList.add('flip')
        requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.remove('flip') }) })
      }
      if (reduce) go(); else setTimeout(go, (k % 16) * 9 + Math.floor(k / 16) * 26)
    })
  }
  function esc (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }
  function k (s) { return '<span class="k">"' + s + '"</span>' }
  function v (s) { return '<span class="s">"' + esc(s) + '"</span>' }
  function soon () { return '<span class="soonv">"soon"</span>' }
  function cm (s) { return '<span class="c">  // ' + esc(s) + '</span>' }
  function paintReceipt (h) {
    var now = new Date()
    var iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 19)
    var lines = [
      '{',
      '  ' + k('muhr') + ': ' + v('0-draft') + ',',
      '  ' + k('hash') + ': { ' + k('alg') + ': ' + v('sha-256') + ', ' + k('value') + ': ' + v(h) + ' },'
    ]
    if (salt && mode === 'stamp') lines.push('  ' + k('salted') + ': true,' + cm(T.c.salt))
    lines.push('  ' + k('log') + ': { ' + k('type') + ': ' + v('rfc9162') + ', ' + k('status') + ': ' + soon() + ' },')
    lines.push('  ' + k('anchors') + ': [ { ' + k('type') + ': ' + v('opentimestamps') + ', ' + k('status') + ': ' + soon() + ' } ],')
    lines.push('  ' + k('created_local') + ': ' + v(iso) + cm(T.c.local))
    lines.push('}' + cm(T.c.never))
    receipt.innerHTML = lines.join('\n')
  }
  function pressSeal () {
    if (!miniSeal || reduce) return
    miniSeal.classList.remove('press'); void miniSeal.getBoundingClientRect(); miniSeal.classList.add('press')
  }
  function bytesNow () {
    var data = fileBytes || enc.encode(ta.value)
    if (mode === 'stamp' && saltBox.checked) {
      if (!salt) { salt = new Uint8Array(16); crypto.getRandomValues(salt) }
      var m = new Uint8Array(salt.length + data.length); m.set(salt); m.set(data, salt.length); return m
    }
    return data
  }
  var debounce = null
  function run (immediate) {
    clearTimeout(debounce)
    debounce = setTimeout(function () {
      var my = ++seq
      window.Muhr.sha256(bytesNow()).then(function (h) {
        if (my !== seq) return
        var changed = h !== current
        current = h
        paintGrid(h)
        sr.textContent = T.hashIs + h
        paintReceipt(h)
        if (changed) pressSeal()
        check()
      })
    }, immediate ? 0 : 120)
  }
  function check () {
    if (mode !== 'cmp') return
    var want = (expect.value || '').trim().toLowerCase().replace(/^sha256[:\s]*/, '').replace(/\s+/g, '')
    verdict.className = 'verdict'
    if (!want) { verdict.textContent = ''; return }
    if (!/^[0-9a-f]{64}$/.test(want)) { verdict.className = 'verdict bad'; verdict.innerHTML = '<svg aria-hidden="true"><use href="#i-no"/></svg>' + T.badHex; return }
    var ok = want === current
    verdict.className = 'verdict ' + (ok ? 'ok' : 'bad')
    verdict.innerHTML = '<svg aria-hidden="true"><use href="#' + (ok ? 'i-yes' : 'i-no') + '"/></svg>' + (ok ? T.ok : T.bad)
  }

  ta.addEventListener('input', function () {
    if (fileBytes) { fileBytes = null; fname.textContent = T.noFile; fileIn.value = '' }
    run()
  })
  saltBox.addEventListener('change', function () { if (!saltBox.checked) salt = null; run(true) })
  expect.addEventListener('input', check)

  function takeFile (f) {
    if (!f) return
    fname.textContent = f.name + ' · ' + T.reading
    f.arrayBuffer().then(function (buf) {
      fileBytes = new Uint8Array(buf); fileLabel = f.name
      fname.textContent = f.name + ' · ' + (f.size >= 1048576 ? (f.size / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(f.size / 1024)) + ' KB')
      run(true)
    })
  }
  fileIn.addEventListener('change', function () { takeFile(fileIn.files && fileIn.files[0]) })
  ;['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over') }) })
  ;['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over') }) })
  drop.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; takeFile(f) })

  copyBtn.addEventListener('click', function () {
    var label = copyBtn.textContent
    var done = function () { copyBtn.textContent = T.copied; setTimeout(function () { copyBtn.textContent = label }, 1400) }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(current).then(done, function () {})
  })

  function setTab (m) {
    mode = m
    var stamp = m === 'stamp'
    tabS.setAttribute('aria-selected', String(stamp)); tabC.setAttribute('aria-selected', String(!stamp))
    tabS.tabIndex = stamp ? 0 : -1; tabC.tabIndex = stamp ? -1 : 0
    panel.setAttribute('aria-labelledby', stamp ? 'tab-stamp' : 'tab-cmp')
    cmp.classList.toggle('on', !stamp)
    optSalt.hidden = !stamp
    run(true)
  }
  tabS.addEventListener('click', function () { setTab('stamp') })
  tabC.addEventListener('click', function () { setTab('cmp') })
  ;[tabS, tabC].forEach(function (t) {
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var n = t === tabS ? tabC : tabS; n.focus(); n.click() }
    })
  })
  run(true)
})()
