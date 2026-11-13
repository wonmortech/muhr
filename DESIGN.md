# Muhr: design direction

```
Subject noun:      a wax seal pressed onto a sheet of paper, and the hash that chains it into a Bitcoin block
States:            file (paper sheet) -> hash (the text dissolves into 64 hex digits) -> stamp (wax drops,
                   spreads, the hash becomes the embossed rim) -> anchored (the seal links into a Merkle
                   branch and a block; a receipt slides out)
Register:          product, with the calm of a notary's desk (serif display, mono for hashes)
Accent:            #b4302a sealing-wax red (light), #de5d50 (dark). Used on the seal, the primary
                   button and the "now" step only
Type:              display Source Serif 4 / body Hanken Grotesk + Onest (Cyrillic) / data JetBrains Mono.
                   All three cover Latin, Latin-ext (Uzbek oʻ gʻ, U+02BB/02BC) and Cyrillic
Signature:         canvas 2D hero: procedural wax seal with cursor-lit relief, hash glyphs flowing from
                   the sheet into the rim, then a Merkle branch drawn into a block. Loops slowly (16 s),
                   pauses off screen, one still frame under reduced motion
Second moment:     the in-browser demo: SHA-256 via WebCrypto, the 64 digits ripple on every keystroke,
                   a small seal presses onto the draft receipt; a compare mode that really works offline
Differentiators:   1) proof verifiable without our server, 2) no coin, no custody, 3) honest limits
                   (proves when, not who)
Deliberately off:  coins, 3D tokens, price tickers, countdowns, rainbow gradients, fake counters,
                   testimonials, customer logos, any "notarised / court-proof" promise
```

Ground: ivory paper `#f6f1e7` (light) and warm ink `#14110f` (dark). The hero stays on paper in both
themes, so the seal reads as a physical object.
