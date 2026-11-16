#!/usr/bin/env node
// Builds qa/review.html: one self-contained page with the latest screenshots and the Lighthouse summary,
// so Claude can publish it as an artifact and Ahmad can review the gate on his phone.
// Usage: node scripts/review-page.mjs [--title "HOMEPAGE"] [--dir qa/screenshots/latest] [--out qa/review.html]
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 && args[i + 1] ? args[i + 1] : dflt; };
const title = opt('title', 'Gate review');
const dir = resolve(ROOT, opt('dir', 'qa/screenshots/latest'));
const out = resolve(ROOT, opt('out', 'qa/review.html'));
let sharp = null;
try { sharp = (await import('sharp')).default; } catch { /* embed originals */ }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const manifestPath = join(dir, 'manifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;
let shots = manifest ? manifest.shots : [];
if (!manifest && existsSync(dir)) {
  shots = readdirSync(dir).filter((f) => f.endsWith('.jpg')).map((f) => {
    const m = f.replace(/\.jpg$/, '').match(/^(.*)-(mobile|android|desktop)-(fold|full)$/);
    return m ? { page: m[1], device: m[2], files: [join(dir, f)], errors: [] } : null;
  }).filter(Boolean);
}
if (!shots.length) { console.error('review-page: no screenshots found. Run npm run qa:shots first.'); process.exit(1); }

async function dataUri(file, maxWidth, quality) {
  const p = resolve(ROOT, file);
  if (!existsSync(p)) return '';
  const buf = sharp ? await sharp(p).resize({ width: maxWidth, withoutEnlargement: true }).jpeg({ quality, mozjpeg: true }).toBuffer() : readFileSync(p);
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function build(maxWidth, quality, withFull) {
  const groups = new Map();
  for (const s of shots) { if (!groups.has(s.page)) groups.set(s.page, []); groups.get(s.page).push(s); }
  const sections = [];
  for (const [page, list] of groups) {
    const cards = [];
    for (const s of list) {
      for (const f of s.files) {
        const kind = f.endsWith('-full.jpg') ? 'full' : 'fold';
        if (kind === 'full' && !withFull) continue;
        const src = await dataUri(f, kind === 'full' ? Math.min(maxWidth, 720) : maxWidth, quality);
        if (!src) continue;
        const label = `${s.device} · ${kind === 'fold' ? 'first screen' : 'full page'}`;
        const img = `<img src="${src}" alt="${esc(`${page}, ${label}`)}" loading="lazy" decoding="async">`;
        cards.push(kind === 'fold'
          ? `<figure class="shot shot--${esc(s.device)}">${img}<figcaption>${esc(label)}</figcaption></figure>`
          : `<details class="full"><summary>${esc(label)}</summary>${img}</details>`);
      }
      for (const e of s.errors || []) cards.push(`<p class="err">${esc(`${s.device}: ${e}`)}</p>`);
    }
    sections.push(`<section><h2>${esc(page)}</h2><div class="grid">${cards.join('')}</div></section>`);
  }
  const lhPath = join(ROOT, 'qa/lighthouse/latest/summary.md');
  const lh = existsSync(lhPath) ? readFileSync(lhPath, 'utf8') : '';
  const table = lh.split('\n').filter((l) => l.startsWith('|'));
  const lhHtml = table.length > 2
    ? `<div class="tablewrap"><table>${table.filter((l) => !/^\|\s*-/.test(l)).map((l, i) => `<tr>${l.split('|').slice(1, -1).map((c) => (i === 0 ? `<th>${esc(c.trim())}</th>` : `<td>${esc(c.trim().replace(/\*\*/g, ''))}</td>`)).join('')}</tr>`).join('')}</table></div>`
    : '<p>No Lighthouse results yet.</p>';
  const rt = existsSync(join(ROOT, 'qa/.review-theme.json')) ? JSON.parse(readFileSync(join(ROOT, 'qa/.review-theme.json'), 'utf8')) : null;
  const meta = [manifest && manifest.commit ? `commit ${manifest.commit}` : '', manifest ? new Date(manifest.createdAt).toUTCString() : ''].filter(Boolean).join(' · ');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ZDS Gate Review</title>
<style>
:root{--bg:#FBF9F2;--fg:#0A120E;--muted:#5B574D;--card:#FFFFFF;--line:#EDE6D1;--accent:#7A5B17;--err:#B42318}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0A120E;--fg:#FBF9F2;--muted:#C9C3B4;--card:#16241C;--line:#24362B;--accent:#D4A843;--err:#F97066}}
:root[data-theme="dark"]{--bg:#0A120E;--fg:#FBF9F2;--muted:#C9C3B4;--card:#16241C;--line:#24362B;--accent:#D4A843;--err:#F97066}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
main{max-width:1200px;margin:0 auto;padding:24px 16px 64px}
h1{font-size:1.5rem;margin:0 0 4px}h2{font-size:1.15rem;margin:32px 0 12px;color:var(--accent)}
.meta,.note{color:var(--muted);font-size:.9rem;margin:0}
.box{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:16px;margin-top:16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr));gap:16px;align-items:start}
figure{margin:0;background:var(--card);border:1px solid var(--line);border-radius:8px;overflow:hidden}
.shot--desktop{grid-column:1/-1}
img{display:block;width:100%;height:auto}
figcaption,summary{padding:8px 12px;font-size:.875rem;color:var(--muted);cursor:pointer}
details.full{grid-column:1/-1;background:var(--card);border:1px solid var(--line);border-radius:8px}
details.full img{max-width:720px;margin:0 auto 12px}
.err{color:var(--err);font-weight:600;margin:0}
.tablewrap{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:.9rem}th,td{padding:6px 8px;border-bottom:1px solid var(--line);text-align:start;white-space:nowrap}
a{color:var(--accent)}
</style>
</head>
<body>
<main>
<h1>${esc(title)}</h1>
<p class="meta">${esc(meta)}</p>
<div class="box"><strong>How to reply:</strong> in the Claude Code session, write <code>approved</code>, or a numbered list of changes (one change per line).${rt && rt.previewUrl ? ` Live preview (storefront password needed): <a href="${esc(`${rt.previewUrl}${rt.previewUrl.includes('?') ? '&' : '?'}pb=0`)}">open the review theme</a>.` : ''}</div>
<h2>Lighthouse (mobile)</h2>
${lhHtml}
${sections.join('\n')}
${withFull ? '' : '<p class="note">Full-page screenshots were left out to keep this page small; they are committed in qa/screenshots/latest/.</p>'}
</main>
</body>
</html>
`;
}

let html = await build(900, 62, true);
if (html.length > 14 * 1024 * 1024) html = await build(700, 50, true);
if (html.length > 14 * 1024 * 1024) html = await build(700, 55, false);
writeFileSync(out, html);
console.log(`review-page: ${basename(out)} written (${(html.length / 1024 / 1024).toFixed(1)} MB, ${shots.length} page/device runs). Publish it as an artifact for Ahmad.`);
