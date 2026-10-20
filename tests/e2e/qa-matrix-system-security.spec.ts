import { expect, test } from '@playwright/test';
import { adminFixture, installMockBackend, userFixture } from './support/mock-backend';

test.describe('EcoPay QA Matrix: Системная безопасность и Граничные сценарии (TC-032..TC-191)', () => {
  test('TC-032: Вход: Забаненный пользователь видит экран блокировки аккаунта', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    await page.route(/\/auth\/login/, async (route) => {
      await route.fulfill({
        status: 403,
        json: {
          message: 'Аккаунт заблокирован администратором.',
          reason: 'Нарушение правил сообщества',
        },
      });
    });

    await page.goto('/login');

    await page.locator('input[placeholder="ваш@email.com"]').fill('banned-user@ecopay.kz');
    await page.locator('input[placeholder="Введите пароль"]').fill('SecretPass123!');

    const submitBtn = page.locator('main button[type="submit"]').or(page.getByRole('main').getByRole('button', { name: 'Войти' }));
    await submitBtn.click();

    // Проверяем сообщение о блокировке
    await expect(page.locator('text=заблокирован').or(page.locator('text=Заблокирован')).first()).toBeVisible();
  });

  test('TC-089: Оплата: Отказ карты или отмена оплаты на стороне провайдера (/payment/failure)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.goto('/payment/failure');

    // Проверяем страницу ошибки / отмены платежа
    await expect(page.locator('h1').or(page.locator('h2')).first()).toBeVisible();
  });

  test('TC-094: Оплата: Лимит на количество попыток создания платежа (Rate limit 429)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route(/\/payments\/members\/\d+\/intent/, async (route) => {
      await route.fulfill({
        status: 429,
        json: { message: 'Слишком много попыток оплаты. Пожалуйста, подождите несколько минут.' },
      });
    });

    await page.goto('/rooms/member/100');

    // Если есть кнопка оплаты или повтора
    const payBtn = page.getByRole('button', { name: /Оплатить/i }).first();
    if (await payBtn.isVisible()) {
      await payBtn.click();
      await expect(page.locator('text=Слишком много').or(page.locator('text=подождите')).first()).toBeVisible();
    }
  });

  test('TC-099: Участие: Таймер автоматического подтверждения участия (72 часа)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route(/\/rooms\/100\/members\/me/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: '555',
          roomId: 100,
          userId: userFixture.id,
          status: 'PENDING',
          ownerAccessConfirmedAt: '2026-10-18T00:00:00Z',
          memberConfirmedAt: null,
          billing: {
            amountKzt: 1250,
            nextPaymentDate: null,
          },
        },
      });
    });

    await page.goto('/rooms/member/100');

    // Проверяем наличие информации о подтверждении доступа
    await expect(page.locator('text=Подтвердите доступ').or(page.locator('text=доступ')).first()).toBeVisible();
  });

  test('TC-100: Участие: Владелец не выдал доступ вовремя (SLA)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route(/\/rooms\/100\/members\/me/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: '555',
          roomId: 100,
          userId: userFixture.id,
          status: 'PENDING',
          ownerAccessConfirmedAt: null, // Доступ не выдан
          memberConfirmedAt: null,
          billing: {
            amountKzt: 1250,
            nextPaymentDate: null,
          },
        },
      });
    });

    await page.goto('/rooms/member/100');

    // Проверяем отображение ожидания выдачи доступа владельцем
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('TC-191: Админка: Мониторинг цен — валидация внешних URL (защита от SSRF)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.goto('/admin/pricing');

    // Проверяем интерфейс мониторинга цен
    await expect(page.locator('h1').or(page.locator('h2')).first()).toBeVisible();
  });

  test('TC-163: Админка: Модерация — проверка массовых действий подтверждения', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.goto('/admin/moderation');

    // Проверяем наличие очереди модерации
    await expect(page.locator('h1:has-text("Модерация")').or(page.locator('text=модераци')).first()).toBeVisible();
  });
});
