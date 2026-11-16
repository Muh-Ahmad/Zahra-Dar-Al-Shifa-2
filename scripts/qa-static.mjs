#!/usr/bin/env node
// Static QA for the ZDS theme. No network, no browser.
// Checks: theme dialect, RTL-safe CSS, banned words, hard-coded facts, locale parity + freshness,
//         pending markers, size budgets, Urdu typesetting hazards.
// Usage: node scripts/qa-static.mjs [--launch] [--scope docs/tech/v0-scope.yml]
//   --launch  also fails on every [CONFIRM] / [PROOF-READ] / [VERIFY] left in facts.yml or copy.yml.
//   --scope   with --launch: only lines whose key path is in the scope file count (v0 go-live check);
//             lines whose value starts with [PENDING]/[CONFIRM] render nothing and are skipped.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname, dirname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LAUNCH = process.argv.includes('--launch');
const SCOPE_ARG = (() => { const i = process.argv.indexOf('--scope'); return i >= 0 ? process.argv[i + 1] : null; })();
const THEME_DIRS = ['assets', 'blocks', 'config', 'layout', 'locales', 'snippets', 'templates'];
const rel = (p) => relative(ROOT, p);
const read = (p) => readFileSync(p, 'utf8');

const results = [];
const add = (level, check, where, msg) => results.push({ level, check, where, msg });

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
}
const themeFiles = THEME_DIRS.flatMap((d) => walk(join(ROOT, d)));
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

