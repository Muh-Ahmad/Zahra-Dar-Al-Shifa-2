#!/usr/bin/env node
// Builds qa/proofread.html: the proof-read sheet Major Sahab reads on a phone before a launch.
// It numbers (1) the yes/no questions, (2) the facts the site shows, (3) every Urdu text in scope,
// with placeholders filled from facts.yml, so he can answer "approved all" or "7: <correct Urdu>".
// Usage: node scripts/proofread-sheet.mjs [--scope docs/tech/v0-scope.yml] [--out qa/proofread.html] [--title "v0"]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import YAML from 'yaml';
import { lineInfo, loadScope, inScope } from './lib/yaml-lines.mjs';
import { buildLocales } from './build-locales.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 && args[i + 1] ? args[i + 1] : dflt; };
const scopeFile = opt('scope', 'docs/tech/v0-scope.yml');
const out = resolve(ROOT, opt('out', 'qa/proofread.html'));
const title = opt('title', 'v0');

const scope = loadScope(join(ROOT, scopeFile));
const factsText = readFileSync(join(ROOT, 'docs/brand/facts.yml'), 'utf8');
const copyText = readFileSync(join(ROOT, 'docs/content/copy.yml'), 'utf8');
const facts = YAML.parse(factsText);
const copy = YAML.parse(copyText);
const { ur, en, errors } = buildLocales();
if (errors.length) { console.error('proofread-sheet: build-locales errors:\n- ' + errors.join('\n- ')); process.exit(1); }

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MARK = /\[(CONFIRM|VERIFY|PROOF-READ)\]/g;
const marksOf = (c) => [...new Set([...String(c).matchAll(MARK)].map((m) => m[1]))];
const questionOf = (c) => {
  const m = String(c).match(/\[(CONFIRM|VERIFY)\]\s*([^[]*)/);
  return m ? m[2].trim() : '';
};

// ---- Placeholder values (Urdu and English) for readability.
const sample = { ur: {}, en: {} };
for (const [lang, tree] of [['ur', ur], ['en', en]]) {
  const f = tree.facts;
  Object.assign(sample[lang], {
    doctor: f.doctor, role: f.role, experience: f.experience, experience_years: f.experience_years, hours: f.hours,
    days: f.days, address: f.address, landmark: f.landmark, phone: f.phone, emergency: f.emergency,
    helpline_name: f.helpline_name, helpline: f.helpline, registration: f.registration, year: String(new Date().getFullYear()),
    specialty: f.specialties?.joints?.name || '', product: lang === 'ur' ? 'روغن' : 'oil', code: 'HOME-FB-A1',
  });
}
const fill = (s, lang) => esc(s).replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, k) => {
  const v = sample[lang][k];
  return v ? `<mark class="ph" title="{{ ${k} }}">${esc(v)}</mark>` : `<mark class="ph empty" title="{{ ${k} }}">${lang === 'ur' ? '(ابھی خالی)' : '(hidden for now)'}</mark>`;
});

// ---- Comments per key path (copy.yml and facts.yml).
const commentsBy = (text) => {
  const map = new Map();
  for (const li of lineInfo(text)) {
    if (!li.path || !li.comment) continue;
    const key = li.path.replace(/\.(ur|en)$/, '');
    map.set(key, [map.get(key), li.comment].filter(Boolean).join(' '));
  }
  return map;
};
const copyComments = commentsBy(copyText);
const factLines = lineInfo(factsText);

