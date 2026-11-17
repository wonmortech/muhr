// SPDX-FileCopyrightText: 2026 Wonmor and Muhr contributors
// SPDX-License-Identifier: Apache-2.0

/* Fictional, deterministic sample data for the concept demo. Every name, file, project and number here is
   invented. Times are relative to the moment the page loads, so the demo never goes stale. */

export const HOUR = 3600e3, DAY = 24 * HOUR;
export const LOG_ORIGIN = 'demo.muhr.example/log';
export const DAYS = 60;
export const TOTAL = 1284;

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const randHex = (r, bytes = 32) => { let s = ''; for (let i = 0; i < bytes; i++) s += ('0' + Math.floor(r() * 256).toString(16)).slice(-2); return s; };

export const SOURCES = {
  web: 'Veb sahifa', cli: 'CLI', action: 'GitHub Action', bot: 'Telegram bot', api: 'API',
};
export const CALENDARS = ['kalendar-1', 'kalendar-2', 'kalendar-3'];

/* Sample documents with real content, so the verifier can be tried on actual bytes. */
export const SAMPLES = {
  contract: {
    name: 'Ijara-shartnomasi-Chilonzor-14.txt',
    text: 'IJARA SHARTNOMASI No 14\nToshkent shahri, Chilonzor tumani\n\nIjaraga beruvchi: Rustamov Jasur Akmalovich (namuna)\nIjarachi: "Bogʻbon Media" MChJ (namuna)\nObyekt: 2-qavat, 48 kv.m ofis xonasi\nOylik toʻlov: 6 500 000 soʻm\nMuddat: 12 oy\n\nUshbu matn Muhr konsept demosi uchun toʻqib chiqarilgan.\n',
  },
  article: {
    name: 'maqola-ochiq-kod-va-ishonch.md',
    text: '# Ochiq kod va ishonch\n\nRelizni kim yasaganini imzo aytadi. Qachon mavjud boʻlganini esa vaqt tamgʻasi aytadi.\nBu maqola Muhr konsept demosi uchun yozilgan namuna matn.\n',
  },
  salted: {
    name: 'ixtiro-gʻoyasi-qoralama.txt',
    text: 'Gʻoya: quyosh panellarini changdan tozalaydigan kichik robot.\nQoralama, 3-versiya. Muhr demosi uchun namuna matn.\n',
    salt: '5f1e9c7a2b4d8e60c3a1f0b9d7e25c48',
  },
};

