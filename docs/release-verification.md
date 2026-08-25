# v0.1.0 release verification

Date: 2026-08-26 (Asia/Shanghai)

Evidence level: public-clone installation plus bounded live SEO/GEO validation

## Result

The first public release candidate was independently obtained from the public GitHub URL, installed without access to the private source project, and exercised through both atomic Skills:

- public discovery and multimodal article collection;
- image knowledge extraction and article-package finalization.

The final bounded live batch produced four ready-for-research article packages. No captured article body, signed source URL, downloaded third-party image, cookie, credential, or local absolute path is committed to this repository.

## Public repository and remote CI

| Check | Result |
|---|---|
| repository visibility | public |
| independently cloned commit | e617a8052ac30e26a251fcb31e2ba4455a440832 |
| GitHub Actions workflow | completed successfully |
| workflow evidence | [CI run 32868546604](https://github.com/zykzyk888/wechat-multimodal-research-crawler-for-codex-skills/actions/runs/32868546604) |

The GitHub API reported private: false; remote main and the independently cloned HEAD matched exactly.

## Fresh-clone and Skill-install checks

| Check | Result |
|---|---|
| clone from anonymous public URL | pass |
| npm run setup locked install | 172 packages installed, 0 vulnerabilities |
| fresh-clone npm run ci | exit code 0 |
| core runtime assertions | 27/27 |
| zero-network offline CLI smoke | 14/14 |
| public release audit | 55 files scanned, 0 sensitive findings, 0 denied licenses |
| official Codex Skill installer | all three repository Skill paths installed to an isolated destination |
| official quick_validate.py | all three Skills valid |
| installed crawler Skill npm test | 27/27 |

## Bounded SEO/GEO live validation

The live run used public Sogou Weixin discovery and public mp.weixin.qq.com article URLs only. It did not use a login, user Cookie, proxy, CAPTCHA bypass, or paid crawling API.

### Failure isolation probe

A first top-k=1 probe discovered one SEO and one GEO candidate with no discovery shortfall. One article passed with 12,544 text characters and 710 ordered blocks. The other failed the body/title quality gate and remained needs-retry after a time-bounded fallback timeout. The batch completed without converting that failure into false success.

### Successful multimodal batch

The follow-up top-k=2 batch stayed within four candidates:

| Metric | Result |
|---|---:|
| topics | SEO + GEO |
| discovery candidates observed | 20 |
| requested and resolved unique articles | 4 / 4 |
| discovery failures | 0 |
| capture-complete articles | 4 / 4 |
| final ready-for-research packages | 4 / 4 |
| ordered text characters | 20,315 |
| ordered content blocks | 806 |
| downloaded article images | 3 |
| native data tables | 2 |
| image-analysis jobs | 3 |
| completed image analyses | 3 / 3 |

The image-understanding Skill classified and retained all three high-information product screenshots. The structured outputs captured visible dashboard metrics, GEO visibility and sentiment indicators, platform coverage, evidence, confidence, and explicit uncertainty. The collector then attached all three analysis references and passed both finalize and validate.

## What this proves—and does not prove

This evidence proves that the public repository can be cloned, installed, validated, and used for a small real SEO/GEO research run at the stated time. It also proves the A-Skill/B-Skill JSON handoff for text, native tables, downloaded images, and image knowledge.

It is not a production SLA. Public search results, signed article URLs, page structure, anti-automation behavior, source quality, and third-party content rights can change. A later run may require the documented retry path or human review.

## Reproduction

Run the public, non-network checks:

    npm run setup
    npm run ci
    node bin/research-harvester.mjs --help
    node bin/research-harvester.mjs --version

For a bounded online smoke test, follow [Quick start](quickstart.md), use a small top-k, keep the output under ignored runs/, and stop on a challenge page. Do not commit the resulting article packages.
