// SPDX-FileCopyrightText: 2026 Wonmor and Muhr contributors
// SPDX-License-Identifier: Apache-2.0

// Hero signature: a sheet of paper, its SHA-256 lifting off as 64 glyphs, a wax seal pressed
// with those glyphs as its rim, then a Merkle branch into a Bitcoin block.
// Canvas 2D, no dependencies. Pauses off screen and in hidden tabs; one still frame under
// reduced motion. Coordinates live in a 100 x 100 box.
(function () {
  'use strict'
  var cv = document.getElementById('seal')
  if (!cv) return
  var ctx = null
  try { ctx = cv.getContext('2d') } catch { ctx = null }
  if (!ctx) { document.documentElement.classList.add('no-canvas'); return }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var stepBtns = Array.prototype.slice.call(document.querySelectorAll('.steps button'))
  var LBL = { file: cv.dataset.file || 'file.pdf', log: cv.dataset.log || 'log', btc: cv.dataset.btc || 'Bitcoin' }
  var LOOP = 17
  var PH = [0, 3.2, 7.0, 10.2] // file, hash, seal, bitcoin
  var HOLD = 15.6

  // layout (100-unit box)
  var SHEET = { x: 8, y: 12, w: 46, h: 64 }
  var SEAL = { x: 53, y: 70, r: 17 }
  var RING = 14.3
  var NODES = [{ x: 76, y: 50 }, { x: 84, y: 33 }]
  var BLOCKS = [{ x: 60, y: 9 }, { x: 73, y: 9 }, { x: 86, y: 9 }]
  var BW = 10, BH = 10

  var C = {}
  function readColors () {
    var s = getComputedStyle(document.documentElement)
    function g (n, d) { var v = s.getPropertyValue(n).trim(); return v || d }
    C.ink = g('--ink', '#1c1714'); C.ink2 = g('--ink-2', '#463e38'); C.mute = g('--mute', '#6a6058')
    C.line = g('--line', 'rgba(0,0,0,.14)'); C.panel = g('--panel', '#fffdf8'); C.bg = g('--bg', '#f6f1e7')
    C.accent = g('--accent', '#b4302a'); C.accentText = g('--accent-text', '#a32a24')
    C.dark = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  }
  readColors()
  document.addEventListener('muhr:theme', function () { readColors(); draw(now()) })

  // ---------- hash of the sample sentence (real SHA-256) ----------
  var HASH = '0000000000000000000000000000000000000000000000000000000000000000'
  function setHash (h) { HASH = h; build(); if (cv.width) draw(now()) }
  if (window.Muhr && cv.dataset.sample) window.Muhr.text(cv.dataset.sample + '\n' + LBL.file).then(setHash)

  // ---------- glyph particles ----------
  var glyphs = []
  function rnd (i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
  function build () {
    glyphs = []
    for (var i = 0; i < 64; i++) {
      var line = i % 8, col = Math.floor(i / 8)
      var sx = SHEET.x + 6 + col * 4.4 + rnd(i) * 1.2
      var sy = SHEET.y + 15 + line * 5.6
      var a = -Math.PI / 2 + (i / 64) * Math.PI * 2
      glyphs.push({ ch: HASH[i], sx: sx, sy: sy, a: a, delay: rnd(i + 7) * 1.1 + (i / 64) * 0.9, lift: 6 + rnd(i + 3) * 10 })
    }
  }
  build()

  // ---------- helpers ----------
  function clamp (v, a, b) { return v < a ? a : v > b ? b : v }
  function prog (t, a, d) { return clamp((t - a) / d, 0, 1) }
  function eo (p) { return 1 - Math.pow(1 - p, 3) } // ease out cubic
  function eio (p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2 }
  function rr (x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
  }
  function waxEdge (a) { return 1 + 0.05 * Math.sin(5 * a + 1.3) + 0.032 * Math.sin(9 * a + 0.4) + 0.02 * Math.sin(14 * a + 2.1) }

  // pointer light
  var light = { x: -0.55, y: -0.65, tx: -0.55, ty: -0.65 }, par = { x: 0, y: 0, tx: 0, ty: 0 }
  cv.parentElement.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || reduce) return
    var r = cv.getBoundingClientRect()
    var nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5
    light.tx = clamp(-nx * 1.6 - 0.2, -1, 1); light.ty = clamp(-ny * 1.6 - 0.3, -1, 1)
    par.tx = nx; par.ty = ny
  })
  cv.parentElement.addEventListener('pointerleave', function () { light.tx = -0.55; light.ty = -0.65; par.tx = 0; par.ty = 0 })

  // ---------- drawing ----------
  var U = 1, DPR = 1
  function size () {
    var r = cv.getBoundingClientRect()
    DPR = Math.min(window.devicePixelRatio || 1, 1.5)
    cv.width = Math.round(r.width * DPR); cv.height = Math.round(r.height * DPR)
    U = (r.width * DPR) / 100
  }

  function drawSheet (t) {
    var pin = eo(prog(t, 0.2, 1.6))
    var fadeAll = 1 - prog(t, HOLD + 0.5, 0.8)
    var bob = reduce ? 0 : Math.sin(t * 0.6) * 0.35
    ctx.save()
    ctx.globalAlpha = pin * fadeAll
    ctx.translate(par.x * -1.2, bob + (1 - pin) * 6 + par.y * -1.2)
    ctx.translate(SHEET.x + SHEET.w / 2, SHEET.y + SHEET.h / 2); ctx.rotate(-0.035); ctx.translate(-(SHEET.x + SHEET.w / 2), -(SHEET.y + SHEET.h / 2))
    // shadow
    ctx.fillStyle = C.dark ? 'rgba(0,0,0,.35)' : 'rgba(60,40,20,.10)'
    rr(SHEET.x + 1.2, SHEET.y + 2.2, SHEET.w, SHEET.h, 2.2); ctx.fill()
    ctx.fillStyle = C.panel; rr(SHEET.x, SHEET.y, SHEET.w, SHEET.h, 2.2); ctx.fill()
    ctx.strokeStyle = C.line; ctx.lineWidth = 0.25; ctx.stroke()
    // folded corner
    ctx.fillStyle = C.bg
    ctx.beginPath(); ctx.moveTo(SHEET.x + SHEET.w - 7, SHEET.y); ctx.lineTo(SHEET.x + SHEET.w, SHEET.y + 7); ctx.lineTo(SHEET.x + SHEET.w - 7, SHEET.y + 7); ctx.closePath(); ctx.fill(); ctx.stroke()
    // file name
    ctx.fillStyle = C.mute; ctx.font = '500 2.5px ' + mono; ctx.textBaseline = 'alphabetic'
    ctx.fillText(LBL.file, SHEET.x + 5, SHEET.y + 7.5)
    // text lines; a scan bar reads them during the hash phase
    var scan = prog(t, PH[1], 2.6)
    var scanY = SHEET.y + 12 + scan * (SHEET.h - 18)
    for (var i = 0; i < 8; i++) {
      var y = SHEET.y + 14 + i * 5.6
      var w = SHEET.w - 10 - (i % 3) * 5 - (i === 7 ? 14 : 0)
      var lit = scan > 0 && scan < 1 && Math.abs(y - scanY) < 3
      ctx.fillStyle = lit ? C.accent : C.line
      ctx.globalAlpha = pin * fadeAll * (lit ? 0.75 : 1)
      rr(SHEET.x + 5, y - 0.8, w, 1.6, 0.8); ctx.fill()
    }
    ctx.globalAlpha = pin * fadeAll
    if (scan > 0 && scan < 1) {
      var g = ctx.createLinearGradient(0, scanY - 4, 0, scanY + 4)
      g.addColorStop(0, 'rgba(180,48,42,0)'); g.addColorStop(0.5, 'rgba(180,48,42,.18)'); g.addColorStop(1, 'rgba(180,48,42,0)')
      ctx.fillStyle = g; ctx.fillRect(SHEET.x + 1, scanY - 4, SHEET.w - 2, 8)
    }
    ctx.restore()
  }

  var mono = "'M Mono', ui-monospace, Consolas, monospace"
  var serif = "'M Serif', Georgia, serif"

  function glyphPos (gl, t, spin) {
    var p = eio(prog(t, PH[1] + 0.5 + gl.delay, 1.9))
    var ex = SEAL.x + Math.cos(gl.a + spin) * RING, ey = SEAL.y + Math.sin(gl.a + spin) * RING
    var cx = (gl.sx + ex) / 2 + 4, cy = Math.min(gl.sy, ey) - gl.lift
    var q = 1 - p
    return { p: p, x: q * q * gl.sx + 2 * q * p * cx + p * p * ex, y: q * q * gl.sy + 2 * q * p * cy + p * p * ey }
  }

  function drawGlyphsFlying (t, spin) {
    if (t < PH[1] + 0.4) return
    ctx.save()
    ctx.font = '600 2.35px ' + mono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    var landed = prog(t, PH[2], 0.35)
    for (var i = 0; i < glyphs.length; i++) {
      var gl = glyphs[i], q = glyphPos(gl, t, spin)
      if (q.p <= 0) continue
      if (t >= PH[2] + 0.35) continue // embossed into the wax from here on
      ctx.globalAlpha = Math.min(1, q.p * 4) * (1 - landed)
      ctx.fillStyle = q.p < 1 ? C.accentText : C.accent
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.p * (gl.a + spin + Math.PI / 2)); ctx.fillText(gl.ch, 0, 0); ctx.restore()
    }
    ctx.restore()
  }

  function drawSeal (t, spin) {
    var drop = prog(t, PH[2], 1.0)
    if (drop <= 0) return
    var fadeAll = 1 - prog(t, HOLD + 0.5, 0.8)
    // fall, squash, settle
    var fall = eo(Math.min(1, drop / 0.45))
    var squash = drop < 0.45 ? 0 : Math.sin(Math.min(1, (drop - 0.45) / 0.55) * Math.PI) * (1 - (drop - 0.45) / 0.55)
    var sx = 1 + squash * 0.12, sy = 1 - squash * 0.09
    var scale = 1.5 - 0.5 * fall
    var spread = eo(prog(t, PH[2] + 0.4, 1.4))
    var lx = light.x, ly = light.y
    ctx.save()
    ctx.globalAlpha = Math.min(1, fall * 1.6) * fadeAll
    ctx.translate(SEAL.x + par.x * 2, SEAL.y + par.y * 2)
    ctx.scale(scale * sx, scale * sy)
    var R = SEAL.r * (0.82 + 0.18 * spread)
    // drop shadow
    ctx.fillStyle = C.dark ? 'rgba(0,0,0,.45)' : 'rgba(60,20,10,.22)'
    ctx.beginPath(); ctx.ellipse(0.8 - lx * 1.2, 1.6 - ly * 1.2, R * 1.04, R * 1.02, 0, 0, Math.PI * 2); ctx.fill()
    // wax body
    ctx.beginPath()
    for (var i = 0; i <= 96; i++) {
      var a = (i / 96) * Math.PI * 2, k = 1 + (waxEdge(a) - 1) * (0.4 + 0.6 * spread)
      var x = Math.cos(a) * R * k, y = Math.sin(a) * R * k
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    var gw = ctx.createRadialGradient(lx * R * 0.45, ly * R * 0.45, R * 0.05, 0, 0, R * 1.08)
    gw.addColorStop(0, '#de5a4d'); gw.addColorStop(0.5, '#ae2c23'); gw.addColorStop(0.85, '#7e1912'); gw.addColorStop(1, '#5c100b')
    ctx.fillStyle = gw; ctx.fill()
    // pressed face (concave: lit from the opposite side)
    var F = R * 0.72
    var gf = ctx.createRadialGradient(-lx * F * 0.5, -ly * F * 0.5, F * 0.1, 0, 0, F)
    gf.addColorStop(0, '#c43a30'); gf.addColorStop(1, '#8c2019')
    ctx.fillStyle = gf; ctx.beginPath(); ctx.arc(0, 0, F, 0, Math.PI * 2); ctx.fill()
    // lip of the press: highlight on the far side, shadow on the near side
    var la = Math.atan2(ly, lx)
    ctx.lineWidth = 0.7
    ctx.strokeStyle = 'rgba(255,220,210,.45)'; ctx.beginPath(); ctx.arc(0, 0, F, la + Math.PI - 1.1, la + Math.PI + 1.1); ctx.stroke()
    ctx.strokeStyle = 'rgba(40,5,3,.5)'; ctx.beginPath(); ctx.arc(0, 0, F, la - 1.1, la + 1.1); ctx.stroke()
    // rim of hash glyphs, embossed
    var emb = prog(t, PH[2] + 0.25, 0.6)
    if (emb > 0) {
      ctx.font = '700 2.25px ' + mono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      var rg = RING * (R / SEAL.r) * 0.98
      for (var j = 0; j < glyphs.length; j++) {
        var gl = glyphs[j], a2 = gl.a + spin
        ctx.save(); ctx.translate(Math.cos(a2) * rg, Math.sin(a2) * rg); ctx.rotate(a2 + Math.PI / 2)
        ctx.globalAlpha = emb * fadeAll
        ctx.fillStyle = 'rgba(50,6,3,.55)'; ctx.fillText(gl.ch, -lx * 0.22, -ly * 0.22)
        ctx.fillStyle = 'rgba(255,214,204,.82)'; ctx.fillText(gl.ch, lx * 0.12, ly * 0.12)
        ctx.restore()
      }
      // centre letter
      ctx.globalAlpha = emb * fadeAll
      ctx.font = '600 13px ' + serif
      ctx.fillStyle = 'rgba(50,6,3,.5)'; ctx.fillText('M', -lx * 0.5, 0.6 - ly * 0.5)
      ctx.fillStyle = 'rgba(255,214,204,.9)'; ctx.fillText('M', lx * 0.2, 0.6 + ly * 0.2)
    }
    // specular glint on the outer wax
    ctx.globalAlpha = 0.35 * fadeAll * spread
    var gs = ctx.createRadialGradient(lx * R * 0.78, ly * R * 0.78, 0, lx * R * 0.78, ly * R * 0.78, R * 0.35)
    gs.addColorStop(0, 'rgba(255,240,235,.9)'); gs.addColorStop(1, 'rgba(255,240,235,0)')
    ctx.fillStyle = gs; ctx.beginPath(); ctx.arc(lx * R * 0.78, ly * R * 0.78, R * 0.35, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }

  function drawHashText (t) {
    var p = prog(t, PH[1] + 0.3, 2.8)
    if (p <= 0) return
    var fadeAll = 1 - prog(t, HOLD + 0.5, 0.8)
    var n = Math.floor(p * 64)
    ctx.save()
    ctx.globalAlpha = fadeAll
    ctx.font = '500 2.45px ' + mono; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = C.mute; ctx.fillText('sha256', 8, 90.2)
    ctx.fillStyle = C.ink2
    ctx.fillText(HASH.slice(0, Math.min(n, 32)), 8, 93.8)
    if (n > 32) ctx.fillText(HASH.slice(32, n), 8, 97.4)
    ctx.restore()
  }

  function drawAnchor (t) {
    var p0 = prog(t, PH[3], 3.2)
    if (p0 <= 0) return
    var fadeAll = 1 - prog(t, HOLD + 0.5, 0.8)
    ctx.save()
    ctx.globalAlpha = fadeAll
    // path: seal edge -> node1 -> node2 -> block 3
    var start = { x: SEAL.x + SEAL.r * 0.78, y: SEAL.y - SEAL.r * 0.62 }
    var end = { x: BLOCKS[2].x + BW / 2, y: BLOCKS[2].y + BH }
    var pts = [start, NODES[0], NODES[1], end]
    var segs = [], total = 0
    for (var i = 1; i < pts.length; i++) { var d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); segs.push(d); total += d }
    var drawn = eio(prog(t, PH[3], 1.8)) * total
    ctx.strokeStyle = C.accent; ctx.lineWidth = 0.45; ctx.lineCap = 'round'
    ctx.setLineDash([1.2, 1.1])
    ctx.beginPath(); ctx.moveTo(start.x, start.y)
    var acc = 0
    for (i = 1; i < pts.length; i++) {
      if (drawn <= acc) break
      var f = Math.min(1, (drawn - acc) / segs[i - 1])
      ctx.lineTo(pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f, pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f)
      acc += segs[i - 1]
    }
    ctx.stroke(); ctx.setLineDash([])
    // sibling hashes of the Merkle branch
    var sib = [{ x: 90, y: 56 }, { x: 70, y: 30 }]
    for (i = 0; i < 2; i++) {
      var np = prog(t, PH[3] + 0.4 + i * 0.5, 0.6)
      if (np <= 0) continue
      ctx.globalAlpha = fadeAll * np
      ctx.strokeStyle = C.line; ctx.lineWidth = 0.35
      ctx.beginPath(); ctx.moveTo(NODES[i].x, NODES[i].y); ctx.lineTo(sib[i].x, sib[i].y); ctx.stroke()
      ctx.fillStyle = C.panel; ctx.beginPath(); ctx.arc(sib[i].x, sib[i].y, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      ctx.fillStyle = C.panel; ctx.strokeStyle = C.accent; ctx.lineWidth = 0.5
      ctx.beginPath(); ctx.arc(NODES[i].x, NODES[i].y, 2 * eo(np), 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    }
    // labels
    ctx.globalAlpha = fadeAll * prog(t, PH[3] + 0.6, 0.6)
    ctx.font = '500 2.4px ' + mono; ctx.fillStyle = C.mute; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
    ctx.fillText(LBL.log, NODES[0].x + 3.2, NODES[0].y + 0.2)
    ctx.fillText('OTS', NODES[1].x + 3.2, NODES[1].y + 0.2)
    // blocks
    for (i = 0; i < 3; i++) {
      var bp = eo(prog(t, PH[3] + 0.2 + i * 0.25, 0.8))
      if (bp <= 0) continue
      var b = BLOCKS[i]
      ctx.globalAlpha = fadeAll * bp
      ctx.fillStyle = C.panel; rr(b.x, b.y + (1 - bp) * 3, BW, BH, 1.4); ctx.fill()
      ctx.strokeStyle = i === 2 ? C.accent : C.line; ctx.lineWidth = i === 2 ? 0.6 : 0.35; ctx.stroke()
      ctx.fillStyle = C.line
      for (var l = 0; l < 3; l++) { rr(b.x + 2, b.y + 2.6 + l * 2 + (1 - bp) * 3, BW - 4 - l * 1.2, 0.8, 0.4); ctx.fill() }
      if (i < 2) { ctx.strokeStyle = C.line; ctx.lineWidth = 0.35; ctx.beginPath(); ctx.moveTo(b.x + BW, b.y + BH / 2); ctx.lineTo(BLOCKS[i + 1].x, b.y + BH / 2); ctx.stroke() }
    }
    ctx.globalAlpha = fadeAll * prog(t, PH[3] + 0.5, 0.6)
    ctx.fillStyle = C.mute; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.font = '500 2.4px ' + mono
    ctx.fillText(LBL.btc, BLOCKS[0].x, BLOCKS[0].y - 2.2)
    // the tick: anchored
    var tk = prog(t, PH[3] + 2.0, 0.7)
    if (tk > 0) {
      var b3 = BLOCKS[2]
      ctx.globalAlpha = fadeAll
      ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(b3.x + BW, b3.y, 2.6 * eo(tk), 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.55; ctx.lineJoin = 'round'
      if (tk > 0.4) { ctx.beginPath(); ctx.moveTo(b3.x + BW - 1.2, b3.y); ctx.lineTo(b3.x + BW - 0.3, b3.y + 0.9); ctx.lineTo(b3.x + BW + 1.3, b3.y - 0.9); ctx.stroke() }
    }
    ctx.restore()
  }

  function draw (t) {
    if (!cv.width) return
    light.x += (light.tx - light.x) * 0.06; light.y += (light.ty - light.y) * 0.06
    par.x += (par.tx - par.x) * 0.05; par.y += (par.ty - par.y) * 0.05
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, cv.width, cv.height)
    ctx.setTransform(U, 0, 0, U, 0, 0)
    var spin = reduce ? 0 : t * 0.018
    drawSheet(t)
    drawHashText(t)
    drawAnchor(t)
    drawSeal(t, spin)
    drawGlyphsFlying(t, spin)
    var st = t >= PH[3] ? 3 : t >= PH[2] ? 2 : t >= PH[1] ? 1 : 0
    if (st !== lastStep) { lastStep = st; stepBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === st)) }) }
  }

  // ---------- clock ----------
  var lastStep = -1
  var offset = 0, base = performance.now(), running = false, visible = true, raf = 0, lastFrame = 0
  function now () { return reduce ? HOLD - 0.2 : ((performance.now() - base) / 1000 + offset) % LOOP }
  function frame (ts) {
    raf = 0
    if (!running) return
    if (ts - lastFrame >= 15) { lastFrame = ts; draw(now()) }
    raf = requestAnimationFrame(frame)
  }
  function start () { if (running || reduce) return; running = true; raf = requestAnimationFrame(frame) }
  function stop () { running = false; if (raf) cancelAnimationFrame(raf); raf = 0 }

  stepBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var i = +b.dataset.step
      if (reduce) {
        // still frame at the end of the chosen chapter
        var ends = [PH[1] - 0.1, PH[2] - 0.2, PH[3] - 0.1, HOLD - 0.2]
        lastStep = -1; draw(ends[i]); return
      }
      base = performance.now(); offset = PH[i] + (i === 0 ? 0 : 0.01)
      lastStep = -1
    })
  })

  function resize () { size(); draw(now()) }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(cv)
  else window.addEventListener('resize', resize)
  size()

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting
      if (visible && !document.hidden) start(); else stop()
    }).observe(cv)
  } else start()
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (visible) start() })

  // fonts change glyph metrics: redraw once they are in
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { draw(now()) })
  draw(now())
  cv.classList.add('ready')
})()
