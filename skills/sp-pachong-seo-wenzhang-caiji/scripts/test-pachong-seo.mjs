import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { assertSafeNetworkUrl, chromeExecutableCandidates, extractArticle, finalizePackage, packageArticle, sanitizeRedirectHeaders, tableToMarkdown, validatePackage } from './pachong-seo.mjs';

const body = 'SEO 和 GEO 的研究需要保留正文、原生表格、信息型配图及其上下文。'.repeat(8);
const html = `<!doctype html><html><head>
  <title>SEO GEO 研究样本</title>
  <meta property="og:title" content="SEO GEO 研究样本">
</head><body><div id="js_content">
  <h2>核心结论</h2><p>${body}</p>
  <img data-src="https://example.com/research-chart.png" alt="研究趋势图">
  <table class="layout"><tr><td><p>布局表中的正文仍需保留。</p></td></tr></table>
  <table><tr><th>主题</th><th>文章数</th></tr><tr><td>SEO</td><td>7</td></tr></table>
</div></body></html>`;

const extracted = extractArticle(html, 'https://mp.weixin.qq.com/s/test', { title: 'SEO GEO 研究样本' });
assert.equal(extracted.quality.passed, true);
assert.equal(extracted.images.length, 1);
assert.equal(extracted.tables.length, 1);
assert.equal(extracted.tables[0].row_count, 2);
assert.equal(extracted.table_stats.native_detected, 2);
assert.equal(extracted.table_stats.layout_tables_filtered, 1);
assert.ok(extracted.blocks.some((block) => block.type === 'paragraph' && block.text.includes('布局表中的正文')));
assert.ok(extracted.blocks.some((block) => block.type === 'image'));
assert.ok(extracted.blocks.some((block) => block.type === 'table'));

const challenge = extractArticle(
  '<html><head><title>环境异常</title></head><body><div id="js_content">访问过于频繁，请完成验证码。</div></body></html>',
  'https://mp.weixin.qq.com/s/challenge',
);
assert.equal(challenge.quality.challenge_detected, true);
await assert.rejects(() => assertSafeNetworkUrl('http://127.0.0.1/private'));
await assert.rejects(() => assertSafeNetworkUrl('https://user:password@127.0.0.1/private'));
const sameOriginHeaders = sanitizeRedirectHeaders({ cookie: 'temporary=1', authorization: 'Bearer synthetic', 'user-agent': 'test' }, 'https://weixin.sogou.com/a', 'https://weixin.sogou.com/b');
assert.equal(sameOriginHeaders.get('cookie'), 'temporary=1');
const crossOriginHeaders = sanitizeRedirectHeaders(sameOriginHeaders, 'https://weixin.sogou.com/a', 'https://mp.weixin.qq.com/s/example');
assert.equal(crossOriginHeaders.get('cookie'), null);
assert.equal(crossOriginHeaders.get('authorization'), null);
assert.equal(crossOriginHeaders.get('user-agent'), 'test');
assert.equal(tableToMarkdown({ rows: [{ cells: [{ text: 'A\\B | C' }] }] }), '| A\\\\B \\| C |\n| --- |');

const explicitChrome = chromeExecutableCandidates({ explicitPath: '/custom/chrome', platform: 'darwin', env: {}, homeDir: '/Users/tester' });
assert.equal(explicitChrome[0], '/custom/chrome');
const macChrome = chromeExecutableCandidates({ platform: 'darwin', env: {}, homeDir: '/Users/tester' });
assert.ok(macChrome.includes('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'));
assert.ok(macChrome.includes('/Users/tester/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'));
const linuxChrome = chromeExecutableCandidates({ platform: 'linux', env: {}, homeDir: '/home/tester' });
assert.ok(linuxChrome.includes('/usr/bin/google-chrome'));
const windowsChrome = chromeExecutableCandidates({ platform: 'win32', env: { LOCALAPPDATA: 'C:\\Users\\tester\\AppData\\Local' }, homeDir: 'C:\\Users\\tester' });
assert.ok(windowsChrome.includes('C:\\Users\\tester\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'));

const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'pachong-seo-test-'));
try {
  await packageArticle({
    html,
    url: 'https://mp.weixin.qq.com/s/test',
    source: { id: 'synthetic', title: 'SEO GEO 研究样本', topic: 'SEO GEO' },
    output: temporary,
    downloadImages: false,
  });
  let result = await validatePackage(temporary);
  assert.equal(result.passed, true);

  const articlePath = path.join(temporary, 'article.json');
  const article = JSON.parse(await fs.readFile(articlePath, 'utf8'));
  const tableFiles = await fs.readdir(path.join(temporary, 'tables'));
  assert.deepEqual(tableFiles.sort(), ['table-001.json', 'table-001.md']);
  const qualityReport = JSON.parse(await fs.readFile(path.join(temporary, 'quality-report.json'), 'utf8'));
  assert.equal(qualityReport.tables.data_tables_preserved, 1);
  assert.equal(qualityReport.tables.layout_tables_filtered, 1);
  const image = article.images[0];
  image.local_path = 'assets/images/synthetic.png';
  image.analysis_status = 'pending';
  await fs.mkdir(path.join(temporary, 'assets', 'images'), { recursive: true });
  await fs.writeFile(path.join(temporary, 'assets', 'images', 'synthetic.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  await fs.writeFile(articlePath, `${JSON.stringify(article, null, 2)}\n`, 'utf8');
  await fs.mkdir(path.join(temporary, 'vision'), { recursive: true });
  await fs.writeFile(path.join(temporary, 'vision', `${image.image_id}.analysis.json`), `${JSON.stringify({
    schema_version: '1.0',
    status: 'completed',
    image_id: image.image_id,
    source_path: image.local_path,
    source_sha256: null,
    profile: 'wechat-research',
    information_value: 'high',
    content_type: 'table-image',
    summary: '一张展示 SEO 与 GEO 研究文章数量的表格型配图。',
    ocr_text: '主题 文章数 SEO 7',
    extracted_knowledge: {
      claims: [{ text: 'SEO 样本数为 7', evidence: '表格 SEO 行', confidence: 0.92 }],
      data_points: [{ label: 'SEO', value: 7, unit: '篇', period: '', series: '文章数', evidence: '表格 SEO 行', confidence: 0.92 }],
      relationships: [],
    },
    decision: { keep_for_downstream: true, reason: '包含结构化研究数据。' },
    confidence: 0.92,
    evidence: ['表格包含主题和文章数两列。'],
    uncertainties: [],
  }, null, 2)}\n`, 'utf8');

  result = await finalizePackage(temporary);
  assert.equal(result.passed, true);
  assert.equal(result.status, 'ready_for_research');
  const finalized = JSON.parse(await fs.readFile(articlePath, 'utf8'));
  assert.equal(finalized.images[0].analysis_status, 'completed');
  assert.equal(finalized.images[0].analysis_ref, `vision/${image.image_id}.analysis.json`);
  const analysisPath = path.join(temporary, 'vision', `${image.image_id}.analysis.json`);
  const invalidAnalysis = JSON.parse(await fs.readFile(analysisPath, 'utf8'));
  delete invalidAnalysis.summary;
  await fs.writeFile(analysisPath, `${JSON.stringify(invalidAnalysis, null, 2)}\n`, 'utf8');
  await assert.rejects(() => finalizePackage(temporary), /Invalid image analysis/);
  console.log(JSON.stringify({ passed: true, checks: 33, status: result.status }, null, 2));
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}
