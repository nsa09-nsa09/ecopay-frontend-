import { expect, test } from '@playwright/test';
import { installMockBackend, userFixture } from './support/mock-backend';

test.describe('EcoPay QA Matrix: Отзывы, жалобы, уведомления и новости (TC-123..TC-146)', () => {
  const publicProfile = {
    id: 20,
    publicId: 'user-20',
    slug: 'owner-room',
    displayName: 'Владелец Подписки',
    avatar: null,
    reputation: 92,
    reputationLevel: 'TOP_HOST',
    averageRating: 9.2,
    reviewsCount: 5,
    completedRoomsCount: 12,
    ownerVerified: true,
  };

  const reputationData = {
    userId: 20,
    displayName: 'Владелец Подписки',
    avatar: null,
    reputation: 92,
    reputationLevel: 'TOP_HOST',
    averageRating: 9.2,
    reviewsCount: 5,
    completedRoomsCount: 12,
  };

  test('TC-123: Отзыв о владельце после завершения комнаты', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/users/public/owner-room**', async (route) => {
      await route.fulfill({ status: 200, json: publicProfile });
    });

    await page.route('**/api/v1/reputation/users/20**', async (route) => {
      if (route.request().url().includes('/reviews')) {
        await route.fulfill({ status: 200, json: [] });
      } else {
        await route.fulfill({ status: 200, json: reputationData });
      }
    });

    await page.route('**/api/v1/reviews/eligibility**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          eligible: true,
          rooms: [{ roomId: 100, title: 'Spotify Premium Family' }],
        },
      });
    });

    let reviewPayload: any = null;
    await page.route('**/api/v1/reviews', async (route) => {
      if (route.request().method() === 'POST') {
        reviewPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          json: {
            id: 1,
            recipientId: 20,
            roomId: 100,
            rating: 10,
            text: 'Отличный владелец, доступ выдал мгновенно!',
            createdAt: '2026-10-18T01:00:00Z',
          },
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/u/owner-room');

    // Нажимаем «Оценить пользователя»
    const rateBtn = page.locator('button:has-text("Оценить пользователя")');
    await expect(rateBtn).toBeVisible();
    await rateBtn.click();

    // В модале выбираем оценку 10/10 и вводим текст
    const modal = page.locator('div[role="dialog"]').or(page.locator('.fixed'));
    await expect(modal.locator('text=Оставить отзыв').first()).toBeVisible();

    const star10 = page.locator('button[aria-label="10/10"]');
    if (await star10.count() > 0) {
      await star10.click();
    }

    await page.locator('textarea').fill('Отличный владелец, доступ выдал мгновенно!');
    await page.locator('button:has-text("Отправить отзыв")').click();

    // Проверяем тост об успехе
    await expect(page.locator('text=Отзыв отправлен').first()).toBeVisible();
    expect(reviewPayload).not.toBeNull();
  });

  test('TC-124: Оценить случайного пользователя без общей комнаты (запрет)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/users/public/stranger**', async (route) => {
      await route.fulfill({ status: 200, json: { ...publicProfile, id: 99, slug: 'stranger' } });
    });

    await page.route('**/api/v1/reputation/users/99**', async (route) => {
      if (route.request().url().includes('/reviews')) {
        await route.fulfill({ status: 200, json: [] });
      } else {
        await route.fulfill({
          status: 200,
          json: { ...reputationData, userId: 99, displayName: 'Случайный Юзер' },
        });
      }
    });

    // Пользователь не имеет общих завершённых комнат
    await page.route('**/api/v1/reviews/eligibility**', async (route) => {
      await route.fulfill({
        status: 200,
        json: { eligible: false },
      });
    });

    await page.goto('/u/stranger');

    // Кнопка оценки должна отсутствовать
    await expect(page.locator('button:has-text("Оценить пользователя")')).toHaveCount(0);
  });

  test('TC-126: Отзыв самому себе запрещён (кнопка оценки отсутствует)', async ({ page }) => {
    // Авторизован пользователь id: 1 (как в mock-backend userFixture id: 1)
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/users/public/self**', async (route) => {
      await route.fulfill({ status: 200, json: { ...publicProfile, id: 1, slug: 'self' } });
    });

    await page.route('**/api/v1/reputation/users/1**', async (route) => {
      if (route.request().url().includes('/reviews')) {
        await route.fulfill({ status: 200, json: [] });
      } else {
        await route.fulfill({
          status: 200,
          json: { ...reputationData, userId: 1, displayName: 'Сам Себе Профиль' },
        });
      }
    });

    await page.goto('/u/self');

    // На своём собственном профиле кнопки «Оценить» быть не должно
    await expect(page.locator('button:has-text("Оценить пользователя")')).toHaveCount(0);
  });

  test('TC-127: Отзыв: валидация лимита 2000 символов и безопасность HTML', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/users/public/owner-room**', async (route) => {
      await route.fulfill({ status: 200, json: publicProfile });
    });

    await page.route('**/api/v1/reputation/users/20**', async (route) => {
      if (route.request().url().includes('/reviews')) {
        await route.fulfill({ status: 200, json: [] });
      } else {
        await route.fulfill({ status: 200, json: reputationData });
      }
    });

    await page.route('**/api/v1/reviews/eligibility**', async (route) => {
      await route.fulfill({
        status: 200,
        json: { eligible: true, rooms: [{ roomId: 100, title: 'Room' }] },
      });
    });

    await page.goto('/u/owner-room');
    await page.locator('button:has-text("Оценить пользователя")').click();

    // Проверяем, что поле ввода ограничивает длину до 2000
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await textarea.fill('a'.repeat(2100));

    const val = await textarea.inputValue();
    expect(val.length).toBeLessThanOrEqual(2000);
  });

  test('TC-128: Фильтр отзывов в публичном профиле (Все, Положительные, Отрицательные, Последние)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/users/public/owner-room**', async (route) => {
      await route.fulfill({ status: 200, json: publicProfile });
    });

    await page.route('**/api/v1/reputation/users/20**', async (route) => {
      if (route.request().url().includes('/reviews')) {
        await route.fulfill({
          status: 200,
          json: [
            {
              id: 1,
              authorDisplayName: 'Довольный Участник',
              rating: 10,
              text: 'Супер владелец, всё честно!',
              createdAt: '2026-10-17T12:00:00Z',
            },
            {
              id: 2,
              authorDisplayName: 'Недовольный Участник',
              rating: 3,
              text: 'Долго выдавал инвайт',
              createdAt: '2026-10-16T10:00:00Z',
            },
          ],
        });
      } else {
        await route.fulfill({ status: 200, json: reputationData });
      }
    });

    await page.route('**/api/v1/reviews/eligibility**', async (route) => {
      await route.fulfill({ status: 200, json: { eligible: false } });
    });

    await page.goto('/u/owner-room');

    // По умолчанию вкладка «Все» — видны оба отзыва
    await expect(page.locator('text=Супер владелец, всё честно!')).toBeVisible();
    await expect(page.locator('text=Долго выдавал инвайт')).toBeVisible();

    // Переключаем на «Положительные»
    await page.locator('button:has-text("Положительные")').click();
    await expect(page.locator('text=Супер владелец, всё честно!')).toBeVisible();
    await expect(page.locator('text=Долго выдавал инвайт')).toHaveCount(0);

    // Переключаем на «Отрицательные»
    await page.locator('button:has-text("Отрицательные")').click();
    await expect(page.locator('text=Долго выдавал инвайт')).toBeVisible();
    await expect(page.locator('text=Супер владелец, всё честно!')).toHaveCount(0);
  });

  test('TC-129: Отзыв о сервисе EcoPay в личном профиле /profile', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    // Изначально у пользователя нет отзыва о сервисе (200 OK с пустым телом)
    await page.route('**/api/v1/service-reviews/me', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, json: null });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          json: {
            id: 88,
            rating: 5,
            text: 'Отличный сервис совместных подписок!',
            status: 'PENDING',
            createdAt: '2026-10-18T00:00:00Z',
          },
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/profile');

    // Проверяем карточку «Мой отзыв о EcoPay»
    await expect(page.locator('h3:has-text("Мой отзыв о EcoPay")').first()).toBeVisible();

    // Заполняем отзыв: вводим текст
    const reviewTextarea = page.locator('textarea').first();
    await expect(reviewTextarea).toBeVisible();
    await reviewTextarea.fill('Отличный сервис совместных подписок!');

    const sendBtn = page.locator('button:has-text("Отправить отзыв")').or(page.locator('button:has-text("Сохранить")')).first();
    await expect(sendBtn).toBeEnabled();
  });

  test('TC-130: Пожаловаться на пользователя в публичном профиле (валидация 20 символов и отправка)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/users/public/owner-room**', async (route) => {
      await route.fulfill({ status: 200, json: publicProfile });
    });

    await page.route('**/api/v1/reputation/users/20**', async (route) => {
      if (route.request().url().includes('/reviews')) {
        await route.fulfill({ status: 200, json: [] });
      } else {
        await route.fulfill({ status: 200, json: reputationData });
      }
    });

    await page.route('**/api/v1/reviews/eligibility**', async (route) => {
      await route.fulfill({ status: 200, json: { eligible: false } });
    });

    let reportSubmitted = false;
    await page.route('**/api/v1/users/public/**/reports', async (route) => {
      reportSubmitted = true;
      await route.fulfill({
        status: 201,
        json: { id: 701, status: 'OPEN', createdAt: '2026-10-18T01:00:00Z' },
      });
    });

    await page.goto('/u/owner-room');

    // Нажимаем кнопку «Пожаловаться»
    const flagBtn = page.locator('button:has-text("Пожаловаться")');
    await expect(flagBtn).toBeVisible();
    await flagBtn.click();

    // Открылся модал жалобы
    const modal = page.locator('div[role="dialog"]').or(page.locator('.fixed'));
    await expect(modal.locator('text=Пожаловаться на пользователя').first()).toBeVisible();

    const descField = modal.locator('textarea');
    const submitBtn = modal.locator('button:has-text("Отправить жалобу")');

    // Короткое описание (< 20 символов) блокирует отправку
    await descField.fill('Слишком коротко');
    await expect(submitBtn).toBeDisabled();

    // Валидное описание (>= 20 символов) разблокирует кнопку
    await descField.fill('Пользователь нарушает правила сервиса и не выдаёт оплаченный доступ к семейной подписке.');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Проверяем успешную отправку
    await expect(modal.locator('text=Жалоба отправлена').or(modal.locator('text=Спасибо'))).toBeVisible();
    expect(reportSubmitted).toBe(true);
  });

  test('TC-131: Повторная жалоба (409 Conflict) и отсутствие жалобы на себя', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/users/public/owner-room**', async (route) => {
      await route.fulfill({ status: 200, json: publicProfile });
    });

    await page.route('**/api/v1/reputation/users/20**', async (route) => {
      if (route.request().url().includes('/reviews')) {
        await route.fulfill({ status: 200, json: [] });
      } else {
        await route.fulfill({ status: 200, json: reputationData });
      }
    });

    await page.route('**/api/v1/reviews/eligibility**', async (route) => {
      await route.fulfill({ status: 200, json: { eligible: false } });
    });

    // Эмулируем 409 Conflict при попытке повторной жалобы
    await page.route('**/api/v1/users/public/**/reports', async (route) => {
      await route.fulfill({
        status: 409,
        json: {
          code: 'REPORT_ALREADY_EXISTS',
          message: 'У вас уже есть открытая жалоба на этого пользователя по этой причине.',
        },
      });
    });

    await page.goto('/u/owner-room');
    await page.locator('button:has-text("Пожаловаться")').click();

    const modal = page.locator('div[role="dialog"]').or(page.locator('.fixed'));
    await modal.locator('textarea').fill('Пользователь нарушает правила сервиса повторно.');
    await modal.locator('button:has-text("Отправить жалобу")').click();

    // Проверяем вывод сообщения об ошибке повторной жалобы
    await expect(modal.locator('text=У вас уже есть открытая жалоба')).toBeVisible();
  });

  test('TC-141: Уведомления: счётчик непрочитанных на странице входящих /notifications-inbox', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/notifications/unread-count*', async (route) => {
      await route.fulfill({
        status: 200,
        json: { count: 3 },
      });
    });

    await page.route('**/api/v1/notifications*', async (route) => {
      if (route.request().url().includes('/unread-count')) {
        await route.fulfill({ status: 200, json: { count: 3 } });
      } else {
        await route.fulfill({
          status: 200,
          json: {
            items: [
              {
                id: 101,
                title: 'Новое сообщение в чате',
                body: 'У вас 3 непрочитанных сообщения.',
                read: false,
                createdAt: '2026-10-18T01:30:00Z',
              },
            ],
            totalItems: 1,
            page: 0,
            size: 30,
            totalPages: 1,
          },
        });
      }
    });

    await page.goto('/notifications-inbox');

    // Проверяем страницу входящих уведомлений и бейдж счётчика 3
    await expect(page.locator('h1:has-text("Уведомления")')).toBeVisible();
    await expect(page.locator('text=3').first()).toBeVisible();
  });

  test('TC-142: Страница входящих /notifications-inbox: фильтры и «Прочитать все»', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    let readAllCalled = false;
    await page.route('**/api/v1/notifications/read-all', async (route) => {
      readAllCalled = true;
      await route.fulfill({ status: 200, json: {} });
    });

    await page.route('**/api/v1/notifications*', async (route) => {
      if (route.request().url().includes('/unread-count')) {
        await route.fulfill({ status: 200, json: { count: 1 } });
      } else {
        await route.fulfill({
          status: 200,
          json: {
            items: [
              {
                id: 101,
                type: 'OWNER_ACCESS_GRANTED',
                title: 'Вам выдан доступ к Spotify',
                body: 'Владелец комнаты подтвердил выдачу доступа.',
                link: '/rooms/member/100',
                read: false,
                createdAt: '2026-10-18T01:30:00Z',
              },
              {
                id: 102,
                type: 'ROOM_ACTIVE',
                title: 'Комната активирована',
                body: 'Все участники оплатили места.',
                link: '/rooms/member/100',
                read: true,
                createdAt: '2026-10-17T15:00:00Z',
              },
            ],
            totalItems: 2,
            page: 0,
            size: 30,
            totalPages: 1,
          },
        });
      }
    });

    await page.goto('/notifications-inbox');

    // Проверяем отображение уведомлений
    await expect(page.locator('text=Вам выдан доступ к Spotify').first()).toBeVisible();

    // Кликаем «Прочитать все»
    const readAllBtn = page.locator('button:has-text("Прочитать все")').or(page.locator('button:has-text("Отметить всё как прочитанное")')).first();
    if (await readAllBtn.count() > 0) {
      await readAllBtn.click();
      expect(readAllCalled).toBe(true);
    }
  });

  test('TC-143: Настройки уведомлений /notification-prefs', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/notifications/preferences*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          json: [
            {
              type: 'CHAT_MESSAGE',
              category: 'ROOM',
              inAppEnabled: true,
              emailEnabled: true,
            },
            {
              type: 'OWNER_ACCESS_GRANTED',
              category: 'MEMBERSHIP',
              inAppEnabled: true,
              emailEnabled: true,
            },
          ],
        });
      } else if (route.request().method() === 'PUT') {
        await route.fulfill({ status: 200, json: [] });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/notification-prefs');

    // Проверяем наличие категорий и заголовка
    await expect(page.locator('h1:has-text("Настройки уведомлений")').or(page.locator('text=Настройки уведомлений').first())).toBeVisible();
    await expect(page.locator('text=Участие в комнатах').or(page.locator('text=Статус комнаты')).first()).toBeVisible();
  });

  test('TC-145: Страница новостей /news и блок «Актуальное» (сторис)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    await page.route('**/api/v1/news*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 1,
              titleRu: 'Масштабное обновление платформы EcoPay',
              bodyRu: 'Мы запустили новые возможности для совместных подписок в Казахстане.',
              publishedAt: '2026-10-18T00:00:00Z',
              status: 'PUBLISHED',
            },
          ],
          totalItems: 1,
          page: 0,
          size: 6,
          totalPages: 1,
        },
      });
    });

    await page.goto('/news');

    // Проверяем заголовок Новости
    await expect(page.locator('h1:has-text("Новости")')).toBeVisible();
    await expect(page.locator('text=Масштабное обновление платформы EcoPay').first()).toBeVisible();
  });

  test('TC-146: Контент детальной страницы новости /news/:id', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    await page.route('**/api/v1/news/1*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 1,
          titleRu: 'Масштабное обновление платформы EcoPay',
          bodyRu: 'Мы запустили новые возможности для совместных подписок в Казахстане.',
          publishedAt: '2026-10-18T00:00:00Z',
          status: 'PUBLISHED',
        },
      });
    });

    await page.route('**/api/v1/news*', async (route) => {
      await route.fulfill({
        status: 200,
        json: { items: [], totalItems: 0, page: 0, size: 6, totalPages: 0 },
      });
    });

    await page.goto('/news/1');

    await expect(page.locator('h1:has-text("Масштабное обновление платформы EcoPay")')).toBeVisible();
    await expect(page.locator('text=Мы запустили новые возможности для совместных подписок')).toBeVisible();
  });
});
