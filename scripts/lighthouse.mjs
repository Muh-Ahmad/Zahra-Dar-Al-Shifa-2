#!/usr/bin/env node
// Lighthouse, mobile (simulated slow 4G), median of N runs per page, against the review theme.
// Usage: node scripts/lighthouse.mjs [--theme <id>] [--base <url>] [--pages "home-ur=/,home-en=/en"] [--runs 3]
//                                    [--out qa/lighthouse/latest] [--launch]
// Before launch the "is-crawlable" audit is skipped: password-protected preview pages are deliberately not indexable.
// Writes summary.md (commit it) and one JSON report per page (git-ignored). Exit 1 if any budget fails.
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const load = (name) => { try { return require(name); } catch { return null; } };
let lighthouse, chromeLauncher;
try { lighthouse = (await import('lighthouse')).default; chromeLauncher = await import('chrome-launcher'); }
catch { console.error('lighthouse: packages missing. Run: npm install'); process.exit(1); }

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : dflt; };
const LAUNCH = args.includes('--launch');
let theme = opt('theme');
let base = opt('base');
if (!base) {
  if (!theme && existsSync(join(ROOT, 'qa/.review-theme.json'))) theme = JSON.parse(readFileSync(join(ROOT, 'qa/.review-theme.json'), 'utf8')).id;
  if (!theme) { console.error('lighthouse: no target. Run npm run push:review first, or pass --theme <id> or --base <url>.'); process.exit(1); }
  if (!process.env.SHOPIFY_FLAG_STORE) { console.error('lighthouse: SHOPIFY_FLAG_STORE is not set.'); process.exit(1); }
  base = `https://${process.env.SHOPIFY_FLAG_STORE.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
}
const runs = Math.max(1, Number(opt('runs', '3')));
const out = resolve(ROOT, opt('out', 'qa/lighthouse/latest'));
const pages = opt('pages', 'home-ur=/,home-en=/en').split(',').map((p) => { const [name, ...rest] = p.split('='); return { name: name.trim(), path: rest.join('=').trim() || '/' }; });
const BUDGET = { perf: 90, a11y: 95, bp: 95, seo: 95, lcp: 2500, cls: 0.05, tbt: 200 };

const chromePath = (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) ? process.env.CHROME_PATH
  : (() => { const pw = load('playwright') || load('playwright-core'); try { return pw && pw.chromium.executablePath(); } catch { return undefined; } })();

function urlFor(path) {
  const u = new URL(path, base);
  if (theme) { u.searchParams.set('preview_theme_id', String(theme)); u.searchParams.set('pb', '0'); }
  return u.href;
}

// Unlock the storefront password with a real browser and collect the cookies (storefront_digest, preview).
async function cookieHeader() {
  if (!process.env.STORE_PASSWORD) return '';
  const pw = load('playwright') || load('playwright-core');
  if (!pw) throw new Error('Playwright is needed to unlock the storefront password. Run: npm install');
  const browser = await pw.chromium.launch({ executablePath: chromePath, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.goto(new URL('/password', base).href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const input = await page.$('form input[type="password"]');
    if (input) {
      await input.fill(process.env.STORE_PASSWORD);
      await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {}), input.press('Enter')]);
    }
    await page.goto(urlFor(pages[0].path), { waitUntil: 'domcontentloaded', timeout: 60000 });
    const host = new URL(base).hostname;
    return (await page.context().cookies()).filter((c) => host.endsWith(c.domain.replace(/^\./, ''))).map((c) => `${c.name}=${c.value}`).join('; ');
  } finally { await browser.close(); }
}

// Confirm the URL serves our theme (not the password page, not the live theme).
async function precheck(url, cookie) {
  const headers = { 'user-agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 ZDS-QA' };
  if (cookie) headers.cookie = cookie;
  const r = await fetch(url, { headers, redirect: 'follow' });
  const html = await r.text();
  if (r.status >= 400) return `HTTP ${r.status}`;
  if (new URL(r.url).pathname.startsWith('/password') || /storefront_password/.test(html)) return 'Storefront password page served: STORE_PASSWORD missing or wrong.';
  if (!/data-zds-theme/.test(html)) return 'Not our theme (<html data-zds-theme> missing): wrong theme id, or the preview was not applied.';
  return '';
}

const findNode = (o) => {
  if (!o || typeof o !== 'object') return null;
  if (o.type === 'node' && (o.snippet || o.nodeLabel)) return o;
  for (const v of Object.values(o)) { const n = findNode(v); if (n) return n; }
  return null;
};
function summarize(lhr) {
  const s = (id) => Math.round(((lhr.categories[id] && lhr.categories[id].score) || 0) * 100);
  const a = (id) => (lhr.audits[id] ? lhr.audits[id].numericValue : NaN);
  const lcpAudit = lhr.audits['largest-contentful-paint-element'] || lhr.audits['lcp-breakdown-insight']; // Lighthouse 12 / 13
  const node = findNode(lcpAudit && lcpAudit.details);
  const issues = [];
  for (const cat of ['accessibility', 'best-practices', 'seo', 'performance']) {
    for (const ref of (lhr.categories[cat] && lhr.categories[cat].auditRefs) || []) {
      const au = lhr.audits[ref.id];
      if (!au || au.score === null || au.score >= 0.9 || ['manual', 'notApplicable', 'informative'].includes(au.scoreDisplayMode)) continue;
      if (cat === 'performance' && !ref.weight) continue;
      issues.push(`${cat}: ${au.title}${au.displayValue ? ` (${au.displayValue})` : ''}`);
    }
  }
  return { perf: s('performance'), a11y: s('accessibility'), bp: s('best-practices'), seo: s('seo'), lcp: a('largest-contentful-paint'), cls: a('cumulative-layout-shift'), tbt: a('total-blocking-time'), fcp: a('first-contentful-paint'), lcpElement: node ? [node.selector, node.nodeLabel].filter(Boolean).join(' — ') : '', issues };
}
const passes = (m) => m.perf >= BUDGET.perf && m.a11y >= BUDGET.a11y && m.bp >= BUDGET.bp && m.seo >= BUDGET.seo && m.lcp <= BUDGET.lcp && m.cls <= BUDGET.cls && m.tbt <= BUDGET.tbt;

mkdirSync(out, { recursive: true });
let cookie = '';
try { cookie = await cookieHeader(); } catch (e) { console.error(`lighthouse: could not unlock the storefront: ${e.message}`); process.exit(1); }
const config = { extends: 'lighthouse:default', settings: { onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'], skipAudits: LAUNCH ? [] : ['is-crawlable'] } };
const rows = [];
let failed = 0;

for (const p of pages) {
  const url = urlFor(p.path);
  const problem = await precheck(url, cookie).catch((e) => `Request failed: ${e.message}`);
  if (problem) { rows.push({ name: p.name, error: problem }); failed++; console.log(`FAIL  ${p.name}: ${problem}`); continue; }
  const chrome = await chromeLauncher.launch({ chromePath, chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
  const results = [];
  try {
    for (let i = 0; i < runs; i++) {
      const r = await lighthouse(url, { port: chrome.port, output: 'json', logLevel: 'error', extraHeaders: cookie ? { Cookie: cookie } : undefined }, config);
      results.push(r.lhr);
      console.log(`      ${p.name} run ${i + 1}/${runs}: performance ${Math.round(r.lhr.categories.performance.score * 100)}`);
    }
  } finally { await chrome.kill(); }
  results.sort((x, y) => x.categories.performance.score - y.categories.performance.score);
  const median = results[Math.floor(results.length / 2)];
  writeFileSync(join(out, `${p.name}.json`), JSON.stringify(median));
  const m = summarize(median);
  const ok = passes(m);
  if (!ok) failed++;
  rows.push({ name: p.name, ...m, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${p.name}: perf ${m.perf} · a11y ${m.a11y} · bp ${m.bp} · seo ${m.seo} · LCP ${(m.lcp / 1000).toFixed(2)} s · CLS ${m.cls.toFixed(3)} · TBT ${Math.round(m.tbt)} ms`);
}

