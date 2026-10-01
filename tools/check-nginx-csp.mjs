import { existsSync, readFileSync } from 'node:fs';

const nginx = readFileSync('nginx.conf', 'utf8');
const csp = nginx.match(/Content-Security-Policy\s+"([^"]+)"/)?.[1] ?? '';
const directive = (name) => csp.match(new RegExp(`(?:^|;)\\s*${name}\\s+([^;]+)`))?.[1] ?? '';
const failures = [];

if (!csp) failures.push('nginx.conf must set a Content-Security-Policy header.');

if (!/\bblob:/.test(directive('img-src'))) {
  failures.push('nginx CSP must allow blob: in img-src for the local crop preview.');
}
for (const name of ['default-src', 'script-src', 'object-src']) {
  if (/\bblob:/.test(directive(name))) failures.push(`nginx CSP must not allow blob: in ${name}.`);
}

// Script execution stays locked to same-origin files.
const scriptSrc = directive('script-src').trim();
if (scriptSrc !== "'self'") {
  failures.push(`nginx CSP script-src must be exactly 'self' (found: ${scriptSrc || 'missing'}).`);
}
if (/unsafe-eval/.test(csp)) failures.push("nginx CSP must not allow 'unsafe-eval'.");
for (const [name, expected] of [
  ['object-src', "'none'"],
  ['frame-ancestors', "'none'"],
  ['base-uri', "'self'"],
]) {
  if (directive(name).trim() !== expected) {
    failures.push(`nginx CSP ${name} must be ${expected}.`);
  }
}

// Baseline security headers and artifact rules.
for (const [label, pattern] of [
  ['HSTS', /Strict-Transport-Security "max-age=\d+/],
  ['nosniff', /X-Content-Type-Options "nosniff"/],
  ['frame protection', /X-Frame-Options "DENY"/],
  ['Referrer-Policy', /Referrer-Policy "/],
  ['Permissions-Policy', /Permissions-Policy "/],
  ['source maps blocked', /location ~\* \\\.map\$ \{\s*return 404;/],
  ['immutable hashed assets', /Cache-Control "public, max-age=31536000, immutable"/],
  ['SPA entry not cached', /Cache-Control "no-cache"/],
  ['WebSocket upgrade', /proxy_set_header Upgrade \$http_upgrade;/],
]) {
  if (!pattern.test(nginx)) failures.push(`nginx.conf is missing: ${label}.`);
}

// The CSP forbids inline scripts, so the built entry must not contain any.
if (existsSync('dist/index.html')) {
  const html = readFileSync('dist/index.html', 'utf8');
  const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(
    ([, attrs, body]) => !/\bsrc=/.test(attrs) && body.trim().length > 0,
  );
  if (inline.length) {
    failures.push('dist/index.html contains inline <script> blocks that the CSP would block.');
  }
  if (/https:\/\/fonts\.(googleapis|gstatic)\.com/.test(html)) {
    failures.push('dist/index.html loads third-party fonts that the CSP blocks; self-host them.');
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('nginx CSP check passed.');
