#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import net from 'node:net';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as cheerio from 'cheerio';
import { CheerioCrawler, Configuration } from '@crawlee/cheerio';
import puppeteer from 'puppeteer-core';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36';
const MAX_HTML_CHARS = 10_000_000;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const CHALLENGE_RE = /验证码|访问过于频繁|请输入验证码|异常请求|环境异常|安全验证|antispider|captcha/i;
const ARTICLE_SOURCE_HOSTS = new Set(['mp.weixin.qq.com']);
const dnsSafetyCache = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const cleanText = (value = '') => String(value).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const nowIso = () => new Date().toISOString();

function parseCli(argv) {
  const [command = 'help', ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    const next = rest[index + 1];
    if (next && !next.startsWith('--')) {
      options[key] = next;
      index += 1;
    } else {
      options[key] = true;
    }
  }
  return { command, options };
}

function numberOption(value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`Numeric option must be between ${min} and ${max}; received ${value}`);
  }
  return parsed;
}

function safeSegment(value, fallback = 'article') {
  const normalized = String(value || '')
    .normalize('NFKC')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return normalized || fallback;
}

function normalizeTitle(value = '') {
  return cleanText(value).toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
}

function titlesCompatible(actual, expected) {
  if (!expected || !actual) return true;
  const left = normalizeTitle(actual);
  const right = normalizeTitle(expected);
  return left.includes(right) || right.includes(left);
}

function isNonPublicIp(address) {
  const value = String(address || '').toLowerCase();
  if (value.startsWith('::ffff:')) return isNonPublicIp(value.slice(7));
  if (net.isIP(value) === 6) {
    return value === '::1' || value === '::'
      || value.startsWith('fc') || value.startsWith('fd') || /^fe[89ab]/.test(value)
      || value.startsWith('2001:db8:') || value.startsWith('2001:0:') || value.startsWith('2002:');
  }
  if (net.isIP(value) !== 4) return true;
  const parts = value.split('.').map(Number);
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 0) || (a === 192 && b === 168)
    || (a === 198 && (b === 18 || b === 19))
    || (a === 198 && b === 51) || (a === 203 && b === 0)
    || a >= 224;
}

export async function assertSafeNetworkUrl(input) {
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`Unsupported URL protocol: ${url.protocol}`);
  if (url.username || url.password) throw new Error('Credentials in URLs are not allowed');
  const host = url.hostname.toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.local')) throw new Error(`Private/local host is not allowed: ${host}`);
  if (!dnsSafetyCache.has(host)) {
    const records = await dns.lookup(host, { all: true, verbatim: true });
    if (!records.length || records.some((record) => isNonPublicIp(record.address))) {
      throw new Error(`Unsafe or unresolved destination: ${host}`);
    }
    dnsSafetyCache.set(host, true);
  }
  return url;
}

export async function assertAllowedArticleSourceUrl(input) {
  const url = await assertSafeNetworkUrl(input);
  if (!ARTICLE_SOURCE_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error(`Online capture only supports public WeChat article hosts: ${url.hostname}`);
  }
  return url;
}

export function sanitizeRedirectHeaders(inputHeaders, currentUrl, nextUrl) {
  const headers = new Headers(inputHeaders || {});
  if (new URL(currentUrl).origin !== new URL(nextUrl).origin) {
    headers.delete('authorization');
    headers.delete('cookie');
    headers.delete('proxy-authorization');
  }
  return headers;
}

async function safeFetch(input, options = {}) {
  let current = await assertSafeNetworkUrl(input);
  let headers = new Headers(options.headers || {});
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetch(current, { ...options, headers, redirect: 'manual' });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get('location');
    if (!location) return response;
    if (redirectCount === MAX_REDIRECTS) throw new Error(`Too many redirects: ${input}`);
    const next = await assertSafeNetworkUrl(new URL(location, current).href);
    headers = sanitizeRedirectHeaders(headers, current, next);
    await response.body?.cancel().catch(() => {});
    current = next;
  }
  throw new Error(`Too many redirects: ${input}`);
}

