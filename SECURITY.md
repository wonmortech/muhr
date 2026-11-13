# Security policy

## Supported versions

Muhr is in the planning stage. The only thing running is the home page at https://muhr.wonmor.io, deployed from the
`main` branch. Security fixes go to `main` and are deployed to the site; there are no older versions to patch.
When releases exist, the latest release receives fixes.

## Reporting a vulnerability

Please **do not** open a public issue, pull request or discussion for a vulnerability.

1. Preferred: GitHub private vulnerability reporting, in this repository's **Security** tab,
   then **Report a vulnerability**: <https://github.com/wonmortech/muhr/security/advisories/new>.
2. If you cannot use GitHub: a private message on Telegram to <https://t.me/xnosir>. A short first message such as
   "Security report for Muhr" is enough; we will agree on a safe way to share the details.

Include the affected URL or file, the steps to reproduce, and what an attacker could gain. Never send live
credentials or other people's personal data, even as proof.

## What happens next

| Step | What we do | Within |
|---|---|---|
| Acknowledge | Confirm we received your report | 7 days |
| Assess | Reproduce it and rate its severity (CVSS) | 14 days |
| Fix | Fix and deploy high and critical issues, sooner where possible | 60 days |
| Disclose | Publish a GitHub security advisory (and a CVE where needed) with the fix | With the fix |

We credit reporters in the advisory if they wish. Good-faith research that follows the
[organization security policy](https://github.com/wonmortech/.github/blob/main/SECURITY.md) is welcome and
covered by its safe-harbour section. There is no paid bug bounty.

## Verifying a release

Each GitHub release holds a reproducible archive of `site/`, a `SHA256SUMS` file and signed build provenance.
[.github/workflows/release.yml](.github/workflows/release.yml) builds the archive twice, checks the two are
byte-identical, and signs the provenance with [Sigstore](https://www.sigstore.dev/) (GitHub artifact
attestations). To check a download with the [GitHub CLI](https://cli.github.com/):

```sh
gh release download v0.1.0 -R wonmortech/muhr
sha256sum -c SHA256SUMS
gh attestation verify muhr-site-0.1.0.tar.gz -R wonmortech/muhr
```

`sha256sum -c` must print `OK` for the archive, and `gh attestation verify` must report that it was built by
`release.yml` in `wonmortech/muhr`. For another release, replace `v0.1.0` and `0.1.0` with its version.

## More

A machine-readable contact file is published at [https://muhr.wonmor.io/.well-known/security.txt](https://muhr.wonmor.io/.well-known/security.txt).
The security design of the project is described in [docs/ASSURANCE.md](docs/ASSURANCE.md).
