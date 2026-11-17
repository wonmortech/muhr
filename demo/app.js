// SPDX-FileCopyrightText: 2026 Wonmor and Muhr contributors
// SPDX-License-Identifier: Apache-2.0

/* Muhr concept demo: the planned product UI (stamp a file, receipts, offline verifier, open log, integrations,
   Telegram bot) running entirely in the browser on fictional data. Hash routing, so any static host and any
   sub-path work. What is real: SHA-256 of your file (WebCrypto, the file never leaves the page) and the RFC 9162
   Merkle log maths (tree heads, inclusion and consistency proofs). What is simulated: the server, the
   OpenTimestamps calendars and the Bitcoin confirmations. */
import { seed, RECENT, SOURCES, CALENDARS, SAMPLES, LOG_ORIGIN, HOUR, DAY, rng, randHex, hexBytes, withSalt, heightAt } from './data.js';
import { Log, leafHash, rootFromInclusion, verifyConsistency } from './merkle.js';

const C = globalThis.MuhrCore;
const NOW = Date.now();
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const NF = new Intl.NumberFormat('en-US');

/* ---------- DOM helpers (no innerHTML: the strict CSP and escaping are never a concern) ---------- */
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'text') el.textContent = v;
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(Infinity)) if (k != null && k !== false) el.append(k.nodeType ? k : String(k));
  return el;
}
const SVGNS = 'http://www.w3.org/2000/svg';
function s(tag, attrs, ...kids) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
  for (const k of kids) if (k != null) el.append(k.nodeType ? k : document.createTextNode(String(k)));
  return el;
}
const num = (n) => NF.format(n).replace(/,/g, ' ');
const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (t) => { const d = new Date(t); return `${d.getDate()}-${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtDay = (t) => { const d = new Date(t); return `${d.getDate()}-${MONTHS[d.getMonth()].slice(0, 3)}`; };
function ago(t) {
  const m = Math.max(0, Math.round((Date.now() - t) / 60e3));
  if (m < 1) return 'hozirgina';
  if (m < 60) return m + ' daqiqa oldin';
  const hr = Math.round(m / 60);
  if (hr < 48) return hr + ' soat oldin';
  return Math.round(hr / 24) + ' kun oldin';
}
const dur = (ms) => { const m = Math.round(ms / 60e3); return m < 60 ? m + ' daqiqa' : Math.floor(m / 60) + ' soat ' + (m % 60) + ' daqiqa'; };
const short = (hex, n = 10) => hex.slice(0, n) + '…' + hex.slice(-6);
const go = (path) => { location.hash = '#' + path; };
const link = (path, ...kids) => h('a', { href: '#' + path }, ...kids);
function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = h('a', { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast(name + ' yuklab olindi');
}
let toastTimer = 0;
function toast(text) {
  let el = document.getElementById('toast');
  if (!el) { el = h('div', { id: 'toast', role: 'status', class: 'toast' }); document.body.append(el); }
  el.textContent = text; el.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 2200);
}
async function copy(text, what = 'Nusxalandi') {
  try { await navigator.clipboard.writeText(text); toast(what); } catch { toast('Nusxalab boʻlmadi: brauzer ruxsat bermadi'); }
}
const bytesOf = (text) => new TextEncoder().encode(text);

/* ---------- world: the public log, its hourly tree heads and the receipts kept on this device ---------- */
const world = seed(NOW);
const log = new Log();
for (const e of world.entries) log.append(e.data);
const entries = world.entries;
const receipts = world.mine;
const heads = [];

(function buildHeads() {
  const r = rng(7);
  const first = Math.ceil(entries[0].at / HOUR) * HOUR;
  let i = 0, prev = 0, lastConfirmed = 0;
  for (let t = first; t <= NOW; t += HOUR) {
    while (i < entries.length && entries[i].at < t) i++;
    if (i === prev) continue;
    // confirmations come in order: a later root never reaches Bitcoin before an earlier one
    const age = NOW - t, delay = Math.max((1.5 + r() * 2.6) * HOUR, lastConfirmed - t + 60e3);
    lastConfirmed = t + delay;
    const head = { time: t, size: i, root: log.root(i), calendars: CALENDARS.map((name) => ({ name, state: 'ok', ms: Math.round(120 + r() * 380) })) };
    if (age < 12 * 60e3) head.state = 'submitted';
    else if (age < delay) head.state = 'calendar';
    else { head.state = 'bitcoin'; head.confirmed = t + delay; head.height = heightAt(NOW, t + delay); }
    heads.push(head);
    prev = i;
  }
  // edge cases: a calendar that timed out two hours ago (still waiting), and an older retry that has since confirmed
  const two = heads.findLast((x) => NOW - x.time > 1.8 * HOUR && NOW - x.time < 2.6 * HOUR);
  if (two) { two.state = 'retry'; delete two.height; delete two.confirmed; two.calendars[1] = { name: 'kalendar-2', state: 'timeout', ms: 30000 }; }
  const old = heads.findLast((x) => NOW - x.time > 30 * HOUR);
  if (old) old.calendars[1] = { name: 'kalendar-2', state: 'retried', ms: 30000 };
})();

// The newest receipts on this device: every other entry that is not yet in Bitcoin, so each waiting state shows up.
(function recentReceipts() {
  const firstOpen = heads.findIndex((x) => x.state !== 'bitcoin');
  const from = firstOpen > 0 ? heads[firstOpen - 1].size : entries.length - 6;
  const have = new Set(receipts.map((rc) => rc.index));
  let k = 0;
  for (let i = from; i < entries.length; i += 2) {
    if (have.has(i)) continue;
    const name = RECENT[k % RECENT.length], type = name.split('.').pop();
    receipts.push({ id: 'w' + i, index: i, name, type, size: 40e3 + (i * 7919) % 9e6, source: ['web', 'bot', 'cli'][k % 3], salted: false, tag: ['shartnoma', 'reliz', 'dalil'][k % 3], signer: null, upgraded: true, note: '' });
    entries[i].source = ['web', 'bot', 'cli'][k % 3];
    k++;
  }
  receipts.sort((a, b) => b.index - a.index);
})();

function headFor(index) {
  let lo = 0, hi = heads.length - 1, ans = null;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (heads[mid].size > index) { ans = heads[mid]; hi = mid - 1; } else lo = mid + 1; }
  return ans;
}
const knownRoots = () => new Map(heads.map((x) => [x.root, x]));
function receiptState(rc) {
  const hd = headFor(rc.index);
  if (!hd) return 'queued';
  if (hd.state === 'bitcoin' && !rc.upgraded) return 'upgrade';
  return hd.state;
}
const byId = (id) => receipts.find((x) => x.id === id);

const STATE = {
  bitcoin: ['ok', 'Bitcoinʼda', 'Jurnal ildizi Bitcoin bloki bilan tasdiqlangan'],
  upgrade: ['warn', 'Yangilash mumkin', 'Bitcoin tasdigʻi bor, lekin shu qurilmadagi .ots fayl hali eski: yangilang'],
  calendar: ['wait', 'Kalendarda', 'OpenTimestamps kalendarlari qabul qildi, Bitcoin bloki kutilmoqda (odatda 1–4 soat)'],
  retry: ['warn', 'Qayta yuborildi', 'Bitta kalendar javob bermadi; ildiz qayta yuborildi, qolgan ikkitasi qabul qilgan'],
  submitted: ['wait', 'Yuborildi', 'Ildiz kalendarlarga hozirgina yuborildi'],
  queued: ['muted', 'Navbatda', 'Yozuv jurnalda bor; uning ildizi keyingi soatlik paketda muhrlanadi'],
};
const badge = (kind, text, title) => h('span', { class: 'badge b-' + kind, title }, text);
const stateBadge = (st) => { const [k, t, d] = STATE[st]; return badge(k, t, d); };

/* ---------- receipts (.muhr.json v0 draft) ---------- */
function receiptJson(rc, overrides = {}) {
  const e = entries[rc.index];
  const hd = headFor(rc.index);
  const size = hd ? hd.size : log.size;
  const anchor = { type: 'opentimestamps', status: 'pending', calendars: CALENDARS.slice() };
  if (hd && hd.state === 'bitcoin' && rc.upgraded) Object.assign(anchor, { status: 'bitcoin', bitcoin: { height: hd.height, time: new Date(hd.confirmed).toISOString() } });
  anchor.ots = 'AE9wZW5UaW1lc3RhbXBz…(demo: .ots fayl qisqartirilgan)';
  const out = {
    muhr: '0-draft',
    hash: { alg: 'sha-256', value: e.data },
    ...(rc.salted ? { salted: true } : {}),
    ...(rc.salt ? { salt: rc.salt } : {}),
    log: { type: 'rfc9162', origin: LOG_ORIGIN, index: rc.index, tree_size: size, root: log.root(size), inclusion_proof: log.inclusion(rc.index, size) },
    anchors: [anchor],
    created: new Date(e.at).toISOString(),
  };
  return Object.assign(out, overrides);
}
const receiptText = (obj) => JSON.stringify(obj, null, 2);

/* Advance the simulated pipeline one step for the entry behind a receipt. */
function advance(rc) {
  let hd = headFor(rc.index);
  if (!hd) {
    hd = { time: Date.now(), size: log.size, root: log.root(), state: 'submitted', calendars: CALENDARS.map((name, i) => ({ name, state: 'ok', ms: 140 + i * 90 })) };
    heads.push(hd);
    return 'Soatlik ildiz yaratildi va 3 ta kalendarga yuborildi';
  }
  if (hd.state === 'submitted') { hd.state = 'calendar'; return 'Kalendarlar qabul qildi, Bitcoin bloki kutilmoqda'; }
  if (hd.state === 'calendar' || hd.state === 'retry') {
    hd.state = 'bitcoin'; hd.confirmed = Date.now(); hd.height = heightAt(NOW, Date.now()) + 1;
    hd.calendars = hd.calendars.map((c) => (c.state === 'timeout' ? { ...c, state: 'retried' } : c));
    rc.upgraded = true;
    return 'Bitcoin bloki #' + num(hd.height) + ' tasdiqladi, kvitansiya yangilandi';
  }
  if (!rc.upgraded) { rc.upgraded = true; return 'Kvitansiya yangilandi: .ots endi Bitcoin attestatsiyasini oʻz ichiga oladi'; }
  return 'Bu kvitansiya allaqachon yakunlangan';
}

/* ---------- layout ---------- */
const NAV = [
  ['/', 'Umumiy koʻrinish', 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z'],
  ['/stamp', 'Muhrlash', 'M12 3a5 5 0 0 1 3 9v2h3a2 2 0 0 1 2 2v2H4v-2a2 2 0 0 1 2-2h3v-2a5 5 0 0 1 3-9zM4 21h16'],
  ['/receipts', 'Kvitansiyalarim', 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7'],
  ['/verify', 'Tekshirish', 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5'],
  ['/log', 'Ochiq jurnal', 'M5 4h14v16H5zM9 8h6M9 12h6M9 16h4'],
  ['/integrations', 'Integratsiyalar', 'M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14'],
  ['/bot', 'Telegram bot', 'M21 4L3 11l6 2 2 6 3-4 5 4z'],
  ['/about', 'Konsept haqida', 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 11v6M12 7.5v.5'],
];
const icon = (d) => s('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', class: 'ic' }, s('path', { d }));
const sealMark = () => s('svg', { viewBox: '0 0 32 32', class: 'mark', 'aria-hidden': 'true' },
  s('circle', { cx: 16, cy: 16, r: 14, class: 'm1' }), s('circle', { cx: 16, cy: 16, r: 9.5, class: 'm2' }), s('path', { d: 'M11 17.5l3.2 3 6.3-7', class: 'm3' }));

function themeToggle() {
  const btn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Mavzuni almashtirish', title: 'Mavzuni almashtirish' },
    s('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', class: 'ic' }, s('path', { d: 'M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z' })));
  btn.addEventListener('click', () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('muhr-demo-theme', root.dataset.theme); } catch { /* private mode */ }
  });
  return btn;
}
try { const t = localStorage.getItem('muhr-demo-theme'); if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; } catch { /* private mode */ }

function shell(path, content) {
  const app = document.getElementById('app');
  const cur = '/' + (path.split('/')[1] || '');
  app.replaceChildren(
    h('header', { class: 'top' },
      h('a', { class: 'brand', href: '#/' }, sealMark(), 'Muhr'),
      h('span', { class: 'concept', title: 'Mahsulot hali chiqmagan: bu rejalashtirilgan interfeys' }, 'Konsept demo'),
      h('a', { class: 'top-link', href: 'https://muhr.wonmor.io/' }, 'Bosh sahifa'),
      themeToggle()),
    h('nav', { class: 'nav', 'aria-label': 'Boʻlimlar' }, NAV.map(([p, t, d]) => h('a', { href: '#' + p, class: p === cur ? 'on' : null, 'aria-current': p === cur ? 'page' : null }, icon(d), h('span', null, t)))),
    h('main', { id: 'main' }, content),
    h('div', { class: 'demo-pill', role: 'note' }, h('i'), 'Demo · namuna maʼlumotlar, qayta yuklanganda tiklanadi'));
  window.scrollTo(0, 0);
}
const pageHead = (title, sub, ...actions) => h('div', { class: 'page-head' }, h('div', null, h('h1', null, title), sub ? h('p', { class: 'sub' }, sub) : null), actions.length ? h('div', { class: 'actions' }, actions) : null);
const card = (title, ...kids) => h('section', { class: 'card' }, title ? h('h2', null, title) : null, kids);
const kpi = (label, value, foot, kind) => h('div', { class: 'kpi' + (kind ? ' k-' + kind : '') }, h('span', { class: 'kl' }, label), h('b', null, value), foot ? h('span', { class: 'kf' }, foot) : null);
const btn = (text, onclick, kind = '', attrs = {}) => h('button', { type: 'button', class: 'btn ' + kind, onclick, ...attrs }, text);
const dl = (rows) => h('dl', { class: 'kv' }, rows.filter(Boolean).map(([k, v]) => [h('dt', null, k), h('dd', null, v)]));
const hashText = (hex, cls = '') => h('code', { class: 'hash ' + cls, title: hex }, hex);

/* ---------- charts ---------- */
const SRC_KEYS = Object.keys(SOURCES);
function dailyChart(days = 30) {
  const start = new Date(NOW); start.setHours(0, 0, 0, 0);
  const t0 = start.getTime() - (days - 1) * DAY;
  const rows = Array.from({ length: days }, (_, i) => ({ t: t0 + i * DAY, c: Object.fromEntries(SRC_KEYS.map((k) => [k, 0])), n: 0 }));
  for (const e of entries) {
    const i = Math.floor((e.at - t0) / DAY);
    if (i >= 0 && i < days) { rows[i].c[e.source]++; rows[i].n++; }
  }
  const W = 760, H = 230, L = 30, B = 26, top = 10;
  const max = Math.max(4, ...rows.map((r) => r.n));
  const step = Math.ceil(max / 4);
  const ymax = step * 4;
  const bw = (W - L - 4) / days;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', 'aria-label': 'Soʻnggi 30 kunda kunlik muhrlar soni, manba boʻyicha' });
  for (let i = 0; i <= 4; i++) {
    const y = top + (H - top - B) * (1 - i / 4);
    svg.append(s('line', { x1: L, x2: W, y1: y, y2: y, class: 'grid' }), s('text', { x: L - 6, y: y + 4, class: 'axis', 'text-anchor': 'end' }, String(step * i)));
  }
  rows.forEach((r, i) => {
    let y = H - B;
    const x = L + i * bw + 2, w = bw - 4;
    const g = s('g', { class: 'bar' });
    for (const k of SRC_KEYS) {
      const hh = (H - top - B) * r.c[k] / ymax;
      if (hh <= 0) continue;
      y -= hh;
      g.append(s('rect', { x, y, width: w, height: hh, class: 'src-' + k }));
    }
    g.append(s('title', {}, `${fmtDay(r.t)}: ${r.n} ta muhr · ` + SRC_KEYS.filter((k) => r.c[k]).map((k) => SOURCES[k] + ' ' + r.c[k]).join(', ')));
    svg.append(g);
    if (i % 5 === 0 || i === days - 1) svg.append(s('text', { x: x + w / 2, y: H - 8, class: 'axis', 'text-anchor': 'middle' }, i === days - 1 ? 'bugun' : fmtDay(r.t)));
  });
  return h('figure', { class: 'chart-wrap' }, svg,
    h('figcaption', { class: 'legend' }, SRC_KEYS.map((k) => h('span', null, h('i', { class: 'sw src-' + k }), SOURCES[k]))),
    h('div', { class: 'shares' }, SRC_KEYS.map((k) => { const n = entries.filter((e) => e.source === k).length; return h('div', null, h('b', null, Math.round(100 * n / entries.length) + '%'), h('span', { class: 'sub' }, SOURCES[k] + ' · ' + num(n))); })));
}
function delayChart() {
  const done = heads.filter((x) => x.state === 'bitcoin' && x.confirmed && NOW - x.time < 14 * DAY);
  const days = 14, t0 = NOW - days * DAY;
  const pts = Array.from({ length: days }, (_, i) => {
    const xs = done.filter((x) => x.time >= t0 + i * DAY && x.time < t0 + (i + 1) * DAY);
    return xs.length ? xs.reduce((a, x) => a + (x.confirmed - x.time), 0) / xs.length / HOUR : null;
  });
  const W = 320, H = 90, max = 5;
  const P = pts.map((v, i) => (v == null ? null : [8 + i * (W - 16) / (days - 1), H - 12 - (H - 24) * v / max])).filter(Boolean);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'spark', role: 'img', 'aria-label': 'Bitcoin tasdigʻigacha oʻrtacha vaqt, 14 kun' });
  svg.append(s('line', { x1: 0, x2: W, y1: H - 12, y2: H - 12, class: 'grid' }));
  svg.append(s('path', { d: P.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' '), class: 'line' }));
  for (const p of P) svg.append(s('circle', { cx: p[0], cy: p[1], r: 2.6, class: 'dot' }));
  const avg = done.length ? done.reduce((a, x) => a + (x.confirmed - x.time), 0) / done.length : 0;
  return h('div', { class: 'spark-wrap' }, svg, h('p', { class: 'sub' }, 'Oʻrtacha: ', h('b', null, dur(avg)), ' · 14 kunda ', num(done.length), ' ta ildiz tasdiqlandi'));
}

/* ---------- pages ---------- */
function receiptRow(rc) {
  const e = entries[rc.index];
  return h('tr', { class: 'click', tabindex: '0', onclick: () => go('/receipts/' + rc.id), onkeydown: (ev) => { if (ev.key === 'Enter') go('/receipts/' + rc.id); } },
    h('td', null, h('div', { class: 'fname' }, h('span', { class: 'ext ext-' + rc.type }, rc.type), h('div', null, h('b', null, rc.name), h('span', { class: 'sub' }, rc.salted ? 'tuzli hash · ' : '', rc.tag, rc.signer ? ' · EIMZO imzoli' : '')))),
    h('td', { class: 'hide-sm' }, SOURCES[rc.source]),
    h('td', { class: 'mono hide-sm' }, '#' + String(rc.index)),
    h('td', null, stateBadge(receiptState(rc))),
    h('td', { class: 'sub nowrap' }, ago(e.at)));
}
function receiptTable(list) {
  return h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
    h('thead', null, h('tr', null, h('th', null, 'Fayl'), h('th', { class: 'hide-sm' }, 'Manba'), h('th', { class: 'hide-sm' }, 'Jurnal'), h('th', null, 'Holat'), h('th', null, 'Muhrlangan'))),
    h('tbody', null, list.map(receiptRow))));
}

function overview() {
  const last = heads[heads.length - 1];
  const confirmed = heads.findLast((x) => x.state === 'bitcoin');
  const today = entries.filter((e) => e.at >= new Date(NOW).setHours(0, 0, 0, 0)).length;
  const counts = {};
  for (const rc of receipts) { const st = receiptState(rc); counts[st] = (counts[st] || 0) + 1; }
  const pipe = heads.slice(-12);
  return [
    pageHead('Umumiy koʻrinish', `Ochiq jurnal ${LOG_ORIGIN} · oxirgi ildiz ${ago(last.time)}`, btn('Fayl muhrlash', () => go('/stamp'), 'primary'), btn('Kvitansiyani tekshirish', () => go('/verify'))),
    h('div', { class: 'kpis' },
      kpi('Jurnaldagi yozuvlar', num(log.size), '+' + today + ' bugun · 60 kunda'),
      kpi('Bitcoin bilan tasdiqlangan', num(confirmed.size), (Math.floor(1000 * confirmed.size / log.size) / 10).toFixed(1).replace('.', ',') + '% · blok #' + num(confirmed.height), 'ok'),
      kpi('Tasdiq kutilmoqda', num(log.size - confirmed.size), 'kalendarda yoki navbatda', 'wait'),
      kpi('Kvitansiyalarim', num(receipts.length), (counts.upgrade || 0) + ' tasi yangilanishi mumkin', 'warn')),
    h('div', { class: 'grid-2' },
      card('Kunlik muhrlar', h('p', { class: 'sub' }, 'Soʻnggi 30 kun, manba boʻyicha. Faqat hashlar: jurnal fayl nomini ham, mazmunini ham bilmaydi.'), dailyChart()),
      h('div', { class: 'stack' },
        card('Oxirgi jurnal ildizi (STH)',
          dl([['Vaqt', fmtDate(last.time)], ['Daraxt hajmi', num(last.size) + ' ta yozuv'], ['Ildiz', hashText(last.root, 'clip')], ['Holat', stateBadge(last.state)]]),
          h('div', { class: 'row-actions' }, link('/log', 'Barcha ildizlar'), link('/log/consistency', 'Barqarorlik isboti'))),
        card('Bitcoin tasdigʻigacha', delayChart()))),
    h('div', { class: 'grid-2' },
      card('Muhrlash konveyeri', h('p', { class: 'sub' }, 'Har soatda jurnal ildizi 3 ta ochiq OpenTimestamps kalendariga yuboriladi, bir necha soatdan keyin Bitcoin blokiga tushadi.'),
        h('ol', { class: 'pipe' }, pipe.map((x) => h('li', { class: 'p-' + STATE[x.state][0], title: STATE[x.state][2] },
          h('span', { class: 'mono' }, pad(new Date(x.time).getHours()) + ':00'), h('b', null, '+' + (x.size - (heads[heads.indexOf(x) - 1]?.size || 0))), h('span', { class: 'sub' }, STATE[x.state][1]))))),
      card('Kalendarlar holati', h('table', { class: 'tbl compact' },
        h('thead', null, h('tr', null, h('th', null, 'Kalendar'), h('th', null, '30 kun'), h('th', null, 'Javob'), h('th', null, 'Holat'))),
        h('tbody', null, CALENDARS.map((name, i) => h('tr', null, h('td', { class: 'mono' }, name), h('td', null, ['100%', '98,7%', '99,9%'][i]), h('td', { class: 'mono' }, [212, 30000, 348][i] === 30000 ? '—' : [212, 30000, 348][i] + ' ms'),
          h('td', null, i === 1 ? badge('warn', 'Javob bermadi', '2 soat oldin vaqt tugadi, ildiz qayta yuborildi') : badge('ok', 'Ishlayapti')))))),
      h('p', { class: 'sub' }, 'Ochiq kalendarlar; Muhr oʻz kalendarini yuritmaydi. Ikkitasi ishlasa ham isbot olinadi.'))),
    card('Soʻnggi kvitansiyalar', receiptTable(receipts.slice(0, 8)), h('div', { class: 'row-actions' }, link('/receipts', 'Hammasi (' + receipts.length + ')'))),
  ];
}

/* --- stamp --- */
const draft = { mode: 'file', text: '', file: null, bytes: null, salted: false, salt: null, hash: '', tag: 'shartnoma', result: null };
function stamp() {
  const out = h('div', { class: 'stack' });
  const hashBox = h('div', { class: 'hashbox', 'aria-live': 'polite' });
  const fileInfo = h('p', { class: 'sub' }, 'Fayl tanlanmagan');
  const textArea = h('textarea', { rows: 6, placeholder: 'Matnni shu yerga yozing yoki qoʻying…', 'aria-label': 'Muhrlanadigan matn' });
  textArea.value = draft.text;
  const fileInput = h('input', { type: 'file', id: 'stamp-file', class: 'sr-only' });
  const saltBox = h('input', { type: 'checkbox', id: 'salted' }); saltBox.checked = draft.salted;
  const tagSel = h('select', { id: 'tag', 'aria-label': 'Teg' }, ['shartnoma', 'reliz', 'maqola', 'dalil', 'hisobot', 'dizayn', 'ilmiy', 'tender'].map((t) => h('option', { value: t }, t)));
  tagSel.value = draft.tag;
  const submit = btn('Jurnalga qoʻshish', null, 'primary', { id: 'stamp-go', disabled: true });

  async function rehash() {
    const data = draft.mode === 'file' ? draft.bytes : (draft.text ? bytesOf(draft.text) : null);
    if (!data) { draft.hash = ''; render(); return; }
    if (draft.salted && !draft.salt) draft.salt = randHex(Math.random, 16);
    const input = draft.salted ? withSalt(hexBytes(draft.salt), data) : data;
    draft.hash = await C.sha256(input);
    render();
  }
  function render() {
    const prev = hashBox.dataset.h || '';
    hashBox.replaceChildren();
    if (!draft.hash) hashBox.append(h('span', { class: 'sub' }, 'Hash shu yerda paydo boʻladi: 64 ta oʻn oltilik raqam'));
    else {
      const ch = C.changedDigits(prev, draft.hash);
      hashBox.append(h('span', { class: 'kl' }, 'SHA-256' + (draft.salted ? ' (tuzli)' : '')), h('code', { class: 'digits', id: 'stamp-hash' }, [...draft.hash].map((c, i) => h('span', { class: ch[i] ? 'flip' : null }, c))));
      if (draft.salted) hashBox.append(h('p', { class: 'sub' }, 'Tuz: ', h('code', null, draft.salt), ' · faqat sizning kvitansiyangizda saqlanadi'));
      const dup = entries.findIndex((e) => e.data === draft.hash);
      const mineNow = draft.result && byId(draft.result);
      if (dup >= 0 && mineNow && mineNow.index === dup) hashBox.append(h('p', { class: 'note' }, `Qoʻshildi: jurnal #${dup}. Matn yoki faylni oʻzgartirsangiz, yangi hash chiqadi.`));
      else if (dup >= 0) hashBox.append(h('p', { class: 'note warn' }, `Bu hash jurnalda allaqachon bor: #${(dup)}, ${fmtDate(entries[dup].at)}. Qayta qoʻshish shart emas, eski kvitansiya ham yaroqli.`));
    }
    hashBox.dataset.h = draft.hash;
    submit.disabled = !draft.hash || entries.some((e) => e.data === draft.hash);
    fileInfo.textContent = draft.file ? `${draft.file.name} · ${C.sizeLabel(draft.file.size)} · faqat shu brauzerda oʻqildi` : 'Fayl tanlanmagan';
  }
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files[0];
    if (!f) return;
    if (f.size > 512 * 1048576) { toast('Demo 512 MB gacha boʻlgan fayllarni oʻqiydi'); return; }
    draft.file = { name: f.name, size: f.size, type: (f.name.split('.').pop() || 'bin').toLowerCase().slice(0, 5) };
    fileInfo.textContent = C.STRINGS.uz.reading;
    draft.bytes = new Uint8Array(await f.arrayBuffer());
    rehash();
  });
  textArea.addEventListener('input', () => { draft.text = textArea.value; rehash(); });
  saltBox.addEventListener('change', () => { draft.salted = saltBox.checked; draft.salt = null; rehash(); });
  tagSel.addEventListener('change', () => { draft.tag = tagSel.value; });
  const drop = h('label', { class: 'drop', for: 'stamp-file' }, icon('M12 16V4M7 9l5-5 5 5M4 16v4h16v-4'), h('b', null, 'Faylni tanlang'), h('span', { class: 'sub' }, 'yoki shu yerga tashlang · PDF, .p7s, reliz, rasm, istalgan fayl'), fileInput);
  drop.addEventListener('dragover', (ev) => { ev.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (ev) => { ev.preventDefault(); drop.classList.remove('over'); if (ev.dataTransfer.files[0]) { const dt = new DataTransfer(); dt.items.add(ev.dataTransfer.files[0]); fileInput.files = dt.files; fileInput.dispatchEvent(new Event('change')); } });

  const tabs = h('div', { class: 'tabs', role: 'tablist' },
    ['file', 'text'].map((m) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(draft.mode === m), class: draft.mode === m ? 'on' : null, id: 'tab-' + m,
      onclick: () => { draft.mode = m; draft.hash = ''; refresh(); rehash(); } }, m === 'file' ? 'Fayl' : 'Matn')));
  const sample = btn('Namuna matnni qoʻyish', () => { draft.mode = 'text'; draft.text = SAMPLES.contract.text; refresh(); textArea.value = draft.text; rehash(); }, 'ghost', { id: 'stamp-sample' });

  submit.addEventListener('click', () => {
    const index = log.append(draft.hash);
    entries.push({ index, at: Date.now(), data: draft.hash, source: 'web' });
    const name = draft.mode === 'file' ? draft.file.name : 'matn-' + new Date().toISOString().slice(0, 10) + '.txt';
    const rc = { id: 'n' + index, index, name, type: draft.mode === 'file' ? draft.file.type : 'txt', size: draft.mode === 'file' ? draft.file.size : bytesOf(draft.text).length,
      source: 'web', salted: draft.salted, salt: draft.salted ? draft.salt : undefined, tag: draft.tag, signer: null, upgraded: true, note: 'Shu sessiyada yaratildi' };
    receipts.unshift(rc);
    draft.result = rc.id;
    toast('Jurnalga qoʻshildi: #' + num(index));
    refresh();
  });

  function resultCard() {
    const rc = draft.result && byId(draft.result);
    if (!rc) {
      return card('Keyin nima boʻladi', h('ol', { class: 'steps-plain' },
        h('li', null, h('b', null, 'Hash shu brauzerda hisoblanadi. '), 'Fayl va matn hech qayerga yuborilmaydi.'),
        h('li', null, h('b', null, 'Faqat 32 baytli hash jurnalga qoʻshiladi. '), 'Siz darhol RFC 9162 inclusion proof olasiz.'),
        h('li', null, h('b', null, 'Har soatda jurnal ildizi '), '3 ta ochiq OpenTimestamps kalendariga yuboriladi.'),
        h('li', null, h('b', null, 'Bir necha soatdan keyin '), 'ildiz Bitcoin blokiga tushadi; kvitansiyani yangilaysiz.'),
        h('li', null, h('b', null, 'Istalgan odam tekshiradi: '), 'fayl + .muhr.json + Bitcoin blok sarlavhalari. Bizning serverimiz kerak emas.')),
      h('p', { class: 'note' }, 'Isbot faylning shu vaqtdan kechikmay mavjud boʻlganini koʻrsatadi. Muallifni, mazmunning toʻgʻriligini yoki notarial sanani isbotlamaydi.'));
    }
    const json = receiptText(receiptJson(rc));
    const st = receiptState(rc);
    return card('Kvitansiya tayyor',
      h('div', { class: 'result-head' }, stateBadge(st), h('span', { class: 'mono' }, '#' + String(rc.index)), h('span', { class: 'sub' }, STATE[st][2])),
      h('pre', { class: 'code', id: 'stamp-receipt' }, json),
      h('div', { class: 'row-actions' },
        btn('.muhr.json yuklab olish', () => download(rc.name + '.muhr.json', json), 'primary'),
        btn('Keyingi bosqich (simulyatsiya)', () => { toast(advance(rc)); refresh(); }, '', { id: 'stamp-advance', disabled: st === 'bitcoin' }),
        btn('Kvitansiyani ochish', () => go('/receipts/' + rc.id), 'ghost')));
  }
  function refresh() {
    out.replaceChildren(
      pageHead('Faylni muhrlash', 'Fayl yoki matnning SHA-256 hashi ochiq jurnalga yoziladi va Bitcoin vaqti bilan bogʻlanadi.'),
      h('div', { class: 'grid-2 even' },
        card(null, tabs, draft.mode === 'file' ? h('div', { class: 'stack' }, drop, fileInfo) : h('div', { class: 'stack' }, textArea, sample),
          h('div', { class: 'opts' }, h('label', { class: 'check' }, saltBox, h('span', null, h('b', null, 'Tuzli hash. '), 'Qisqa maxfiy matn (parol, gʻoya) uchun: hashni taxmin qilib boʻlmaydi.')),
            h('label', { class: 'field' }, h('span', null, 'Teg'), tagSel)),
          hashBox, h('div', { class: 'row-actions' }, submit, h('span', { class: 'sub' }, 'Serverga faqat hash ketadi'))),
        resultCard()));
    tabs.querySelectorAll('button').forEach((b) => { const on = b.id === 'tab-' + draft.mode; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    render();
  }
  refresh();
  return out;
}

/* --- receipts list --- */
const listState = { filter: 'all', q: '', sort: 'new' };
const FILTERS = [['all', 'Hammasi'], ['bitcoin', 'Bitcoinʼda'], ['upgrade', 'Yangilash mumkin'], ['calendar', 'Kalendarda'], ['retry', 'Qayta yuborildi'], ['queued', 'Navbatda']];
function receiptsPage() {
  const out = h('div', { class: 'stack' });
  const search = h('input', { type: 'search', placeholder: 'Fayl nomi, teg yoki hash…', 'aria-label': 'Qidirish', id: 'rc-search', value: listState.q });
  const sort = h('select', { 'aria-label': 'Tartib', id: 'rc-sort' }, h('option', { value: 'new' }, 'Avval yangilari'), h('option', { value: 'old' }, 'Avval eskilari'), h('option', { value: 'size' }, 'Hajm boʻyicha'));
  sort.value = listState.sort;
  const body = h('div');
  function draw() {
    const counts = { all: receipts.length };
    for (const rc of receipts) { const st = receiptState(rc); counts[st] = (counts[st] || 0) + 1; }
    const q = listState.q.trim().toLowerCase();
    let list = receipts.filter((rc) => (listState.filter === 'all' || receiptState(rc) === listState.filter) &&
      (!q || rc.name.toLowerCase().includes(q) || rc.tag.includes(q) || entries[rc.index].data.startsWith(q)));
    if (listState.sort === 'old') list = list.slice().reverse();
    if (listState.sort === 'size') list = list.slice().sort((a, b) => b.size - a.size);
    const upg = receipts.filter((rc) => receiptState(rc) === 'upgrade');
    body.replaceChildren(
      h('div', { class: 'chips', role: 'group', 'aria-label': 'Holat boʻyicha' }, FILTERS.map(([k, t]) => h('button', { type: 'button', class: 'fchip' + (listState.filter === k ? ' on' : ''), 'aria-pressed': String(listState.filter === k),
        onclick: () => { listState.filter = k; draw(); } }, t, h('span', null, String(counts[k] || 0))))),
      upg.length ? h('div', { class: 'banner' }, h('span', null, h('b', null, upg.length + ' ta kvitansiya '), 'Bitcoin tasdigʻini oldi, lekin shu qurilmadagi nusxasi hali eski.'),
        btn('Hammasini yangilash', () => { upg.forEach((rc) => { rc.upgraded = true; }); toast(upg.length + ' ta kvitansiya yangilandi'); draw(); }, 'primary', { id: 'upgrade-all' })) : null,
      list.length ? receiptTable(list) : h('div', { class: 'empty' }, h('b', null, 'Hech narsa topilmadi'), h('p', { class: 'sub' }, 'Bu filtrda kvitansiya yoʻq. Filtrni tozalang yoki yangi fayl muhrlang.'),
        btn('Filtrni tozalash', () => { listState.filter = 'all'; listState.q = ''; search.value = ''; draw(); })),
      h('p', { class: 'sub' }, 'Kvitansiyalar shu qurilmada saqlanadi. Roʻyxatdan oʻchirish jurnaldagi yozuvni oʻchirmaydi: jurnal faqat qoʻshiladi (append-only).'));
  }
  search.addEventListener('input', () => { listState.q = search.value; draw(); });
  sort.addEventListener('change', () => { listState.sort = sort.value; draw(); });
  out.append(pageHead('Kvitansiyalarim', receipts.length + ' ta .muhr.json shu qurilmada', btn('Fayl muhrlash', () => go('/stamp'), 'primary')),
    h('div', { class: 'toolbar' }, search, sort), body);
  draw();
  return out;
}

/* --- receipt detail --- */
function proofView(rc) {
  const hd = headFor(rc.index);
  const size = hd ? hd.size : log.size;
  const path = log.inclusion(rc.index, size);
  const leaf = leafHash(entries[rc.index].data);
  const root = rootFromInclusion(rc.index, size, leaf, path);
  // which side each sibling is on, for the drawing
  const sides = []; let fn = rc.index, sn = size - 1;
  for (let i = 0; i < path.length; i++) {
    if ((fn & 1) === 1 || fn === sn) { sides.push('chap'); if ((fn & 1) === 0) while ((fn & 1) === 0 && fn !== 0) { fn >>= 1; sn >>= 1; } } else sides.push('oʻng');
    fn >>= 1; sn >>= 1;
  }
  return h('div', { class: 'proof' },
    h('ol', { class: 'path' },
      h('li', { class: 'leaf' }, h('span', { class: 'lv' }, 'barg'), h('code', null, short(leaf, 16)), h('span', { class: 'sub' }, 'SHA-256(0x00 ‖ hash)')),
      path.map((p, i) => h('li', null, h('span', { class: 'lv' }, (i + 1) + '-daraja'), h('code', null, short(p, 16)), h('span', { class: 'sub' }, 'qoʻshni tugun, ' + sides[i] + ' tomonda'))),
      h('li', { class: 'root' + (root === log.root(size) ? ' ok' : ' bad') }, h('span', { class: 'lv' }, 'ildiz'), h('code', null, short(root || '', 16)), h('span', { class: 'sub' }, root === log.root(size) ? 'tree head bilan mos, hajm ' + num(size) : 'mos emas'))),
    h('p', { class: 'sub' }, path.length + ' ta qoʻshni hash ', num(size), ' yozuvli jurnalda shu bitta yozuvni isbotlaydi (log₂ n). Hisob hozir shu brauzerda bajarildi.'));
}
function timeline(rc) {
  const e = entries[rc.index], hd = headFor(rc.index);
  const items = [[e.at - 1500, 'Hash ' + SOURCES[rc.source].toLowerCase() + ' orqali hisoblandi', 'ok'], [e.at, 'Jurnalga qoʻshildi: #' + num(rc.index), 'ok']];
  if (hd) {
    items.push([hd.time, 'Soatlik ildiz (hajm ' + num(hd.size) + ') kalendarlarga yuborildi', 'ok']);
    if (hd.calendars.some((c) => c.state !== 'ok')) items.push([hd.time + 31e3, 'kalendar-2 javob bermadi, qayta yuborildi', 'warn']);
    if (hd.state === 'bitcoin') items.push([hd.confirmed, 'Bitcoin bloki #' + num(hd.height) + ' ildizni tasdiqladi', 'ok']);
    else items.push([Date.now(), 'Bitcoin tasdigʻi kutilmoqda', 'wait']);
    if (hd.state === 'bitcoin') items.push([rc.upgraded ? hd.confirmed + 40 * 60e3 : Date.now(), rc.upgraded ? 'Kvitansiya yangilandi (.ots toʻliq)' : 'Kvitansiyani yangilash mumkin', rc.upgraded ? 'ok' : 'warn']);
  } else items.push([Date.now(), 'Keyingi soatlik ildiz kutilmoqda', 'wait']);
  return h('ol', { class: 'timeline' }, items.map(([t, text, k]) => h('li', { class: 't-' + k }, h('span', { class: 'sub' }, fmtDate(t)), h('span', null, text))));
}
function receiptDetail(id) {
  const rc = byId(id);
  if (!rc) return notFound('Bunday kvitansiya topilmadi', 'U oʻchirilgan boʻlishi mumkin: kvitansiyalar faqat shu sessiya xotirasida.');
  const e = entries[rc.index], hd = headFor(rc.index), st = receiptState(rc);
  const json = () => receiptText(receiptJson(rc));
  const rerender = () => route();
  const dlg = h('dialog', { class: 'dialog', id: 'del-dialog' },
    h('h2', null, 'Roʻyxatdan olib tashlansinmi?'),
    h('p', null, 'Kvitansiya faqat shu qurilmadagi roʻyxatdan oʻchadi. Jurnaldagi #' + num(rc.index) + ' yozuv qoladi: jurnal append-only, uni hech kim, hatto biz ham, oʻchira olmaymiz.'),
    h('p', { class: 'note warn' }, '.muhr.json faylini yuklab olmagan boʻlsangiz, isbotni keyin faqat fayl hashi orqali jurnaldan topasiz.'),
    h('div', { class: 'row-actions' }, btn('Bekor qilish', () => dlg.close()), btn('Olib tashlash', () => { receipts.splice(receipts.indexOf(rc), 1); dlg.close(); Object.assign(listState, { filter: 'all', q: '' }); toast('Roʻyxatdan olib tashlandi'); go('/receipts'); }, 'danger', { id: 'del-confirm' })));
  return [
    pageHead(rc.name, `#${(rc.index)} · ${SOURCES[rc.source]} · ${fmtDate(e.at)}`,
      btn('.muhr.json', () => download(rc.name + '.muhr.json', json()), 'primary'),
      st === 'upgrade' ? btn('Yangilash', () => { rc.upgraded = true; toast('Kvitansiya yangilandi'); rerender(); }, '', { id: 'rc-upgrade' }) : null,
      st !== 'bitcoin' ? btn('Keyingi bosqich (simulyatsiya)', () => { toast(advance(rc)); rerender(); }, '', { id: 'rc-advance' }) : null,
      btn('Tekshirish', () => { verifyState.preset = { hash: e.data, receipt: json(), label: rc.name }; go('/verify'); }),
      btn('Olib tashlash', () => dlg.showModal(), 'ghost danger-text', { id: 'rc-delete' })),
    h('div', { class: 'grid-2' },
      h('div', { class: 'stack' },
        card('Fayl', dl([['Holat', h('span', null, stateBadge(st), ' ', h('span', { class: 'sub' }, STATE[st][2]))], ['Nomi', rc.name + ' (faqat shu qurilmada)'], ['Hajmi', C.sizeLabel(rc.size)], ['Teg', rc.tag],
          ['SHA-256' + (rc.salted ? ' (tuzli)' : ''), h('span', { class: 'hash-row' }, hashText(e.data), btn('Nusxa', () => copy(e.data, 'Hash nusxalandi'), 'ghost tiny'))],
          rc.salted ? ['Tuz', rc.salt ? hashText(rc.salt) : h('span', { class: 'sub' }, 'faqat asl kvitansiyada saqlanadi')] : null,
          rc.note ? ['Izoh', rc.note] : null])),
        rc.signer ? card('EIMZO imzosi (faqat koʻrsatiladi)', h('p', { class: 'note warn' }, 'Kriptografik tekshirilmadi. MVP imzoni faqat koʻrsatadi; imzo kimligini aytadi, Muhr esa qachonligini qoʻshadi.'),
          dl([['Imzochi', rc.signer[0] + ' (toʻqima)'], ['Tashkilot', rc.signer[1]], ['Sertifikat seriyasi', h('code', null, e.data.slice(0, 8).toUpperCase())], ['Imzo vaqti (fayl ichida)', fmtDate(e.at - 3 * HOUR) + ', isbot emas'], ['Format', 'PKCS#7 / CMS (.p7s)']])) : null,
        card('Inclusion proof (RFC 9162)', proofView(rc)),
        card('Nimani isbotlaydi', h('div', { class: 'proves' },
          h('div', { class: 'yes' }, h('b', null, 'Isbotlaydi'), h('ul', null, h('li', null, 'shu baytlar ', hd && hd.state === 'bitcoin' ? fmtDate(hd.confirmed) : 'Bitcoin tasdigʻidan', ' dan kechikmay mavjud boʻlgan'), h('li', null, 'fayl oʻshandan beri oʻzgarmagan'), h('li', null, 'jurnal yozuvni keyin oʻchirmagan'))),
          h('div', { class: 'no' }, h('b', null, 'Isbotlamaydi'), h('ul', null, h('li', null, 'faylni kim yozgan yoki imzolagan'), h('li', null, 'mazmun toʻgʻriligini'), h('li', null, 'notarial yoki RFC 3161 rasmiy sanani'))))))
      ,
      h('div', { class: 'stack' },
        card('Jurnal va ildiz', dl([['Jurnal', h('code', null, LOG_ORIGIN)], ['Indeks', '#' + String(rc.index)], ['Tree head', hd ? num(hd.size) + ' ta yozuv, ' + fmtDate(hd.time) : 'keyingi soatlik ildiz'],
          ['Ildiz', hashText(hd ? hd.root : log.root(), 'clip')]])),
        card('OpenTimestamps', hd ? h('table', { class: 'tbl compact' }, h('thead', null, h('tr', null, h('th', null, 'Kalendar'), h('th', null, 'Javob'), h('th', null, 'Holat'))),
          h('tbody', null, hd.calendars.map((c) => h('tr', null, h('td', { class: 'mono' }, c.name), h('td', { class: 'mono' }, c.state === 'ok' ? c.ms + ' ms' : '30 s'),
            h('td', null, c.state === 'ok' ? badge('ok', 'Qabul qildi') : c.state === 'retried' ? badge('ok', 'Qayta: qabul qildi') : badge('warn', 'Vaqt tugadi')))))) : h('p', { class: 'sub' }, 'Hali yuborilmagan: ildiz keyingi soat boshida yuboriladi.'),
          hd && hd.state === 'bitcoin' ? dl([['Bitcoin bloki', '#' + String(hd.height) + ' (namuna raqam)'], ['Blok vaqti', fmtDate(hd.confirmed)], ['Kechikish', dur(hd.confirmed - hd.time)]]) : null),
        card('Tarix', timeline(rc)),
        card('.muhr.json', h('pre', { class: 'code small' }, json())))),
    dlg,
  ];
}

/* --- verify --- */
const verifyState = { preset: null };
function sampleCases() {
  const smp = byId('r-contract'), sal = byId('r-salted');
  const good = receiptText(receiptJson(smp));
  const badPath = receiptJson(smp); badPath.log.inclusion_proof[2] = badPath.log.inclusion_proof[2].replace(/^./, (c) => (c === 'a' ? 'b' : 'a'));
  // a forged log: the same file hash, but in a tree that the real log never published
  const fake = new Log(); const fr = rng(99); for (let i = 0; i < 37; i++) fake.append(i === 21 ? entries[smp.index].data : randHex(fr));
  const unknown = receiptJson(smp, {}); unknown.log = { ...unknown.log, index: 21, tree_size: 37, root: fake.root(), inclusion_proof: fake.inclusion(21, 37) };
  const pend = receipts.find((rc) => receiptState(rc) === 'calendar') || receipts.find((rc) => ['retry', 'queued', 'submitted'].includes(receiptState(rc)));
  return [
    ['good', 'Toʻgʻri isbot', { text: SAMPLES.contract.text, receipt: good }],
    ['tampered', 'Oʻzgargan fayl', { text: SAMPLES.contract.text.replace('6 500 000', '9 500 000'), receipt: good }],
    ['badpath', 'Buzilgan isbot yoʻli', { text: SAMPLES.contract.text, receipt: receiptText(badPath) }],
    ['unknown', 'Notanish jurnal ildizi', { text: SAMPLES.contract.text, receipt: receiptText(unknown) }],
    ['pending', 'Hali Bitcoinʼda emas', { hash: entries[pend.index].data, receipt: receiptText(receiptJson(pend)) }],
    ['salted', 'Tuzli isbot', { text: SAMPLES.salted.text, receipt: receiptText(receiptJson(sal)) }],
  ];
}
async function runVerify(input) {
  const t0 = performance.now();
  const steps = [];
  let rec;
  try { rec = JSON.parse(input.receipt); } catch { return { steps: [['Kvitansiya', 'JSON oʻqib boʻlmadi', 'bad']], verdict: ['bad', 'Kvitansiya buzilgan', 'Fayl .muhr.json formatida emas.'], ms: 0 }; }
  if (!rec || rec.muhr == null || !rec.hash || !rec.log) return { steps: [['Kvitansiya', 'muhr, hash va log maydonlari kerak', 'bad']], verdict: ['bad', 'Kvitansiya buzilgan', 'Bu .muhr.json emas.'], ms: 0 };
  const fileHash = input.bytes ? await C.sha256(rec.salt ? withSalt(hexBytes(rec.salt), input.bytes) : input.bytes) : C.normalizeHash(input.hash || '');
  const want = C.normalizeHash(rec.hash.value);
  const hashOk = C.isHash(fileHash) && fileHash === want;
  steps.push(['Fayl hashi', hashOk ? 'kvitansiyadagi hash bilan mos' + (rec.salt ? ' (tuz bilan)' : '') : (C.isHash(fileHash) ? 'mos emas: fayl boshqa yoki oʻzgargan' : 'fayl yoki 64 belgili hash kerak'), hashOk ? 'ok' : 'bad']);
  const L = rec.log;
  const root = hashOk ? rootFromInclusion(L.index, L.tree_size, leafHash(want), L.inclusion_proof || []) : null;
  const pathOk = !!root && root === L.root;
  steps.push(['Inclusion proof', !hashOk ? 'oʻtkazib yuborildi' : pathOk ? `${(L.inclusion_proof || []).length} qadamda ildiz qayta hisoblandi va mos keldi` : 'qayta hisoblangan ildiz kvitansiyadagidan farq qiladi', !hashOk ? 'skip' : pathOk ? 'ok' : 'bad']);
  // signed tree heads the verifier has cached: the hourly heads, plus the latest head the log serves right now
  const known = knownRoots().get(L.root) || (L.tree_size === log.size && L.root === log.root() ? { size: log.size, time: Date.now(), state: 'queued' } : null);
  const logOk = pathOk && !!known && known.size === L.tree_size;
  steps.push(['Jurnal ildizi', !pathOk ? 'oʻtkazib yuborildi' : logOk ? `${L.origin} eʼlon qilgan tree head (hajm ${num(L.tree_size)}) keshda bor` : 'bu ildizni jurnal hech qachon eʼlon qilmagan: soxta yoki boshqa jurnal', !pathOk ? 'skip' : logOk ? 'ok' : 'bad']);
  const an = (rec.anchors || []).find((a) => a.type === 'opentimestamps');
  let anchorSt = 'skip', anchorText = 'oʻtkazib yuborildi';
  if (logOk) {
    if (an && an.status === 'bitcoin' && an.bitcoin && known.state === 'bitcoin' && an.bitcoin.height === known.height) { anchorSt = 'ok'; anchorText = `Bitcoin bloki #${(an.bitcoin.height)} sarlavhasi bilan mos (simulyatsiya: keshlangan sarlavha)`; }
    else if (an && an.status === 'bitcoin') { anchorSt = 'bad'; anchorText = 'Bitcoin attestatsiyasi keshdagi blok sarlavhasiga mos emas'; }
    else { anchorSt = 'wait'; anchorText = known.state === 'bitcoin' ? 'jurnalda tasdiq bor: kvitansiyani yangilang' : 'Bitcoin tasdigʻi hali yoʻq, kvitansiyani keyinroq yangilang'; }
  }
  steps.push(['Bitcoin vaqti', anchorText, anchorSt]);
  const ms = (performance.now() - t0).toFixed(1);
  let verdict;
  if (!hashOk) verdict = ['bad', 'Mos kelmaydi', 'Bu fayl kvitansiyadagi fayl emas yoki u muhrlangandan keyin oʻzgargan.'];
  else if (!pathOk) verdict = ['bad', 'Isbot buzilgan', 'Kvitansiyadagi isbot yoʻli ildizga olib bormaydi. Kimdir uni tahrirlagan.'];
  else if (!logOk) verdict = ['bad', 'Notanish jurnal', 'Isbot oʻz-oʻzidan toʻgʻri, lekin bunday ildizni ochiq jurnal eʼlon qilmagan. Soxta jurnalga ishonmang.'];
  else if (anchorSt === 'ok') verdict = ['ok', 'Isbot toʻgʻri', `Fayl ${fmtDate(known.confirmed)} dan kechikmay mavjud boʻlgan va oʻshandan beri oʻzgarmagan.`];
  else if (anchorSt === 'wait') verdict = ['wait', 'Jurnalda bor, Bitcoin kutilmoqda', `Fayl ${fmtDate(known.time)} dagi jurnal ildizida bor. Bitcoin tasdigʻi kelgach isbot toʻliq boʻladi.`];
  else verdict = ['bad', 'Attestatsiya mos emas', 'Bitcoin qismi keshdagi blok sarlavhasiga mos kelmadi.'];
  return { steps, verdict, ms };
}
function verifyPage() {
  const res = h('div', { class: 'stack', id: 'verify-result', 'aria-live': 'polite' });
  const hashIn = h('input', { type: 'text', id: 'v-hash', placeholder: 'yoki SHA-256 hashni qoʻying (64 belgi)', 'aria-label': 'SHA-256 hash', spellcheck: 'false' });
  const recIn = h('textarea', { id: 'v-receipt', rows: 12, spellcheck: 'false', 'aria-label': '.muhr.json kvitansiya', placeholder: '{ "muhr": "0-draft", … }' });
  const fileIn = h('input', { type: 'file', id: 'v-file', class: 'sr-only' });
  const recFile = h('input', { type: 'file', id: 'v-rfile', class: 'sr-only', accept: '.json,application/json' });
  const fileLabel = h('span', { class: 'sub', id: 'v-file-name' }, 'Fayl tanlanmagan');
  let bytes = null;
  fileIn.addEventListener('change', async () => { const f = fileIn.files[0]; if (!f) return; bytes = new Uint8Array(await f.arrayBuffer()); fileLabel.textContent = f.name + ' · ' + C.sizeLabel(f.size); hashIn.value = ''; });
  recFile.addEventListener('change', async () => { const f = recFile.files[0]; if (f) recIn.value = await f.text(); });
  hashIn.addEventListener('input', () => { if (hashIn.value) { bytes = null; fileLabel.textContent = 'Fayl oʻrniga hash ishlatiladi'; } });
  async function check() {
    const r = await runVerify({ bytes, hash: hashIn.value, receipt: recIn.value });
    res.replaceChildren(
      h('div', { class: 'verdict v-' + r.verdict[0] }, h('b', null, r.verdict[1]), h('span', null, r.verdict[2])),
      h('ol', { class: 'vsteps' }, r.steps.map(([t, d, k]) => h('li', { 'data-s': k }, h('i'), h('div', null, h('b', null, t), h('span', { class: 'sub' }, d))))),
      h('p', { class: 'sub' }, 'Tekshiruv ' + r.ms + ' ms · tarmoq ishlatilmadi · faqat shu brauzerda'));
  }
  const chips = h('div', { class: 'chips' }, sampleCases().map(([key, label, c]) => h('button', { type: 'button', class: 'fchip', 'data-case': key, onclick: () => {
    bytes = c.text ? bytesOf(c.text) : null; hashIn.value = c.hash || ''; recIn.value = c.receipt;
    fileLabel.textContent = c.text ? 'Namuna fayl: ' + (key === 'salted' ? SAMPLES.salted.name : SAMPLES.contract.name) + (key === 'tampered' ? ' (bitta raqam oʻzgartirilgan)' : '') : 'Fayl oʻrniga hash ishlatiladi';
    chips.querySelectorAll('.fchip').forEach((b) => b.classList.toggle('on', b === chips.querySelector(`[data-case="${key}"]`)));
    check();
  } }, label)));
  const out = h('div', { class: 'stack' },
    pageHead('Kvitansiyani tekshirish', 'Fayl + .muhr.json. Muhr serverisiz, internetsiz ishlaydi: hisob-kitob shu brauzerda.'),
    card('Namunalar', h('p', { class: 'sub' }, 'Har bir holatni bir bosishda sinang: toʻgʻri isbot, oʻzgargan fayl, buzilgan isbot, soxta jurnal, kutilayotgan tasdiq, tuzli hash.'), chips),
    h('div', { class: 'grid-2 even' },
      card('1. Fayl va kvitansiya',
        h('label', { class: 'drop small', for: 'v-file' }, icon('M12 16V4M7 9l5-5 5 5M4 16v4h16v-4'), h('b', null, 'Tekshiriladigan fayl'), fileLabel, fileIn),
        hashIn,
        h('div', { class: 'between' }, h('label', { for: 'v-receipt', class: 'kl' }, '.muhr.json'), h('label', { class: 'link-btn', for: 'v-rfile' }, 'Fayldan yuklash', recFile)),
        recIn,
        h('div', { class: 'row-actions' }, btn('Tekshirish', check, 'primary', { id: 'v-check' }), h('span', { class: 'sub' }, 'Bitcoin sarlavhalari keshdan olinadi'))),
      card('2. Natija', res)));
  if (verifyState.preset) {
    const p = verifyState.preset; verifyState.preset = null;
    hashIn.value = p.hash; recIn.value = p.receipt; fileLabel.textContent = p.label + ': fayl oʻrniga hash';
    queueMicrotask(check);
  } else res.append(h('div', { class: 'empty' }, h('b', null, 'Natija shu yerda chiqadi'), h('p', { class: 'sub' }, 'Yuqoridagi namunalardan birini tanlang yoki oʻz faylingiz va kvitansiyangizni qoʻying.')));
  return out;
}

/* --- open log --- */
const logState = { heads: 25, entries: 40, q: '' };
function logTabs(cur) {
  return h('div', { class: 'tabs' }, [['/log', 'Ildizlar (STH)'], ['/log/entries', 'Yozuvlar'], ['/log/consistency', 'Barqarorlik isboti'], ['/log/monitors', 'Kuzatuvchilar']]
    .map(([p, t]) => h('a', { href: '#' + p, class: p === cur ? 'on' : null, 'aria-current': p === cur ? 'page' : null }, t)));
}
function logHeader(cur) {
  const confirmed = heads.findLast((x) => x.state === 'bitcoin');
  return [pageHead('Ochiq jurnal', LOG_ORIGIN + ' · RFC 9162 uslubidagi append-only Merkle jurnal. Unda faqat hashlar bor.'),
    h('div', { class: 'kpis' }, kpi('Daraxt hajmi', num(log.size), 'yozuv'), kpi('Eʼlon qilingan ildizlar', num(heads.length), 'har soatda bittadan'),
      kpi('Oxirgi Bitcoin tasdigʻi', '#' + String(confirmed.height), ago(confirmed.confirmed), 'ok'), kpi('Kuzatuvchilar', '2 / 3', 'bittasi oflayn', 'warn')),
    logTabs(cur)];
}
function logHeads() {
  const body = h('div');
  function draw() {
    const list = heads.slice().reverse().slice(0, logState.heads);
    body.replaceChildren(h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
      h('thead', null, h('tr', null, h('th', null, 'Vaqt'), h('th', null, 'Hajm'), h('th', { class: 'hide-sm' }, 'Yangi'), h('th', null, 'Ildiz'), h('th', null, 'Holat'), h('th', { class: 'hide-sm' }, 'Blok'))),
      h('tbody', null, list.map((x) => { const i = heads.indexOf(x); return h('tr', null, h('td', { class: 'nowrap' }, fmtDate(x.time)), h('td', { class: 'mono' }, num(x.size)), h('td', { class: 'mono hide-sm' }, '+' + (x.size - (heads[i - 1]?.size || 0))),
        h('td', null, hashText(x.root, 'clip')), h('td', null, stateBadge(x.state)), h('td', { class: 'mono hide-sm' }, x.height ? '#' + String(x.height) : '—')); })))),
    logState.heads < heads.length ? h('div', { class: 'row-actions' }, btn('Yana 25 ta', () => { logState.heads += 25; draw(); }, '', { id: 'more-heads' }), h('span', { class: 'sub' }, `${logState.heads} / ${num(heads.length)}`)) : null);
  }
  draw();
  return [...logHeader('/log'), body];
}
function logEntries() {
  const body = h('div');
  const search = h('input', { type: 'search', placeholder: 'Hash boshini kiriting (masalan 3fa2)…', 'aria-label': 'Hash boʻyicha qidirish', id: 'log-search', value: logState.q });
  function draw() {
    const q = C.normalizeHash(logState.q);
    let list = entries.slice().reverse();
    if (q) list = list.filter((e) => e.data.startsWith(q) || leafHash(e.data).startsWith(q));
    const shown = list.slice(0, logState.entries);
    body.replaceChildren(
      list.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
        h('thead', null, h('tr', null, h('th', null, 'Indeks'), h('th', null, 'Vaqt'), h('th', null, 'Yozuv (fayl hashi)'), h('th', { class: 'hide-sm' }, 'Barg hashi'), h('th', null, 'Holat'))),
        h('tbody', null, shown.map((e) => { const hd = headFor(e.index); return h('tr', null, h('td', { class: 'mono' }, '#' + String(e.index)), h('td', { class: 'nowrap sub' }, ago(e.at)),
          h('td', null, hashText(e.data, 'clip')), h('td', { class: 'hide-sm' }, hashText(leafHash(e.data), 'clip')), h('td', null, stateBadge(hd ? hd.state : 'queued'))); })))) :
        h('div', { class: 'empty' }, h('b', null, 'Bunday hash jurnalda yoʻq'), h('p', { class: 'sub' }, 'Demak bu fayl hech qachon muhrlanmagan yoki hash notoʻgʻri koʻchirilgan.')),
      list.length > logState.entries ? h('div', { class: 'row-actions' }, btn('Yana 40 ta', () => { logState.entries += 40; draw(); }, '', { id: 'more-entries' }), h('span', { class: 'sub' }, `${shown.length} / ${num(list.length)}`)) : null);
  }
  search.addEventListener('input', () => { logState.q = search.value; logState.entries = 40; draw(); });
  draw();
  return [...logHeader('/log/entries'), h('div', { class: 'toolbar' }, search), body,
    h('p', { class: 'sub' }, 'Fayl nomi, egasi va manbasi jurnalga yozilmaydi. Hashni bilmagan odam yozuvdan hech narsa bilmaydi.')];
}
function logConsistency() {
  const out = h('div', { class: 'stack' });
  const opts = heads.slice().reverse().slice(0, 200);
  const mk = (id, sel) => { const el = h('select', { id }, opts.map((x) => h('option', { value: String(x.size) }, `${num(x.size)} · ${fmtDate(x.time)}`))); el.value = String(sel); return el; };
  const a = mk('c-from', opts[Math.min(48, opts.length - 1)].size), b = mk('c-to', opts[0].size);
  const forge = h('input', { type: 'checkbox', id: 'c-forge' });
  const res = h('div');
  function draw() {
    let m = Number(a.value), n = Number(b.value);
    if (m > n) [m, n] = [n, m];
    const proof = log.consistency(m, n);
    let first = log.root(m);
    if (forge.checked) first = first.replace(/^./, (c) => (c === '0' ? '1' : '0'));
    const ok = verifyConsistency(m, n, first, log.root(n), proof);
    res.replaceChildren(
      h('div', { class: 'verdict v-' + (ok ? 'ok' : 'bad') }, h('b', null, ok ? 'Jurnal barqaror' : 'Barqarorlik buzilgan'),
        h('span', null, ok ? `${num(m)} yozuvli eski daraxt ${num(n)} yozuvli yangi daraxtning boshida oʻzgarishsiz turibdi: hech narsa oʻchirilmagan yoki almashtirilmagan.` :
          'Eski ildiz yangi daraxtga mos kelmadi. Kuzatuvchi buni darhol eʼlon qiladi.')),
      dl([['Eski ildiz (' + num(m) + ')', hashText(first, 'clip')], ['Yangi ildiz (' + num(n) + ')', hashText(log.root(n), 'clip')], ['Isbot', proof.length + ' ta hash, RFC 9162 §2.1.4']]),
      h('ol', { class: 'path' }, proof.map((p, i) => h('li', null, h('span', { class: 'lv' }, String(i + 1)), h('code', null, short(p, 16))))));
  }
  for (const el of [a, b, forge]) el.addEventListener('change', draw);
  out.append(card('Ikki ildiz orasidagi barqarorlik', h('p', { class: 'sub' }, 'Jurnal faqat qoʻshiladimi? Ikkita eʼlon qilingan ildizni tanlang: isbot shu brauzerda hisoblanadi va tekshiriladi.'),
    h('div', { class: 'toolbar' }, h('label', { class: 'field' }, h('span', null, 'Eski'), a), h('label', { class: 'field' }, h('span', null, 'Yangi'), b),
      h('label', { class: 'check' }, forge, h('span', null, 'Eski ildizni buzib koʻrish'))), res));
  draw();
  return [...logHeader('/log/consistency'), out];
}
function logMonitors() {
  const last = heads[heads.length - 1];
  return [...logHeader('/log/monitors'),
    h('div', { class: 'cards-3' }, world.monitors.map((m) => h('section', { class: 'card mon' + (m.ok ? '' : ' off') },
      h('h2', null, m.name), h('p', { class: 'sub' }, m.who),
      dl([['Holat', m.ok ? badge('ok', 'Barqaror') : badge('warn', 'Oflayn')], ['Oxirgi tekshiruv', ago(NOW - m.lag)], ['Tekshirgan hajm', num(headFor(Math.max(0, entries.findLastIndex((e) => e.at < NOW - m.lag)))?.size || last.size)],
        ['Topilgan muammo', m.ok ? '0' : '—']]), m.note ? h('p', { class: 'note warn' }, m.note) : null))),
    card('Kuzatuvchi nima qiladi', h('p', null, 'Mustaqil kuzatuvchi har bir yangi ildizni oladi, oldingisi bilan barqarorlik isbotini tekshiradi va natijani oʻzi eʼlon qiladi. Jurnal operatori (biz) yozuvni oʻchirsa yoki tarixni qayta yozsa, kuzatuvchilar buni koʻradi.'),
      h('p', { class: 'note' }, 'Konsept: kuzatuvchilar v1 rejasida. Bu yerdagi tashkilotlar toʻqima.'))];
}