let commit = '';
try { commit = execSync('git rev-parse --short HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* not a git repo */ }
const mark = (v, okay) => (okay ? `${v}` : `**${v}** ✗`);
const lines = [
  `# Lighthouse: mobile, simulated slow 4G, median of ${runs}`,
  '',
  `Target: ${theme ? `theme ${theme}` : base} · commit ${commit || '?'} · ${new Date().toISOString()}${LAUNCH ? '' : ' · is-crawlable skipped (pre-launch)'}`,
  `Budgets: Performance ≥ ${BUDGET.perf} · Accessibility, Best Practices, SEO ≥ 95 · LCP ≤ 2.5 s · CLS ≤ ${BUDGET.cls} · TBT ≤ ${BUDGET.tbt} ms`,
  '',
  '| Page | Perf | A11y | BP | SEO | LCP | CLS | TBT | Result |',
  '|---|---|---|---|---|---|---|---|---|',
  ...rows.map((r) => (r.error ? `| ${r.name} | – | – | – | – | – | – | – | FAIL: ${r.error} |`
    : `| ${r.name} | ${mark(r.perf, r.perf >= BUDGET.perf)} | ${mark(r.a11y, r.a11y >= BUDGET.a11y)} | ${mark(r.bp, r.bp >= BUDGET.bp)} | ${mark(r.seo, r.seo >= BUDGET.seo)} | ${mark(`${(r.lcp / 1000).toFixed(2)} s`, r.lcp <= BUDGET.lcp)} | ${mark(r.cls.toFixed(3), r.cls <= BUDGET.cls)} | ${mark(`${Math.round(r.tbt)} ms`, r.tbt <= BUDGET.tbt)} | ${r.ok ? 'PASS' : 'FAIL'} |`)),
  '',
  ...rows.filter((r) => !r.error).flatMap((r) => [
    `## ${r.name}`,
    `- LCP element: \`${(r.lcpElement || 'n/a').replace(/`/g, "'").slice(0, 200)}\``,
    ...(r.issues.length ? r.issues.slice(0, 12).map((i) => `- ${i}`) : ['- No failing audits.']),
    '',
  ]),
];
writeFileSync(join(out, 'summary.md'), lines.join('\n'));
console.log(`lighthouse: ${relative(ROOT, join(out, 'summary.md'))} · ${failed ? `${failed} page(s) FAIL` : 'all pages PASS'}`);
process.exit(failed ? 1 : 0);
