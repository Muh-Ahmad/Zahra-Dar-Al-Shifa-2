#!/usr/bin/env node
// Responsive images for the theme: src/assets/images/* and src/assets/brand/* → assets/
//   photos   → zds-<name>-<width>.webp (480, 768, 1080, 1440, 1920; hero-*-4x5 only 480 and 768)
//   logo-*   → zds-<name>-<width>.webp (160, 320, 640)      favicon* → zds-favicon-<size>.png (32, 180, 512)
//   og-*     → zds-<name>.jpg (1200 wide)                    *.svg    → zds-<name>.svg (copied unchanged)
// A "zds" word in the source name is dropped: logo-zds-cream-disc.png → zds-logo-cream-disc-160.webp
// EXIF data (including GPS location) is stripped. Never upscales. Mobile hero files are kept ≤ 120 KB.
// Usage: node scripts/images.mjs [--force]
import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { join, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

let sharp;
try { sharp = (await import('sharp')).default; } catch { console.error('images: sharp is not installed. Run: npm install'); process.exit(1); }

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets');
const FORCE = process.argv.includes('--force');
const PHOTO = ['.jpg', '.jpeg', '.png', '.webp'];
const kb = (n) => `${Math.round(n / 1024)} KB`;
const slug = (file) => basename(file, extname(file)).toLowerCase().replace(/[^a-z0-9]+/g, '-')
  .split('-').filter((w) => w && w !== 'zds').join('-');
const fresh = (src, out) => !FORCE && existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs;
const list = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => !f.startsWith('.') && f.toLowerCase() !== 'readme.md').map((f) => join(dir, f)) : []);
const RATIOS = { '4x5': 0.8, '3x2': 1.5, '16x10': 1.6, '1x1': 1 };
const rows = [];
const warn = [];

mkdirSync(OUT, { recursive: true });

async function webp(src, name, widths, { budget } = {}) {
  const { info: dims } = await sharp(src).rotate().toBuffer({ resolveWithObject: true }); // size after EXIF rotation
  const w0 = dims.width, h0 = dims.height;
  const hint = Object.keys(RATIOS).find((r) => name.includes(r));
  if (hint && Math.abs(w0 / h0 - RATIOS[hint]) > 0.03) warn.push(`${basename(src)} is ${w0}×${h0}, not ${hint.replace('x', ':')}. Crop it to ${hint.replace('x', ':')} before using it.`);
  if (/^(hero|doctor|clinic)/.test(name) && Math.max(w0, h0) < 2400) warn.push(`${basename(src)} is only ${w0}×${h0}; photos should be ≥ 2400 px on the long side.`);
  let use = widths.filter((w) => w <= w0);
  if (!use.length) use = [w0];
  for (const w of use) {
    const out = join(OUT, `zds-${name}-${w}.webp`);
    if (fresh(src, out)) { rows.push([basename(out), 'up to date', '']); continue; }
    let q = 72, info;
    for (;;) {
      info = await sharp(src).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: q, effort: 5 }).toFile(out);
      if (!budget || w > 768 || info.size <= budget || q <= 50) break;
      q -= 6;
    }
    if (budget && w <= 768 && info.size > budget) warn.push(`${basename(out)} is ${kb(info.size)} even at quality ${q}: simplify the photo (busy background) or crop tighter.`);
    rows.push([basename(out), kb(info.size), `q${q}`]);
  }
}

for (const src of list(join(ROOT, 'src/assets/images'))) {
  const ext = extname(src).toLowerCase();
  if (!PHOTO.includes(ext)) { warn.push(`Skipped ${basename(src)} (use JPG, PNG or WebP).`); continue; }
  const name = slug(src);
  const isMobileHero = /^(hero|placeholder)-.*4x5/.test(name);
  await webp(src, name, isMobileHero ? [480, 768] : [480, 768, 1080, 1440, 1920], { budget: name.startsWith('hero') || name.startsWith('placeholder') ? 120 * 1024 : 0 });
}

for (const src of list(join(ROOT, 'src/assets/brand'))) {
  const ext = extname(src).toLowerCase(), name = slug(src);
  if (ext === '.svg') {
    const out = join(OUT, `zds-${name}.svg`);
    if (!fresh(src, out)) copyFileSync(src, out);
    rows.push([basename(out), kb(statSync(out).size), 'copied']);
  } else if (name.startsWith('favicon')) {
    for (const s of [32, 180, 512]) {
      const out = join(OUT, `zds-favicon-${s}.png`);
      if (fresh(src, out)) { rows.push([basename(out), 'up to date', '']); continue; }
      const info = await sharp(src).resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 }).toFile(out);
      rows.push([basename(out), kb(info.size), 'png']);
    }
  } else if (name.startsWith('og')) {
    const out = join(OUT, `zds-${name}.jpg`);
    if (!fresh(src, out)) {
      const info = await sharp(src).rotate().resize({ width: 1200, height: 630, fit: 'cover' }).jpeg({ quality: 80, mozjpeg: true }).toFile(out);
      rows.push([basename(out), kb(info.size), 'jpg']);
    } else rows.push([basename(out), 'up to date', '']);
  } else if (PHOTO.includes(ext)) {
    await webp(src, name, [160, 320, 640]);
  } else warn.push(`Skipped ${basename(src)} (brand files: PNG or SVG).`);
}

if (!rows.length) console.log('images: nothing to do. Put photos in src/assets/images/ and logos in src/assets/brand/ (see docs/assets-checklist.md).');
for (const [f, s, q] of rows) console.log(`${f.padEnd(48)} ${s.padStart(10)}  ${q}`);
for (const w of warn) console.log(`WARN  ${w}`);
