import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { PROVIDER_ORIGIN, horizontalOverflow, installMockBackend } from '../support/mock-backend';

// Small, high-value suite that runs on every browser/device project of the
// release matrix (Chromium, Firefox, WebKit, mobile Chrome, iPhone, iPad and
// landscape variants). Detailed scenarios live in the Chromium-only suites.

const isTouch = (testInfo: TestInfo) => Boolean(testInfo.project.use.hasTouch);
// Below xl (1280px) the primary links live in the menu; below md the search is a sheet.
const usesMenu = (page: Page) => (page.viewportSize()?.width ?? 1280) < 1280;
const isNarrow = (page: Page) => (page.viewportSize()?.width ?? 1280) < 768;

/**
 * Advances the fake clock in small steps, yielding real time between steps so
 * network responses (which are not faked) can arrive and schedule the next
 * timer — a single long runFor can outrun in-flight requests on slower engines.
 */
async function advance(page: Page, ms: number, step = 2_000) {
  for (let elapsed = 0; elapsed < ms; elapsed += step) {
    await page.clock.runFor(step);
    await page.waitForTimeout(50);
  }
}

async function press(locator: Locator, testInfo: TestInfo) {
  if (isTouch(testInfo)) await locator.tap();
  else await locator.click();
}

test('home renders without horizontal overflow and navigation works', async ({
  page,
}, testInfo) => {
  await installMockBackend(page, { role: 'ANON' });
  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByRole('button', { name: /StreamPlus/ }).first()).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);

  if (usesMenu(page)) {
    await press(page.getByRole('button', { name: 'Open menu' }), testInfo);
    const menu = page.locator('#eco-mobile-menu');
    await expect(menu.getByRole('link', { name: 'News' })).toBeVisible();
    await press(page.getByRole('button', { name: 'Close menu' }), testInfo);
    await expect(menu).toHaveCount(0);
  } else {
    await expect(page.getByRole('navigation').getByRole('link', { name: 'News' })).toBeVisible();
  }
});

