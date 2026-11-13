// SPDX-FileCopyrightText: 2026 Wonmor and Muhr contributors
// SPDX-License-Identifier: Apache-2.0

// Muhr home page behaviour. No dependencies, no network requests.
(function () {
  'use strict'
  var doc = document.documentElement
  var lang = (doc.getAttribute('lang') || 'uz').slice(0, 2)
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  var C = window.MuhrCore
  if (!C) return
  var T = C.strings(lang)
  if (!T) return
  var sha256 = function (bytes) { return C.sha256(bytes) }

  // Builds <svg aria-hidden="true"><use href="#id"/></svg> without parsing markup.
  var SVGNS = 'http://www.w3.org/2000/svg'
  function icon (id) {
    var svg = document.createElementNS(SVGNS, 'svg'), use = document.createElementNS(SVGNS, 'use')
    svg.setAttribute('aria-hidden', 'true'); use.setAttribute('href', '#' + id); svg.appendChild(use)
    return svg
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
    themeBtn.replaceChildren(icon(dark ? 'i-sun' : 'i-moon'))
    themeBtn.setAttribute('aria-label', dark ? T.light : T.dark)
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = effective() === 'dark' ? 'light' : 'dark'
      doc.setAttribute('data-theme', next)
      try { localStorage.setItem('muhr-theme', next) } catch { /* not persisted */ }
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
    var ch = C.changedDigits(fpPrev, h), frag = document.createDocumentFragment()
    for (var i = 0; i < 64; i++) {
      var d = document.createElement('span')
      d.className = ch[i] ? 'd ch' : 'd'; d.textContent = h[i]; frag.appendChild(d)
    }
    fpOut.replaceChildren(frag)
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
  var mode = 'stamp', fileBytes = null, salt = null, current = '', seq = 0

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
  function paintReceipt (h) {
    var lines = C.receipt(h, { strings: T, salted: !!(salt && mode === 'stamp'), now: new Date() })
    var frag = document.createDocumentFragment()
    lines.forEach(function (line, n) {
      if (n) frag.appendChild(document.createTextNode('\n'))
      line.forEach(function (seg) {
        if (!seg[0]) { frag.appendChild(document.createTextNode(seg[1])); return }
        var sp = document.createElement('span'); sp.className = seg[0]; sp.textContent = seg[1]; frag.appendChild(sp)
      })
    })
    receipt.replaceChildren(frag)
  }
  function pressSeal () {
    if (!miniSeal || reduce) return
    miniSeal.classList.remove('press'); void miniSeal.getBoundingClientRect(); miniSeal.classList.add('press')
  }
  function bytesNow () {
    var data = fileBytes || enc.encode(ta.value)
    if (mode === 'stamp' && saltBox.checked) {
      if (!salt) { salt = new Uint8Array(16); crypto.getRandomValues(salt) }
      return C.withSalt(salt, data)
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
    var r = C.verdict(expect.value, current)
    verdict.className = 'verdict'
    if (r === 'empty') { verdict.textContent = ''; return }
    verdict.className = 'verdict ' + (r === 'ok' ? 'ok' : 'bad')
    verdict.replaceChildren(icon(r === 'ok' ? 'i-yes' : 'i-no'), document.createTextNode(r === 'ok' ? T.ok : r === 'bad' ? T.bad : T.badHex))
  }

  ta.addEventListener('input', function () {
    if (fileBytes) { fileBytes = null; fname.textContent = T.noFile; fileIn.value = '' }
    run()
  })
  saltBox.addEventListener('change', function () { if (!saltBox.checked) salt = null; run(true) })
  expect.addEventListener('input', check)

  var fileSeq = 0
  function takeFile (f) {
    if (!f) return
    var my = ++fileSeq
    fname.textContent = f.name + ' · ' + T.reading
    f.arrayBuffer().then(function (buf) {
      if (my !== fileSeq) return // a newer file was chosen while this one was read
      fileBytes = new Uint8Array(buf)
      fname.textContent = f.name + ' · ' + C.sizeLabel(f.size)
      run(true)
    }, function () {
      if (my !== fileSeq) return
      fname.textContent = f.name + ' · ' + T.readFail
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