function normalizeUrl(value, baseUrl) {
  if (!value || /^\s*(data:|javascript:)/i.test(value)) return null;
  try {
    const url = new URL(value, baseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}

async function fetchText(url, headers = {}) {
  const started = performance.now();
  const response = await safeFetch(url, {
    headers: { 'user-agent': USER_AGENT, ...headers },
    signal: AbortSignal.timeout(60_000),
  });
  await assertSafeNetworkUrl(response.url);
  const declared = Number(response.headers.get('content-length') || 0);
  if (declared > MAX_HTML_CHARS) throw new Error(`Response too large: ${declared} bytes`);
  const text = await response.text();
  if (text.length > MAX_HTML_CHARS) throw new Error(`Response too large after decode: ${text.length} chars`);
  return { response, text, duration_ms: Math.round(performance.now() - started) };
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function metaValue($, selector, attribute = 'content') {
  return cleanText($(selector).first().attr(attribute) || '');
}

function firstImageUrl($, element, baseUrl) {
  const node = $(element);
  for (const attribute of ['data-src', 'data-original', 'data-actualsrc', 'data-backsrc', 'src']) {
    const url = normalizeUrl(node.attr(attribute), baseUrl);
    if (url) return { url, source_attribute: attribute };
  }
  return null;
}

function tableToMarkdown(table) {
  if (!table.rows.length) return '';
  const width = Math.max(...table.rows.map((row) => row.cells.length));
  const rows = table.rows.map((row) => Array.from({ length: width }, (_, index) => cleanText(row.cells[index]?.text || '').replace(/\|/g, '\\|')));
  const header = rows[0];
  const divider = Array.from({ length: width }, () => '---');
  return [header, divider, ...rows.slice(1)].map((row) => `| ${row.join(' | ')} |`).join('\n');
}

export function extractArticle(html, url, source = {}) {
  const $ = cheerio.load(html || '');
  const selector = ['#js_content', 'article', 'main', 'body'].find((candidate) => $(candidate).first().length) || null;
  const root = selector ? $(selector).first() : $.root();
  const textRoot = root.clone();
  textRoot.find('script,style,noscript').remove();
  const bodyText = cleanText(textRoot.text());
  const title = metaValue($, 'meta[property="og:title"]') || cleanText($('#activity-name').first().text()) || cleanText($('title').first().text());
  const metadata = {
    title,
    publisher: cleanText($('#js_name').first().text()) || metaValue($, 'meta[property="og:article:author"]') || metaValue($, 'meta[name="author"]'),
    author: cleanText($('#js_author_name').first().text()) || metaValue($, 'meta[name="author"]'),
    publish_date: cleanText($('#publish_time').first().text()),
    description: metaValue($, 'meta[property="og:description"]') || metaValue($, 'meta[name="description"]'),
  };

  const blocks = [];
  const images = [];
  const imageByUrl = new Map();
  const tables = [];
  const tableStats = { native_detected: 0, data_tables_preserved: 0, layout_tables_filtered: 0 };

  function registerImage(element) {
    const selected = firstImageUrl($, element, url);
    if (!selected) return;
    let image = imageByUrl.get(selected.url);
    if (!image) {
      const node = $(element);
      const context = cleanText([
        node.attr('alt'), node.attr('title'), node.parent().text(), node.parent().prev().text(), node.parent().next().text(),
      ].filter(Boolean).join(' ')).slice(0, 500);
      image = {
        image_id: `img-${String(images.length + 1).padStart(3, '0')}`,
        source_url: selected.url,
        source_attribute: selected.source_attribute,
        local_path: null,
        article_position: blocks.length,
        alt: cleanText(node.attr('alt') || ''),
        context,
        sha256: null,
        content_type: null,
        bytes: 0,
        analysis_status: 'not_requested',
        analysis_ref: null,
      };
      images.push(image);
      imageByUrl.set(selected.url, image);
    }
    blocks.push({ type: 'image', image_id: image.image_id });
  }

  function registerTable(element) {
    const node = $(element);
    const rows = [];
    tableStats.native_detected += 1;
    node.find('tr').filter((_, rowElement) => $(rowElement).parents('table').first().get(0) === element).each((rowIndex, rowElement) => {
      const cells = [];
      $(rowElement).children('th,td').each((cellIndex, cellElement) => {
        const cell = $(cellElement);
        cells.push({
          cell_index: cellIndex,
          tag: cellElement.tagName?.toLowerCase() || 'td',
          text: cleanText(cell.text()),
          rowspan: Number(cell.attr('rowspan') || 1),
          colspan: Number(cell.attr('colspan') || 1),
        });
      });
      if (cells.length) rows.push({ row_index: rowIndex, cells });
    });
    const cellCount = rows.reduce((sum, row) => sum + row.cells.length, 0);
    const isDataTable = rows.length >= 2 && cellCount / rows.length >= 2;
    if (!isDataTable) {
      tableStats.layout_tables_filtered += 1;
      node.children().toArray().filter((child) => child.type === 'tag').forEach(walk);
      return;
    }
    const table = {
      table_id: `table-${String(tables.length + 1).padStart(3, '0')}`,
      row_count: rows.length,
      cell_count: cellCount,
      is_data_table: true,
      rows,
      original_html: $.html(element),
    };
    table.markdown = tableToMarkdown(table);
    tables.push(table);
    tableStats.data_tables_preserved += 1;
    blocks.push({ type: 'table', table_id: table.table_id });
  }

  function textWithoutMedia(element) {
    const clone = $(element).clone();
    clone.find('img,table,script,style,noscript').remove();
    return cleanText(clone.text());
  }

  function walk(element) {
    if (!element || element.type !== 'tag') return;
    const tag = String(element.tagName || element.name || '').toLowerCase();
    const node = $(element);
    if (tag === 'table') return registerTable(element);
    if (tag === 'img') return registerImage(element);
    if (/^h[1-6]$/.test(tag)) {
      const text = textWithoutMedia(element);
      if (text) blocks.push({ type: 'heading', level: Number(tag.slice(1)), text });
      node.find('img').each((_, image) => registerImage(image));
      return;
    }
    if (tag === 'p') {
      const text = textWithoutMedia(element);
      if (text) blocks.push({ type: 'paragraph', text });
      node.find('img').each((_, image) => registerImage(image));
      return;
    }
    if (tag === 'blockquote') {
      const text = textWithoutMedia(element);
      if (text) blocks.push({ type: 'blockquote', text });
      node.find('img').each((_, image) => registerImage(image));
      return;
    }
    if (tag === 'pre' || tag === 'code') {
      const text = cleanText(node.text());
      if (text) blocks.push({ type: 'code', text });
      return;
    }
    if (tag === 'ul' || tag === 'ol') {
      const items = [];
      node.children('li').each((_, item) => {
        const text = textWithoutMedia(item);
        if (text) items.push(text);
      });
      if (items.length) blocks.push({ type: 'list', ordered: tag === 'ol', items });
      node.find('img').each((_, image) => registerImage(image));
      return;
    }
    const childTags = node.children().toArray().filter((child) => child.type === 'tag');
    if (childTags.length) childTags.forEach(walk);
    else {
      const text = cleanText(node.text());
      if (text) blocks.push({ type: 'paragraph', text });
    }
  }

  root.children().toArray().forEach(walk);
  if (!blocks.some((block) => ['heading', 'paragraph', 'blockquote', 'list', 'code'].includes(block.type)) && bodyText) {
    blocks.unshift({ type: 'paragraph', text: bodyText });
  }

  const challengeDetected = CHALLENGE_RE.test(`${title}\n${bodyText}\n${html.slice(0, 100_000)}`);
  const failures = [];
  if (!selector || selector === 'body') failures.push('wechat_body_selector_missing');
  if (bodyText.length < 100) failures.push('body_too_short');
  if (bodyText.length > 100_000) failures.push('body_too_long_or_script_shell');
  if (challengeDetected) failures.push('challenge_or_environment_error');
  if (!titlesCompatible(title, source.title)) failures.push('title_mismatch');
  if (!title) failures.push('title_missing');

  return {
    selector,
    body_text: bodyText,
    metadata,
    blocks,
    images,
    tables,
    table_stats: tableStats,
    quality: {
      passed: failures.length === 0,
      failures,
      challenge_detected: challengeDetected,
      text_chars: bodyText.length,
      title_match: titlesCompatible(title, source.title),
    },
  };
}

function contentExtension(contentType) {
  const type = String(contentType || '').split(';')[0].toLowerCase();
  return ({
    'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
    'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/avif': 'avif',
  })[type] || 'img';
}

async function downloadImage(image, packageRoot) {
  try {
    const response = await safeFetch(image.source_url, {
      headers: { 'user-agent': USER_AGENT, referer: image.article_url || '', accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8' },
      signal: AbortSignal.timeout(60_000),
    });
    await assertSafeNetworkUrl(response.url);
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.toLowerCase().startsWith('image/')) throw new Error(`HTTP ${response.status} ${contentType}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error(`Invalid image size: ${bytes.length}`);
    const digest = sha256(bytes);
    const relative = `assets/images/${digest}.${contentExtension(contentType)}`;
    await fs.mkdir(path.join(packageRoot, 'assets', 'images'), { recursive: true });
    await fs.writeFile(path.join(packageRoot, ...relative.split('/')), bytes);
    return { ...image, local_path: relative, sha256: digest, content_type: contentType.split(';')[0], bytes: bytes.length, analysis_status: 'pending', error: null };
  } catch (error) {
    return { ...image, analysis_status: 'failed', error: String(error) };
  }
}

async function mapLimit(items, limit, worker) {
  const output = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return output;
}

function renderArticleMarkdown(article, tableById) {
  const lines = [`# ${article.metadata.title || 'Untitled article'}`, ''];
  if (article.metadata.publisher) lines.push(`- Publisher: ${article.metadata.publisher}`);
  if (article.metadata.author) lines.push(`- Author: ${article.metadata.author}`);
  if (article.metadata.publish_date) lines.push(`- Published: ${article.metadata.publish_date}`);
  lines.push(`- Source: ${article.source.url}`, '');
  for (const block of article.blocks) {
    if (block.type === 'heading') lines.push(`${'#'.repeat(Math.max(2, Math.min(6, block.level)))} ${block.text}`, '');
    else if (block.type === 'paragraph') lines.push(block.text, '');
    else if (block.type === 'blockquote') lines.push(`> ${block.text}`, '');
    else if (block.type === 'code') lines.push('```', block.text, '```', '');
    else if (block.type === 'list') {
      block.items.forEach((item, index) => lines.push(`${block.ordered ? `${index + 1}.` : '-'} ${item}`));
      lines.push('');
    } else if (block.type === 'image') {
      const image = article.images.find((item) => item.image_id === block.image_id);
      if (image) lines.push(`![${image.alt || image.image_id}](${image.local_path || image.source_url})`, '');
    } else if (block.type === 'table') {
      const table = tableById.get(block.table_id);
      if (table?.markdown) lines.push(table.markdown, '');
    }
  }
  return `${lines.join('\n').trim()}\n`;
}

export async function packageArticle({ html, url, source = {}, output, adapter = 'offline-source-adapter', downloadImages = true }) {
  const packageRoot = path.resolve(output);
  await fs.mkdir(path.join(packageRoot, 'raw'), { recursive: true });
  await fs.mkdir(path.join(packageRoot, 'tables'), { recursive: true });
  await fs.writeFile(path.join(packageRoot, 'raw', 'source.html'), html || '', 'utf8');
  const extracted = extractArticle(html, url, source);
  let images = extracted.images.map((image) => ({ ...image, article_url: url }));
  if (downloadImages && images.length) images = await mapLimit(images, 3, (image) => downloadImage(image, packageRoot));

  for (const table of extracted.tables) {
    const tableJson = { ...table };
    delete tableJson.markdown;
    await writeJson(path.join(packageRoot, 'tables', `${table.table_id}.json`), tableJson);
    await fs.writeFile(path.join(packageRoot, 'tables', `${table.table_id}.md`), `${table.markdown}\n`, 'utf8');
  }

  const downloaded = images.filter((image) => image.local_path).length;
  const imageCapturePassed = !downloadImages || downloaded === images.length;
  const status = extracted.quality.passed && imageCapturePassed ? 'capture_complete' : 'needs_retry';
  const articleId = safeSegment(source.id || sha256(`${url}|${extracted.metadata.title}`).slice(0, 16));
  const article = {
    schema_version: 1,
    article_id: articleId,
    status,
    source: {
      url,
      discovery_source: source.discovery_source || 'direct-url',
      original_rank: source.original_rank ?? source.rank ?? null,
      topic: source.topic || null,
      captured_at: nowIso(),
      adapter,
    },
    metadata: extracted.metadata,
    blocks: extracted.blocks,
    images: images.map(({ article_url: _, ...image }) => image),
    tables: extracted.tables.map((table) => ({
      table_id: table.table_id,
      row_count: table.row_count,
      cell_count: table.cell_count,
      is_data_table: table.is_data_table,
      json_path: `tables/${table.table_id}.json`,
      markdown_path: `tables/${table.table_id}.md`,
    })),
  };
  const jobs = article.images.filter((image) => image.local_path).map((image) => ({
    image_id: image.image_id,
    image_path: image.local_path,
    context: image.context,
    output_path: `vision/${image.image_id}.analysis.json`,
  }));
  const quality = {
    schema_version: 1,
    status,
    body: extracted.quality,
    images: { discovered: images.length, downloaded, failed: images.length - downloaded, passed: imageCapturePassed },
    tables: {
      native_detected: extracted.table_stats.native_detected,
      data_tables_preserved: extracted.table_stats.data_tables_preserved,
      layout_tables_filtered: extracted.table_stats.layout_tables_filtered,
      native: extracted.table_stats.native_detected,
      data_tables: extracted.tables.length,
      rows: extracted.tables.reduce((sum, table) => sum + table.row_count, 0),
      cells: extracted.tables.reduce((sum, table) => sum + table.cell_count, 0),
    },
  };
  const evidence = {
    schema_version: 1,
    captured_at: article.source.captured_at,
    adapter,
    source_url: url,
    raw_html_sha256: sha256(html || ''),
    body_text_sha256: sha256(extracted.body_text),
    body_selector: extracted.selector,
  };
  const manifest = {
    schema_version: 1,
    article_id: articleId,
    status,
    counts: { blocks: article.blocks.length, images: article.images.length, tables: article.tables.length, vision_jobs: jobs.length },
    files: ['article.json', 'article.md', 'manifest.json', 'vision-jobs.json', 'evidence.json', 'quality-report.json', 'raw/source.html'],
  };
  const tableById = new Map(extracted.tables.map((table) => [table.table_id, table]));
  await writeJson(path.join(packageRoot, 'article.json'), article);
  await fs.writeFile(path.join(packageRoot, 'article.md'), renderArticleMarkdown(article, tableById), 'utf8');
  await writeJson(path.join(packageRoot, 'vision-jobs.json'), { schema_version: 1, profile: 'wechat-research', consumer_skill: 'sp-tupian-lijie-xinxi-tiqu', jobs });
  await writeJson(path.join(packageRoot, 'evidence.json'), evidence);
  await writeJson(path.join(packageRoot, 'quality-report.json'), quality);
  await writeJson(path.join(packageRoot, 'manifest.json'), manifest);
  return { package_root: packageRoot, article, quality, evidence, extracted };
}

function resolveInside(root, relativePath) {
  const resolved = path.resolve(root, ...String(relativePath).split('/'));
  const prefix = `${path.resolve(root)}${path.sep}`;
  if (resolved !== path.resolve(root) && !resolved.startsWith(prefix)) throw new Error(`Path escapes package root: ${relativePath}`);
  return resolved;
}

async function fileExists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}

const IMAGE_ANALYSIS_ENUMS = {
  status: new Set(['completed', 'failed', 'needs_review']),
  profile: new Set(['wechat-research', 'social-marketing']),
  information_value: new Set(['high', 'medium', 'low', 'decorative', 'uncertain']),
  content_type: new Set(['photo', 'screenshot', 'chart', 'table-image', 'flowchart', 'infographic', 'illustration', 'logo', 'qr-code', 'divider', 'other']),
};

function validateImageAnalysis(analysis, image, relative) {
  const errors = [];
  if (analysis.schema_version !== '1.0') errors.push('schema_version');
  if (!IMAGE_ANALYSIS_ENUMS.status.has(analysis.status)) errors.push('status');
  if (analysis.image_id !== image.image_id) errors.push('image_id');
  if (analysis.source_path !== image.local_path) errors.push('source_path');
  if (analysis.source_sha256 != null && analysis.source_sha256 !== image.sha256) errors.push('source_sha256');
  if (!IMAGE_ANALYSIS_ENUMS.profile.has(analysis.profile)) errors.push('profile');
  if (!IMAGE_ANALYSIS_ENUMS.information_value.has(analysis.information_value)) errors.push('information_value');
  if (!IMAGE_ANALYSIS_ENUMS.content_type.has(analysis.content_type)) errors.push('content_type');
  for (const field of ['summary', 'ocr_text']) if (typeof analysis[field] !== 'string') errors.push(field);
  if (!analysis.extracted_knowledge || !Array.isArray(analysis.extracted_knowledge.claims)
    || !Array.isArray(analysis.extracted_knowledge.data_points) || !Array.isArray(analysis.extracted_knowledge.relationships)) {
    errors.push('extracted_knowledge');
  }
  if (!analysis.decision || typeof analysis.decision.keep_for_downstream !== 'boolean' || typeof analysis.decision.reason !== 'string' || !analysis.decision.reason) {
    errors.push('decision');
  }
  if (!Number.isFinite(analysis.confidence) || analysis.confidence < 0 || analysis.confidence > 1) errors.push('confidence');
  if (!Array.isArray(analysis.evidence)) errors.push('evidence');
  if (!Array.isArray(analysis.uncertainties)) errors.push('uncertainties');
  if (analysis.status === 'failed' && (typeof analysis.error !== 'string' || !analysis.error)) errors.push('error');
  if (errors.length) throw new Error(`Invalid image analysis ${relative}: ${errors.join(', ')}`);
}

export async function validatePackage(packageRoot) {
  const root = path.resolve(packageRoot);
  const errors = [];
  for (const required of ['manifest.json', 'article.json', 'article.md', 'vision-jobs.json', 'evidence.json', 'quality-report.json', 'raw/source.html']) {
    if (!await fileExists(path.join(root, ...required.split('/')))) errors.push(`missing:${required}`);
  }
  if (errors.length) return { passed: false, errors };
  const article = await readJson(path.join(root, 'article.json'));
  if (article.schema_version !== 1) errors.push('article_schema_version');
  if (!Array.isArray(article.blocks)) errors.push('blocks_not_array');
  for (const table of article.tables || []) {
    for (const field of ['json_path', 'markdown_path']) {
      if (!table[field] || !await fileExists(resolveInside(root, table[field]))) errors.push(`missing_table_ref:${table.table_id}:${field}`);
    }
  }
  for (const image of article.images || []) {
    if (image.local_path && !await fileExists(resolveInside(root, image.local_path))) errors.push(`missing_image:${image.image_id}`);
    if (image.analysis_ref && !await fileExists(resolveInside(root, image.analysis_ref))) {
      errors.push(`missing_analysis:${image.image_id}`);
    }
    if (['completed', 'skipped_decorative'].includes(image.analysis_status) && !image.analysis_ref) errors.push(`analysis_ref_required:${image.image_id}`);
  }
  return { passed: errors.length === 0, errors, article_id: article.article_id, status: article.status };
}

export async function finalizePackage(packageRoot) {
  const root = path.resolve(packageRoot);
  const articlePath = path.join(root, 'article.json');
  const article = await readJson(articlePath);
  const quality = await readJson(path.join(root, 'quality-report.json'));
  let completed = 0;
  let skipped = 0;
  let failed = 0;
  let needsReview = 0;
  for (const image of article.images || []) {
    if (!image.local_path) continue;
    const relative = `vision/${image.image_id}.analysis.json`;
    const target = resolveInside(root, relative);
    if (!await fileExists(target)) {
      image.analysis_status = image.analysis_status === 'skipped_decorative' ? image.analysis_status : 'pending';
      image.analysis_ref = null;
      continue;
    }
    const analysis = await readJson(target);
    validateImageAnalysis(analysis, image, relative);
    image.analysis_ref = relative;
    if (analysis.status === 'completed' && analysis.information_value === 'decorative') {
      image.analysis_status = 'skipped_decorative';
      skipped += 1;
    } else if (analysis.status === 'completed') {
      image.analysis_status = 'completed';
      completed += 1;
    } else {
      image.analysis_status = 'failed';
      failed += 1;
      if (analysis.status === 'needs_review') needsReview += 1;
    }
  }
  const pending = (article.images || []).filter((image) => image.local_path && image.analysis_status === 'pending').length;
  const baseCapturePassed = quality.body?.passed === true && quality.images?.passed === true;
  article.status = !baseCapturePassed || failed > 0
    ? 'needs_retry'
    : (pending === 0 ? 'ready_for_research' : 'capture_complete');
  await writeJson(articlePath, article);
  quality.status = article.status;
  quality.vision = {
    requested: (article.images || []).filter((image) => image.local_path).length,
    completed,
    skipped_decorative: skipped,
    failed,
    needs_review: needsReview,
    pending,
  };
  await writeJson(path.join(root, 'quality-report.json'), quality);
  const manifest = await readJson(path.join(root, 'manifest.json'));
  manifest.status = article.status;
  await writeJson(path.join(root, 'manifest.json'), manifest);
  return validatePackage(root);
}

function relevanceScore(item, topic) {
  const title = item.title.toUpperCase();
  const summary = item.summary.toUpperCase();
  const escaped = topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const exactTitle = (title.match(new RegExp(`\\b${escaped}\\b`, 'g')) || []).length;
  const exactSummary = (summary.match(new RegExp(`\\b${escaped}\\b`, 'g')) || []).length;
  return exactTitle * 100 + exactSummary * 12 + (title.startsWith(topic.toUpperCase()) ? 15 : 0) + (item.publisher ? 3 : 0) + Math.max(0, 30 - item.original_rank);
}

async function resolveSogouResult(item) {
  const bridgeUrl = new URL(item.href, 'https://weixin.sogou.com').href;
  if (bridgeUrl.startsWith('https://mp.weixin.qq.com/')) return bridgeUrl;
  const { text } = await fetchText(bridgeUrl, { referer: item.search_url, cookie: item.cookie || '' });
  if (CHALLENGE_RE.test(text)) throw new Error('Sogou challenge page while resolving result');
  const parts = [...text.matchAll(/url\s*\+=\s*'([^']*)'/g)].map((match) => match[1]);
  const articleUrl = parts.join('').replaceAll('@', '');
  if (!articleUrl.startsWith('https://mp.weixin.qq.com/')) throw new Error('Unable to resolve public WeChat article URL');
  return articleUrl;
}

export async function discoverTopics({ topics, topK = 7, pages = 2, minDelayMs = 1300 }) {
  const candidates = [];
  for (const topic of topics) {
    for (let page = 1; page <= pages; page += 1) {
      const searchUrl = `https://weixin.sogou.com/weixin?type=2&query=${encodeURIComponent(topic)}&page=${page}`;
      const { response, text } = await fetchText(searchUrl);
      if (CHALLENGE_RE.test(text)) throw new Error(`Public search challenge detected for ${topic}; stop and use user-provided URLs`);
      const cookie = typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie().map((item) => item.split(';')[0]).join('; ')
        : (response.headers.get('set-cookie') || '').split(';')[0];
      const $ = cheerio.load(text);
      $('ul.news-list li, .news-list li').each((index, element) => {
        const row = $(element);
        const anchor = row.find('h3 a').first();
        const title = cleanText(anchor.text());
        const href = anchor.attr('href');
        if (!title || !href) return;
        candidates.push({
          topic,
          page,
          original_rank: (page - 1) * 10 + index + 1,
          title,
          summary: cleanText(row.find('.txt-info').first().text()),
          publisher: cleanText(row.find('.s-p a, .s-p').first().text()),
          href,
          search_url: searchUrl,
          cookie,
        });
      });
      await sleep(Math.max(500, minDelayMs));
    }
  }
  const selected = [];
  const discoveryFailures = [];
  const seen = new Set();
  for (const topic of topics) {
    const rows = candidates.filter((item) => item.topic === topic)
      .map((item) => ({ ...item, relevance_score: relevanceScore(item, topic) }))
      .sort((a, b) => b.relevance_score - a.relevance_score || a.original_rank - b.original_rank);
    let topicCount = 0;
    for (const row of rows) {
      if (topicCount >= topK) break;
      let articleUrl = null;
      try {
        articleUrl = await resolveSogouResult(row);
        await assertAllowedArticleSourceUrl(articleUrl);
      } catch (error) {
        discoveryFailures.push({
          topic,
          title: row.title,
          publisher: row.publisher,
          original_rank: row.original_rank,
          failed_dimension: 'source_resolution',
          error: String(error),
        });
        await sleep(Math.max(500, minDelayMs));
        continue;
      }
      const identityKey = `${normalizeTitle(row.title)}::${cleanText(row.publisher).toLowerCase()}`;
      if (seen.has(articleUrl) || seen.has(identityKey)) {
        discoveryFailures.push({
          topic,
          title: row.title,
          publisher: row.publisher,
          original_rank: row.original_rank,
          failed_dimension: 'duplicate',
          error: 'Duplicate URL or title/publisher identity',
        });
        await sleep(Math.max(500, minDelayMs));
        continue;
      }
      seen.add(articleUrl);
      seen.add(identityKey);
      selected.push({
        id: String(selected.length + 1).padStart(2, '0'),
        topic,
        title: row.title,
        summary: row.summary,
        publisher: row.publisher,
        original_rank: row.original_rank,
        relevance_score: row.relevance_score,
        article_url: articleUrl,
        discovery_source: 'sogou-weixin',
      });
      topicCount += 1;
      await sleep(Math.max(500, minDelayMs));
    }
  }
  const requestedCount = topics.length * topK;
  return {
    schema_version: 1,
    generated_at: nowIso(),
    source: 'sogou-weixin',
    source_position_semantics: 'observed Sogou Weixin result order, not native WeChat App search rank',
    topics,
    top_k: topK,
    requested_count: requestedCount,
    candidates_count: candidates.length,
    resolved_unique_count: selected.length,
    shortfall: Math.max(0, requestedCount - selected.length),
    discovery_failures: discoveryFailures,
    articles: selected,
  };
}

function normalizeSources(payload) {
  const rows = Array.isArray(payload) ? payload : payload.articles;
  if (!Array.isArray(rows)) throw new Error('Input JSON must be an array or contain articles[]');
  return rows.map((row, index) => ({
    ...row,
    id: safeSegment(row.id || String(index + 1).padStart(2, '0')),
    article_url: row.article_url || row.articleUrl || row.url,
  })).filter((row) => row.article_url);
}

async function captureHttpBatch(sources, minDelayMs) {
  const map = new Map();
  for (const source of sources) {
    const started = performance.now();
    try {
      await assertAllowedArticleSourceUrl(source.article_url);
      const result = await fetchText(source.article_url, { referer: 'https://weixin.sogou.com/' });
      map.set(source.id, { html: result.text, adapter: 'http-wechat-source', duration_ms: result.duration_ms, http_status: result.response.status });
    } catch (error) {
      map.set(source.id, { html: '', adapter: 'http-wechat-source', duration_ms: Math.round(performance.now() - started), error: String(error) });
    }
    await sleep(Math.max(500, minDelayMs));
  }
  return map;
}

async function captureCrawleeBatch(sources) {
  const map = new Map();
  for (const source of sources) await assertAllowedArticleSourceUrl(source.article_url);
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sp-pachong-crawlee-'));
  const config = new Configuration({ storageDir, purgeOnStart: true });
  try {
    const crawler = new CheerioCrawler({
      maxConcurrency: 2,
      maxRequestRetries: 2,
      requestHandlerTimeoutSecs: 90,
      preNavigationHooks: [async ({ request }, options) => {
        await assertAllowedArticleSourceUrl(request.url);
        request.userData.started_at = Date.now();
        options.headers = { ...(options.headers || {}), 'user-agent': USER_AGENT, referer: 'https://weixin.sogou.com/' };
        options.followRedirect = false;
        options.maxRedirects = 0;
      }],
      requestHandler: async ({ request, body, response }) => {
        await assertAllowedArticleSourceUrl(request.loadedUrl || request.url);
        const html = String(body || '');
        if (html.length > MAX_HTML_CHARS) throw new Error(`HTML too large: ${html.length}`);
        map.set(request.userData.source_id, {
          html,
          adapter: 'crawlee-http-wechat-source',
          duration_ms: Date.now() - Number(request.userData.started_at || Date.now()),
          http_status: response?.statusCode || 0,
        });
      },
      failedRequestHandler: async ({ request, error }) => {
        map.set(request.userData.source_id, { html: '', adapter: 'crawlee-http-wechat-source', error: String(error) });
      },
    }, config);
    await crawler.run(sources.map((source) => ({
      url: source.article_url,
      uniqueKey: `${source.id}:${source.article_url}`,
      userData: { source_id: source.id, started_at: Date.now() },
    })));
  } finally {
    await fs.rm(storageDir, { recursive: true, force: true });
  }
  return map;
}

async function findChrome(explicitPath) {
  const candidates = [
    explicitPath,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe') : null,
    process.env.PROGRAMFILES ? path.join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe') : null,
    process.env['PROGRAMFILES(X86)'] ? path.join(process.env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe') : null,
  ].filter(Boolean);
  for (const candidate of candidates) if (await fileExists(candidate)) return candidate;
  throw new Error('Chrome executable not found; pass --chrome-path or PUPPETEER_EXECUTABLE_PATH');
}

async function captureBrowserOne(browser, source) {
  let page = null;
  const started = performance.now();
  try {
    await assertAllowedArticleSourceUrl(source.article_url);
    page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.setViewport({ width: 1280, height: 900 });
    await page.setRequestInterception(true);
    page.on('request', async (request) => {
      try {
        const requestUrl = request.url();
        if (!/^(data:|blob:|about:)/i.test(requestUrl)) await assertSafeNetworkUrl(requestUrl);
        if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
          await assertAllowedArticleSourceUrl(requestUrl);
        }
        await request.continue();
      } catch {
        await request.abort('blockedbyclient').catch(() => {});
      }
    });
    const response = await page.goto(source.article_url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await sleep(1200);
    const html = await page.content();
    if (html.length > MAX_HTML_CHARS) throw new Error(`Rendered HTML too large: ${html.length}`);
    return { html, adapter: 'puppeteer-browser', duration_ms: Math.round(performance.now() - started), http_status: response?.status() || 0 };
  } catch (error) {
    return { html: '', adapter: 'puppeteer-browser', duration_ms: Math.round(performance.now() - started), error: String(error) };
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

async function captureCommand(options) {
  if (!options.input || !options.output) throw new Error('capture requires --input and --output');
  const sources = normalizeSources(await readJson(path.resolve(options.input)));
  const engine = String(options.engine || 'auto').toLowerCase();
  if (!['auto', 'http', 'crawlee', 'puppeteer'].includes(engine)) throw new Error(`Unsupported engine: ${engine}`);
  const minDelayMs = numberOption(options['min-delay-ms'], 1000, { min: 500, max: 60_000 });
  let initial = new Map();
  if (engine === 'http') initial = await captureHttpBatch(sources, minDelayMs);
  else if (engine === 'puppeteer') initial = new Map();
  else initial = await captureCrawleeBatch(sources);
  let browser = null;
  let browserUnavailableError = null;
  const results = [];
  try {
    for (const source of sources) {
      const packageRoot = path.join(path.resolve(options.output), 'article-package', safeSegment(source.id));
      let capture = initial.get(source.id) || { html: '', adapter: engine };
      try {
        let extracted = extractArticle(capture.html, source.article_url, source);
        let fallbackError = null;
        if (engine === 'puppeteer' || (engine === 'auto' && !extracted.quality.passed)) {
          if (!browser && !browserUnavailableError) {
            try {
              browser = await puppeteer.launch({
                executablePath: await findChrome(options['chrome-path']),
                headless: true,
                waitForInitialPage: false,
                timeout: 60_000,
                args: ['--disable-gpu', '--no-first-run'],
              });
            } catch (error) {
              browserUnavailableError = String(error);
            }
          }
          const fallback = browser
            ? await captureBrowserOne(browser, source)
            : { html: '', adapter: 'puppeteer-browser', error: browserUnavailableError || 'Browser unavailable' };
          const fallbackExtracted = extractArticle(fallback.html, source.article_url, source);
          fallbackError = fallback.error || (fallbackExtracted.quality.passed ? null : fallbackExtracted.quality.failures.join('; '));
          if (engine === 'puppeteer' || fallbackExtracted.quality.passed) {
            capture = fallback;
            extracted = fallbackExtracted;
          }
        }
        const packaged = await packageArticle({ html: capture.html, url: source.article_url, source, output: packageRoot, adapter: capture.adapter, downloadImages: true });
        results.push({
          article_id: packaged.article.article_id,
          title: packaged.article.metadata.title,
          status: packaged.article.status,
          adapter: capture.adapter,
          package_root: packageRoot,
          quality_failures: packaged.quality.body.failures,
          capture_error: capture.error || fallbackError || null,
        });
      } catch (error) {
        results.push({
          article_id: source.id,
          title: source.title || '',
          status: 'capture_failed',
          adapter: capture.adapter,
          package_root: packageRoot,
          quality_failures: ['capture_exception'],
          capture_error: String(error),
        });
      }
      await sleep(minDelayMs);
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
  const report = { schema_version: 1, generated_at: nowIso(), engine, declared: sources.length, captured: results.length, ready_capture: results.filter((row) => row.status === 'capture_complete').length, results };
  await writeJson(path.join(path.resolve(options.output), 'batch-report.json'), report);
  return report;
}

async function regressionCommand(options) {
  if (!options['benchmark-root'] || !options.output) throw new Error('regression requires --benchmark-root and --output');
  const benchmarkRoot = path.resolve(options['benchmark-root']);
  const dataset = await readJson(path.join(benchmarkRoot, 'results', 'dataset.json'));
  const fixture = await readJson(path.join(SCRIPT_DIR, '..', 'references', 'benchmark-fixture.json'));
  const articles = dataset.articles || [];
  const results = [];
  let sourceBodies = 0;
  let dataTableCount = 0;
  let dataRows = 0;
  let dataCells = 0;
  let articlesWithDataTables = 0;
  for (const source of articles) {
    const rawPath = source.rawFile ? path.join(benchmarkRoot, 'raw-html', source.rawFile) : null;
    const html = rawPath && await fileExists(rawPath) ? await fs.readFile(rawPath, 'utf8') : '';
    const extracted = extractArticle(html, source.articleUrl || source.article_url || '', source);
    if (extracted.selector === '#js_content') sourceBodies += 1;
    const dataTables = extracted.tables.filter((table) => table.is_data_table);
    if (dataTables.length) articlesWithDataTables += 1;
    dataTableCount += dataTables.length;
    dataRows += dataTables.reduce((sum, table) => sum + table.row_count, 0);
    dataCells += dataTables.reduce((sum, table) => sum + table.cell_count, 0);
    const output = path.join(path.resolve(options.output), 'article-package', safeSegment(source.id));
    const packaged = await packageArticle({ html, url: source.articleUrl || source.article_url || '', source, output, adapter: 'offline-regression', downloadImages: false });
    const validation = await validatePackage(output);
    results.push({ id: source.id, selector: extracted.selector, status: packaged.article.status, validation });
  }
  const actual = {
    declared_articles: articles.length,
    source_html_bodies_found: sourceBodies,
    articles_with_data_tables: articlesWithDataTables,
    data_table_count: dataTableCount,
    data_table_rows: dataRows,
    data_table_cells: dataCells,
  };
  const expected = fixture.expected;
  const checkedKeys = Object.keys(actual);
  const mismatches = checkedKeys.filter((key) => actual[key] !== expected[key]).map((key) => ({ key, expected: expected[key], actual: actual[key] }));
  const report = { schema_version: 1, benchmark_id: fixture.benchmark_id, generated_at: nowIso(), passed: mismatches.length === 0 && results.every((row) => row.validation.passed), expected, actual, mismatches, results };
  await writeJson(path.join(path.resolve(options.output), 'regression-report.json'), report);
  if (!report.passed) process.exitCode = 1;
  return report;
}

function helpText() {
  return `WeChat Multimodal Research Crawler for Codex\n\nCommands:\n  discover --topics SEO,GEO --top-k 7 --output DIR\n  capture --input sources.json --output DIR --engine auto|http|crawlee|puppeteer\n  package-html --html FILE --url URL --output DIR [--download-images]\n  finalize --input ARTICLE_PACKAGE_DIR\n  validate --input ARTICLE_PACKAGE_DIR\n  regression --benchmark-root DIR --output DIR\n\nOnline discovery uses public Sogou Weixin pages. Online article capture is restricted to public mp.weixin.qq.com URLs.\n`;
}

export async function runCli(argv = process.argv.slice(2)) {
  const { command, options } = parseCli(argv);
  if (command === 'help' || options.help) return console.log(helpText());
  if (command === 'discover') {
    if (!options.topics || !options.output) throw new Error('discover requires --topics and --output');
    const topics = String(options.topics).split(',').map(cleanText).filter(Boolean);
    const result = await discoverTopics({
      topics,
      topK: numberOption(options['top-k'], 7, { min: 1, max: 50 }),
      pages: numberOption(options.pages, 2, { min: 1, max: 10 }),
      minDelayMs: numberOption(options['min-delay-ms'], 1300, { min: 500, max: 60_000 }),
    });
    const output = path.resolve(options.output);
    await fs.mkdir(output, { recursive: true });
    await writeJson(path.join(output, 'sources.json'), result);
    return console.log(JSON.stringify({ command, articles: result.articles.length, output: path.join(output, 'sources.json') }));
  }
  if (command === 'capture') {
    const report = await captureCommand(options);
    return console.log(JSON.stringify({ command, declared: report.declared, captured: report.captured, ready_capture: report.ready_capture }));
  }
  if (command === 'package-html') {
    if (!options.html || !options.url || !options.output) throw new Error('package-html requires --html, --url and --output');
    const result = await packageArticle({
      html: await fs.readFile(path.resolve(options.html), 'utf8'),
      url: options.url,
      source: { id: options.id, title: options.title, topic: options.topic },
      output: path.resolve(options.output),
      adapter: 'offline-source-adapter',
      downloadImages: Boolean(options['download-images']),
    });
    return console.log(JSON.stringify({ command, article_id: result.article.article_id, status: result.article.status, output: result.package_root }));
  }
  if (command === 'finalize') {
    if (!options.input) throw new Error('finalize requires --input');
    const result = await finalizePackage(options.input);
    return console.log(JSON.stringify({ command, ...result }));
  }
  if (command === 'validate') {
    if (!options.input) throw new Error('validate requires --input');
    const result = await validatePackage(options.input);
    if (!result.passed) process.exitCode = 1;
    return console.log(JSON.stringify({ command, ...result }));
  }
  if (command === 'regression') {
    const report = await regressionCommand(options);
    return console.log(JSON.stringify({ command, passed: report.passed, actual: report.actual, mismatches: report.mismatches }));
  }
  throw new Error(`Unknown command: ${command}\n${helpText()}`);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  runCli().catch((error) => {
    console.error(JSON.stringify({ error: String(error), stack: error?.stack || null }));
    process.exitCode = 1;
  });
}
