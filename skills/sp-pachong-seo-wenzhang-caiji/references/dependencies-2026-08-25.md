# Dependency and adoption snapshot — 2026-08-25

Dynamic stars/downloads are dated adoption signals, not quality proof. Architecture selection is based on the bounded benchmark and explicit responsibilities.

| Component | Role | License | GitHub stars snapshot | Local cost boundary |
|---|---|---|---:|---|
| [Cheerio](https://github.com/cheeriojs/cheerio) | source HTML parsing and ordered extraction | MIT | 30,464 | open-source, no per-call fee |
| [Crawlee](https://github.com/apify/crawlee) | queue, concurrency, retry, and batch isolation | Apache-2.0 | 25,488 | self-hosted library free; hosted Apify services optional |
| [Puppeteer](https://github.com/puppeteer/puppeteer) | targeted installed-Chrome dynamic fallback | Apache-2.0 | 95,496 | library free; local browser/compute used |
| [Crawl4AI](https://github.com/unclecode/crawl4ai) | optional Markdown and complex-structure sidecar | Apache-2.0 | 79,374 | self-hosted library free; cloud/LLM/proxy options may cost |

## Runtime pins

- `@crawlee/cheerio` 3.18.1
- `cheerio` 1.1.2
- `puppeteer-core` 25.9.0
- optional `crawl4ai>=0.9.0,<1.0`

The public runtime intentionally uses `@crawlee/cheerio` instead of the broad `crawlee` meta-package. This installs only the required HTTP/Cheerio path and avoids unused browser adapters and their unrelated transitive licenses.

`package-lock.json` is the installation truth. Run `npm run audit:public` after dependency changes.

## Model and service cost

- Deterministic search, HTML parsing, table extraction, image download, hashing, and package validation do not require an LLM API.
- Codex/model allowance is used for orchestration, synthesis, and image understanding when those Skills run.
- Network, CPU, browser, memory, and disk still have real local cost.
- Proxies, hosted crawling, storage, external OCR/LLM APIs, and cloud services are optional external costs and are not configured by this repository.
