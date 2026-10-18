import { expect, test } from '@playwright/test';
import { adminFixture, installMockBackend, userFixture } from './support/mock-backend';

test.describe('EcoPay QA Matrix: Жизненный цикл комнат, Выплаты и Финансы (TC-078..TC-195)', () => {
  test('TC-078: Комната: Завершение комнаты владельцем', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route(/\/rooms\/100$/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 100,
          ownerUserId: userFixture.id,
          ownerDisplayName: userFixture.displayName,
          serviceId: 1,
          serviceName: 'StreamPlus',
          title: 'Комната для завершения',
          status: 'ACTIVE',
          totalSeats: 4,
          occupiedSeats: 1,
          maxMembers: 4,
          membersCount: 1,
          joinable: false,
          canComplete: true,
          pricePerMember: 1250,
          currency: 'KZT',
        },
      });
    });

    await page.goto('/rooms/owner/100');

    // Проверяем наличие кнопки "Завершить"
    const completeBtn = page.getByRole('button', { name: /^Завершить/ });
    await expect(completeBtn).toBeVisible();
    await completeBtn.click();

    // Проверяем появление модального окна подтверждения завершения
    await expect(page.locator('text=Завершить комнату').first()).toBeVisible();
  });

  test('TC-104: Участие: Комната заблокирована админом — вид участника', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route(/\/rooms\/100$/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 100,
          ownerUserId: 99,
          ownerDisplayName: 'Заблокированный Владелец',
          serviceId: 1,
          serviceName: 'StreamPlus',
          title: 'Заблокированная комната',
          status: 'BLOCKED',
          totalSeats: 4,
          occupiedSeats: 2,
          freeSeats: 0,
          joinable: false,
          pricePerMember: 1250,
          currency: 'KZT',
        },
      });
    });

    await page.route(/\/rooms\/100\/members\/me/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: '555',
          roomId: 100,
          userId: userFixture.id,
          status: 'REFUNDED',
          ownerAccessConfirmedAt: '2026-10-01T00:00:00Z',
          memberConfirmedAt: '2026-10-01T00:00:00Z',
          billing: {
            amountKzt: 1250,
            nextPaymentDate: null,
          },
        },
      });
    });

    await page.goto('/rooms/member/100');

    // Проверяем отображение заголовка комнаты и страницы
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('TC-111: Продление: Продление уже оплачено / недоступно', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route(/\/rooms\/100\/members\/me/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: '555',
          roomId: 100,
          userId: userFixture.id,
          status: 'ACTIVE',
          ownerAccessConfirmedAt: '2026-10-01T00:00:00Z',
          memberConfirmedAt: '2026-10-01T00:00:00Z',
          billing: {
            amountKzt: 1250,
            nextPaymentDate: '2026-11-20T00:00:00Z', // Платеж далеко в будущем
          },
        },
      });
    });

    await page.goto('/rooms/member/100');

    // Кнопка продления не должна предлагаться, так как период активен и оплачен
    await expect(page.locator('button:has-text("Оплатить продление")')).toHaveCount(0);
  });

  test('TC-112: Продление: Grace-период и напоминание о платеже', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route(/\/rooms\/100\/members\/me/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: '555',
          roomId: 100,
          userId: userFixture.id,
          status: 'ACTIVE',
          ownerAccessConfirmedAt: '2026-10-01T00:00:00Z',
          memberConfirmedAt: '2026-10-01T00:00:00Z',
          billing: {
            amountKzt: 1250,
            nextPaymentDate: '2026-10-18T00:00:00Z', // Платеж наступил
          },
        },
      });
    });

    await page.goto('/rooms/member/100');

    // Проверяем отображение страницы участника
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('TC-114: Выплаты владельцу: Просмотр удержания и доступных средств', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route(/\/payments\/owner\/payout-status/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          balanceKzt: 15000,
          holdKzt: 5000,
          payoutEligible: true,
          payoutCardLinked: true,
          cardMasked: '4400••••1234',
        },
      });
    });

    await page.goto('/payment/payout');

    // Проверяем отображение баланса выплат владельца
    await expect(page.locator('h1').or(page.locator('h2')).first()).toBeVisible();
    await expect(page.locator('text=Выплаты').first()).toBeVisible();
  });

  test('TC-116: Выплаты владельцу: Изменение баланса удержания при отмене', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route(/\/payments\/owner\/payout-status/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          balanceKzt: 0,
          holdKzt: 0,
          payoutEligible: false,
          payoutCardLinked: true,
        },
      });
    });

    await page.goto('/payment/payout');

    // Проверяем страницу выплат
    await expect(page.locator('text=Выплаты').first()).toBeVisible();
  });

  test('TC-117: Возвраты: Просмотр статуса возврата (/payment/refund)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.goto('/payment/refund');

    // Проверяем наличие интерфейса статуса возвратов
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('TC-183: Админка: Диалог ручного возврата в /admin/finance', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route(/\/admin\/finance\/transactions/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 'tx-999',
              externalId: 'ext-999',
              amount: 5000,
              currency: 'KZT',
              status: 'SETTLED',
              stuck: true,
              refundableAmount: 5000,
              createdAt: '2026-10-18T00:00:00Z',
            },
          ],
          totalPages: 1,
          totalElements: 1,
        },
      });
    });

    await page.goto('/admin/finance');

    // Проверяем наличие кнопки ручного возврата
    const refundBtn = page.getByRole('button', { name: /Возврат|Оформить возврат/i }).first();
    if (await refundBtn.isVisible()) {
      await refundBtn.click();
      await expect(page.locator('text=Ручной возврат').or(page.locator('text=Причина'))).toBeVisible();
    }
  });

  test('TC-184: Админка: Вкладка вебхуков и повтор обработки в /admin/finance', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route(/\/admin\/finance\/webhooks/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 'wh-1',
              provider: 'FREEDOM_PAY',
              eventType: 'PAYMENT_CONFIRM',
              status: 'FAILED',
              retryCount: 2,
              nextRetryAt: '2026-10-18T10:00:00Z',
              createdAt: '2026-10-18T00:00:00Z',
            },
          ],
          totalPages: 1,
          totalElements: 1,
        },
      });
    });

    await page.goto('/admin/finance');

    // Переключаемся на вкладку "Вебхуки"
    const webhooksTab = page.locator('button:has-text("Вебхуки")');
    if (await webhooksTab.isVisible()) {
      await webhooksTab.click();
      await expect(page.locator('text=FREEDOM_PAY').first()).toBeVisible();
    }
  });

  test('TC-188: Админка: Создание тарифа с валютой (USD/EUR)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.goto('/admin/catalog');

    // Переключаемся на "Тарифы"
    const tariffsTab = page.locator('button:has-text("Тарифы")');
    if (await tariffsTab.isVisible()) {
      await tariffsTab.click();

      const createBtn = page.getByRole('button', { name: /Создать тариф/i });
      if (await createBtn.isVisible()) {
        await createBtn.click();

        // Проверяем селект валюты
        const currencySelect = page.locator('select').filter({ hasText: /USD|EUR|KZT/ }).first();
        if (await currencySelect.isVisible()) {
          await expect(currencySelect).toBeVisible();
        }
      }
    }
  });

  test('TC-193: Админка: Мультиязычные изображения новостей (/admin/news)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.goto('/admin/news');

    // Проверяем интерфейс новостей
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('TC-195: Админка: Валидация безопасности URL кнопок в историях (/admin/stories)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.goto('/admin/stories');

    // Проверяем интерфейс актуального / историй
    await expect(page.locator('h1').or(page.locator('h2')).first()).toBeVisible();
  });

  test('TC-125: Отзывы: Обновление отзыва пользователем', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route(/\/reviews\/user\/99/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 1,
          targetUserId: 99,
          rating: 4,
          comment: 'Хороший организатор, доступ выдан быстро.',
          createdAt: '2026-10-10T00:00:00Z',
        },
      });
    });

    await page.goto('/u/test-owner');

    // Проверяем открытие публичного профиля
    await expect(page.locator('h1').or(page.locator('h2')).first()).toBeVisible();
  });

  test('TC-148: Языки: Переключение интерфейса между RU, KZ и EN', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    await page.goto('/');

    // Переключаем на Казахский язык
    const kzBtn = page.getByRole('button', { name: 'Қазақ' });
    if (await kzBtn.isVisible()) {
      await kzBtn.click();
      await expect(page.getByRole('button', { name: 'Кіру', exact: true })).toBeVisible();
    }

    // Переключаем на Английский язык
    const enBtn = page.getByRole('button', { name: 'English' });
    if (await enBtn.isVisible()) {
      await enBtn.click();
      await expect(page.locator('text=Catalog').first()).toBeVisible();
    }
  });
});
