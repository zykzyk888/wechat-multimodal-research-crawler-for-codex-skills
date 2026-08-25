# Two atomic Skills: responsibility-annotated flow

Color and node prefixes both express ownership: blue `A` is article collection, green `B` is image understanding, orange `H` is the handoff contract.

```mermaid
flowchart TD
    subgraph LEGEND["Legend | color + prefix"]
        direction LR
        LA["A Skill | public article collection"]:::skillA
        LB["B Skill | image knowledge extraction"]:::skillB
        LH(["H handoff | paths, context, states, JSON refs only"]):::handoff
    end

    X["Input | topics, count or public URLs"]:::external
    A1["A1 | Sogou Weixin discovery + relevance"]:::skillA
    A2["A2 | Crawlee + HTTP/Cheerio"]:::skillA
    A3{"A3 | body quality gate"}:::skillA
    A4["A4 | targeted Puppeteer fallback"]:::skillA
    A5["A5 | ordered body blocks"]:::skillA
    A6["A6 | optional Crawl4AI sidecar"]:::skillA
    A7{"A7 | table type"}:::skillA
    A8["A8 | native table JSON + Markdown"]:::skillA
    A9["A9 | register, filter, hash and download body images"]:::skillA
    H1(["H1 | image_id + local path + context + output path"]):::handoff
    B1["B1 | visual inspection + OCR + claims + data + relationships"]:::skillB
    H2(["H2 | validated analysis JSON reference"]):::handoff
    A10["A10 | final article-package assembly"]:::skillA
    A11{"A11 | integrity and evidence gate"}:::skillA
    O["Output | SEO/GEO/product/research consumer"]:::external
    R["Retry only failed dimension"]:::external
    Q["Human review | challenge, conflict, unreadable evidence"]:::external

    X --> A1 --> A2 --> A3
    A3 -->|fail| A4 --> A5
    A3 -->|pass| A5
    A2 -->|complex structure| A6 --> A5
    A5 --> A7
    A5 --> A9
    A7 -->|native data table| A8 --> A10
    A7 -->|image table| H1
    A9 --> H1 --> B1 --> H2 --> A10
    A5 --> A10
    A10 --> A11
    A11 -->|pass| O
    A11 -->|local failure| R --> A3
    A11 -->|blocked or conflict| Q

    classDef skillA fill:#E8F1FF,stroke:#2563EB,stroke-width:2px,color:#0F172A;
    classDef skillB fill:#EAF8F0,stroke:#16A34A,stroke-width:2px,color:#0F172A;
    classDef handoff fill:#FFF4D6,stroke:#D97706,stroke-width:2px,color:#0F172A;
    classDef external fill:#F3F4F6,stroke:#64748B,stroke-width:1.5px,color:#0F172A;
```

## Single writers

| Artifact | Sole writer |
|---|---|
| discovery, body, native tables, image registry/files | crawler Skill |
| `vision-jobs.json` | crawler Skill |
| `vision/<image_id>.analysis.json` | image Skill |
| `analysis_ref` and final package state | crawler Skill |

The outer Role owns batch contracts and acceptance but never becomes a second artifact writer.
