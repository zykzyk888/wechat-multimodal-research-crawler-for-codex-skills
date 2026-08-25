import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'bin', 'research-harvester.mjs');
const fixture = path.join(root, 'examples', 'synthetic', 'wechat-article.html');

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'wechat-research-offline-smoke-'));
try {
  const help = await run(['help']);
  assert.equal(help.code, 0, help.stderr);
  assert.match(help.stdout, /WeChat Multimodal Research Crawler for Codex/);
  const standardHelp = await run(['--help']);
  assert.equal(standardHelp.code, 0, standardHelp.stderr);
  assert.match(standardHelp.stdout, /Global options:/);
  const version = await run(['--version']);
  assert.equal(version.code, 0, version.stderr);
  assert.equal(version.stdout.trim(), '0.1.0');

  const packaged = await run([
    'package-html', '--html', fixture,
    '--url', 'https://mp.weixin.qq.com/s/synthetic-offline-example',
    '--title', 'Synthetic SEO GEO Research Note',
    '--topic', 'SEO GEO', '--id', 'synthetic-offline', '--output', temporary,
  ]);
  assert.equal(packaged.code, 0, packaged.stderr);

  const validation = await run(['validate', '--input', temporary]);
  assert.equal(validation.code, 0, validation.stderr);
  const article = JSON.parse(await fs.readFile(path.join(temporary, 'article.json'), 'utf8'));
  const quality = JSON.parse(await fs.readFile(path.join(temporary, 'quality-report.json'), 'utf8'));
  assert.equal(article.metadata.title, 'Synthetic SEO GEO Research Note');
  assert.equal(article.tables.length, 1);
  assert.equal(article.images.length, 1);
  assert.equal(quality.tables.data_tables_preserved, 1);
  assert.equal(quality.tables.layout_tables_filtered, 1);
  assert.ok(article.blocks.some((block) => block.type === 'table'));
  assert.ok(article.blocks.some((block) => block.type === 'image'));

  console.log(JSON.stringify({ passed: true, checks: 14, external_calls: 0, article_status: article.status }, null, 2));
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}
