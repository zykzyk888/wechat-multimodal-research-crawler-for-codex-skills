import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { contentScanExclusions, inspectPublicPath, inspectSensitiveText, textExtensions } from './public-release-policy.mjs';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const maxBuffer = 64 * 1024 * 1024;

async function git(args, encoding = 'utf8') {
  const { stdout } = await execFileAsync('git', args, { cwd: root, encoding, maxBuffer, windowsHide: true });
  return stdout;
}

await git(['rev-parse', '--is-inside-work-tree']);
const revisions = String(await git(['rev-list', '--all'])).trim().split(/\r?\n/).filter(Boolean);
assert.ok(revisions.length > 0, 'No reachable Git history found');

const findings = [];
const identities = String(await git(['log', '--all', '--format=%H%x09%ae%x09%ce'])).trim().split(/\r?\n/).filter(Boolean);
for (const row of identities) {
  const [commit, authorEmail, committerEmail] = row.split('\t');
  for (const [kind, email] of [['author', authorEmail], ['committer', committerEmail]]) {
    const isServiceNoReply = /(?:@users\.noreply\.github\.com$|^noreply@github\.com$)/i.test(email || '');
    if (email && !isServiceNoReply) findings.push(`${commit}: non-noreply ${kind} email`);
  }
}

const seenEntries = new Set();
const blobCache = new Map();
for (const revision of revisions) {
  const tree = await git(['ls-tree', '-r', '-z', '--long', revision], 'buffer');
  for (const record of tree.toString('utf8').split('\0').filter(Boolean)) {
    const match = /^(\d+) blob ([0-9a-f]+)\s+(\d+)\t([\s\S]+)$/.exec(record);
    if (!match) continue;
    const [, , hash, sizeText, relative] = match;
    const entryKey = `${hash}\0${relative}`;
    if (seenEntries.has(entryKey)) continue;
    seenEntries.add(entryKey);
    const size = Number(sizeText);
    for (const finding of inspectPublicPath(relative, size)) findings.push(`${revision}:${relative}: ${finding}`);
    const extension = path.posix.extname(relative).toLowerCase();
    const base = path.posix.basename(relative);
    if (contentScanExclusions.has(relative) || (!textExtensions.has(extension) && !['LICENSE', 'README'].includes(base))) continue;
    let blob = blobCache.get(hash);
    if (!blob) {
      blob = await git(['cat-file', 'blob', hash], 'buffer');
      blobCache.set(hash, blob);
    }
    if (blob.includes(0)) {
      findings.push(`${revision}:${relative}: NUL byte in declared text file`);
      continue;
    }
    for (const finding of inspectSensitiveText(blob.toString('utf8'))) findings.push(`${revision}:${relative}: ${finding}`);
  }
}

assert.deepEqual(findings, [], `Git-history public-release findings:\n${findings.join('\n')}`);
console.log(JSON.stringify({
  passed: true,
  commits_scanned: revisions.length,
  unique_file_versions_scanned: seenEntries.size,
  unique_text_blobs_scanned: blobCache.size,
  identity_findings: 0,
  sensitive_or_artifact_findings: 0,
}, null, 2));
