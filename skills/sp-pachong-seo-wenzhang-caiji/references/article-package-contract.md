# Research article package contract

## Ownership

`sp-pachong-seo-wenzhang-caiji` is the only writer of the article package. `sp-tupian-lijie-xinxi-tiqu` receives image jobs and writes standalone analysis JSON; it never edits `article.json`.

## Directory

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

`raw/source.html` and downloaded images are local research evidence. They must not be committed to this repository or redistributed without the appropriate rights.

## Ordered article truth

`article.json` is the machine truth. `blocks[]` preserves reading order with these V1 types:

- `heading`: `level`, `text`
- `paragraph`: `text`
- `blockquote`: `text`
- `list`: `ordered`, `items[]`
- `code`: `text`
- `image`: `image_id`
- `table`: `table_id`

`article.md` is a readable projection of the same order. Do not replace this with a detached body string and image gallery.

## Images

Every image record contains its ID, source URL, local path, article position, alt text, nearby context, hash, MIME type, byte count, analysis state, and optional analysis reference.

Allowed analysis states are `pending`, `completed`, `skipped_decorative`, `failed`, and `not_requested`.

`vision-jobs.json` passes only registered local paths:

```json
{
  "schema_version": 1,
  "profile": "wechat-research",
  "consumer_skill": "sp-tupian-lijie-xinxi-tiqu",
  "jobs": [
    {
      "image_id": "img-001",
      "image_path": "assets/images/hash.png",
      "context": "Nearby paragraph",
      "output_path": "vision/img-001.analysis.json"
    }
  ]
}
```

## Native tables

Every native `<table>` is classified before delivery. A data table preserves row and cell order, `th`/`td`, text, `rowspan`, `colspan`, original HTML evidence, JSON, and Markdown. Layout-only tables are counted and filtered while nested text, images, and real tables continue through normal block walking.

Cell text without row/column relationships is not preserved table structure.

## Status

- `capture_complete`: deterministic body/table/image capture passed; requested image understanding may be pending.
- `ready_for_research`: required analyses exist, references resolve, and all base quality gates pass.
- `needs_retry`: one or more required dimensions failed and a supported retry remains.
- `needs_human_review`: material uncertainty or conflicting evidence cannot be resolved automatically.
- `blocked`: an explicit external/human gate prevents continuation.

## Acceptance

- Every referenced path exists and stays under the package root.
- HTML and body-text hashes are recorded.
- Duplicate image bytes use one hash-addressed file.
- Every classified data table has JSON and Markdown projections.
- Every completed or decorative analysis has a resolvable, schema-valid reference.
- Low-confidence visual output remains uncertain and is never promoted to article fact.
