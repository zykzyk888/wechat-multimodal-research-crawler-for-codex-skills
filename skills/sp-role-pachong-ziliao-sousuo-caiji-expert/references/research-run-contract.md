# Research run contract

One run contract freezes the requested corpus before bulk collection. It remains the source for the batch ledger and delivery manifest, while atomic Skills retain their artifact contracts.

## Required fields

```yaml
run_id: string
objective: string
consumer:
  owner: string
  intended_use: string
mode: topic_discovery | url_capture | batch_repair
corpus:
  topics:
    - topic: string
      requested_count: integer
  urls: []
  source_scope: string
  source_position_semantics: string
  language: string | null
  recency: string | null
  inclusion_rules: []
  exclusion_rules: []
quality_profile:
  body_required: true
  native_data_tables_required_if_present: true
  body_images_registered_if_present: true
  informative_images_analyzed_if_required: true
output_root: local_path
evidence_level: rules_only_simulation | local_or_fixture_validation | bounded_real_environment_validation | production_or_external_proof
created_at: timestamp
```

For topic discovery, `requested_count` is per topic. For URL capture, the unique safe public URL list is the denominator. Never substitute discovered, selected, or captured count for the requested unique full-text denominator.

## Item ledger

Each selected item records:

- topic, observed source surface/position/time, title, publisher, and source URL;
- selected/rejected/duplicate/uncertain decision and reason;
- pending/captured/partial/failed/blocked state, package path, and actual route;
- body, native-table, layout-table, image-inventory, image-analysis, and provenance states;
- exactly one failed dimension, owner, next route, and retry/stop decision;
- accepted, accepted-partial, failed, blocked, rejected, or duplicate final state;
- unresolved evidence and downstream consequence.

## Stable denominators

Report separately by topic and total:

- requested
- discovered
- selected
- unique URLs
- unique full texts
- base packages
- multimodal-ready
- accepted
- accepted partial
- failed
- blocked
- duplicate or rejected

`multimodal-ready` means required capture dimensions passed. It does not mean downstream conclusions are correct.

## Delivery manifest

The final manifest includes the run-contract snapshot, coverage by topic, accepted and partial package paths, per-item quality matrix, informative/decorative/failed/pending image counts, table states, actual adapter/fallback summary, evidence level, current-source caveats, unresolved owner/action, and downstream handoff state.

## Writer ownership

- Role: run contract, item ledger, delivery manifest, human-facing report.
- Crawler Skill: discovery/capture evidence, article files, tables, image files/registry, vision jobs, analysis references, final package state.
- Image Skill: only requested image-analysis JSON.
- Downstream consumer: strategy, synthesis, and decisions outside article packages.
