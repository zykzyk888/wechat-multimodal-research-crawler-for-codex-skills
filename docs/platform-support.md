# Platform support

The project has one cross-platform Node.js codebase and one set of Codex Skills. It does not require separate Windows and Mac repositories.

## Supported desktop environments

| Environment | Automated evidence | Scope | Important limit |
|---|---|---|---|
| Windows latest, x64 | GitHub Actions plus maintainer Windows check | locked install, offline CLI, Skill validation, privacy/history gates, installed-Chrome discovery | PowerShell may require `npm.cmd` instead of `npm`. |
| macOS latest, Apple Silicon | GitHub Actions | same checks and `/Applications` or user `Applications` Chrome discovery | CI is offline and does not prove current Sogou/WeChat source availability. |
| macOS 15, Intel | GitHub Actions | same checks and Chrome discovery | CI does not represent every older Intel Mac or local security policy. |
| Ubuntu latest, x64 | GitHub Actions | same checks and common Google Chrome/Chromium discovery | Other Linux distributions are best effort. |

Required runtime: Node.js `20.18.1` or newer. Python is optional and used only for the Crawl4AI sidecar.

This is a desktop Codex/CLI companion, not an iPhone or iPad App. iOS/iPadOS has no local Node/Chrome execution path in this release.

## Commands by platform

macOS and Linux:

```bash
npm run setup
npm run ci
python3 skills/sp-pachong-seo-wenzhang-caiji/scripts/crawl4ai-adapter.py --help
```

Windows PowerShell:

```powershell
npm.cmd run setup
npm.cmd run ci
python skills/sp-pachong-seo-wenzhang-caiji/scripts/crawl4ai-adapter.py --help
```

## Chrome discovery order

`--chrome-path` has the highest priority, followed by `PUPPETEER_EXECUTABLE_PATH`. Without either override, the crawler checks:

- Windows: the current user's Local App Data and both Program Files locations;
- macOS: system/user Google Chrome, Chrome for Testing, then Chromium application bundles;
- Linux: common `google-chrome-stable`, `google-chrome`, `chromium`, and `chromium-browser` paths.

The HTTP/Crawlee path remains usable when a browser is absent. Puppeteer is only a targeted fallback for an article that fails the shared body/title/challenge gate.
