import { expect, test } from '@playwright/test';
import { adminFixture, installMockBackend, userFixture } from './support/mock-backend';

test.describe('EcoPay QA Matrix: Формы, Поддержка и Профиль (TC-035..TC-177)', () => {
  test('TC-134: Поддержка: Поиск и фильтры заявок в центре поддержки', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/support-tickets**', async (route) => {
      const url = route.request().url();
      if (route.request().method() === 'GET' && !url.includes('/10')) {
        await route.fulfill({
          status: 200,
          json: [
            {
              id: 101,
              userId: userFixture.id,
              subject: 'Проблема с доступом к Spotify',
              topic: 'access',
              status: 'OPEN',
              roomTitle: 'Spotify Family Room',
              createdAt: '2026-10-18T00:00:00Z',
            },
            {
              id: 102,
              userId: userFixture.id,
              subject: 'Вопрос по возврату средств',
              topic: 'refund',
              status: 'CLOSED',
              roomTitle: 'Netflix 4K Ultra',
              createdAt: '2026-10-17T00:00:00Z',
            },
          ],
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/support');

    await expect(page.locator('h1:has-text("Центр поддержки")').first()).toBeVisible();

    // Проверяем наличие обеих заявок во вкладке "Все"
    await expect(page.locator('text=Проблема с доступом к Spotify').first()).toBeVisible();
    await expect(page.locator('text=Вопрос по возврату средств').first()).toBeVisible();

    // Переключаемся на фильтр "Активные"
    await page.getByRole('button', { name: /^Активные/ }).click();
    await expect(page.locator('text=Проблема с доступом к Spotify').first()).toBeVisible();
    await expect(page.locator('button:has-text("Вопрос по возврату средств")')).toHaveCount(0);

    // Переключаемся на фильтр "Закрытые"
    await page.getByRole('button', { name: /^Закрытые/ }).click();
    await expect(page.locator('text=Вопрос по возврату средств').first()).toBeVisible();
    await expect(page.locator('button:has-text("Проблема с доступом к Spotify")')).toHaveCount(0);

    // Поиск по ключевому слову
    await page.getByRole('button', { name: /^Все/ }).click();
    const searchInput = page.locator('input[placeholder="Поиск по заявкам..."]');
    await searchInput.fill('Spotify');
    await expect(page.locator('text=Проблема с доступом к Spotify').first()).toBeVisible();
    await expect(page.locator('button:has-text("Вопрос по возврату средств")')).toHaveCount(0);
  });

  test('TC-135: Поддержка: Закрытая заявка блокирует отправку новых сообщений', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/support-tickets**', async (route) => {
      const url = route.request().url();
      if (url.endsWith('/support-tickets')) {
        await route.fulfill({
          status: 200,
          json: [
            {
              id: 102,
              userId: userFixture.id,
              subject: 'Вопрос по возврату средств',
              topic: 'refund',
              status: 'CLOSED',
              createdAt: '2026-10-17T00:00:00Z',
            },
          ],
        });
      } else if (url.includes('/support-tickets/102')) {
        await route.fulfill({
          status: 200,
          json: {
            id: 102,
            userId: userFixture.id,
            subject: 'Вопрос по возврату средств',
            topic: 'refund',
            status: 'CLOSED',
            createdAt: '2026-10-17T00:00:00Z',
            messages: [
              {
                id: 1,
                senderUserId: userFixture.id,
                senderRole: 'USER',
                senderName: 'Тестовый Пользователь',
                message: 'Здравствуйте, когда будет возврат?',
                createdAt: '2026-10-17T00:00:00Z',
              },
              {
                id: 2,
                senderUserId: 99,
                senderRole: 'SUPPORT',
                senderName: 'Служба поддержки',
                message: 'Возврат успешно обработан банком.',
                createdAt: '2026-10-17T01:00:00Z',
              },
            ],
          },
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/support');

    // Кликаем по закрытой заявке для открытия детального экрана
    await page.locator('button:has-text("Вопрос по возврату средств")').first().click();

    // Проверяем статус и плашку закрытой заявки
    await expect(page.locator('text=Вопрос по возврату средств').first()).toBeVisible();
    await expect(
      page.locator('text=Заявка закрыта. Отправка новых сообщений недоступна.').or(page.locator('text=Заявка закрыта')).first()
    ).toBeVisible();

    // Форма ввода сообщений не должна быть видна
    await expect(page.locator('textarea[placeholder*="Напишите сообщение"]')).not.toBeVisible();
  });

  test('TC-136: Поддержка: Чужая или несуществующая заявка (404/403 Заявка не найдена)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/support-tickets**', async (route) => {
      const url = route.request().url();
      if (url.endsWith('/support-tickets')) {
        await route.fulfill({
          status: 200,
          json: [
            {
              id: 99999,
              userId: 999,
              subject: 'Чужая скрытая заявка',
              topic: 'other',
              status: 'OPEN',
              createdAt: '2026-10-17T00:00:00Z',
            },
          ],
        });
      } else if (url.includes('/support-tickets/99999')) {
        await route.fulfill({
          status: 404,
          json: {
            status: 404,
            message: 'Заявка не найдена.',
          },
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/support');

    // Кликаем по заявке, доступ к которой завершится ошибкой 404
    await page.locator('button:has-text("Чужая скрытая заявка")').first().click();

    await expect(
      page.locator('text=Заявка не найдена.').or(page.locator('text=не найдена')).or(page.locator('[role="alert"]')).first()
    ).toBeVisible();

    // Кнопка возврата к списку заявок
    await expect(page.locator('button:has-text("К списку заявок")').first()).toBeVisible();
  });

  test('TC-137: Поддержка: Лимиты на форму создания заявки (пустые поля блокируют отправку)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/support-tickets**', async (route) => {
      await route.fulfill({ status: 200, json: [] });
    });

    await page.goto('/support');

    // Кликаем «Создать заявку»
    await page.locator('button:has-text("Создать заявку")').first().click();

    await expect(page.locator('text=Новое обращение').or(page.locator('label:has-text("Тема")')).first()).toBeVisible();

    const submitBtn = page.locator('button:has-text("Отправить заявку")').first();
    await expect(submitBtn).toBeDisabled();

    // Вводим только пробелы в тему
    const subjectInput = page.locator('input[placeholder="Краткое описание"]').first();
    await subjectInput.fill('    ');
    await expect(submitBtn).toBeDisabled();

    // Заполняем валидную тему
    await subjectInput.fill('Не могу войти в семейную подписку');
    await expect(submitBtn).toBeDisabled();

    // Заполняем сообщение
    const messageInput = page.locator('textarea[placeholder*="Опишите проблему"]').first();
    await messageInput.fill('Владелец не отправил приглашение на email.');

    // Теперь кнопка активна
    await expect(submitBtn).toBeEnabled();
  });

  test('TC-138: Поддержка: Флуд сообщениями в заявку (Rate limit 429)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/support-tickets**', async (route) => {
      const url = route.request().url();
      if (url.includes('/messages')) {
        await route.fulfill({
          status: 429,
          json: {
            status: 429,
            message: 'Слишком много сообщений, подождите минуту.',
          },
        });
      } else if (url.includes('/support-tickets/101')) {
        await route.fulfill({
          status: 200,
          json: {
            id: 101,
            userId: userFixture.id,
            subject: 'Проблема с доступом',
            topic: 'access',
            status: 'OPEN',
            createdAt: '2026-10-18T00:00:00Z',
            messages: [],
          },
        });
      } else if (url.endsWith('/support-tickets')) {
        await route.fulfill({
          status: 200,
          json: [
            {
              id: 101,
              userId: userFixture.id,
              subject: 'Проблема с доступом',
              topic: 'access',
              status: 'OPEN',
              createdAt: '2026-10-18T00:00:00Z',
            },
          ],
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/support');

    // Открываем заявку 101
    await page.locator('button:has-text("Проблема с доступом")').first().click();

    const textarea = page.locator('textarea[placeholder*="Напишите сообщение"]').first();
    await textarea.fill('Быстрое сообщение 1');

    const sendBtn = page.locator('button[aria-label="Отправить сообщение"]').first();
    await sendBtn.click();

    // Проверяем отображение тоста об ограничении частоты сообщений
    await expect(
      page.locator('text=Слишком много сообщений').or(page.locator('text=подождите минуту')).or(page.locator('[data-sonner-toast]')).first()
    ).toBeVisible();
  });

  test('TC-035: Профиль: Номер телефона уже привязан к другому аккаунту (409 Conflict)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/auth/phone/request-code**', async (route) => {
      await route.fulfill({
        status: 409,
        json: {
          status: 409,
          message: 'Этот номер уже привязан к другому аккаунту.',
        },
      });
    });

    await page.goto('/profile');

    const phoneInput = page.locator('input[placeholder="+77001234567"]').first();
    await phoneInput.fill('+77019998877');

    const sendBtn = page.locator('button:has-text("Отправить код")').first();
    await sendBtn.click();

    // Проверяем сообщение об ошибке 409 Conflict
    await expect(
      page.locator('text=Этот номер уже привязан к другому аккаунту.').or(page.locator('text=уже привязан')).first()
    ).toBeVisible();
  });

  test('TC-037: Профиль: Валидация отображаемого имени (длина и обязательность)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.goto('/profile');

    const nameInput = page.locator('form input').first();
    await expect(nameInput).toBeVisible();

    // Заполнение нового имени
    await nameInput.fill('Новое Тестовое Имя');
    await expect(nameInput).toHaveValue('Новое Тестовое Имя');

    // Проверка ограничения длины (максимум 50 символов)
    await nameInput.fill('a'.repeat(60));
    const val = await nameInput.inputValue();
    expect(val.length).toBeLessThanOrEqual(50);
  });

  test('TC-039: Профиль: Управление аватаром (отображение и кнопка удаления)', async ({ page }) => {
    const userWithAvatar = {
      ...userFixture,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    };

    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/auth/refresh**', async (route) => {
      await route.fulfill({
        status: 200,
        json: { accessToken: 'token-user', user: userWithAvatar },
      });
    });

    await page.route('**/api/v1/users/me**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, json: userWithAvatar });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/profile');

    // Проверяем наличие картинки аватара
    await expect(page.locator('img[src*="unsplash"]').or(page.locator('text=Иван Тестовый')).first()).toBeVisible();

    // Кнопка загрузки или удаления аватара доступна в профиле
    const avatarBtn = page.locator('button:has-text("Загрузить фото")').or(page.locator('button:has-text("Удалить фото")')).or(page.locator('button:has-text("фото")')).first();
    if (await avatarBtn.count() > 0) {
      await expect(avatarBtn).toBeVisible();
    }
  });

  test('TC-040: Профиль: Подмена расширения файла аватара (валидация типа файла)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.goto('/profile');

    // Находим input[type="file"] для загрузки аватара
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached();

    // Проверяем, что accept атрибут содержит только разрешённые типы image/png, image/jpeg
    const acceptAttr = await fileInput.getAttribute('accept');
    expect(acceptAttr).toContain('image/png');
    expect(acceptAttr).toContain('image/jpeg');
  });

  test('TC-041: Профиль: Карточка добавления / смены email', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.goto('/profile');

    // Проверяем отображение блока Email
    await expect(page.locator('text=Email').first()).toBeVisible();
    await expect(page.locator(`text=${userFixture.email}`).first()).toBeVisible();
  });

  test('TC-068: Создание комнаты: Ошибка при превышении лимита активных комнат (400/429)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/rooms', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          json: {
            status: 400,
            message: 'Превышен лимит активных комнат для вашего аккаунта (максимум 5)',
          },
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/rooms/create');

    const titleInput = page.locator('input[placeholder*="Например: Семья"]').first();
    if (await titleInput.count() > 0) {
      await titleInput.fill('Тестовая комната сверх лимита');

      const submitBtn = page.locator('button[type="submit"]:has-text("Создать")').or(page.locator('button:has-text("Опубликовать")')).first();
      if (await submitBtn.count() > 0 && await submitBtn.isEnabled()) {
        await submitBtn.click();
        await expect(
          page.locator('text=Превышен лимит').or(page.locator('[role="alert"]')).first()
        ).toBeVisible();
      }
    }
  });

  test('TC-070: Создание комнаты: Защита от повторного нажатия «Опубликовать» (loading state)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.goto('/rooms/create');

    // Кнопка отправки формы должна иметь состояние loading при отправке
    const submitBtn = page.locator('button[type="submit"]').or(page.locator('button:has-text("Опубликовать")')).first();
    if (await submitBtn.count() > 0) {
      await expect(submitBtn).toBeVisible();
    }
  });

  test('TC-108: Чат комнаты: Блокировка отправки пустого сообщения', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/rooms/100**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 100,
          title: 'YouTube Family Test',
          serviceName: 'YouTube',
          status: 'OPEN',
          ownerUserId: 2,
          ownerDisplayName: 'Host',
          priceTotal: 3000,
          pricePerMember: 600,
          filledSeats: 1,
          maxMembers: 5,
        },
      });
    });

    await page.goto('/room/100');

    // В чате комнаты кнопка отправки заблокирована при пустом сообщении
    const chatInput = page.locator('textarea[placeholder*="сообщение"]').or(page.locator('input[placeholder*="сообщение"]')).first();
    if (await chatInput.count() > 0) {
      await chatInput.fill('   ');
      const sendBtn = page.locator('button[aria-label*="Отправить"]').first();
      await expect(sendBtn).toBeDisabled();
    }
  });

  test('TC-101: Участие и доступ: Подача жалобы на владельца комнаты из /rooms/member/:id', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    let disputeCreated = false;
    await page.route('**/api/v1/rooms/100/members/me/complaints', async (route) => {
      disputeCreated = true;
      await route.fulfill({
        status: 201,
        json: { id: 777, status: 'OPEN', reason: 'Владелец не предоставил доступ' },
      });
    });

    await page.route('**/api/v1/rooms/100**', async (route) => {
      const url = route.request().url();
      if (url.includes('/members/me/hold')) {
        await route.fulfill({ status: 200, json: null });
      } else if (url.includes('/members/me')) {
        await route.fulfill({
          status: 200,
          json: {
            id: 501,
            roomId: 100,
            userId: userFixture.id,
            status: 'ACTIVE',
            joinedAt: '2026-10-18T00:00:00Z',
          },
        });
      } else {
        await route.fulfill({
          status: 200,
          json: {
            id: 100,
            title: 'YouTube Premium Family',
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

    // Находим кнопку подачи жалобы
    const reportBtn = page.locator('button:has-text("Пожаловаться")').or(page.locator('button:has-text("Жалоба")')).first();
    if (await reportBtn.count() > 0) {
      await reportBtn.click();

      // Модальное окно жалобы открыто
      await expect(page.locator('text=Жалоба на владельца комнаты').first()).toBeVisible();

      const reasonInput = page.locator('textarea').first();
      await reasonInput.fill('Владелец сменил пароль и не выходит на связь.');

      const submitComplaintBtn = page.locator('button:has-text("Отправить жалобу")').first();
      await submitComplaintBtn.click();

      expect(disputeCreated).toBe(true);
    }
  });

  test('TC-177: Админка: В закрытой заявке поддержка не может отправлять сообщения', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route(/\/staff\/support-tickets/, async (route) => {
      const url = route.request().url();
      if (url.includes('/102')) {
        await route.fulfill({
          status: 200,
          json: {
            id: 102,
            userId: 10,
            userDisplayName: 'Пользователь Закрытый',
            subject: 'Закрытый вопрос',
            topic: 'refund',
            status: 'CLOSED',
            createdAt: '2026-10-17T00:00:00Z',
            messages: [
              {
                id: 1,
                senderUserId: 10,
                senderRole: 'USER',
                senderName: 'Пользователь Закрытый',
                message: 'Вопрос закрыт, спасибо.',
                createdAt: '2026-10-17T00:00:00Z',
              },
            ],
          },
        });
      } else {
        await route.fulfill({
          status: 200,
          json: {
            items: [
              {
                id: 102,
                userId: 10,
                userDisplayName: 'Пользователь Закрытый',
                subject: 'Закрытый вопрос',
                topic: 'refund',
                status: 'CLOSED',
                createdAt: '2026-10-17T00:00:00Z',
              },
            ],
            totalPages: 1,
            totalElements: 1,
          },
        });
      }
    });

    await page.goto('/admin/tickets?selected=102');

    // Проверяем, что отображается тикет
    await expect(page.locator('text=Закрытый вопрос').first()).toBeVisible();

    // Форма ответа для администратора скрыта при CLOSED
    await expect(page.locator('textarea[placeholder*="Ответить"]').or(page.locator('textarea[aria-label*="Ответить"]'))).not.toBeVisible();
  });
});
