# Privacy and public-release gate

This project treats desensitization as a release property, not a one-time manual search. A release is blocked unless both the current tree and every reachable Git commit pass the same public policy.

## Decision priorities

| Priority | Dimension | Release rule |
|---|---|---|
| P0 | secrets and access state | Block tokens, private keys, credentials, cookies, browser profiles, signed source URLs, `.env` files, login state, and private or paid-source material. |
| P0 | captured third-party material | Block raw article corpora, downloaded article images, generated article packages, vision outputs, and real HTML captures. Only the reviewed synthetic fixture is allowed. |
| P0 | identity and machine trace | Block personal email, phone/identity numbers, private Windows/macOS/Linux home paths, workspace paths, and local file URLs. Git metadata must use a recognized service noreply address. |
| P0 | complete Git history | Scan all reachable commits and unique historical file versions. A clean current checkout is insufficient. |
| P1 | media and rich reports | Binary media is denied by default. A future file must enter an explicit allowlist only after rights, necessity, EXIF/metadata, embedded text, face/account details, and source provenance are reviewed. |
| P1 | sanitized evidence | Aggregate metrics and benchmark conclusions require a manual semantic review: no raw text, reconstructable source identifiers, signed links, local paths, or misleading claims. |
| P1 | community submissions | Public Issues and pull requests must use synthetic or redacted data. Security details use private vulnerability reporting. |
| P2 | repository hygiene | Reject large files, generated run directories, local logs, editor state, and undocumented dependency licenses. Keep release claims bounded to the evidence level actually tested. |

## Automated gates

Run before every public push or tag:

```bash
npm run audit:public
npm run audit:history
npm run ci
```

`audit:public` checks the current tree, required public files, captured/generated paths, binary media, text-sensitive patterns, file size, and dependency-license metadata.

`audit:history` checks every commit reachable from local refs, every unique historical file version, author/committer email class, the same path/media policy, and the same sensitive-text policy. CI performs a full-depth checkout so the history result is meaningful.

## Manual release review

Automation cannot decide copyright, consent, factual fairness, or whether a sanitized aggregate can still identify a person or source. Before a tag or GitHub Release, a maintainer must review:

1. staged diff and tracked-file list;
2. benchmark/report semantics and all outbound links;
3. any newly allowlisted media and its metadata;
4. GitHub Issues, pull requests, Actions artifacts, and release attachments;
5. the fresh public clone rather than only the maintainer checkout.

If P0 material ever reaches Git history, stop release immediately. Do not assume deleting the working-tree file removes it from history, caches, forks, or clones; assess revocation and coordinated remediation before any history-rewrite decision.
