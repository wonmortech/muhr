# Muhr site: security assurance case

This document explains why we believe the Muhr web site meets its security requirements, what we
did to check that, and what risk is left. It covers the code in this repository as it is today.
Muhr itself (CLI, API, transparency log) is not built yet. When it is, this document will be
extended before those parts are released.

## 1. Scope

In scope:

- `site/`: the static site served at https://muhr.wonmor.io (`/` Uzbek, `/en/`, `/ru/`, `404.html`).
  Plain HTML, CSS and three small classic scripts. No build step, no runtime dependencies, no
  cookies, no analytics, no third-party requests.
- `site/assets/core.js`: the pure logic behind the in-browser demo (SHA-256, hash comparison,
  receipt model, UI strings).
- `site/assets/app.js`, `seal.js`, `theme.js`: page behaviour, hero animation, theme.
- `tools/pages.mjs` (page generator, run by maintainers) and `tools/check-site.mjs` (pre-deploy
  checker, run in CI).
- `deploy/`: the web server configuration (`Caddyfile`) and the release receiver (`receive.sh`).
- `.github/workflows/`: CI (`ci.yml`) and deployment (`deploy.yml`).

Out of scope: the shared TLS edge proxy and the host operating system (operated separately, see
residual risks), GitHub itself, and the visitor's browser and device.

### Security requirements

| ID | Requirement |
| --- | --- |
| R1 | Text or files a visitor puts into the demo never leave the browser. |
| R2 | The hash the demo shows is the correct SHA-256 of the input bytes. |
| R3 | Content of the site cannot be changed by anyone except a reviewed change on `main`. |
| R4 | No script runs on the site except the site's own, unmodified files (no XSS, no third-party code). |
| R5 | The site does not collect personal data and does not publish secrets or internal details. |
| R6 | The site gives no false assurance: it says plainly that the demo is not a proof and that Muhr is not released. |

## 2. Threat model

### Assets

- Integrity of the published pages and scripts (a modified script could exfiltrate the files
  people hash, or show a wrong hash).
- Confidentiality of what visitors hash in the demo (documents, contracts, drafts).
- The deploy credential (an SSH key held as a GitHub Actions secret).
- The reputation of the project: Muhr is about trustworthy verification, so a defaced or
  misleading page does more harm than usual (fake verification sites are a known problem in the
  region, see `docs/research/legal.md`).

### Actors

| Actor | Capability | Goal |
| --- | --- | --- |
| Visitor | Full control of their own browser, inputs, files, `localStorage`, URL | Use the demo; may also probe it |
| Remote attacker | Sends crafted links, frames the site, sits on hostile networks | XSS, clickjacking, stealing what visitors hash, downgrade to HTTP |
| Malicious contributor | Opens pull requests | Sneak in a third-party script, an inline script or a data leak |
| Supply-chain attacker | Compromises a GitHub Action or an npm package | Run code in CI, reach the deploy key |
| Attacker with the deploy key | Can call the release receiver over SSH | Replace the site or get a shell on the server |

### Trust boundaries

```
 visitor's browser  <--TLS-->  edge proxy (TLS, HSTS)  <--->  site container (Caddy, static files)
        |                                                             ^
        | nothing is sent: hashing happens here                       | atomic symlink swap
        v                                                             |
   WebCrypto / pure-JS SHA-256                          release receiver (forced SSH command)
                                                                      ^
                                                                      | tar over SSH, pinned host key
                                                   GitHub Actions deploy job (main only, secret key)
                                                                      ^
                                                       reviewed pull request + required CI check
```

1. **Browser.** Everything the visitor types or chooses is untrusted input to `app.js`. It is
   only ever hashed and written back with `textContent` (see §5). The page makes no request with
   it. `localStorage` holds one value, the theme, and it is read back only if it is exactly
   `light` or `dark`.
2. **Static server.** Caddy serves files from `releases/current` read-only and sets the security
   headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP). It runs
   no application code, so there is no server-side input handling at all.
3. **Edge proxy.** Terminates TLS and adds HSTS and `X-Frame-Options`. The site container is not
   reachable from the internet directly.
4. **CI deploy.** The deploy job runs only on pushes to `main` (or a manual run by a maintainer).
   Its SSH key is bound on the server with `restrict,command=...` to `receive.sh`, so it cannot get a
   shell, forward ports or run other commands. The host key is pinned (`StrictHostKeyChecking=yes`
   with a known_hosts secret), never trusted on first use.

## 3. Secure design principles

