// SPDX-FileCopyrightText: 2026 Wonmor and Muhr contributors
// SPDX-License-Identifier: Apache-2.0

// Generates site/index.html (uz), site/en/index.html, site/ru/index.html and site/404.html
// from one template. The site itself has no build step: the generated HTML is committed as is.
// Usage: node tools/pages.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'site')
const ORIGIN = 'https://muhr.wonmor.io'
const GH = 'https://github.com/wonmortech/muhr'
const VER = '1'
// REUSE/SPDX header of every generated file. In HTML it follows <!doctype html> (standards mode).
// REUSE-IgnoreStart
const SPDX = 'SPDX-FileCopyrightText: 2026 Wonmor and Muhr contributors\nSPDX-License-Identifier: Apache-2.0'
// REUSE-IgnoreEnd

// ---------- wax seal SVG (procedural edge, same noun as the hero canvas) ----------
function blob (cx, cy, r, n = 72, seed = 0) {
  const pts = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const k = 1 + 0.045 * Math.sin(5 * a + 1.3 + seed) + 0.03 * Math.sin(9 * a + 0.4 + seed) + 0.018 * Math.sin(14 * a + 2.1)
    pts.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k])
  }
  return 'M' + pts.map(p => p.map(v => v.toFixed(2)).join(' ')).join('L') + 'Z'
}
function sealSvg (id, cls = '', label = '') {
  const aria = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'
  return `<svg class="${cls}" viewBox="0 0 64 64" ${aria} focusable="false">
  <defs>
    <radialGradient id="${id}w" cx="38%" cy="34%" r="70%"><stop offset="0" stop-color="#d9564a"/><stop offset=".55" stop-color="#ab2b22"/><stop offset="1" stop-color="#6e1510"/></radialGradient>
    <radialGradient id="${id}i" cx="62%" cy="66%" r="70%"><stop offset="0" stop-color="#c13a30"/><stop offset="1" stop-color="#8a1f18"/></radialGradient>
  </defs>
  <path d="${blob(32, 32, 28)}" fill="url(#${id}w)"/>
  <circle cx="32" cy="32" r="19.5" fill="url(#${id}i)"/>
  <circle cx="32" cy="32" r="19.5" fill="none" stroke="#ffffff" stroke-opacity=".28" stroke-width="1" stroke-dasharray="30 92" transform="rotate(200 32 32)"/>
  <circle cx="32" cy="32" r="19.5" fill="none" stroke="#3a0805" stroke-opacity=".35" stroke-width="1" stroke-dasharray="30 92" transform="rotate(20 32 32)"/>
  <g class="rim" fill="none" stroke="#f3c2b9" stroke-opacity=".55" stroke-width="1.1" stroke-linecap="round">${Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; const r1 = 22.5, r2 = 24.6; return `<line x1="${(32 + Math.cos(a) * r1).toFixed(2)}" y1="${(32 + Math.sin(a) * r1).toFixed(2)}" x2="${(32 + Math.cos(a) * r2).toFixed(2)}" y2="${(32 + Math.sin(a) * r2).toFixed(2)}"/>` }).join('')}</g>
  <path d="M22.5 41V23.5l9.5 11 9.5-11V41" fill="none" stroke="#3a0805" stroke-opacity=".45" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round" transform="translate(.7 .7)"/>
  <path d="M22.5 41V23.5l9.5 11 9.5-11V41" fill="none" stroke="#f6d3cc" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/>
</svg>`
}

const ICONS = `<svg width="0" height="0" class="sr-only" aria-hidden="true" focusable="false">
<symbol id="i-gh" viewBox="0 0 24 24"><path fill="currentColor" d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96 .1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/></symbol>
<symbol id="i-yes" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m7.5 12.3 3 3 6-6.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-no" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
<symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-moon" viewBox="0 0 24 24"><path d="M20 14.6A8.4 8.4 0 0 1 9.4 4a8.4 8.4 0 1 0 10.6 10.6Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
<symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" stroke-width="1.7"/></symbol>
<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-file" viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z M14 3v5h5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>
</svg>`

