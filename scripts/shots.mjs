#!/usr/bin/env node
// Approval-gate screenshots (Playwright + Chrome). Writes JPGs, manifest.json and console.txt.
// Usage:
//   node scripts/shots.mjs                                   review theme from qa/.review-theme.json
//   node scripts/shots.mjs --theme 1234 --pages "home-ur=/,home-en=/en,sg-ur=/?view=styleguide"
//   node scripts/shots.mjs --base http://127.0.0.1:9292      a running `shopify theme dev`
//   node scripts/shots.mjs --file qa/wireframes/home.html --prefix wire   local file (English = ?lang=en)
// Options: --out qa/screenshots/latest · --devices mobile,android,desktop · --no-full
// File names: {prefix-}{page}-{device}-{fold|full}.jpg   (page names carry the language: home-ur, home-en)
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const load = (name) => { try { return require(name); } catch { return null; } };
const pw = load('playwright') || load('playwright-core');
if (!pw) { console.error('shots: Playwright not installed. Run: npm install'); process.exit(1); }

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : dflt; };
const flag = (name) => args.includes(`--${name}`);

const file = opt('file');
let theme = opt('theme');
let base = opt('base');
if (!file && !base) {
  if (!theme && existsSync(join(ROOT, 'qa/.review-theme.json'))) theme = JSON.parse(readFileSync(join(ROOT, 'qa/.review-theme.json'), 'utf8')).id;
  if (!theme) { console.error('shots: no target. Run npm run push:review first, or pass --theme <id>, --base <url> or --file <path>.'); process.exit(1); }
  if (!process.env.SHOPIFY_FLAG_STORE) { console.error('shots: SHOPIFY_FLAG_STORE is not set.'); process.exit(1); }
  base = `https://${process.env.SHOPIFY_FLAG_STORE.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
}
const out = resolve(ROOT, opt('out', 'qa/screenshots/latest'));
const prefix = opt('prefix', '');
const pagesArg = opt('pages', file ? 'home-ur=,home-en=?lang=en' : 'home-ur=/,home-en=/en');
const pages = pagesArg.split(',').map((p) => { const [name, ...rest] = p.split('='); return { name: name.trim(), path: rest.join('=').trim() }; });
const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';
const ALL = {
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA, full: true },
  android: { viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA, full: false },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false, full: true },
};
const devices = opt('devices', 'mobile,android,desktop').split(',').map((d) => d.trim()).filter((d) => ALL[d]);

function urlFor(path) {
  if (file) return pathToFileURL(resolve(ROOT, file)).href + (path || '');
  const u = new URL(path || '/', base);
  if (theme) { u.searchParams.set('preview_theme_id', String(theme)); u.searchParams.set('pb', '0'); }
  return u.href;
}

async function unlock(page) {
  if (file || !process.env.STORE_PASSWORD) return;
  await page.goto(new URL('/password', base).href, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const input = await page.$('form input[type="password"]');
  if (!input) return; // no storefront password on this store
  await input.fill(process.env.STORE_PASSWORD);
  await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {}), input.press('Enter')]);
}

const FREEZE = `*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important;caret-color:transparent!important}
#preview-bar-iframe,#PBarNextFrameWrapper,.shopify-preview-bar{display:none!important}`;

mkdirSync(out, { recursive: true });
const executablePath = process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH) ? process.env.CHROME_PATH : undefined;
const browser = await pw.chromium.launch({ executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
let commit = '';
try { commit = execSync('git rev-parse --short HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* not a git repo */ }
const manifest = { createdAt: new Date().toISOString(), commit, target: file ? { file } : { base, theme: theme || null }, shots: [] };
const consoleLines = [];
let failed = 0;

for (const device of devices) {
  const d = ALL[device];
  const context = await browser.newContext({ viewport: d.viewport, deviceScaleFactor: d.deviceScaleFactor, isMobile: d.isMobile, hasTouch: d.hasTouch, userAgent: d.userAgent, reducedMotion: 'reduce', locale: 'ur-PK', timezoneId: 'Asia/Karachi' });
  const page = await context.newPage();
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error') logs.push(`console.error: ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  try { await unlock(page); } catch (e) { logs.push(`unlock failed: ${e.message}`); }

  for (const p of pages) {
    const name = `${prefix ? `${prefix}-` : ''}${p.name}-${device}`;
    const url = urlFor(p.path);
    const entry = { page: p.name, device, url: url.replace(/([?&]preview_theme_id=)\d+/, '$1<id>'), files: [], errors: [] };
    logs.length = 0;
    try {
      const resp = await page.goto(url, { waitUntil: 'load', timeout: 90000 });
      if (resp && resp.status() >= 400) entry.errors.push(`HTTP ${resp.status()}`);
      if (!file && new URL(page.url()).pathname.startsWith('/password')) entry.errors.push('Storefront password page shown: STORE_PASSWORD missing or wrong.');
      if (!file && !(await page.evaluate(() => document.documentElement.hasAttribute('data-zds-theme')))) entry.errors.push('Not our theme (<html data-zds-theme> missing): wrong theme id, or the preview was not applied.');
      await page.addStyleTag({ content: FREEZE });
      await page.evaluate(() => (document.fonts ? document.fonts.ready.then(() => true) : true));
      await page.evaluate(async () => {
        const step = Math.max(200, Math.round(window.innerHeight * 0.8));
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(400);
      const fold = join(out, `${name}-fold.jpg`);
      await page.screenshot({ path: fold, type: 'jpeg', quality: 72 });
      entry.files.push(relative(ROOT, fold));
      if (d.full && !flag('no-full')) {
        const full = join(out, `${name}-full.jpg`);
        await page.screenshot({ path: full, type: 'jpeg', quality: 72, fullPage: true });
        entry.files.push(relative(ROOT, full));
      }
    } catch (e) { entry.errors.push(e.message.split('\n')[0]); }
    if (entry.errors.length) failed++;
    consoleLines.push(`## ${p.name} · ${device}\n${[...entry.errors.map((e) => `ERROR: ${e}`), ...logs].join('\n') || '(no console errors)'}\n`);
    manifest.shots.push(entry);
    console.log(`${entry.errors.length ? 'FAIL' : 'ok  '}  ${name}  ${entry.files.map((f) => f.split('/').pop()).join(', ')}${entry.errors.length ? `  ← ${entry.errors.join(' | ')}` : ''}`);
  }
  await context.close();
}
await browser.close();
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(join(out, 'console.txt'), consoleLines.join('\n'));
console.log(`shots: ${manifest.shots.length} page/device runs → ${relative(ROOT, out)}/ (manifest.json, console.txt)${failed ? ` · ${failed} with errors` : ''}`);
process.exit(failed ? 1 : 0);
