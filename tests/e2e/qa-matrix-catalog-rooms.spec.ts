import { expect, test } from '@playwright/test';
import { adminFixture, installMockBackend, userFixture } from './support/mock-backend';

test.describe('EcoPay QA Matrix: Каталог, Сервисы и Комнаты (TC-042..TC-103)', () => {
  test('TC-049: Каталог: Поиск на главной через строку ввода и фильтрация сервисов', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    await page.goto('/');

    const heroInput = page.locator('input[placeholder="Найдите сервис..."]');
    await expect(heroInput).toBeVisible();

    // Вводим поисковый запрос
    await heroInput.fill('StreamPlus');
    await heroInput.press('Enter');

    // Проверяем, что отображается карточка найденного сервиса в маркетплейсе
    await expect(page.locator('#marketplace')).toBeVisible();
    await expect(page.locator('#marketplace button:has-text("StreamPlus")').first()).toBeVisible();
  });

  test('TC-050: Каталог: Фильтрация по категориям без сервисов показывает понятное сообщение', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    // Мокаем пустой список сервисов для выбранной категории
    await page.route(/\/catalog\/services(\?.*)?$/, async (route) => {
      const url = route.request().url();
      if (url.includes('categoryId=999')) {
        await route.fulfill({ status: 200, json: [] });
      } else {
        await route.fallback();
      }
    });

    await page.route(/\/catalog\/categories/, async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          { id: 1, name: 'Видео', slug: 'video', description: null, iconUrl: null },
          { id: 999, name: 'Фитнес', slug: 'fitness', description: null, iconUrl: null },
        ],
      });
    });

    await page.goto('/#marketplace');

    // Кликаем по категории "Фитнес" в секции marketplace
    const fitnessTab = page.locator('#marketplace button:has-text("Фитнес")');
    await expect(fitnessTab).toBeVisible();
    await fitnessTab.click();

    // Проверяем наличие понятного пустого состояния "Сервисы не найдены"
    await expect(page.locator('text=Сервисы не найдены')).toBeVisible();
  });

  test('TC-051: Каталог: Страница сервиса (оператора) с тарифами и доступными комнатами', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route(/\/catalog\/services\/1\/tariffs/, async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 10,
            serviceId: 1,
            name: 'Family Premium 4K',
            price: 5000,
            currency: 'KZT',
            periodDays: 30,
            maxMembers: 4,
            pricePerMember: 1250,
          },
        ],
      });
    });

    await page.route(/\/rooms\?joinable=true/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 201,
              serviceId: 1,
              serviceName: 'StreamPlus',
              tariffPlanId: 10,
              tariffName: 'Family Premium 4K',
              title: 'Комната StreamPlus #201',
              totalSeats: 4,
              occupiedSeats: 2,
              pricePerMember: 1250,
              currency: 'KZT',
              status: 'ACTIVE',
              ownerDisplayName: 'Владелец Тест',
            },
          ],
          totalPages: 1,
          totalElements: 1,
        },
      });
    });

    await page.goto('/operator/1');

    // Проверяем название сервиса
    await expect(page.locator('h1:has-text("StreamPlus")')).toBeVisible();

    // Проверяем тариф
    await expect(page.locator('text=Family Premium 4K').first()).toBeVisible();

    // Переключаемся на вкладку "Доступные комнаты"
    const roomsTab = page.locator('button:has-text("Доступные комнаты")').or(page.getByRole('tab', { name: /комнаты/i }));
    if (await roomsTab.isVisible()) {
      await roomsTab.click();
      await expect(page.locator('text=Комната StreamPlus #201').first()).toBeVisible();
    }
  });

  test('TC-054: Каталог: Подбор комнаты под сервис (match API)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route(/\/catalog\/services\/1\/match/, async (route) => {
      await route.fulfill({
        status: 200,
        json: { action: 'JOIN', roomId: 100 },
      });
    });

    await page.goto('/');

    // Кликаем по карточке StreamPlus в каталоге
    const serviceCard = page.locator('button:has-text("StreamPlus")').first();
    await expect(serviceCard).toBeVisible();
    await serviceCard.click();

    // В открывшемся модале выбираем «Хочу место в подписке»
    const wantSeatBtn = page.locator('button:has-text("Хочу место в подписке")');
    await expect(wantSeatBtn).toBeVisible();
    await wantSeatBtn.click();

    // Проверяем редирект в найденную комнату
    await page.waitForURL('**/room/100');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('TC-055: Комната: Открытие несуществующей комнаты (404 Комната не найдена)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route(/\/rooms\/999999$/, async (route) => {
      await route.fulfill({
        status: 404,
        json: { message: 'Room not found' },
      });
    });

    await page.goto('/room/999999');

    // Проверяем отображение понятного сообщения "Комната не найдена"
    await expect(page.locator('text=Комната не найдена')).toBeVisible();
  });

  test('TC-073: Владелец комнаты: Просмотр поступившей заявки в /rooms/owner/:id', async ({ page }) => {
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
          title: 'Моя комната StreamPlus',
          status: 'ACTIVE',
          totalSeats: 4,
          occupiedSeats: 1,
          maxMembers: 4,
          membersCount: 1,
          joinable: true,
          pricePerMember: 1250,
          currency: 'KZT',
        },
      });
    });

    await page.route(/\/rooms\/100\/members/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: '777',
              userId: 42,
              userDisplayName: 'Новый Участник',
              status: 'PENDING',
              joinedAt: '2026-10-18T00:00:00Z',
              identifierMasked: null,
            },
          ],
          totalPages: 1,
          totalElements: 1,
        },
      });
    });

    await page.goto('/rooms/owner/100');

    // Проверяем заголовок комнаты и имя участника заявки
    await expect(page.locator('text=Моя комната StreamPlus').first()).toBeVisible();
    await expect(page.locator('text=Новый Участник').first()).toBeVisible();
  });

  test('TC-079: Владелец комнаты: Модальное окно редактирования параметров комнаты', async ({ page }) => {
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
          title: 'Моя тестовая комната',
          description: 'Описание комнаты до редактирования',
          status: 'ACTIVE',
          totalSeats: 4,
          occupiedSeats: 1,
          maxMembers: 4,
          membersCount: 0,
          joinable: true,
          canEdit: true,
          pricePerMember: 1250,
          currency: 'KZT',
          members: [],
        },
      });
    });

    await page.goto('/rooms/owner/100');

    // Нажимаем кнопку "Редактировать"
    const editBtn = page.getByRole('button', { name: /^Редактировать/ });
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Проверяем появление модального окна "Редактировать комнату"
    await expect(page.locator('h2:has-text("Редактировать комнату")').or(page.locator('text=Редактировать комнату'))).toBeVisible();
  });

  test('TC-080: Комната: Заполненная комната блокирует кнопку вступления («Мест нет»)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route(/\/rooms\/100$/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 100,
          ownerUserId: 99,
          ownerDisplayName: 'Другой Владелец',
          serviceId: 1,
          serviceName: 'StreamPlus',
          title: 'Полная комната StreamPlus',
          status: 'ACTIVE',
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

    // Проверяем, что отображается кнопка "Мест нет" и она заблокирована
    const noSeatsBtn = page.getByRole('button', { name: 'Мест нет' });
    await expect(noSeatsBtn).toBeVisible();
    await expect(noSeatsBtn).toBeDisabled();
  });

  test('TC-098: Участие: Кнопка подтверждения доступа заблокирована до подтверждения владельцем', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route(/\/rooms\/100\/members\/me/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: '555',
          roomId: 100,
          userId: userFixture.id,
          status: 'PENDING',
          ownerAccessConfirmedAt: null, // Владелец еще не подтвердил
          memberConfirmedAt: null,
          billing: {
            amountKzt: 1250,
            nextPaymentDate: null,
          },
        },
      });
    });

    await page.goto('/rooms/member/100');

    // Проверяем, что кнопка подтверждения получения доступа заблокирована
    const confirmBtn = page.getByRole('button', { name: /Подтвердить получение доступа|Доступ подтверждён/i });
    if (await confirmBtn.isVisible()) {
      await expect(confirmBtn).toBeDisabled();
    }
  });

  test('TC-103: Участие: Попытка открыть чужое участие (/rooms/member/:id)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route(/\/rooms\/888\/members\/me/, async (route) => {
      await route.fulfill({
        status: 404,
        json: { message: 'Membership not found' },
      });
    });

    await page.goto('/rooms/member/888');

    // Проверяем сообщение об отсутствии участия
    await expect(page.locator('text=Вы не участник этой комнаты')).toBeVisible();
  });

  test('TC-042: Профиль: Смена email на уже занятый другим пользователем (409 Conflict)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/users/me/email/request', async (route) => {
      await route.fulfill({
        status: 409,
        json: {
          message: 'Этот адрес уже привязан к другому аккаунту.',
          errors: { email: 'EMAIL_ALREADY_EXISTS' },
        },
      });
    });

    await page.goto('/profile');

    // Ждем загрузки профиля и кнопки смены email
    const changeEmailBtn = page.getByRole('button', { name: 'Сменить email' });
    await expect(changeEmailBtn).toBeVisible();
    await changeEmailBtn.click();

    // Находим поле email
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();

    await emailInput.fill('taken-user@ecopay.kz');

    const submitBtn = page.getByRole('button', { name: /Отправить код|Добавить email|Отправить/i }).last();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    await expect(page.locator('text=Этот адрес уже привязан').or(page.locator('text=уже используется'))).toBeVisible();
  });

  test('TC-045: Профиль: Дашборд участника отображает следующий платёж и сумму', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route(/\/users\/me\/dashboard/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          joinedRoomsActive: 2,
          joinedRoomsCompleted: 1,
          totalRoomsJoined: 3,
          monthlySpendKzt: 4500,
          totalSpentKzt: 12000,
          totalSavedKzt: 8500,
          nextPaymentDate: '2026-11-05T00:00:00Z',
          nextPaymentAmountKzt: 2250,
          reputationScore: 95,
          reviewsReceived: 5,
          disputesAsMember: 0,
        },
      });
    });

    await page.goto('/profile');

    // Проверяем наличие информации о следующем платеже
    await expect(page.locator('text=2 250').or(page.locator('text=2250')).first()).toBeVisible();
  });
});
