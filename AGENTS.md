# Contributor guidance

This repository is the independent public source for the Codex companion. Do not copy private workspaces, browser profiles, cookies, credentials, signed article URLs, raw article corpora, or downloaded third-party article images into it.

Keep the three writer boundaries intact:

- `sp-role-pachong-ziliao-sousuo-caiji-expert` owns the run contract, batch ledger, routing, and delivery manifest.
- `sp-pachong-seo-wenzhang-caiji` owns discovery, article capture, tables, image files, article packages, and final `analysis_ref` updates.
- `sp-tupian-lijie-xinxi-tiqu` owns only per-image analysis JSON.

Before committing, run `npm run ci`. Online tests must be opt-in, bounded, public-only, and must never solve CAPTCHA, reuse login state, or silently publish captured content.
