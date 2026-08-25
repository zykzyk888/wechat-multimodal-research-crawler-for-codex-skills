# Architecture and responsibility flows

The system is intentionally three-layered: one accountable Role, one deterministic collection Skill, and one visual-knowledge Skill. Adapter implementations remain inside the crawler Skill.

## Outer Role/A/B workflow

Purple `R` nodes belong to the Role, blue `A` nodes to the crawler, green `B` nodes to image understanding, and orange `H` nodes are explicit handoff contracts.

```mermaid
flowchart TD
    subgraph LEGEND["Legend | ownership by color and prefix"]
        direction LR
        LR["R Role | research acquisition owner"]:::role
        LA["A Skill | public article collection"]:::skillA
        LB["B Skill | image knowledge extraction"]:::skillB
        LH(["H handoff | contracts, paths, states and JSON refs only"]):::handoff
    end

    X1["Input | user, SEO/GEO, product, market or technical research"]:::external
    R1["R1 | lock objective, consumer, topics/URLs, denominator, source semantics and quality"]:::role
    R2["R2 | create run contract, batch plan and ledger"]:::role
    H1(["H1 | topics/URLs + count + source scope + output root + quality profile"]):::handoff
    A1["A1 | discover, capture, base packages, native tables, images and vision jobs"]:::skillA
    R3{"R3 | base quality gate"}:::role
    H2(["H2 | retry only source/body/table/image-inventory/finalization failure"]):::handoff
    R4{"R4 | is visual knowledge recovery required?"}:::role
    H3(["H3 | registered local image jobs + profile + context + output paths"]):::handoff
    B1["B1 | visual inspection, OCR, claims, data and relationships"]:::skillB
    H4(["H4 | validated analysis JSON refs; crawler remains final writer"]):::handoff
    A2["A2 | finalize + validate article packages"]:::skillA
    R5{"R5 | corpus completeness and evidence gate"}:::role
    R6["R6 | manifest, package paths, coverage, unresolved owner and next action"]:::role
    X2["Human review | challenge, restricted source, conflict or unreadable material evidence"]:::external
    X3["Delivery | SEO/GEO/product/market/technical research"]:::external

    X1 --> R1 --> R2 --> H1 --> A1 --> R3
    R3 -->|base failure| H2 --> A1
    R3 -->|base pass| R4
    R4 -->|yes| H3 --> B1 --> H4 --> A2 --> R5
    R4 -->|no or no image| A2
    R5 -->|crawler dimension| H2
    R5 -->|image dimension| H3
    R5 -->|blocked/conflict| X2
    R5 -->|pass or explicit partial| R6 --> X3

    classDef role fill:#F1ECFF,stroke:#7C3AED,stroke-width:2px,color:#0F172A;
    classDef skillA fill:#E8F1FF,stroke:#2563EB,stroke-width:2px,color:#0F172A;
    classDef skillB fill:#EAF8F0,stroke:#16A34A,stroke-width:2px,color:#0F172A;
    classDef handoff fill:#FFF4D6,stroke:#D97706,stroke-width:2px,color:#0F172A;
    classDef external fill:#F3F4F6,stroke:#64748B,stroke-width:1.5px,color:#0F172A;
```

The raw Mermaid source is [workflow.mmd](../workflows/research-material-acquisition/workflow.mmd); machine-readable ownership is [node-contracts.yaml](../workflows/research-material-acquisition/node-contracts.yaml).

## Atomic crawler/image flow

```mermaid
flowchart LR
    Q["topics, count or public URLs"] --> A1["A | Sogou discovery"]
    A1 --> A2["A | Crawlee + HTTP/Cheerio"]
    A2 --> G{"A | body/table/image gates"}
    G -->|body failure| P["A | targeted Puppeteer"]
    G -->|complex structure| C["A | optional Crawl4AI sidecar"]
    G -->|pass| K["A | ordered article package"]
    P --> K
    C --> K
    K --> H1(["H | image ID, local path, context, output path"])
    H1 --> B["B | OCR, claims, data, relationships"]
    B --> H2(["H | validated analysis JSON reference"])
    H2 --> F["A | finalize + validate"]

    classDef default fill:#F3F4F6,stroke:#64748B,color:#0F172A;
```

The detailed ownership figure is maintained in [two-skill-integration-flow.md](../skills/sp-pachong-seo-wenzhang-caiji/references/two-skill-integration-flow.md).

## Why adapters are not separate Skills

HTTP/Cheerio, Crawlee, Puppeteer, and Crawl4AI are implementation routes under one article-package contract. Making each a separate Skill or Role would duplicate quality gates, inflate context, and create competing writers. The outer caller asks for a research outcome; the crawler selects the least costly route that satisfies the same gate.

## Single-writer matrix

| Resource | Sole writer |
|---|---|
| run contract, batch ledger, delivery manifest | Role |
| discovery evidence, article body and ordered blocks | crawler Skill |
| native table JSON/Markdown and layout-table filter counts | crawler Skill |
| image registry, hash-addressed files and vision jobs | crawler Skill |
| per-image analysis JSON | image Skill |
| `article.images[].analysis_ref` and final package status | crawler Skill |
| downstream strategy and synthesis | requesting domain owner |

## State sequence

```mermaid
stateDiagram-v2
    [*] --> discovered
    discovered --> capture_complete: body/table/image capture passes
    discovered --> needs_retry: one base dimension fails
    needs_retry --> capture_complete: targeted retry passes
    capture_complete --> ready_for_research: requested image analyses validate
    capture_complete --> needs_retry: analysis fails or needs review
    needs_retry --> needs_human_review: material conflict or unreadable evidence
    needs_human_review --> ready_for_research: reviewed evidence resolves
    ready_for_research --> [*]
```

`ready_for_research` is a package-completeness state, not a fact-veracity label.
