// Build-time guard against untranslated / raw-text regressions.
//
// Fails the build (exit 1) on any of:
//   1. A JSX text node in src/app/components (excluding admin/** and the static
//      demo pages) that is 3+ consecutive ASCII words with no Cyrillic and is
//      not wrapped in t()/a locale helper — i.e. hard-coded English in the UI.
//   2. Any i18n key in i18n-provider.tsx missing a non-empty ru, kz or en.
//   3. Any backend status in the known enum list (KNOWN_BACKEND_STATUSES) that
//      is absent from STATUS_LABELS in user-facing-enums.ts.
//
// The heuristic is deliberately tight and backed by an explicit allowlist: a
// noisy checker gets disabled, a precise one gets kept.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src/app');
const COMPONENTS = path.join(ROOT, 'components');

const offenders = [];
const fail = (msg) => offenders.push(msg);

// Tokens that are allowed to appear in otherwise-English runs (brand/technical).
const ALLOWLIST = new Set(
  [
    'EcoPay', 'FreedomPay', 'Freedom', 'Pay', 'Mobizon', 'KZT', 'USD', 'EUR',
    'iOS', 'Android', 'SIM', 'eSIM', 'Instagram', 'TikTok', 'Google', 'Apple',
    'Netflix', 'Spotify', 'YouTube', 'Premium', 'Microsoft', 'Yandex', 'Plus',
    'ID', 'OTP', 'URL', 'API', 'PNG', 'JPG', 'JPEG', 'PDF', 'SMS', 'TLS', 'SSL',
  ].map((w) => w.toLowerCase()),
);

// Directories excluded from the JSX-text scan:
//   admin/  — admin console (not a public user surface)
//   static/ — static demo/spec pages (intentionally English, never shipped)
//   ui/     — low-level shadcn primitives (vendor boilerplate, sr-only labels)
// not-found.tsx and the real static pages route through t()/tx() so they are
// unaffected either way.
const EXCLUDED_DIRS = new Set(['admin', 'static', 'ui']);

// i18n keys that are intentionally empty in every language (not shown to users,
// no English/raw leak). Kept explicit so a real empty-value regression still
// fails the build.
const INTENTIONAL_EMPTY_I18N = new Set(['contactEmail']);

const CYRILLIC = /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/;

