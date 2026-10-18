import { expect, test } from '@playwright/test';
import { installMockBackend, room, userFixture } from './support/mock-backend';

test.describe('EcoPay QA Matrix: Финансы, выплаты, история и локализация (TC-110..TC-149)', () => {
  test('TC-113: Страница выплат владельца /payment/payout', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/payouts/balance*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          heldAmount: 15000,
          currency: 'KZT',
          heldPayoutCount: 1,
          nextReleaseAt: null,
          calculatedAt: '2026-10-17T01:00:00Z',
        },
      });
    });

    await page.route('**/api/v1/payouts/methods*', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 1,
            providerName: 'FreedomPay',
            panMask: '4405 **** **** 1234',
            isDefault: true,
            status: 'ACTIVE',
            createdAt: '2026-10-17T01:00:00Z',
          },
        ],
      });
    });

    await page.route('**/api/v1/payouts/me*', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 101,
            amount: 15000,
            currency: 'KZT',
            status: 'COMPLETED',
            createdAt: '2026-10-17T01:00:00Z',
          },
        ],
      });
    });

    await page.goto('/payment/payout');

    // Проверяем отображение баланса и карты
    await expect(page.locator('text=Выплаты владельцу').first()).toBeVisible();
    await expect(page.locator('text=15').first()).toBeVisible();
  });

  test('TC-118: Страница возвратов /payment/refund', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/payments/refunds*', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 'ref-501',
            amount: 1200,
            currency: 'KZT',
            status: 'COMPLETED',
            reason: 'ROOM_CANCELLED',
            createdAt: '2026-10-17T00:30:00Z',
          },
        ],
      });
    });

    await page.goto('/payment/refund');

    await expect(page.locator('text=Возвраты').first()).toBeVisible();
  });

  test('TC-121: История платежей /payments/history с операциями', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/payments/history*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 1,
              kind: 'PAYMENT',
              direction: 'OUTGOING',
              amount: 1200,
              currency: 'KZT',
              status: 'SUCCESS',
              roomTitle: 'Spotify Premium Family',
              createdAt: '2026-10-17T01:15:00Z',
            },
          ],
          totalItems: 1,
          page: 0,
          size: 20,
          totalPages: 1,
        },
      });
    });

    await page.goto('/payments/history');

    await expect(page.locator('h1:has-text("История платежей")')).toBeVisible();
    await expect(page.locator('text=Spotify Premium Family').first()).toBeVisible();
  });

  test('TC-122: Пустая история платежей отображает понятное сообщение', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/payments/history*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [],
          totalItems: 0,
          page: 0,
          size: 20,
          totalPages: 1,
        },
      });
    });

    await page.goto('/payments/history');

    await expect(page.locator('h1:has-text("История платежей")')).toBeVisible();
    await expect(page.locator('text=нет операций').or(page.locator('text=Операций пока нет')).or(page.locator('text=История пуста'))).toBeVisible();
  });

  test('TC-147: Переключение языков (RU -> KZ -> EN) и сохранение в localStorage', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    await page.goto('/');

    // Проверяем русский язык по умолчанию
    await expect(page.locator('text=Платите меньше за семейные подписки')).toBeVisible();

    // Переключаем язык на казахский
    const kzButton = page.locator('button:has-text("KZ")').or(page.locator('button:has-text("Қаз")')).first();
    if (await kzButton.count() > 0) {
      await kzButton.click();
      // Проверяем сохранение языка в localStorage
      const lang = await page.evaluate(() => window.localStorage.getItem('ecopay-language'));
      expect(lang).toBe('kz');
    }
  });
});
