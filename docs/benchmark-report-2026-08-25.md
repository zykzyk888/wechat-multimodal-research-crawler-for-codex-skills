# SEO/GEO collection and multimodal benchmark

Date: 2026-08-25

Evidence level: bounded local real-page validation
Public release form: sanitized metrics and decisions only

## Question

Which architecture most reliably preserves public WeChat article text, native tables, body images, and the knowledge hidden in images for later Codex research?

## Fixed adapter denominator

- 14 unique articles: SEO 7 + GEO 7.
- First 20 observed public Sogou Weixin candidates per topic, locally reranked.
- Two repeated runs where supported.
- Same body/title/challenge gate across routes.
- Raw bodies, signed URLs, cookies, and images are excluded from the public repository.

## Article-level results

| Route | First-run usable | Text/image finding | Median time | Repeat finding |
|---|---:|---|---:|---:|
| Puppeteer browser | 14/14 | best body and body-image boundary | 5,118 ms | 85.7% near-stable |
| HTTP + Cheerio source adapter | 13/14 | fastest; one invalid script shell without the gate | 2,550 ms | single-run evidence |
| Crawlee + Cheerio | 13/14 | same extraction plus strongest queue/retry shell | 2,691 ms | 92.9% near-stable |
| Crawl4AI browser | 13/14 | useful Markdown/tables; slower/noisier image candidates | 13,057 ms | 85.7% near-stable |
| Mozilla Readability control | 0/14 | did not locate the WeChat body in this sample | 2,550 ms | failure control |

No route was both complete and repeat-stable for all 14. This rules out a single-adapter architecture.

## Multimodal denominator

- 13/14 source HTML bodies found.
- 24 unique reference body images, manually reviewed 24/24.
- 21/24 information-rich images.
- 77/77 comparison-set image URLs downloaded and validated.
- 6 native data tables across 3 articles, 41 rows, 145 cells.

## Weighted non-text score

Weights: body image files 25%, image semantics 20%, table structure 20%, text 20%, metadata 5%, repeat stability 5%, efficiency 5%.

| Rank | Route | Total | Text | Image files | Image semantics | Table structure |
|---:|---|---:|---:|---:|---:|---:|
| 1 | Crawl4AI | 61.6 | 82.3 | 68.6 | 0 | 100 |
| 2 | Puppeteer | 56.4 | 100 | 100 | 0 | 0 |
| 3 | Crawlee + Cheerio | 55.8 | 92.9 | 98 | 0 | 0 |
| 4 | HTTP + Cheerio | 51.4 | 92.9 | 98 | 0 | 0 |

This table is not a universal leaderboard:

- Puppeteer captured 24/24 reference body images with no extras.
- HTTP/Crawlee captured the reference images with one extra candidate.
- Crawl4AI captured the reference images plus many extras; quantity was not precision.
- Crawl4AI alone preserved all six native tables as structured Markdown in that comparison output.
- All routes scored zero for image semantics because saving a file is not OCR or visual knowledge extraction.

## Architecture decision

| Decision | Evidence |
|---|---|
| Crawlee is the default batch owner | highest repeat finding plus queue/retry/failure isolation |
| HTTP + Cheerio is the base extractor | fastest and source-specific, while keeping deterministic blocks/tables/images |
| Puppeteer is targeted fallback | only route with first-run 14/14 and cleanest body-image boundary, but costlier and less repeat-stable |
| Crawl4AI is optional sidecar | strongest complex table/Markdown preservation, but slower and noisier for images |
| image understanding is a separate Skill | every collection route had zero semantic image output |
| Role oversamples and quality-selects | unresolved, duplicate, irrelevant, or thin candidates must not silently shrink the requested denominator |

## End-to-end validation

A later bounded live run tested the selected architecture rather than four full copies:

| Measure | Result |
|---|---:|
| observed public search results scanned | 77 |
| unique public article URLs in batch | 30 |
| capture-complete candidates | 26 |
| final accepted packages | 14/14 |
| body characters in final corpus | 48,296 |
| registered image analyses | 27/27 |
| images kept downstream | 17 |
| native data tables in final corpus | 6 |
| native table rows/cells | 36 / 103 |

The 24-image adapter comparison and 27-image final selection are separate denominators. The latter used a larger candidate pool and quality-based final selection.

## Failure discovered and fixed

An early live attempt completed many HTTP requests but a Puppeteer launch timeout aborted the batch after only part of the packages had been written. The public runtime now:

- isolates browser launch/page/package failures per article;
- preserves a valid HTTP result instead of replacing it with an empty fallback;
- caches browser-unavailable state for the batch;
- continues independent items;
- writes the final batch report when safe.

## Limits

- Search position is observed Sogou Weixin order, not native WeChat App rank.
- One machine and one date do not prove long-term availability or production SLA.
- Package completeness does not prove source factual authority.
- Visual Schema validity does not prove perfect OCR or reasoning accuracy.
- Collection success does not establish redistribution rights.

## Reproducible public checks

The repository distributes synthetic and contract tests, not the copyrighted corpus:

```bash
npm run setup
npm run ci
```

For current-source evidence, run a new bounded public task and preserve it locally as a new dated report instead of overwriting this snapshot.
