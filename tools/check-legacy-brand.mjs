import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const backendRoot = path.resolve(root, '..', '..', 'ecopay-backend');

const scanTargets = [
  path.join(root, 'src'),
  path.join(root, 'public'),
  path.join(root, 'index.html'),
  path.join(root, 'dist'),
  path.join(backendRoot, 'src', 'main', 'resources'),
].filter((target) => fs.existsSync(target));

const ignoredDirs = new Set(['node_modules', '.git', 'target', 'build']);
const textExtensions = new Set([
  '.css',
  '.csv',
  '.html',
  '.java',
  '.js',
  '.json',
  '.md',
  '.properties',
  '.sql',
  '.svg',
  '.ts',
  '.tsx',
  '.txt',
  '.xml',
  '.yml',
  '.yaml',
]);

const legacyBrandPattern =
  /support@ecosplit\.kz|ecosplit\.kz|@ecosplit|ecosplit\.banEvent|ecosplit\.session|ecosplit-stories-seen|Eco Split|eco-split|EcoSplit|ECOSPLIT|ecosplit/gi;

const allowlist = [
  {
    file: path.normalize('src/app/components/auth/auth-provider.tsx'),
    snippets: ['ecosplit.banEvent', 'ecosplit.session'],
  },
  {
    file: path.normalize('src/app/components/catalog/stories.tsx'),
    snippets: ['ecosplit-stories-seen'],
  },
  {
    file: path.normalize('src/app/lib/legacy-storage.ts'),
    snippets: [],
  },
];
const legacyStorageKeys = ['ecosplit.banEvent', 'ecosplit.session', 'ecosplit-stories-seen'];

function walk(target) {
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    const files = [];
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
      if (entry.isDirectory() && ignoredDirs.has(entry.name)) continue;
      files.push(...walk(path.join(target, entry.name)));
    }
    return files;
  }
  const ext = path.extname(target);
  return textExtensions.has(ext) || path.basename(target) === 'index.html' ? [target] : [];
}

function isAllowed(file, match) {
  if (legacyStorageKeys.includes(match)) return true;
  const normalized = path.normalize(path.relative(root, file));
  const rule = allowlist.find((item) => item.file === normalized);
  return Boolean(rule?.snippets.includes(match));
}

const failures = [];

for (const file of scanTargets.flatMap(walk)) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    const matches = line.match(legacyBrandPattern) ?? [];
    for (const match of matches) {
      if (!isAllowed(file, match)) {
        failures.push(`${path.relative(root, file)}:${index + 1}: ${match}`);
      }
    }
  });
}

if (failures.length > 0) {
  console.error('Legacy EcoSplit brand references found:');
  for (const failure of failures) {
    console.error(`  ${failure}`);
  }
  process.exit(1);
}

console.log('No disallowed legacy EcoSplit brand references found.');