| Principle (Saltzer and Schroeder) | How it is applied |
| --- | --- |
| Economy of mechanism | No framework, no bundler, no runtime dependencies, no server code. About 760 lines of first-party JS in four files. The demo logic is one small file with no DOM access. |
| Fail-safe defaults | CSP is `default-src 'self'` and `style-src 'self'` with no `unsafe-inline`; anything not listed is blocked (`check-site.mjs` fails on a `style` attribute or a `<style>` element). `receive.sh` refuses archives without `index.html`, with links or special files, over 300 MB, or whose `version.txt` does not match the commit. Unknown page language: the script does nothing. Unknown theme value: ignored. WebCrypto unavailable or throwing: a pure-JS SHA-256 is used, never a fake value. |
| Complete mediation | Every input path into the page (text box, file picker, drag and drop, compare box, fingerprint box, `localStorage`, `<html lang>`) goes through code that treats it as data. Every deploy goes through the same receiver checks, including manual ones. |
| Least privilege | Workflows run with `permissions: contents: read` and `persist-credentials: false`. The deploy key can run exactly one program. The browser page asks for no permissions; `Permissions-Policy` denies camera, microphone and geolocation. The site container serves files only; it cannot change its own containers (`docker-compose.yml` and `receive` are server-managed). |
| Open design | The code, the server config, the deploy path and this document are public. Security does not depend on any of them being secret; only the deploy key and the server address are secrets. |
| Separation of privilege | A change reaches production only after a pull request passes the required `build` check and is merged to `main`; deployment is a separate job with its own secret. |
| Least common mechanism | No shared backend, no shared cookies or sessions with sister sites; each site is its own origin. |
| Psychological acceptability | The demo needs no account and no upload, and says in each language that the file is never sent. |

## 4. Common weaknesses countered

