# Raqobatchilar va muqobillar

> Barcha havolalar **2026-11-13** da ochib tekshirilgan. Narx yoki litsenziya faqat sahifaning oʻzida yozilgan boʻlsa keltirildi; boʻlmasa "koʻrsatilmagan". Ochilmagan yoki tasdiqlanmagan narsa **(tasdiqlanmadi)** deb belgilangan.

## Qisqa xulosa

- **Bitcoinʼga hash bogʻlash** gʻoyasi yangi emas: OpenTimestamps 2016 dan beri bepul ishlaydi. Muhrʼning yangiligi texnologiyada emas, **qatlamda**: EIMZO/PKCS#7 hujjatini koʻrsatish, oʻzbek tilidagi tekshiruvchi, reliz uchun GitHub Action, ochiq Merkle jurnal va halol "nimani isbotlamaydi" bloki.
- Pullik xorijiy xizmatlar (Bernstein, OriginStamp, Woleet, Truestamp) bor, lekin ular mahalliy imzo formatini bilmaydi va tekshirish koʻpincha ularning saytiga bogʻliq.
- Oʻzbekistonda ommaviy RFC 3161 vaqt tamgʻasi xizmati (TSA) **topilmadi**: E-IMZO (`e-imzo.uz` → `e-imzo.soliq.uz`) sahifasida TSA yoki RFC 3161 haqida gap yoʻq, qidiruv ham natija bermadi.

## Jadval

