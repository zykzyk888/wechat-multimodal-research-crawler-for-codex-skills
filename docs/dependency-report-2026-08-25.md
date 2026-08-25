# Dependency, license, and cost report

## Direct runtime

| Dependency | Pinned version | Purpose | License |
|---|---:|---|---|
| `@crawlee/cheerio` | 3.18.1 | HTTP crawler, queue/retry integration, Cheerio response handling | Apache-2.0 |
| `cheerio` | 1.1.2 | source DOM parsing and deterministic extraction | MIT |
| `puppeteer-core` | 25.9.0 | targeted control of an installed Chrome | Apache-2.0 |
| `crawl4ai` | `>=0.9.0,<1.0` | optional isolated Python structure sidecar | Apache-2.0 |

The Node installation truth is the committed runtime `package-lock.json`.

## Why the minimal Crawlee package matters

The earlier local runtime depended on the broad `crawlee` meta-package. It pulled browser adapters that this project did not call, including an unrelated GPL-3.0-only transitive package. The public version imports and installs only `@crawlee/cheerio`, which the Crawlee documentation recommends when only Cheerio support is needed.

After the change:

- installed Node packages: 172 direct/transitive entries in the local audit boundary;
- npm audit: zero known vulnerabilities at the release-preparation run;
- detected licenses: MIT, Apache-2.0, BSD, ISC, 0BSD, BlueOak, CC-BY metadata, and compatible dual-license forms;
- denied GPL/AGPL/LGPL/SSPL/BUSL/UNLICENSED matches: zero.

One old transitive package, `map-stream@0.1.0`, omits the `license` field in registry metadata but ships an MIT `LICENCE` file. The audit treats this as an explicit file-verified exception and fails if that file or canonical MIT grant text disappears.

Run `npm run audit:public` after every lock-file change. Registry metadata and advisories can change; re-run `npm audit` before each release.

## Adoption snapshot

| Project | GitHub stars on 2026-08-25 | Role in this repository |
|---|---:|---|
| [Cheerio](https://github.com/cheeriojs/cheerio) | 30,464 | HTML/XML parsing |
| [Crawlee](https://github.com/apify/crawlee) | 25,488 | batch crawling architecture |
| [Puppeteer](https://github.com/puppeteer/puppeteer) | 95,496 | dynamic browser fallback |
| [Crawl4AI](https://github.com/unclecode/crawl4ai) | 79,374 | optional RAG/Markdown structure sidecar |

Stars are dated adoption signals, not security or quality guarantees.

## Cost boundary

- Local open-source crawling has no per-call software fee.
- CPU, memory, disk, browser time, and bandwidth remain user costs.
- Codex/model allowance is consumed by orchestration, synthesis, and image understanding—not by deterministic HTML/table/image download itself.
- Proxies, cloud browsers, Apify cloud, hosted Crawl4AI, external OCR/LLM APIs, and storage may charge separately and are not configured here.

## Third-party notices

This repository does not vendor dependency source or `node_modules`. Dependencies remain under their own licenses. The MIT license covers original repository code and documentation, not captured third-party content.
