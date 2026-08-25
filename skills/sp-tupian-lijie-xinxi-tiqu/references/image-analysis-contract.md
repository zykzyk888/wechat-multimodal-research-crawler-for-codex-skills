# Image analysis output contract V1

## Ownership

This Skill writes only the requested image-analysis JSON. Article text, image files, native tables, `article.json`, `analysis_ref`, and final package state remain owned by `sp-pachong-seo-wenzhang-caiji`.

## Required P0 output

```json
{
  "schema_version": "1.0",
  "status": "completed",
  "image_id": "img-001",
  "source_path": "assets/images/hash.png",
  "source_sha256": null,
  "profile": "wechat-research",
  "information_value": "high",
  "content_type": "chart",
  "summary": "Core visible information.",
  "ocr_text": "Visible source text",
  "extracted_knowledge": {
    "claims": [],
    "data_points": [],
    "relationships": []
  },
  "decision": {
    "keep_for_downstream": true,
    "reason": "Contains evidence not fully expressed in text."
  },
  "confidence": 0.9,
  "evidence": [],
  "uncertainties": []
}
```

`status` is `completed`, `failed`, or `needs_review`. A failed record still includes the required P0 structure plus a non-empty `error`.

## Enums

- `profile`: `wechat-research` | `social-marketing`
- `information_value`: `high` | `medium` | `low` | `decorative` | `uncertain`
- `content_type`: `photo` | `screenshot` | `chart` | `table-image` | `flowchart` | `infographic` | `illustration` | `logo` | `qr-code` | `divider` | `other`
- `confidence`: 0–1

## Evidence objects

- claim: `{ "text": "...", "evidence": "visible region", "confidence": 0.88 }`
- data point: `{ "label": "...", "value": "...", "unit": "...", "period": "...", "series": "...", "evidence": "visible region", "confidence": 0.82 }`
- relationship: `{ "from": "...", "to": "...", "type": "leads_to", "evidence": "visible arrow", "confidence": 0.90 }`

`evidence[]` describes visible regions. `uncertainties[]` records blur, crop, occlusion, missing units, missing time scope, or context limitations.

## Profile extensions

`wechat-research` may add `research` objects for chart axes/series/values, table headers/rows/cells, flow nodes/edges, source labels, units, and time scope.

`social-marketing` may add `marketing` objects for subjects, visible people count and presentation style, scene, mood, brightness, palette, composition, text zones, cover role, safe crop, and text-overlay suitability.

Omit inapplicable extension objects instead of emitting many `null` fields.

## Handoff

Input is an upstream-owned local path plus context and output path. After writing and validating the JSON, stop. The crawler runs `finalize`, validates source path/hash consistency, and writes only the relative analysis reference into `article.json`.
