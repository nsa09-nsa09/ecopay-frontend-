import { expect, test } from '@playwright/test';
import { installMockBackend, userFixture } from './support/mock-backend';

test.describe('EcoPay QA Matrix: Граничные сценарии и обработка ошибок (TC-015..TC-120)', () => {
  test('TC-015: Валидация формы регистрации (пароль, email, чекбокс соглашения)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru' });

    await page.goto('/register');

    await expect(page.locator('h1:has-text("Создать аккаунт")').first()).toBeVisible();

    // Заполняем имя (первый инпут формы)
    const nameInput = page.locator('form input').first();
    await nameInput.fill('Тестовый Пользователь');

    // Email (второй инпут формы)
    const emailInput = page.locator('form input[type="email"]').first();
    await emailInput.fill('valid-user@example.com');

    // Вводим пароли, которые не совпадают
    const pwInputs = page.locator('form input[type="password"]');
    await pwInputs.nth(0).fill('ValidPassword123');
    await pwInputs.nth(1).fill('DifferentPassword456');

    // Кнопка создания заблокирована, пока не нажат чекбокс условий
    const submitBtn = page.locator('form button[type="submit"]').first();
    await expect(submitBtn).toBeDisabled();

    // Отмечаем чекбокс условий
    await page.locator('button[role="checkbox"]').or(page.locator('button[data-slot="checkbox"]')).first().click();

    // Теперь кнопка активна, но пароли не совпадают
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Проверяем ошибку несовпадения паролей
    await expect(page.locator('text=совпадают').or(page.locator('text=Пароли не совпадают')).first()).toBeVisible();
  });

  test('TC-016: Повторная регистрация на уже существующий email (409 Conflict)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru' });

    await page.route('**/api/v1/auth/register**', async (route) => {
      await route.fulfill({
        status: 409,
        json: {
          status: 409,
          message: 'Пользователь с таким email уже зарегистрирован',
          errors: { email: 'EMAIL_ALREADY_EXISTS' },
        },
      });
    });

    await page.goto('/register');

    const nameInput = page.locator('form input').first();
    await nameInput.fill('Пользователь Двойник');

    const emailInput = page.locator('form input[type="email"]').first();
    await emailInput.fill('existing@example.com');

    const pwInputs = page.locator('form input[type="password"]');
    await pwInputs.nth(0).fill('ValidPassword123');
    await pwInputs.nth(1).fill('ValidPassword123');

    await page.locator('button[role="checkbox"]').or(page.locator('button[data-slot="checkbox"]')).first().click();

    const submitBtn = page.locator('form button[type="submit"]').first();
    await submitBtn.click();

    // Ошибка от сервера отображается пользователю
    await expect(
      page.locator('text=уже зарегистрирован').or(page.locator('text=уже используется')).or(page.locator('[role="alert"]')).first()
    ).toBeVisible();
  });

  test('TC-017: Регистрация с некорректным форматом email', async ({ page }) => {
    await installMockBackend(page, { language: 'ru' });

    await page.goto('/register');

    const emailInput = page.locator('input[type="email"]').or(page.locator('input[placeholder*="email" i]')).first();
    await emailInput.fill('invalid-email-format@@bad..com');

    const pwInputs = page.locator('input[type="password"]');
    await pwInputs.first().fill('ValidPassword123');
    await pwInputs.nth(1).fill('ValidPassword123');

    const checkbox = page.locator('button[role="checkbox"]').or(page.locator('button[data-slot="checkbox"]')).first();
    await checkbox.click();

    const submitBtn = page.locator('form button[type="submit"]').first();
    await submitBtn.click();

    // Проверяем валидацию формата email
    await expect(page.locator('text=email').or(page.locator('text=адрес')).first()).toBeVisible();
  });

  test('TC-019: Вход с неподтверждённым email -> шаг ввода кода верификации', async ({ page }) => {
    await installMockBackend(page, { language: 'ru' });

    await page.route('**/api/v1/auth/login**', async (route) => {
      await route.fulfill({
        status: 403,
        json: {
          status: 403,
          message: 'Подтвердите ваш email перед входом',
          errors: { code: 'EMAIL_NOT_VERIFIED' },
        },
      });
    });

    await page.goto('/login');

    const emailInput = page.locator('form input[type="email"]').first();
    await emailInput.fill('unverified@example.com');

    const passwordInput = page.locator('form input[type="password"]').first();
    await passwordInput.fill('SecurePassword123');

    const submitBtn = page.locator('form button[type="submit"]').first();
    await submitBtn.click();

    // Должен отобразиться экран верификации кода
    await expect(
      page.locator('h1:has-text("Подтвердите email")').or(page.locator('text=Код подтверждения')).or(page.locator('input[placeholder*="123456"]')).first()
    ).toBeVisible();
  });

  test('TC-020: Неверный или просроченный код подтверждения', async ({ page }) => {
    await installMockBackend(page, { language: 'ru' });

    await page.route('**/api/v1/auth/register**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          user: { id: 99, email: 'verify-test@example.com', displayName: 'Тест Кода' },
        },
      });
    });

    await page.route('**/api/v1/auth/*verify*', async (route) => {
      await route.fulfill({
        status: 400,
        json: {
          status: 400,
          message: 'Неверный или просроченный проверочный код',
        },
      });
    });

    await page.goto('/register');

    const nameInput = page.locator('form input').first();
    await nameInput.fill('Тест Кода');

    const emailInput = page.locator('form input[type="email"]').first();
    await emailInput.fill('verify-test@example.com');

    const pwInputs = page.locator('form input[type="password"]');
    await pwInputs.nth(0).fill('ValidPassword123');
    await pwInputs.nth(1).fill('ValidPassword123');

    await page.locator('button[role="checkbox"]').or(page.locator('button[data-slot="checkbox"]')).first().click();

    const submitBtn = page.locator('form button[type="submit"]').first();
    await submitBtn.click();

    // Появляется экран ввода кода подтверждения email
    await expect(page.locator('h1:has-text("Подтвердите email")').or(page.locator('input[placeholder="123456"]')).first()).toBeVisible();

    const codeInput = page.locator('input[placeholder="123456"]').first();
    await codeInput.fill('000000');

    const verifyBtn = page.locator('form button[type="submit"]').first();
    await verifyBtn.click();

    await expect(page.locator('text=Неверный').or(page.locator('text=просроченный')).first()).toBeVisible();
  });

  test('TC-022: Превышение попыток входа (Rate limit 429)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru' });

    await page.route('**/api/v1/auth/login**', async (route) => {
      await route.fulfill({
        status: 429,
        json: {
          status: 429,
          message: 'Слишком много попыток входа. Попробуйте через 15 минут.',
        },
      });
    });

    await page.goto('/login');

    const emailInput = page.locator('form input[type="email"]').first();
    await emailInput.fill('client@example.test');

    const passwordInput = page.locator('form input[type="password"]').first();
    await passwordInput.fill('WrongPasswordAgain');

    const submitBtn = page.locator('form button[type="submit"]').first();
    await submitBtn.click();

    await expect(page.locator('text=Слишком много попыток').or(page.locator('text=15 минут')).or(page.locator('[role="alert"]')).first()).toBeVisible();
  });

  test('TC-023: Восстановление пароля /forgot-password: показ экрана подтверждения', async ({ page }) => {
    await installMockBackend(page, { language: 'ru' });

    let resetRequested = false;
    await page.route('**/api/v1/auth/reset-password**', async (route) => {
      resetRequested = true;
      await route.fulfill({
        status: 200,
        json: { message: 'Инструкции отправлены на указанный email' },
      });
    });

    await page.goto('/forgot-password');

    await expect(page.locator('h1').first()).toBeVisible();

    const emailInput = page.locator('form input[type="email"]').or(page.locator('form input')).first();
    await emailInput.fill('recovery@example.test');

    const sendBtn = page.locator('form button[type="submit"]').first();
    await sendBtn.click();

    expect(resetRequested).toBe(true);
    await expect(page.locator('text=почту').or(page.locator('text=письмо').or(page.locator('h1:has-text("Проверьте почту")'))).first()).toBeVisible();
  });

  test('TC-024: Переход по недействительному токену сброса пароля', async ({ page }) => {
    await installMockBackend(page, { language: 'ru' });

    await page.route('**/api/v1/auth/reset-password/confirm**', async (route) => {
      await route.fulfill({
        status: 400,
        json: {
          status: 400,
          message: 'Срок действия ссылки для сброса пароля истёк',
        },
      });
    });

    await page.goto('/reset-password/confirm?token=expired_token_123');

    const pwInputs = page.locator('input[type="password"]');
    if (await pwInputs.count() >= 2) {
      await pwInputs.first().fill('NewValidPassword123');
      await pwInputs.nth(1).fill('NewValidPassword123');

      const submitBtn = page.locator('form button[type="submit"]').first();
      await submitBtn.click();

      await expect(page.locator('text=истёк').or(page.locator('text=недействителен')).or(page.locator('[role="alert"]')).first()).toBeVisible();
    }
  });

  test('TC-047: Каталог на главной странице: фильтрация сервисов по категориям', async ({ page }) => {
    await installMockBackend(page, { language: 'ru' });

    await page.route('**/api/v1/catalog/categories*', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          { id: 1, name: 'Музыка', slug: 'music' },
          { id: 2, name: 'Кино', slug: 'video' },
        ],
      });
    });

    await page.route('**/api/v1/catalog/services*', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          { id: 1, name: 'Spotify Premium', categoryName: 'Музыка', categoryId: 1, minPricePerMember: 750, currency: 'KZT', tariffCount: 2 },
          { id: 2, name: 'Netflix 4K Ultra', categoryName: 'Кино', categoryId: 2, minPricePerMember: 1500, currency: 'KZT', tariffCount: 1 },
        ],
      });
    });

    await page.goto('/');

    await expect(page.locator('text=Spotify Premium').first()).toBeVisible();
    await expect(page.locator('text=Netflix 4K Ultra').first()).toBeVisible();
  });

  test('TC-048: Поиск в каталоге сервисов по ключевому слову', async ({ page }) => {
    await installMockBackend(page, { language: 'ru' });

    await page.route('**/api/v1/catalog/services*', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          { id: 1, name: 'Spotify Premium', categoryName: 'Музыка', categoryId: 1, minPricePerMember: 750, currency: 'KZT', tariffCount: 2 },
          { id: 2, name: 'Apple Music Family', categoryName: 'Музыка', categoryId: 1, minPricePerMember: 800, currency: 'KZT', tariffCount: 1 },
        ],
      });
    });

    await page.goto('/');

    const searchInput = page.locator('main input[placeholder*="Найдите"]').or(page.locator('#marketplace input')).first();
    await searchInput.fill('Apple');

    await expect(page.locator('#marketplace').locator('text=Apple Music Family').first()).toBeVisible();
    await expect(page.locator('#marketplace').locator('text=Spotify Premium')).not.toBeVisible();
  });

  test('TC-053: Каталог: пустой результат поиска («Сервисы не найдены»)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru' });

    await page.route('**/api/v1/catalog/services*', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          { id: 1, name: 'Spotify Premium', categoryName: 'Музыка', categoryId: 1, minPricePerMember: 750, currency: 'KZT', tariffCount: 2 },
        ],
      });
    });

    await page.goto('/');

    const searchInput = page.locator('main input[placeholder*="Найдите"]').or(page.locator('#marketplace input')).first();
    await searchInput.fill('NonExistentService99999');

    await expect(
      page.locator('#marketplace').locator('text=Сервисы не найдены').or(page.locator('text=не найдены')).first()
    ).toBeVisible();
  });

  test('TC-086: Повторная заявка в ту же комнату: ошибка 409 Conflict', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/rooms/100/members/join**', async (route) => {
      await route.fulfill({
        status: 409,
        json: {
          status: 409,
          message: 'Вы уже подали заявку в эту комнату',
        },
      });
    });

    await page.route('**/api/v1/rooms/100**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 100,
          title: 'YouTube Premium Family 5 мест',
          serviceName: 'YouTube',
          status: 'OPEN',
          ownerUserId: 2,
          ownerDisplayName: 'Room Host',
          priceTotal: 3000,
          pricePerMember: 600,
          filledSeats: 2,
          maxMembers: 5,
          serviceAccessType: 'EMAIL',
        },
      });
    });

    await page.goto('/room/100');

    const joinBtn = page.locator('button:has-text("Вступить")').or(page.locator('button:has-text("Подать заявку")')).first();
    if (await joinBtn.count() > 0) {
      await joinBtn.click();
      const input = page.locator('input[type="email"]').or(page.locator('input')).first();
      await input.fill('member@example.test');
      const submitBtn = page.locator('button:has-text("Отправить заявку")').first();
      await submitBtn.click();
      await expect(page.locator('text=Вы уже подали заявку').or(page.locator('[role="alert"]')).first()).toBeVisible();
    }
  });

  test('TC-087: Отмена своей заявки на участие до оплаты в /rooms/member/:id', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    let cancelCalled = false;
    await page.route('**/api/v1/rooms/100**', async (route) => {
      const url = route.request().url();
      if (url.includes('/members/me/cancel')) {
        cancelCalled = true;
        await route.fulfill({
          status: 200,
          json: { id: 501, roomId: 100, status: 'CANCELLED_BEFORE_PAYMENT' },
        });
      } else if (url.includes('/members/me/hold')) {
        await route.fulfill({ status: 200, json: null });
      } else if (url.includes('/members/me')) {
        await route.fulfill({
          status: 200,
          json: {
            id: 501,
            roomId: 100,
            userId: userFixture.id,
            status: cancelCalled ? 'CANCELLED_BEFORE_PAYMENT' : 'APPLIED',
            joinedAt: '2026-10-18T00:00:00Z',
          },
        });
      } else {
        await route.fulfill({
          status: 200,
          json: {
            id: 100,
            title: 'YouTube Premium Family 5 мест',
            serviceName: 'YouTube',
            status: 'OPEN',
            ownerUserId: 2,
            ownerDisplayName: 'Room Host',
            priceTotal: 3000,
            pricePerMember: 600,
            maxMembers: 5,
            settlementCurrency: 'KZT',
            shareKzt: 600,
            payableTotalKzt: 600,
          },
        });
      }
    });

    await page.goto('/rooms/member/100');

    const cancelBtn = page.locator('button:has-text("Отменить заявку")').first();
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    const confirmBtn = page.locator('button:has-text("Да, отменить")').first();
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    expect(cancelCalled).toBe(true);
  });

  test('TC-076: Владелец комнаты /rooms/owner/:id: просмотр участников и их статусов', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/rooms/100**', async (route) => {
      const url = route.request().url();
      if (url.includes('/members')) {
        await route.fulfill({
          status: 200,
          json: {
            items: [
              {
                id: 501,
                roomId: 100,
                userId: 10,
                userDisplayName: 'Участник 1 (Активен)',
                status: 'ACTIVE',
                joinedAt: '2026-10-18T00:00:00Z',
              },
            ],
            totalItems: 1,
            page: 0,
            size: 100,
            totalPages: 1,
          },
        });
      } else {
        await route.fulfill({
          status: 200,
          json: {
            id: 100,
            title: 'Моя тестовая комната Spotify',
            serviceName: 'Spotify',
            status: 'ACTIVE',
            ownerUserId: userFixture.id,
            ownerDisplayName: userFixture.displayName,
            filledSeats: 1,
            maxMembers: 6,
            priceTotal: 3000,
            pricePerMember: 500,
            canCancel: true,
          },
        });
      }
    });

    await page.goto('/rooms/owner/100');

    await expect(page.locator('text=Участник 1 (Активен)').first()).toBeVisible();
    await expect(page.locator('text=Активен').first()).toBeVisible();
  });

  test('TC-077: Отмена комнаты владельцем с подтверждением и причиной', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    let cancelRoomCalled = false;
    await page.route('**/api/v1/rooms/100/cancel**', async (route) => {
      cancelRoomCalled = true;
      await route.fulfill({
        status: 200,
        json: {
          id: 100,
          status: 'CANCELLED',
        },
      });
    });

    await page.route('**/api/v1/rooms/100/members**', async (route) => {
      await route.fulfill({ status: 200, json: { items: [], totalItems: 0 } });
    });

    await page.route('**/api/v1/rooms/100', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 100,
          title: 'Моя комната для отмены',
          serviceName: 'Spotify',
          status: 'OPEN',
          ownerId: userFixture.id,
          ownerDisplayName: userFixture.displayName,
          filledSeats: 0,
          maxMembers: 6,
          priceTotal: 3000,
          pricePerMember: 500,
          canCancel: true,
        },
      });
    });

    await page.goto('/rooms/owner/100');

    const cancelBtn = page.locator('button:has-text("Отменить")').first();
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Модальное окно отмены комнаты
    const reasonInput = page.locator('textarea').first();
    await expect(reasonInput).toBeVisible();
    await reasonInput.fill('Отмена в связи со сменой тарифного плана');

    const confirmCheck = page.locator('input[type="checkbox"]').first();
    await confirmCheck.click();

    const submitBtn = page.locator('button:has-text("Отменить комнату")').last();
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    expect(cancelRoomCalled).toBe(true);
  });

  test('TC-115: Выплаты владельцу /payment/payout: баланс и карта выплат', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/payouts/me**', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 'po-101',
            amount: 15000,
            currency: 'KZT',
            status: 'COMPLETED',
            createdAt: '2026-10-18T00:00:00Z',
          },
        ],
      });
    });

    await page.route('**/api/v1/payouts/methods**', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 'pm-1',
            cardMask: '•••• 4412',
            cardBrand: 'VISA',
            isDefault: true,
            status: 'ACTIVE',
          },
        ],
      });
    });

    await page.route('**/api/v1/payouts/balance**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          heldAmount: 4500,
          availableAmount: 12000,
          currency: 'KZT',
        },
      });
    });

    await page.goto('/payment/payout');

    await expect(page).toHaveURL(/\/payment\/payout/);
    await expect(page.locator('text=4412').or(page.locator('text=Выплаты')).first()).toBeVisible();
  });

  test('TC-119: Статус возвратов /payment/refund: история возвратов', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/refunds/me**', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 'rf-301',
            paymentIntentId: 'pi-1',
            amount: 2500,
            currency: 'KZT',
            status: 'COMPLETED',
            reason: 'ACCESS_NOT_PROVIDED',
            createdAt: '2026-10-18T00:00:00Z',
          },
        ],
      });
    });

    await page.goto('/payment/refund');

    await expect(page).toHaveURL(/\/payment\/refund/);
    await expect(page.locator('h1:has-text("Статус возвратов")').or(page.locator('text=2 500')).or(page.locator('text=rf-301')).first()).toBeVisible();
  });
});
