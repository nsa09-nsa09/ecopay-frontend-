import { expect, test, type Page } from '@playwright/test';

const user = {
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

const admin = { ...user, id: 1, email: 'admin@example.test', displayName: 'Admin', role: 'ADMIN' };

async function mockApi(page: Page, role: 'USER' | 'ADMIN' | 'ANON' = 'USER') {
  await page.addInitScript(() => {
    window.localStorage.setItem('ecopay-language', 'en');
  });
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace('/api/v1', '');
    const method = route.request().method();
    const body = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (path.includes('/auth/login') && method === 'POST') {
      return body({ accessToken: 'access-1', user: role === 'ADMIN' ? admin : user });
    }
    if (path.includes('/auth/refresh') && method === 'POST') {
      if (role === 'ANON') return body({ message: 'Unauthorized' }, 401);
      return body({ accessToken: 'access-2', user: role === 'ADMIN' ? admin : user });
    }
    if (path.includes('/users/me/dashboard')) {
      return body({
        joinedRoomsActive: 0,
        joinedRoomsCompleted: 0,
        totalRoomsJoined: 0,
        monthlySpendKzt: 0,
        totalSpentKzt: 0,
        totalSavedKzt: 0,
        nextPaymentDate: null,
        nextPaymentAmountKzt: null,
        reputationScore: 0,
        reviewsReceived: 0,
        disputesAsMember: 0,
        recentEvents: [],
      });
    }
    if (path.includes('/users/me')) {
      if (role === 'ANON') return body({ message: 'Unauthorized' }, 401);
      return body(role === 'ADMIN' ? admin : user);
    }
    if (path.includes('/payouts/balance')) {
      return body({ heldAmount: 0, currency: 'KZT', heldPayoutCount: 0, nextReleaseAt: null, calculatedAt: '2026-08-15T00:00:00Z' });
    }
    if (path.includes('/rooms/100') && !path.includes('/members')) {
      return body({
        id: 100,
        ownerUserId: 2,
        categoryId: 1,
        serviceId: 1,
        tariffPlanId: 1,
        roomType: 'DIGITAL',
        verificationMode: 'MANUAL',
        status: url.searchParams.get('blocked') ? 'BLOCKED' : 'OPEN',
        title: 'Production room',
        description: null,
        maxMembers: 4,
        priceTotal: 10,
        pricePerMember: 2.5,
        originalTariffPrice: 10,
        originalTariffCurrency: 'USD',
        shareKzt: 4750,
        commissionKzt: 500,
        payableTotalKzt: 5250,
        settlementCurrency: 'KZT',
        currency: 'USD',
        periodType: 'MONTH',
        startDate: '2026-08-01',
        cancellationPolicy: null,
        providerName: 'Provider',
        tariffNameSnapshot: 'Plan',
        connectionType: 'INVITE',
        operatorRestrictions: null,
        operatorTermsConfirmed: true,
        readyForVerificationAt: null,
        completedAt: null,
        blockedAt: null,
        blockReason: null,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      });
    }
    if (path.includes('/rooms/100/members/me')) {
      return body({
        id: '555',
        roomId: 100,
        userId: 10,
        status: 'APPLIED',
        requiresAdminReview: false,
        identifierType: null,
        identifierMasked: null,
        accessMethod: null,
        ownerAccessConfirmedAt: null,
        memberConfirmedAt: null,
        activatedAt: null,
      });
    }
    if (path.includes('/payments/intents/success/confirm-success')) {
      return body({ id: 'success', amount: 5250, payableTotalKzt: 5250, settlementCurrency: 'KZT', status: 'SUCCESS', currency: 'KZT', requiresRedirect: false, paymentUrl: null });
    }
    if (path.includes('/payments/intents/unknown/confirm-success')) {
      return body({ id: 'unknown', amount: 5250, payableTotalKzt: 5250, settlementCurrency: 'KZT', status: 'UNKNOWN', currency: 'KZT', requiresRedirect: false, paymentUrl: null });
    }
    if (path.includes('/payments/intents/unknown')) {
      return body({ id: 'unknown', amount: 5250, payableTotalKzt: 5250, settlementCurrency: 'KZT', status: 'UNKNOWN', currency: 'KZT', requiresRedirect: false, paymentUrl: null });
    }
    if (path.includes('/admin/finance/transactions')) {
      return body({ items: [], page: 0, size: 20, totalItems: 0, totalPages: 1, hasNext: false, hasPrevious: false });
    }
    return body({});
  });
}

test('login success and session restore use cookie refresh', async ({ page }) => {
  await mockApi(page);
  await page.goto('/login');
  await page.getByPlaceholder(/mail|700|С‚РµР»РµС„РѕРЅ/i).fill('member@example.test');
  await page.locator('input[type="password"]').fill('secret123');
  await page.getByRole('main').getByRole('button', { name: /sign in|РІРѕР№С‚Рё/i }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await page.reload();
  await expect(page.getByText('member@example.test').first()).toBeVisible();
});

test('unauthenticated protected route redirects toward login', async ({ page }) => {
  await mockApi(page, 'ANON');
  await page.goto('/admin/finance');
  await expect(page).toHaveURL(/admin-login|login/);
});

test('room payment CTA shows KZT settlement breakdown', async ({ page }) => {
  await mockApi(page);
  await page.addInitScript(() =>
    localStorage.setItem('ecopay.session', JSON.stringify({ user: { id: 10, displayName: 'Member', role: 'USER' } })),
  );
  await page.goto('/rooms/member/100');
  await expect(page.getByText(/5\s*250/).first()).toBeVisible();
  await expect(page.getByText('USD 10')).toBeVisible();
});

test('payment return success and unknown states are distinct', async ({ page }) => {
  await mockApi(page);
  await page.addInitScript(() =>
    localStorage.setItem('ecopay.session', JSON.stringify({ user: { id: 10, displayName: 'Member', role: 'USER' } })),
  );
  await page.goto('/payment/confirmation?intentId=success&roomId=100');
  await expect(page.getByText(/Payment Successful|РџР»Р°С‚С‘Р¶ СѓСЃРїРµС€РµРЅ/)).toBeVisible();
  await page.goto('/payment/confirmation?intentId=unknown&roomId=100');
  await expect(page.getByText('Do not pay again.')).toBeVisible();
});

test('admin finance operations opens for admin', async ({ page }) => {
  await mockApi(page, 'ADMIN');
  await page.addInitScript(() =>
    localStorage.setItem('ecopay.session', JSON.stringify({ user: { id: 1, displayName: 'Admin', role: 'ADMIN' } })),
  );
  await page.goto('/admin/finance');
  await expect(page.getByRole('button', { name: 'PAYMENT REVIEW' })).toBeVisible();
});


