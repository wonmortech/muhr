# Manbalar: standartlar, spetsifikatsiyalar, maqolalar, qonunlar

> Har bir havola **2026-11-13** da ochib tekshirilgan. Yoʻnaltirilgan (redirect) havolalar uchun joriy manzil berilgan. Ochilmagani **(tasdiqlanmadi)** deb belgilangan.

## 1. Vaqt tamgʻasi va anchoring

| Manba | Havola | Nima uchun kerak |
|---|---|---|
| **OpenTimestamps** sayti | https://opentimestamps.org/ | Asosiy anchoring standarti; "The hash is calculated on your browser" naqshi |
| `opentimestamps-client` | https://github.com/opentimestamps/opentimestamps-client | `ots stamp/verify`; LGPL-3.0-or-later, v0.8.0 (2026-10-27). Muhr uni alohida jarayon sifatida chaqiradi |
| Peter Todd, *OpenTimestamps: Scalable, Trust-Minimized, Distributed Timestamping with Bitcoin* (2016-09-15) | https://petertodd.org/2016/opentimestamps-announcement | Isbot faqat **vaqtni** koʻrsatadi (muallif, haqiqiylik yoki yagonalikni emas); kalendarlar xizmatdan bosh tortishi mumkin, lekin isbotni soxtalashtira olmaydi |
| **RFC 3161**, Time-Stamp Protocol (TSP), 2001-08 | https://www.rfc-editor.org/rfc/rfc3161 | Rasmiy vaqt tamgʻasi formati. Muhr uning oʻrnini bosmaydi; v1 dan keyin yoniga qoʻshish mumkin |
| FreeTSA (RFC 3161 xizmati) | https://freetsa.org/index_en.php | Bepul TSA; taqqoslash va sinov uchun |
| IETF draft, *Umarise's Bitcoin-Anchored Temporal Proofs* (draft-fassbender-scitt-time-anchor-08, 2026-10-23, Independent Submission, IETF tomonidan maʼqullanmagan) | https://datatracker.ietf.org/doc/draft-fassbender-scitt-time-anchor/ | Bitcoinʼga bogʻlangan vaqt isbotini SCITT bilan birlashtirish urinishi; kuzatib boriladi |
| Haber & Stornetta, *How to time-stamp a digital document*, Journal of Cryptology | https://doi.org/10.1007/BF00196791 | Hash zanjiri bilan vaqt tamgʻasining asos maqolasi (yil sahifadan alohida tekshirilmadi; odatda 1991 deb keltiriladi) |

## 2. Shaffoflik jurnallari (Merkle log)

| Manba | Havola | Nima uchun kerak |
|---|---|---|
| **RFC 6962**, Certificate Transparency (2013-06, experimental) | https://www.rfc-editor.org/rfc/rfc6962 | Merkle jurnal, inclusion va consistency proof gʻoyasining asosi |
| **RFC 9162**, Certificate Transparency Version 2.0 (2021-12) | https://www.rfc-editor.org/rfc/rfc9162 | Muhr jurnali formati shu uslubda boʻladi |
| Certificate Transparency loyihasi | https://certificate.transparency.dev | Ishlab turgan ekotizim misoli |
| transparency.dev | https://transparency.dev | "Trust your data with a tamper-evident log": dizayn va kutubxonalar |
| Tessera (Go, Apache-2.0, v1.0.4) | https://github.com/transparency-dev/tessera | Oʻz jurnalimiz uchun nomzod kutubxona |
| Trillian (Apache-2.0, v1.8.0, "maintenance mode") | https://github.com/google/trillian | Tarixiy maʼlumot; yangi jurnal uchun tavsiya etilmaydi |
| **Sigstore** hujjatlari | https://docs.sigstore.dev | Rekor va imzo oqimi |
| Sigstore Rekor (Apache-2.0, v1.6.1, 2026-11-11) | https://github.com/sigstore/rekor | 2-bosqichda jurnal ildizlarini ikkinchi jurnalga yozish |
| Crosby & Wallach, *Efficient Data Structures for Tamper-Evident Logging*, USENIX Security 2009 | https://www.usenix.org/conference/usenixsecurity09/technical-sessions/presentation/efficient-data-structures-tamper-evident | Tamper-evident jurnal nazariyasi |
| IETF SCITT ishchi guruhi | https://datatracker.ietf.org/wg/scitt/about/ | Supply-chain shaffofligi standartlari |
| **RFC 9943**, *An Architecture for Trustworthy and Transparent Digital Supply Chains* (2026-06, Proposed Standard; avvalgi draft-ietf-scitt-architecture) | https://datatracker.ietf.org/doc/rfc9943/ | Muhr jurnalini SCITT atamalari bilan tasvirlash uchun |

## 3. Hash, imzo va brauzer

| Manba | Havola | Nima uchun kerak |
|---|---|---|
| **FIPS 180-4**, Secure Hash Standard (SHA-256) | https://csrc.nist.gov/pubs/fips/180-4/upd1/final | Hash algoritmi |
| **RFC 5652**, Cryptographic Message Syntax (CMS), STD 70, 2009-09 | https://www.rfc-editor.org/rfc/rfc5652 | PKCS#7 / EIMZO imzo tuzilmasini oʻqib koʻrsatish |
| W3C, *Web Cryptography Level 2* (First Public Working Draft, 2025-04-22) | https://www.w3.org/TR/webcrypto/ | Brauzerda `crypto.subtle.digest('SHA-256')` |