| Nom | Havola | Nima qiladi | Narx / litsenziya | Holat, token | Biz nimani olamiz | Biz qayerda farq qilamiz |
|---|---|---|---|---|---|---|
| **OpenTimestamps** | https://opentimestamps.org/ · [mijoz](https://github.com/opentimestamps/opentimestamps-client) | Hashlarni ochiq kalendarlarda Merkle daraxtiga yigʻib, bitta Bitcoin tranzaksiyasiga bogʻlaydi; isbot `.ots` fayl | Bepul; mijoz LGPL-3.0-or-later, oxirgi reliz v0.8.0 (2026-10-27) | Faol; tokeni yoʻq, Bitcoinʼdan foydalanadi | Asosiy anchoring qatlami: ochiq kalendarlar va `ots` mijozi alohida jarayon sifatida | Biz ustiga jurnal, kvitansiya formati, EIMZO koʻrsatish, oʻzbekcha UX va reliz avtomatikasini qoʻshamiz |
| **Sigstore / Rekor** | https://www.sigstore.dev · [rekor](https://github.com/sigstore/rekor) | Imzolar uchun ochiq shaffoflik jurnali (blokcheynsiz), inclusion proof | Bepul; Apache-2.0, v1.6.1 (2026-11-11); yangi `rekor-tiles` v2.4.2 | Faol; token yoʻq | 2-bosqichda jurnal ildizlarini Rekorʼga ham yozish; jurnal dizayni | Rekor dasturiy imzolar uchun; biz istalgan fayl va mahalliy hujjat uchun, Bitcoin vaqti bilan |
| **GitHub artifact attestations** | [docs](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations) | GitHub Actions orqali build kelib chiqishi (provenance) attestatsiyasi | Hujjatda narx koʻrsatilmagan | Faol; token yoʻq | Reliz oqimida qanday koʻrinishi kerakligi | GitHubʼga bogʻliq; biz GitHubʼsiz ham tekshiriladigan Bitcoin vaqtini beramiz |
| **SLSA** | https://slsa.dev | Supply-chain xavfsizligi darajalari (freymvork, xizmat emas) | Ochiq | Faol | Reliz atamalari va darajalar | Biz freymvork emas, vosita |
| **in-toto** | https://in-toto.io | Supply-chain yaxlitligi freymvorki | Ochiq | Faol | Attestatsiya modeli | Xuddi yuqoridagidek |
| **Trillian / Tessera** | [trillian](https://github.com/google/trillian) · [tessera](https://github.com/transparency-dev/tessera) | Shaffoflik jurnali kutubxonalari | Ikkalasi Apache-2.0; Trillian v1.8.0, README boʻyicha "maintenance mode", Tessera v1.0.4 (2026-07-16) | Tessera faol | Oʻz jurnalimiz uchun Tessera yoki uning formati (Go) | Biz kutubxona emas, tayyor vosita va kvitansiya formati |
| **Certificate Transparency** | https://certificate.transparency.dev | TLS sertifikatlari uchun ochiq jurnallar ekotizimi | Ochiq | Faol | RFC 6962/9162 jurnal va proof formati | Biz sertifikat emas, istalgan hash |
| **FreeTSA** | https://freetsa.org/index_en.php | Bepul RFC 3161 vaqt tamgʻasi xizmati (`/tsr`) | Bepul | Faol; token yoʻq | RFC 3161 tamgʻasini OTS yoniga qoʻshish imkoniyati (v1 dan keyin) | Bitta markaziy TSAʼga ishonch; biz ochiq jurnal va Bitcoin bilan mustaqil tekshirishni qoʻshamiz |
| **OriginStamp** | https://originstamp.com/en/timestamp | Hujjat va maʼlumotlarni Bitcoin va Ethereumʼga bogʻlash; bosh sahifa endi "OriginVault" AI/ERP mahsulotini oldinga suradi | Narx koʻrsatilmagan (bepul sinov, demo) | Faol, lekin yoʻnalishi oʻzgargan; token yoʻq | Mijoz tomonida hash hisoblash naqshi | Yopiq tijorat xizmati; biz ochiq kod va bizsiz tekshirish |
| **Bernstein** | https://www.bernstein.io | Gʻoya va dizayn uchun blokcheyn sertifikatli mavjudlik, egalik, yaxlitlik isboti | `/pricing`: Starter $54/oy, Scale $119/oy, Enterprise $329/oy, bir martalik kredit $64 | Faol; Bitcoin, token yoʻq | Mualliflik ssenariysi va "isbot sertifikati" koʻrinishi | Qimmat va yopiq; biz bepul ommaviy vosita |
| **Woleet** | https://www.woleet.io | Fransuz blokcheyn e-imzo, vaqt tamgʻasi va muhr xizmati; GDPR va eIDAS mosligini daʼvo qiladi | Narx koʻrsatilmagan, 30 kunlik bepul sinov; `/tarifs` 404 | Holati **(tasdiqlanmadi)**, futer © 2024; token yoʻq | eIDAS bilan yonma-yon ishlash tajribasi | Yevropa bozori; biz Oʻzbekiston imzo formati va ochiq kod |
| **Truestamp** | https://www.truestamp.com | Har daqiqada Merkle daraxti, Stellar va Bitcoinʼga bogʻlash | Free, Starter, Pro, Enterprise rejalari bor, narxlar koʻrinmaydi | Faol (© 2026); token yoʻq | Koʻp zanjirli anchoring va API dizayni | Biz faqat Bitcoin + ochiq jurnal, tokenli zanjirlarsiz |
| **ProofSnap** | [OTS maqolasi](https://getproofsnap.com/posts/how-to-verify-opentimestamps-ots-file-bitcoin-blockchain-2026.html) | Brauzer kengaytmasi: veb dalillarni OTS bilan muhrlash; `.ots` tekshirish qoʻllanmasi | Maqolada "Plans from $8.99 per month" | Faol; token yoʻq | Tekshirish yoʻriqnomasi uslubi | Veb skrinshotlar uchun; biz hujjat va relizlar uchun |
| **Chainpoint** | https://chainpoint.org | Maʼlumotni blokcheynga bogʻlash ochiq standarti | Ochiq | Ehtimol toʻxtagan: futer © 2022, oxirgi push 2022-11-01 | Proof formati tarixi | Toʻxtagan loyiha; biz faol va oddiyroq format |
| **Proof of Existence** | https://proofofexistence.com | Hujjat hashini Bitcoinʼga yozish (eng eski xizmatlardan) | **(tasdiqlanmadi)**: sahifa matni ochilmadi | **(tasdiqlanmadi)** | Tarixiy naqsh | Pullik, bitta servisga bogʻliq |
| **Guardtime KSI** | **(tasdiqlanmadi)**: `guardtime.com` domeni ochilmadi | Estoniya hukumati bilan qurilgan hash-daraxt vaqt tamgʻasi tizimi (faqat qidiruv orqali) | **(tasdiqlanmadi)** | **(tasdiqlanmadi)** | Davlat darajasida hash-daraxt ishlatish misoli | Yopiq tijorat tizimi |
| **Ethereum Attestation Service** | https://attest.org | Off-chain va on-chain attestatsiyalar; "Open source. Free to Use. Zero API Keys." | Foydalanish bepul; on-chain yozuvga gas toʻlanadi (sahifada miqdor yoʻq) | Faol; EAS tokeni tilga olinmagan | Off-chain imzo + ixtiyoriy anchor gʻoyasi | EVM gas = kripto toʻlov; bizda foydalanuvchi hech qachon kripto toʻlamaydi |
| **C2PA / Content Authenticity** | https://c2pa.org · https://contentauthenticity.org | Media fayllar uchun kelib chiqish (provenance) manifestlari; joriy spetsifikatsiya 2.5 ([spec.c2pa.org](https://spec.c2pa.org)) | Ochiq standart | Faol | Rasm va maqolalar uchun kelajakda C2PA manifestini koʻrsatish | C2PA "kim yaratdi" deydi; biz "qachon bor edi"ni Bitcoin bilan isbotlaymiz |
| **Arweave** | https://arweave.org | Doimiy maʼlumot saqlash | Sahifada "tokenomic endowment model" | Faol; **token bor** | Hech narsa (qiyos uchun) | Token talab qiladi, bizning tamoyilga zid |
| **Internet Archive (Wayback)** | https://web.archive.org | Veb sahifa nusxasini saqlash | Bepul | **(tasdiqlanmadi)**: tekshiruvda 429 qaytardi | Maqola nusxasi uchun ikkinchi dalil sifatida tavsiya qilish | Markaziy arxivga ishonch; hash va Bitcoin vaqti yoʻq |

## Bizning pozitsiya bir jumlada

OpenTimestamps va ochiq jurnal ustidagi **bepul, ochiq, tangasiz qatlam**: oʻzbek hujjatlari va relizlari uchun, tekshiruvi bizning serverimizga bogʻliq emas.
