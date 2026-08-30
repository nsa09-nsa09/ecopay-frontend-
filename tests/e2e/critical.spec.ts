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

type MockRole = 'USER' | 'ADMIN' | 'ANON';

function sessionFor(role: MockRole) {
  return role === 'ADMIN' ? admin : user;
}

function legalDocument(type: 'terms' | 'privacy') {
  return {
    id: type === 'terms' ? 1 : 2,
    docType: type,
    version: type === 'terms' ? 'terms-2026-08' : 'privacy-2026-08',
    title_ru: type === 'terms' ? 'Условия EcoPay' : 'Политика конфиденциальности',
    title_kz: type === 'terms' ? 'EcoPay шарттары' : 'Құпиялылық саясаты',
    title_en: type === 'terms' ? 'EcoPay Terms' : 'Privacy Policy',
    body_ru: 'Тестовый юридический текст.',
    body_kz: 'Сынақ заң мәтіні.',
    body_en: 'Test legal copy.',
    published: true,
    publishedAt: '2026-08-01T00:00:00Z',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  };
}

function roomFixture(id: number, serviceAccessType: 'EMAIL' | 'PHONE' | 'BOTH' = 'EMAIL') {
  const telecom = serviceAccessType === 'PHONE';
  return {
    id,
    ownerUserId: 2,
    categoryId: 1,
    serviceId: telecom ? 2 : 1,
    tariffPlanId: 1,
    roomType: telecom ? 'TELECOM' : 'DIGITAL',
    serviceAccessType,
    verificationMode: 'MANUAL',
    status: 'OPEN',
    title: telecom ? `PHONE room ${id}` : 'Production room',
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
    providerName: telecom ? 'Telecom Provider' : 'Provider',
    tariffNameSnapshot: 'Plan',
    connectionType: telecom ? 'PHONE' : 'INVITE',
    operatorRestrictions: null,
    operatorTermsConfirmed: true,
    readyForVerificationAt: null,
    completedAt: null,
    blockedAt: null,
    blockReason: null,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  };
}

function roomSummary(id: number, serviceAccessType: 'EMAIL' | 'PHONE' | 'BOTH' = 'EMAIL') {
  const room = roomFixture(id, serviceAccessType);
  return {
    id: room.id,
    title: room.title,
    roomType: room.roomType,
    status: room.status,
    maxMembers: room.maxMembers,
    priceTotal: room.priceTotal,
    pricePerMember: room.pricePerMember,
    originalTariffPrice: room.originalTariffPrice,
    originalTariffCurrency: room.originalTariffCurrency,
    shareKzt: room.shareKzt,
    commissionKzt: room.commissionKzt,
    payableTotalKzt: room.payableTotalKzt,
    settlementCurrency: room.settlementCurrency,
    currency: room.currency,
    startDate: room.startDate,
    ownerUserId: room.ownerUserId,
    ownerDisplayName: 'Owner',
    ownerSlug: 'owner',
    ownerPublicId: 'owner-public',
    ownerReputation: 0,
    ownerReputationLevel: null,
    serviceId: room.serviceId,
    serviceName: room.providerName,
    serviceLogoUrl: null,
    serviceAccessType,
  };
}

