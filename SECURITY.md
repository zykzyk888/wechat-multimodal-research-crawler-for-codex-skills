# Security policy

## Supported versions

Security fixes target the latest `main` branch and the latest tagged release.

## Report a vulnerability

Please use [GitHub private vulnerability reporting](https://github.com/zykzyk888/wechat-multimodal-research-crawler-for-codex-skills/security/advisories/new). Do not post credentials, private URLs, personal data, exploitable details, or captured source material in a public issue.

Include:

- affected commit or release;
- reproducible steps using synthetic or redacted data;
- impact and attacker assumptions;
- suggested mitigation if known.

## Security boundaries

The online runtime is intentionally restricted to public Sogou Weixin discovery and public `mp.weixin.qq.com` article capture. It rejects URL credentials, private/local/non-public destinations, unsafe redirects, oversized responses, and unsupported protocols. Browser fallback intercepts requests and applies the same public-network checks.

The project does not accept or store login credentials, user cookies, browser profiles, API keys, proxy credentials, or payment information. CAPTCHA and access challenges are stop conditions.

## Deployment warning

These safeguards support bounded local research. They do not make the CLI a hardened public multi-tenant service. A service deployment that accepts untrusted inputs needs separate isolation, egress controls, DNS-rebinding defense, storage quotas, authentication, rate limits, monitoring, and security review.

## Dependency policy

- Runtime versions are locked.
- The public audit rejects missing license metadata and GPL/AGPL/LGPL/SSPL/BUSL/UNLICENSED matches in the Node lock boundary.
- CI runs syntax, offline behavior, Skill metadata, sensitive-content, and dependency audits.
- Optional Crawl4AI should run in an isolated environment and must not expose an unauthenticated remote API.