/* --- integrations --- */
function integrations() {
  const cli = `$ muhr stamp kitobxon-2.4.1-win-x64.msi
  sha-256  ${entries[1200].data.slice(0, 32)}…
  log      #${(1200)} · ${LOG_ORIGIN}
  anchor   opentimestamps: pending (3 calendars)
  receipt  kitobxon-2.4.1-win-x64.msi.muhr.json

$ muhr verify kitobxon-2.4.1-win-x64.msi
  ok  hash matches the receipt
  ok  inclusion proof → root of tree size ${num(headFor(1200).size)}
  ok  Bitcoin block #${(headFor(1200).height || 925000)} (headers cached)
  → existed no later than ${new Date(headFor(1200).confirmed || NOW).toISOString().slice(0, 16).replace('T', ' ')}`;
  const action = `# .github/workflows/release.yml
- uses: wonmortech/muhr-action@v0   # rejada
  with:
    files: dist/*
    attach-receipts: true           # .muhr.json + .ots reliz sahifasiga`;
  const api = `curl -X POST https://${LOG_ORIGIN.split('/')[0]}/stamp \\
  -H 'content-type: application/json' \\
  -d '{"hash":"sha256:${entries[900].data.slice(0, 24)}…"}'

# faqat 32 baytli hash qabul qilinadi, fayl emas`;
  const snip = (title, status, code, note) => h('section', { class: 'card' }, h('div', { class: 'between' }, h('h2', null, title), badge('muted', status)), h('pre', { class: 'code small' }, code), note ? h('p', { class: 'sub' }, note) : null);
  return [
    pageHead('Integratsiyalar', 'CLI, GitHub Action, API va Telegram bot: hammasi bir xil .muhr.json beradi. Hammasi rejada (konsept).'),
    h('div', { class: 'grid-2 even' },
      snip('CLI: muhr', '1-hafta rejasi', cli, 'Rust, Apache-2.0. ots alohida jarayon sifatida chaqiriladi.'),
      h('div', { class: 'stack' }, snip('GitHub Action', '7-hafta rejasi', action, 'Har reliz artefakti avtomatik muhrlanadi.'), snip('API', '3-hafta rejasi', api, 'Rate limit; jurnal append-only, UPDATE/DELETE huquqi yoʻq.'))),
    card('Action bilan muhrlangan relizlar', h('p', { class: 'sub' }, 'Toʻqima ochiq loyihalar: GitHub Action ularning har relizini muhrlaydi.'),
      h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
        h('thead', null, h('tr', null, h('th', null, 'Repo'), h('th', null, 'Teg'), h('th', { class: 'hide-sm' }, 'Fayllar'), h('th', null, 'Holat'), h('th', null, 'Sana'))),
        h('tbody', null, world.releases.map((r) => { const hd = headFor(r.index); return h('tr', null, h('td', { class: 'mono' }, r.repo), h('td', { class: 'mono' }, r.tag), h('td', { class: 'hide-sm' }, r.files + ' ta + SHA256SUMS'),
          h('td', null, stateBadge(hd ? hd.state : 'queued')), h('td', { class: 'sub nowrap' }, ago(r.at))); }))))),
  ];
}

