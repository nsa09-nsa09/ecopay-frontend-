import type { Page, Route } from '@playwright/test';

/**
 * Deterministic backend + payment-provider boundary for E2E tests.
 *
 * Every /api call is answered here; the FreedomPay hosted pages are replaced by
 * a tiny HTML stub on a fake origin, so no test ever reaches a real provider.
 * Scenario knobs live on the returned `state` object and can be changed while
 * a test runs (e.g. flip an intent from PENDING to SUCCESS to emulate the
 * provider callback arriving after the browser redirect).
 */

export const PROVIDER_ORIGIN = 'https://pay.freedompay.test';

export type Role = 'ANON' | 'USER' | 'ADMIN';

export interface MockState {
  role: Role;
  /** When false, /auth/refresh returns 401 (session expired). */
  refreshOk: boolean;
  membershipStatus: string;
  /** Current intent returned by /payments/members/:id/intent/current (null → 404). */
  currentIntent: Record<string, unknown> | null;
  /** Statuses returned by successive reads of an intent (last one repeats). */
  intentStatuses: Record<string, string[]>;
  createdIntents: Array<Record<string, unknown>>;
  intentCreatePayloads: Array<Record<string, unknown>>;
  confirmCalls: string[];
  intentReads: string[];
  payoutMethods: Array<Record<string, unknown>>;
  bindingStatuses: string[];
  bindingConfirmCalls: number;
  bindingStarts: number;
  analyticsPaths: string[];
  dashboardKpis: Record<string, unknown>;
  financeItems: Record<string, Array<Record<string, unknown>>>;
}

const now = '2026-09-01T10:00:00Z';

