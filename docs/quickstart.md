# Quick start

Prerequisites: Node.js `20.18.1` or newer and, for targeted Puppeteer fallback, an installed Chrome/Chromium. See the [platform support matrix](platform-support.md) for Windows, macOS, and Linux commands.

## 1. Choose an entry

Use the Role for an end-to-end multi-article research request. Use the crawler Skill when scope and output are already defined. Use the image Skill when local images already exist.

## 2. Codex installation

Ask Codex:

```text
Use $skill-installer to install these paths from
zykzyk888/wechat-multimodal-research-crawler-for-codex-skills:

skills/sp-role-pachong-ziliao-sousuo-caiji-expert
skills/sp-pachong-seo-wenzhang-caiji
skills/sp-tupian-lijie-xinxi-tiqu
```

Start a new Codex task after installation. On first crawler use, install its locked Node dependencies:

```bash
npm ci --prefix <installed-crawler-skill>/scripts
```

## 3. Natural-language run

```text
Use $sp-role-pachong-ziliao-sousuo-caiji-expert.
Research topics: SEO and GEO.
Requested denominator: 7 accepted public WeChat articles per topic.
Source: public Sogou Weixin results and public mp.weixin.qq.com pages.
Require ordered body text, native tables, body-image files, and semantic analysis of informative images.
Keep raw evidence local and deliver a quality matrix, package paths, unresolved items, and evidence level.
```

If you already have URLs:

```text
Use $sp-pachong-seo-wenzhang-caiji to capture these public mp.weixin.qq.com URLs.
Preserve ordered body blocks, native table structure, body images, hashes, and quality states.
```

If you already have local images:

```text
Use $sp-tupian-lijie-xinxi-tiqu with profile wechat-research.
Inspect these original local images and write schema-valid OCR, claims, data points,
relationships, evidence, confidence, uncertainties, and keep/filter decisions.
```

## 4. CLI installation and offline proof

```bash
git clone https://github.com/zykzyk888/wechat-multimodal-research-crawler-for-codex-skills.git
cd wechat-multimodal-research-crawler-for-codex-skills
npm run setup
npm test
```

Expected offline evidence:

- core runtime assertions pass;
- synthetic HTML becomes one valid article package;
- one native data table is preserved;
- one layout table is filtered;
- one body image is registered without a network request;
- all three Skill packages and local links validate;
- public-release sensitive-data and license audit passes.

## 5. Bounded public discovery

```bash
node bin/research-harvester.mjs discover --topics SEO,GEO --top-k 7 --pages 3 --output ./runs/seo-geo
```

Inspect `./runs/seo-geo/sources.json` before capture. It distinguishes requested count, candidate count, resolved unique count, shortfall, selected articles, and resolution/duplicate failures.

The position field is the observed public Sogou Weixin result order. It must never be presented as native WeChat App search rank.

## 6. Capture

Default cascade:

```bash
node bin/research-harvester.mjs capture --input ./runs/seo-geo/sources.json --output ./runs/seo-geo --engine auto
```

Diagnostic routes:

```bash
node bin/research-harvester.mjs capture --input ./runs/seo-geo/sources.json --output ./runs/http-only --engine http
node bin/research-harvester.mjs capture --input ./runs/seo-geo/sources.json --output ./runs/crawlee-only --engine crawlee
node bin/research-harvester.mjs capture --input ./runs/seo-geo/sources.json --output ./runs/browser-only --engine puppeteer
```

Use diagnostic routes for controlled comparison, not as the default way to quadruple every request.

Puppeteer automatically checks standard Chrome locations on Windows, macOS, and Linux. If detection fails, pass `--chrome-path` or set `PUPPETEER_EXECUTABLE_PATH` for the current process. Do not commit machine paths.

## 7. Optional Crawl4AI sidecar

Create an isolated Python environment, install the pinned optional range, and run:

```bash
python3 skills/sp-pachong-seo-wenzhang-caiji/scripts/crawl4ai-adapter.py \
  --input ./runs/seo-geo/sources.json \
  --output ./runs/seo-geo/crawl4ai-sidecar
```

Crawl4AI output is sidecar evidence. It never replaces `article.json`.

On Windows PowerShell, use `python` if `python3` is not registered.

## 8. Image understanding and finalization

For each article package with jobs:

1. Run the image Skill over `vision-jobs.json`.
2. Confirm each analysis JSON passes the repository schema.
3. Finalize and validate:

```bash
node bin/research-harvester.mjs finalize --input ./runs/seo-geo/article-package/01
node bin/research-harvester.mjs validate --input ./runs/seo-geo/article-package/01
```

`ready_for_research` means requested local dimensions passed. It does not certify the article's facts.

## 9. Stop conditions

Stop the affected path on CAPTCHA, forced login, private/paid content, access restriction, material factual conflict, or unreadable evidence. Preserve safe partial output and report the unresolved owner instead of bypassing the source.