/* --- Telegram bot (concept mock) --- */
const chat = [];
function seedChat() {
  if (chat.length) return;
  const smp = byId('r-contract'), hd = headFor(smp.index);
  const t = entries[smp.index].at;
  chat.push(
    { me: true, at: t - 60e3, text: '/start' },
    { at: t - 58e3, text: 'Assalomu alaykum! Men Muhr botiman. Fayl yuboring: men faqat uning SHA-256 hashini hisoblayman va ochiq jurnalga yozaman. Fayl saqlanmaydi.' },
    { me: true, at: t, file: SAMPLES.contract.name, size: bytesOf(SAMPLES.contract.text).length },
    { at: t + 2e3, text: `Muhrlandi: jurnal #${(smp.index)}\nSHA-256: ${short(entries[smp.index].data, 12)}\nBitcoin tasdigʻi odatda 1–4 soatda keladi.`, receipt: smp.id },
    { at: hd.confirmed, text: `Bitcoin bloki #${(hd.height)} tasdiqladi. Kvitansiya yangilandi.`, receipt: smp.id },
    { me: true, at: NOW - 3 * HOUR, text: '/verify' },
    { at: NOW - 3 * HOUR + 2e3, text: 'Tekshiriladigan faylni yuboring (kvitansiya kerak emas: hash jurnaldan qidiriladi).' },
    { me: true, at: NOW - 3 * HOUR + 40e3, file: SAMPLES.contract.name, size: bytesOf(SAMPLES.contract.text).length },
    { at: NOW - 3 * HOUR + 42e3, text: `Mos keladi. Bu fayl ${fmtDate(hd.confirmed)} dan kechikmay mavjud boʻlgan va oʻzgarmagan.\nIsbotlamaydi: kim yozgani, mazmun toʻgʻriligi.`, ok: true },
  );
}
function botPage() {
  seedChat();
  const list = h('div', { class: 'chat-list', id: 'chat' });
  const fileIn = h('input', { type: 'file', id: 'bot-file', class: 'sr-only' });
  let mode = 'stamp';
  function draw() {
    list.replaceChildren(...chat.map((m) => h('div', { class: 'msg' + (m.me ? ' me' : '') + (m.ok === true ? ' good' : m.ok === false ? ' bad' : '') },
      m.file ? h('div', { class: 'file' }, icon('M6 3h9l4 4v14H6zM14 3v5h5'), h('div', null, h('b', null, m.file), h('span', { class: 'sub' }, C.sizeLabel(m.size)))) : null,
      m.text ? h('p', null, m.text) : null,
      m.receipt ? h('div', { class: 'inline-kb' }, h('a', { href: '#/receipts/' + m.receipt }, 'Kvitansiya'), h('a', { href: '#/verify' }, 'Tekshirish')) : null,
      h('span', { class: 'time' }, pad(new Date(m.at).getHours()) + ':' + pad(new Date(m.at).getMinutes())))));
    list.scrollTop = list.scrollHeight;
  }
  async function handle(name, data) {
    chat.push({ me: true, at: Date.now(), file: name, size: data.length });
    const hash = await C.sha256(data);
    const found = entries.findIndex((e) => e.data === hash);
    if (mode === 'verify') {
      const hd = found >= 0 ? headFor(found) : null;
      chat.push(found < 0 ? { at: Date.now(), text: 'Bu fayl jurnalda topilmadi. U muhrlanmagan yoki oʻzgargan.', ok: false } :
        { at: Date.now(), text: hd && hd.state === 'bitcoin' ? `Mos keladi: jurnal #${(found)}, Bitcoin bloki #${(hd.height)}, ${fmtDate(hd.confirmed)}.` : `Jurnalda bor (#${(found)}), Bitcoin tasdigʻi kutilmoqda.`, ok: true });
    } else if (found >= 0) {
      chat.push({ at: Date.now(), text: `Bu hash allaqachon muhrlangan: #${(found)}, ${fmtDate(entries[found].at)}.` });
    } else {
      const index = log.append(hash);
      entries.push({ index, at: Date.now(), data: hash, source: 'bot' });
      const rc = { id: 'n' + index, index, name, type: (name.split('.').pop() || 'bin').slice(0, 5), size: data.length, source: 'bot', salted: false, tag: 'dalil', signer: null, upgraded: true, note: 'Telegram bot orqali (demo)' };
      receipts.unshift(rc);
      chat.push({ at: Date.now(), text: `Muhrlandi: jurnal #${(index)}\nSHA-256: ${short(hash, 12)}\nRoot keyingi soatda kalendarlarga yuboriladi.`, receipt: rc.id });
    }
    mode = 'stamp';
    draw();
  }
  fileIn.addEventListener('change', async () => { const f = fileIn.files[0]; if (f) handle(f.name, new Uint8Array(await f.arrayBuffer())); fileIn.value = ''; });
  const cmd = (text, fn) => h('button', { type: 'button', class: 'kb', onclick: fn }, text);
  const out = [
    pageHead('Telegram bot', 'Konsept: bot hali yoʻq (5-hafta rejasi). Bu oyna botning rejalashtirilgan suhbatini taqlid qiladi; hash haqiqiy.'),
    h('div', { class: 'grid-2' },
      h('div', { class: 'phone' }, h('div', { class: 'phone-top' }, sealMark(), h('div', null, h('b', null, 'Muhr bot'), h('span', { class: 'sub' }, 'bot · konsept'))), list,
        h('div', { class: 'kbs' },
          h('label', { class: 'kb', for: 'bot-file' }, 'Fayl yuborish', fileIn),
          cmd('Namuna yuborish', () => handle('eslatma-' + (chat.length + 1) + '.txt', bytesOf('Muhr demo eslatmasi ' + new Date().toISOString()))),
          cmd('/verify namuna', () => { mode = 'verify'; chat.push({ me: true, at: Date.now(), text: '/verify' }); handle(SAMPLES.contract.name, bytesOf(SAMPLES.contract.text)); }),
          cmd('/help', () => { chat.push({ me: true, at: Date.now(), text: '/help' }, { at: Date.now(), text: 'Fayl yuboring — muhrlayman.\n/verify — faylni tekshiraman.\nFayllar saqlanmaydi, faqat hash. Hech qachon pul, kalit yoki parol soʻramayman.' }); draw(); }))),
      card('Bot qanday ishlaydi', h('ol', { class: 'steps-plain' },
        h('li', null, h('b', null, 'Fayl yuborasiz. '), 'Bot hashni hisoblaydi va faylni darhol unutadi.'),
        h('li', null, h('b', null, 'Kvitansiya. '), 'Bot .muhr.json faylini qaytaradi; Bitcoin tasdigʻi kelganda yangisini yuboradi.'),
        h('li', null, h('b', null, '/verify. '), 'Faylni yuborsangiz, bot hashni jurnaldan qidiradi va natijani aytadi.'),
        h('li', null, h('b', null, 'Bot Mini App emas. '), 'Oddiy bot: qoʻshimcha ruxsat, toʻlov yoki hamyon yoʻq.')),
        h('p', { class: 'note' }, 'Muhr hech qachon pul, kalit, seed-fraza yoki parol soʻramaydi.'))),
  ];
  queueMicrotask(draw);
  return out;
}

