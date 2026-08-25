import path from 'node:path';

export const excludedDirectories = new Set(['.git', 'node_modules', '.tmp', '.codex-tmp', 'runs', 'output', '__pycache__']);

export const requiredFiles = [
  'README.md', 'LICENSE', 'SECURITY.md', 'CONTRIBUTING.md', 'package.json',
  'docs/architecture.md', 'docs/benchmark-report-2026-08-25.md', 'docs/compliance.md',
  'docs/privacy-release-gate.md', 'docs/platform-support.md',
  'docs/release-verification-v0.2.0.md',
  '.github/ISSUE_TEMPLATE/bug_report.yml', '.github/ISSUE_TEMPLATE/feature_request.yml',
  '.github/ISSUE_TEMPLATE/config.yml', '.github/pull_request_template.md',
  'scripts/audit-git-history.mjs', 'scripts/test-platform-support.mjs', 'scripts/validate-diagrams.mjs', 'scripts/validate-docs.mjs',
  'skills/sp-role-pachong-ziliao-sousuo-caiji-expert/SKILL.md',
  'skills/sp-pachong-seo-wenzhang-caiji/SKILL.md',
  'skills/sp-tupian-lijie-xinxi-tiqu/SKILL.md',
  'workflows/research-material-acquisition/workflow.mmd',
  'workflows/research-material-acquisition/two-skill-flow.mmd',
];

export const textExtensions = new Set(['.md', '.mjs', '.js', '.json', '.yaml', '.yml', '.py', '.txt', '.html', '.gitattributes', '.gitignore']);
export const contentScanExclusions = new Set(['scripts/public-release-policy.mjs']);
export const publicMediaAllowlist = new Set([]);

const generatedArtifactPaths = [
  /(?:^|\/)(?:runs?|output|article-package|raw-html)(?:\/|$)/i,
  /(?:^|\/)assets\/images(?:\/|$)/i,
  /(?:^|\/)vision\/(?:img-[^/]+\.analysis\.json|vision-jobs\.json)$/i,
  /(?:^|\/)(?:sources|batch-report|evidence|quality-report)\.json$/i,
  /(?:^|\/)raw\/source\.html$/i,
  /(?:^|\/)\.env(?:\.|$)/i,
];

const mediaExtensions = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tif', '.tiff', '.heic',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.mp3', '.wav', '.m4a', '.mp4', '.mov', '.avi', '.webm', '.zip', '.7z', '.rar',
]);

export const sensitivePatterns = [
  ['private Windows user path', /(?:C:\\Users\\(?!(?:tester|example|username)\\)[^\\\r\n]+\\|C:\/Users\/(?!(?:tester|example|username)\/)[^/\r\n]+\/|D:\\cursorfile\\|D:\/cursorfile\/)/im],
  ['private Unix user path', /(?:^|[\s"'`(])\/(?:Users|home)\/(?!(?:tester|example|username)(?:\/|$))[^/\s"'`]+\//im],
  ['local file URL', /file:\/\/\/(?:[A-Za-z]:\/|Users\/|home\/)/i],
  ['GitHub token', /(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/],
  ['OpenAI-style secret', /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['bearer credential', /Authorization\s*:\s*Bearer\s+[A-Za-z0-9._-]{12,}/i],
  ['non-noreply email', /\b[A-Z0-9._%+-]+@(?!users\.noreply\.github\.com\b)[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
  ['mainland China phone number', /(?<!\d)1[3-9]\d{9}(?!\d)/],
  ['mainland China identity number', /(?<!\d)\d{17}[\dXx](?!\d)/],
  ['signed WeChat article URL', /https?:\/\/mp\.weixin\.qq\.com\/s\?[^\s"'`]*(?:__biz|mid|idx|sn|chksm|scene)=/i],
];

export function normalizeRelative(root, file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

export function inspectPublicPath(relative, size) {
  const findings = [];
  if (size > 1_000_000) findings.push('file exceeds 1 MB');
  for (const pattern of generatedArtifactPaths) if (pattern.test(relative)) findings.push('generated or captured research artifact path');
  const extension = path.posix.extname(relative).toLowerCase();
  if (mediaExtensions.has(extension) && !publicMediaAllowlist.has(relative)) findings.push('binary/media file is not in the reviewed public allowlist');
  if (extension === '.html' && relative !== 'examples/synthetic/wechat-article.html') findings.push('HTML is not the reviewed synthetic fixture');
  return [...new Set(findings)];
}

export function inspectSensitiveText(content) {
  return sensitivePatterns.filter(([, pattern]) => pattern.test(content)).map(([label]) => label);
}
