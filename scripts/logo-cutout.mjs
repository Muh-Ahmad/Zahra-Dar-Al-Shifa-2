#!/usr/bin/env node
// Makes a real transparent PNG from a round ("disc") logo whose background was flattened,
// e.g. a fake "transparent" checkerboard painted into the pixels.
// It only cuts along the outer circle of the disc. Pixels inside the disc are copied unchanged:
// nothing is redrawn, recoloured or regenerated (brand.md, Logo rules).
//
// Usage: node scripts/logo-cutout.mjs <input.png|jpg> <output.png> [--inset 1.5] [--threshold 12]
//   --inset      pixels to shave off the edge so no background fringe remains (default 1.5)
//   --threshold  how colourful a pixel must be to count as part of the disc (default 12)
// The background must be neutral grey/white (a checkerboard or plain white); the disc must be coloured.
import sharp from 'sharp';

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? Number(args[i + 1]) : def; };
const [input, output] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!input || !output) { console.error('Usage: node scripts/logo-cutout.mjs <input> <output.png> [--inset 1.5] [--threshold 12]'); process.exit(2); }
const INSET = opt('--inset', 1.5), T = opt('--threshold', 12);

const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const colourful = (x, y) => { const i = (y * W + x) * 3; const r = data[i], g = data[i + 1], b = data[i + 2]; return Math.max(r, g, b) - Math.min(r, g, b) > T; };

// Rows and columns that contain a real run of disc pixels (ignores single noisy pixels).
const MIN = Math.max(3, Math.round(Math.min(W, H) * 0.004));
const rowHits = new Array(H).fill(0), colHits = new Array(W).fill(0);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (colourful(x, y)) { rowHits[y]++; colHits[x]++; }
const first = (a) => a.findIndex((n) => n >= MIN), last = (a) => a.length - 1 - [...a].reverse().findIndex((n) => n >= MIN);
const y0 = first(rowHits), y1 = last(rowHits), x0 = first(colHits), x1 = last(colHits);
if (y0 < 0 || x0 < 0) { console.error('logo-cutout: no coloured disc found. Is the background already transparent, or the logo grey?'); process.exit(1); }

const w = x1 - x0 + 1, h = y1 - y0 + 1;
if (Math.abs(w - h) / Math.max(w, h) > 0.02) { console.error(`logo-cutout: the coloured area is ${w}×${h}px, not a circle. Ask the designer for a transparent master instead.`); process.exit(1); }
const cx = x0 + w / 2, cy = y0 + h / 2, r = Math.min(w, h) / 2 - INSET;

// Square canvas around the disc with a 2px margin; alpha = anti-aliased circle.
const S = Math.ceil(2 * r) + 4, ox = Math.round(cx - S / 2), oy = Math.round(cy - S / 2);
const out = Buffer.alloc(S * S * 4);
for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
  const sx = x + ox, sy = y + oy, o = (y * S + x) * 4;
  if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
  const d = Math.hypot(sx + 0.5 - cx, sy + 0.5 - cy);
  const a = Math.max(0, Math.min(1, r - d + 0.5));
  if (!a) continue;
  const i = (sy * W + sx) * 3;
  out[o] = data[i]; out[o + 1] = data[i + 1]; out[o + 2] = data[i + 2]; out[o + 3] = Math.round(a * 255);
}
await sharp(out, { raw: { width: S, height: S, channels: 4 } }).png({ compressionLevel: 9 }).toFile(output);
console.log(`logo-cutout: ${input} (${W}×${H}) → ${output} (${S}×${S}, transparent). Disc centre ${cx.toFixed(1)},${cy.toFixed(1)} · radius ${r.toFixed(1)}px.`);
