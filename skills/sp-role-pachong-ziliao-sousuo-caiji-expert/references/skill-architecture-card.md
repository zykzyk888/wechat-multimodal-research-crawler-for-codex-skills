# Skill architecture card

- skill_id: `sp-role-pachong-ziliao-sousuo-caiji-expert`
- skill_version: 0.1.0
- architecture_status: aligned

## Business position

- outcome: transform natural-language research needs or public URL lists into a counted, traceable, quality-gated multimodal corpus.
- call when: one owner must define scope, route collection, inspect body/table/image completeness, handle local failures, and hand evidence to SEO/GEO/product/technical research.
- owns: run contract, corpus denominator, batch ledger, atomic-Skill routing, cross-article acceptance, retry decisions, delivery manifest, closure report.
- does not own: crawler implementation, article/image-analysis artifact writing, downstream conclusions, image generation, accounts, payments, or access-control bypass.

## Workflow position

- upstream: requester or a domain research owner
- owned nodes: `R1–R6`
- atomic execution: `A1–A2` crawler, `B1` image understanding
- handoffs: `H1–H4`
- downstream: SEO, GEO, market, product, and technical research consumers
- diagram: [workflow.mmd](../../../workflows/research-material-acquisition/workflow.mmd)

## Sync triggers

Update this card, the outer workflow, affected atomic Skill references, and node contracts together when any of these change:

- run-contract fields or denominators
- writer ownership
- vision-job or analysis-reference contracts
- Role/atomic node ownership
- acceptance states or failed-dimension routing
