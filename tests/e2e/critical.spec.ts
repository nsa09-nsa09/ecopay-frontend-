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

function roomFixture(
  id: number,
  serviceAccessType: 'EMAIL' | 'PHONE' | 'BOTH' = 'EMAIL',
  overrides: Record<string, unknown> = {},
) {
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
    existingMembersCount: 1,
    marketplaceCapacity: 3,
    filledSeats: 1,
    freeSeats: 3,
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
    ...overrides,
  };
}

function roomSummary(
  id: number,
  serviceAccessType: 'EMAIL' | 'PHONE' | 'BOTH' = 'EMAIL',
  overrides: Record<string, unknown> = {},
) {
  const room = roomFixture(id, serviceAccessType, overrides);
  return {
    id: room.id,
    title: room.title,
    roomType: room.roomType,
    status: room.status,
    maxMembers: room.maxMembers,
    existingMembersCount: room.existingMembersCount,
    marketplaceCapacity: room.marketplaceCapacity,
    filledSeats: room.filledSeats,
    freeSeats: room.freeSeats,
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
    createRoomPayloads: [] as Record<string, unknown>[],
    supportTicketPayloads: [] as Record<string, unknown>[],
    adminAboutPayloads: [] as Record<string, unknown>[],
    roomSettingsPayloads: [] as Array<{ minimumRoomMembers: number }>,
    minimumRoomMembers: 5,
    memberStatus: 'APPLIED' as string,
    matchResult: { action: 'JOIN' as 'JOIN' | 'CREATE', roomId: 101 as number | null },
    matchCalls: 0,
    joinFullOnce: false,
    rejectCreateCount: false,
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
  let siteAbout = {
    companyName: 'EcoPay LLP',
    title: 'EcoPay туралы',
    mission: 'Shared plans made simple.',
    description: 'Trusted subscription sharing.',
    title_ru: 'Об EcoPay',
    mission_ru: 'Семейные тарифы без лишних сложностей.',
    description_ru: 'Надёжный сервис совместных подписок.',
    title_kz: 'EcoPay туралы',
    mission_kz: 'Ортақ тарифтер оңай.',
    description_kz: 'Сенімді ортақ жазылымдар сервисі.',
    title_en: 'About EcoPay',
    mission_en: 'Shared plans made simple.',
    description_en: 'Trusted subscription sharing.',
    contactEmail: 'support@ecopay.test',
    contactPhone: null,
    apexLink: null,
    updatedAt: '2026-08-01T00:00:00Z',
  };
  const staffTicket = {
    id: 601,
    userId: 10,
    roomId: 303,
    roomTitle: 'Owned family room',
    roomMemberId: null,
    subject: 'Room access issue',
    topic: 'access',
    status: 'OPEN',
    priority: 'NORMAL',
    escalatedToDispute: false,
    assignedAdminId: null,
    assignedAdminDisplayName: null,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
    closedAt: null,
    messages: [],
  };

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
    if (path === '/site/room-settings' && method === 'GET') {
      return body({ minimumRoomMembers: controls.minimumRoomMembers });
    }
    if (path === '/admin/room-settings' && method === 'GET') {
      return body({ minimumRoomMembers: controls.minimumRoomMembers });
    }
    if (path === '/admin/room-settings' && method === 'PATCH') {
      const payload = route.request().postDataJSON() as { minimumRoomMembers: number };
      controls.roomSettingsPayloads.push(payload);
      controls.minimumRoomMembers = payload.minimumRoomMembers;
      return body({ minimumRoomMembers: controls.minimumRoomMembers });
    }
    if (path === '/admin/rooms' && method === 'GET') {
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
      });
    }
    if (path.includes('/users/me')) {
      if (role === 'ANON') return body({ message: 'Unauthorized' }, 401);
      return body(sessionFor(role));
    }
    if (path.includes('/catalog/categories')) return body([]);
    if (path === '/rooms/joined' && method === 'GET') {
      return body([
        {
          roomId: 101,
          memberId: 1001,
          title: 'Joined family room',
          roomType: 'DIGITAL',
          roomStatus: 'ACTIVE',
          memberStatus: 'ACTIVE',
          requiresAdminReview: false,
          maxMembers: 4,
          priceTotal: 10,
          pricePerMember: 2.5,
          currency: 'USD',
          startDate: '2026-08-01',
          ownerUserId: 2,
          ownerDisplayName: 'Owner',
          serviceId: 1,
          serviceName: 'Provider',
        },
      ]);
    }
    if (path === '/rooms/me' && method === 'GET') {
      return body({
        items: [roomSummary(303, 'EMAIL', { title: 'Owned family room' })],
        page: 0,
        size: 100,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
    }
    if (path === '/support-tickets' && method === 'GET') return body([]);
    if (path === '/support-tickets' && method === 'POST') {
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      controls.supportTicketPayloads.push(payload);
      return body({ id: 501, ...payload, status: 'OPEN', createdAt: '2026-08-01T00:00:00Z' });
    }
    if (path === '/site/about' && method === 'GET') return body(siteAbout);
    if (path === '/admin/site/about' && method === 'GET') return body(siteAbout);
    if (path === '/admin/site/about' && method === 'PUT') {
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      controls.adminAboutPayloads.push(payload);
      siteAbout = { ...siteAbout, ...payload, updatedAt: '2026-08-02T00:00:00Z' };
      return body(siteAbout);
    }
    if (path === '/admin/users' && method === 'GET') {
      const requestedRole = url.searchParams.get('role');
      const profile = requestedRole === 'ADMIN' ? admin : user;
      return body({
        items: [
          {
            ...profile,
            emailMasked: profile.email,
            phoneMasked: null,
            roomsOwned: 1,
            roomsJoined: 1,
            tickets: 0,
            disputes: 0,
            createdAt: '2026-08-01T00:00:00Z',
          },
        ],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
    }
    if (path === '/admin/users/10' && method === 'GET') {
      return body({
        ...user,
        emailMasked: user.email,
        phoneMasked: null,
        roomsOwned: 1,
        roomsJoined: 1,
        tickets: 0,
        disputes: 0,
        createdAt: '2026-08-01T00:00:00Z',
      });
    }
    if (path === '/admin/logs/room-events' && method === 'GET') {
      return body({
        items: [
          {
            id: 701,
            eventId: 'event-701',
            actorUserId: 10,
            actorDisplayName: 'Member',
            actorRole: 'USER',
            roomId: 303,
            roomOwnerUserId: 10,
            roomOwnerDisplayName: 'Member',
            roomMemberId: null,
            eventType: 'ROOM_BLOCKED',
            oldState: null,
            newState: null,
            ipAddress: null,
            userAgent: null,
            createdAt: '2026-08-02T00:00:00Z',
          },
        ],
        page: 0,
        size: 10,
        totalItems: 1,
        totalPages: 1,
      });
    }
    if (path === '/staff/support-tickets/queue' && method === 'GET') {
      return body({
        items: [staffTicket],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
      });
    }
    if (path === '/staff/support-tickets/601' && method === 'GET') return body(staffTicket);
    if (path === '/catalog/services/1/match' && method === 'GET') {
      controls.matchCalls += 1;
      return body(controls.matchResult);
    }
    if (path === '/catalog/services/1/tariffs' && method === 'GET') {
      return body([
        {
          id: 11,
          serviceId: 1,
          name: 'Family 5',
          periodType: 'MONTHLY',
          maxMembers: 5,
          basePriceTotal: 7500,
          currency: 'KZT',
          connectionType: 'INVITE',
          operatorRules: '',
          features: [],
        },
        {
          id: 12,
          serviceId: 1,
          name: 'Decimal 4',
          periodType: 'MONTHLY',
          maxMembers: 4,
          basePriceTotal: 7290,
          currency: 'KZT',
          connectionType: 'INVITE',
          operatorRules: '',
          features: [],
        },
        {
          id: 13,
          serviceId: 1,
          name: 'Duo',
          periodType: 'MONTHLY',
          maxMembers: 2,
          basePriceTotal: 3000,
          currency: 'KZT',
          connectionType: 'INVITE',
          operatorRules: '',
          features: [],
        },
        {
          id: 14,
          serviceId: 1,
          name: 'Decimal Family 5',
          periodType: 'MONTHLY',
          maxMembers: 5,
          basePriceTotal: 7290,
          currency: 'KZT',
          connectionType: 'INVITE',
          operatorRules: '',
          features: [],
        },
      ]);
    }
    if (path === '/catalog/services' && method === 'GET') {
      return body([
        {
          id: 1,
          categoryId: 1,
          categoryName: 'Digital subscriptions',
          name: 'Provider',
          slug: 'provider',
          providerType: 'DIGITAL',
          accessType: 'EMAIL',
          minPricePerMember: 2000,
          currency: 'KZT',
          tariffCount: 1,
          logoUrl: null,
        },
      ]);
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
    if (path === '/admin/moderation/queue' && method === 'GET') {
      return body([
        {
          id: 1,
          entityType: 'ROOM_MEMBER',
          entityId: '1190396672850886657',
          roomId: '1190697228537528324',
          roomMemberId: '1190396672850886657',
          reasonCode: 'PENDING_TIMEOUT',
          riskScore: 0,
          assignedAdminId: null,
          status: 'OPEN',
          createdAt: '2026-07-07T00:00:00Z',
        },
      ]);
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
    if (path.includes('/payouts/methods')) {
      return body([
        {
          id: 1,
          providerName: 'FreedomPay',
          panMask: '4242',
          isDefault: true,
          status: 'ACTIVE',
          createdAt: '2026-08-15T00:00:00Z',
        },
      ]);
    }
    if (path === '/fx/rates') {
      return body({ base: 'KZT', updatedAt: '2026-08-15T00:00:00Z', rates: { USD: 475 } });
    }
    if (path === '/rooms/pricing-preview' && method === 'POST') {
      const payload = route.request().postDataJSON() as {
        tariffPlanId: number;
        existingMembersCount: 1 | 2;
      };
      const decimalPlan = payload.tariffPlanId === 12 || payload.tariffPlanId === 14;
      const duoPlan = payload.tariffPlanId === 13;
      const maxMembers = duoPlan ? 2 : payload.tariffPlanId === 12 ? 4 : 5;
      const share = decimalPlan ? 1822.5 : 1500;
      const capacity = maxMembers - payload.existingMembersCount;
      const commission = payload.existingMembersCount === 2 ? 450 : 500;
      return body({
        maxMembers,
        existingMembersCount: payload.existingMembersCount,
        marketplaceCapacity: capacity,
        shareKzt: share,
        commissionKzt: commission,
        payableTotalKzt: share + commission,
        potentialMemberPaymentsTotalKzt: (share + commission) * capacity,
        potentialOwnerPayoutKzt: share * capacity,
        potentialEcoPayCommissionKzt: commission * capacity,
        originalTariffPrice: decimalPlan ? 7290 : 7500,
        originalTariffCurrency: 'KZT',
        fxRateSnapshot: 1,
        settlementCurrency: 'KZT',
      });
    }
    if (path === '/rooms' && method === 'POST') {
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      controls.createRoomPayloads.push(payload);
      if (controls.rejectCreateCount) {
        return body({ message: 'existingMembersCount must be 1 or 2' }, 400);
      }
      const existing = Number(payload.existingMembersCount ?? 1);
      return body(
        roomFixture(303, 'EMAIL', {
          title: payload.title,
          maxMembers: 5,
          priceTotal: 7500,
          pricePerMember: 1500,
          originalTariffPrice: 7500,
          originalTariffCurrency: 'KZT',
          shareKzt: 1500,
          commissionKzt: 450,
          payableTotalKzt: 1950,
          existingMembersCount: existing,
          marketplaceCapacity: 5 - existing,
          filledSeats: existing,
          freeSeats: 5 - existing,
          currency: 'KZT',
          periodType: 'MONTHLY',
        }),
      );
    }
    if (path === '/rooms' && method === 'GET') {
      return body({
        items: [
          roomSummary(100),
          roomSummary(101, 'PHONE'),
          roomSummary(202, 'PHONE'),
          roomSummary(303, 'EMAIL', {
            title: 'Mixed room',
            maxMembers: 5,
            existingMembersCount: 2,
            marketplaceCapacity: 3,
            filledSeats: 4,
            freeSeats: 1,
          }),
          roomSummary(404, 'EMAIL', {
            title: 'Full mixed room',
            maxMembers: 5,
            existingMembersCount: 2,
            marketplaceCapacity: 3,
            filledSeats: 5,
            freeSeats: 0,
          }),
        ],
        page: 0,
        size: 100,
        totalItems: 5,
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
      if (roomId === 303) {
        return body(
          roomFixture(303, 'EMAIL', {
            title: 'Mixed room',
            maxMembers: 5,
            existingMembersCount: 2,
            marketplaceCapacity: 3,
            filledSeats: 4,
            freeSeats: 1,
            shareKzt: 1500,
            commissionKzt: 450,
            payableTotalKzt: 1950,
            currency: 'KZT',
            originalTariffPrice: 7500,
            originalTariffCurrency: 'KZT',
          }),
        );
      }
      if (roomId === 404) {
        return body(
          roomFixture(404, 'EMAIL', {
            title: 'Full mixed room',
            maxMembers: 5,
            existingMembersCount: 2,
            marketplaceCapacity: 3,
            filledSeats: 5,
            freeSeats: 0,
          }),
        );
      }
    }
    if (path.startsWith('/rooms/303/members') && method === 'GET') {
      return body({
        items: [
          {
            id: '801',
            roomId: 303,
            userId: 21,
            userDisplayName: 'Eco member one',
            userEmail: 'one@example.test',
            userReputation: 0,
            userReputationLevel: null,
            status: 'PENDING',
            requiresAdminReview: false,
            accessMethod: null,
            ownerAccessConfirmedAt: null,
            memberConfirmedAt: null,
            activatedAt: null,
            rejectedAt: null,
            endedAt: null,
            consentAcceptedAt: null,
            createdAt: '2026-08-15T00:00:00Z',
          },
          {
            id: '802',
            roomId: 303,
            userId: 22,
            userDisplayName: 'Eco member two',
            userEmail: 'two@example.test',
            userReputation: 0,
            userReputationLevel: null,
            status: 'ACTIVE',
            requiresAdminReview: false,
            accessMethod: null,
            ownerAccessConfirmedAt: '2026-08-15T00:00:00Z',
            memberConfirmedAt: '2026-08-15T00:00:00Z',
            activatedAt: '2026-08-15T00:00:00Z',
            rejectedAt: null,
            endedAt: null,
            consentAcceptedAt: null,
            createdAt: '2026-08-15T00:00:00Z',
          },
        ],
        page: 0,
        size: 50,
        totalItems: 2,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
    }
    const joinMatch = path.match(/^\/rooms\/(\d+)\/members$/);
    if (joinMatch && method === 'POST') {
      const roomId = Number(joinMatch[1]);
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      controls.joinPayloads.push({ roomId, payload });
      if (controls.joinFullOnce) {
        controls.joinFullOnce = false;
        return body({ message: 'ROOM_FULL: Room is full' }, 409);
      }
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
    if (path === '/rooms/100/members/me/hold' && method === 'GET') {
      return body({
        heldAmount: 0,
        currency: 'KZT',
        heldPayoutCount: 0,
        nextReleaseAt: null,
        beneficiaryUserId: 2,
        beneficiaryDisplayName: 'Owner',
        beneficiaryPublicId: 'owner-public',
      });
    }
    if (path.includes('/rooms/100/members/me')) {
      return body({
        id: '555',
        roomId: 100,
        userId: 10,
        userDisplayName: 'Member',
        userEmail: user.email,
        status: controls.memberStatus,
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
  await expect(
    page.getByRole('main').getByText(/phone|номер телефона|телефон нөмірі/i),
  ).toHaveCount(0);
  await page.getByRole('main').getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/\/profile$/);
  expect(api.loginPayloads).toEqual([{ email: 'member@example.test', password: 'secret123' }]);
  expect(api.loginPayloads[0]).not.toHaveProperty('phone');
});

test('service CTA opens explicit participant-or-owner intent choices', async ({ page }) => {
  await mockApi(page);
  await seedSession(page);

  await page.goto('/');
  await page
    .getByRole('button', { name: /Provider/ })
    .first()
    .click();

  await expect(page.getByText('I want a spot in a subscription')).toBeVisible();
  await expect(page.getByText('I already have a subscription')).toBeVisible();
  await expect(page.getByText('Member', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Owner', { exact: true })).toHaveCount(0);
});

test('want-a-spot service flow opens matched room on JOIN', async ({ page }) => {
  const api = await mockApi(page);
  api.matchResult = { action: 'JOIN', roomId: 101 };
  await seedSession(page);

  await page.goto('/');
  await page
    .getByRole('button', { name: /Provider/ })
    .first()
    .click();
  await page.getByRole('button', { name: /I want a spot in a subscription/ }).click();

  await expect(page).toHaveURL(/\/room\/101$/);
});

test('want-a-spot CREATE match opens create-room with the selected service', async ({ page }) => {
  const api = await mockApi(page, 'USER', 'ru');
  api.matchResult = { action: 'CREATE', roomId: null };
  await seedSession(page);

  await page.goto('/');
  await page
    .getByRole('button', { name: /Provider/ })
    .first()
    .click();
  await page.getByRole('button', { name: /Хочу место в подписке/ }).click();

  await expect(page).toHaveURL(/\/rooms\/create\?serviceId=1&source=existing$/);
  expect(api.matchCalls).toBe(1);
});

test('support ticket form selects one of the user rooms instead of requiring a manual ID', async ({
  page,
}) => {
  const api = await mockApi(page);
  await seedSession(page);

  await page.goto('/support/new');
  const roomSelect = page.locator('main select').nth(1);
  await expect(roomSelect.locator('option')).toContainText([
    'Joined family room',
    'Owned family room',
  ]);
  await expect(page.getByPlaceholder('e.g. 42')).toHaveCount(0);
  await roomSelect.selectOption('303');
  await page.getByPlaceholder('Short summary').fill('Room access issue');
  await page
    .getByPlaceholder('Describe your issue in detail...')
    .fill('Please review the linked room.');
  await page.getByRole('button', { name: 'Submit Ticket' }).click();

  expect(api.supportTicketPayloads).toEqual([
    expect.objectContaining({ roomId: 303, subject: 'Room access issue' }),
  ]);
});

test('initial document metadata follows the saved locale', async ({ page }) => {
  await mockApi(page, 'ANON', 'kz');
  await page.goto('/');

  await expect(page).toHaveTitle('EcoPay - отбасылық жазылымдарға азырақ төлеңіз');
  await expect(page.locator('html')).toHaveAttribute('lang', 'kk');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'EcoPay - отбасылық жазылымдарды бөлісіп, 2–6 есе аз төлеңіз. EcoPay ақшаны иесіне аударғанға дейін уақытша ұстайды.',
  );
});

test('existing-subscription intent opens create room with selected service', async ({ page }) => {
  await mockApi(page);
  await seedSession(page);

  await page.goto('/');
  await page
    .getByRole('button', { name: /Provider/ })
    .first()
    .click();
  await page.getByRole('button', { name: /I already have a subscription/ }).click();

  await expect(page).toHaveURL(/\/rooms\/create\?serviceId=1&source=existing$/);
});

test('mixed room selector and pricing preview use the server contract', async ({ page }) => {
  const api = await mockApi(page);
  await seedSession(page);

  await page.goto('/rooms/create?serviceId=1&source=existing');
  await page.locator('main select').nth(1).selectOption('11');

  await expect(page.getByRole('button', { name: 'Just me', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Me + 1 more person', exact: true })).toBeVisible();
  await expect(page.locator('main button').filter({ hasText: /^3$/ })).toHaveCount(0);

  await page.getByRole('button', { name: 'Me + 1 more person', exact: true }).click();
  await expect(page.getByText('Already taken: 2 of 5')).toBeVisible();
  await expect(page.getByText('EcoPay will help find 3 more people')).toBeVisible();

  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('e.g. Family plan').fill('Owner family plan');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText(/1,500 ₸/).first()).toBeVisible();
  await expect(page.getByText(/450 ₸/).first()).toBeVisible();
  await expect(page.getByText(/1,950 ₸/).first()).toBeVisible();
  await expect(page.getByText(/5,850 ₸/).first()).toBeVisible();
  await expect(page.getByText(/4,500 ₸/).first()).toBeVisible();
  await expect(page.getByText(/1,350 ₸/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Publish Room' }).click();

  await expect(page.getByText('Room Published')).toBeVisible();
  expect(api.createRoomPayloads).toHaveLength(1);
  expect(api.createRoomPayloads[0]).toMatchObject({ serviceId: 1, existingMembersCount: 2 });
});

test('new room selector applies the minimum-capacity setting without hiding legacy room detail', async ({
  page,
}) => {
  await mockApi(page);
  await seedSession(page);

  await page.goto('/rooms/create?serviceId=1&source=existing');
  const planSelect = page.locator('main select').nth(1);
  await expect(planSelect).toContainText('Family 5');
  await expect(planSelect).not.toContainText('Decimal 4');

  // A four-seat existing room remains accessible despite the five-seat creation rule.
  await page.goto('/rooms/member/100');
  await expect(page.getByRole('heading', { name: 'Production room' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Room owner' })).toHaveAttribute('href', '/user/2');
});

test('paid member sees a zero hold as an explicit neutral state', async ({ page }) => {
  const api = await mockApi(page);
  api.memberStatus = 'PENDING';
  await seedSession(page);

  await page.goto('/rooms/member/100');
  await expect(page.getByText('There is no active hold right now.')).toBeVisible();
});

test('two-seat tariff is unavailable for a new room below the minimum capacity', async ({ page }) => {
  await mockApi(page);
  await seedSession(page);
  await page.goto('/rooms/create?serviceId=1&source=existing');
  await expect(page.locator('main select').nth(1)).not.toContainText('Duo');
});

test('room detail uses server seats and settlement amounts without client surcharge math', async ({
  page,
}) => {
  await mockApi(page);
  await seedSession(page);

  await page.goto('/room/303');

  await expect(page.getByText('Remaining through EcoPay')).toBeVisible();
  await expect(page.getByText('1').first()).toBeVisible();
  await expect(page.getByText('Cost of your spot')).toBeVisible();
  await expect(page.getByText(/1\s*500/).first()).toBeVisible();
  await expect(page.getByText('EcoPay fee')).toBeVisible();
  await expect(page.getByText(/450/).first()).toBeVisible();
  await expect(page.getByText('Total to pay')).toBeVisible();
  await expect(page.getByText(/1\s*950/).first()).toBeVisible();
  await expect(page.getByText(/3\s*100/)).toHaveCount(0);
  await expect(page.getByText(/1\s*100/)).toHaveCount(0);
});

test('decimal tariff preview keeps backend cents without Math.round drift', async ({ page }) => {
  await mockApi(page);
  await seedSession(page);
  await page.goto('/rooms/create?serviceId=1&source=existing');
  await page.locator('main select').nth(1).selectOption('14');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('e.g. Family plan').fill('Decimal plan');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText(/1,822\.50 ₸/).first()).toBeVisible();
});

test('stale mixed-room count rejection is friendly and localized', async ({ page }) => {
  const api = await mockApi(page, 'USER', 'ru');
  await seedSession(page);
  await page.goto('/rooms/create?serviceId=1&source=existing');
  await page.locator('main select').nth(1).selectOption('11');
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await page.getByPlaceholder('Например, Семейный тариф').fill('Семейный тариф');
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  api.rejectCreateCount = true;
  await page.getByRole('button', { name: 'Опубликовать комнату' }).click();
  await expect(
    page.getByText('Состав подписки изменился. Выберите доступный вариант и повторите публикацию.'),
  ).toBeVisible();
  await expect(page.getByText(/existingMembersCount/)).toHaveCount(0);
});

test('freeSeats zero disables concrete room join', async ({ page }) => {
  await mockApi(page);
  await seedSession(page);

  await page.goto('/room/404');
  const join = page.getByRole('button', { name: 'No spots' });

  await expect(join).toBeDisabled();
});

test('ROOM_FULL join race rematches once and shows the normal no-spots state', async ({ page }) => {
  const api = await mockApi(page);
  api.joinFullOnce = true;
  api.matchResult = { action: 'CREATE', roomId: null };
  await seedSession(page);

  await page.goto('/room/303');
  await page.getByRole('button', { name: 'Join Room' }).click();
  await page.getByPlaceholder('name@example.com').fill('member@example.test');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Submit request' }).click();

  await expect(page.getByRole('button', { name: 'No spots' })).toBeDisabled();
  expect(api.matchCalls).toBe(1);
});

test('owner detail uses server filled/free seats and does not create fake member cards', async ({
  page,
}) => {
  await mockApi(page);
  await seedSession(page);

  await page.goto('/rooms/owner/303');

  await expect(page.getByText('4 / 5 members')).toBeVisible();
  await expect(page.getByText('Already in subscription')).toBeVisible();
  await expect(page.getByText('Through EcoPay')).toBeVisible();
  await expect(page.getByText('Remaining to find').first()).toBeVisible();
  await expect(page.getByText('Eco member one')).toBeVisible();
  await expect(page.getByText('Eco member two')).toBeVisible();
  await expect(page.getByText(/Eco member/)).toHaveCount(2);
  await expect(page.getByText('Revenue')).toHaveCount(0);
});

test('new intent and create-room copy is localized in Kazakh', async ({ page }) => {
  await mockApi(page, 'USER', 'kz');
  await seedSession(page);

  await page.goto('/');
  await page
    .getByRole('button', { name: /Provider/ })
    .first()
    .click();
  await expect(page.getByText('Жазылымнан орын іздеймін')).toBeVisible();
  await expect(page.getByText('Менде жазылым бар')).toBeVisible();

  await page.getByRole('button', { name: /Менде жазылым бар/ }).click();
  await page.locator('main select').nth(1).selectOption('11');
  await expect(
    page.getByText('Сізбен бірге жазылымды қазір қанша адам пайдаланады?'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Мен + тағы 1 адам', exact: true }).click();
  await expect(page.getByText('5 орынның 2 орны бос емес')).toBeVisible();
  await expect(page.getByText('EcoPay тағы 3 адам табуға көмектеседі')).toBeVisible();
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

test('same account can submit different phone numbers in different PHONE rooms', async ({
  page,
}) => {
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

  await expect(page.getByRole('heading', { name: 'Укажите данные для подключения' })).toBeVisible();
  await expect(page.getByText('Если сервис подключает по приглашению')).toBeVisible();
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

test('room payment CTA shows KZT settlement breakdown without raw status leaks', async ({
  page,
}) => {
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

test('admin room setting loads and saves the PATCH contract without reloading', async ({ page }) => {
  const api = await mockApi(page, 'ADMIN');
  await seedSession(page, 'ADMIN');

  await page.goto('/admin/rooms');
  const input = page.getByLabel('Seat count');
  await expect(input).toHaveValue('5');
  await input.fill('6');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect.poll(() => api.roomSettingsPayloads).toEqual([{ minimumRoomMembers: 6 }]);
  await expect(input).toHaveValue('6');
});

test('/admin/tickets shows a named room link', async ({ page }) => {
  await mockApi(page, 'ADMIN');
  await seedSession(page, 'ADMIN');

  await page.goto('/admin/tickets');
  await page.getByRole('button', { name: /T-601/ }).click();
  await expect(page.getByRole('link', { name: 'Owned family room · R-303' })).toHaveAttribute(
    'href',
    '/admin/rooms?selected=303',
  );
});

test('/admin/about persists an edit through refresh and renders it on public About', async ({
  page,
}) => {
  const api = await mockApi(page, 'ADMIN', 'ru');
  await seedSession(page, 'ADMIN');

  await page.goto('/admin/about');
  await expect(page.getByRole('heading', { name: 'Страница «О нас»' })).toBeVisible();
  const pageTitle = page.getByLabel('Заголовок страницы');
  await expect(pageTitle).toHaveValue('Об EcoPay');
  await pageTitle.fill('Обновлённый EcoPay');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect
    .poll(() => api.adminAboutPayloads)
    .toEqual([
      expect.objectContaining({ title: 'Обновлённый EcoPay', title_ru: 'Обновлённый EcoPay' }),
    ]);

  await page.reload();
  await expect(page.getByLabel('Заголовок страницы')).toHaveValue('Обновлённый EcoPay');

  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'Обновлённый EcoPay' })).toBeVisible();
});

test('/admin/users loads room events for the selected user through the admin log API', async ({
  page,
}) => {
  await mockApi(page, 'ADMIN');
  await seedSession(page, 'ADMIN');
  const eventsRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return (
      url.pathname.endsWith('/admin/logs/room-events') &&
      url.searchParams.get('actorUserId') === '10'
    );
  });

  await page.goto('/admin/users?selected=10');
  await eventsRequest;
  await expect(page.getByRole('heading', { name: 'User room events' })).toBeVisible();
  await expect(page.getByText('ROOM_BLOCKED', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'R-303' })).toHaveAttribute(
    'href',
    '/admin/rooms?selected=303',
  );
});

test('/admin/moderation ru localizes queue codes and uses wide content', async ({ page }) => {
  await page.setViewportSize({ width: 1748, height: 960 });
  await mockApi(page, 'ADMIN', 'ru');
  await seedSession(page, 'ADMIN');

  await page.goto('/admin/moderation');

  await expect(page.getByText('Таймаут ожидания')).toBeVisible();
  await expect(page.getByText('Статус: Открыта')).toBeVisible();
  await expect(page.getByText('PENDING_TIMEOUT')).toHaveCount(0);
  await expect(page.getByText('Статус: OPEN')).toHaveCount(0);

  const contentBox = await page.locator('main > div').first().boundingBox();
  expect(contentBox?.width ?? 0).toBeGreaterThan(1300);
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

test('homepage ru localizes public stats and review section', async ({ page }) => {
  await mockApi(page, 'ANON', 'ru');
  await page.goto('/');
  const content = (await page.locator('#root').textContent()) ?? '';

  await expect(page.getByText('пользователей EcoPay')).toBeVisible();
  await expect(page.getByText('18 проверенных отзывов')).toBeVisible();
  await expect(page.getByText('участий в подписках')).toBeVisible();
  await expect(page.getByText('активных комнат')).toBeVisible();
  await expect(page.getByText('Проверенные отзывы EcoPay')).toBeVisible();

  for (const english of [
    'EcoPay users',
    '18 verified reviews',
    'memberships',
    'active rooms',
    'Verified EcoPay reviews',
    'Selected by EcoPay moderators from real member reviews.',
  ]) {
    expect(content).not.toContain(english);
  }
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
