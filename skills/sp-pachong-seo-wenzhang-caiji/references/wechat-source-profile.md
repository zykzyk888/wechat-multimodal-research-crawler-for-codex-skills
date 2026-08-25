# Public WeChat / Sogou Weixin source profile

## Scope truth

- Candidate discovery: public Sogou Weixin result pages at `weixin.sogou.com`.
- Article body: public pages at `mp.weixin.qq.com`.
- `original_rank` means observed Sogou Weixin page order, not native WeChat App “搜一搜” rank.
- Signed URLs can expire. Stable evidence combines visible metadata, capture-time URL, and content hashes.

## Discovery

1. Collect a bounded number of public result pages with a conservative delay.
2. Preserve title, summary, publisher, source page, observed position, and time.
3. Stop on CAPTCHA or challenge text; never automate solving.
4. Rank exact keyword mentions in titles above summaries; observed position is only a tie-breaker.
5. Resolve more ranked candidates until the requested count of unique safe public URLs is reached or the pool is exhausted.
6. Deduplicate resolved URL and normalized title/publisher identity.
7. Report any shortfall explicitly.

Relevance scoring ranks the observed candidate pool. It does not prove authority, factual correctness, freshness, or quality.

## Source extraction

Preferred body selector order:

1. `#js_content`
2. `article`
3. `main`
4. `body` only as a diagnostic fallback

Metadata priority:

- title: `og:title` → `#activity-name` → document title
- publisher: `#js_name` → article author metadata
- author: `#js_author_name` → author metadata
- publish date: visible `#publish_time`
- images: `data-src` → `data-original` → `data-actualsrc` → `src`

## Quality gates

Fail the current dimension when:

- no source-specific body selector exists;
- normalized body text is under 100 or over 100,000 characters;
- title is missing or materially conflicts with discovery;
- challenge/environment/security text is present;
- script or serialized state dominates content;
- an image is empty, non-image, or above 15 MiB;
- a native data table is flattened without row/cell relationships.

## Adapter cascade

```text
Crawlee queue/retry
  -> HTTP + Cheerio source adapter
      -> pass: package immediately
      -> body/title/dynamic failure: targeted Puppeteer fallback
      -> optional complex Markdown/table calibration: Crawl4AI sidecar
```

A browser result must pass the same quality gate. Crawl4AI is an optional structure enhancer, not the image or article source of truth.

## Batch isolation

- Browser launch, page, extraction, and packaging failures are item-level.
- In `auto` mode, never replace a valid HTTP result with a lower-quality browser result.
- Cache browser-unavailable state for the batch.
- Continue independent items and always write the batch report when safe.

## Network and access safety

- Online article capture accepts only public `mp.weixin.qq.com` URLs.
- Reject URL credentials, localhost, loopback, private/link-local/non-public addresses, and unsafe redirects.
- Do not import user cookies, browser profiles, proxy credentials, `.env`, or private materials.
- Stop on CAPTCHA, forced login, private/paid content, or security challenge.
- Keep collection rates conservative and respect applicable terms, robots guidance, rights, and law.
