#!/usr/bin/env node
// Smoke tests for the static portfolio — no dependencies, runs anywhere with Node.
// Run:  node test/checks.mjs        (exits non-zero if anything fails)
//
// These guard against the kinds of regressions we've actually hit:
//  - hero image stretched (missing height:auto)
//  - photo re-inlined as base64 (HTML bloat / slow load)
//  - dangling refs to removed files (hero.mp4, deleted images)
//  - broken theme/language detection (missing scripts or persist guard)
//  - invalid inline JS syntax
//  - missing assets referenced by the HTML

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(ROOT, f), 'utf8');
const has = (f) => existsSync(join(ROOT, f));

let pass = 0, failures = [];
const check = (name, cond, detail = '') => {
  if (cond) { pass++; }
  else { failures.push(`✗ ${name}${detail ? ' — ' + detail : ''}`); }
};

const index = read('index.html');
const cv = read('CV-interactivo.html');

// ---- 1. Required files exist ----
for (const f of ['index.html', 'CV-interactivo.html', 'config.js', 'img/photo.jpg', 'img/og-photo.jpg',
                 'lib/qrcode.min.js', 'cv/cv-es.pdf', 'cv/cv-en.pdf', '_headers', 'robots.txt',
                 'functions/_middleware.js', 'README.md']) {
  check(`file exists: ${f}`, has(f));
}

// config.js must define window.SITE with the key identity fields
const cfg = read('config.js');
for (const key of ['firstName', 'lastName', 'roleES', 'roleEN', 'email', 'linkedin', 'siteUrl']) {
  check(`config.js defines ${key}`, new RegExp(`${key}\\s*:`).test(cfg));
}
// Template hygiene: config.js must carry no residue from the original author.
check('config.js has no personal residue ("biggio")', !/biggio/i.test(cfg));

// ---- 2. No HTML bloat: photo must NOT be re-inlined as base64 ----
check('index.html has no inline base64 JPEG (photo is external)', !/data:image\/jpeg;base64/.test(index));
check('CV has no inline base64 JPEG (photo is external)', !/data:image\/jpeg;base64/.test(cv));
check('index.html stays lightweight (< 60KB)', Buffer.byteLength(index) < 60 * 1024,
      `${Math.round(Buffer.byteLength(index)/1024)}KB`);

// ---- 3. Hero image: external + height:auto (the stretch bug) ----
check('hero img points to img/photo.jpg', /<img[^>]+src="img\/photo\.jpg"/.test(index));
check('hero img CSS has height:auto', /\.hero img\{[^}]*height:auto/.test(index));

// ---- 4. No dangling references to removed assets ----
for (const dead of ['hero.mp4', 'heroVid']) {
  check(`no reference to removed "${dead}"`, !index.includes(dead) && !cv.includes(dead));
}

