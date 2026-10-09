import { expect, test } from '@playwright/test';
import { installMockBackend, intent } from './support/mock-backend';

// Detailed payment / payout UX scenarios (Chromium). The provider boundary is
// mocked; success is only ever shown for a backend SUCCESS.

test('redirect before callback: pending, then success once the backend confirms', async ({
  page,
}) => {
  await installMockBackend(page, { intentStatuses: { r1: ['PENDING', 'PENDING', 'SUCCESS'] } });
  await page.clock.install();
  await page.goto('/payment/confirmation?intentId=r1&roomId=100');
  await expect(
    page.getByText('We are checking the payment status. Do not pay again.'),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Payment Successful' })).toHaveCount(0);
  for (let i = 0; i < 10; i += 1) {
    await page.clock.runFor(1_000);
    await page.waitForTimeout(50);
  }
  await expect(page.getByRole('heading', { name: 'Payment Successful' })).toBeVisible();
});

test('callback before redirect: first reconciliation already succeeds', async ({ page }) => {
  const state = await installMockBackend(page, { intentStatuses: { r2: ['SUCCESS'] } });
  await page.goto('/payment/confirmation?intentId=r2&roomId=100');
  await expect(page.getByRole('heading', { name: 'Payment Successful' })).toBeVisible();
  expect(state.intentReads).toHaveLength(0);
});

test('return after a provider POST (nginx 303→GET) reconciles from the saved context', async ({
  page,
}) => {
  // FreedomPay may send the customer back with a POST; nginx converts it to a
  // 303 GET of the same path with the query preserved. This exercises the
  // frontend side: a saved pending context plus the preserved ?intentId lands
  // the page on the real status instead of an error.
  const state = await installMockBackend(page, { intentStatuses: { p1: ['SUCCESS'] } });
  await page.addInitScript(() => {
    const ctx = JSON.stringify({
      intentId: 'p1',
      roomId: '100',
      roomMemberId: '555',
      savedAt: Date.now(),
    });
    try {
      window.localStorage.setItem('ecopay.paymentReturn.p1', ctx);
      window.localStorage.setItem('ecopay.pendingPayment', ctx);
    } catch {
      /* storage may be blocked by a test */
    }
  });
  await page.goto('/payment/confirmation?intentId=p1&roomId=100');
  await expect(page.getByRole('heading', { name: 'Payment Successful' })).toBeVisible();
  expect(state.confirmCalls).toContain('p1');
});

for (const [status, heading, extra] of [
  ['UNKNOWN', 'Payment Processing', 'Do not pay again.'],
  ['RECONCILING', 'Payment Processing', 'Do not pay again.'],
  ['CAPTURE_ANOMALY', 'Payment Under Review', 'Do not pay again.'],
  ['REQUIRES_REVIEW', 'Payment Under Review', 'Do not pay again.'],
  ['REFUND_REQUIRED', 'Refund Started', 'Do not pay again.'],
  ['REFUND_PENDING', 'Refund Started', 'Do not pay again.'],
  ['REFUNDED', 'Payment Refunded', 'refund status is visible in payment history'],
  ['EXPIRED', 'Payment Failed', 'did not complete'],
] as const) {
  test(`return page maps ${status} to a safe state`, async ({ page }) => {
    await installMockBackend(page, { intentStatuses: { s1: [status] } });
    await page.clock.install();
    await page.goto('/payment/confirmation?intentId=s1&roomId=100');
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await expect(page.getByText(extra).first()).toBeVisible();
    await expect(page.getByText('Payment Successful')).toHaveCount(0);
  });
}

test('expired session on return asks to sign in and keeps the payment context', async ({
  page,
}) => {
  await installMockBackend(page, { refreshOk: false });
  await page.goto('/payment/confirmation?intentId=r3&roomId=100&pg_sig=secret');
  await expect(
    page.getByRole('heading', { name: 'Sign in to see your payment status' }),
  ).toBeVisible();
  const href = await page.getByRole('link', { name: 'Sign in', exact: true }).getAttribute('href');
  expect(decodeURIComponent(href ?? '')).toContain('/payment/confirmation?intentId=r3&roomId=100');
  expect(href).not.toContain('pg_sig');
});

test('direct opening of the return URL without context is explained', async ({ page }) => {
  const state = await installMockBackend(page);
  await page.goto('/payment/confirmation');
  await expect(page.getByRole('heading', { name: 'No payment to show' })).toBeVisible();
  expect(state.confirmCalls).toHaveLength(0);
});

test('corrupted stored payment context is ignored safely', async ({ page }) => {
  await installMockBackend(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('ecopay.pendingPayment', '{not json');
    window.localStorage.setItem('ecopay.paymentAttempt.555', '"oops"');
  });
  await page.goto('/payment/confirmation');
  await expect(page.getByRole('heading', { name: 'No payment to show' })).toBeVisible();
  await page.goto('/rooms/member/100');
  await expect(page.getByRole('button', { name: /^Pay\s/ })).toBeEnabled();
});

