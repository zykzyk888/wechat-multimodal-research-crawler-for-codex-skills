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

## v0.2.0 privacy and macOS closure

| Stage | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | independent public-copy boundary and exact remote identity | complete | only this public repository changed; remote `main` matched the reviewed implementation commit |
| 2 | current-tree and complete reachable-history privacy gates | complete | 68 current files, 5 commits, 93 historical file versions, 88 unique text blobs; zero findings |
| 3 | macOS/Windows/Linux code and documentation | complete | common Chrome discovery and one shared command/Skill contract |
| 4 | four-platform remote validation | complete | [CI run 32882028621](https://github.com/zykzyk888/wechat-multimodal-research-crawler-for-codex-skills/actions/runs/32882028621) passed Windows, Ubuntu, macOS Apple Silicon, and macOS Intel |
| 5 | full responsibility diagram and drift control | complete | canonical `two-skill-flow.mmd` synchronized to README, architecture, and Skill reference |
| 6 | public repository security/community closure | complete | topics, Issue/PR templates, Secret Scanning/push protection, Dependabot security updates, private vulnerability reporting, and [CodeQL run 32882602842](https://github.com/zykzyk888/wechat-multimodal-research-crawler-for-codex-skills/actions/runs/32882602842) |
| 7 | anonymous public-clone install and CI | complete | public clone matched the implementation commit; locked install and `npm run ci` passed |

Detailed evidence and explicit limits are recorded in [v0.2.0 release verification](release-verification-v0.2.0.md).