// Blank out Liquid and HTML comments (keeps line numbers).
const blank = (s) => s.replace(/[^\n]/g, ' ');
function stripComments(text) {
  return text
    .replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, blank)
    .replace(/\{%-?\s*doc\s*-?%\}[\s\S]*?\{%-?\s*enddoc\s*-?%\}/g, blank)
    .replace(/\{%-?\s*#[^%]*%\}/g, blank)
    .replace(/<!--[\s\S]*?-->/g, blank);
}

// ---------- 1. Theme dialect (Skeleton block-first, docs/tech/architecture.md §4)
if (existsSync(join(ROOT, 'sections'))) add('FAIL', 'dialect', 'sections/', 'No sections/ folder in this theme (block-first dialect).');
for (const f of themeFiles) {
  const r = rel(f);
  if (r.startsWith('templates/') && extname(f) === '.json') add('FAIL', 'dialect', r, 'No JSON templates: use templates/*.liquid.');
  if (extname(f) !== '.liquid') continue;
  const t = stripComments(read(f));
  for (const [re, msg] of [
    [/\{%-?\s*(stylesheet|javascript)\b/g, 'No {% stylesheet %} / {% javascript %}: CSS and JS live in assets/.'],
    [/\{%-?\s*sections?\s+['"]/g, 'No {% section %} / {% sections %} tags.'],
  ]) for (const m of t.matchAll(re)) add('FAIL', 'dialect', `${r}:${lineOf(t, m.index)}`, msg);
  if (r.startsWith('blocks/') && !/\{%-?\s*schema\s*-?%\}/.test(t)) add('FAIL', 'dialect', r, 'Every block needs a {% schema %}.');
  if (r.startsWith('blocks/') && !/\{%-?\s*doc\s*-?%\}/.test(read(f))) add('FAIL', 'dialect', r, 'Every block needs a {% doc %} header.');
}

// ---------- 2. RTL-safe CSS: logical properties only
const PHYSICAL = [
  /\b(margin|padding|border)-(left|right)\b/i,
  /\bborder-(top|bottom)-(left|right)-radius\b/i,
  /\bscroll-(margin|padding)-(left|right)\b/i,
  /(^|[^-\w])(left|right)\s*:/i,
  /\btext-align\s*:\s*(left|right)\b/i,
  /\b(float|clear)\s*:\s*(left|right)\b/i,
];
function scanCss(text, file, startLine = 1) {
  text.split('\n').forEach((line, i) => {
    if (line.includes('rtl-ok')) return;
    const code = line.replace(/\/\*.*?\*\//g, '');
    for (const re of PHYSICAL) {
      if (re.test(code)) { add('FAIL', 'rtl-css', `${file}:${startLine + i}`, `Physical left/right CSS: "${code.trim().slice(0, 90)}" → use logical properties (or end the line with /* rtl-ok */).`); break; }
    }
    if (/line-clamp/i.test(code)) add('WARN', 'urdu-type', `${file}:${startLine + i}`, 'line-clamp clips Nastaliq: never use it on Urdu text.');
    if (/text-align\s*:\s*justify/i.test(code)) add('WARN', 'urdu-type', `${file}:${startLine + i}`, 'Never justify Urdu.');
  });
}
for (const f of themeFiles) {
  const r = rel(f), ext = extname(f);
  if (ext === '.css') scanCss(read(f), r);
  if (ext === '.liquid') {
    const t = stripComments(read(f));
    const re = /<style\b[^>]*>([\s\S]*?)<\/style>|\{%-?\s*style\s*-?%\}([\s\S]*?)\{%-?\s*endstyle\s*-?%\}|\sstyle="([^"]*)"/g;
    for (const m of t.matchAll(re)) {
      const body = m[1] ?? m[2] ?? m[3] ?? '';
      const offset = m.index + m[0].indexOf(body);
      scanCss(body, r, lineOf(t, offset));
    }
  }
}

// ---------- 3. Banned words (docs/content/compliance.md §2)
const compliance = existsSync(join(ROOT, 'docs/content/compliance.md')) ? read(join(ROOT, 'docs/content/compliance.md')) : '';
const block = (compliance.match(/<!-- banned:start -->([\s\S]*?)<!-- banned:end -->/) || [])[1] || '';
const banned = block.split('\n').map((l) => l.replace(/^\s*-\s*/, '').trim()).filter(Boolean);
if (!banned.length) add('FAIL', 'banned-words', 'docs/content/compliance.md', 'Banned-word list not found between <!-- banned:start --> and <!-- banned:end -->.');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const matchers = banned.map((term) => /^[\x00-\x7F]+$/.test(term)
  ? { term, test: (s) => new RegExp(`(?<![A-Za-z0-9])${esc(term)}(?![A-Za-z0-9])`, 'i').test(s) }
  : { term, test: (s) => s.includes(term) });
function scanWords(text, where) {
  for (const m of matchers) if (m.test(text)) add('FAIL', 'banned-words', where, `Banned term "${m.term}" (compliance.md §2).`);
}
function walkValues(obj, path, cb) {
  if (typeof obj === 'string') return cb(obj, path);
  if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) walkValues(v, path ? `${path}.${k}` : k, cb);
}
// copy.yml: scan each line's text (values and inline comments), skipping full-line comments.
const copyPath = join(ROOT, 'docs/content/copy.yml');
if (existsSync(copyPath)) read(copyPath).split('\n').forEach((line, i) => {
  if (/^\s*#/.test(line)) return;
  scanWords(line, `docs/content/copy.yml:${i + 1}`);
});
for (const f of themeFiles) {
  const r = rel(f), ext = extname(f);
  if (r.startsWith('locales/') && ext === '.json') {
    try { walkValues(JSON.parse(read(f)), '', (v, p) => scanWords(v, `${r} → ${p}`)); }
    catch (e) { add('FAIL', 'locales', r, `Invalid JSON: ${e.message}`); }
  } else if (['.liquid', '.js', '.json', '.svg'].includes(ext)) {
    const t = ext === '.liquid' ? stripComments(read(f)) : read(f);
    t.split('\n').forEach((line, i) => scanWords(line, `${r}:${i + 1}`));
  }
}

// ---------- 4. Hard-coded facts (facts live only in facts.yml → facts.* locale keys)
const FACT_PATTERNS = [
  [/6393999/, 'phone number'], [/B-Commercial/i, 'address'], [/Kabano|کابانو/i, 'landmark'],
  [/QH-\d{4,}/i, 'registration number'], [/Nasir\s+Abbas|ناصر\s+عباس/i, "doctor's name"],
];
for (const f of themeFiles) {
  const r = rel(f);
  if (r.startsWith('locales/') || !['.liquid', '.js', '.json', '.css'].includes(extname(f))) continue;
  const t = extname(f) === '.liquid' ? stripComments(read(f)) : read(f);
  t.split('\n').forEach((line, i) => {
    for (const [re, what] of FACT_PATTERNS) if (re.test(line)) add('FAIL', 'hard-coded-facts', `${r}:${i + 1}`, `Hard-coded ${what}: use the facts.* locale key (golden rule 1).`);
  });
}

// ---------- 5. Locales: parity, extra files, freshness
const flat = (o, p = '', out = {}) => { for (const [k, v] of Object.entries(o)) { const key = p ? `${p}.${k}` : k; if (v && typeof v === 'object') flat(v, key, out); else out[key] = v; } return out; };
const urPath = join(ROOT, 'locales/ur.json'), enPath = join(ROOT, 'locales/en.default.json');
if (existsSync(urPath) && existsSync(enPath)) {
  try {
    const ur = flat(JSON.parse(read(urPath))), en = flat(JSON.parse(read(enPath)));
    for (const k of Object.keys(en)) if (!(k in ur)) add('FAIL', 'locales', 'locales/ur.json', `Missing key ${k}`);
    for (const k of Object.keys(ur)) if (!(k in en)) add('FAIL', 'locales', 'locales/en.default.json', `Missing key ${k}`);
    for (const [k, v] of Object.entries(ur)) if (typeof v === 'string' && /[?,;](?=\s|$)/.test(v.replace(/\{\{[^}]*\}\}/g, '')) && /[؀-ۿ]/.test(v)) add('WARN', 'urdu-punctuation', `locales/ur.json → ${k}`, 'Latin punctuation in Urdu text: use ؟ ، ۔');
  } catch (e) { add('FAIL', 'locales', 'locales/', `Invalid locale JSON: ${e.message}`); }
  for (const f of walk(join(ROOT, 'locales'))) {
    const b = basename(f);
    if (!['ur.json', 'en.default.json'].includes(b) && !b.endsWith('.schema.json')) add('WARN', 'locales', rel(f), 'Unexpected storefront locale file (only ur.json and en.default.json are generated).');
  }
  try {
    const { buildLocales } = await import(pathToFileURL(join(ROOT, 'scripts/build-locales.mjs')).href);
    const built = buildLocales();
    if (built.errors.length) built.errors.forEach((e) => add('FAIL', 'locales', 'build-locales', e));
    else {
      const json = (o) => JSON.stringify(o, null, 2) + '\n';
      if (read(urPath) !== json(built.ur) || read(enPath) !== json(built.en)) add('FAIL', 'locales', 'locales/', 'Out of date with copy.yml/facts.yml (or hand-edited). Run: node scripts/build-locales.mjs');
    }
  } catch (e) { add('WARN', 'locales', 'build-locales', `Freshness not checked (${e.code === 'ERR_MODULE_NOT_FOUND' ? 'run npm install first' : e.message}).`); }
} else if (themeFiles.length) add('WARN', 'locales', 'locales/', 'locales/ur.json or locales/en.default.json missing. Run: node scripts/build-locales.mjs');

// ---------- 6. Pending markers (counted on value lines only; full-line comments are documentation)
const MARK = /\[(PENDING|CONFIRM|PROOF-READ|VERIFY)\]/g;
const counts = { PENDING: 0, CONFIRM: 0, 'PROOF-READ': 0, VERIFY: 0 };
let scope = null, lineInfo = null, inScope = null;
if (SCOPE_ARG) {
  try {
    const lib = await import(pathToFileURL(join(ROOT, 'scripts/lib/yaml-lines.mjs')).href);
    scope = lib.loadScope(join(ROOT, SCOPE_ARG)); lineInfo = lib.lineInfo; inScope = lib.inScope;
    if (!LAUNCH) add('WARN', 'launch', SCOPE_ARG, '--scope only matters together with --launch.');
  } catch (e) { add('FAIL', 'launch', SCOPE_ARG, `Scope file not usable (${e.code === 'ERR_MODULE_NOT_FOUND' ? 'run npm install first' : e.message}).`); }
}
let scoped = 0;
for (const [file, key] of [['docs/brand/facts.yml', 'facts'], ['docs/content/copy.yml', 'copy']]) {
  const p = join(ROOT, file);
  if (!existsSync(p)) continue;
  const infos = scope ? lineInfo(read(p)) : null;
  read(p).split('\n').forEach((line, i) => {
    if (/^\s*#/.test(line)) return;
    for (const m of line.matchAll(MARK)) {
      counts[m[1]]++;
      if (!LAUNCH || m[1] === 'PENDING') continue;
      if (scope) {
        const info = infos[i];
        if (!inScope(info.path, scope[key]) || info.valuePending) continue;
        scoped++;
      }
      add('FAIL', 'launch', `${file}:${i + 1}`, `[${m[1]}] must be resolved before ${scope ? 'the v0 launch' : 'launch'}: ${line.trim().slice(0, 100)}`);
    }
  });
}
if (scope) add('INFO', 'launch', SCOPE_ARG, `${scoped} marker(s) inside the v0 scope still need Major Sahab (see npm run qa:proofread).`);
add('INFO', 'pending', 'facts.yml + copy.yml', Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' · '));
for (const f of themeFiles) {
  if (!['.liquid', '.json', '.js'].includes(extname(f))) continue;
  const t = extname(f) === '.liquid' ? stripComments(read(f)) : read(f);
  t.split('\n').forEach((line, i) => {
    if (/\[(PENDING|CONFIRM|PROOF-READ|VERIFY)\]/.test(line)) add('FAIL', 'pending', `${rel(f)}:${i + 1}`, 'A marker would be visible on the site. Pending facts must render nothing.');
  });
}

// ---------- 7. Budgets (docs/tech/architecture.md §8)
const assets = walk(join(ROOT, 'assets'));
const size = (f) => statSync(f).size;
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const inline = assets.filter((f) => ['zds-tokens.css', 'zds-critical.css'].includes(basename(f)));
for (const f of inline) if (size(f) >= 15 * 1024) add('FAIL', 'budget', rel(f), `${kb(size(f))}: inline_asset_content needs < 15 KB.`);
const inlineTotal = inline.reduce((n, f) => n + size(f), 0);
if (inlineTotal > 12 * 1024) add('FAIL', 'budget', 'assets/zds-tokens.css + zds-critical.css', `Inlined CSS ${kb(inlineTotal)} > 12 KB.`);
const gz = (files) => files.reduce((n, f) => n + gzipSync(readFileSync(f)).length, 0);
const js = assets.filter((f) => /^zds-.*\.js$/.test(basename(f)));
const css = assets.filter((f) => /^zds-.*\.css$/.test(basename(f)));
if (gz(js) > 20 * 1024) add('FAIL', 'budget', 'assets/zds-*.js', `JS ${kb(gz(js))} gzip > 20 KB.`);
if (gz(css) > 25 * 1024) add('FAIL', 'budget', 'assets/zds-*.css', `CSS ${kb(gz(css))} gzip > 25 KB.`);
for (const f of assets) {
  const b = basename(f), n = size(f);
  if (/^zds-hero-.*-(480|768)\.webp$/.test(b) && n > 120 * 1024) add('FAIL', 'budget', rel(f), `${kb(n)}: mobile hero image > 120 KB.`);
  else if (b.endsWith('.woff2') && n > 250 * 1024) add('WARN', 'budget', rel(f), `${kb(n)}: font file is larger than expected.`);
  else if (n > 300 * 1024) add('WARN', 'budget', rel(f), `${kb(n)}: asset > 300 KB.`);
}
if (assets.length) add('INFO', 'budget', 'assets/', `JS ${kb(gz(js))} gzip · CSS ${kb(gz(css))} gzip · inlined CSS ${kb(inlineTotal)}`);

// ---------- 8. Images need explicit dimensions
for (const f of themeFiles.filter((f) => extname(f) === '.liquid')) {
  const t = stripComments(read(f));
  for (const m of t.matchAll(/<img\b[^>]*>/g)) {
    if (!/\swidth=/.test(m[0]) || !/\sheight=/.test(m[0])) add('WARN', 'images', `${rel(f)}:${lineOf(t, m.index)}`, '<img> without width and height (CLS risk). Prefer image_tag or set both.');
  }
}

// ---------- Report
const order = { FAIL: 0, WARN: 1, INFO: 2 };
results.sort((a, b) => order[a.level] - order[b.level] || a.check.localeCompare(b.check));
const fails = results.filter((r) => r.level === 'FAIL').length, warns = results.filter((r) => r.level === 'WARN').length;
console.log(`qa-static${LAUNCH ? ' --launch' : ''}${SCOPE_ARG ? ` --scope ${SCOPE_ARG}` : ''}: ${themeFiles.length} theme files · ${banned.length} banned terms`);
const shown = {};
for (const r of results) {
  shown[r.check] = (shown[r.check] || 0) + 1;
  if (shown[r.check] === 51) { console.log(`  … more ${r.check} results hidden`); continue; }
  if (shown[r.check] > 51) continue;
  console.log(`${r.level.padEnd(4)}  [${r.check}] ${r.where} — ${r.msg}`);
}
console.log(`\nResult: ${fails ? 'FAIL' : 'PASS'} (${fails} fail, ${warns} warn)`);
process.exit(fails ? 1 : 0);
