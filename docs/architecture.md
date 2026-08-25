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

<!-- two-skill-flow:start -->

```mermaid
flowchart TD
    subgraph LEGEND["图例｜颜色 + 前缀共同表达归属"]
        direction LR
        LA["A Skill｜爬虫 SEO 文章采集"]:::skillA
        LB["B Skill｜图片理解信息提取"]:::skillB
        LH(["H 交接合同｜只传路径、上下文、状态与 JSON 引用"]):::handoff
    end

    X["外部输入｜关键词、数量或公开文章 URL"]:::external
    A1["A1｜微信搜狗发现与相关性排序"]:::skillA
    A2["A2｜Crawlee 调度 + HTTP/Cheerio 快速抓取"]:::skillA
    A3{"A3｜正文质量门"}:::skillA
    A4["A4｜Puppeteer 动态兜底"]:::skillA
    A5["A5｜正文块规范化"]:::skillA
    A6["A6｜Crawl4AI 可选结构增强"]:::skillA
    A7["A7｜正文处理"]:::skillA
    A8{"A8｜表格类型"}:::skillA
    A9["A9｜正文图片注册、筛选与下载"]:::skillA
    A10["A10｜原生 HTML 表格解析为 JSON + Markdown"]:::skillA
    H1(["H1｜image_id + 本地路径 + 上下文 + output_path"]):::handoff
    B1["B1｜图片价值判断 + OCR + 观点 + 数据关系"]:::skillB
    H2(["H2｜analysis JSON 引用；A 负责最终回写"]):::handoff
    A11["A11｜完整文章包装配"]:::skillA
    A12{"A12｜完整性与证据校验"}:::skillA
    O["交付｜SEO / GEO / 产品 / 研究消费者"]:::external
    R["按失败维度定向重试"]:::external
    Q["人工复核｜挑战、冲突或关键证据不可读"]:::external

    X --> A1 --> A2 --> A3
    A3 -->|正文缺失 / 过短 / 标题不符| A4 --> A5
    A3 -->|正文通过| A5
    A2 -->|检测到表格或复杂结构| A6 --> A5
    A5 --> A7 --> A11
    A5 --> A8
    A5 --> A9
    A8 -->|原生 HTML 表格| A10 --> A11
    A8 -->|图片型表格| H1
    A9 --> H1 --> B1 --> H2 --> A11
    A11 --> A12
    A12 -->|通过| O
    A12 -->|局部失败| R --> A3
    A12 -->|验证阻塞 / 事实冲突| Q

    classDef skillA fill:#E8F1FF,stroke:#2563EB,stroke-width:2px,color:#0F172A;
    classDef skillB fill:#EAF8F0,stroke:#16A34A,stroke-width:2px,color:#0F172A;
    classDef handoff fill:#FFF4D6,stroke:#D97706,stroke-width:2px,color:#0F172A;
    classDef external fill:#F3F4F6,stroke:#64748B,stroke-width:1.5px,color:#0F172A;
```

<!-- two-skill-flow:end -->

The machine source is [two-skill-flow.mmd](../workflows/research-material-acquisition/two-skill-flow.mmd). CI keeps this rendering synchronized with [two-skill-integration-flow.md](../skills/sp-pachong-seo-wenzhang-caiji/references/two-skill-integration-flow.md) and the README.

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