test('header search opens the picked service choice', async ({ page }, testInfo) => {
  await installMockBackend(page, { role: 'USER' });
  await page.goto('/');
  if (isNarrow(page)) {
    await press(page.getByRole('button', { name: 'Search plans…' }), testInfo);
    await page.getByRole('dialog').getByRole('searchbox').fill('Stream');
  } else {
    await page.getByRole('searchbox', { name: 'Search plans…' }).fill('Stream');
  }
  // Scope to the search UI: the catalog behind it has a card with the same name.
  const searchScope = isNarrow(page) ? page.getByRole('dialog') : page.getByRole('navigation');
  const hit = searchScope.getByRole('button', { name: /StreamPlus\s*Video/ });
  await expect(hit).toBeVisible();
  await press(hit, testInfo);
  await expect(page.getByText('I want a spot in a subscription')).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test('auth pages expose labelled fields', async ({ page }) => {
  await installMockBackend(page, { role: 'ANON' });
  for (const route of ['/login', '/register', '/forgot-password']) {
    await page.goto(route);
    await expect(page.getByRole('textbox').first()).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  }
  await page.goto('/login');
  await expect(page.getByLabel(/email/i).first()).toBeVisible();
});

test('member payment hands off to the provider exactly once', async ({ page }, testInfo) => {
  const state = await installMockBackend(page, { role: 'USER' });
  await page.goto('/rooms/member/100');
  const pay = page.getByRole('button', { name: /^Pay\s/ });
  await expect(pay).toBeEnabled();
  // A double activation must not create two payment attempts.
  if (isTouch(testInfo)) {
    await pay.tap();
    await pay.tap({ force: true, timeout: 1_000 }).catch(() => undefined);
  } else {
    await pay.dblclick();
  }
  await page.waitForURL(`${PROVIDER_ORIGIN}/**`);
  expect(state.createdIntents).toHaveLength(1);
  expect(state.intentCreatePayloads[0].idempotencyKey).toEqual(expect.any(String));
});

test('return page shows success only after backend confirmation', async ({ page }) => {
  const state = await installMockBackend(page, {
    role: 'USER',
    intentStatuses: { p1: ['SUCCESS'] },
  });
  await page.goto('/payment/confirmation?intentId=p1&roomId=100&pg_payment_id=777');
  await expect(page.getByRole('heading', { name: 'Payment Successful' })).toBeVisible();
  expect(state.confirmCalls).toEqual(['p1']);
  // Provider parameters are stripped from the address bar.
  await expect(page).not.toHaveURL(/pg_payment_id/);
});

test('slow reconciliation stays non-success, stops polling and allows refresh', async ({
  page,
}) => {
  const state = await installMockBackend(page, {
    role: 'USER',
    intentStatuses: { p2: ['PENDING'] },
  });
  await page.clock.install();
  await page.goto('/payment/failure?intentId=p2&roomId=100');
  await expect(
    page.getByText('We are checking the payment status. Do not pay again.'),
  ).toBeVisible();
  await advance(page, 60_000);
  const refresh = page.getByRole('button', { name: 'Refresh status' });
  await expect(refresh).toBeEnabled();
  const readsAfterPolling = state.intentReads.length;
  expect(readsAfterPolling).toBeGreaterThan(0);
  expect(readsAfterPolling).toBeLessThanOrEqual(6);
  // Polling has stopped: more time passes without new reads.
  await advance(page, 120_000);
  expect(state.intentReads.length).toBe(readsAfterPolling);
  await expect(page.getByRole('heading', { name: 'Payment Successful' })).toHaveCount(0);

  state.intentStatuses.p2 = ['SUCCESS'];
  await refresh.click();
  await expect(page.getByRole('heading', { name: 'Payment Successful' })).toBeVisible();
});

test('failed payment is reported without success copy', async ({ page }) => {
  await installMockBackend(page, { role: 'USER', intentStatuses: { p3: ['FAILED'] } });
  await page.goto('/payment/confirmation?intentId=p3&roomId=100');
  await expect(page.getByRole('heading', { name: 'Payment Failed' })).toBeVisible();
  await expect(page.getByText('Payment Successful')).toHaveCount(0);
});

test('payout card connection is confirmed by the backend, not by the redirect', async ({
  page,
}, testInfo) => {
  const state = await installMockBackend(page, {
    role: 'USER',
    bindingStatuses: ['PENDING', 'PENDING', 'SUCCESS'],
  });
  await page.goto('/payment/payout');
  await expect(page.getByText(/Provider card token/i)).toHaveCount(0);
  await press(page.getByRole('button', { name: 'Connect payout card' }), testInfo);
  await page.waitForURL(`${PROVIDER_ORIGIN}/card/4242`);
  expect(state.bindingStarts).toBe(1);

  await page.clock.install();
  await page.goto('/payment/card-connected?status=success');
  await expect(page.getByRole('heading', { name: 'Card Connected' })).toHaveCount(0);
  await advance(page, 30_000);
  await expect(page.getByRole('heading', { name: 'Card Connected' })).toBeVisible();
  expect(state.bindingConfirmCalls).toBeGreaterThanOrEqual(3);
});

test('admin dashboard and finance render for staff', async ({ page }) => {
  await installMockBackend(page, {
    role: 'ADMIN',
    dashboardKpis: {
      dau: 12,
      mau: 40,
      paymentSuccessRate30d: 92.5,
      freedomWebhookDeadLetterCount: 1,
    },
  });
  await page.goto('/admin/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Business' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Risk & operations' })).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  await page.goto('/admin/finance');
  await expect(page.getByRole('button', { name: 'PAYMENT REVIEW' })).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
});

test('dialogs close with Escape and return focus (keyboard)', async ({ page }, testInfo) => {
  test.skip(isTouch(testInfo), 'Keyboard-only interaction is covered on desktop projects.');
  await installMockBackend(page, { role: 'USER' });
  await page.goto('/');
  const card = page.getByRole('button', { name: /StreamPlus/ }).first();
  await card.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(card).toBeFocused();
});
