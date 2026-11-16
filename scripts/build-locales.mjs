#!/usr/bin/env node
// Builds locales/ur.json + locales/en.default.json from docs/content/copy.yml and docs/brand/facts.yml.
// Usage: node scripts/build-locales.mjs [--check]
//   --check  build in memory and exit 1 if the files on disk are missing or out of date (no writes).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import YAML from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const COPY = join(ROOT, 'docs/content/copy.yml');
const FACTS = join(ROOT, 'docs/brand/facts.yml');
const OUT = { ur: join(ROOT, 'locales/ur.json'), en: join(ROOT, 'locales/en.default.json') };

// Placeholders that copy.yml may use (see the header of copy.yml).
export const ALLOWED_PLACEHOLDERS = new Set([
  'doctor', 'role', 'experience', 'experience_years', 'hours', 'days', 'address', 'landmark', 'phone',
  'emergency', 'helpline_name', 'helpline', 'registration', 'specialty', 'product', 'code', 'year',
  'qualification', 'institute', 'qualification_year', 'council',
  'date', 'author', 'terms', 'count', 'expires_on',
]);

const isPending = (v) => typeof v === 'string' && /^\s*\[(PENDING|CONFIRM)\]/.test(v);
const clean = (v) => (v === undefined || v === null || isPending(v) ? '' : String(v));
const placeholders = (s) => [...String(s).matchAll(/\{\{\s*([a-z_]+)\s*\}\}/g)].map((m) => m[1]).sort();

function walkCopy(node, path, ur, en, errors) {
  for (const [key, val] of Object.entries(node)) {
    const p = [...path, key];
    const id = p.join('.');
    if (typeof val === 'string') { ur[key] = val; en[key] = val; continue; }
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const keys = Object.keys(val);
      if (keys.length === 2 && keys.includes('ur') && keys.includes('en')) {
        if (typeof val.ur !== 'string' || typeof val.en !== 'string') { errors.push(`${id}: ur and en must both be strings`); continue; }
        const pu = placeholders(val.ur), pe = placeholders(val.en);
        if (pu.join() !== pe.join()) errors.push(`${id}: placeholders differ (ur: ${pu.join(',') || '-'} / en: ${pe.join(',') || '-'})`);
        for (const name of new Set([...pu, ...pe])) if (!ALLOWED_PLACEHOLDERS.has(name)) errors.push(`${id}: unknown placeholder {{ ${name} }}`);
        ur[key] = val.ur; en[key] = val.en; continue;
      }
      if (keys.includes('ur') || keys.includes('en')) { errors.push(`${id}: a leaf needs exactly the keys ur and en`); continue; }
      ur[key] = {}; en[key] = {};
      walkCopy(val, p, ur[key], en[key], errors);
      continue;
    }
    errors.push(`${id}: unsupported value type (${Array.isArray(val) ? 'array' : typeof val})`);
  }
}