export const userFixture = {
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
export const adminFixture = {
  ...userFixture,
  id: 1,
  email: 'admin@example.test',
  displayName: 'Admin',
  role: 'ADMIN',
};

export function room(id = 100, overrides: Record<string, unknown> = {}) {
  return {
    id,
    ownerUserId: 2,
    ownerDisplayName: 'Owner',
    ownerPublicId: 'owner-public',
    categoryId: 1,
    serviceId: 1,
    tariffPlanId: 1,
    roomType: 'DIGITAL',
    serviceAccessType: 'EMAIL',
    verificationMode: 'RISK_BASED',
    status: 'OPEN',
    title: 'Family plan room',
    description: null,
    maxMembers: 4,
    existingMembersCount: 1,
    marketplaceCapacity: 3,
    filledSeats: 1,
    freeSeats: 2,
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
    startDate: '2026-12-01',
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
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function intent(id: string, status: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    idempotencyKey: `key-${id}`,
    amount: 5250,
    payableTotalKzt: 5250,
    settlementCurrency: 'KZT',
    currency: 'KZT',
    status,
    providerName: 'FREEDOMPAY',
    externalPaymentId: null,
    roomMemberId: 555,
    paymentUrl: status === 'PENDING' ? `${PROVIDER_ORIGIN}/pay/${id}` : null,
    requiresRedirect: status === 'PENDING',
    saveCardRequested: false,
    failureCode: null,
    failureMessage: null,
    expiresAt: null,
    compensationRequired: false,
    reviewRequired: false,
    reviewReason: null,
    ...overrides,
  };
}

const page0 = <T>(items: T[]) => ({
  items,
  page: 0,
  size: 20,
  totalItems: items.length,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
});

export async function installMockBackend(
  page: Page,
  init: Partial<MockState> & { language?: 'ru' | 'kz' | 'en'; seedSession?: boolean } = {},
) {
  const state: MockState = {
    role: 'USER',
    refreshOk: true,
    membershipStatus: 'APPLIED',
    currentIntent: null,
    intentStatuses: {},
    createdIntents: [],
    intentCreatePayloads: [],
    confirmCalls: [],
    intentReads: [],
    payoutMethods: [],
    bindingStatuses: ['PENDING'],
    bindingConfirmCalls: 0,
    bindingStarts: 0,
    analyticsPaths: [],
    dashboardKpis: {},
    financeItems: {},
    ...init,
  };
  const language = init.language ?? 'en';
  const seed = init.seedSession ?? state.role !== 'ANON';
  const sessionUser = () => (state.role === 'ADMIN' ? adminFixture : userFixture);

  await page.addInitScript(
    ({ lang, seedUser }) => {
      try {
        window.localStorage.setItem('ecopay-language', lang);
        if (seedUser)
          window.localStorage.setItem('ecopay.session', JSON.stringify({ user: seedUser }));
      } catch {
        /* storage may be blocked on purpose by a test */
      }
    },
    { lang: language, seedUser: seed ? sessionUser() : null },
  );

  // Live sockets are not part of these tests; refuse them deterministically.
  await page.routeWebSocket(/\/ws/, (ws) => ws.close());

  // Fake provider hosted pages.
  await page.route(`${PROVIDER_ORIGIN}/**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>Provider</title><h1>Mock FreedomPay page</h1>',
    }),
  );

  const nextIntentStatus = (id: string) => {
    const list = state.intentStatuses[id];
    if (!list || list.length === 0) return 'PENDING';
    return list.length > 1 ? (list.shift() as string) : list[0];
  };

  await page.route('**/api/**', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api(?:\/v1)?/, '');
    const method = request.method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    // --- auth ---
    if (path === '/auth/refresh') {
      if (state.role === 'ANON' || !state.refreshOk) return json({ message: 'Unauthorized' }, 401);
      return json({ accessToken: `access-${Date.now()}`, user: sessionUser() });
    }
    if (path === '/auth/login' && method === 'POST') {
      return json({ accessToken: 'access-login', user: sessionUser() });
    }
    if (path === '/auth/logout') return json({});
    if (path === '/users/me' && method === 'GET') return json(sessionUser());
    if (path === '/users/me/dashboard') {
      return json({
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
      });
    }
    if (path === '/analytics/visit' && method === 'POST') {
      const payload = request.postDataJSON() as { path: string };
      state.analyticsPaths.push(payload.path);
      return route.fulfill({ status: 204, body: '' });
    }

    // --- public content ---
    if (path === '/catalog/categories')
      return json([{ id: 1, name: 'Video', slug: 'video', description: null, iconUrl: null }]);
    if (path === '/catalog/services' || path.startsWith('/catalog/services?')) {
      return json([
        {
          id: 1,
          categoryId: 1,
          categoryName: 'Video',
          name: 'StreamPlus',
          slug: 'streamplus',
          providerType: 'DIGITAL',
          accessType: 'EMAIL',
          minPricePerMember: 2.5,
          currency: 'USD',
          tariffCount: 1,
          logoUrl: null,
        },
      ]);
    }
    if (path === '/catalog/services/1') {
      return json({
        id: 1,
        categoryId: 1,
        categoryName: 'Video',
        name: 'StreamPlus',
        slug: 'streamplus',
        providerType: 'DIGITAL',
        accessType: 'EMAIL',
        logoUrl: null,
      });
    }
    if (path === '/catalog/search') {
      return json([{ serviceId: 1, name: 'StreamPlus', categoryName: 'Video', logoUrl: null }]);
    }
    if (path === '/catalog/services/1/match') return json({ action: 'JOIN', roomId: 100 });
    if (path.startsWith('/catalog/services/') && path.endsWith('/tariffs')) return json([]);
    if (path === '/public/home-stats') return json({});
    if (path === '/service-reviews/featured') return json([]);
    if (path === '/stories' || path === '/news') return json(page0([]));
    if (path === '/site/room-settings') return json({ minimumRoomMembers: 3 });
    if (path === '/site/about') return json({});
    if (path.startsWith('/site/legal/')) return json({});
    if (path === '/fx/rates') return json({ base: 'KZT', updatedAt: now, rates: { USD: 475 } });

    // --- rooms & membership ---
    if (path === '/rooms/joined') return json([]);
    if (path === '/rooms/me') return json(page0([]));
    if (path === '/rooms' && method === 'GET') return json(page0([]));
    if (path === '/rooms/100/members/me/hold') return json({ message: 'Not found' }, 404);
    if (path === '/rooms/100/members/me') {
      return json({
        id: '555',
        roomId: 100,
        userId: 10,
        status: state.membershipStatus,
        requiresAdminReview: false,
        identifierType: null,
        identifierMasked: null,
        accessMethod: null,
        ownerAccessConfirmedAt: null,
        memberConfirmedAt: null,
        activatedAt: null,
      });
    }
    if (path === '/rooms/100') return json(room(100));
    if (/^\/rooms\/\d+\/chat/.test(path)) return json(page0([]));

    // --- payments ---
    if (path === '/payments/members/555/intent/current') {
      return state.currentIntent ? json(state.currentIntent) : json({ message: 'Not found' }, 404);
    }
    if (path === '/payments/members/555/intent' && method === 'POST') {
      const payload = request.postDataJSON() as Record<string, unknown>;
      state.intentCreatePayloads.push(payload);
      const id = String(9000 + state.createdIntents.length + 1);
      const created = intent(id, 'PENDING');
      state.createdIntents.push(created);
      state.currentIntent = created;
      return json(created);
    }
    const confirm = path.match(/^\/payments\/intents\/([\w-]+)\/confirm-success$/);
    if (confirm && method === 'POST') {
      state.confirmCalls.push(confirm[1]);
      return json(
        intent(confirm[1], nextIntentStatus(confirm[1]), {
          paymentUrl: null,
          requiresRedirect: false,
        }),
      );
    }
    const read = path.match(/^\/payments\/intents\/([\w-]+)$/);
    if (read && method === 'GET') {
      state.intentReads.push(read[1]);
      return json(
        intent(read[1], nextIntentStatus(read[1]), { paymentUrl: null, requiresRedirect: false }),
      );
    }
    if (path === '/payments/history') {
      return json(
        page0([
          {
            id: 1,
            kind: 'PAYMENT',
            direction: 'DEBIT',
            status: 'SUCCESS',
            amount: 5250,
            currency: 'KZT',
            createdAt: now,
            roomTitle: 'Family plan room',
            roomId: 100,
            paymentIntentId: '9001',
          },
          {
            id: 2,
            kind: 'REFUND',
            direction: 'CREDIT',
            status: 'PENDING_PROVIDER',
            amount: 5250,
            currency: 'KZT',
            createdAt: now,
            roomTitle: 'Family plan room',
            refundId: 77,
          },
        ]),
      );
    }
    if (path === '/refunds/me') {
      return json([
        {
          id: 77,
          paymentTransactionId: 1,
          disputeId: null,
          adminUserId: null,
          status: 'PENDING',
          amount: 5250,
          currency: 'KZT',
          reason: null,
          idempotencyKey: 'k',
          providerRefundId: null,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    // --- payouts ---
    if (path === '/payouts/balance') {
      return json({
        heldAmount: 4750,
        currency: 'KZT',
        heldPayoutCount: 1,
        nextReleaseAt: '2026-10-01T00:00:00Z',
        calculatedAt: now,
      });
    }
    if (path === '/payouts/me') {
      return json([
        {
          id: 31,
          amount: 4750,
          currency: 'KZT',
          status: 'PENDING',
          providerPayoutId: null,
          failureReason: null,
          roomId: 100,
          releaseAt: '2026-10-01T00:00:00Z',
          createdAt: now,
          processedAt: null,
        },
        {
          id: 32,
          amount: 4750,
          currency: 'KZT',
          status: 'PENDING_PROVIDER',
          providerPayoutId: 'po-ref-1',
          failureReason: null,
          roomId: 100,
          createdAt: now,
          processedAt: null,
        },
        {
          id: 33,
          amount: 4750,
          currency: 'KZT',
          status: 'FAILED',
          providerPayoutId: null,
          failureReason: 'PG_ERROR 9001 raw provider text',
          roomId: 100,
          createdAt: now,
          processedAt: now,
        },
      ]);
    }
    if (path === '/payouts/methods' && method === 'GET') return json(state.payoutMethods);
    if (path === '/payouts/methods/binding' && method === 'POST') {
      state.bindingStarts += 1;
      return json({
        bindingId: 4242,
        paymentUrl: `${PROVIDER_ORIGIN}/card/4242`,
        requiresRedirect: true,
        status: 'PENDING',
        failureMessage: null,
      });
    }
    if (path === '/payouts/methods/binding/4242/confirm' && method === 'POST') {
      state.bindingConfirmCalls += 1;
      const status =
        state.bindingStatuses.length > 1
          ? (state.bindingStatuses.shift() as string)
          : state.bindingStatuses[0];
      return json({
        status,
        method:
          status === 'SUCCESS'
            ? {
                id: 1,
                providerName: 'FREEDOMPAY',
                panMask: '4400 **** 1234',
                isDefault: true,
                status: 'ACTIVE',
                createdAt: now,
              }
            : null,
        message: status === 'FAILED' ? 'PG_ERROR 8104 raw provider text' : null,
      });
    }

    // --- notifications ---
    if (path === '/notifications') return json(page0([]));
    if (path === '/notifications/unread-count') return json({ count: 0 });

    // --- admin ---
    if (path === '/admin/dashboard/kpis') {
      return json({
        totalUsers: 120,
        activeUsers: 110,
        bannedUsers: 2,
        totalRooms: 40,
        openRooms: 10,
        activeRooms: 25,
        completedRooms: 3,
        blockedRooms: 2,
        totalRevenue: 1500000,
        platformRevenue: 150000,
        totalRefunds: 20000,
        openDisputes: 1,
        pendingModeration: 4,
        pendingPayouts: 6,
        avgRoomFillRate: 0.6,
        ...state.dashboardKpis,
      });
    }
    if (path === '/admin/dashboard/metrics') {
      return json({
        granularity: 'month',
        from: '2025-10-01',
        to: '2026-09-30',
        series: [],
        newUsersLast30Days: 12,
      });
    }
    if (path.startsWith('/admin/dashboard/')) return json([]);
    const finance = path.match(/^\/admin\/finance\/(transactions|refunds|payouts|webhooks)$/);
    if (finance) return json(page0(state.financeItems[finance[1]] ?? []));
    if (path === '/admin/moderation/queue') return json([]);
    if (path === '/staff/support-tickets/queue') return json(page0([]));
    if (path === '/admin/room-settings') return json({ minimumRoomMembers: 3 });

    // Unknown GETs that list things get an empty page; everything else {}.
    return json(method === 'GET' ? page0([]) : {});
  });

  return state;
}

/** Fails the test if the document is wider than the viewport (horizontal scroll). */
export async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.scrollingElement ?? document.documentElement;
    return Math.max(0, doc.scrollWidth - window.innerWidth);
  });
}
