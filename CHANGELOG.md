# Changelog

All notable project changes are documented here.

## [0.2.1] - 2026-08-26

### Security

- Escape existing backslashes before Markdown table delimiters, closing the high-severity CodeQL `js/incomplete-sanitization` alert without changing the native table JSON source.
- Add a regression assertion for cells containing both a backslash and a pipe.

## [0.2.0] - 2026-08-26

### Added

- Windows, macOS Apple Silicon, macOS Intel, and Ubuntu CI matrix with installed-Chrome auto-discovery proof.
- Repeatable current-tree and full reachable Git-history privacy gates, including generated corpus, unreviewed media, identity, credential, path, signed-URL, and dependency-license checks.
- Platform support and privacy decision documents, Issue forms, and a pull-request safety checklist.
- Canonical responsibility-marked two-Skill Mermaid source plus drift validation across README, architecture, and Skill reference.

### Changed

- Replaced the simplified four-route diagram with the full blue A Skill, green B Skill, and orange handoff-contract flow.
- Clarified that four routes are a quality-gated cascade rather than four unconditional copies of each crawl.
- Raised the minimum Node.js version to 20.18.1 and updated Cheerio and GitHub Actions to their reviewed current releases.

### Security

- A clean working tree alone no longer satisfies the release gate; CI checks all reachable commit history with a full-depth checkout.
- Binary/media files are denied by default until explicitly allowlisted with rights, provenance, and metadata review.

## [0.1.0] - 2026-08-26

### Added

- Three installable Codex Skills: research acquisition Role, public article collector, and image knowledge extractor.
- Four-route quality-gated collection architecture.
- Evidence-ready article package with ordered text, native tables, hash-addressed images, image jobs, analysis references, and quality reports.
- Public source/network boundaries, synthetic tests, CI, sensitive-content audit, and dependency-license audit.
- Sanitized SEO/GEO benchmark, responsibility diagrams, quick start, troubleshooting, and compliance guidance.

### Security

- Online capture restricted to public `mp.weixin.qq.com` article hosts.
- URL credentials, non-public destinations, and unsafe redirects rejected.
- Broad Crawlee meta-package replaced with minimal `@crawlee/cheerio` dependency.
