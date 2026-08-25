# v0.2.0 release verification

Date: 2026-08-26 (Asia/Shanghai)

Evidence level: anonymous public clone, four-desktop CI matrix, full-history privacy gate, installed-browser discovery, and GitHub repository-security readback

## Result

The v0.2.0 implementation candidate at commit `877ab57f6326d6599e0ef63def9aecd7260b7f27` passed local Windows checks, an anonymous public clone, and the complete GitHub Actions matrix. The release adds macOS desktop compatibility and repeatable privacy governance without creating a separate Mac repository, Skill fork, or iPhone/iPad App.

## Four-platform CI

The [CI run 32882028621](https://github.com/zykzyk888/wechat-multimodal-research-crawler-for-codex-skills/actions/runs/32882028621) completed successfully.

| Job | Result | Evidence scope |
|---|---|---|
| Windows latest, x64 | pass | locked install, offline CLI, Skills, docs/diagram, tree/history audit, installed-Chrome discovery |
| Ubuntu latest, x64 | pass | same |
| macOS latest, Apple Silicon | pass | same, including standard macOS Chrome application discovery |
| macOS 15, Intel | pass | same, including standard macOS Chrome application discovery |

This proves installation and deterministic behavior on those runners. It does not claim that Sogou Weixin or public WeChat pages were reachable from every runner at that time.

## Local and anonymous-public-clone proof

| Check | Result |
|---|---:|
| locked runtime install | 172 packages installed; 0 vulnerabilities |
| core runtime assertions | 32/32 |
| zero-network CLI smoke | 14/14; external calls 0 |
| official Codex `quick_validate.py` | 3/3 Skills valid |
| repository Skill/link validation | 3/3 Skills; 0 broken Skill links |
| all Markdown local links | 58 checked; 0 broken |
| canonical responsibility diagram | 3 synchronized consumers; 0 drift |
| installed Chrome auto-discovery on maintainer Windows | pass |
| anonymous public clone HEAD | matched `877ab57f6326d6599e0ef63def9aecd7260b7f27` |
| anonymous public clone `npm run ci` | pass |

## Privacy and desensitization proof

The implementation candidate was checked after commit, not only before staging:

| Gate | Result |
|---|---:|
| current public tree | 68 files scanned; 0 sensitive findings |
| reachable Git commits | 5 |
| historical file versions | 93 |
| unique historical text blobs | 88 |
| identity findings | 0 |
| credentials, private paths, signed URLs, captured artifacts, or unreviewed media findings | 0 |
| denied or missing dependency licenses | 0 |

The release policy denies captured article packages, raw corpora, real captured HTML, downloaded third-party images, model-output corpora, and binary media by default. A future media exception requires explicit allowlisting plus rights, provenance, embedded-content, and metadata review.

## GitHub repository closure

- Public visibility, `main` default branch, and MIT license were read back successfully.
- Twelve relevant topics were added for Codex, WeChat, crawling, multimodal/image understanding, SEO/GEO, Crawlee, Puppeteer, and Crawl4AI discovery.
- Secret Scanning and push protection are enabled.
- Dependabot vulnerability alerts/security updates and private vulnerability reporting are enabled.
- [CodeQL run 32882602842](https://github.com/zykzyk888/wechat-multimodal-research-crawler-for-codex-skills/actions/runs/32882602842) passed for GitHub Actions, JavaScript/TypeScript, and Python.
- Bug/feature Issue forms and a pull-request safety template are present.
- Four superseded Dependabot pull requests closed automatically after the default branch contained the reviewed Action and Cheerio updates.
- Wiki and Projects remain unchanged because hiding an unknown surface is not required for this release; repository Markdown remains the documented source of truth.
- The default branch remains unprotected deliberately for the current single-maintainer direct-release workflow. Push and pull-request CI still run; mandatory PR protection can be added when collaborator workflow requires it.

## Architecture and Apple-device boundary

The README now uses the complete responsibility-marked diagram: blue A Skill owns collection and article-package writes, green B Skill owns image-analysis JSON, and orange nodes are the only handoff contracts. HTTP/Cheerio, Crawlee, Puppeteer, and Crawl4AI remain a quality-gated cascade—not four unconditional copies of every crawl.

macOS is a supported desktop target. iOS/iPadOS is not: this release requires a desktop Node.js and installed-Chrome execution environment.

## Remaining limits

- Public result order is Sogou Weixin order, not native WeChat App “搜一搜” rank.
- Offline and browser-path CI is not a production SLA or current live-source guarantee.
- CAPTCHA, login, private/paid content, and access restrictions remain stop conditions.
- Successful extraction is not legal permission to republish third-party text or images and is not fact verification.
