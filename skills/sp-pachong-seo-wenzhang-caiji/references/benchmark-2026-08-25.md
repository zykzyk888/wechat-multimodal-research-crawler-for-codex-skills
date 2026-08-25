# Bounded SEO/GEO benchmark — 2026-08-25

## Evidence boundary

This is a sanitized snapshot of one dated local run over public pages. It is evidence for architecture selection, not a promise of future source availability, anti-crawl stability, factual authority, or legal reuse rights.

No raw article body, signed article URL, downloaded article image, cookie, credential, or private path is included in the repository.

## Adapter comparison denominator

- Topics: SEO 7 + GEO 7 = 14 unique public articles.
- First public candidate pool: 20 observed Sogou Weixin results per topic.
- Two repeated capture runs where supported.
- Source HTML bodies found: 13/14.
- Reference body images: 24 unique; manually reviewed 24/24.
- Information-rich images: 21/24.
- Native data tables: 6 across 3 articles, 41 rows, 145 cells.

| Route | First-run usable | Primary finding | Median time | Repeat finding |
|---|---:|---|---:|---:|
| Puppeteer | 14/14 | strongest body and body-image boundary | 5,118 ms | 85.7% near-stable |
| HTTP + Cheerio source adapter | 13/14 | fastest; quality gate caught one script shell | 2,550 ms | single-run evidence |
| Crawlee + Cheerio | 13/14 | best queue/retry operating shell | 2,691 ms | 92.9% near-stable |
| Crawl4AI browser | 13/14 | useful Markdown/table structure; slower/noisier images | 13,057 ms | 85.7% near-stable |
| Mozilla Readability control | 0/14 | did not identify the WeChat body in this sample | 2,550 ms | failure control |

No single route reached 14/14 on both runs. The result is the quality-gated cascade, not one universal winner.

## End-to-end multimodal run

A later bounded run used a larger candidate pool and post-capture quality selection:

- 77 public search results scanned.
- 30 unique public article URLs resolved and attempted.
- 26 capture-complete candidates.
- 14/14 final selected packages reached `ready_for_research`.
- 48,296 captured body characters.
- 27/27 registered images analyzed and referenced.
- 17 images retained for downstream knowledge use after visual triage.
- 6 native data tables, 36 rows, 103 cells in the final selected corpus.

The 24-image adapter denominator and 27-image final-corpus denominator are different stages and must not be merged.

## What this proved

- HTTP/Cheerio is the efficient source-specific base.
- Crawlee adds the strongest batch operating shell.
- Puppeteer is valuable as a targeted body fallback.
- Crawl4AI is valuable for optional structure enrichment.
- All four collection routes save files but do not themselves recover OCR, chart data, claims, or visual relationships; image understanding must remain a separate atomic Skill.
- A fixed requested denominator requires oversampling, deduplication, quality selection, and explicit shortfall handling.

## What this did not prove

- Native WeChat App search rank.
- Long-term source or CAPTCHA behavior.
- Accuracy or authority of article claims.
- Permission to republish captured articles or images.
- Production SLA, unrestricted scale, or unattended service operation.
