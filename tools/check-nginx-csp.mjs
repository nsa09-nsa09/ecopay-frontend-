import { readFileSync } from 'node:fs';

const nginx = readFileSync('nginx.conf', 'utf8');
const csp = nginx.match(/Content-Security-Policy\s+"([^"]+)"/)?.[1] ?? '';
const directive = (name) => csp.match(new RegExp(`(?:^|;)\\s*${name}\\s+([^;]+)`))?.[1] ?? '';

if (!/\bblob:/.test(directive('img-src'))) {
  throw new Error('nginx CSP must allow blob: in img-src for the local crop preview.');
}
for (const name of ['default-src', 'script-src', 'object-src']) {
  if (/\bblob:/.test(directive(name))) throw new Error(`nginx CSP must not allow blob: in ${name}.`);
}

console.log('nginx CSP check passed.');
