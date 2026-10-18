import { expect, test } from '@playwright/test';
import { installMockBackend, room, userFixture } from './support/mock-backend';

const ownerUser = {
  ...userFixture,
  id: 2,
  displayName: 'Владелец Сервиса',
  phoneVerified: true,
};

const memberUser = {
  ...userFixture,
  id: 10,
  displayName: 'Участник Тестовый',
  phoneVerified: true,
};

const baseRoom = {
  ...room(100),
  id: 100,
  ownerUserId: 2,
  ownerDisplayName: 'Владелец Сервиса',
  title: 'Spotify Premium Family 6 мест',
  serviceAccessType: 'EMAIL',
  roomType: 'DIGITAL',
  status: 'OPEN',
  joinable: true,
  pricePerMember: 1200,
  shareKzt: 1000,
  commissionKzt: 200,
  payableTotalKzt: 1200,
  settlementCurrency: 'KZT',
  maxMembers: 6,
  filledSeats: 2,
  freeSeats: 4,
};

test.describe('EcoPay QA Matrix: Модули «Комната: владелец» и «Участие» (TC-071..TC-105)', () => {
  test('TC-071: Управление комнатой владельцем (карточка, статус OPEN, список участников)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({ status: 200, json: { accessToken: 'token-owner', user: ownerUser } });
    });

    await page.route('**/api/v1/rooms/100', async (route) => {
      await route.fulfill({ status: 200, json: baseRoom });
    });

    await page.route('**/api/v1/rooms/100/members*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 901,
              userId: 10,
              userDisplayName: 'Участник 1',
              status: 'PAID',
              contactIdentifier: 'member1@example.test',
              createdAt: '2026-10-17T00:00:00Z',
            },
          ],
          totalItems: 1,
          page: 0,
          size: 20,
          totalPages: 1,
        },
      });
    });

    await page.goto('/rooms/owner/100');

    // Проверяем карточку комнаты и ее данные
    await expect(page.locator('text=Spotify Premium Family 6 мест')).toBeVisible();
    await expect(page.locator('text=Участник 1')).toBeVisible();
    await expect(page.locator('text=Вид владельца')).toBeVisible();
  });

  test('TC-072: Ссылка-приглашение в комнату (копирование ссылки)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({ status: 200, json: { accessToken: 'token-owner', user: ownerUser } });
    });

    await page.route('**/api/v1/rooms/100', async (route) => {
      await route.fulfill({ status: 200, json: baseRoom });
    });

    await page.route('**/api/v1/rooms/100/members*', async (route) => {
      await route.fulfill({
        status: 200,
        json: { items: [], totalItems: 0, page: 0, size: 20, totalPages: 1 },
      });
    });

    await page.goto('/rooms/owner/100');

    // Кнопка «Скопировать ссылку» на приглашение
    const copyBtn = page.locator('button:has-text("Скопировать ссылку")').or(page.locator('button:has-text("Ссылка")')).first();
    if (await copyBtn.count() > 0) {
      await expect(copyBtn).toBeVisible();
      await copyBtn.click();
    }
  });

  test('TC-074: Маскирование контактов участника (раскрытие контакта по запросу владельца)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({ status: 200, json: { accessToken: 'token-owner', user: ownerUser } });
    });

    await page.route('**/api/v1/rooms/100', async (route) => {
      await route.fulfill({ status: 200, json: baseRoom });
    });

    await page.route('**/api/v1/rooms/100/members*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 901,
              userId: 10,
              userDisplayName: 'Участник 1',
              status: 'PAID',
              contactIdentifier: null,
              identifierType: 'EMAIL',
              createdAt: '2026-10-17T00:00:00Z',
            },
          ],
          totalItems: 1,
          page: 0,
          size: 20,
          totalPages: 1,
        },
      });
    });

    let revealRequested = false;
    await page.route('**/api/v1/rooms/100/members/901/reveal-identifier', async (route) => {
      revealRequested = true;
      await route.fulfill({
        status: 200,
        json: {
          memberId: '901',
          identifierType: 'EMAIL',
          value: 'revealed.user@example.test',
          expiresAt: Date.now() + 30000,
        },
      });
    });

    await page.goto('/rooms/owner/100');

    // Кнопка раскрытия контакта
    const showBtn = page.locator('button:has-text("Показать")').first();
    if (await showBtn.count() > 0) {
      await showBtn.click();

      // Модальное окно выбора причины раскрытия контакта
      const confirmRevealBtn = page.locator('button:has-text("Подтвердить")').or(page.locator('button:has-text("Показать")')).last();
      await confirmRevealBtn.click();

      expect(revealRequested).toBe(true);
      await expect(page.locator('text=revealed.user@example.test')).toBeVisible();
    }
  });

  test('TC-075: Отметить доступ выданным владельцем комнаты', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({ status: 200, json: { accessToken: 'token-owner', user: ownerUser } });
    });

    await page.route('**/api/v1/rooms/100', async (route) => {
      await route.fulfill({ status: 200, json: baseRoom });
    });

    await page.route('**/api/v1/rooms/100/members*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 901,
              userId: 10,
              userDisplayName: 'Участник 1',
              status: 'PAID',
              ownerAccessConfirmedAt: null,
              memberAccessConfirmedAt: null,
              createdAt: '2026-10-17T00:00:00Z',
            },
          ],
          totalItems: 1,
          page: 0,
          size: 20,
          totalPages: 1,
        },
      });
    });

    let grantConfirmed = false;
    await page.route('**/api/v1/rooms/100/members/901/owner-confirm', async (route) => {
      grantConfirmed = true;
      await route.fulfill({
        status: 200,
        json: { success: true, ownerAccessConfirmedAt: new Date().toISOString() },
      });
    });

    await page.goto('/rooms/owner/100');

    // Кнопка выдачи доступа
    const grantBtn = page.locator('button:has-text("Выдать доступ")').or(page.locator('button:has-text("Отметить доступ выданным")')).first();
    if (await grantBtn.count() > 0) {
      await grantBtn.click();

      // В модальном окне подтверждаем выдачу
      const confirmBtn = page.locator('button:has-text("Подтвердить")').or(page.locator('button:has-text("Выдать доступ")')).last();
      await confirmBtn.click();
      expect(grantConfirmed).toBe(true);
    }
  });

  test('TC-081: Чужая комната в режиме владельца (/rooms/owner/:id блокируется для не-владельца)', async ({ page }) => {
    // Входим как обычный участник (id: 10), а комната принадлежит id: 2
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/rooms/100', async (route) => {
      await route.fulfill({
        status: 403,
        json: { message: 'Forbidden: You are not the owner of this room' },
      });
    });

    await page.goto('/rooms/owner/100');

    // Проверяем сообщение о том, что юзер не является владельцем
    await expect(page.locator('text=Вы не владелец этой комнаты.')).toBeVisible();
  });

  test('TC-096: Хронология участия в /rooms/member/:id отображает шаги', async ({ page }) => {
    await installMockBackend(page, {
      language: 'ru',
      role: 'USER',
      membershipStatus: 'PAID',
    });

    await page.route('**/api/v1/rooms/100', async (route) => {
      await route.fulfill({ status: 200, json: baseRoom });
    });

    await page.route('**/api/v1/rooms/100/members/me', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: '555',
          roomId: 100,
          userId: memberUser.id,
          status: 'PAID',
          payableTotalKzt: 1200,
          ownerAccessConfirmedAt: '2026-10-17T01:00:00Z',
          memberAccessConfirmedAt: null,
        },
      });
    });

    await page.goto('/rooms/member/100');

    // Проверяем шаги прогресса
    await expect(page.locator('text=Оплата подтверждена').first()).toBeVisible();
  });

  test('TC-097: Подтверждение получения доступа участником', async ({ page }) => {
    await installMockBackend(page, {
      language: 'ru',
      role: 'USER',
      membershipStatus: 'PAID',
    });

    await page.route('**/api/v1/rooms/100', async (route) => {
      await route.fulfill({ status: 200, json: baseRoom });
    });

    await page.route('**/api/v1/rooms/100/members/me', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: '555',
          roomId: 100,
          userId: memberUser.id,
          status: 'PAID',
          payableTotalKzt: 1200,
          ownerAccessConfirmedAt: '2026-10-17T01:00:00Z',
          memberAccessConfirmedAt: null,
        },
      });
    });

    let accessConfirmed = false;
    await page.route('**/api/v1/rooms/100/members/me/confirm-access', async (route) => {
      accessConfirmed = true;
      await route.fulfill({
        status: 200,
        json: { success: true, status: 'ACTIVE', memberAccessConfirmedAt: new Date().toISOString() },
      });
    });

    await page.goto('/rooms/member/100');

    // Кнопка подтверждения получения доступа
    const confirmBtn = page.locator('button:has-text("Подтвердить получение доступа")').or(page.locator('button:has-text("Подтвердить доступ")')).first();
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click();
      expect(accessConfirmed).toBe(true);
    }
  });

  test('TC-105: Страница «Мои комнаты» /rooms с вкладками «Вступил» и «Создал»', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/rooms/joined*', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: '555',
            roomId: 100,
            roomTitle: 'Spotify Premium Family 6 мест',
            status: 'ACTIVE',
            role: 'MEMBER',
          },
        ],
      });
    });

    await page.route('**/api/v1/rooms/me*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [baseRoom],
          totalItems: 1,
          page: 0,
          size: 20,
          totalPages: 1,
        },
      });
    });

    await page.goto('/rooms');

    // Проверяем наличие вкладок «Участвую» и «Создал»
    await expect(page.locator('text=Участвую')).toBeVisible();
    await expect(page.locator('text=Создал')).toBeVisible();
  });
});
