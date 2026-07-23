import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');

const forbidden = [
  'components/static/i18n-typography-fix',
  'components/static/states-sla-edge-cases',
  'components/static/privacy-audit-patterns',
  'components/static/disputes-user-admin',
  'components/static/quality-pass-states',
  'components/static/accessibility-content-safety',
  'components/static/component-audit-variants',
  'components/static/qa-release-readiness',
  'components/static/governance-rules',
  'components/static/payment-history-receipts',
  'components/static/geo-best-operator',
  'components/static/data-contracts-api-mapping',
  'components/static/copy-library',
  'components/static/build-checklist',
  'components/static/analytics-event-tracking',
  'payment/confirmation-demo',
  'i18n-typography',
  'states-sla-edge-cases',
  'privacy-audit-patterns',
  'data-contracts-api-mapping',
  'component-audit-variants',
  'qa-release-readiness',
  'build-checklist',
  'analytics-event-tracking',
];

if (!existsSync(distDir)) {
  throw new Error('dist/ does not exist; run the production build first');
}

const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full);
    else files.push(full);
  }
}
walk(distDir);

const offenders = [];
for (const file of files) {
  const rel = path.relative(distDir, file).replaceAll(path.sep, '/');
  if (rel.endsWith('.map')) offenders.push(`${rel}: public source map`);
  const text = readFileSync(file, 'utf8');
  for (const marker of forbidden) {
    if (text.includes(marker)) offenders.push(`${rel}: ${marker}`);
  }
}

if (offenders.length) {
  console.error('Production artifacts contain internal route/module markers:');
  for (const offender of offenders) console.error(`- ${offender}`);
  process.exit(1);
}

console.log('Internal artifact scan passed.');