// ---- 1. Yes/no questions: [CONFIRM]/[VERIFY] comments on lines that render (value not pending).
const questions = [];
for (const [text, sc, file] of [[factsText, scope.facts, 'facts'], [copyText, scope.copy, 'copy']]) {
  for (const li of lineInfo(text)) {
    if (!inScope(li.path, sc) || li.valuePending || !li.comment) continue;
    const q = questionOf(li.comment);
    if (!q && !/\[(CONFIRM|VERIFY)\]/.test(li.comment)) continue;
    const shown = li.value.replace(/^["']|["']$/g, '');
    questions.push({ key: `${file}: ${li.path}`, q: q || 'Confirm this value.', shown });
  }
}

// ---- 2. Facts to check.
const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
const factItems = [];
for (const path of scope.facts.show_on_sheet) {
  if (path === 'specialties') {
    for (const s of facts.specialties || []) factItems.push({ key: `specialties.${s.key}`, ur: s.name_ur, en: s.name_en, note: s.group === 'private' ? 'private · رازدارانہ' : '' });
    continue;
  }
  const v = get(facts, path);
  if (v == null || /^\s*\[(PENDING|CONFIRM)\]/.test(String(v))) continue;
  const li = factLines.find((l) => l.path === path);
  const isUr = /_ur$/.test(path), isEn = /_en$/.test(path);
  factItems.push({ key: path, ur: isEn ? '' : String(v), en: isEn ? String(v) : '', ltr: !isUr, marks: li ? marksOf(li.comment) : [] });
}

// ---- 3. Website texts in scope (copy.yml leaves), in file order.
const texts = [];
(function walk(node, path) {
  for (const [k, v] of Object.entries(node || {})) {
    const p = [...path, k], id = p.join('.');
    if (v && typeof v === 'object' && 'ur' in v && 'en' in v) {
      if (inScope(id, scope.copy) && (v.ur || v.en)) texts.push({ key: id, ur: v.ur, en: v.en, marks: marksOf(copyComments.get(id) || '') });
    } else if (typeof v === 'string') {
      if (inScope(id, scope.copy) && v) texts.push({ key: id, ur: v, en: '', marks: marksOf(copyComments.get(id) || '') });
    } else if (v && typeof v === 'object') walk(v, p);
  }
})(copy, []);

// ---- Font: the site's own Nastaliq file, embedded so the sheet looks like the site.
let fontFace = '';
const fontPath = join(ROOT, 'node_modules/@fontsource-variable/noto-nastaliq-urdu/files/noto-nastaliq-urdu-arabic-wght-normal.woff2');
if (existsSync(fontPath)) fontFace = `@font-face{font-family:"ZDS Nastaliq";src:url(data:font/woff2;base64,${readFileSync(fontPath).toString('base64')}) format("woff2");font-weight:400 700;font-display:swap}`;
let commit = '';
try { commit = execSync('git rev-parse --short HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch {}

let n = 0;
const badge = (m) => `<span class="badge b-${m.toLowerCase()}">${m}</span>`;
const qHtml = questions.map((q) => `<li class="card q"><span class="num">${++n}</span><div class="body">
  <p class="key">${esc(q.key)}</p><p class="ur" dir="auto">${esc(q.shown)}</p><p class="en">${esc(q.q)}</p>
  <p class="answer">جواب: ہاں / نہیں · Answer: yes / no</p></div></li>`).join('\n');
const fHtml = factItems.map((f) => `<li class="card"><span class="num">${++n}</span><div class="body">
  <p class="key">${esc(f.key)} ${(f.marks || []).map(badge).join(' ')}</p>
  ${f.ur ? `<p class="ur" lang="ur" dir="${f.ltr ? 'ltr' : 'rtl'}">${esc(f.ur)}</p>` : ''}${f.en ? `<p class="en">${esc(f.en)}</p>` : ''}${f.note ? `<p class="en">${esc(f.note)}</p>` : ''}</div></li>`).join('\n');
let lastSection = '';
const tHtml = texts.map((t) => {
  const sec = t.key.split('.')[0];
  const head = sec !== lastSection ? `<li class="sec"><h3>${esc(sec)}</h3></li>` : '';
  lastSection = sec;
  return `${head}<li class="card${t.marks.includes('PROOF-READ') ? ' pr' : ''}"><span class="num">${++n}</span><div class="body">
  <p class="key">${esc(t.key)} ${t.marks.map(badge).join(' ')}</p><p class="ur" lang="ur" dir="rtl">${fill(t.ur, 'ur')}</p>${t.en ? `<p class="en">${fill(t.en, 'en')}</p>` : ''}</div></li>`;
}).join('\n');

// No <html>/<head>/<body> wrapper: the artifact host adds its own skeleton (browsers render the fragment fine locally too).
const html = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>ZDS Proof-read Sheet</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${fontFace}
ol,.card,.body{min-width:0}
:root{--bg:#FBF9F2;--card:#FFFFFF;--fg:#0A120E;--muted:#5B574D;--line:#EDE6D1;--accent:#7A5B17;--green:#1B5E32;--mark:#F5F1E4;--warn:#B42318;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0A120E;--card:#0F1A14;--fg:#FBF9F2;--muted:#C9C3B4;--line:#24362B;--accent:#D4A843;--green:#E2C27A;--mark:#16241C;--warn:#F97066;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0A120E;--card:#0F1A14;--fg:#FBF9F2;--muted:#C9C3B4;--line:#24362B;--accent:#D4A843;--green:#E2C27A;--mark:#16241C;--warn:#F97066;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
.wrap{max-width:760px;margin:0 auto;padding-block:24px 80px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
h1{font-size:1.5rem;margin:0 0 4px}h2{font-size:1.15rem;margin:32px 0 8px;color:var(--accent)}h3{font-size:.8rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:16px 0 0}
.ur{font-family:"ZDS Nastaliq","Noto Nastaliq Urdu","Jameel Noori Nastaleeq",serif;font-size:1.35rem;line-height:2.3;margin:4px 0;text-align:start}
.intro{background:var(--card);border:1px solid var(--line);padding:12px 16px;border-radius:4px}
.intro .ur{font-size:1.15rem}
ol{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.card{display:flex;gap:12px;background:var(--card);border:1px solid var(--line);border-radius:4px;padding:12px}
.card.pr{border-inline-start:3px solid var(--accent)}
.card.q{border-inline-start:3px solid var(--warn)}
.num{flex:0 0 auto;min-width:2.2em;height:2.2em;display:grid;place-items:center;border-radius:999px;background:var(--mark);font-weight:700;font-variant-numeric:tabular-nums}
.body{min-width:0;flex:1}
.key{margin:0;font:12px/1.4 ui-monospace,Menlo,Consolas,monospace;color:var(--muted);overflow-wrap:anywhere}
.en{margin:2px 0 0;color:var(--muted);font-size:.95rem}
.answer{margin:6px 0 0;font-weight:600;color:var(--warn)}
mark.ph{background:var(--mark);color:inherit;border-radius:3px;padding:0 3px}
mark.ph.empty{color:var(--warn)}
.badge{display:inline-block;font:600 10px/1 system-ui,sans-serif;padding:3px 6px;border-radius:999px;border:1px solid var(--accent);color:var(--accent);vertical-align:middle}
.b-confirm,.b-verify{border-color:var(--warn);color:var(--warn)}
.sec{list-style:none}
.meta{color:var(--muted);font-size:.85rem}
</style></head><body><div class="wrap">
<h1>Proof-read sheet · ${esc(title)}</h1>
<p class="meta">${n} items · ${questions.length} yes/no · ${factItems.length} facts · ${texts.length} texts${commit ? ` · commit ${esc(commit)}` : ''} · ${new Date().toISOString().slice(0, 10)}</p>
<div class="intro">
<p class="ur" lang="ur" dir="rtl">میجر صاحب، براہِ کرم ہر نمبر پڑھیں۔ جو جملہ بدلنا ہو، اس کا نمبر اور درست جملہ لکھ کر احمد کو بھیج دیں۔ سوالوں کا جواب ہاں یا نہیں میں دیں۔ سب درست ہو تو صرف «سب منظور» لکھ دیں۔</p>
<p>Major Sahab: read every number. To change a text, send Ahmad its number and the correct Urdu, e.g. <b>7: …</b>. Answer the red questions with yes or no. If everything is right, send <b>approved all</b>. Grey highlights are filled in from the facts.</p>
</div>
${questions.length ? `<h2>1 · Questions (yes / no)</h2><ol>${qHtml}</ol>` : ''}
<h2>2 · Facts on the website</h2><ol>${fHtml}</ol>
<h2>3 · Website text</h2><ol>${tHtml}</ol>
</div>`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`proofread-sheet: wrote ${out.replace(ROOT + '/', '')} (${n} items: ${questions.length} questions, ${factItems.length} facts, ${texts.length} texts; ${(html.length / 1024).toFixed(0)} KB).`);
