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
      "path: 'how-it-works'",
      "path: 'security'",
      "path: 'about'",
      "path: 'sceurity'",
      'to="/security"',
    ],
    mustNotInclude: [
      "path: 'rooms/full'",
      "path: 'rooms/payment-failed'",
      "path: 'rooms/blocked'",
      "path: 'payment/room'",
      "path: 'payment/checkout'",
      "path: 'payment/pending'",
    ],
  },
  {
    file: 'src/app/components/auth/auth-provider.tsx',
    mustInclude: [
      'const SESSION_HINT_KEY',
      'refreshRequest()',
      'authorizedRequest',
      'verifyEmailCode',
      'login: (email: string, password: string)',
      'register: (',
    ],
    mustNotInclude: ['verifyPhoneCode'],
  },
  {
    file: 'src/app/lib/api.ts',
    mustInclude: [
      'email: email.trim()',
      "requestJson<AuthResponse>('/auth/register'",
      "requestJson<AuthResponse>('/auth/login'",
      "requestJson<User>('/auth/phone/request-code'",
    ],
    mustNotInclude: [
      'isPhoneIdentifier',
      '/auth/verify-phone-code',
      '/auth/resend-phone-code',
    ],
  },
  {
    file: 'src/app/components/auth/register.tsx',
    mustInclude: ['VerifyCodeStep', 'useEmailField', 'serverEmailErrorCode'],
    mustNotInclude: ['VerifyPhoneStep', 'normalizePhone', 'phoneVerified'],
  },
  {
    file: 'src/app/components/auth/login.tsx',
    mustInclude: ['VerifyCodeStep', 'useEmailField', 'verifyEmailCode'],
    mustNotInclude: ['VerifyPhoneStep', 'PHONE_NOT_VERIFIED', 'normalizePhone'],
  },
  {
    file: 'src/app/lib/contact-identifier.ts',
    mustInclude: [
      "IdentifierType = 'EMAIL' | 'PHONE'",
      "EMAIL: ['EMAIL']",
      "PHONE: ['PHONE']",
      'normalizePhone',
    ],
    mustNotInclude: ["'SIM'", "'ESIM'", "'ACCOUNT'"],
  },
  {
    file: 'src/app/components/i18n-provider.tsx',
    mustInclude: [
      'function localizedOrFallback',
      "return ['kz', 'ru', 'en']",
    ],
  },
  {
    file: 'src/app/components/payments/payment-return.tsx',
    mustInclude: [
      'confirmPaymentSuccessRequest',
      'getPaymentIntentRequest',
      'Funds are held for the configured payout hold period',
      'Do not pay again',
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
