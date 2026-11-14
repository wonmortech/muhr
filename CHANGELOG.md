# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/). Version 0.x means the project is in planning: the site and the
documents change, there is no released product yet.

## [Unreleased]

### Added
- Property-based tests with fast-check on random input, run in CI with the unit tests.
- ESLint (`npm run lint`, no warnings allowed) over the site scripts, tests and tools, run in CI.
- Combined JavaScript coverage of every script in `site/`: Chromium coverage from the browser tests merged with
  the unit-test coverage, gated in CI at 90 % statements and lines and 80 % branches.
- Browser tests for the hero animation under normal and reduced motion, system theme changes, the mobile menu,
  copy, drag and drop, unreadable files, and browsers without canvas or observers.
- SPDX copyright and licence information in every file, `LICENSES/`, `REUSE.toml`, and a REUSE check in CI.
- "Verifying a release" in SECURITY.md.

### Changed
- GOVERNANCE.md names two independent owners and maintainers, @wonmors (founder) and @xnosir (technical
  maintainer), and states openly that the founder's account runs delegated automation during setup.

### Fixed
- The hash comparison no longer throws on a value that has no text form; it treats it as empty.
- Unused variables removed from the site scripts (no change in behaviour).

## [0.1.0] - 2026-11-14

### Added
- Research with competitors, standards and legal notes in `docs/research/`, and the plan in `docs/PLAN.md`.
- Home page at https://muhr.wonmor.io in Uzbek, English and Russian, with light and dark themes and an in-browser demo.
- Share card image per language.
- Automatic deployment from `main` with live verification and rollback.
- Automated tests: unit tests with a coverage gate and browser tests for every language page, run in CI.
- Security assurance case ([docs/ASSURANCE.md](docs/ASSURANCE.md)), security policy and `security.txt`.
- Governance, contributing guide with DCO sign-off, code of conduct, issue and pull request templates.
- OpenSSF Scorecard workflow, and reproducible release archives with signed build provenance.

[Unreleased]: https://github.com/wonmortech/muhr/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/wonmortech/muhr/releases/tag/v0.1.0
