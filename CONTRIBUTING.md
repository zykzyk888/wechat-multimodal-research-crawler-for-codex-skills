# Contributing

Contributions that improve public-source correctness, multimodal completeness, portability, tests, documentation, or safety are welcome.

## Setup

```bash
git clone https://github.com/zykzyk888/wechat-multimodal-research-crawler-for-codex-skills.git
cd wechat-multimodal-research-crawler-for-codex-skills
npm run setup
npm run ci
```

Node.js 20 or newer is required. On Windows PowerShell, use `npm.cmd` if `npm.ps1` is blocked.

## Architecture rules

- Role owns run contracts, ledgers, routing, and delivery manifests.
- Crawler Skill is the only article-package writer.
- Image Skill writes only image-analysis JSON.
- HTTP/Cheerio, Crawlee, Puppeteer, and Crawl4AI remain internal crawler routes unless a future contract proves a separate business capability is needed.
- Fallbacks must pass the same quality gate and retry only failed dimensions.

If a contract, owner, node, handoff, or state changes, update the affected Skill references, [architecture](docs/architecture.md), Mermaid source, and node contracts in the same change.

## Test data

Use synthetic fixtures. Do not commit:

- raw or copied article bodies;
- signed article URLs;
- downloaded third-party images;
- cookies, credentials, browser profiles, `.env`, or proxies;
- personal data or private paths;
- live model-output corpora.

Bounded live testing is opt-in, public-only, conservative, and local. Summaries may be proposed only after removing raw content, identifiers not needed for reproducibility, and machine paths.

## Dependency changes

Explain why the existing stack cannot satisfy the requirement. Prefer the narrowest package. Update the lock file and dependency report, then run:

```bash
npm audit --prefix skills/sp-pachong-seo-wenzhang-caiji/scripts
npm run audit:public
npm run ci
```

## Pull requests

Describe:

- user-visible outcome;
- changed contract or route;
- tests and exact evidence;
- network, privacy, copyright, and compatibility impact;
- remaining limits.

Do not claim production or current-source proof from offline tests alone.
