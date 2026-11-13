# Muhr

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/16668/badge)](https://www.bestpractices.dev/projects/16668)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/wonmortech/muhr/badge)](https://scorecard.dev/viewer/?uri=github.com/wonmortech/muhr)
[![CI](https://github.com/wonmortech/muhr/actions/workflows/ci.yml/badge.svg)](https://github.com/wonmortech/muhr/actions/workflows/ci.yml)
[![Mozilla Observatory A+](https://img.shields.io/badge/Mozilla_Observatory-A%2B-brightgreen)](https://developer.mozilla.org/en-US/observatory/analyze?host=muhr.wonmor.io)
[![SSL Labs A+](https://img.shields.io/badge/SSL_Labs-A%2B-brightgreen)](https://www.ssllabs.com/ssltest/analyze.html?d=muhr.wonmor.io)

**Proof that a file existed on a given day and has not changed since. No coin, no custody.**

Muhr (Uzbek for *seal*) is a planned open-source tool. It binds the SHA-256 hash of a file to
Bitcoin through [OpenTimestamps](https://opentimestamps.org/) and to an open, append-only
transparency log in the style of [RFC 9162](https://www.rfc-editor.org/rfc/rfc9162). The file can
be an EIMZO-signed document, a software release or an article. Anyone can then check the proof
offline, without our server.

> **Status: planning. Nothing is released yet.** There is no CLI, API or log today. This repository
> holds the research, the plan and the home page. The only working part is the in-browser hash
> demo on the site.

## Why

- A qualified e-signature says **who** signed a document. It does not independently prove **when**
  the file existed.
- Verification that depends on one website is fragile. Fake verification sites are a documented
  problem in Uzbekistan (see [docs/research/legal.md](docs/research/legal.md)).
- Open-source releases and published articles need a public, checkable "these exact bytes, no
  later than this date".

## How verification will work

1. You hash the file locally (browser or CLI). **Only the hash leaves your device.**
2. The hash is appended to an open Merkle log, and you get an inclusion proof.
3. Every hour the log root is timestamped through public OpenTimestamps calendars. A few hours
   later it is committed in a Bitcoin block.
4. You keep a receipt: `.muhr.json` (inclusion proof) plus the `.ots` file.
5. Anyone verifies the receipt with the open `ots` client and Bitcoin block headers. It keeps
   working even if Muhr's server disappears.

What a proof does **not** show: who wrote or signed the file, whether its content is true, or a
notarised date. It is additional, independently checkable evidence. It does not replace an official
RFC 3161 timestamp.

Muhr never holds, sends, sells or issues crypto-assets, and it will never ask for money, keys or
seed phrases.

## Links

- Site: https://muhr.wonmor.io (source in [`site/`](site/), static, no build step)
- Plan: [docs/PLAN.md](docs/PLAN.md)
- Research (Uzbek): [docs/research/](docs/research/README.md): competitors, references, legal
  notes, design inspiration
- Design direction: [DESIGN.md](DESIGN.md)
- Questions and ideas: [GitHub issues](https://github.com/wonmortech/muhr/issues)

## Site development

`site/` is plain HTML, CSS and JS with self-hosted fonts and a strict CSP (no inline scripts, no
third-party requests). The three language pages are generated from one template:

```sh
node tools/pages.mjs   # rewrites site/index.html, site/en/, site/ru/, site/404.html, site/favicon.svg
```

## License

Apache-2.0. The planned `muhr-action` will be MIT and the `.muhr.json` spec CC BY 4.0. Fonts in
`site/fonts/` are under the SIL Open Font License (see the `LICENSE-*.txt` files there).

---

A [Wonmor](https://wonmor.io) project. Sister projects: [Sanad](https://sanad.wonmor.io) and
[Shaffof](https://shaffof.wonmor.io).