test('denied storage (private mode) does not crash payment pages', async ({ page }) => {
  await installMockBackend(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('denied', 'SecurityError');
      },
    });
  });
  await page.goto('/payment/confirmation?intentId=r4&roomId=100');
  // Without storage neither the session hint nor the saved language can be
  // read: the page falls back to Russian and asks to sign in (no crash).
  await expect(
    page.getByRole('heading', { name: 'Войдите, чтобы увидеть статус платежа' }),
  ).toBeVisible();
  await expect(page.getByText('Что-то пошло не так')).toHaveCount(0);
});

test('an open ambiguous attempt blocks a second payment', async ({ page }) => {
  const state = await installMockBackend(page, {
    currentIntent: intent('7001', 'RECONCILING', { paymentUrl: null, requiresRedirect: false }),
    intentStatuses: { '7001': ['RECONCILING'] },
  });
  await page.goto('/rooms/member/100');
  await expect(
    page.getByText('We are checking the payment status. Do not pay again.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /^Pay\s/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Refresh status' }).click();
  expect(state.confirmCalls).toEqual(['7001']);
  expect(state.createdIntents).toHaveLength(0);
});

test('a failed previous attempt allows a fresh payment with a new idempotency key', async ({
  page,
}) => {
  const state = await installMockBackend(page, {
    currentIntent: intent('7002', 'FAILED', { paymentUrl: null, requiresRedirect: false }),
  });
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'ecopay.paymentAttempt.555',
      JSON.stringify({ idempotencyKey: 'old-key', intentId: '7002' }),
    );
  });
  await page.goto('/rooms/member/100');
  await page.getByRole('button', { name: /^Pay\s/ }).click();
  await page.waitForURL(/pay\.freedompay\.test/);
  expect(state.intentCreatePayloads).toHaveLength(1);
  expect(state.intentCreatePayloads[0].idempotencyKey).not.toBe('old-key');
});

test('an expired attempt (no open intent) starts a fresh payment with a new key', async ({
  page,
}) => {
  // /current returns 404 (no open intent) because the previous attempt expired
  // or failed. A stale key is still in storage; reusing it would replay the old
  // terminal intent. The page must mint a new key and redirect to the provider.
  const state = await installMockBackend(page);
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'ecopay.paymentAttempt.555',
      JSON.stringify({ idempotencyKey: 'stale-key', intentId: '6001' }),
    );
  });
  await page.goto('/rooms/member/100');
  await page.getByRole('button', { name: /^Pay\s/ }).click();
  await page.waitForURL(/pay\.freedompay\.test/);
  expect(state.intentCreatePayloads).toHaveLength(1);
  expect(state.intentCreatePayloads[0].idempotencyKey).not.toBe('stale-key');
});

