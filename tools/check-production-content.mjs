import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const forbidden = [
  '+7 (727) 000-00-00',
  'pi_3M...xK7d',
  'PAY-2026-04-03-001',
  'Beeline Family 4',
  'PAY-2026',
  'pi_3M',
  'Apex Digital',
  'apex-digital',
  'apexdigital',
  '₸5,199',
  'Apex Digital LLP',
  'ТОО «Apex Digital»',
  'payment intent remains valid for 24 hours',
  'Платёжное намерение действует 24 часа',
  'EcoSplit',
  'ecosplit',
  '5000+ happy users',
  'Rated 4.8/5 on Google',
  'Google and Trustpilot',
  'Joined a Netflix room in minutes',
  'Made a Spotify room',
  'Yandex Plus for 500 KZT',
  'Clean catalog and fair prices',
  'YouTube Premium for the family',
  'Saving over 8,000 KZT',
  'Microsoft 365 for studying',
  'As a room owner I get payouts reliably',
];

const legacyTechnicalBrandSnippets = [
  'ecosplit.banEvent',
  'ecosplit.session',
  'ecosplit-stories-seen',
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
  const text = readFileSync(file, 'utf8');
  const searchableText = legacyTechnicalBrandSnippets.reduce(
    (current, snippet) => current.replaceAll(snippet, ''),
    text,
  );
  const rel = path.relative(distDir, file).replaceAll(path.sep, '/');
  for (const marker of forbidden) {
    if (searchableText.includes(marker)) offenders.push(`${rel}: ${marker}`);
  }
}

if (offenders.length) {
  console.error('Production bundle contains forbidden demo/legal/payment markers:');
  for (const offender of offenders) console.error(`- ${offender}`);
  process.exit(1);
}

console.log('Production content scan passed.');