const FILES = [
  ['Ijara-shartnomasi-Chilonzor-14.pdf.p7s', 'p7s', 214e3], ['Dalolatnoma-2026-10.pdf.p7s', 'p7s', 186e3], ['Hisobot-3-chorak.pdf.p7s', 'p7s', 1.9e6],
  ['kitobxon-2.4.1-win-x64.msi', 'msi', 48.2e6], ['kitobxon-2.4.1-linux-amd64.tar.gz', 'tar', 39.7e6], ['SHA256SUMS', 'txt', 612],
  ['Maqola-ochiq-kod-va-ishonch.md', 'md', 9.4e3], ['Diplom-ishi-Karimova-D.pdf', 'pdf', 3.2e6], ['Tender-taklifi-LOT-17.zip', 'zip', 22.6e6],
  ['Smeta-Sergeli-maktab-5.xlsx', 'xlsx', 410e3], ['Patent-talabnoma-qoralama.docx', 'docx', 96e3], ['Intervyu-xom-yozuv.mp4', 'mp4', 1.24e9],
  ['ochiq-xarita-tiles-2026.11.tar.gz', 'tar', 312e6], ['Foto-dalil-001.jpg', 'jpg', 4.1e6], ['Logo-final-v3.png', 'png', 880e3],
  ['Mehnat-shartnomasi-Toshmatov.pdf.p7s', 'p7s', 240e3], ['Yigʻilish-bayonnomasi-2026-11-03.pdf', 'pdf', 520e3], ['Kod-arxivi-v1.0.0.zip', 'zip', 14.8e6],
  ['Narxnoma-2026-Q4.pdf', 'pdf', 690e3], ['Ilmiy-maqola-preprint.pdf', 'pdf', 2.7e6], ['Ovoz-yozuvi-kelishuv.m4a', 'm4a', 18.4e6],
  ['Dizayn-maket-bosh-sahifa.fig', 'fig', 6.6e6], ['tilchi-lugʻat-1.4.0.tar.gz', 'tar', 5.3e6], ['Kvitansiya-toʻlov-1187.pdf', 'pdf', 140e3],
  ['Yetkazib-berish-shartnomasi-0921.pdf.p7s', 'p7s', 262e3], ['Kurs-ishi-Abdullayev-B.pdf', 'pdf', 1.6e6], ['kitobxon-2.4.0-win-x64.msi', 'msi', 48.0e6],
  ['Bosh-reja-eskiz-Yakkasaroy.png', 'png', 2.2e6], ['Ichki-buyruq-47.pdf.p7s', 'p7s', 158e3], ['Podkast-12-son.mp3', 'mp3', 42.5e6],
  ['Tadqiqot-maʼlumotlari-2026.csv', 'csv', 7.9e6], ['Muqova-dizayni-v5.png', 'png', 3.4e6], ['Kelishuv-protokoli-Samarqand.pdf.p7s', 'p7s', 301e3],
  ['sanoq-hisob-cli-0.9.0.tar.gz', 'tar', 8.8e6], ['Hakaton-loyiha-taqdimoti.pdf', 'pdf', 5.1e6], ['Dalolatnoma-2026-09.pdf.p7s', 'p7s', 175e3],
  ['Qoʻlyozma-roman-3-bob.docx', 'docx', 214e3], ['Suratlar-arxivi-oktabr.zip', 'zip', 96e6], ['Litsenziya-shartnomasi-dastur.pdf', 'pdf', 380e3],
  ['Audit-hisoboti-2025.pdf.p7s', 'p7s', 2.4e6], ['yoʻlchi-router-3.1.0.tar.gz', 'tar', 11.2e6], ['Arizalar-roʻyxati-noyabr.xlsx', 'xlsx', 120e3],
  ['Maqola-tuzli-hash-nima.md', 'md', 7.1e3], ['Foto-dalil-002.jpg', 'jpg', 3.8e6],
];
// extra names for the newest receipts (still waiting for Bitcoin), added by app.js
export const RECENT = ['Shartnoma-loyihasi-v7.docx', 'Kod-arxivi-v1.1.0.zip', 'Foto-dalil-003.jpg', 'Bayonnoma-2026-11-17.pdf', 'Maqola-qoralama-2.md', 'Smeta-yangilangan.xlsx', 'Eskiz-logo-v4.png', 'Ovoz-yozuvi-uchrashuv.m4a'];
const SIGNERS = [
  ['Rustamov Jasur Akmalovich', '"Bogʻbon Media" MChJ'], ['Karimova Dilnoza Baxtiyorovna', 'Yakka tartibdagi tadbirkor'],
  ['Toshmatov Sardor Ilhomovich', '"Yashil Vodiy Agro" MChJ'], ['Yusupova Malika Rustamovna', '"Navoiy Kitob Uyi" MChJ'],
];
const TAGS = ['shartnoma', 'reliz', 'maqola', 'dalil', 'hisobot', 'dizayn', 'ilmiy', 'tender'];

