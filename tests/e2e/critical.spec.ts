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
  let myServiceReview = {
    id: 101,
    authorDisplayName: 'Member',
    authorPublicId: 'member',
    rating: 5,
    text: 'EcoPay room access worked exactly as expected.',
    featured: false,
    verifiedExperience: false,
    createdAt: '2026-08-15T00:00:00Z',
    updatedAt: '2026-08-15T00:00:00Z',
  };
  let adminReviews = [
    {
      id: 201,
      authorId: 20,
      authorPublicId: 'verified-member',
      authorDisplayName: 'Verified Member',
      authorEmail: 'verified@example.test',
      rating: 5,
      text: 'The room invitation arrived after payment and support stayed visible.',
      featured: true,
      verifiedExperience: true,
      homepagePosition: 1,
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z',
    },
    {
      id: 202,
      authorId: 21,
      authorPublicId: 'draft-member',
      authorDisplayName: 'Draft Member',
      authorEmail: 'draft@example.test',
      rating: 4,
      text: 'Saved draft review awaiting a verified EcoPay experience.',
      featured: false,
      verifiedExperience: false,
      homepagePosition: null,
      createdAt: '2026-08-13T00:00:00Z',
      updatedAt: '2026-08-13T00:00:00Z',
    },
  ];
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
    if (path.includes('/catalog/categories')) {
      return body([]);
    }
    if (path.includes('/catalog/services')) {
      return body([]);
    }
    if (path.includes('/public/home-stats')) {
      return body({
        totalUsers: 124,
        completedOrActiveMemberships: 31,
        averageVerifiedRating: 4.7,
        verifiedReviewCount: 18,
        activeRooms: 7,
      });
    }
    if (path.includes('/service-reviews/featured')) {
      return body([
        {
          id: 301,
          authorDisplayName: 'Aruzhan',
          authorPublicId: 'aruzhan',
          rating: 5,
          text: 'EcoPay matched me with a real room and the payment status was clear.',
          verifiedExperience: true,
          homepagePosition: 1,
          createdAt: '2026-08-15T00:00:00Z',
        },
      ]);
    }
    if (path.includes('/service-reviews/me') && method === 'GET') {
      return body(myServiceReview);
    }
    if (path.includes('/service-reviews/me') && method === 'PUT') {
      const payload = route.request().postDataJSON() as { rating: number; text: string };
      myServiceReview = {
        ...myServiceReview,
        rating: payload.rating,
        text: payload.text,
        updatedAt: '2026-08-16T00:00:00Z',
      };
      return body(myServiceReview);
    }
    if (path.includes('/service-reviews') && method === 'POST') {
      const payload = route.request().postDataJSON() as { rating: number; text: string };
      myServiceReview = {
        ...myServiceReview,
        rating: payload.rating,
        text: payload.text,
        updatedAt: '2026-08-16T00:00:00Z',
      };
      return body(myServiceReview);
    }
    if (path.includes('/service-reviews/me') && method === 'DELETE') {
      return body({});
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
    if (path.includes('/admin/service-reviews') && method === 'GET') {
      const featured = url.searchParams.get('featured');
      const filtered =
        featured === 'true'
          ? adminReviews.filter((review) => review.featured)
          : featured === 'false'
            ? adminReviews.filter((review) => !review.featured)
            : adminReviews;
      return body({
        items: filtered,
        page: Number(url.searchParams.get('page') ?? 0),
        size: Number(url.searchParams.get('size') ?? 20),
        totalItems: filtered.length,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
    }
    if (path.includes('/admin/service-reviews/') && path.includes('/featured')) {
      const id = Number(path.match(/service-reviews\/(\d+)/)?.[1]);
      const payload = route.request().postDataJSON() as {
        featured: boolean;
        homepagePosition: number | null;
      };
      adminReviews = adminReviews.map((review) =>
        review.id === id
          ? { ...review, featured: payload.featured, homepagePosition: payload.homepagePosition }
          : review,
      );
      return body(adminReviews.find((review) => review.id === id));
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

test('public static routes support direct navigation', async ({ page }) => {
  await mockApi(page, 'ANON');
  for (const path of ['/how-it-works', '/security', '/about'] as const) {
    const response = await page.goto(path);
    expect(response?.status() ?? 200).toBeLessThan(400);
    await expect(page.locator('#root')).not.toBeEmpty();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
  }

  const response = await page.goto('/sceurity');
  expect(response?.status() ?? 200).toBeLessThan(400);
  await expect(page.locator('#root')).not.toBeEmpty();
  await expect(page).toHaveURL(/\/security$/);
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

test('homepage uses backend reviews and real stats only', async ({ page }) => {
  await mockApi(page, 'ANON');
  await page.goto('/');
  await expect(page.getByText('124')).toBeVisible();
  await expect(page.getByText('4.7/5')).toBeVisible();
  await expect(page.getByText('Verified EcoPay reviews')).toBeVisible();
  await expect(page.getByText('Aruzhan')).toBeVisible();
  await expect(page.getByText('EcoPay matched me with a real room')).toBeVisible();
  await expect(page.getByText('5000+ happy users')).toHaveCount(0);
  await expect(page.getByText(/Google and Trustpilot/i)).toHaveCount(0);
});

test('admin reviews show homepage slots without user text editor', async ({ page }) => {
  await mockApi(page, 'ADMIN');
  await page.addInitScript(() =>
    localStorage.setItem('ecopay.session', JSON.stringify({ user: { id: 1, displayName: 'Admin', role: 'ADMIN' } })),
  );
  await page.goto('/admin/service-reviews');
  await expect(page.getByText('Homepage reviews')).toBeVisible();
  await expect(page.getByText('Verified Member').first()).toBeVisible();
  await expect(page.getByText('Homepage #1')).toBeVisible();
  await expect(page.getByRole('button', { name: /edit/i })).toHaveCount(0);
  await expect(page.getByText('Draft Member')).toBeVisible();
  await expect(page.getByText('Unverified')).toBeVisible();
});


