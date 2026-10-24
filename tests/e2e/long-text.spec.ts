import { expect, test, type Page } from '@playwright/test';
import { horizontalOverflow, installMockBackend } from './support/mock-backend';

const LONG_5000 = 'A'.repeat(5000);
const LONG_2000 = 'B'.repeat(2000);
const LONG_150 = 'C'.repeat(150);
const LONG_50 = 'D'.repeat(50);

async function noOverflow(page: Page) {
  const overflow = await horizontalOverflow(page);
  expect(overflow, 'page should not have horizontal overflow').toBe(0);
}

test('long room title does not cause horizontal overflow @critical', async ({ page }) => {
  await installMockBackend(page, { role: 'USER' });

  await page.route('**/api/v1/rooms/100', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 100,
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
        title: LONG_150,
        description: LONG_2000,
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
        joinable: true,
        canEdit: false,
        canCancel: false,
        canComplete: false,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      }),
    });
  });

  await page.goto('/room/100');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(LONG_150.slice(0, 20));
  await noOverflow(page);

  await page.setViewportSize({ width: 360, height: 640 });
  await noOverflow(page);
});

test('long review text does not cause horizontal overflow @critical', async ({ page }) => {
  await installMockBackend(page, { role: 'USER' });

  await page.route('**/api/**/users/public/reviewer', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 22,
        publicId: 'reviewer',
        slug: 'reviewer',
        displayName: LONG_50,
        avatar: null,
        reputation: 50,
        reputationLevel: null,
        status: 'ACTIVE',
        averageRating: 9,
        reviewsCount: 1,
        completedRoomsCount: 1,
        createdAt: '2026-08-01T00:00:00Z',
      }),
    });
  });

  await page.route('**/api/**/reputation/users/22/reviews', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 301,
          authorDisplayName: LONG_50,
          authorPublicId: 'author1',
          rating: 9,
          text: LONG_2000,
          featured: false,
          verifiedExperience: true,
          createdAt: '2026-08-15T00:00:00Z',
          updatedAt: '2026-08-15T00:00:00Z',
        },
      ]),
    });
  });

  await page.goto('/u/reviewer');
  await expect(page.getByText(LONG_50.slice(0, 20)).first()).toBeVisible();
  await noOverflow(page);

  await page.setViewportSize({ width: 360, height: 640 });
  await noOverflow(page);
});

test('long chat message does not cause horizontal overflow @critical', async ({ page }) => {
  await installMockBackend(page, { role: 'USER', membershipStatus: 'ACTIVE' });

  await page.route('**/api/v1/rooms/100/chat/**', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: '1',
            roomId: 100,
            senderId: 2,
            senderName: LONG_50,
            body: LONG_5000,
            owner: true,
            createdAt: '2026-08-20T12:00:00Z',
          },
        ],
        page: 0,
        size: 50,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      }),
    });
  });

  await page.goto('/rooms/member/100');
  await expect(page.getByText(LONG_5000.slice(0, 30))).toBeVisible();
  await noOverflow(page);

  await page.setViewportSize({ width: 360, height: 640 });
  await noOverflow(page);
});

test('2000-char no-space review at 360px has no horizontal scroll in list and modal @critical', async ({ page }) => {
  const NO_SPACE_2000 = 'X'.repeat(2000);

  await installMockBackend(page, { role: 'USER' });
  await page.setViewportSize({ width: 360, height: 640 });

  await page.route('**/api/**/users/public/longrev', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 55,
        publicId: 'longrev',
        slug: 'longrev',
        displayName: 'LongReviewer',
        avatar: null,
        reputation: 50,
        reputationLevel: null,
        status: 'ACTIVE',
        averageRating: 8,
        reviewsCount: 1,
        completedRoomsCount: 1,
        createdAt: '2026-08-01T00:00:00Z',
      }),
    });
  });

  await page.route('**/api/**/reputation/users/55/reviews', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 501,
          authorDisplayName: 'Tester',
          authorPublicId: 'tester1',
          rating: 8,
          text: NO_SPACE_2000,
          featured: false,
          verifiedExperience: true,
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
        },
      ]),
    });
  });

  await page.goto('/u/longrev');
  await expect(page.getByText(NO_SPACE_2000.slice(0, 20)).first()).toBeVisible();

  // Review list: no horizontal scroll
  const listOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(listOverflow, 'review list should not overflow at 360px').toBeLessThanOrEqual(0);
});

test('long notification body does not cause horizontal overflow @critical', async ({ page }) => {
  await installMockBackend(page, { role: 'USER' });

  await page.route('**/api/**/notifications**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/unread-count'))
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 1 }),
      });
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 1,
            userId: 10,
            type: 'SYSTEM',
            title: LONG_150,
            body: LONG_5000,
            read: false,
            roomId: null,
            link: null,
            createdAt: '2026-09-01T10:00:00Z',
          },
        ],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      }),
    });
  });

  await page.goto('/notifications-inbox');
  await expect(page.getByRole('button', { name: /mark all read/i })).toBeVisible();
  await noOverflow(page);

  await page.setViewportSize({ width: 360, height: 640 });
  await noOverflow(page);
});
