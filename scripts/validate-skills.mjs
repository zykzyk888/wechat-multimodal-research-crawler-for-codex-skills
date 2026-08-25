import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillNames = [
  'sp-role-pachong-ziliao-sousuo-caiji-expert',
  'sp-pachong-seo-wenzhang-caiji',
  'sp-tupian-lijie-xinxi-tiqu',
];

async function exists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert.ok(match, 'SKILL.md must start with YAML frontmatter');
  const values = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z_]+):\s*(.+)$/);
    if (field) values[field[1]] = field[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return values;
}

async function validateLocalLinks(markdown, sourceFile) {
  const errors = [];
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0].trim();
    if (!target || /^(https?:|mailto:)/i.test(target)) continue;
    const resolved = path.resolve(path.dirname(sourceFile), target);
    if (!await exists(resolved)) errors.push(`${path.relative(root, sourceFile)} -> ${target}`);
  }
  return errors;
}

const results = [];
const linkErrors = [];
for (const skillName of skillNames) {
  const skillRoot = path.join(root, 'skills', skillName);
  const skillFile = path.join(skillRoot, 'SKILL.md');
  const yamlFile = path.join(skillRoot, 'agents', 'openai.yaml');
  assert.ok(await exists(skillFile), `Missing ${skillName}/SKILL.md`);
  assert.ok(await exists(yamlFile), `Missing ${skillName}/agents/openai.yaml`);

  const markdown = await fs.readFile(skillFile, 'utf8');
  const frontmatter = parseFrontmatter(markdown);
  assert.equal(frontmatter.name, skillName, `${skillName} frontmatter name must match folder`);
  assert.match(frontmatter.name, /^[a-z0-9-]+$/);
  assert.ok(frontmatter.description?.length >= 80 && frontmatter.description.length <= 1024, `${skillName} description must be discriminating`);

  const openaiYaml = await fs.readFile(yamlFile, 'utf8');
  for (const field of ['display_name:', 'short_description:', 'default_prompt:']) assert.ok(openaiYaml.includes(field), `${skillName} missing ${field}`);
  assert.ok(openaiYaml.includes(`$${skillName}`), `${skillName} default prompt must mention itself`);

  linkErrors.push(...await validateLocalLinks(markdown, skillFile));
  const referenceRoot = path.join(skillRoot, 'references');
  if (await exists(referenceRoot)) {
    for (const entry of await fs.readdir(referenceRoot, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const file = path.join(referenceRoot, entry.name);
        linkErrors.push(...await validateLocalLinks(await fs.readFile(file, 'utf8'), file));
      }
    }
  }
  results.push({ skill: skillName, frontmatter: true, openai_yaml: true });
}

assert.deepEqual(linkErrors, [], `Broken local links:\n${linkErrors.join('\n')}`);
JSON.parse(await fs.readFile(path.join(root, 'skills', 'sp-tupian-lijie-xinxi-tiqu', 'references', 'image-analysis.schema.json'), 'utf8'));

console.log(JSON.stringify({ passed: true, skills: results, broken_links: 0 }, null, 2));
