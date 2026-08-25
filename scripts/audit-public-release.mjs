import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentScanExclusions, excludedDirectories, inspectPublicPath, inspectSensitiveText, normalizeRelative, requiredFiles, textExtensions } from './public-release-policy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeRoot = path.join(root, 'skills', 'sp-pachong-seo-wenzhang-caiji', 'scripts');

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
  const relative = normalizeRelative(root, file);
  const stat = await fs.stat(file);
  for (const finding of inspectPublicPath(relative, stat.size)) findings.push(`${relative}: ${finding}`);
  if (contentScanExclusions.has(relative)) continue;
  const extension = path.extname(file).toLowerCase();
  if (!textExtensions.has(extension) && !['LICENSE', 'README', '.gitignore', '.gitattributes'].includes(path.basename(file))) continue;
  const content = await fs.readFile(file, 'utf8');
  for (const finding of inspectSensitiveText(content)) findings.push(`${relative}: ${finding}`);
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
