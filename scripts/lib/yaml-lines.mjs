// Line-level view of our hand-written YAML files (facts.yml, copy.yml): for every line, its key path,
// its value and its trailing comment. Used by qa-static (--scope) and proofread-sheet.
// Assumes the house style of those files: 2-space indentation, one key per line, flow maps on one line.
import { readFileSync } from 'node:fs';
import YAML from 'yaml';

// Split "value   # comment" while respecting quotes.
function splitComment(rest) {
  let q = null;
  for (let i = 0; i < rest.length; i++) {
    const c = rest[i];
    if (q) { if (c === q && rest[i - 1] !== '\\') q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === '#' && (i === 0 || /\s/.test(rest[i - 1]))) return [rest.slice(0, i).trim(), rest.slice(i + 1).trim()];
  }
  return [rest.trim(), ''];
}

export function lineInfo(text) {
  const stack = [];
  return text.split('\n').map((line, i) => {
    const info = { n: i + 1, line, path: null, value: '', comment: '', valuePending: false };
    if (!line.trim() || /^\s*#/.test(line)) return info;
    const lead = line.match(/^\s*/)[0].length;
    const m = line.match(/^(\s*)(-\s+)?(?:"([^"]+)"|'([^']+)'|([A-Za-z0-9_\-]+))\s*:(?=\s|$)(.*)$/);
    let rest;
    if (m && !(m[2] && /^\s*\{/.test(line.slice(lead + m[2].length)))) {
      const indent = lead + (m[2] ? m[2].length : 0);
      const key = m[3] ?? m[4] ?? m[5];
      while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
      stack.push({ indent, key });
      rest = m[6];
    } else {
      while (stack.length && stack[stack.length - 1].indent >= lead) stack.pop();
      rest = line.trim().replace(/^-\s+/, '');
    }
    info.path = stack.map((s) => s.key).join('.');
    [info.value, info.comment] = splitComment(rest);
    const bare = info.value.replace(/^["']/, '');
    info.valuePending = /^\[(PENDING|CONFIRM)\]/.test(bare);
    return info;
  });
}

export function loadScope(file) {
  const s = YAML.parse(readFileSync(file, 'utf8')) || {};
  const norm = (x = {}) => ({ include: x.include || [], exclude: x.exclude || [], show_on_sheet: x.show_on_sheet || [] });
  return { facts: norm(s.facts), copy: norm(s.copy) };
}

const under = (path, p) => path === p || path.startsWith(p + '.');
export function inScope(path, scope) {
  if (!path || !scope) return false;
  return scope.include.some((p) => under(path, p)) && !scope.exclude.some((p) => under(path, p));
}
