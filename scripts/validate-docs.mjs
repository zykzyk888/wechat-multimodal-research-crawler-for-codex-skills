import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { excludedDirectories, normalizeRelative } from './public-release-policy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function walk(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (excludedDirectories.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
  }
  return files;
}

const findings = [];
let linksChecked = 0;
const files = await walk(root);
for (const file of files) {
  const content = await fs.readFile(file, 'utf8');
  for (const match of content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = match[1].trim().replace(/^<|>$/g, '');
    if (!target || /^(?:https?:|mailto:|#)/i.test(target)) continue;
    target = decodeURIComponent(target.split('#')[0]);
    const resolved = path.resolve(path.dirname(file), target);
    linksChecked += 1;
    if (!resolved.startsWith(`${root}${path.sep}`) && resolved !== root) {
      findings.push(`${normalizeRelative(root, file)}: link escapes repository: ${target}`);
      continue;
    }
    try { await fs.access(resolved); } catch { findings.push(`${normalizeRelative(root, file)}: missing local link: ${target}`); }
  }
}

assert.deepEqual(findings, [], `Documentation link findings:\n${findings.join('\n')}`);
console.log(JSON.stringify({ passed: true, markdown_files: files.length, local_links_checked: linksChecked }, null, 2));