## 4. Supply chain va kelib chiqish (provenance)

| Manba | Havola | Nima uchun kerak |
|---|---|---|
| SLSA | https://slsa.dev | Reliz kelib chiqishi darajalari |
| in-toto | https://in-toto.io | Attestatsiya modeli |
| GitHub artifact attestations | https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations | `muhr-action` qanday yonma-yon ishlashi |
| C2PA spetsifikatsiyasi (joriy 2.5) | https://spec.c2pa.org | Media kelib chiqishi; maqola va rasmlar uchun keyinchalik |

## 5. Oʻqilgan maqolalar (dizayn qarorlariga taʼsir qilgan)

| Manba | Havola | Saboq |
|---|---|---|
| Ink & Switch, *Local-first software* (2019) | https://www.inkandswitch.com/essay/local-first/ | Maʼlumot egaligining koʻp qismi blokcheynsiz ham beriladi; zanjir faqat ommaviy vaqt uchun |
| Moxie Marlinspike, *My first impressions of web3* (2022-01-07) | https://moxie.org/2022/01/07/web3-first-impressions.html | Mijoz tomonida tekshirish, kontentni hash bilan bogʻlash, markazlashgan joyni ochiq aytish |
| Molly White, *It's not still the early days* (2022-01-14) | https://blog.mollywhite.net/its-not-still-the-early-days/ | Har funksiya blokcheynsiz muqobilidan bugunoq yaxshiroq boʻlishi kerak |
| W3C, *Verifiable Credentials Data Model 2.0* (Recommendation, 2025-05-15) | https://www.w3.org/TR/vc-data-model-2.0/ | Sanad bilan umumiy yadro; blokcheyn ixtiyoriy |

> Yuqoridagi 4 ta maqola manzillari Wonmor web3 tadqiqoti (`REPORT.md`, manbalar 63, 66, 67, 71) dan olingan va oʻsha hisobotda 2026-11-13 da ochilgan; bu faylda alohida qayta ochilmagan.

## 6. Oʻzbekiston qonunchiligi

Batafsil tahlil: [legal.md](legal.md).

| Hujjat | Havola | Holat |
|---|---|---|
| **PP-3832** (2018-07-03), raqamli iqtisodiyot va kripto-aktivlar aylanmasi; joriy tahriri PP-143 (2026-04-17) bilan | https://lex.uz/docs/3806048 | Tekshirildi |
| **ZRU-899** (2024-01-19) haqida NAPP xabari (2024-01-20) | https://napp.uz/en/news/o-zbekiston-respublikasi-fuqarolari-diqqatiga | Tekshirildi |
| **ZRU-793** "Elektron raqamli imzo toʻgʻrisida" (2022-10-12, 2023-01-14 dan kuchda) | https://lex.uz/docs/6234906 | Tekshirildi. Mirror saytda ZRU-1158 (2026-07-13) tahriri tilga olingan **(tasdiqlanmadi)** |
| **ZRU-1003** (2024-11-21), raqamli dalillar bilan ishlash tizimini takomillashtirish haqida (alohida "Raqamli dalillar toʻgʻrisida" qonuni emas, oʻzgartirish kirituvchi qonun) | https://lex.uz/docs/7228823 | Tekshirildi |
| **ZRU-547** "Shaxsga doir maʼlumotlar toʻgʻrisida" (2019-07-02), 27¹-modda | https://lex.uz/docs/4396428 | Tekshirildi |
| Vazirlar Mahkamasi qarori No. 589 (2019-07-15), IT park | https://lex.uz/docs/6957374 | Tekshirildi (`lex.uz/en/...` manzili 404 qaytaradi) |
| IT Park rezident talablari | https://www.it-park.uz/en/itpark/residents/requirements | Tekshirildi |
| Telegram, Mini App blokcheyn qoidalari | https://core.telegram.org/bots/blockchain-guidelines | Tekshirildi |
| 4pillars, Oʻzbekiston kripto tartibga solish sharhi (2026-10-05 koʻrib chiqilgan, ikkilamchi) | https://policy.4pillars.io/uzbekistan | Tekshirildi |
| Kun.uz, ERI qonuni imzolandi | https://kun.uz/en/news/2022/10/15/president-signs-law-on-electronic-digital-signature | Tekshirildi |
| Kun.uz, raqamli dalillar qonuni (2024-11-23) | https://kun.uz/en/news/2024/11/23/uzbekistan-adopts-landmark-law-on-digital-evidence | Tekshirildi |
| gov.uz (Yoshlar), "Soxta sertifikatning narxi (jazosi) qancha?" (2024-07-08) | https://gov.uz/en/yoshlar/news/view/15837 | Tekshirildi |
| eIDAS, Regulation (EU) 910/2014 va 2024/1183 | eur-lex | **(tasdiqlanmadi)**: eur-lex sahifalari tekshiruvda ochilmadi, shuning uchun havola berilmadi |
| EY, ERI qonuni sharhi (2023) | — | **Olib tashlandi**: sahifa 410 Gone qaytaradi |
