import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/app/routes.tsx',
    mustInclude: [
      "path: 'login'",
      "path: 'register'",
      "path: 'payment/confirmation'",
      "path: 'payment/failure'",
      "path: 'payment/payout'",
      "path: 'payments/history'",
    ],
  },
  {
    file: 'src/app/components/auth/auth-provider.tsx',
    mustInclude: [
      'const SESSION_HINT_KEY',
      'refreshRequest()',
      'authorizedRequest',
      'verifyPhoneCode',
    ],
  },
  {
    file: 'src/app/components/payments/payment-return.tsx',
    mustInclude: [
      'confirmPaymentSuccessRequest',
      'getPaymentIntentRequest',
      'Funds are held for the configured payout hold period',
    ],
    mustNotInclude: ['held in escrow', 'until the owner grants access and you confirm it'],
  },
];

let failed = false;

for (const check of checks) {
  const content = readFileSync(check.file, 'utf8');
  for (const needle of check.mustInclude ?? []) {
    if (!content.includes(needle)) {
      console.error(`[smoke] ${check.file} is missing: ${needle}`);
      failed = true;
    }
  }
  for (const needle of check.mustNotInclude ?? []) {
    if (content.includes(needle)) {
      console.error(`[smoke] ${check.file} still contains forbidden copy: ${needle}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log('[smoke] launch-critical routing/auth/payment-return checks passed');