async function mockApi(page: Page, role: MockRole = 'USER', language = 'en') {
  const controls = {
    registerPayloads: [] as unknown[],
    loginPayloads: [] as unknown[],
    joinPayloads: [] as Array<{ roomId: number; payload: Record<string, unknown> }>,
  };
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

  await page.addInitScript((lang) => {
    window.localStorage.setItem('ecopay-language', lang);
  }, language);

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api(?:\/v1)?/, '');
    const method = route.request().method();
    const body = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (path === '/auth/register' && method === 'POST') {
      const payload = route.request().postDataJSON();
      controls.registerPayloads.push(payload);
      return body({ user: { ...user, email: payload.email, emailVerified: false } });
    }
    if (path === '/auth/login' && method === 'POST') {
      const payload = route.request().postDataJSON();
      controls.loginPayloads.push(payload);
      if (payload.email === 'field-errors@example.test') {
        return body(
          { message: 'Validation failed', errors: { password: 'Password is required' } },
          400,
        );
      }
      return body({ accessToken: 'access-1', user: sessionFor(role) });
    }
    if (path === '/auth/verify-email-code' && method === 'POST') {
      return body({ accessToken: 'access-verified', user });
    }
    if (path === '/auth/resend-verification' && method === 'POST') return body({});
    if (path === '/auth/refresh' && method === 'POST') {
      if (role === 'ANON') return body({ message: 'Unauthorized' }, 401);
      return body({ accessToken: 'access-2', user: sessionFor(role) });
    }
    if (path === '/site/legal/terms') return body(legalDocument('terms'));
    if (path === '/site/legal/privacy') return body(legalDocument('privacy'));
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
      return body(sessionFor(role));
    }
    if (path.includes('/catalog/categories')) return body([]);
    if (path.includes('/catalog/services')) return body([]);
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
    if (path.includes('/service-reviews/me') && method === 'GET') return body(myServiceReview);
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
    if (path.includes('/service-reviews/me') && method === 'DELETE') return body({});
    if (path.includes('/payouts/balance')) {
      return body({
        heldAmount: 0,
        currency: 'KZT',
        heldPayoutCount: 0,
        nextReleaseAt: null,
        calculatedAt: '2026-08-15T00:00:00Z',
      });
    }
    if (path === '/rooms' && method === 'GET') {
      return body({
        items: [roomSummary(100), roomSummary(101, 'PHONE'), roomSummary(202, 'PHONE')],
        page: 0,
        size: 100,
        totalItems: 3,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
    }
    const roomMatch = path.match(/^\/rooms\/(\d+)$/);
    if (roomMatch && !path.includes('/members')) {
      const roomId = Number(roomMatch[1]);
      if ([100, 101, 202].includes(roomId)) {
        return body(roomFixture(roomId, roomId === 100 ? 'EMAIL' : 'PHONE'));
      }
    }
    const joinMatch = path.match(/^\/rooms\/(\d+)\/members$/);
    if (joinMatch && method === 'POST') {
      const roomId = Number(joinMatch[1]);
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      controls.joinPayloads.push({ roomId, payload });
      return body({
        id: String(700 + controls.joinPayloads.length),
        roomId,
        userId: 10,
        userDisplayName: 'Member',
        userEmail: user.email,
        status: 'APPLIED',
        requiresAdminReview: false,
        identifierType: payload.identifierType,
        identifierMasked: '+7 *** *** ** **',
        accessMethod: null,
        ownerAccessConfirmedAt: null,
        memberConfirmedAt: null,
        activatedAt: null,
      });
    }
    if (path.includes('/rooms/100/members/me')) {
      return body({
        id: '555',
        roomId: 100,
        userId: 10,
        userDisplayName: 'Member',
        userEmail: user.email,
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
      return body({
        id: 'success',
        amount: 5250,
        payableTotalKzt: 5250,
        settlementCurrency: 'KZT',
        status: 'SUCCESS',
        currency: 'KZT',
        requiresRedirect: false,
        paymentUrl: null,
      });
    }
    if (path.includes('/payments/intents/unknown/confirm-success')) {
      return body({
        id: 'unknown',
        amount: 5250,
        payableTotalKzt: 5250,
        settlementCurrency: 'KZT',
        status: 'UNKNOWN',
        currency: 'KZT',
        requiresRedirect: false,
        paymentUrl: null,
      });
    }
    if (path.includes('/payments/intents/unknown')) {
      return body({
        id: 'unknown',
        amount: 5250,
        payableTotalKzt: 5250,
        settlementCurrency: 'KZT',
        status: 'UNKNOWN',
        currency: 'KZT',
        requiresRedirect: false,
        paymentUrl: null,
      });
    }
    if (path.includes('/admin/finance/transactions')) {
      return body({
        items: [],
        page: 0,
        size: 20,
        totalItems: 0,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
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

  return controls;
}

async function seedSession(page: Page, role: MockRole = 'USER') {
  await page.addInitScript((seedUser) => {
    window.localStorage.setItem('ecopay.session', JSON.stringify({ user: seedUser }));
  }, sessionFor(role));
}

test('registration is email-only and opens email code confirmation', async ({ page }) => {
  const api = await mockApi(page, 'ANON');

  await page.goto('/register');
  await page.getByPlaceholder('e.g. Aidar').fill('New Member');
  await page.getByPlaceholder('your@email.com').fill('New.Member@Example.Test');
  await page.locator('input[type="password"]').first().fill('Secret123');
  await page.locator('input[type="password"]').last().fill('Secret123');
  await page.getByRole('checkbox').click();
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page.getByText('Confirm your email')).toBeVisible();
  expect(api.registerPayloads).toHaveLength(1);
  expect(api.registerPayloads[0]).toMatchObject({
    displayName: 'New Member',
    email: 'new.member@example.test',
    password: 'Secret123',
    termsAccepted: true,
  });
  expect(api.registerPayloads[0]).not.toHaveProperty('phone');
  await expect(page.getByPlaceholder('your@email.com')).toHaveCount(0);
  await expect(page.getByPlaceholder(/phone/i)).toHaveCount(0);
});

test('login submits email only and never offers phone auth', async ({ page }) => {
  const api = await mockApi(page);

  await page.goto('/login');
  await page.getByPlaceholder('your@email.com').fill('Member@Example.Test');
  await page.locator('input[type="password"]').fill('secret123');
  await expect(page.getByRole('main').getByText(/phone|номер телефона|телефон нөмірі/i)).toHaveCount(
    0,
  );
  await page.getByRole('main').getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/\/profile$/);
  expect(api.loginPayloads).toEqual([{ email: 'member@example.test', password: 'secret123' }]);
  expect(api.loginPayloads[0]).not.toHaveProperty('phone');
});

test('backend field errors are localized instead of shown raw', async ({ page }) => {
  await mockApi(page, 'USER', 'ru');

  await page.goto('/login');
  await page.getByPlaceholder('ваш@email.com').fill('field-errors@example.test');
  await page.locator('input[type="password"]').fill('Secret123');
  await page.getByRole('main').getByRole('button', { name: 'Войти' }).click();

  await expect(page.getByText('Заполните пароль.')).toBeVisible();
  await expect(page.getByText('Password is required')).toHaveCount(0);
});

test('PHONE room join uses PHONE payload and normalizes human phone input', async ({ page }) => {
  const api = await mockApi(page, 'USER', 'ru');
  await seedSession(page);

  await page.goto('/room/101');
  await page.getByRole('button', { name: 'Присоединиться' }).click();
  await expect(page.getByPlaceholder('+7 700 000 00 00')).toBeVisible();
  await expect(page.getByText(/SIM|eSIM|Account|аккаунт/i)).toHaveCount(0);
  await page.getByPlaceholder('+7 700 000 00 00').fill('+7 705 123 45 67');
  await page.getByRole('checkbox').click();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await page.getByRole('button', { name: 'Отправить заявку' }).click();

  await expect(page.getByText('Заявка отправлена')).toBeVisible();
  expect(api.joinPayloads).toHaveLength(1);
  expect(api.joinPayloads[0]).toEqual({
    roomId: 101,
    payload: {
      consentAccepted: true,
      identifierType: 'PHONE',
      identifierValue: '+77051234567',
    },
  });
});

test('same account can submit different phone numbers in different PHONE rooms', async ({ page }) => {
  const api = await mockApi(page);
  await seedSession(page);

  await page.goto('/room/101');
  await page.getByRole('button', { name: 'Join Room' }).click();
  await page.getByPlaceholder('+7 700 000 00 00').fill('+7 701 111 22 33');
  await page.getByRole('checkbox').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Submit request' }).click();
  await expect(page.getByText('Application Submitted')).toBeVisible();

  await page.goto('/room/202');
  await page.getByRole('button', { name: 'Join Room' }).click();
  await expect(page.getByPlaceholder('+7 700 000 00 00')).toHaveValue('');
  await page.getByPlaceholder('+7 700 000 00 00').fill('+7 702 444 55 66');
  await page.getByRole('checkbox').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Submit request' }).click();

  expect(api.joinPayloads).toHaveLength(2);
  expect(api.joinPayloads.map((entry) => entry.payload.identifierValue)).toEqual([
    '+77011112233',
    '+77024445566',
  ]);
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

test('/how-it-works ru avoids obsolete identifier and hold wording', async ({ page }) => {
  await mockApi(page, 'ANON', 'ru');

  await page.goto('/how-it-works');
  const content = await page.locator('#root').textContent();

  await expect(page.getByRole('heading', { name: 'Укажите номер телефона' })).toBeVisible();
  expect(content).not.toContain('ID аккаунта');
  expect(content).not.toContain('идентификатор');
  expect(content).not.toContain('hold');
});

test('/profile ru localizes role and status badges', async ({ page }) => {
  await mockApi(page, 'USER', 'ru');
  await seedSession(page);

  await page.goto('/profile');

  await expect(page.getByText('Пользователь')).toBeVisible();
  await expect(page.getByText('Активен')).toBeVisible();
  await expect(page.getByText('USER', { exact: true })).toHaveCount(0);
  await expect(page.getByText('ACTIVE', { exact: true })).toHaveCount(0);
});

test('room payment CTA shows KZT settlement breakdown without raw status leaks', async ({ page }) => {
  await mockApi(page, 'USER', 'ru');
  await seedSession(page);

  await page.goto('/rooms/member/100');
  await expect(page.getByText(/5\s*250/).first()).toBeVisible();
  await expect(page.getByText('USD 10')).toBeVisible();
  await expect(page.getByText('Стоимость вашего места')).toBeVisible();
  await expect(page.getByText('APPLIED')).toHaveCount(0);
});

test('payment return success and unknown states are distinct', async ({ page }) => {
  await mockApi(page);
  await seedSession(page);

  await page.goto('/payment/confirmation?intentId=success&roomId=100');
  await expect(page.getByText(/Payment Successful/)).toBeVisible();
  await page.goto('/payment/confirmation?intentId=unknown&roomId=100');
  await expect(page.getByText('Do not pay again.')).toBeVisible();
});

test('admin finance operations opens for admin', async ({ page }) => {
  await mockApi(page, 'ADMIN');
  await seedSession(page, 'ADMIN');

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
  await seedSession(page, 'ADMIN');

  await page.goto('/admin/service-reviews');
  await expect(page.getByText('Homepage reviews')).toBeVisible();
  await expect(page.getByText('Verified Member').first()).toBeVisible();
  await expect(page.getByText('Homepage #1')).toBeVisible();
  await expect(page.getByRole('button', { name: /edit/i })).toHaveCount(0);
  await expect(page.getByText('Draft Member')).toBeVisible();
  await expect(page.getByText('Unverified')).toBeVisible();
});
