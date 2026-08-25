# Compliance, privacy, and responsible-use boundary

This document is operational guidance, not legal advice.

## Intended use

- bounded discovery of public Sogou Weixin result pages;
- capture of public `mp.weixin.qq.com` article pages;
- local research packaging of text, native tables, and body images;
- local Codex-assisted visual knowledge extraction;
- evidence-based SEO, GEO, product, market, or technical research.

## Not supported

- login, private, group-only, friend-only, paid, deleted, or access-restricted content;
- CAPTCHA solving, anti-bot bypass, account automation, fingerprint evasion, or credentialed proxies;
- importing user cookies, browser profiles, session storage, account tokens, or `.env` secrets;
- public rehosting of captured raw articles or images;
- high-volume unattended crawling without a separate source, legal, rate-limit, and infrastructure review;
- presenting Sogou Weixin order as native WeChat App search rank;
- treating relevance or package completeness as factual verification.

## Data handling

- Capture outputs live in the user's chosen local run directory and are ignored by this repository's Git rules.
- The repository includes only synthetic fixtures and sanitized aggregate metrics.
- Do not commit signed article URLs, raw HTML corpora, article images, cookies, credentials, personal data, or private local paths.
- Image analysis may reproduce visible text. Treat the analysis with the same care and rights boundary as the source image.
- Remove or minimize personal information that is not necessary for the research purpose.

## Source and rights checks

Before collection or reuse, the operator is responsible for checking:

- applicable website/platform terms and robots guidance;
- copyright, database, contract, privacy, publicity, and local legal requirements;
- whether storage, model processing, quotation, sharing, or publication is permitted;
- appropriate request rate, retention period, and deletion process;
- downstream citation and provenance requirements.

Successful technical access is not proof of permission to republish.

## Stop behavior

When the system detects CAPTCHA, forced login, challenge text, private/non-public network destinations, restricted content, or material evidence conflicts, it stops the affected path and preserves only safe partial evidence. It must not silently switch to bypass tactics.

## Trademarks and affiliation

OpenAI, Codex, WeChat, 微信, Tencent, Sogou, Apify, Crawlee, Puppeteer, Cheerio, and Crawl4AI may be trademarks of their respective owners. References describe compatibility or dependencies only. This is an independent community project and is not sponsored, endorsed, or maintained by those organizations.

## Public-service warning

The runtime has source-host restrictions, URL-credential rejection, public-address checks, redirect checks, size/time limits, and conservative concurrency. These controls do not turn it into a hardened multi-tenant crawling service. Do not expose it directly to arbitrary untrusted URLs without a separate security design and review.