/* The whole public log, newest last: TOTAL entries over DAYS days, about one an hour, busier in the day. */
export function seed(now) {
  const r = rng(20261117);
  const start = now - DAYS * DAY;
  const times = [];
  let t = start;
  for (let i = 0; i < TOTAL; i++) {
    const d = new Date(t);
    const hourOfDay = d.getHours();
    const busy = hourOfDay >= 9 && hourOfDay <= 19 ? 0.55 : 1.9;
    t += (DAY * DAYS / TOTAL) * busy * (0.25 + r() * 1.05);
    times.push(t);
  }
  // squeeze to end ~7 minutes ago
  const span = times[times.length - 1] - start, want = now - 7 * 60e3 - start;
  for (let i = 0; i < times.length; i++) times[i] = start + (times[i] - start) * want / span;

  const sources = ['web', 'web', 'web', 'cli', 'cli', 'action', 'action', 'bot', 'bot', 'api'];
  const entries = times.map((at, i) => ({ index: i, at, data: randHex(r), source: sources[Math.floor(r() * sources.length)] }));

  // Our receipts ("on this device"): 46 entries spread over the log, including the three samples with real bytes.
  const mine = [];
  const picks = new Set();
  const addPick = (i) => { while (picks.has(i)) i++; picks.add(i); return i; };
  const spread = [];
  for (let k = 0; k < 40; k++) spread.push(Math.floor(30 + (TOTAL - 60) * Math.pow(k / 39, 0.8)));
  spread.push(TOTAL - 1, TOTAL - 3, TOTAL - 9, TOTAL - 16, TOTAL - 22, TOTAL - 41);
  spread.forEach((i, k) => {
    const idx = addPick(i);
    const f = FILES[k % FILES.length];
    const signer = f[1] === 'p7s' ? SIGNERS[k % SIGNERS.length] : null;
    const src = f[1] === 'msi' || f[1] === 'tar' || f[0] === 'SHA256SUMS' ? 'action' : ['web', 'bot', 'cli', 'web', 'api'][k % 5];
    entries[idx].source = src;
    mine.push({
      id: 'r' + (1000 + k), index: idx, name: f[0],
      type: f[1], size: Math.round(f[2] * (0.8 + r() * 0.4)), source: src, salted: k % 11 === 4,
      tag: TAGS[k % TAGS.length], signer, upgraded: k % 9 !== 7, note: k % 6 === 0 ? 'Mijozga yuborildi' : '',
    });
  });

  // Samples: put their real file hashes into chosen log slots.
  const sampleSlots = { contract: 1031, article: 712, salted: 1188 };
  for (const [key, idx] of Object.entries(sampleSlots)) {
    const smp = SAMPLES[key];
    const bytes = new TextEncoder().encode(smp.text);
    const data = smp.salt ? globalThis.MuhrCore.shaJs(withSalt(hexBytes(smp.salt), bytes)) : globalThis.MuhrCore.shaJs(bytes);
    const at = mine.findIndex((m) => m.index === idx);
    if (at >= 0) mine.splice(at, 1);
    picks.add(idx);
    entries[idx].data = data;
    entries[idx].source = key === 'article' ? 'cli' : 'web';
    mine.push({ id: 'r-' + key, index: idx, name: smp.name, type: smp.name.split('.').pop(), size: bytes.length, source: entries[idx].source,
      salted: !!smp.salt, salt: smp.salt, tag: key === 'article' ? 'maqola' : key === 'salted' ? 'ilmiy' : 'shartnoma', signer: null, upgraded: true, sample: key, note: 'Namuna: haqiqiy baytlar bilan tekshirsa boʻladi' });
  }
  mine.sort((a, b) => b.index - a.index);

  // Open-source releases stamped by the GitHub Action (fictional projects).
  const releases = [
    ['kitobxon/reader', 'v2.4.1', 6], ['kitobxon/reader', 'v2.4.0', 6], ['ochiq-xarita/tiles', '2026.11', 3], ['ochiq-xarita/tiles', '2026.10', 3],
    ['tilchi/lugat', 'v1.4.0', 4], ['tilchi/lugat', 'v1.3.2', 4], ['sanoq/hisob-cli', 'v0.9.0', 8], ['sanoq/hisob-cli', 'v0.8.3', 8],
    ['yoʻlchi/router', 'v3.1.0', 5], ['bozor-api/sdk-js', 'v5.2.1', 2], ['bozor-api/sdk-js', 'v5.2.0', 2], ['ilm-uz/korpus', '2026-q3', 1],
    ['kitobxon/reader', 'v2.3.9', 6], ['tilchi/lugat', 'v1.3.1', 4], ['yoʻlchi/router', 'v3.0.4', 5], ['sanoq/hisob-cli', 'v0.8.2', 8],
  ].map(([repo, tag, files], i) => ({ repo, tag, files, at: now - (i * 3.7 + 0.4) * DAY, index: Math.max(0, TOTAL - 5 - i * 74) }));

  const monitors = [
    { name: 'Mustaqil kuzatuvchi A', who: 'universitet laboratoriyasi (toʻqima)', lag: 9 * 60e3, ok: true },
    { name: 'Kuzatuvchi B', who: 'hamjamiyat koʻngillisi (toʻqima)', lag: 52 * 60e3, ok: true },
    { name: 'Kuzatuvchi C', who: 'jurnalist tashkiloti (toʻqima)', lag: 26 * HOUR, ok: false, note: 'oxirgi tekshiruv 26 soat oldin: kuzatuvchi oflayn' },
  ];
  return { entries, mine, releases, monitors };
}

export function hexBytes(hex) { const o = new Uint8Array(hex.length / 2); for (let i = 0; i < o.length; i++) o[i] = parseInt(hex.substr(i * 2, 2), 16); return o; }
export function withSalt(salt, data) { const m = new Uint8Array(salt.length + data.length); m.set(salt); m.set(data, salt.length); return m; }

/* Bitcoin heights here are illustrative: one block every ten minutes back from a fixed fictional height. */
export const heightAt = (now, t) => 925400 - Math.floor((now - t) / 600e3);
