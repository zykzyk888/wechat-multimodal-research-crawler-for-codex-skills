---
name: sp-tupian-lijie-xinxi-tiqu
description: Inspect registered local images and write schema-valid visual knowledge JSON with information value, OCR, claims, data points, relationships, evidence, uncertainty, and keep/filter decisions. Use for public-WeChat research images, charts, table images, screenshots, flowcharts, or social-marketing visual metadata. Do not download images, edit article packages, generate images, or infer facts without visible evidence.
---

# Image Understanding and Knowledge Extraction

Convert an existing local image into reusable, evidence-linked JSON. This Skill owns only the requested per-image analysis file; it never downloads or moves images and never modifies `article.json`.

## Inputs

Accept either one local image or `vision-jobs.json`. Every job must contain:

```json
{
  "image_id": "img-001",
  "image_path": "assets/images/hash.png",
  "context": "Nearby article text",
  "output_path": "vision/img-001.analysis.json"
}
```

Resolve paths under the caller-owned article package. Reject missing files and path escapes.

## Profiles

- `wechat-research`: recover knowledge hidden in screenshots, charts, table images, flowcharts, diagrams, and infographics.
- `social-marketing`: extract subjects, visible people count, scene, mood, brightness, palette, composition, text zones, crop safety, and reuse role.

Use only the requested profile. Read the relevant profile reference before deep extraction.

## Required procedure

1. Verify each local file and group exact SHA-256 duplicates.
2. Visually inspect each unique original image. Do not infer from filenames, thumbnails, alt text, or article context alone.
3. Classify information value: `high`, `medium`, `low`, `decorative`, or `uncertain`.
4. Deep-read high, medium, and uncertain images at sufficient detail.
5. Extract only visible OCR, claims, data points, and relationships; include evidence and uncertainty.
6. Write exactly one JSON object to the upstream-provided `output_path`.
7. Validate against [image-analysis.schema.json](references/image-analysis.schema.json).
8. Stop. The crawler Skill performs final article-package assembly.

## Accuracy rules

- Context can resolve abbreviations but cannot replace visual evidence.
- If a trend is visible but exact values are not, report the trend and leave values uncertain.
- Mark unreadable cells `[unclear]`; never manufacture numbers.
- Decorative separators, generic tail cards, irrelevant QR codes, and branding can be filtered, but keep a minimal decision record.
- If visible evidence conflicts with surrounding text, retain both references and mark the conflict.
- Do not infer sensitive attributes, identity, location, health, income, politics, religion, or personality from appearance.

## Writer boundary

- Input image files: crawler or caller owned.
- `<image_id>.analysis.json`: this Skill only.
- `article.json`, `analysis_ref`, tables, and final status: `$sp-pachong-seo-wenzhang-caiji` only.

## References

- [Output contract](references/image-analysis-contract.md)
- [JSON Schema](references/image-analysis.schema.json)
- [WeChat research profile](references/profile-wechat-research.md)
- [Social marketing profile](references/profile-social-marketing.md)
- [Triage and confidence](references/triage-and-confidence.md)
