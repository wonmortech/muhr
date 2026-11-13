# Muhr: tadqiqot

> **Holat:** reja bosqichi, kod yoʻq. Sana: 2026-11-13. Bu papka Wonmor web3 tadqiqotining (TOP 3 gʻoya, Muhr 37/40 ball bilan birinchi oʻrin) Muhrʼga tegishli qismini ochiq shaklda beradi. Yuridik maslahat emas.

## Bir paragrafda

Muhr faylning SHA-256 hashini ochiq, faqat qoʻshiladigan Merkle jurnaliga (RFC 9162 uslubida) yozadi va jurnal ildizini OpenTimestamps ochiq kalendarlari orqali Bitcoinʼga bogʻlaydi. Natija `.muhr.json` kvitansiyasi: istalgan odam uni `ots` mijozi va Bitcoin sarlavhalari bilan bizning serverimizsiz tekshiradi. Isbot **qachon** degan savolga javob beradi, **kim** degan savolga emas: muallifni EIMZO (PKCS#7) imzosi koʻrsatadi, Muhr uni faqat koʻrsatadi. Muhr kripto-aktivni ushlamaydi, sotib olmaydi, chiqarmaydi va foydalanuvchidan kripto toʻlov soʻramaydi.

## Nega bu muammo

- ERI imzolagan shaxsni koʻrsatadi, lekin fayl **qachon** mavjud boʻlganini mustaqil isbotlaydigan ochiq vosita yoʻq ([legal.md](legal.md) §1).
- Bitta saytga tayangan tekshiruv zaif: gov.uz sahifasi soxtakorlar haqiqiyga oʻxshash soxta sayt yasab, soxta QR kodiga bogʻlaganini yozadi ([gov.uz, 2024-07-08](https://gov.uz/en/yoshlar/news/view/15837)).
- Oʻzbekistonda ommaviy RFC 3161 vaqt tamgʻasi xizmati topilmadi ([competitors.md](competitors.md)).
- Open-source relizlar va nashr qilingan maqolalar uchun "aynan shu baytlar, shu sanagacha" degan ommaviy dalil kerak.

## Asosiy xulosalar

1. **Texnologiya tayyor va bepul:** OpenTimestamps (LGPL-3.0+, faol) va RFC 9162 / Tessera / Rekor (Apache-2.0). Biz yangi kriptografiya yozmaymiz, qatlam quramiz.
2. **Raqobat:** xorijiy pullik xizmatlar bor (masalan, Bernstein $54/oy dan), lekin hech biri mahalliy imzo formatini va oʻzbek tilini bilmaydi; koʻpi yopiq kod.
3. **Huquqiy yoʻl tor, lekin ochiq:** faqat hash muhrlanadi, kripto aylanmaydi. Yurist yozma tasdiqlashi kerak boʻlgan 7 savol [legal.md](legal.md) §4 da.
4. **Halollik — mahsulotning bir qismi:** "notarial tasdiq emas", "muallifni isbotlamaydi" degan cheklovlar har kvitansiyada va bosh sahifada yoziladi.

## Fayllar

| Fayl | Mazmuni |
|---|---|
| [competitors.md](competitors.md) | 20 ta raqobatchi va muqobil: havola, nima qiladi, narx/litsenziya, nimani olamiz, qayerda farq qilamiz |
| [references.md](references.md) | Standartlar (RFC 3161, 6962, 9162, 5652, 9943, FIPS 180-4, WebCrypto), maqolalar, Oʻzbekiston qonunlari |
| [legal.md](legal.md) | Mumkin / mumkin emas jadvali, manbalar bilan; yurist uchun savollar |
| [inspiration.md](inspiration.md) | Dizayn va mahsulot saytlari: har biridan nima olinadi; qilinmaydigan narsalar |
| [../PLAN.md](../PLAN.md) | Maqsadlar, arxitektura, 8 haftalik MVP, metrikalar, xavflar |

## Tekshirilmagan narsalar

- Guardtime KSI holati (domen ochilmadi), Proof of Existence narxi va holati, Woleet narxlari, Internet Archive (429), eIDAS eur-lex sahifalari.
- ZRU-793 ga ZRU-1158 (2026-07-13) tahriri kiritilgani (faqat mirror saytda koʻrildi).
- ZRU-899 jarima miqdorlari (manbalar bir-biriga zid).