| Weakness | Countermeasure | Evidence |
| --- | --- | --- |
| CWE-79 Cross-site scripting (OWASP A03) | No `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`document.write` anywhere in site JS; user data is written with `textContent` and DOM APIs. CSP `script-src 'self'` with no `unsafe-inline`/`unsafe-eval`, so injected markup could not run script anyway. | e2e "markup typed into the inputs is shown as text"; `check-site.mjs` fails on inline scripts and handlers |
| CWE-829 Inclusion of functionality from an untrusted control sphere (A08) | No third-party scripts, styles, fonts or images. Fonts are self-hosted. CSP blocks other origins. | `check-site.mjs` fails on third-party `src`/`href`/`url()`; e2e "no console errors" (CSP violations are console errors) |
| CWE-1021 Clickjacking | `frame-ancestors 'none'` and `X-Frame-Options: DENY`. | e2e header assertions |
| CWE-319 / CWE-523 Cleartext transmission | HTTPS only at the edge, HSTS `max-age=31536000`. | live response headers |
| CWE-200 / CWE-359 Exposure of sensitive information | Demo input never leaves the browser; no analytics, no cookies, no logs of input. | e2e "a chosen file is hashed locally and never uploaded" asserts no request carries data |
| CWE-798 / CWE-540 Secrets or internal data in published files | `check-site.mjs` fails on IP addresses, internal hostnames, personal e-mail/phone patterns, GitHub tokens and private keys. Deploy secrets live only in GitHub Actions secrets. | CI `Check site` step |
| CWE-22 Path traversal | Caddy `file_server` confines paths to the root; the receiver extracts into a fresh temp directory and rejects links and special files. The test server also confines paths. | e2e "path traversal does not leave site/" |
| CWE-1321 Prototype pollution | No object merging, no parsing of untrusted JSON or URL parameters into objects. The language lookup uses `hasOwnProperty`, so `__proto__`/`constructor` cannot select an inherited property. | unit test "unknown, empty and inherited keys give null" |
| CWE-601 Open redirect | The site has no redirects and reads no URL parameters. | code review |
| CWE-327 / CWE-328 Broken or risky crypto | SHA-256 only, via WebCrypto; the fallback is checked against NIST vectors and node:crypto for every length 0 to 200 bytes and one million bytes. The salt uses `crypto.getRandomValues`. | unit tests |
| CWE-1104 / A06 Vulnerable components | No runtime dependencies. The only dev dependency (`@playwright/test`, test-only) is pinned to an exact version with a lockfile and integrity hashes; Dependabot watches npm and GitHub Actions monthly. Actions are pinned by commit SHA. | `package-lock.json`, `.github/dependabot.yml` |
| A05 Security misconfiguration | Headers are defined once in `deploy/Caddyfile`; the e2e test server reads its headers from that same file, so the tests run under the production CSP. Deploy smoke test checks the CSP on the live site. | `tests/serve.mjs`, `deploy.yml` |
| MIME sniffing | `X-Content-Type-Options: nosniff`, explicit `Content-Type` for every served type. | e2e header assertion |

## 5. Security review (2026-11-14)

We read every file in `site/assets/*.js`, the page generator and the static test server, looking
for DOM XSS sinks, unsafe URL handling, prototype pollution, unhandled errors and race
conditions.

| # | Finding | Severity | Fix |
| --- | --- | --- | --- |
| F1 | `app.js` built the `.muhr.json` receipt with `innerHTML`. The only variable parts were the hex hash and fixed UI strings, values went through a small escaper and keys did not, so it was not exploitable, but one future edit away from XSS. | Low (hardening) | Receipt is now a data model of `[class, text]` segments (`core.receipt`) rendered with `createElement` and `textContent`. |
| F2 | The fingerprint mini demo wrote 64 `<span>`s with `innerHTML`. Content was hash digits only. | Low (hardening) | Built with `createElement` + `textContent` in a fragment. |
| F3 | The theme button and the compare verdict set icons with `innerHTML` (fixed strings). | Informational | Icons built with `createElementNS` (`<svg><use href>`); verdict text added as a text node. No HTML parsing sink is left in site JS. |
| F4 | Reading a chosen file had no rejection handler (unhandled promise rejection; the label stayed at "reading…"). | Low (robustness) | Error path shows "could not read the file" in the page language. |
| F5 | Choosing two files quickly could let the slower first read overwrite the second one, so the shown hash could belong to the wrong file. | Low (integrity of the displayed result, R2) | Each read carries a sequence number; stale reads are dropped. |
| F6 | Page language lookup used a plain object index. With the current 2-letter slice no inherited key was reachable, but the pattern is fragile. | Informational | `core.strings` uses `hasOwnProperty`, lowercases, and is unit tested against `__proto__`, `constructor`, `toString`. |
| F7 | In compare mode the salt option was meant to be hidden (`hidden` attribute), but a CSS `display: flex` rule overrode it, so the option stayed visible and suggested salting affects comparison (it does not). Found by the new e2e test. | Low (misleading UI, R6) | `.opt[hidden] { display: none; }`. |
| F8 | `tools/pages.mjs` interpolates page text into HTML without escaping. | Informational | Accepted: the input is maintainer-written source text in this repository, reviewed in pull requests; no visitor data reaches the generator. `check-site.mjs` still rejects any inline script or handler in its output. |
| F9 | `seal.js` reads `data-*` attributes and draws them on a canvas. | None | Canvas `fillText` does not parse markup. |

No `eval`, `Function`, `setTimeout` with a string, `postMessage`, URL parameter parsing,
`window.open` or dynamic `src`/`href` assignment exists in site JS.

The pure logic was moved out of `app.js` into `site/assets/core.js` so that it can be unit tested.
Page behaviour is otherwise unchanged; the end-to-end tests check the visible results.

## 6. Residual risks

- **The edge proxy and host are trusted.** Whoever controls them can change what is served. HSTS
  is set without `includeSubDomains`/`preload`; a first visit over a hostile network could still be
  downgraded until the browser has seen the header once.
- **Deploy key compromise** would let an attacker publish arbitrary static content (but not get a
  shell). Mitigations: key stored only as an Actions secret, forced command, pinned host key,
  deploy only from `main`, rollback command, live revision check.
- **No Subresource Integrity.** All scripts are same-origin, so SRI would add little; file names
  are not content-hashed, so a cached old script can pair with a new page for one revalidation
  (`Cache-Control: no-cache` keeps that window short).
- **The browser clock** in the receipt is local and unauthenticated; the page labels it as not a
  proof.
- **The demo is a demo.** It shows the hash and a draft receipt. It does not timestamp anything
  yet, and the page says so in all three languages.

## 7. How the tests back these claims

Run everything with `npm test` (CI runs it on every pull request in the required `build` job,
after `node tools/check-site.mjs`).

| Claim | Test |
| --- | --- |
| R2: the SHA-256 is correct | `tests/unit/core.test.mjs`: NIST FIPS 180-4 vectors, one million `a`, every length 0 to 200 bytes against `node:crypto`, UTF-8 text; WebCrypto path and fallbacks. `tests/e2e/site.spec.mjs`: the page shows the `node:crypto` hash for text in each language and for an uploaded file. |
| R1: nothing is sent | e2e: after a file is chosen, no request with a body or a non-GET method is made. |
| R4: no XSS, no third-party code | e2e: zero console errors and zero page errors on `/`, `/en/`, `/ru/` under the production CSP (read from `deploy/Caddyfile`); markup typed into every input appears as text and creates no elements; a malicious stored theme value is ignored. `check-site.mjs`: no inline scripts, handlers or third-party origins. |
| Compare and tamper detection | unit: `verdict` returns `ok`, `bad`, `badHex`, `empty`; one changed byte gives `bad`. e2e: matching hash shows a match, a one-byte edit shows a mismatch. |
| i18n correctness | unit: all three languages have the same keys and non-empty strings, no markup in strings. e2e: language links switch `lang` and `aria-current`. |
| Server confinement | e2e: encoded `../` paths return 403 or 404 and never file contents from outside `site/`. |
| 404 handling | e2e: unknown path returns status 404 with the bilingual page and working links. |

Coverage of the logic file is enforced by `node --test --experimental-test-coverage` with
minimums of 90 % lines, 80 % branches and 90 % functions (`npm run test:unit`). At the time of
writing it reports 99.24 % lines, 94.34 % branches and 100 % functions for `site/assets/core.js`.

Coverage of all JavaScript in `site/` is measured as well: the browser tests record Chromium V8 coverage
(`tests/e2e/fixtures.mjs`), `tools/coverage.mjs` merges it with the unit-test V8 coverage, and `npm test` fails
below 90 % statements, 90 % lines or 80 % branches over all of `site/**/*.js`. No code is excluded from the
measurement. `npm run lint` (ESLint, `--max-warnings 0`) runs in the same CI job.