function about() {
  const rows = [
    ['SHA-256 hash', 'Haqiqiy', 'WebCrypto, fayl brauzerdan chiqmaydi'],
    ['Merkle jurnal, tree head, inclusion va consistency isbotlari', 'Haqiqiy', 'RFC 9162 algoritmlari shu brauzerda hisoblanadi'],
    ['Tuzli hash', 'Haqiqiy', 'tuz || maʼlumot, tuz faqat kvitansiyada'],
    ['Kvitansiya .muhr.json', 'Qoralama', 'v0 formati, oʻzgaradi'],
    ['OpenTimestamps kalendarlari, .ots fayl', 'Simulyatsiya', 'tarmoqqa chiqilmaydi, holatlar toʻqima'],
    ['Bitcoin bloklari va raqamlari', 'Simulyatsiya', 'namuna raqamlar, haqiqiy blok emas'],
    ['Jurnal serveri, API, CLI, Action, bot', 'Rejada', 'docs/PLAN.md, 8 haftalik MVP'],
    ['EIMZO imzosini koʻrsatish', 'Rejada', 'MVPʼda kriptografik tekshirilmaydi'],
    ['Fayllar, odamlar, tashkilotlar, loyihalar', 'Toʻqima', 'hammasi oʻylab topilgan'],
  ];
  return [
    pageHead('Bu konsept demo', 'Muhr hali chiqmagan. Bu sahifalar rejalashtirilgan mahsulot qanday ishlashini koʻrsatadi.'),
    card('Nima haqiqiy, nima simulyatsiya', h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' }, h('thead', null, h('tr', null, h('th', null, 'Qism'), h('th', null, 'Holat'), h('th', null, 'Izoh'))),
      h('tbody', null, rows.map(([a, b, c]) => h('tr', null, h('td', null, a), h('td', null, badge(b === 'Haqiqiy' ? 'ok' : b === 'Simulyatsiya' ? 'warn' : 'muted', b)), h('td', { class: 'sub' }, c))))))),
    h('div', { class: 'grid-2 even' },
      card('Tamoyillar', h('ul', { class: 'steps-plain' }, h('li', null, h('b', null, 'Tanga yoʻq. '), 'Token, airdrop, kripto toʻlov hech qachon.'), h('li', null, h('b', null, 'Custody yoʻq. '), 'Kalit yoki aktiv saqlamaymiz.'),
        h('li', null, h('b', null, 'Serversiz tekshiruv. '), 'Isbot Muhr yopilsa ham ishlaydi.'), h('li', null, h('b', null, 'Halol chegaralar. '), 'Vaqtni isbotlaydi, muallifni emas.'))),
      card('Havolalar', h('ul', { class: 'links' }, h('li', null, h('a', { href: 'https://muhr.wonmor.io/' }, 'muhr.wonmor.io'), ' · bosh sahifa'),
        h('li', null, h('a', { href: 'https://github.com/wonmortech/muhr' }, 'github.com/wonmortech/muhr'), ' · kod va reja'),
        h('li', null, h('a', { href: 'https://opentimestamps.org/' }, 'OpenTimestamps')), h('li', null, h('a', { href: 'https://www.rfc-editor.org/rfc/rfc9162' }, 'RFC 9162'))))),
  ];
}
function notFound(title = 'Sahifa topilmadi', sub = 'Bunday manzil yoʻq.') {
  return h('div', { class: 'empty big' }, h('b', null, title), h('p', { class: 'sub' }, sub), btn('Bosh sahifaga', () => go('/'), 'primary'));
}

