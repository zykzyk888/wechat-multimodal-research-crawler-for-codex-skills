# Triage and confidence

## Information value

- `high`: material data, argument, process, interface evidence, comparison, or claim not recoverable from text alone.
- `medium`: useful context or reusable visual features; text still carries the core conclusion.
- `low`: repetitive, tiny, generic, weakly related, or promotional content.
- `decorative`: divider, placeholder, generic tail card, irrelevant QR/branding, or no-information decoration.
- `uncertain`: insufficient resolution, crop, occlusion, or context prevents reliable classification.

## Confidence

- `0.90–1.00`: text, values, and relationships are directly visible.
- `0.75–0.89`: main conclusion is clear; limited small details are uncertain.
- `0.50–0.74`: only partial evidence is reliable; use `needs_review` or explicit uncertainty.
- `<0.50`: do not output factual conclusions; fail or request better evidence.

## Batch routing

1. Validate paths and SHA-256-group exact duplicates.
2. Inspect every unique original image, not only a contact sheet.
3. Deep-read high, medium, and uncertain images.
4. Write minimal P0 for low/decorative images.
5. Reuse duplicate-byte analysis while preserving every source reference.

## Failure rules

- missing/unreadable file → `failed`
- only thumbnail or unreadable text → `needs_review`
- visual/context conflict → retain both and mark conflict
- no visual inspection → never mark completed