test('active membership with an open renewal starts a renewal payment and redirects', async ({
  page,
}) => {
  const state = await installMockBackend(page, {
    membershipStatus: 'ACTIVE',
    membershipBilling: {
      nextBillingAt: '2026-10-01T00:00:00Z',
      renewalOpen: true,
      renewalAmountKzt: 5250,
      renewalShareKzt: 4750,
      renewalCommissionKzt: 500,
      overdue: false,
    },
  });
  await page.goto('/rooms/member/100');
  const renew = page.getByRole('button', { name: 'Pay for the next period' });
  await expect(renew).toBeVisible();
  await renew.click();
  await page.waitForURL(/pay\.freedompay\.test/);
  expect(state.renewalIntentPayloads).toHaveLength(1);
  expect(typeof state.renewalIntentPayloads[0].idempotencyKey).toBe('string');
});

test('active membership without a billing block shows no renewal UI', async ({ page }) => {
  await installMockBackend(page, { membershipStatus: 'ACTIVE' });
  await page.goto('/rooms/member/100');
  await expect(page.getByText('Family plan room').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pay for the next period' })).toHaveCount(0);
});

test('payment history shows payments and refund states', async ({ page }) => {
  await installMockBackend(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/payments/history');
  await expect(page.getByText('Family plan room').first()).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
  ).toBeLessThanOrEqual(1);
});

test('owner payouts show provider-neutral statuses and no raw provider errors', async ({
  page,
}) => {
  await installMockBackend(page, {
    payoutMethods: [
      {
        id: 5,
        providerName: 'FREEDOMPAY',
        panMask: '4400 **** 0001',
        isDefault: true,
        status: 'REQUIRES_REBIND',
        requiresRebind: true,
        createdAt: '2026-09-01T00:00:00Z',
      },
    ],
  });
  await page.goto('/payment/payout');
  await expect(page.getByText('Sent to the bank')).toBeVisible();
  await expect(page.getByText(/PG_ERROR/)).toHaveCount(0);
  await expect(page.getByText(/did not go through/).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reconnect card' })).toBeVisible();
  await expect(page.getByText('Reconnect required')).toBeVisible();
});

test('failed payout card binding shows a safe message and a retry', async ({ page }) => {
  await installMockBackend(page, { bindingStatuses: ['FAILED'] });
  await page.goto('/payment/card-connected?binding=4242&status=failure');
  await expect(page.getByRole('heading', { name: 'Card Not Connected' })).toBeVisible();
  await expect(page.getByText(/PG_ERROR/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Connect card again' })).toBeVisible();
});

test('analytics sends one masked path per page without query strings', async ({ page }) => {
  const state = await installMockBackend(page, { role: 'ANON' });
  await page.goto('/reset-password/confirm?token=super-secret-token');
  await page.waitForTimeout(1800);
  await page.goto('/u/some-public-id?x=1');
  await page.waitForTimeout(1800);
  expect(state.analyticsPaths).toEqual(['/reset-password/confirm', '/u/:id']);
  expect(state.analyticsPaths.join(' ')).not.toContain('secret');
});

test('admin dashboard hides KPIs the backend does not send and shows null as a dash', async ({
  page,
}) => {
  await installMockBackend(page, {
    role: 'ADMIN',
    dashboardKpis: { successfulPayments30d: null, payoutDueCount: 3 },
  });
  await page.goto('/admin/dashboard');
  const business = page.getByRole('region', { name: 'Business' });
  // Value and label are siblings inside the card body.
  const card = business.locator('div.flex-col.gap-1', { hasText: 'Successful payments (30d)' });
  await expect(card).toBeVisible();
  await expect(card.getByText('—', { exact: true })).toBeVisible();
  // Fields absent from the response have no card at all (never a fake 0).
  await expect(page.getByText('DAU (daily active)')).toHaveCount(0);
  await expect(page.getByText('Webhook dead letters')).toHaveCount(0);
  await expect(page.getByText('Payouts due')).toBeVisible();
});

test('admin dashboard hides successful payments when the field is absent', async ({ page }) => {
  await installMockBackend(page, { role: 'ADMIN' });
  await page.goto('/admin/dashboard');
  await expect(page.getByRole('heading', { name: 'Business' })).toBeVisible();
  await expect(page.getByText('Successful payments (30d)')).toHaveCount(0);
});
