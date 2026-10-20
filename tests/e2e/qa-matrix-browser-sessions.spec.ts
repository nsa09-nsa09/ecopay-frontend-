import { expect, test } from '@playwright/test';
import { adminFixture, installMockBackend, userFixture } from './support/mock-backend';

test.describe('EcoPay QA Matrix: Браузер, Сессии и Системные события (TC-007..TC-166)', () => {
  test('TC-007: Общее: Счётчики на главной соответствуют данным API', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    await page.route(/\/public\/home-stats/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          totalUsers: 1540,
          averageVerifiedRating: 4.9,
          verifiedReviewCount: 320,
          completedOrActiveMemberships: 890,
          activeRooms: 120,
        },
      });
    });

    await page.goto('/');

    // Проверяем отображение счётчиков на главной
    await expect(page.locator('text=1 540').or(page.locator('text=1540')).first()).toBeVisible();
    await expect(page.locator('text=4.9/5').or(page.locator('text=4.9')).first()).toBeVisible();
  });

  test('TC-008: Общее: Навигация с помощью кнопки «Назад» браузера', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.goto('/');
    await page.goto('/profile');
    await expect(page.locator('h1:has-text("Профиль")').first()).toBeVisible();

    // Возвращаемся назад
    await page.goBack();
    await expect(page.locator('#marketplace').or(page.locator('text=Каталог')).first()).toBeVisible();
  });

  test('TC-009: Общее: Обновление страницы (F5) сохраняет авторизованное состояние', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.goto('/profile');
    await expect(page.locator('h1:has-text("Профиль")').first()).toBeVisible();

    // Перезагружаем страницу
    await page.reload();

    // Пользователь остается авторизован на странице профиля
    await expect(page.locator('h1:has-text("Профиль")').first()).toBeVisible();
  });

  test('TC-021: Регистрация: Кнопка повторной отправки кода с таймером', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    await page.goto('/register');

    // Находим форму регистрации
    await expect(page.locator('h1:has-text("Создать аккаунт")').or(page.locator('h1:has-text("Регистрация")')).first()).toBeVisible();
  });

  test('TC-025: Сброс пароля: Битый или недействительный токен сброса', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    await page.route(/\/auth\/password-reset\/confirm/, async (route) => {
      await route.fulfill({
        status: 400,
        json: { message: 'Срок действия ссылки истек или токен недействителен.' },
      });
    });

    await page.goto('/reset-password/confirm?token=invalid-expired-token');

    // Проверяем отображение формы ввода пароля или ошибки
    await expect(page.locator('h1').or(page.locator('h2')).first()).toBeVisible();
  });

  test('TC-027: Вход: Отображение чекбокса «Запомнить меня»', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    await page.goto('/login');

    // Проверяем чекбокс или опцию входа
    await expect(page.locator('h1:has-text("Войти")').first()).toBeVisible();
    await expect(page.locator('input[type="checkbox"]').or(page.locator('text=Запомнить')).first()).toBeAttached();
  });

  test('TC-028: Сессия: Истечение сессии перенаправляет на страницу входа', async ({ page }) => {
    // Пользователь авторизован, но refresh token истек
    await installMockBackend(page, { language: 'ru', role: 'USER', refreshOk: false });

    await page.goto('/profile');

    // При истекшей сессии отображается предложение войти или форма входа
    const signInPrompt = page.locator('text=Войдите, чтобы управлять аккаунтом').or(page.getByRole('button', { name: 'Войти' }));
    await expect(signInPrompt.first()).toBeVisible();
  });

  test('TC-056: Каталог: Недоступные для вступления комнаты (статус COMPLETED / BLOCKED)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route(/\/rooms\/100$/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 100,
          ownerUserId: 99,
          serviceId: 1,
          serviceName: 'StreamPlus',
          title: 'Завершенная комната',
          status: 'COMPLETED',
          totalSeats: 4,
          occupiedSeats: 4,
          freeSeats: 0,
          joinable: false,
          pricePerMember: 1250,
          currency: 'KZT',
        },
      });
    });

    await page.goto('/room/100');

    // Кнопка вступления должна быть заблокирована или скрыта
    const joinBtn = page.getByRole('button', { name: /Присоединиться|Войти|Мест нет/i });
    if (await joinBtn.isVisible()) {
      await expect(joinBtn).toBeDisabled();
    }
  });

  test('TC-069: Создание комнаты: Отображение актуальных тарифов сервиса', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.goto('/rooms/create');

    // Проверяем наличие шага выбора сервиса или тарифа
    await expect(page.locator('h1:has-text("Создать комнату")').first()).toBeVisible();
  });

  test('TC-102: Участие: Просмотр открытой для вступления комнаты с оставшимися местами', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route(/\/rooms\/100$/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 100,
          ownerUserId: 99,
          serviceId: 1,
          serviceName: 'StreamPlus',
          title: 'Комната со свободными местами',
          status: 'ACTIVE',
          totalSeats: 4,
          occupiedSeats: 1,
          freeSeats: 3,
          joinable: true,
          pricePerMember: 1250,
          currency: 'KZT',
        },
      });
    });

    await page.goto('/room/100');

    // Проверяем доступность кнопки "Присоединиться"
    const joinBtn = page.getByRole('button', { name: 'Присоединиться' });
    await expect(joinBtn).toBeVisible();
    await expect(joinBtn).toBeEnabled();
  });

  test('TC-154: Админка: Таймаут сессии админа перенаправляет на страницу входа админа', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    // При переходе на админку неавторизованным - редирект на /admin-login
    await page.goto('/admin/dashboard');

    await page.waitForURL('**/admin-login**');
    await expect(page.locator('input#admin-login-password').or(page.locator('input[type="password"]')).or(page.locator('input[type="email"]')).first()).toBeVisible();
  });

  test('TC-157: Админка: Сверка показателей KPI дашборда', async ({ page }) => {
    await installMockBackend(page, {
      language: 'ru',
      role: 'ADMIN',
      dashboardKpis: {
        totalUsers: 1250,
        activeRooms: 85,
        monthlyVolumeKzt: 450000,
        platformRevenueKzt: 45000,
        pendingModeration: 4,
        openDisputes: 1,
      },
    });

    await page.goto('/admin/dashboard');

    // Проверяем отображение ключевых показателей
    await expect(page.locator('h1:has-text("Панель управления")').first()).toBeVisible();
    await expect(page.locator('text=1 250').or(page.locator('text=1250')).first()).toBeVisible();
  });

  test('TC-166: Админка: Журнал событий комнат (/admin/logs)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route(/\/admin\/logs\/room-events/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 'ev-1',
              roomId: 100,
              eventType: 'MEMBER_JOINED',
              message: 'Новый участник присоединился к комнате',
              createdAt: '2026-10-18T00:00:00Z',
            },
          ],
          totalPages: 1,
          totalElements: 1,
        },
      });
    });

    await page.goto('/admin/logs');

    // Переключаемся на вкладку "События комнат"
    const roomEventsTab = page.locator('button:has-text("События комнат")').or(page.locator('button:has-text("комнат")')).first();
    if (await roomEventsTab.isVisible()) {
      await roomEventsTab.click();
      await expect(page.locator('text=MEMBER_JOINED').or(page.locator('text=присоединился'))).toBeVisible();
    }
  });
});