function factsTree(f, errors) {
  const pr = f.practitioner || {}, cl = f.clinic || {}, ad = cl.address || {}, hr = f.hours || {}, ct = f.contact || {};
  const sf = f.safety || {}, ln = f.links || {}, br = f.brand || {};
  const both = (v) => ({ ur: clean(v), en: clean(v) });
  const pair = (u, e) => ({ ur: clean(u), en: clean(e) });
  const t = {
    brand: pair(br.name_ur, br.name_en),
    legal_name: both(br.legal_name),
    doctor: pair(pr.display_ur, pr.display_en),
    credential_line: pair(pr.credential_line_ur, pr.credential_line_en),
    role: pair(pr.role_ur, pr.role_en),
    experience: pair(pr.experience_ur, pr.experience_en),
    experience_years: both(pr.experience_years),
    rank: pair(pr.rank_ur, pr.rank_en),
    phd: pair(pr.phd_ur, pr.phd_en),
    council: pair(pr.council_ur, pr.council_en),
    qualification: pair(pr.qualification_ur, pr.qualification_en),
    institute: pair(pr.institute_ur, pr.institute_en),
    qualification_year: both(pr.qualification_year),
    quote: pair(pr.quote_ur, pr.quote_en),
    // {{ registration }} = the practitioner's NCT number. The clinic premises' PHC number is clinic_registration.
    registration: both(pr.council_reg_no),
    registration_valid_until: both(pr.council_reg_valid_until),
    certificate_public: both(pr.certificate_public === true ? 'yes' : ''),
    clinic_registration: both(cl.registration_number),
    registration_authority: both(cl.registration_authority),
    address: pair(ad.full_ur, ad.full_en),
    address_en: both(ad.full_en),
    landmark: pair(ad.landmark_ur, ad.landmark_en),
    landmark_en: both(ad.landmark_en),
    street_en: both(ad.line1_en),
    area_en: both(ad.area_en),
    city_en: both(ad.city_en),
    region_en: both(ad.region_en),
    country_code: both(ad.country_code),
    postal_code: both(ad.postal_code),
    geo_lat: both(ad.geo_lat),
    geo_lng: both(ad.geo_lng),
    maps_url: both(ad.maps_url),
    maps_embed_src: both(ad.maps_embed_src),
    hours: pair(hr.display_ur, hr.display_en),
    opens: both(hr.opens),
    closes: both(hr.closes),
    days: pair(hr.days_ur, hr.days_en),
    days_schema: both(hr.days_schema),
    phone: both(ct.phone_display),
    phone_e164: both(ct.phone_e164),
    whatsapp_number: both(ct.whatsapp_number),
    email: both(ct.email),
    emergency: both(sf.emergency_number),
    helpline_name: pair(sf.helpline_name_ur, sf.helpline_name_en),
    helpline: both(sf.helpline_number),
    links: Object.fromEntries(Object.entries(ln).map(([k, v]) => [k, both(v)])),
    specialties: {},
    specialties_public: both(''),
    specialties_private: both(''),
  };
  const pub = [], priv = [];
  for (const s of f.specialties || []) {
    if (!s || !/^[a-z_]+$/.test(s.key || '')) { errors.push(`facts.yml specialties: invalid key ${JSON.stringify(s && s.key)}`); continue; }
    if (!/^[A-Z]{3}$/.test(s.code || '')) errors.push(`facts.yml specialties.${s.key}: code must be 3 capital letters`);
    if (!['public', 'private'].includes(s.group)) errors.push(`facts.yml specialties.${s.key}: group must be public or private`);
    if (s.group === 'private' && s.code !== 'PRV') errors.push(`facts.yml specialties.${s.key}: private specialties must use code PRV`);
    t.specialties[s.key] = { name: pair(s.name_ur, s.name_en), code: both(s.code), group: both(s.group) };
    (s.group === 'private' ? priv : pub).push(s.key);
  }
  t.specialties_public = both(pub.join(','));
  t.specialties_private = both(priv.join(','));
  return t;
}

// Turn a tree whose leaves are {ur, en} into two trees.
function split(tree, ur = {}, en = {}) {
  for (const [k, v] of Object.entries(tree)) {
    if (v && typeof v === 'object' && 'ur' in v && 'en' in v && Object.keys(v).length === 2) { ur[k] = v.ur; en[k] = v.en; }
    else { ur[k] = {}; en[k] = {}; split(v, ur[k], en[k]); }
  }
  return { ur, en };
}

export function buildLocales() {
  const errors = [];
  const copy = YAML.parse(readFileSync(COPY, 'utf8')) || {};
  const facts = YAML.parse(readFileSync(FACTS, 'utf8')) || {};
  if ('facts' in copy) errors.push('copy.yml: the top-level key "facts" is reserved for facts.yml');
  const ur = {}, en = {};
  walkCopy(copy, [], ur, en, errors);

  const f = split(factsTree(facts, errors));
  ur.facts = f.ur; en.facts = f.en;

  // Every specialty needs a one-liner (public ones) and gets a notice key (empty if none).
  for (const s of facts.specialties || []) {
    if (!s || !s.key) continue;
    for (const tree of [ur, en]) {
      tree.treatments = tree.treatments || {};
      tree.treatments.notices = tree.treatments.notices || {};
      if (!(s.key in tree.treatments.notices)) tree.treatments.notices[s.key] = '';
    }
    if (s.group === 'public' && !(ur.treatments.items && s.key in ur.treatments.items)) {
      errors.push(`copy.yml treatments.items.${s.key} is missing (needed for the public specialty "${s.key}")`);
    }
  }
  return { ur, en, errors };
}

const json = (o) => JSON.stringify(o, null, 2) + '\n';

function main() {
  const check = process.argv.includes('--check');
  const { ur, en, errors } = buildLocales();
  if (errors.length) {
    console.error('build-locales: FAILED\n- ' + errors.join('\n- '));
    process.exit(1);
  }
  if (check) {
    const stale = Object.entries({ ur, en }).filter(([l, tree]) => !existsSync(OUT[l]) || readFileSync(OUT[l], 'utf8') !== json(tree));
    if (stale.length) { console.error('build-locales: locales are out of date. Run: node scripts/build-locales.mjs'); process.exit(1); }
    console.log('build-locales: locales are up to date.');
    return;
  }
  mkdirSync(dirname(OUT.ur), { recursive: true });
  writeFileSync(OUT.ur, json(ur));
  writeFileSync(OUT.en, json(en));
  const count = (o) => Object.values(o).reduce((n, v) => n + (typeof v === 'string' ? 1 : count(v)), 0);
  console.log(`build-locales: wrote locales/ur.json and locales/en.default.json (${count(ur)} keys each).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
