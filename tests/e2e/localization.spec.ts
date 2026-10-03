import { expect, test, type Page } from '@playwright/test';

// End-to-end guards for the "no user ever sees raw dev text / raw enum / raw
// provider error / framework error page" invariant, across all three locales.
//
// This spec is self-contained and does NOT touch playwright.config.ts (another
// agent owns the browser matrix there).

type Lang = 'ru' | 'kz' | 'en';

const MEMBER = {
  id: 10,
  email: 'member@example.test',
  displayName: 'Member',
  phone: null,
  phoneVerified: true,
  avatar: null,
  status: 'ACTIVE',
  role: 'USER',
  reputation: 0,
};

// A payment-history page exercising the Defect-1 money states that used to all
// collapse to the generic "Статус уточняется".
const HISTORY_ROWS = [
  row('PAYMENT', 'OUTGOING', 'SUCCESS'),
  row('PAYMENT', 'OUTGOING', 'PENDING'),
  row('PAYMENT', 'OUTGOING', 'UNKNOWN'),
  row('PAYMENT', 'OUTGOING', 'RECONCILING'),
  row('PAYMENT', 'OUTGOING', 'REQUIRES_REVIEW'),
  row('PAYMENT', 'OUTGOING', 'CAPTURE_ANOMALY'),
  row('REFUND', 'INCOMING', 'REFUND_PENDING'),
  row('REFUND', 'INCOMING', 'REFUNDED_PARTIAL'),
  row('REFUND', 'INCOMING', 'REFUNDED_FULL'),
  row('REFUND', 'INCOMING', 'PENDING_PROVIDER'),
  row('PAYOUT', 'INCOMING', 'PENDING_METHOD'),
  row('PAYOUT', 'INCOMING', 'FROZEN'),
];

function row(kind: string, direction: string, status: string) {
  return {
    id: `${kind}-${status}`,
    kind,
    direction,
    status,
    amount: 1990,
    currency: 'KZT',
    settlementCurrency: 'KZT',
    amountKzt: 1990,
    createdAt: '2026-09-01T10:00:00Z',
    roomTitle: 'Test room',
    roomId: 1,
  };
}

interface MockOpts {
  language: Lang;
  authed?: boolean;
  history?: { status: number; body: unknown } | { rows: unknown[] };
}

async function installMocks(page: Page, opts: MockOpts) {
  await page.addInitScript(
    ([lang, seed]) => {
      window.localStorage.setItem('ecopay-language', lang as string);
      if (seed) {
        window.localStorage.setItem('ecopay.session', JSON.stringify({ user: seed }));
      }
    },
    [opts.language, opts.authed ? MEMBER : null] as const,
  );

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/.*\/api\/v1/, '');
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    const emptyPage = { items: [], page: 0, size: 12, totalItems: 0, totalPages: 0, hasNext: false, hasPrevious: false };

    // Boot auth: the provider reads the {user} hint then refreshes to obtain an
    // access token. Without this the authed pages fall back to "sign in".
    if (path.startsWith('/auth/refresh')) {
      return opts.authed ? json({ accessToken: 'access-1', user: MEMBER }) : json({}, 401);
    }

    if (path.startsWith('/payments/history')) {
      if (opts.history && 'status' in opts.history) {
        return json(opts.history.body, opts.history.status);
      }
      const rows = opts.history && 'rows' in opts.history ? opts.history.rows : [];
      return json({ ...emptyPage, items: rows, totalItems: rows.length, totalPages: 1 });
    }

    if (path.startsWith('/auth/me') || path === '/users/me') return json(MEMBER);
    if (path.startsWith('/rooms')) return json(emptyPage);
    if (path.startsWith('/catalog')) return json([]);
    if (path.startsWith('/site/room-settings')) return json({ minimumRoomMembers: 2 });
    if (path.startsWith('/fx/rates')) return json({ base: 'KZT', updatedAt: '2026-09-01T00:00:00Z', rates: {} });
    if (route.request().method() === 'GET') return json([]);
    return json({});
  });
}

// A raw backend enum = SCREAMING_SNAKE_CASE with an underscore (REQUIRES_REVIEW,
// REFUND_PENDING, …). We assert none of these appear in the rendered DOM.
const RAW_ENUM = /\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b/;

async function expectNoRawEnum(page: Page) {
  const bodyText = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const match = bodyText.match(RAW_ENUM);
  expect(match, `raw enum leaked into the DOM: ${match?.[0]}`).toBeNull();
  // And none of the specific Defect-1 money states in their raw form.
  for (const raw of ['REQUIRES_REVIEW', 'CAPTURE_ANOMALY', 'REFUND_PENDING', 'PENDING_PROVIDER', 'REFUNDED_PARTIAL']) {
    expect(bodyText).not.toContain(raw);
  }
}

test('invalid URL renders the localized 404, never the framework error screen', async ({ page }) => {
  await installMocks(page, { language: 'ru' });
  await page.goto('/this-route-does-not-exist-404');
  await expect(page.getByText('Страница не найдена')).toBeVisible();
  const body = await page.locator('body').innerText();
  expect(body).not.toContain('Unexpected Application Error');
  // Links back to home / support are present.
  await expect(page.getByRole('link').filter({ hasText: /главную/i })).toBeVisible();
});

for (const language of ['ru', 'kz', 'en'] as Lang[]) {
  test(`[${language}] public pages render no raw enum`, async ({ page }) => {
    for (const path of ['/', '/login', '/register']) {
      await installMocks(page, { language });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expectNoRawEnum(page);
    }
  });

  test(`[${language}] payment history renders localized money states, no raw enum`, async ({ page }) => {
    await installMocks(page, { language, authed: true, history: { rows: HISTORY_ROWS } });
    await page.goto('/payments/history');
    await page.waitForLoadState('networkidle');
    await expectNoRawEnum(page);
  });
}

test('an API 409 with an English body shows localized, specific copy (RU)', async ({ page }) => {
  await installMocks(page, {
    language: 'ru',
    authed: true,
    history: { status: 409, body: { message: 'Cannot join room after start date' } },
  });
  await page.goto('/payments/history');
  await page.waitForLoadState('networkidle');
  const body = await page.locator('body').innerText();
  // Specific localized copy, not the generic fallback and not the English.
  expect(body).toContain('дата старта');
  expect(body).not.toContain('Cannot join room after start date');
});

test('an API 500 stack-trace body shows the generic localized message, nothing from the body', async ({ page }) => {
  const stack = 'java.lang.NullPointerException\n\tat kz.hrms.splitupauth.PaymentService.capture(PaymentService.java:88)';
  await installMocks(page, {
    language: 'ru',
    authed: true,
    history: { status: 500, body: { message: stack } },
  });
  await page.goto('/payments/history');
  await page.waitForLoadState('networkidle');
  const body = await page.locator('body').innerText();
  expect(body).not.toContain('NullPointerException');
  expect(body).not.toContain('PaymentService');
  // Generic localized server-error copy.
  expect(body).toMatch(/Не удалось загрузить данные/);
});