/* ---------- router ---------- */
function route() {
  const path = (location.hash.replace(/^#/, '') || '/').split('?')[0];
  const parts = path.split('/').filter(Boolean);
  let view;
  if (!parts.length) view = overview();
  else if (parts[0] === 'stamp') view = stamp();
  else if (parts[0] === 'receipts' && parts[1]) view = receiptDetail(parts[1]);
  else if (parts[0] === 'receipts') view = receiptsPage();
  else if (parts[0] === 'verify') view = verifyPage();
  else if (parts[0] === 'log' && !parts[1]) view = logHeads();
  else if (parts[0] === 'log' && parts[1] === 'entries') view = logEntries();
  else if (parts[0] === 'log' && parts[1] === 'consistency') view = logConsistency();
  else if (parts[0] === 'log' && parts[1] === 'monitors') view = logMonitors();
  else if (parts[0] === 'integrations') view = integrations();
  else if (parts[0] === 'bot') view = botPage();
  else if (parts[0] === 'about') view = about();
  else view = notFound();
  shell(path, view);
  document.title = (document.querySelector('main h1')?.textContent || 'Muhr') + ' · Muhr konsept demo';
  document.documentElement.dataset.ready = '1';
}
// a path-style deep link (…/demo/muhr/receipts) becomes a hash route
if (!location.hash && /\/(stamp|receipts|verify|log|integrations|bot|about)(\/|$)/.test(location.pathname)) {
  const m = location.pathname.match(/\/(stamp|receipts|verify|log|integrations|bot|about)(\/.*)?$/);
  history.replaceState(null, '', location.pathname.slice(0, m.index + 1) + '#/' + m[1] + (m[2] || ''));
}
window.addEventListener('hashchange', route);
route();
