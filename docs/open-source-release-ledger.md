# Open-source release ledger

This ledger records evidence required before the first public functional release. It contains no private source paths or captured content.

| Stage | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | true-source inventory and independent-copy boundary | complete | original source remained separate; public repository has its own Git history |
| 2 | product name, positioning, public repository, MIT license | complete | repository metadata, README, LICENSE |
| 3 | CLI, three Skills, Role/A/B workflow, contracts, synthetic examples | complete | `bin/`, `skills/`, `workflows/`, `examples/`; local locked install and offline CI passed |
| 4 | secret/path/privacy/copyright/license audit and CI | complete | public audit passed with zero sensitive findings and zero denied dependency licenses; npm audit found zero vulnerabilities |
| 5 | clean commit, push, remote file/visibility verification | complete | remote `main` matched the reviewed commit; repository public; GitHub Actions passed |
| 6 | fresh public clone, install, offline CI, bounded SEO/GEO smoke | complete | [release verification report](release-verification.md) |

Completion requires evidence for every stage. A local pass without remote and fresh-clone verification is not a completed release.
