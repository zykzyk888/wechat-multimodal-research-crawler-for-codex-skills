# Quality and routing policy

## Default route

1. Role locks the corpus contract.
2. Crawler uses Crawlee orchestration with HTTP/Cheerio extraction.
3. Crawler quality gates decide targeted Puppeteer fallback or optional Crawl4AI sidecar.
4. Crawler registers/downloads body images and writes vision jobs.
5. Image Skill analyzes only registered local images required by the selected profile.
6. Crawler finalizes and validates article packages.
7. Role checks cross-article denominator, coverage, quality, and delivery.

The Role does not order all four routes for every article by default.

## Dimension owners

| Dimension | Primary owner | Acceptance evidence | Retry route |
|---|---|---|---|
| discovery and observed position | crawler | source, position/time, URL, relevance/duplicate decision | crawler or requester-supplied public URLs |
| ordered body | crawler | body gate, title match, package path, actual route | targeted crawler body fallback |
| native HTML data table | crawler | JSON/Markdown and table/filter counts | deterministic parser or optional enrichment |
| body-image registry/files | crawler | IDs, local paths, hashes, source, inventory state | crawler image retry |
| image OCR/chart/table/claims | image Skill | schema, confidence, evidence, uncertainty, decision | original-detail reinspection or human review |
| final article package | crawler | analysis refs and validator state | finalize/validate |
| corpus denominator/delivery | Role | ledger, quality matrix, manifest | bounded replan |

## Acceptance

Use `accepted_partial` only when the missing dimension is named, the downstream use remains honest, the item is excluded from denominators requiring that dimension, and the owner/stop decision is recorded.

Never call text-only capture complete if the run contract requires table or image completeness. Layout-only tables are counted and filtered, not delivered as research tables.

## Evidence labels

- `rules_only_simulation`: contract walkthrough only
- `local_or_fixture_validation`: schemas and offline fixtures, no current source proof
- `bounded_real_environment_validation`: current scoped public discovery/capture and local validation
- `production_or_external_proof`: separately proven durable external behavior

A one-time successful crawl is not production proof.

## Failure routing

- source/body/table/image inventory/finalization → crawler Skill, one failed dimension
- image semantic/schema/confidence → image Skill, then human review if material evidence remains unreadable
- duplicate/irrelevant corpus shortfall → Role resumes bounded discovery
- CAPTCHA/login/private/paid/prohibited source → stop; do not bypass
- conflicting visible evidence → preserve both references and escalate
