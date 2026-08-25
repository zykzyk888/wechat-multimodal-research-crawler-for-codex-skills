# Troubleshooting

## `npm` is blocked in Windows PowerShell

Use `npm.cmd` instead of `npm`:

```powershell
npm.cmd run setup
npm.cmd test
```

## Chrome executable not found

Puppeteer uses an installed Chrome because the project depends on `puppeteer-core`. Pass `--chrome-path` or set `PUPPETEER_EXECUTABLE_PATH` for the current process. Do not commit the machine-specific path.

Automatic discovery covers standard Windows locations, macOS system/user application bundles, and common Linux executable paths. Run `node scripts/test-platform-support.mjs --require-browser` from a repository clone to verify the current machine without opening a page.

The default `auto` route still preserves valid HTTP/Crawlee output if Chrome is unavailable.

## CAPTCHA or public search challenge

Stop discovery. Do not retry aggressively or automate challenge solving. Use a bounded list of user-supplied public `mp.weixin.qq.com` URLs, or try again later within the source's rules.

## Fewer than the requested articles

Read `sources.json` fields:

- `requested_count`
- `candidates_count`
- `resolved_unique_count`
- `shortfall`
- `discovery_failures`

Increase `--pages` conservatively or revise the inclusion scope. Do not present a smaller delivered count as the original denominator.

## Body is empty or extremely large

Inspect the article's body quality failures. The extractor rejects missing source-specific selectors, text under 100 characters, script-heavy text over 100,000 characters, title mismatch, and challenge pages. In `auto`, only the affected article receives Puppeteer fallback.

## Images are present but article is not `ready_for_research`

Check:

- `vision-jobs.json` has local image paths;
- every requested `vision/<image_id>.analysis.json` exists;
- the analysis uses schema version `1.0` and all P0 fields;
- `source_path` and optional SHA-256 match the article image record;
- failed or `needs_review` analyses have an explicit unresolved reason.

Then run `finalize` and `validate` again.

## Crawl4AI is not installed

It is optional. Create an isolated Python environment and install `scripts/requirements-crawl4ai.txt`. The main article package does not depend on Crawl4AI.

Use `python3` on macOS/Linux and `python` on Windows unless your local installation exposes a different command.

## Position disagrees with WeChat App

Expected: the tool records observed Sogou Weixin public result order, not native WeChat App “搜一搜” rank. These are different surfaces.

## Tests pass but current live pages fail

Offline tests prove deterministic contracts, parsers, package finalization, and safety checks. They do not prove current public-source availability. Record live evidence as a new bounded run and keep source failures explicit.
