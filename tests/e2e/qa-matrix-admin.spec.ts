import { expect, test } from '@playwright/test';
import { adminFixture, installMockBackend, userFixture } from './support/mock-backend';

test.describe('EcoPay QA Matrix: Модули панели администратора (TC-150..TC-181)', () => {
  test('TC-150: Доступ к панели администратора для пользователя с ролью ADMIN', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.goto('/admin/dashboard');

    // Проверяем, что дашборд открылся без редиректа
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.locator('h1:has-text("Панель управления")')).toBeVisible();
  });

  test('TC-151: Блокировка доступа к панели администратора для обычного пользователя (роль USER)', async ({ page }) => {
    // Входим как обычный пользователь с ролью USER
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.goto('/admin/dashboard');

    // Обычный пользователь не должен иметь доступа к дашборду администратора
    await expect(page.locator('text=Доступ запрещён').or(page.locator('text=Недостаточно прав')).or(page.locator('text=403'))).toBeVisible();
  });

  test('TC-152: Неавторизованный гость перенаправляется на /admin-login', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    await page.goto('/admin/dashboard');

    // Гость должен быть перенаправлен на страницу входа администратора
    await expect(page).toHaveURL(/\/admin-login/);
  });

  test('TC-156: Дашборд администратора отображает ключевые KPI', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/dashboard/kpis*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          totalUsers: 1420,
          activeRooms: 85,
          totalTurnoverKzt: 4500000,
          totalCommissionKzt: 450000,
          openDisputes: 2,
        },
      });
    });

    await page.goto('/admin/dashboard');

    // Проверяем наличие карточек KPI
    await expect(page.locator('text=1 420').or(page.locator('text=1420')).first()).toBeVisible();
  });

  test('TC-159: Очередь модерации комнат /admin/moderation', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/moderation/queue*', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            roomId: 777,
            roomTitle: 'Netflix 4K Ultra Family Комната',
            ownerName: 'Moderation Test User',
            submittedAt: '2026-10-17T02:00:00Z',
            status: 'PENDING_MODERATION',
          },
        ],
      });
    });

    await page.goto('/admin/moderation');

    await expect(page).toHaveURL(/\/admin\/moderation/);
    await expect(page.locator('text=Очередь модерации').first()).toBeVisible();
  });

  test('TC-167: Список пользователей в админке /admin/users', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/users*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 10,
              displayName: 'Тестовый Клиент',
              email: 'client@example.test',
              role: 'USER',
              status: 'ACTIVE',
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

    await page.goto('/admin/users');

    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.locator('h1:has-text("Пользователи")')).toBeVisible();
  });

  test('TC-178: Раздел споров и арбитража /admin/disputes', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/disputes*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 301,
              roomId: 100,
              status: 'OPEN',
              reason: 'ACCESS_NOT_PROVIDED',
              openedBy: { id: 10, displayName: 'Member Complainant' },
              createdAt: '2026-10-17T01:00:00Z',
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

    await expect(page).toHaveURL(/\/admin\/disputes/);
    await expect(page.locator('h1:has-text("Споры и возвраты")')).toBeVisible();
  });
});