// ---------- how-it-works figures (stroke drawn when scrolled in) ----------
const FIG = {
  hash: `<svg class="draw" viewBox="0 0 120 90" aria-hidden="true"><rect class="len-190" x="14" y="10" width="40" height="52" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/><line class="len-30" x1="22" y1="24" x2="46" y2="24" stroke="currentColor" stroke-width="1.6"/><line class="len-30" x1="22" y1="33" x2="44" y2="33" stroke="currentColor" stroke-width="1.6"/><line class="len-30" x1="22" y1="42" x2="40" y2="42" stroke="currentColor" stroke-width="1.6"/><path class="len-20 acc-stroke" d="M58 36h14" stroke-width="1.6"/><text class="mono-text" x="76" y="30" font-size="9" fill="currentColor">9f2c</text><text class="mono-text" x="76" y="42" font-size="9" fill="currentColor">a07e</text><text class="mono-text acc-fill" x="76" y="54" font-size="9">…64</text></svg>`,
  log: `<svg class="draw" viewBox="0 0 120 90" aria-hidden="true"><path class="len-60" d="M60 14 34 40M60 14l26 26M34 40 22 66M34 40l12 26M86 40 74 66M86 40l12 26" fill="none" stroke="currentColor" stroke-width="1.6"/><circle class="len-40 panel-fill acc-stroke" cx="60" cy="14" r="5" stroke-width="1.8"/><circle class="len-30 panel-fill" cx="34" cy="40" r="4" stroke="currentColor" stroke-width="1.6"/><circle class="len-30 panel-fill" cx="86" cy="40" r="4" stroke="currentColor" stroke-width="1.6"/><rect class="len-40" x="17" y="66" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect class="len-40" x="41" y="66" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect class="len-40" x="69" y="66" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect class="len-40 acc-fill acc-stroke" x="93" y="66" width="10" height="10" rx="2" stroke-width="1.6"/></svg>`,
  btc: `<svg class="draw" viewBox="0 0 120 90" aria-hidden="true"><rect class="len-110" x="8" y="30" width="26" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="1.6"/><rect class="len-110" x="47" y="30" width="26" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="1.6"/><rect class="len-110 acc-stroke" x="86" y="30" width="26" height="26" rx="4" fill="none" stroke-width="2"/><path class="len-20" d="M34 43h13M73 43h13" stroke="currentColor" stroke-width="1.6"/><path class="len-24 acc-stroke" d="M93 43.5l4 4 8-8.5" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path class="len-60 acc-stroke" d="M99 30V16H60" fill="none" stroke-width="1.4" stroke-dasharray="3 3"/></svg>`,
  receipt: `<svg class="draw" viewBox="0 0 120 90" aria-hidden="true"><path class="len-220" d="M30 8h44l14 14v60H30Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path class="len-30" d="M74 8v14h14" fill="none" stroke="currentColor" stroke-width="1.6"/><line class="len-34" x1="38" y1="32" x2="70" y2="32" stroke="currentColor" stroke-width="1.6"/><line class="len-40" x1="38" y1="41" x2="76" y2="41" stroke="currentColor" stroke-width="1.6"/><line class="len-26" x1="38" y1="50" x2="62" y2="50" stroke="currentColor" stroke-width="1.6"/><circle class="len-70 acc-fill acc-stroke" cx="74" cy="68" r="10" stroke-width="1.6"/><text class="mono-text" x="34" y="78" font-size="8" fill="currentColor">.ots</text></svg>`,
  verify: `<svg class="draw" viewBox="0 0 120 90" aria-hidden="true"><rect class="len-200" x="14" y="14" width="58" height="40" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/><line class="len-60" x1="14" y1="24" x2="72" y2="24" stroke="currentColor" stroke-width="1.6"/><path class="len-90" d="M80 32h10a4 4 0 0 1 4 4v28H62V58" fill="none" stroke="currentColor" stroke-width="1.6"/><rect class="len-110" x="88" y="44" width="22" height="34" rx="4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle class="len-90 acc-stroke" cx="43" cy="66" r="13" fill="none" stroke-width="2"/><path class="len-24 acc-stroke" d="M37 66l4.5 4.5 8-9" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
}


// ---------- strings ----------
const L = {
  uz: {
    lang: 'uz', path: '/', locale: 'uz_UZ',
    title: 'Muhr — fayl shu kuni bor edi va oʻzgarmagan',
    desc: 'Muhr faylning hashini Bitcoin (OpenTimestamps) va ochiq shaffoflik jurnaliga bogʻlaydigan ochiq vosita. Tanga yoʻq, saqlash yoʻq. Isbotni istalgan odam oflayn tekshiradi. Holat: rejalashtirilmoqda.',
    skip: 'Asosiy matnga oʻtish',
    nav: ['Isbot', 'Qanday ishlaydi', 'Sinab koʻring', 'Yoʻl xaritasi'],
    ids: ['isbot', 'qanday', 'sinash', 'yol', 'kimlar', 'ochiq', 'holat'],
    menu: 'Menyu', theme: 'Mavzuni almashtirish', langLabel: 'Til',
    status: 'Rejalashtirilmoqda · hali hech narsa chiqmagan',
    h1: 'Bu fayl shu kuni <em>bor edi</em>. Oʻzgarmagan.',
    lead: 'Muhr faylning faqat hashini Bitcoin va ochiq jurnalga bogʻlaydi. Isbotni istalgan odam bizning serverimizsiz tekshiradi.',
    try: 'Brauzerda sinab koʻring', follow: 'GitHubʼda kuzatish',
    vow: ['Token yoʻq', 'Pul ushlanmaydi', 'Fayl yuborilmaydi'],
    steps: ['Fayl', 'Hash', 'Muhr', 'Bitcoin'],
    stageNote: 'Illyustratsiya',
    stageDesc: 'Illyustratsiya: hujjat varagʻidan 64 belgili SHA-256 hash ajraladi, hash sargʻich muhrning gardishiga aylanadi, muhr Merkle shoxi orqali Bitcoin blokiga bogʻlanadi.',
    canvas: { file: 'shartnoma.pdf', log: 'jurnal', btc: 'Bitcoin', sample: 'Toshkent, 13-noyabr. Tomonlar kelishdi.' },
    p: {
      k: '01 · Nimani isbotlaydi', h: 'Vaqtni isbotlaydi. Muallifni emas.',
      sub: 'Chegarani oldindan aytamiz: muhr sanani va butunlikni koʻrsatadi. Kim imzolaganini EIMZO imzosining oʻzi koʻrsatadi.',
      yes: 'Isbotlaydi', no: 'Isbotlamaydi',
      yi: [['Shu sanagacha mavjud edi', 'Bitcoin bloki vaqti boʻyicha, bir necha soat aniqlikda.'], ['Bir bayt ham oʻzgarmagan', 'Hash boshqacha chiqsa, fayl ham boshqa.'], ['Bizsiz tekshiriladi', 'Kvitansiya, ochiq <code>ots</code> mijozi va Bitcoin sarlavhalari yetarli.']],
      ni: [['Kim yozgani yoki imzolagani', 'Buni EIMZO (PKCS#7) imzosi beradi. Muhr uni faqat koʻrsatadi.'], ['Mazmun toʻgʻriligi', 'Muhr faylni oʻqimaydi va baholamaydi.'], ['Notarial tasdiq', 'Bu qoʻshimcha, mustaqil tekshiriladigan dalil. Rasmiy vaqt tamgʻasi (RFC 3161) oʻrnini bosmaydi.']],
      fpL: 'Bitta harfni oʻzgartirib koʻring', fpNote: 'Bitta harf, butunlay boshqa hash. Shuning uchun hash faylning barmoq izi.'
    },
    h: {
      k: '02 · Qanday ishlaydi', h: 'Besh qadam. Fayl qurilmangizda qoladi.', sub: 'Faqat 64 belgili hash yuboriladi. Qolgani ochiq standartlar.',
      s: [['Hash', 'SHA-256 brauzerda yoki CLIda hisoblanadi.', 'now', 'Quyida ishlaydi'], ['Jurnal', 'Hash faqat qoʻshiladigan ochiq Merkle jurnaliga yoziladi (RFC 9162 uslubida).', 'soon'], ['Bitcoin', 'Jurnal ildizi OpenTimestamps ochiq kalendarlari orqali Bitcoin blokiga tushadi. Bir necha soat ketadi.', 'soon'], ['Kvitansiya', '<code>.muhr.json</code>: inclusion proof va <code>.ots</code> fayl. Shuni saqlaysiz.', 'soon'], ['Tekshirish', 'Brauzer, CLI yoki Telegram bot. Serverimiz yopilsa ham ishlaydi.', 'soon']],
      off: '<strong>Wonmor yopilsa ham</strong> isbot ishlaydi: tekshirish Bitcoin sarlavhalari va ochiq <code>ots</code> mijoziga tayanadi.'
    },
    d: {
      k: '03 · Sinab koʻring', h: 'Hash hozir, shu yerda hisoblanadi.', sub: 'Matn yozing yoki fayl tashlang. Hech narsa yuborilmaydi. Bitcoinʼga bogʻlash hali qurilmagan.',
      tabs: ['Muhrlash (namuna)', 'Solishtirish'], input: 'Matn yoki fayl', file: 'Fayl tanlash', drop: 'yoki shu yerga tashlang', noFile: 'Fayl tanlanmagan',
      salt: 'Tuzli hash', saltNote: 'Qisqa maxfiy matnni taxmin qilib boʻlmasin. Tuz faqat sizda qoladi.',
      cmpL: 'Kutilgan hash (64 belgi)', cmpPh: 'masalan, reliz sahifasidagi SHA-256',
      meta: 'SHA-256 · 64 belgi', copy: 'Nusxa olish', rTitle: 'Kvitansiya qanday boʻladi', rChip: 'Namuna · format v0 hali tasdiqlanmagan',
      foot: 'Hisob WebCrypto bilan qurilmangizda bajariladi. Matn ham, fayl ham hech qayerga yuborilmaydi.'
    },
    w: {
      k: '04 · Kim uchun', h: 'Imzosi bor, sanasi kerak boʻlgan ishlar uchun.',
      sub: 'Birinchi foydalanuvchi Wonmorʼning oʻzi: relizlar va maqolalar.',
      a: [['Open-source maintainerlar', 'Reliz fayllari muhrlanadi: kim yuklab olsa ham, aynan shu baytlar ekanini tekshiradi.', 'Birinchi: bitg relizlari'], ['Yuristlar va freelancerlar', 'Shartnoma, ish natijasi, dizayn: «shu kuni menda bor edi» degan dalil.', 'Rejada'], ['Mualliflar va tadqiqotchilar', 'Maqola chiqqach, keyin jimgina oʻzgartirilmaganini koʻrsatish.', 'Birinchi: wonmor.io maqolalari'], ['Bizneslar, API orqali', 'Shartnoma arxivi va hisobotlar uchun. Toʻlov somda, odatiy dasturiy xizmat sifatida.', 'Keyinroq']],
      rel: 'reliz', st: 'tez kunda', v1: 'v1 muhrlandi', v2: 'v2 boshqa hash'
    },
    o: {
      k: '05 · Ochiq kod va standartlar', h: 'Hammasini oʻzingiz tekshira olasiz. Bizni ham.', sub: 'Faqat ochiq standartlar. Kod Apache-2.0 litsenziyasi bilan chiqadi.',
      std: ['Hashlarni Bitcoinʼga bogʻlash, bepul ochiq kalendarlar', 'Merkle jurnal va inclusion proof formati', 'Ochiq shaffoflik jurnali, 2-bosqich', 'Hash algoritmi standarti', 'EIMZO imzosi tuzilmasi, faqat koʻrsatiladi', 'Rasmiy vaqt tamgʻasi: oʻrnini bosmaymiz, yonida ishlaydi', 'Brauzerdagi hash shu API bilan', 'Bitcoinʼga bogʻlangan vaqt isboti boʻyicha IETF ishi, kuzatamiz'],
      repos: [['wonmortech/muhr', 'Rust CLI, .NET API va web tekshiruvchi'], ['wonmortech/muhr-action', 'Reliz fayllarini muhrlaydigan GitHub Action'], ['wonmortech/muhr-spec', '<code>.muhr.json</code> format spetsifikatsiyasi']],
      planned: 'Rejada', read: 'Oʻqish'
    },
    r: {
      k: '06 · Yoʻl xaritasi', h: 'v0.1 gacha sakkiz hafta, ochiq.', sub: 'Bu sanalar emas, tartib. Har bosqich tugagach shu yerda belgilanadi.',
      w: 'Hafta', items: [['CLI va jurnal', '<code>muhr stamp/verify</code>, Merkle jurnal, <code>.muhr.json</code> v0. Birinchi muhrlar: bitg relizlari va wonmor.io maqolalari.'], ['API va tekshiruvchi sahifa', '<code>POST /stamp</code>, <code>GET /proof</code>, brauzerda oflayn tekshirish.'], ['Telegram bot va PKCS#7', 'Fayl yuboring, kvitansiya oling. EIMZO imzosi «kriptografik tekshirilmadi» belgisi bilan koʻrsatiladi.'], ['GitHub Action va v0.1', 'Reliz fayllarini avtomatik muhrlash, xavfsizlik sahifasi, tahdid modeli.']],
      soon: 'Tez kunda', later: 'Keyinroq',
      l: [['Ikkinchi jurnal', 'Jurnal ildizlari Sigstore Rekor yoki boshqa ochiq jurnalga ham yoziladi.'], ['Biznes API', 'Hajm, SLA, mijoz serverida oʻrnatish. Toʻlov somda.'], ['Agentlar uchun', '<code>stamp_hash</code> MCP tool: agent oʻz natijasini muhrlaydi.']]
    },
    s: {
      k: '07 · Halol holat', h: 'Hozir bu reja. Kod hali yoʻq.', sub: 'Nima bor, nima yoʻq. Roʻyxat har oy yangilanadi.',
      rows: [['Tadqiqot va reja', 'bor', 'y'], ['Shu sahifadagi hash demo', 'ishlaydi', 'y'], ['CLI, API, jurnal', 'tez kunda', 'n'], ['Bitcoinʼga bogʻlash', 'tez kunda', 'n'], ['Foydalanuvchilar', 'hali yoʻq', 'n'], ['Xavfsizlik auditi', 'rejada', 'n'], ['Yurist xulosasi', 'savollar tayyor', 'n']],
      warn: 'Muhr hech qachon pul, kalit, seed ibora yoki kripto soʻramaydi va birinchi boʻlib yozmaydi. Rasmiy manzillar faqat <strong>muhr.wonmor.io</strong> va <strong>github.com/wonmortech</strong>.'
    },
    f: {
      h: 'Birinchi muhrni birga qoʻyamiz.', p: 'Gʻoya, savol yoki xato boʻlsa, GitHubʼda issue oching. Reja va tadqiqot ochiq.',
      issue: 'Issue ochish', plan: 'Rejani oʻqish'
    },
    foot: {
      by: '<strong>Muhr</strong> — Wonmor loyihasi.', byP: 'Ochiq kod, Apache-2.0. Tanga yoʻq, saqlash yoʻq.',
      proj: 'Loyihalar', src: 'Manbalar', gh: 'GitHub', docs: 'Tadqiqot', plan: 'Reja', issues: 'Savol berish',
      sanad: 'Sanad — tekshiriladigan sertifikatlar', shaffof: 'Shaffof — ochiq xayriya hisobi', wonmor: 'Wonmor studiyasi',
      fine: 'Bu sahifa cookie, analitika va tashqi skriptlarsiz ishlaydi.'
    },
    nf: { title: 'Sahifa topilmadi — Muhr', h: 'Bu sahifa muhrlanmagan.', p: 'Bunday manzil yoʻq. Bosh sahifaga qayting.', back: 'Bosh sahifa' }
  },

  en: {
    lang: 'en', path: '/en/', locale: 'en_US',
    title: 'Muhr — proof that a file existed, unchanged',
    desc: 'Muhr is an open tool that binds a file’s hash to Bitcoin (OpenTimestamps) and to an open transparency log. No coin, no custody. Anyone can verify the proof offline. Status: planning.',
    skip: 'Skip to content',
    nav: ['What it proves', 'How it works', 'Try it', 'Roadmap'],
    ids: ['proves', 'how', 'try', 'roadmap', 'who', 'open', 'status'],
    menu: 'Menu', theme: 'Toggle theme', langLabel: 'Language',
    status: 'Planning · nothing released yet',
    h1: 'This file <em>existed</em> on this day. Unchanged.',
    lead: 'Muhr binds only a file’s hash to Bitcoin and an open log. Anyone can check the proof without our server.',
    try: 'Try it in your browser', follow: 'Follow on GitHub',
    vow: ['No token', 'No custody', 'Your file never leaves'],
    steps: ['File', 'Hash', 'Seal', 'Bitcoin'],
    stageNote: 'Illustration',
    stageDesc: 'Illustration: a 64-character SHA-256 hash lifts off a document, becomes the rim of a wax seal, and the seal is linked through a Merkle branch into a Bitcoin block.',
    canvas: { file: 'contract.pdf', log: 'log', btc: 'Bitcoin', sample: 'Tashkent, 13 November. The parties agreed.' },
    p: {
      k: '01 · What it proves', h: 'It proves when. Not who.',
      sub: 'We state the limit up front: the seal shows the date and the integrity. Who signed is shown by the e-signature itself.',
      yes: 'Proves', no: 'Does not prove',
      yi: [['It existed by this date', 'By Bitcoin block time, accurate to a few hours.'], ['Not a single byte changed', 'If the hash differs, so does the file.'], ['Checkable without us', 'The receipt, the open <code>ots</code> client and Bitcoin headers are enough.']],
      ni: [['Who wrote or signed it', 'An EIMZO (PKCS#7) signature does that. Muhr only displays it.'], ['That the content is true', 'Muhr does not read or judge the file.'], ['Notarisation', 'It is extra, independently checkable evidence. It does not replace an official RFC 3161 timestamp.']],
      fpL: 'Change one letter', fpNote: 'One letter, a completely different hash. That is why a hash is a file’s fingerprint.'
    },
    h: {
      k: '02 · How it works', h: 'Five steps. Your file stays on your device.', sub: 'Only a 64-character hash is sent. Everything else is open standards.',
      s: [['Hash', 'SHA-256 is computed in the browser or the CLI.', 'now', 'Works below'], ['Log', 'The hash goes into an open, append-only Merkle log (RFC 9162 style).', 'soon'], ['Bitcoin', 'The log root reaches a Bitcoin block through public OpenTimestamps calendars. It takes a few hours.', 'soon'], ['Receipt', '<code>.muhr.json</code>: an inclusion proof plus the <code>.ots</code> file. You keep it.', 'soon'], ['Verify', 'Browser, CLI or Telegram bot. Works even if our server is gone.', 'soon']],
      off: '<strong>Even if Wonmor disappears</strong>, the proof still works: verification relies on Bitcoin headers and the open <code>ots</code> client.'
    },
    d: {
      k: '03 · Try it', h: 'The hash is computed right here, now.', sub: 'Type text or drop a file. Nothing is sent. Anchoring to Bitcoin is not built yet.',
      tabs: ['Stamp (preview)', 'Compare'], input: 'Text or file', file: 'Choose file', drop: 'or drop it here', noFile: 'No file chosen',
      salt: 'Salted hash', saltNote: 'So a short secret text cannot be guessed. The salt stays with you.',
      cmpL: 'Expected hash (64 hex)', cmpPh: 'e.g. the SHA-256 from a release page',
      meta: 'SHA-256 · 64 hex', copy: 'Copy', rTitle: 'What a receipt will look like', rChip: 'Preview · format v0 not final',
      foot: 'Computed on your device with WebCrypto. Neither the text nor the file is sent anywhere.'
    },
    w: {
      k: '04 · Who it is for', h: 'For work that has a signature and needs a date.',
      sub: 'The first user is Wonmor itself: releases and articles.',
      a: [['Open-source maintainers', 'Release files get sealed: whoever downloads them can check they are exactly these bytes.', 'First: bitg releases'], ['Lawyers and freelancers', 'Contracts, deliverables, designs: evidence that "I had this on that day".', 'Planned'], ['Writers and researchers', 'Show that an article was not quietly edited after it was published.', 'First: wonmor.io articles'], ['Businesses, via API', 'For contract archives and reports. Paid in som, as an ordinary software service.', 'Later']],
      rel: 'release', st: 'soon', v1: 'v1 sealed', v2: 'v2 different hash'
    },
    o: {
      k: '05 · Open source and standards', h: 'You can check all of it. Us included.', sub: 'Open standards only. The code will ship under Apache-2.0.',
      std: ['Anchors hashes to Bitcoin, free public calendars', 'Merkle log and inclusion proof format', 'Open transparency log, phase 2', 'The hash algorithm standard', 'Structure of EIMZO signatures, display only', 'Official timestamps: we work alongside, never instead', 'The browser hash uses this API', 'IETF work on Bitcoin-anchored time proofs, watched'],
      repos: [['wonmortech/muhr', 'Rust CLI, .NET API and web verifier'], ['wonmortech/muhr-action', 'GitHub Action that seals release files'], ['wonmortech/muhr-spec', '<code>.muhr.json</code> format specification']],
      planned: 'Planned', read: 'Read'
    },
    r: {
      k: '06 · Roadmap', h: 'Eight weeks to v0.1, in the open.', sub: 'An order, not dates. Each stage gets ticked here when it is done.',
      w: 'Week', items: [['CLI and log', '<code>muhr stamp/verify</code>, Merkle log, <code>.muhr.json</code> v0. First seals: bitg releases and wonmor.io articles.'], ['API and verifier page', '<code>POST /stamp</code>, <code>GET /proof</code>, offline verification in the browser.'], ['Telegram bot and PKCS#7', 'Send a file, get a receipt. EIMZO signatures shown with a "not cryptographically verified" label.'], ['GitHub Action and v0.1', 'Automatic sealing of release files, security page, threat model.']],
      soon: 'Soon', later: 'Later',
      l: [['A second log', 'Log roots also written to Sigstore Rekor or another open log.'], ['Business API', 'Volume, SLA, on-premise install. Paid in som.'], ['For agents', '<code>stamp_hash</code> MCP tool: an agent seals its own output.']]
    },
    s: {
      k: '07 · Honest status', h: 'Today this is a plan. No code yet.', sub: 'What exists and what does not. Updated monthly.',
      rows: [['Research and plan', 'done', 'y'], ['Hash demo on this page', 'works', 'y'], ['CLI, API, log', 'soon', 'n'], ['Anchoring to Bitcoin', 'soon', 'n'], ['Users', 'none yet', 'n'], ['Security audit', 'planned', 'n'], ['Legal opinion', 'questions ready', 'n']],
      warn: 'Muhr will never ask for money, keys, a seed phrase or crypto, and will never message you first. The only official addresses are <strong>muhr.wonmor.io</strong> and <strong>github.com/wonmortech</strong>.'
    },
    f: {
      h: 'Let’s press the first seal together.', p: 'Have an idea, a question or found a mistake? Open an issue on GitHub. The plan and the research are public.',
      issue: 'Open an issue', plan: 'Read the plan'
    },
    foot: {
      by: '<strong>Muhr</strong> — a Wonmor project.', byP: 'Open source, Apache-2.0. No coin, no custody.',
      proj: 'Projects', src: 'Sources', gh: 'GitHub', docs: 'Research', plan: 'Plan', issues: 'Ask a question',
      sanad: 'Sanad — verifiable certificates', shaffof: 'Shaffof — open charity ledger', wonmor: 'Wonmor studio',
      fine: 'This page runs without cookies, analytics or third-party scripts.'
    },
    nf: { title: 'Page not found — Muhr', h: 'This page was never sealed.', p: 'There is nothing at this address. Head back home.', back: 'Home' }
  },

  ru: {
    lang: 'ru', path: '/ru/', locale: 'ru_RU',
    title: 'Muhr — доказательство, что файл существовал и не изменился',
    desc: 'Muhr — открытый инструмент, который привязывает хеш файла к Bitcoin (OpenTimestamps) и к открытому журналу прозрачности. Без монет и без хранения средств. Проверить доказательство можно офлайн. Статус: планирование.',
    skip: 'Перейти к содержимому',
    nav: ['Что доказывает', 'Как работает', 'Попробовать', 'План'],
    ids: ['dokazyvaet', 'kak', 'poprobovat', 'plan', 'dlya-kogo', 'otkrytost', 'status'],
    menu: 'Меню', theme: 'Сменить тему', langLabel: 'Язык',
    status: 'Планируется · пока ничего не выпущено',
    h1: 'Этот файл <em>существовал</em> в этот день. Без изменений.',
    lead: 'Muhr привязывает к Bitcoin и открытому журналу только хеш файла. Проверить доказательство может кто угодно, без нашего сервера.',
    try: 'Попробовать в браузере', follow: 'Следить на GitHub',
    vow: ['Без токена', 'Не храним средства', 'Файл не покидает устройство'],
    steps: ['Файл', 'Хеш', 'Печать', 'Bitcoin'],
    stageNote: 'Иллюстрация',
    stageDesc: 'Иллюстрация: из документа выделяется хеш SHA-256 из 64 символов, он становится ободком сургучной печати, а печать через ветвь дерева Меркла связывается с блоком Bitcoin.',
    canvas: { file: 'договор.pdf', log: 'журнал', btc: 'Bitcoin', sample: 'Ташкент, 13 ноября. Стороны договорились.' },
    p: {
      k: '01 · Что доказывает', h: 'Доказывает «когда». Не «кто».',
      sub: 'Говорим о границе сразу: печать показывает дату и целостность. Кто подписал, показывает сама подпись EIMZO.',
      yes: 'Доказывает', no: 'Не доказывает',
      yi: [['Файл существовал к этой дате', 'По времени блока Bitcoin, с точностью до нескольких часов.'], ['Не изменился ни один байт', 'Если хеш другой, то и файл другой.'], ['Проверяется без нас', 'Достаточно квитанции, открытого клиента <code>ots</code> и заголовков блоков Bitcoin.']],
      ni: [['Кто написал или подписал', 'Это даёт подпись EIMZO (PKCS#7). Muhr её только показывает.'], ['Что содержание верно', 'Muhr не читает и не оценивает файл.'], ['Нотариальное заверение', 'Это дополнительное, независимо проверяемое доказательство. Оно не заменяет официальную метку времени RFC 3161.']],
      fpL: 'Измените одну букву', fpNote: 'Одна буква — совсем другой хеш. Поэтому хеш и называют отпечатком файла.'
    },
    h: {
      k: '02 · Как работает', h: 'Пять шагов. Файл остаётся на вашем устройстве.', sub: 'Отправляется только хеш из 64 символов. Всё остальное — открытые стандарты.',
      s: [['Хеш', 'SHA-256 считается в браузере или в CLI.', 'now', 'Работает ниже'], ['Журнал', 'Хеш записывается в открытый журнал Меркла, куда можно только добавлять (в стиле RFC 9162).', 'soon'], ['Bitcoin', 'Корень журнала попадает в блок Bitcoin через открытые календари OpenTimestamps. Это занимает несколько часов.', 'soon'], ['Квитанция', '<code>.muhr.json</code>: доказательство включения и файл <code>.ots</code>. Её храните вы.', 'soon'], ['Проверка', 'Браузер, CLI или Telegram-бот. Работает, даже если нашего сервера уже нет.', 'soon']],
      off: '<strong>Даже если Wonmor исчезнет</strong>, доказательство работает: проверка опирается на заголовки блоков Bitcoin и открытый клиент <code>ots</code>.'
    },
    d: {
      k: '03 · Попробовать', h: 'Хеш считается прямо здесь и сейчас.', sub: 'Введите текст или перетащите файл. Ничего не отправляется. Привязки к Bitcoin пока нет.',
      tabs: ['Заверить (пример)', 'Сравнить'], input: 'Текст или файл', file: 'Выбрать файл', drop: 'или перетащите сюда', noFile: 'Файл не выбран',
      salt: 'Хеш с солью', saltNote: 'Чтобы короткий секретный текст нельзя было угадать. Соль остаётся у вас.',
      cmpL: 'Ожидаемый хеш (64 символа)', cmpPh: 'например, SHA-256 со страницы релиза',
      meta: 'SHA-256 · 64 символа', copy: 'Копировать', rTitle: 'Как будет выглядеть квитанция', rChip: 'Пример · формат v0 не утверждён',
      foot: 'Вычисляется на вашем устройстве через WebCrypto. Ни текст, ни файл никуда не отправляются.'
    },
    w: {
      k: '04 · Для кого', h: 'Для документов, у которых есть подпись, но нужна дата.',
      sub: 'Первый пользователь — сам Wonmor: релизы и статьи.',
      a: [['Мейнтейнеры open source', 'Файлы релиза получают печать: любой, кто их скачал, проверит, что это ровно те же байты.', 'Первыми: релизы bitg'], ['Юристы и фрилансеры', 'Договор, результат работы, дизайн: доказательство, что «в этот день это у меня было».', 'В планах'], ['Авторы и исследователи', 'Показать, что статью не правили втихую после публикации.', 'Первыми: статьи wonmor.io'], ['Бизнес, через API', 'Для архива договоров и отчётов. Оплата в сумах, как за обычный программный сервис.', 'Позже']],
      rel: 'релиз', st: 'скоро', v1: 'v1 заверена', v2: 'v2 другой хеш'
    },
    o: {
      k: '05 · Открытый код и стандарты', h: 'Всё можно проверить самому. И нас тоже.', sub: 'Только открытые стандарты. Код выйдет под лицензией Apache-2.0.',
      std: ['Привязка хешей к Bitcoin, бесплатные открытые календари', 'Формат журнала Меркла и доказательства включения', 'Открытый журнал прозрачности, второй этап', 'Стандарт алгоритма хеширования', 'Структура подписи EIMZO, только отображение', 'Официальная метка времени: работаем рядом, а не вместо', 'Хеш в браузере считается через этот API', 'Работа IETF над доказательствами времени через Bitcoin, следим'],
      repos: [['wonmortech/muhr', 'Rust CLI, .NET API и веб-проверка'], ['wonmortech/muhr-action', 'GitHub Action, который заверяет файлы релиза'], ['wonmortech/muhr-spec', 'Спецификация формата <code>.muhr.json</code>']],
      planned: 'В планах', read: 'Читать'
    },
    r: {
      k: '06 · План', h: 'Восемь недель до v0.1, открыто.', sub: 'Это порядок, а не даты. Каждый этап отмечается здесь, когда готов.',
      w: 'Неделя', items: [['CLI и журнал', '<code>muhr stamp/verify</code>, журнал Меркла, <code>.muhr.json</code> v0. Первые печати: релизы bitg и статьи wonmor.io.'], ['API и страница проверки', '<code>POST /stamp</code>, <code>GET /proof</code>, офлайн-проверка в браузере.'], ['Telegram-бот и PKCS#7', 'Отправьте файл, получите квитанцию. Подпись EIMZO показывается с пометкой «криптографически не проверена».'], ['GitHub Action и v0.1', 'Автоматическое заверение файлов релиза, страница безопасности, модель угроз.']],
      soon: 'Скоро', later: 'Позже',
      l: [['Второй журнал', 'Корни журнала пишутся ещё и в Sigstore Rekor или другой открытый журнал.'], ['API для бизнеса', 'Объём, SLA, установка на сервере клиента. Оплата в сумах.'], ['Для агентов', 'MCP-инструмент <code>stamp_hash</code>: агент заверяет свой результат.']]
    },
    s: {
      k: '07 · Честный статус', h: 'Сейчас это план. Кода пока нет.', sub: 'Что есть и чего нет. Список обновляется раз в месяц.',
      rows: [['Исследование и план', 'есть', 'y'], ['Демо хеша на этой странице', 'работает', 'y'], ['CLI, API, журнал', 'скоро', 'n'], ['Привязка к Bitcoin', 'скоро', 'n'], ['Пользователи', 'пока нет', 'n'], ['Аудит безопасности', 'в планах', 'n'], ['Заключение юриста', 'вопросы готовы', 'n']],
      warn: 'Muhr никогда не просит деньги, ключи, seed-фразу или криптовалюту и никогда не пишет первым. Официальные адреса только <strong>muhr.wonmor.io</strong> и <strong>github.com/wonmortech</strong>.'
    },
    f: {
      h: 'Поставим первую печать вместе.', p: 'Есть идея, вопрос или нашли ошибку? Откройте issue на GitHub. План и исследование открыты.',
      issue: 'Открыть issue', plan: 'Читать план'
    },
    foot: {
      by: '<strong>Muhr</strong> — проект Wonmor.', byP: 'Открытый код, Apache-2.0. Без монет и без хранения средств.',
      proj: 'Проекты', src: 'Источники', gh: 'GitHub', docs: 'Исследование', plan: 'План', issues: 'Задать вопрос',
      sanad: 'Sanad — проверяемые сертификаты', shaffof: 'Shaffof — открытый учёт благотворительности', wonmor: 'Студия Wonmor',
      fine: 'Страница работает без cookies, аналитики и сторонних скриптов.'
    },
    nf: { title: 'Страница не найдена — Muhr', h: 'Эта страница не заверена.', p: 'По этому адресу ничего нет. Вернитесь на главную.', back: 'Главная' }
  }
}

const STD = [
  ['OpenTimestamps', 'https://opentimestamps.org/'],
  ['RFC 9162 · CT 2.0', 'https://www.rfc-editor.org/rfc/rfc9162'],
  ['Sigstore Rekor', 'https://github.com/sigstore/rekor'],
  ['SHA-256 · FIPS 180-4', 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final'],
  ['RFC 5652 · CMS / PKCS#7', 'https://www.rfc-editor.org/rfc/rfc5652'],
  ['RFC 3161 · TSP', 'https://www.rfc-editor.org/rfc/rfc3161'],
  ['W3C Web Crypto', 'https://www.w3.org/TR/webcrypto/'],
  ['IETF SCITT', 'https://datatracker.ietf.org/wg/scitt/about/']
]
const LICS = ['Apache-2.0', 'MIT', 'CC BY 4.0']

function langSwitch (cur) {
  return ['uz', 'en', 'ru'].map(k => `<a href="${L[k].path}" hreflang="${k}" lang="${k}"${k === cur ? ' aria-current="true"' : ''}>${k.toUpperCase()}</a>`).join('')
}
function head (t, path, extraTitle) {
  const alts = ['uz', 'en', 'ru'].map(k => `<link rel="alternate" hreflang="${k}" href="${ORIGIN}${L[k].path}">`).join('\n')
  return `<!doctype html>
<!-- ${SPDX} -->
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${extraTitle || t.title}</title>
<meta name="description" content="${t.desc}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#f6f1e7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#14110f" media="(prefers-color-scheme: dark)">
<link rel="canonical" href="${ORIGIN}${path}">
${alts}
<link rel="alternate" hreflang="x-default" href="${ORIGIN}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Muhr">
<meta property="og:title" content="${extraTitle || t.title}">
<meta property="og:description" content="${t.desc}">
<meta property="og:url" content="${ORIGIN}${path}">
<meta property="og:image" content="${ORIGIN}/og-${t.lang}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${t.locale}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/serif-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/muhr.css?v=${VER}">
<script src="/assets/theme.js?v=${VER}"></script>
<script src="/assets/core.js?v=${VER}" defer></script>
<script src="/assets/app.js?v=${VER}" defer></script>
</head>`
}
function header (t, home) {
  const [a, b, c, d] = t.ids
  const nav = home ? `<nav class="nav" id="nav" aria-label="${t.menu}">
      <a href="#${a}">${t.nav[0]}</a><a href="#${b}">${t.nav[1]}</a><a href="#${c}">${t.nav[2]}</a><a href="#${d}">${t.nav[3]}</a>
    </nav>` : '<span class="nav" aria-hidden="true"></span>'
  return `<a class="skip" href="#main">${t.skip}</a>
${ICONS.replace(/(\.\d+)(?=\.\d)/g, '$1 ')}
<header class="top" id="top">
  <div class="wrap">
    <a class="brand" href="${t.path}" aria-label="Muhr">${sealSvg('mk', 'mark')}<span>Muhr</span></a>
    ${nav}
    <div class="tools">
      <div class="lang" role="group" aria-label="${t.langLabel}">${langSwitch(t.lang)}</div>
      <button class="icon-btn" type="button" id="theme" aria-label="${t.theme}"><svg class="ic-sun"><use href="#i-sun"/></svg></button>
      <a class="icon-btn gh-link" href="${GH}" aria-label="GitHub"><svg><use href="#i-gh"/></svg></a>
      ${home ? `<button class="icon-btn menu-btn" type="button" id="menu" aria-expanded="false" aria-controls="nav" aria-label="${t.menu}"><svg><use href="#i-menu"/></svg></button>` : ''}
    </div>
  </div>
</header>`
}
function footer (t) {
  const f = t.foot
  return `<footer class="foot">
  <div class="wrap">
    <div class="by">${sealSvg('ft', 'mark')}<div><p>${f.by}</p><p>${f.byP}</p></div></div>
    <div><h2>${f.proj}</h2><ul>
      <li><a href="https://wonmor.io">${f.wonmor}</a></li>
      <li><a href="https://sanad.wonmor.io">${f.sanad}</a></li>
      <li><a href="https://shaffof.wonmor.io">${f.shaffof}</a></li>
    </ul></div>
    <div><h2>${f.src}</h2><ul>
      <li><a href="${GH}">${f.gh}</a></li>
      <li><a href="${GH}/tree/main/docs/research">${f.docs}</a></li>
      <li><a href="${GH}/blob/main/docs/PLAN.md">${f.plan}</a></li>
      <li><a href="${GH}/issues">${f.issues}</a></li>
    </ul></div>
    <div class="fine"><span>© 2026 Wonmor · Apache-2.0</span><span>${f.fine}</span></div>
  </div>
</footer>`
}

function home (t) {
  const [idP, idH, idD, idR, idW, idO, idS] = t.ids
  const tick = (cls, icon) => `<svg class="${cls}"><use href="#${icon}"/></svg>`
  const figs = [FIG.hash, FIG.log, FIG.btc, FIG.receipt, FIG.verify]
  const seal = (id) => sealSvg(id, 'sealdot')
  return `${head(t, t.path)}
<body>
${header(t, true)}
<main id="main">
  <section class="hero" aria-labelledby="h1">
    <div class="wrap">
      <div class="hero-copy">
        <span class="chip"><i></i>${t.status}</span>
        <h1 id="h1">${t.h1}</h1>
        <p class="lead">${t.lead}</p>
        <div class="cta">
          <a class="btn primary magnet" href="#${idD}">${t.try}<svg><use href="#i-arrow"/></svg></a>
          <a class="btn" href="${GH}"><svg><use href="#i-gh"/></svg>${t.follow}</a>
        </div>
        <p class="vow">${t.vow.map(v => `<span>${v}</span>`).join('')}</p>
      </div>
      <div class="stage" id="stage">
        <canvas id="seal" aria-hidden="true" data-file="${t.canvas.file}" data-log="${t.canvas.log}" data-btc="${t.canvas.btc}" data-sample="${t.canvas.sample}"></canvas>
        ${sealSvg('fb', 'fallback')}
        <p class="sr-only">${t.stageDesc}</p>
        <span class="stage-note" aria-hidden="true">${t.stageNote}</span>
        <ul class="steps" aria-label="${t.stageNote}">${t.steps.map((s, i) => `<li><button type="button" data-step="${i}" aria-pressed="${i === 0}"><b>${i + 1}</b>${s}</button></li>`).join('')}</ul>
      </div>
    </div>
  </section>

  <section class="sec" id="${idP}" aria-labelledby="${idP}-h">
    <div class="wrap">
      <div class="sec-head rv"><div><span class="kicker">${t.p.k}</span><h2 id="${idP}-h">${t.p.h}</h2></div><p>${t.p.sub}</p></div>
      <div class="proof-sheet rv">
        <div class="proof-col yes">
          <h3>${tick('', 'i-yes')}${t.p.yes}</h3>
          <ul class="plist">${t.p.yi.map(([a, b]) => `<li>${tick('', 'i-yes')}<div><strong>${a}</strong><span>${b}</span></div></li>`).join('')}</ul>
          <div class="fp-demo">
            <label for="fp-in">${t.p.fpL}</label>
            <div class="fp-row"><input id="fp-in" type="text" value="${t.canvas.sample}" autocomplete="off" spellcheck="false"></div>
            <p class="fp-hash" id="fp-out" aria-live="polite"></p>
            <p class="fp-note">${t.p.fpNote}</p>
          </div>
        </div>
        <div class="proof-col no">
          <h3>${tick('', 'i-no')}${t.p.no}</h3>
          <ul class="plist">${t.p.ni.map(([a, b]) => `<li>${tick('', 'i-no')}<div><strong>${a}</strong><span>${b}</span></div></li>`).join('')}</ul>
        </div>
      </div>
    </div>
  </section>

  <section class="sec" id="${idH}" aria-labelledby="${idH}-h">
    <div class="wrap">
      <div class="sec-head rv"><div><span class="kicker">${t.h.k}</span><h2 id="${idH}-h">${t.h.h}</h2></div><p>${t.h.sub}</p></div>
      <ol class="flow">${t.h.s.map(([n, d, st, lab], i) => `<li><div class="fig">${figs[i]}</div><h3>${n}</h3><p>${d}</p><span class="chip ${st}">${st === 'now' ? lab : t.r.soon}</span></li>`).join('')}</ol>
      <p class="offline-line rv">${tick('', 'i-lock').replace('<svg class="">', '<svg width="22" height="22" aria-hidden="true">')}<span>${t.h.off}</span></p>
    </div>
  </section>

  <section class="sec" id="${idD}" aria-labelledby="${idD}-h">
    <div class="wrap">
      <div class="sec-head rv"><div><span class="kicker">${t.d.k}</span><h2 id="${idD}-h">${t.d.h}</h2></div><p>${t.d.sub}</p></div>
      <div class="demo" id="demo">
        <div class="pane">
          <div class="tabs" role="tablist" aria-label="${t.d.k}">
            <button type="button" role="tab" id="tab-stamp" aria-selected="true" aria-controls="demo-panel">${t.d.tabs[0]}</button>
            <button type="button" role="tab" id="tab-cmp" aria-selected="false" aria-controls="demo-panel" tabindex="-1">${t.d.tabs[1]}</button>
          </div>
          <div id="demo-panel" role="tabpanel" aria-labelledby="tab-stamp">
            <div class="drop" id="drop">
              <label class="sr-only" for="d-text">${t.d.input}</label>
              <textarea id="d-text" spellcheck="false">${t.canvas.sample}</textarea>
              <div class="file-row">
                <label class="file-btn" for="d-file">${tick('', 'i-file').replace('<svg class="">', '<svg width="16" height="16" aria-hidden="true">')}${t.d.file}</label>
                <input class="sr-only" type="file" id="d-file">
                <span class="file-name" id="d-fname">${t.d.drop}</span>
              </div>
            </div>
            <label class="opt" id="opt-salt"><input type="checkbox" id="d-salt"><span>${t.d.salt}<small>${t.d.saltNote}</small></span></label>
            <div class="cmp" id="cmp">
              <label for="d-expect">${t.d.cmpL}</label>
              <input id="d-expect" type="text" inputmode="text" autocomplete="off" spellcheck="false" placeholder="${t.d.cmpPh}">
              <p class="verdict" id="verdict" role="status"></p>
            </div>
          </div>
        </div>
        <div class="pane" aria-live="polite">
          <div class="hash-meta"><span>${t.d.meta}</span><button class="copy" type="button" id="copy">${t.d.copy}</button></div>
          <div class="grid64" id="grid" aria-hidden="true"></div>
          <p class="sr-only" id="hash-sr"></p>
          <div class="receipt-title"><strong>.muhr.json</strong><span class="chip soon">${t.d.rChip}</span></div>
          <div class="receipt">${sealSvg('rc', 'mini-seal')}<pre id="receipt"></pre></div>
          <p class="demo-foot">${tick('', 'i-lock')}<span>${t.d.foot}</span></p>
        </div>
      </div>
    </div>
  </section>

  <section class="sec" id="${idW}" aria-labelledby="${idW}-h">
    <div class="wrap">
      <div class="sec-head rv"><div><span class="kicker">${t.w.k}</span><h2 id="${idW}-h">${t.w.h}</h2></div><p>${t.w.sub}</p></div>
      <div class="aud">
        <article class="rv"><div class="head"><h3>${t.w.a[0][0]}</h3><span class="chip soon">${t.w.a[0][2]}</span></div><p>${t.w.a[0][1]}</p>
          <div class="mock">${['release-x64.msi', 'release_amd64.deb', 'release-universal.pkg', 'SHA256SUMS'].map((n, i) => `<div class="row">${seal('a' + i)}<span class="nm">${n}</span><span class="h">${t.w.st}</span></div>`).join('')}</div></article>
        <article class="rv"><div class="head"><h3>${t.w.a[1][0]}</h3><span class="chip soon">${t.w.a[1][2]}</span></div><p>${t.w.a[1][1]}</p>
          <div class="mock mock-doc"><div class="lines"><span></span><span></span><span></span><span></span></div>${sealSvg('dc', '')}</div></article>
        <article class="rv"><div class="head"><h3>${t.w.a[2][0]}</h3><span class="chip soon">${t.w.a[2][2]}</span></div><p>${t.w.a[2][1]}</p>
          <div class="mock"><div class="row">${seal('b1')}<span class="nm">${t.w.v1}</span><span class="h">9f2c…a07e</span></div><div class="row">${tick('sealdot', 'i-no')}<span class="nm">${t.w.v2}</span><span class="h">41d8…3b10</span></div></div></article>
        <article class="rv"><div class="head"><h3>${t.w.a[3][0]}</h3><span class="chip soon">${t.w.a[3][2]}</span></div><p>${t.w.a[3][1]}</p>
          <div class="mock mock-api">POST /stamp   {"hash": "9f2c…a07e"}
GET  /proof/9f2c…a07e   → .muhr.json</div></article>
      </div>
    </div>
  </section>

  <section class="sec" id="${idO}" aria-labelledby="${idO}-h">
    <div class="wrap">
      <div class="sec-head rv"><div><span class="kicker">${t.o.k}</span><h2 id="${idO}-h">${t.o.h}</h2></div><p>${t.o.sub}</p></div>
      <div class="std rv">${STD.map(([n, u], i) => `<a href="${u}"><span class="t">${n}</span><span class="d">${t.o.std[i]}</span><span class="x">${t.o.read} ↗</span></a>`).join('')}</div>
      <div class="repos">${t.o.repos.map(([n, d], i) => `<div class="repo rv"><code>${n}</code><p>${d}</p><div class="meta"><span class="chip">${LICS[i]}</span><span class="chip soon">${t.o.planned}</span></div></div>`).join('')}</div>
    </div>
  </section>

  <section class="sec" id="${idR}" aria-labelledby="${idR}-h">
    <div class="wrap">
      <div class="sec-head rv"><div><span class="kicker">${t.r.k}</span><h2 id="${idR}-h">${t.r.h}</h2></div><p>${t.r.sub}</p></div>
      <ol class="road rv">${t.r.items.map(([n, d], i) => `<li${i === 0 ? ' class="cur"' : ''}><span class="w">${t.r.w} ${i * 2 + 1}–${i * 2 + 2}</span><h3>${n}</h3><p>${d}</p><span class="chip soon">${t.r.soon}</span></li>`).join('')}</ol>
      <div class="later">${t.r.l.map(([n, d]) => `<div class="rv"><h3>${n}</h3><p>${d}</p><span class="chip">${t.r.later}</span></div>`).join('')}</div>
    </div>
  </section>

  <section class="sec" id="${idS}" aria-labelledby="${idS}-h">
    <div class="wrap status">
      <div class="rv"><span class="kicker">${t.s.k}</span><h2 id="${idS}-h">${t.s.h}</h2><p class="status-sub">${t.s.sub}</p><p class="warnbox">${t.s.warn}</p></div>
      <dl class="ledger rv">${t.s.rows.map(([a, b, c]) => `<div><dt>${a}</dt><dd class="${c}">${b}</dd></div>`).join('')}</dl>
    </div>
  </section>

  <section class="final">
    <div class="wrap">
      ${sealSvg('fn', 'big-seal')}
      <h2 class="rv">${t.f.h}</h2>
      <p class="rv">${t.f.p}</p>
      <div class="cta"><a class="btn primary" href="${GH}/issues"><svg><use href="#i-gh"/></svg>${t.f.issue}</a><a class="btn" href="${GH}/blob/main/docs/PLAN.md">${t.f.plan}</a></div>
    </div>
  </section>
</main>
${footer(t)}
<script src="/assets/seal.js?v=${VER}" defer></script>
</body>
</html>
`
}

function notFound () {
  const t = L.uz, e = L.en, r = L.ru
  return `${head(t, '/404.html', 'Sahifa topilmadi · Page not found — Muhr').replace('<meta property="og:type"', '<meta name="robots" content="noindex">\n<meta property="og:type"')}
<body>
${header(t, false)}
<main id="main" class="nf">
  <div class="wrap">
    ${sealSvg('nf', '')}
    <h1>${t.nf.h}</h1>
    <p>${t.nf.p}</p>
    <p class="nf-alt" lang="en">${e.nf.h} ${e.nf.p}</p>
    <p class="nf-alt" lang="ru">${r.nf.h} ${r.nf.p}</p>
    <div class="cta"><a class="btn primary" href="/">${t.nf.back}</a><a class="btn" href="/en/" lang="en">${e.nf.back}</a><a class="btn" href="/ru/" lang="ru">${r.nf.back}</a></div>
  </div>
</main>
${footer(t)}
</body>
</html>
`
}

function out (rel, html) {
  const p = join(ROOT, rel)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, html.replace(/\r\n/g, '\n'), 'utf8')
  console.log('wrote', rel, html.length)
}
out('index.html', home(L.uz))
out('en/index.html', home(L.en))
out('ru/index.html', home(L.ru))
out('404.html', notFound())
writeFileSync(join(ROOT, 'favicon.svg'), `<!-- ${SPDX} -->\n` + sealSvg('fv', '', 'Muhr').replace('class=""', 'xmlns="http://www.w3.org/2000/svg"'), 'utf8')
console.log('wrote favicon.svg')
