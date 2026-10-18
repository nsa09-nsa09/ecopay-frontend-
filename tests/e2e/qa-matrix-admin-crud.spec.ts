import { expect, test } from '@playwright/test';
import { installMockBackend, adminFixture } from './support/mock-backend';

test.describe('EcoPay QA Matrix: Углублённые сценарии панели администратора (TC-164..TC-201)', () => {
  test('TC-164: Список комнат в админке /admin/rooms', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/rooms**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 100,
              title: 'Spotify Premium Family 6 мест',
              status: 'OPEN',
              ownerDisplayName: 'Super Host',
              serviceName: 'Spotify',
              filledSeats: 3,
              maxMembers: 6,
              priceTotal: 3000,
              createdAt: '2026-10-18T00:00:00Z',
            },
          ],
          totalItems: 1,
          page: 0,
          size: 20,
          totalPages: 1,
        },
      });
    });

    await page.goto('/admin/rooms');

    await expect(page).toHaveURL(/\/admin\/rooms/);
    await expect(page.locator('h1:has-text("Комнаты")').first()).toBeVisible();
    await expect(page.locator('text=Spotify Premium Family 6 мест').first()).toBeVisible();
  });

  test('TC-168: Детальный просмотр пользователя в /admin/users', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/users**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 55,
              displayName: 'Тестовый Клиент',
              email: 'client@example.test',
              role: 'USER',
              status: 'ACTIVE',
              reputation: 85,
              ownerVerified: false,
              createdAt: '2026-05-01T10:00:00Z',
            },
          ],
          totalItems: 1,
          page: 0,
          size: 20,
          totalPages: 1,
        },
      });
    });

    await page.goto('/admin/users');

    await expect(page.locator('text=Тестовый Клиент').first()).toBeVisible();
    await expect(page.locator('text=client@example.test').first()).toBeVisible();
  });

  test('TC-169: Бан пользователя в админке с указанием причины', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/users**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 55,
              displayName: 'Нарушитель',
              email: 'violator@example.test',
              role: 'USER',
              status: 'ACTIVE',
              createdAt: '2026-05-01T10:00:00Z',
            },
          ],
          totalItems: 1,
          page: 0,
          size: 20,
          totalPages: 1,
        },
      });
    });

    let banPayload: any = null;
    await page.route('**/api/v1/admin/users/55/ban**', async (route) => {
      banPayload = route.request().postDataJSON();
      await route.fulfill({ status: 200, json: { id: 55, status: 'BANNED' } });
    });

    await page.goto('/admin/users');

    // Кликаем по пользователю для открытия действий
    await page.locator('text=Нарушитель').first().click();

    const banBtn = page.locator('button:has-text("Заблокировать")').or(page.locator('button[aria-label="Заблокировать"]')).first();
    if (await banBtn.count() > 0) {
      await banBtn.click();
      const reasonInput = page.locator('input[placeholder*="причин"]').or(page.locator('textarea')).first();
      if (await reasonInput.count() > 0) {
        await reasonInput.fill('Систематическое нарушение правил сервиса');
        const confirmBtn = page.locator('button:has-text("Подтвердить")').or(page.locator('button:has-text("Заблокировать")')).last();
        await confirmBtn.click();
      }
    }
  });

  test('TC-170: Разбан пользователя в админке', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/users**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 56,
              displayName: 'Заблокированный',
              email: 'banned@example.test',
              role: 'USER',
              status: 'BANNED',
              createdAt: '2026-05-01T10:00:00Z',
            },
          ],
          totalItems: 1,
          page: 0,
          size: 20,
          totalPages: 1,
        },
      });
    });

    let unbanCalled = false;
    await page.route('**/api/v1/admin/users/56/unban**', async (route) => {
      unbanCalled = true;
      await route.fulfill({ status: 200, json: { id: 56, status: 'ACTIVE' } });
    });

    await page.goto('/admin/users');
    await page.locator('text=Заблокированный').first().click();

    const unbanBtn = page.locator('button:has-text("Разблокировать")').first();
    if (await unbanBtn.count() > 0) {
      await unbanBtn.click();
      const confirmBtn = page.locator('button:has-text("Подтвердить")').or(page.locator('button:has-text("Да")')).first();
      if (await confirmBtn.count() > 0) {
        await confirmBtn.click();
      }
    }
  });

  test('TC-175: Очередь модерации /admin/moderation: одобрение комнаты', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/moderation/queue**', async (route) => {
      const url = route.request().url();
      if (url.includes('/confirm')) {
        await route.fulfill({
          status: 200,
          json: { id: 201, entityType: 'ROOM', entityId: 100, roomId: 100, status: 'RESOLVED' },
        });
      } else {
        await route.fulfill({
          status: 200,
          json: [
            {
              id: 201,
              entityType: 'ROOM',
              entityId: 100,
              roomId: 100,
              riskScore: 25,
              reasonCode: 'ADMIN_REQUIRED',
              status: 'OPEN',
              assignedAdminId: null,
              createdAt: '2026-10-18T01:00:00Z',
            },
          ],
        });
      }
    });

    await page.goto('/admin/moderation');

    await expect(page.locator('text=MQ-201').or(page.locator('text=R-100')).first()).toBeVisible();
    const approveBtn = page.locator('button[aria-label="Подтвердить"]').or(page.locator('button[title="Подтвердить"]')).first();
    if (await approveBtn.count() > 0) {
      await approveBtn.click();
      const reasonInput = page.locator('textarea');
      await expect(reasonInput).toBeVisible();
      await reasonInput.fill('Проверка пройдена, комната соответствует правилам');
      const submitBtn = page.locator('button:has-text("Подтвердить")').last();
      await submitBtn.click();
    }
  });

  test('TC-176: Очередь модерации /admin/moderation: отклонение с указанием причины', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/moderation/queue**', async (route) => {
      const url = route.request().url();
      if (url.includes('/reject')) {
        await route.fulfill({
          status: 200,
          json: { id: 202, entityType: 'ROOM', entityId: 101, roomId: 101, status: 'REJECTED' },
        });
      } else {
        await route.fulfill({
          status: 200,
          json: [
            {
              id: 202,
              entityType: 'ROOM',
              entityId: 101,
              roomId: 101,
              riskScore: 85,
              reasonCode: 'RISK_REVIEW',
              status: 'OPEN',
              assignedAdminId: null,
              createdAt: '2026-10-18T01:00:00Z',
            },
          ],
        });
      }
    });

    await page.goto('/admin/moderation');

    await expect(page.locator('text=MQ-202').or(page.locator('text=R-101')).first()).toBeVisible();
    const rejectBtn = page.locator('button[aria-label="Отклонить"]').or(page.locator('button[title="Отклонить"]')).first();
    if (await rejectBtn.count() > 0) {
      await rejectBtn.click();
      const reasonInput = page.locator('textarea');
      await expect(reasonInput).toBeVisible();
      await reasonInput.fill('Подозрительная активность в профиле организатора');
      const submitBtn = page.locator('button:has-text("Отклонить")').last();
      await submitBtn.click();
    }
  });

  test('TC-179: Споры /admin/disputes: назначение спора на себя', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/disputes**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 401,
              roomId: 100,
              status: 'OPEN',
              reason: 'ACCESS_NOT_PROVIDED',
              openedBy: { id: 10, displayName: 'Member' },
              createdAt: '2026-10-18T00:30:00Z',
            },
          ],
          totalItems: 1,
          page: 0,
          size: 20,
          totalPages: 1,
        },
      });
    });

    let assigned = false;
    await page.route('**/api/v1/admin/disputes/401/assign**', async (route) => {
      assigned = true;
      await route.fulfill({
        status: 200,
        json: { id: 401, status: 'IN_REVIEW', assignedTo: adminFixture },
      });
    });

    await page.goto('/admin/disputes');

    await expect(page.locator('text=D-401').or(page.locator('text=#100')).first()).toBeVisible();
    const assignBtn = page.locator('button:has-text("Взять в работу")').or(page.locator('button:has-text("Назначить")')).first();
    if (await assignBtn.count() > 0) {
      await assignBtn.click();
      expect(assigned).toBe(true);
    }
  });

  test('TC-180: Споры /admin/disputes: вынесение решения', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/disputes**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 402,
              roomId: 100,
              status: 'IN_REVIEW',
              reason: 'ACCESS_NOT_PROVIDED',
              openedBy: { id: 10, displayName: 'Member' },
              assignedTo: adminFixture,
              createdAt: '2026-10-18T00:30:00Z',
            },
          ],
          totalItems: 1,
          page: 0,
          size: 20,
          totalPages: 1,
        },
      });
    });

    await page.goto('/admin/disputes');

    // Кликаем по спору для открытия панели решения
    await page.locator('text=D-402').or(page.locator('text=#100')).first().click();

    const decideBtn = page.locator('button:has-text("Вынести решение")').or(page.locator('button:has-text("Решение")')).first();
    if (await decideBtn.count() > 0) {
      await decideBtn.click();
      await expect(page.locator('text=В пользу участника').or(page.locator('text=Решение')).first()).toBeVisible();
    }
  });

  test('TC-182: Финансы /admin/finance: вкладки транзакций, возвратов, выплат, вебхуков', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/finance/transactions**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 'tx-901',
              amount: 5250,
              currency: 'KZT',
              status: 'SUCCESS',
              type: 'MEMBERSHIP_PAYMENT',
              createdAt: '2026-10-18T01:00:00Z',
            },
          ],
          totalItems: 1,
          page: 0,
          size: 20,
          totalPages: 1,
        },
      });
    });

    await page.goto('/admin/finance');

    await expect(page).toHaveURL(/\/admin\/finance/);
    await expect(page.locator('h1:has-text("Финансы")').first()).toBeVisible();

    // Проверяем наличие ключевых вкладок финансов
    await expect(page.locator('text=Возвраты').or(page.locator('text=Выплаты')).first()).toBeVisible();
  });

  test('TC-185: Каталог /admin/catalog: просмотр категорий и сервисов', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/catalog/categories**', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          { id: 1, name: 'Связь и интернет', slug: 'telecom', sortOrder: 1, isActive: true, servicesCount: 5 },
          { id: 2, name: 'Музыка и аудио', slug: 'music', sortOrder: 2, isActive: true, servicesCount: 3 },
        ],
      });
    });

    await page.goto('/admin/catalog');

    await expect(page).toHaveURL(/\/admin\/catalog/);
    await expect(page.locator('h1:has-text("Каталог")').first()).toBeVisible();
    await expect(page.locator('text=Связь и интернет').first()).toBeVisible();
  });

  test('TC-190: Мониторинг цен /admin/pricing: источники данных', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/pricing/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/providers')) {
        await route.fulfill({
          status: 200,
          json: [
            {
              id: '1',
              platformCode: 'SPOTIFY',
              displayName: 'Spotify Official Pricing',
              planName: 'Family',
              url: 'https://spotify.com',
              status: 'OK',
              extractorType: 'AUTO',
              active: true,
              checkIntervalMinutes: 60,
              lastPrice: 1500,
              currency: 'KZT',
              createdAt: '2026-10-18T00:00:00Z',
              updatedAt: '2026-10-18T00:00:00Z',
            },
          ],
        });
      } else {
        await route.fulfill({
          status: 200,
          json: [],
        });
      }
    });

    await page.goto('/admin/pricing');

    await expect(page).toHaveURL(/\/admin\/pricing/);
    await expect(page.locator('h1:has-text("Мониторинг цен")').first()).toBeVisible();
    await expect(page.locator('text=Spotify Official Pricing').first()).toBeVisible();
  });

  test('TC-192: Новости в админке /admin/news', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/news**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 1,
              titleRu: 'Масштабное обновление',
              status: 'PUBLISHED',
              createdAt: '2026-10-18T00:00:00Z',
            },
          ],
          totalItems: 1,
          page: 0,
          size: 20,
          totalPages: 1,
        },
      });
    });

    await page.goto('/admin/news');

    await expect(page).toHaveURL(/\/admin\/news/);
    await expect(page.locator('h1:has-text("Новости")').first()).toBeVisible();
    await expect(page.locator('text=Масштабное обновление').first()).toBeVisible();
  });

  test('TC-194: Сторис в админке /admin/stories', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/stories**', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 1,
            titleRu: 'Семейная подписка -70%',
            active: true,
            createdAt: '2026-10-18T00:00:00Z',
          },
        ],
      });
    });

    await page.goto('/admin/stories');

    await expect(page).toHaveURL(/\/admin\/stories/);
    await expect(page.locator('h1:has-text("Актуальное")').or(page.locator('h1:has-text("Истории")')).first()).toBeVisible();
  });

  test('TC-197: Юридические документы /admin/legal', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/legal**', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 1,
            docType: 'TERMS',
            titleRu: 'Пользовательское соглашение',
            updatedAt: '2026-10-18T00:00:00Z',
          },
        ],
      });
    });

    await page.goto('/admin/legal');

    await expect(page).toHaveURL(/\/admin\/legal/);
    await expect(page.locator('h1:has-text("Документы")').or(page.locator('h1:has-text("Юридические")')).first()).toBeVisible();
  });

  test('TC-199: Журнал аудита /admin/logs: действия администраторов', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/logs**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 1,
              action: 'USER_ROLE_UPDATED',
              adminDisplayName: 'Admin Chief',
              targetEntityType: 'USER',
              targetEntityId: '55',
              createdAt: '2026-10-18T00:00:00Z',
            },
          ],
          totalItems: 1,
          page: 0,
          size: 25,
          totalPages: 1,
        },
      });
    });

    await page.goto('/admin/logs');

    await expect(page).toHaveURL(/\/admin\/logs/);
    await expect(page.locator('h1:has-text("Журнал")').or(page.locator('h1:has-text("Логи")')).first()).toBeVisible();
  });

  test('TC-200: Обратная связь /admin/feedback: список обращений', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/feedback**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 1,
              userEmail: 'user@test.kz',
              userDisplayName: 'Тестовый Клиент',
              type: 'REQUEST',
              subject: 'Предложение по тарифам',
              message: 'Отличная платформа, добавьте больше тарифов Kcell!',
              status: 'NEW',
              createdAt: '2026-10-18T00:00:00Z',
              updatedAt: '2026-10-18T00:00:00Z',
            },
          ],
          totalItems: 1,
          page: 0,
          size: 20,
          totalPages: 1,
        },
      });
    });

    await page.goto('/admin/feedback');

    await expect(page).toHaveURL(/\/admin\/feedback/);
    await expect(page.locator('h1:has-text("Обращения")').or(page.locator('h1:has-text("Обратная связь")')).first()).toBeVisible();
    await expect(page.locator('text=Предложение по тарифам').or(page.locator('text=user@test.kz')).first()).toBeVisible();
  });
});
