import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeRoot = path.join(root, 'skills', 'sp-pachong-seo-wenzhang-caiji', 'scripts');
const excludedDirectories = new Set(['.git', 'node_modules', '.tmp', 'runs', 'output', '__pycache__']);
const requiredFiles = [
  'README.md', 'LICENSE', 'SECURITY.md', 'CONTRIBUTING.md', 'package.json',
  'docs/architecture.md', 'docs/benchmark-report-2026-08-25.md', 'docs/compliance.md',
  'skills/sp-role-pachong-ziliao-sousuo-caiji-expert/SKILL.md',
  'skills/sp-pachong-seo-wenzhang-caiji/SKILL.md',
  'skills/sp-tupian-lijie-xinxi-tiqu/SKILL.md',
  'workflows/research-material-acquisition/workflow.mmd',
];

const textExtensions = new Set(['.md', '.mjs', '.js', '.json', '.yaml', '.yml', '.py', '.txt', '.html', '.gitattributes', '.gitignore']);
const sensitivePatterns = [
  ['private Windows path', /(?:^|[\s"'`(])(?:[A-Za-z]:\\[^\\\r\n]+\\|C:\/Users\/|D:\/cursorfile\/|file:\/\/\/[A-Za-z]:\/)/im],
  ['GitHub token', /(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/],
  ['OpenAI-style secret', /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['bearer credential', /Authorization\s*:\s*Bearer\s+[A-Za-z0-9._-]{12,}/i],
  ['non-noreply email', /\b[A-Z0-9._%+-]+@(?!users\.noreply\.github\.com\b)[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
];

async function exists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}

async function walk(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (excludedDirectories.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

for (const relative of requiredFiles) assert.ok(await exists(path.join(root, relative)), `Missing required public file: ${relative}`);

const findings = [];
const files = await walk(root);
for (const file of files) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const stat = await fs.stat(file);
  if (stat.size > 1_000_000) findings.push(`${relative}: file exceeds 1 MB`);
  if (relative === 'scripts/audit-public-release.mjs') continue;
  const extension = path.extname(file).toLowerCase();
  if (!textExtensions.has(extension) && !['LICENSE', 'README', '.gitignore', '.gitattributes'].includes(path.basename(file))) continue;
  const content = await fs.readFile(file, 'utf8');
  for (const [label, pattern] of sensitivePatterns) if (pattern.test(content)) findings.push(`${relative}: ${label}`);
}

const lockPath = path.join(root, 'skills', 'sp-pachong-seo-wenzhang-caiji', 'scripts', 'package-lock.json');
const lock = JSON.parse(await fs.readFile(lockPath, 'utf8'));
const deniedLicenses = [];
const missingLicenses = [];
const verifiedLicenseFileOverrides = new Map([
  ['node_modules/map-stream', 'LICENCE'],
]);
for (const [packagePath, metadata] of Object.entries(lock.packages || {})) {
  if (!packagePath.startsWith('node_modules/')) continue;
  if (!metadata.license) {
    const licenseFile = verifiedLicenseFileOverrides.get(packagePath);
    if (!licenseFile) {
      missingLicenses.push(packagePath);
    } else {
      const licenseText = await fs.readFile(path.join(runtimeRoot, packagePath, licenseFile), 'utf8');
      if (!licenseText.includes('Permission is hereby granted, free of charge')) missingLicenses.push(packagePath);
    }
  }
  else if (/\b(?:AGPL|GPL|LGPL|SSPL|BUSL|UNLICENSED)\b/i.test(String(metadata.license))) deniedLicenses.push(`${packagePath}:${metadata.license}`);
}

assert.deepEqual(findings, [], `Public-release findings:\n${findings.join('\n')}`);
assert.deepEqual(deniedLicenses, [], `Denied dependency licenses:\n${deniedLicenses.join('\n')}`);
assert.deepEqual(missingLicenses, [], `Dependencies without license metadata:\n${missingLicenses.join('\n')}`);

console.log(JSON.stringify({
  passed: true,
  scanned_files: files.length,
  sensitive_findings: 0,
  denied_dependency_licenses: 0,
  dependencies_without_license_metadata: 0,
}, null, 2));
