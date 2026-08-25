---
name: sp-pachong-seo-wenzhang-caiji
description: Discover and capture public WeChat articles from Sogou Weixin keywords or explicit public URLs, preserving ordered text, native tables, original body images, provenance, and evidence-ready article packages. Use for SEO, GEO, market, product, or technical research collection when Codex needs complete body/table/image materials. Do not use for logged-in or private sources, CAPTCHA bypass, image semantics, or downstream conclusions.
---

# Public WeChat Article Collection

Turn keywords or public `mp.weixin.qq.com` URLs into deterministic multimodal article packages. This Skill is the sole writer of article files, native-table files, downloaded body images, `vision-jobs.json`, final `analysis_ref` values, and package status.

## Before running

1. Resolve this Skill's directory as `<skill-root>`.
2. Require Node.js 20.18.1 or newer on Windows, macOS, or Linux.
3. If `<skill-root>/scripts/node_modules` is missing, run:

```bash
npm ci --prefix "<skill-root>/scripts"
```

On Windows PowerShell, use `npm.cmd` if `npm.ps1` is blocked.

4. Lock the requested topics and per-topic count, or the exact public URL denominator.
5. Use a task-local output directory outside the Skill source tree.

## Natural-language triggers

- “搜索 SEO 和 GEO，各找 7 篇相关微信公众号文章，并保存正文、表格和图片。”
- “抓取这些公开公众号链接，整理成可供研究模型消费的文章包。”
- “重试文章包中失败的图片或正文维度，不要重跑已经通过的部分。”

For accountable multi-topic batches, use `$sp-role-pachong-ziliao-sousuo-caiji-expert` as the outer owner. For image meaning, hand registered local images to `$sp-tupian-lijie-xinxi-tiqu`.

## Commands

Discover public Sogou Weixin results:

```bash
node "<skill-root>/scripts/pachong-seo.mjs" discover --topics SEO,GEO --top-k 7 --pages 3 --output "<run-root>"
```

Capture discovered public articles with the default quality-gated route:

```bash
node "<skill-root>/scripts/pachong-seo.mjs" capture --input "<run-root>/sources.json" --output "<run-root>" --engine auto
```

Offline-package retained HTML:

```bash
node "<skill-root>/scripts/pachong-seo.mjs" package-html --html "<file.html>" --url "https://mp.weixin.qq.com/s/example" --output "<article-package>"
```

After image analyses exist:

```bash
node "<skill-root>/scripts/pachong-seo.mjs" finalize --input "<article-package>"
node "<skill-root>/scripts/pachong-seo.mjs" validate --input "<article-package>"
```

## Four-route architecture

The routes are complementary, not four unconditional copies of every crawl:

1. HTTP + Cheerio: source-specific fast extraction of body, metadata, ordered blocks, native tables, and image candidates.
2. Crawlee: default batch queue, retry, concurrency, storage isolation, and per-item failure containment.
3. Puppeteer: targeted dynamic fallback only when the source result fails the same body/title/challenge quality gate.
4. Crawl4AI: optional Markdown and complex-structure sidecar enrichment; never replaces the source article package.

Read [wechat-source-profile.md](references/wechat-source-profile.md) before changing source behavior.

## Output contract

Each package contains at least:

```text
article-package/<article_id>/
├── manifest.json
├── raw/source.html
├── article.json
├── article.md
├── assets/images/<sha256>.<ext>
├── vision-jobs.json
├── vision/<image_id>.analysis.json
├── tables/<table_id>.json
├── tables/<table_id>.md
├── evidence.json
└── quality-report.json
```

`article.json` preserves reading order through blocks. Native data tables retain rows, cells, `th`/`td`, spans, JSON, and Markdown. Layout-only tables are counted and filtered while their useful descendants remain in normal processing.

## Image handoff

The crawler registers, hashes, deduplicates, and downloads body images, then writes `vision-jobs.json`. It must not invent OCR or visual claims.

Pass only `image_id`, local path, nearby context, profile, and output path to `$sp-tupian-lijie-xinxi-tiqu`. That Skill writes one schema-valid analysis JSON per image. This Skill then runs `finalize` and remains the only writer of `article.images[].analysis_ref` and final package status.

## Quality and failure rules

- Keep requested, discovered, resolved, captured, and accepted denominators separate.
- A body under 100 characters, missing source selector, title mismatch, challenge page, oversized script shell, failed image download, or flattened native table is not a complete capture.
- Browser failure is item-level. Preserve a valid HTTP capture and continue independent articles.
- Retry only the failed dimension.
- `capture_complete` means deterministic capture passed while requested image analysis may still be pending.
- `ready_for_research` requires valid requested analysis references and all base gates.
- Keep uncertainty explicit. A retained package is evidence, not proof that its article is authoritative or correct.

## Safety boundary

- Online discovery is limited to public Sogou Weixin pages; online capture is limited to public `mp.weixin.qq.com` article hosts.
- The recorded rank is Sogou Weixin result order, not native WeChat App search rank.
- Do not use login state, user cookies, proxies with credentials, private networks, `.env`, CAPTCHA solving, or access-control bypass.
- Stop on CAPTCHA, login, private, paid, prohibited, or security-challenge paths.
- Raw HTML and downloaded images belong in the user's local output, not in this open-source repository or a downstream public corpus.
- Standard installed-Chrome paths are discovered on Windows, macOS, and Linux; use `--chrome-path` or `PUPPETEER_EXECUTABLE_PATH` only as a task-local override and never commit it.
- Respect applicable terms, robots guidance, copyright, privacy, rate limits, and the user's right to collect and reuse each source.

## References

- [Reference index](references/index.md)
- [Article package contract](references/article-package-contract.md)
- [Two-Skill responsibility flow](references/two-skill-integration-flow.md)
- [Bounded benchmark](references/benchmark-2026-08-25.md)
