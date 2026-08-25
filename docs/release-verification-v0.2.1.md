# v0.2.1 security patch verification

Date: 2026-08-26 (Asia/Shanghai)

Evidence level: reproduced CodeQL finding, deterministic regression, four-platform CI, CodeQL re-analysis, and alert-state readback

## Why a patch release exists

After v0.2.0 enabled CodeQL default setup, GitHub reported one high-severity `js/incomplete-sanitization` alert in Markdown table-cell rendering. The renderer escaped pipe delimiters but did not first escape existing backslashes, which could create an incomplete escape sequence.

The published v0.2.0 tag was not moved or rewritten. v0.2.1 is a normal forward security patch.

## Fix

Implementation commit: `a98bcaf1f75001d3953de18e48e3c1f5596b24d6`

- Escape existing backslashes before escaping Markdown table pipes.
- Preserve native table JSON as the machine source of truth.
- Add a regression assertion for a cell containing both `\` and `|`.
- Increase the deterministic runtime suite from 32 to 33 assertions.

## Remote evidence

| Check | Result | Evidence |
|---|---|---|
| Windows latest, x64 | pass | [CI run 32884407092](https://github.com/zykzyk888/wechat-multimodal-research-crawler-for-codex-skills/actions/runs/32884407092) |
| Ubuntu latest, x64 | pass | same run |
| macOS latest, Apple Silicon | pass | same run |
| macOS 15, Intel | pass | same run |
| CodeQL Actions/JavaScript/Python | pass | [CodeQL run 32884406915](https://github.com/zykzyk888/wechat-multimodal-research-crawler-for-codex-skills/actions/runs/32884406915) |
| original alert state | `fixed` | GitHub alert 1; `dismissed_reason` is null |
| open CodeQL alerts after re-analysis | 0 | authenticated API readback |
| open Dependabot alerts | 0 | authenticated API readback |
| open Secret Scanning alerts | 0 | authenticated API readback |

## Local gates

- locked install: 172 packages, 0 vulnerabilities;
- runtime assertions: 33/33;
- zero-network CLI smoke: 14/14;
- three Codex Skills valid;
- 60 local Markdown links valid;
- canonical responsibility diagram synchronized across three consumers;
- current-tree privacy, full reachable-history privacy, generated-artifact/media, and dependency-license gates passed;
- installed Chrome auto-discovery passed on maintainer Windows.

## Boundary

This patch changes deterministic Markdown projection only. It does not broaden source access, enable login/CAPTCHA bypass, alter the A/B Skill writer contract, or claim that extracted source facts are true or reusable without rights review.
