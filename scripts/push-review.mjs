#!/usr/bin/env node
// Pushes the working tree to the UNPUBLISHED review theme named $REVIEW_THEME and records its id and preview URL.
// Creates the theme on first use. Refuses to touch the live theme. Runs Theme Check first (--strict).
// Usage: node scripts/push-review.mjs     (npm run push:review)
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'qa/.review-theme.json');
const env = process.env;
const die = (msg) => { console.error(`push-review: ${msg}`); process.exit(1); };
for (const k of ['SHOPIFY_FLAG_STORE', 'SHOPIFY_CLI_THEME_TOKEN', 'REVIEW_THEME']) if (!env[k]) die(`${k} is not set (see docs/tech/cloud-setup.md).`);
const token = env.SHOPIFY_CLI_THEME_TOKEN;
const hide = (s) => String(s || '').split(token).join('***');
const auth = ['--store', env.SHOPIFY_FLAG_STORE, '--password', token, '--no-input'];

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...env, SHOPIFY_CLI_NO_ANALYTICS: '1' } });
  if (r.error) die(r.error.code === 'ENOENT' ? `${cmd} not found. The environment setup script installs the Shopify CLI.` : r.error.message);
  return r;
}

// --json output is one JSON document; event lines may also appear. Take the last object that parses.
function parseJson(text) {
  const s = String(text || '').trim();
  try { return JSON.parse(s); } catch { /* fall through */ }
  const starts = [...s.matchAll(/^\{/gm)].map((m) => m.index).reverse();
  for (const i of starts) { try { return JSON.parse(s.slice(i)); } catch { /* keep looking */ } }
  for (const line of s.split('\n').reverse()) { try { const o = JSON.parse(line); if (o && typeof o === 'object') return o; } catch { /* next */ } }
  return null;
}
const themesOf = (o) => (o && (o.themes || (o.environments || []).flatMap((e) => (e.result && e.result.themes) || []))) || [];

const git = (args) => { const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : ''; };
const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
const commit = git(['rev-parse', '--short', 'HEAD']);
const dirty = git(['status', '--porcelain']) !== '';

// 1. Find the review theme by exact name.
const list = run('shopify', ['theme', 'list', '--json', '--name', env.REVIEW_THEME, ...auth]);
const listed = parseJson(list.stdout);
if (list.status !== 0 || !listed) die(`could not list themes.\n${hide(list.stderr || list.stdout).slice(-2000)}`);
const matches = themesOf(listed).filter((t) => t.name === env.REVIEW_THEME);
if (matches.length > 1) die(`${matches.length} themes are named "${env.REVIEW_THEME}". Delete or rename the extras in Shopify admin, then retry.`);
const existing = matches[0];
if (existing && existing.role === 'live') die(`"${env.REVIEW_THEME}" is the LIVE theme. Refusing to push. Change REVIEW_THEME in the cloud environment.`);

// 2. Push (Theme Check must pass: --strict).
const target = existing ? ['--theme', String(existing.id)] : ['--unpublished', '--theme', env.REVIEW_THEME];
console.log(`push-review: ${existing ? `updating theme ${existing.id}` : `creating unpublished theme "${env.REVIEW_THEME}"`} from ${branch || '?'}@${commit || '?'}${dirty ? ' (uncommitted changes included)' : ''} …`);
const push = run('shopify', ['theme', 'push', '--json', '--strict', ...target, ...auth]);
const res = parseJson(push.stdout);
if (push.status !== 0 || !res || !res.theme) die(`push failed.\n${hide(push.stderr || '').slice(-3000)}\n${hide(push.stdout || '').slice(-3000)}`);
if (res.theme.role === 'live') console.error('push-review: WARNING: the pushed theme reports role "live". Tell Ahmad immediately.');

const record = {
  id: String(res.theme.id), name: res.theme.name, role: res.theme.role, storeDomain: res.theme.storeDomain,
  previewUrl: res.theme.previewUrl, editorUrl: res.theme.editorUrl, branch, commit, dirty, pushedAt: new Date().toISOString(),
  status: res.status, issues: res.issues || [],
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(record, null, 2) + '\n');

const preview = record.previewUrl ? `${record.previewUrl}${record.previewUrl.includes('?') ? '&' : '?'}pb=0` : '(no preview URL returned)';
console.log(`push-review: ${res.status} · theme ${record.id} (${record.role}) · preview ${preview}`);
if (record.issues.length || res.status !== 'success') {
  console.error(`push-review: ${record.issues.length} file(s) were not uploaded:`);
  for (const i of record.issues) console.error(`  - ${i.filePath}: ${hide(i.message)}`);
  process.exit(1);
}
