import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const canonicalPath = path.join(root, 'workflows', 'research-material-acquisition', 'two-skill-flow.mmd');
const canonical = (await fs.readFile(canonicalPath, 'utf8')).trim();
const start = '<!-- two-skill-flow:start -->';
const end = '<!-- two-skill-flow:end -->';
const expected = `${start}\n\n\`\`\`mermaid\n${canonical}\n\`\`\`\n\n${end}`;
const consumers = [
  'README.md',
  'docs/architecture.md',
  'skills/sp-pachong-seo-wenzhang-caiji/references/two-skill-integration-flow.md',
];

for (const relative of consumers) {
  const content = await fs.readFile(path.join(root, relative), 'utf8');
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end, startIndex);
  assert.ok(startIndex >= 0 && endIndex > startIndex, `${relative}: missing canonical two-Skill flow markers`);
  const actual = content.slice(startIndex, endIndex + end.length);
  assert.equal(actual, expected, `${relative}: responsibility diagram drifted from ${path.relative(root, canonicalPath)}`);
}

console.log(JSON.stringify({ passed: true, canonical: path.relative(root, canonicalPath).replaceAll('\\', '/'), consumers: consumers.length }, null, 2));