// ---- 5. Every local asset referenced by the HTML actually exists ----
const localRefs = (html) => [...html.matchAll(/(?:src|href)="([^"#?:][^"]*?)"/g)]
  .map(m => m[1])
  .filter(u => !/^(https?:|data:|mailto:|tel:|\/\/)/.test(u))
  .filter(u => !u.includes('${'))   // skip template-literal placeholders (e.g. src="${PHOTO}")
  .map(u => u.split(/[?#]/)[0]);
for (const ref of new Set([...localRefs(index), ...localRefs(cv)])) {
  check(`referenced asset exists: ${ref}`, has(ref));
}

// ---- 6. Theme + language detection wiring is present ----
for (const [label, src] of [['index.html', index], ['CV-interactivo.html', cv]]) {
  check(`${label}: legacy-pref migration present`, /prefv/.test(src) && /removeItem\('lang'\)/.test(src));
  check(`${label}: OS theme detection present`, /prefers-color-scheme: dark/.test(src));
}
check('index.html: device language detection (deviceLang)', /function deviceLang\(\)/.test(index));
check('index.html: setLang persist guard', /if\(persist !== false\) lsSet\('lang'/.test(index));
check('CV: language priority resolver present', /URLSearchParams\(location\.search\)\.get\('lang'\)/.test(cv));
check('CV: setLang persist guard', /if\(persist !== false\) lsSet\('lang'/.test(cv));

// ---- 7. Both languages present in the CV data ----
check('CV DATA has "es" and "en"', /const DATA = \{"es":/.test(cv) && /"en":/.test(cv));

// ---- 8. Open Graph essentials + image file exists ----
const og = index.match(/og:image" content="https:\/\/[^"/]+\/([^"]+)"/);
check('og:image meta present', !!og);
check('og:image file exists in repo', og ? has(og[1]) : false, og ? og[1] : '');
check('og:title present', /property="og:title"/.test(index));
check('twitter summary_large_image', /name="twitter:card" content="summary_large_image"/.test(index));

// ---- 9. Inline <script> blocks are syntactically valid ----
const scripts = (html, label) => {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let m, i = 0;
  while ((m = re.exec(html))) {
    i++;
    const code = m[1];
    if (!code.trim()) continue;
    try { new vm.Script(code); }
    catch (e) { check(`${label}: inline script #${i} parses`, false, e.message); }
  }
  check(`${label}: has inline scripts`, i > 0);
};
scripts(index, 'index.html');
scripts(cv, 'CV-interactivo.html');

// ---- 10. Middleware still hides docs + dev tooling from the public site ----
const mw = read('functions/_middleware.js');
check('middleware blocks README', /README/.test(mw));
check('middleware blocks /test/', /\\\/test\\\//.test(mw));
check('middleware blocks /.claude/', /\\\/\\.claude\\\//.test(mw));
check('middleware blocks /tools/', /\\\/tools\\\//.test(mw));

// ---- 11. Email lives in config.js only — no hardcoded mailto address in markup ----
// The mail must be set dynamically (index.html via applyIdentity, CV via `mailto:${S.email}`).
// A literal `mailto:someone@domain.tld` baked into the HTML is the regression we forbid.
for (const [label, src] of [['index.html', index], ['CV-interactivo.html', cv]]) {
  const m = src.match(/mailto:[\w.+-]+@[\w.-]+\.\w+/);
  check(`${label}: no hardcoded mailto address (email comes from config.js)`, !m, m ? m[0] : '');
}

// ---- 12. SEO / indexability: the site is public and indexable (the noindex era is over) ----
const robots = read('robots.txt');
check('robots.txt allows crawling (Allow: /)', /^\s*Allow:\s*\/\s*$/m.test(robots));
check('robots.txt excludes /cv/ from results', /^\s*Disallow:\s*\/cv\/\s*$/m.test(robots));
check('robots.txt points to the sitemap', /Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/i.test(robots));
check('robots.txt no longer blocks everything', !/^\s*Disallow:\s*\/\s*$/m.test(robots));

const headers = read('_headers');
check('_headers has no X-Robots-Tag noindex', !/X-Robots-Tag:\s*noindex/i.test(headers));

for (const [label, src] of [['index.html', index], ['CV-interactivo.html', cv]]) {
  check(`${label}: no robots/googlebot noindex meta`,
        !/<meta[^>]+name=["'](?:robots|googlebot)["'][^>]*noindex/i.test(src));
  check(`${label}: has canonical link`, /<link[^>]+rel=["']canonical["']/i.test(src));
}

check('sitemap.xml exists', has('sitemap.xml'));
const sitemap = has('sitemap.xml') ? read('sitemap.xml') : '';
check('sitemap.xml lists the landing page', /<loc>https?:\/\/[^<]+\/<\/loc>/.test(sitemap));
check('sitemap.xml lists the CV page', /<loc>https?:\/\/[^<]+CV-interactivo\.html<\/loc>/.test(sitemap));

check('middleware does not block sitemap.xml', !/sitemap/i.test(mw));
check('middleware does not block robots.txt', !/robots/i.test(mw));

// ---- report ----
console.log(`\n  Portfolio checks: ${pass} passed, ${failures.length} failed\n`);
if (failures.length) {
  for (const f of failures) console.log('  ' + f);
  console.log('');
  process.exit(1);
}
console.log('  ✓ All good.\n');