function listTsx(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (EXCLUDED_DIRS.has(name)) continue;
      out.push(...listTsx(full));
    } else if (name.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

// --- 1. JSX text-node scan -------------------------------------------------
//
// Capture text that sits between a `>` and the next `<` and contains no `{`,
// `}`, `<` or `>` (so JSX expressions like {t('key')} are excluded). Then flag
// it only if it holds a run of 3+ consecutive ASCII words with no Cyrillic.

function asciiWordRun(text) {
  const tokens = text
    .split(/[^A-Za-z'’]+/)
    .filter(Boolean)
    .filter((tok) => /[A-Za-z]/.test(tok));
  let run = 0;
  for (const tok of tokens) {
    if (ALLOWLIST.has(tok.toLowerCase())) {
      run = 0; // brand/technical token breaks the "English sentence" run
      continue;
    }
    run += 1;
    if (run >= 3) return true;
  }
  return false;
}

function scanJsxText(file) {
  const text = readFileSync(file, 'utf8');
  const rel = path.relative(process.cwd(), file).replaceAll(path.sep, '/');
  // Match a node's text content between `>` and the next `<`. The character
  // class forbids anything code-like ((){};=/\|`<>{}) so TS generics
  // (`querySelectorAll<T>(`), arrow functions (`=>`) and JSX expressions
  // (`{t('key')}`) are never mistaken for prose.
  const re = />([^<>{}();=/\\|`\n]*[A-Za-z][^<>{}();=/\\|`\n]*)</g;
  let m;
  while ((m = re.exec(text)) !== null) {
    // Reject when the opening `>` is really part of `=>` or `/>`.
    const before = text[m.index - 1];
    if (before === '=' || before === '/') continue;
    const raw = m[1].trim();
    if (!raw || CYRILLIC.test(raw)) continue;
    // Skip pure punctuation / numbers / single short words.
    if (!/[A-Za-z]/.test(raw)) continue;
    if (asciiWordRun(raw)) {
      const line = text.slice(0, m.index).split('\n').length;
      fail(`[jsx-text] ${rel}:${line} hard-coded English JSX text: "${raw.slice(0, 80)}"`);
    }
  }
}

// --- 2. i18n completeness (string-aware tokenizer) -------------------------

// Walk a braced region starting at `open` (index of the `{`), returning the
// inner body. String literals AND // line / /* block */ comments are skipped so
// a stray quote or apostrophe inside a comment can't throw off brace depth.
function braceBody(src, open) {
  let depth = 0;
  let inStr = null;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    const prev = src[i - 1];
    const next = src[i + 1];
    if (inStr) {
      if (ch === inStr && prev !== '\\') inStr = null;
      continue;
    }
    if (ch === '/' && next === '/') {
      const nl = src.indexOf('\n', i);
      i = nl < 0 ? src.length : nl;
      continue;
    }
    if (ch === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end < 0 ? src.length : end + 1;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inStr = ch;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return src.slice(open + 1, i);
    }
  }
  return null;
}

function sliceTranslationsObject(src) {
  const start = src.indexOf('const translations');
  if (start < 0) return null;
  const open = src.indexOf('{', start);
  if (open < 0) return null;
  return braceBody(src, open);
}

// Split the translations body into top-level `key: { ... }` entries, honoring
// string literals so that `{{token}}` inside a value does not confuse depth.
function splitEntries(body) {
  const entries = [];
  let i = 0;
  const n = body.length;
  while (i < n) {
    // find a key
    const keyMatch = /([A-Za-z0-9_]+)\s*:\s*\{/g;
    keyMatch.lastIndex = i;
    const km = keyMatch.exec(body);
    if (!km) break;
    const key = km[1];
    let depth = 0;
    let inStr = null;
    let j = km.index + km[0].length - 1; // at the '{'
    for (; j < n; j++) {
      const ch = body[j];
      const prev = body[j - 1];
      const next = body[j + 1];
      if (inStr) {
        if (ch === inStr && prev !== '\\') inStr = null;
        continue;
      }
      if (ch === '/' && next === '/') {
        const nl = body.indexOf('\n', j);
        j = nl < 0 ? n : nl;
        continue;
      }
      if (ch === '/' && next === '*') {
        const end = body.indexOf('*/', j + 2);
        j = end < 0 ? n : end + 1;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === '`') inStr = ch;
      else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    entries.push({ key, body: body.slice(km.index + km[0].length - 1, j + 1) });
    i = j + 1;
  }
  return entries;
}

function hasNonEmpty(entryBody, lang) {
  const re = new RegExp(`${lang}\\s*:\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`);
  const m = re.exec(entryBody);
  if (!m) return false;
  return m[2].trim().length > 0;
}

function checkI18n() {
  const file = path.join(COMPONENTS, 'i18n-provider.tsx');
  const src = readFileSync(file, 'utf8');
  const body = sliceTranslationsObject(src);
  if (!body) {
    fail('[i18n] could not locate the translations object in i18n-provider.tsx');
    return;
  }
  for (const { key, body: entryBody } of splitEntries(body)) {
    if (INTENTIONAL_EMPTY_I18N.has(key)) continue;
    for (const lang of ['ru', 'kz', 'en']) {
      if (!hasNonEmpty(entryBody, lang)) {
        fail(`[i18n] key "${key}" is missing a non-empty ${lang}`);
      }
    }
  }
}

// --- 3. Status coverage ----------------------------------------------------

function checkStatuses() {
  const file = path.join(ROOT, 'lib', 'user-facing-enums.ts');
  const src = readFileSync(file, 'utf8');

  // Extract the STATUS_LABELS keys.
  const labelsStart = src.indexOf('const STATUS_LABELS');
  const labelsOpen = src.indexOf('{', labelsStart);
  const labelsBody = braceBody(src, labelsOpen) ?? '';
  const labelKeys = new Set(
    [...labelsBody.matchAll(/^\s*([A-Z][A-Z0-9_]*)\s*:/gm)].map((m) => m[1]),
  );

  // Extract KNOWN_BACKEND_STATUSES string entries. Start the array scan AFTER
  // the assignment `=` so the `[` of the `readonly string[]` type annotation is
  // skipped and we land on the real array literal.
  const knownStart = src.indexOf('export const KNOWN_BACKEND_STATUSES');
  const knownEq = src.indexOf('=', knownStart);
  const knownOpen = src.indexOf('[', knownEq);
  const knownClose = src.indexOf(']', knownOpen);
  const knownBody = src.slice(knownOpen + 1, knownClose);
  const known = [...knownBody.matchAll(/'([A-Z][A-Z0-9_]*)'/g)].map((m) => m[1]);
  if (known.length === 0) {
    fail('[status] could not parse KNOWN_BACKEND_STATUSES array');
  }

  for (const status of known) {
    if (!labelKeys.has(status)) {
      fail(`[status] backend status "${status}" is not in STATUS_LABELS`);
    }
  }
}

// --- run -------------------------------------------------------------------

for (const file of listTsx(COMPONENTS)) scanJsxText(file);
checkI18n();
checkStatuses();

if (offenders.length) {
  console.error('check:untranslated found problems:');
  for (const o of offenders) console.error(`- ${o}`);
  process.exit(1);
}

console.log('check:untranslated passed.');
