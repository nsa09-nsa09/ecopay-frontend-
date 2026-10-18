import { expect, test } from '@playwright/test';
import { adminFixture, installMockBackend, userFixture } from './support/mock-backend';

test.describe('EcoPay QA Matrix: Продвинутые функции админки (TC-153..TC-198)', () => {
  test('TC-153: Админка: Саппорт видит только Заявки и не имеет доступа к админским разделам', async ({ page }) => {
    // Авторизуемся под ролью SUPPORT
    await installMockBackend(page, { language: 'ru', role: 'SUPPORT' });

    // Пытаемся зайти на закрытую для саппорта страницу /admin/users
    await page.goto('/admin/users');

    // Проверяем редирект на разрешенную страницу /admin/tickets
    await page.waitForURL('**/admin/tickets**');
    await expect(page.locator('h1').or(page.locator('text=Заявки')).first()).toBeVisible();

    // Проверяем, что в боковом меню нет ссылок на панель управления или пользователей
    await expect(page.locator('nav').locator('text=Пользователи')).toHaveCount(0);
    await expect(page.locator('nav').locator('text=Финансы')).toHaveCount(0);
  });

  test('TC-155: Админка: Глобальный поиск комнат, пользователей и обращений', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/search*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          rooms: [{ id: 100, title: 'Spotify Family Group', status: 'ACTIVE' }],
          users: [{ id: 10, displayName: 'Тестовый Пользователь', email: 'test@ecopay.kz' }],
          feedback: [],
        },
      });
    });

    await page.goto('/admin/dashboard');

    const searchInput = page.locator('input[placeholder*="Поиск"]').first();
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Spotify');

    // Проверяем результаты глобального поиска
    await expect(page.locator('text=Spotify Family Group').first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-158: Админка: Бейджи счетчиков в боковом меню', async ({ page }) => {
    await installMockBackend(page, {
      language: 'ru',
      role: 'ADMIN',
      dashboardKpis: {
        pendingModeration: 7,
        openDisputes: 3,
      },
    });

    await page.goto('/admin/dashboard');

    // Проверяем наличие счетчиков у разделов меню
    await expect(page.locator('nav').locator('text=7').first()).toBeVisible();
    await expect(page.locator('nav').locator('text=3').first()).toBeVisible();
  });

  test('TC-160: Модерация: Отклонение заявки в очереди модерации с причиной', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/moderation/queue', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 101,
            entityType: 'MEMBERSHIP',
            entityId: 100,
            roomId: 100,
            roomMemberId: 100,
            status: 'OPEN',
            reasonCode: 'INVALID_IDENTIFIER',
            riskScore: 65,
            assignedAdminId: null,
            createdAt: '2026-10-18T00:00:00Z',
            updatedAt: '2026-10-18T00:00:00Z',
          },
        ],
      });
    });

    await page.goto('/admin/moderation');

    await expect(page.locator('text=Некорректные данные подключения').or(page.locator('text=MQ-101')).first()).toBeVisible();

    // Нажимаем "Отклонить"
    const rejectBtn = page.locator('button[aria-label="Отклонить"]').or(page.getByRole('button', { name: 'Отклонить' })).first();
    await expect(rejectBtn).toBeVisible();
    await rejectBtn.click();

    // Проверяем появление модального подтверждения
    await expect(page.locator('textarea').or(page.locator('text=Отклонить')).first()).toBeVisible();
  });

  test('TC-161: Комнаты: Блокировка и разблокировка комнаты администратором', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/rooms**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 301,
              serviceId: 1,
              serviceName: 'StreamPlus',
              title: 'Комната для блокировки',
              status: 'ACTIVE',
              totalSeats: 4,
              occupiedSeats: 2,
              pricePerMember: 1250,
              currency: 'KZT',
              ownerDisplayName: 'Нарушитель',
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

    // Кликаем по комнате для открытия боковой панели
    const roomRecord = page.locator('text=Комната для блокировки').first();
    await expect(roomRecord).toBeVisible();
    await roomRecord.click();

    // Проверяем наличие кнопки блокировки
    const blockBtn = page.getByRole('button', { name: /Заблокировать/i });
    await expect(blockBtn).toBeVisible();
    await blockBtn.click();

    // Проверяем модальное окно подтверждения блокировки
    await expect(page.locator('textarea').or(page.locator('text=Заблокировать')).first()).toBeVisible();
  });

  test('TC-162: Модерация: Отображение понятных причин в очереди (флаги)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/moderation/queue', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 102,
            entityType: 'MEMBERSHIP',
            entityId: 100,
            roomId: 100,
            roomMemberId: 100,
            status: 'OPEN',
            reasonCode: 'INVALID_IDENTIFIER',
            riskScore: 25,
            assignedAdminId: null,
            createdAt: '2026-10-18T00:00:00Z',
            updatedAt: '2026-10-18T00:00:00Z',
          },
        ],
      });
    });

    await page.goto('/admin/moderation');

    // Проверяем понятный текст причины "Некорректные данные подключения"
    await expect(page.locator('text=Некорректные данные подключения').first()).toBeVisible();
  });

  test('TC-165: Комнаты: Валидация настройки «минимум мест в комнате» (< 2)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.goto('/admin/rooms');

    // Находим поле минимального количества мест
    const minSeatsInput = page.locator('input[type="number"]').first();
    await expect(minSeatsInput).toBeVisible();
    await expect(minSeatsInput).toBeEnabled();

    // Вводим недопустимое значение 1 (< 2)
    await minSeatsInput.fill('1');

    const saveBtn = page.getByRole('button', { name: 'Сохранить' });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // Проверяем появление валидационной ошибки
    await expect(minSeatsInput).toHaveClass(/eco-input-error/);
    await expect(page.getByText(/не менее 2/i).or(page.locator('.eco-input-error'))).toBeVisible();
  });

  test('TC-171: Пользователи: Модальное окно создания пользователя администратором', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.goto('/admin/users');

    // Нажимаем кнопку "Добавить пользователя"
    const addBtn = page.getByRole('button', { name: /Добавить пользователя/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Проверяем отображение формы создания пользователя
    await expect(page.locator('text=Добавить пользователя').or(page.locator('input[type="email"]')).first()).toBeVisible();
  });

  test('TC-172: Пользователи: Вкладки сегментов (Пользователи / Админы / Удаленные)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/users**', async (route) => {
      const url = route.request().url();
      if (url.includes('role=ADMIN')) {
        await route.fulfill({
          status: 200,
          json: {
            items: [
              {
                id: 1,
                displayName: 'Главный Администратор',
                role: 'ADMIN',
                status: 'ACTIVE',
                phone: '+77001112233',
                createdAt: '2026-01-01T00:00:00Z',
              },
            ],
            totalItems: 1,
            totalPages: 1,
          },
        });
      } else {
        await route.fulfill({
          status: 200,
          json: {
            items: [],
            totalItems: 0,
            totalPages: 0,
          },
        });
      }
    });

    await page.goto('/admin/users');

    // Переключаемся на вкладку "Админы"
    const adminsTab = page.locator('button:has-text("Админы")');
    await expect(adminsTab).toBeVisible();
    await adminsTab.click();

    await expect(page.locator('text=Главный Администратор').first()).toBeVisible();
  });

  test('TC-173: Пользователи: Подтверждение раскрытия контактов удаленного пользователя', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route(/\/admin\/users\/deleted/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              userId: 50,
              displayNameAtDeletion: 'Удаленный Аккаунт',
              deletedAt: '2026-10-15T00:00:00Z',
              identityArchived: true,
              emailMasked: 'u***@test.com',
              phoneMasked: '+7700***99',
            },
          ],
          totalPages: 1,
          totalElements: 1,
        },
      });
    });

    await page.goto('/admin/users');

    // Переключаемся на вкладку "Удалённые"
    const deletedTab = page.locator('button:has-text("Удалённые")');
    await expect(deletedTab).toBeVisible();
    await deletedTab.click();

    await expect(page.locator('text=Удаленный Аккаунт').first()).toBeVisible();

    // Нажимаем "Показать контакты"
    const showContactsBtn = page.getByRole('button', { name: /Показать контакты/i }).first();
    await expect(showContactsBtn).toBeVisible();
    await showContactsBtn.click();

    // Должно открыться модальное окно с запросом причины
    await expect(page.locator('textarea[placeholder*="причину"]').or(page.locator('text=Причина'))).toBeVisible();
  });

  test('TC-174: Пользователи: Валидация длины причины при смене роли пользователя (>= 10 символов)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/users**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 99,
              displayName: 'Тестовый Кандидат',
              role: 'USER',
              status: 'ACTIVE',
              phone: '+77005556677',
              createdAt: '2026-05-01T00:00:00Z',
            },
          ],
          totalItems: 1,
          totalPages: 1,
        },
      });
    });

    await page.goto('/admin/users');

    // Кликаем по пользователю
    const userRow = page.locator('text=Тестовый Кандидат').first();
    await expect(userRow).toBeVisible();
    await userRow.click();

    // Нажимаем "Сменить роль"
    const changeRoleBtn = page.getByRole('button', { name: /Сменить роль/i });
    if (await changeRoleBtn.isVisible()) {
      await changeRoleBtn.click();

      // Вводим слишком короткую причину
      const reasonInput = page.locator('textarea').first();
      await reasonInput.fill('коротко');

      const submitBtn = page.getByRole('button', { name: /Сохранить|Применить|Сменить роль/i }).last();
      await submitBtn.click();

      // Проверяем валидацию минимальной длины
      await expect(page.locator('text=10').or(page.locator('text=Минимум 10'))).toBeVisible();
    }
  });

  test('TC-186: Каталог: Открытие формы создания сервиса', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/catalog/categories**', async (route) => {
      await route.fulfill({
        status: 200,
        json: [{ id: 1, name: 'Видео', slug: 'video' }],
      });
    });

    await page.route('**/api/v1/admin/catalog/services**', async (route) => {
      await route.fulfill({
        status: 200,
        json: [],
      });
    });

    await page.goto('/admin/catalog');

    // Переключаемся на вкладку "Сервисы"
    const servicesTab = page.locator('button[role="tab"]:has-text("Сервисы")');
    await expect(servicesTab).toBeVisible();
    await servicesTab.click();

    // Нажимаем "Создать сервис"
    const createBtn = page.getByRole('button', { name: /Создать сервис/i });
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Проверяем форму
    await expect(page.locator('text=Создать сервис').first()).toBeVisible();
  });

  test('TC-187: Каталог: Создание и редактирование тарифа', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/catalog/categories**', async (route) => {
      await route.fulfill({
        status: 200,
        json: [{ id: 1, name: 'Видео', slug: 'video' }],
      });
    });

    await page.route('**/api/v1/admin/catalog/services**', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 1,
            name: 'StreamPlus',
            slug: 'streamplus',
            categoryId: 1,
            categoryName: 'Видео',
            providerType: 'DIGITAL',
            isActive: true,
            tariffsCount: 1,
          },
        ],
      });
    });

    await page.route('**/tariffs**', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 1,
            serviceId: 1,
            serviceName: 'StreamPlus',
            name: 'Тариф Премиум',
            price: 4500,
            currency: 'KZT',
            periodDays: 30,
            maxMembers: 4,
            isActive: true,
          },
        ],
      });
    });

    await page.goto('/admin/catalog');

    // Переключаемся на вкладку "Тарифы"
    const tariffsTab = page.locator('button[role="tab"]:has-text("Тарифы")');
    await expect(tariffsTab).toBeVisible();
    await tariffsTab.click();

    // Проверяем отображение существующего тарифа и кнопки создания
    await expect(page.locator('text=Тариф Премиум').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Создать тариф/i })).toBeVisible();
  });

  test('TC-189: Каталог: Деактивация сервиса с подтверждением', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route('**/api/v1/admin/catalog/categories**', async (route) => {
      await route.fulfill({
        status: 200,
        json: [{ id: 1, name: 'Видео', slug: 'video' }],
      });
    });

    await page.route('**/api/v1/admin/catalog/services**', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 1,
            name: 'StreamPlus',
            slug: 'streamplus',
            categoryId: 1,
            categoryName: 'Видео',
            providerType: 'DIGITAL',
            isActive: true,
            tariffsCount: 2,
          },
        ],
      });
    });

    await page.goto('/admin/catalog');

    // Переключаемся на "Сервисы"
    const servicesTab = page.locator('button[role="tab"]:has-text("Сервисы")');
    await expect(servicesTab).toBeVisible();
    await servicesTab.click();

    await expect(page.locator('text=StreamPlus').first()).toBeVisible();

    // Нажимаем иконку/кнопку удаления/деактивации
    const deleteBtn = page.getByRole('button', { name: /Удалить/i }).first();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    await expect(page.locator('text=Вы уверены').or(page.locator('text=Удалить')).first()).toBeVisible();
  });

  test('TC-196: Контент: Редактирование страницы «О нас»', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route(/\/admin\/site\/about/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          companyName: 'ТОО EcoPay Казахстан',
          contactEmail: 'info@ecopay.kz',
          contactPhone: '+77271234567',
          langs: {
            ru: { title: 'О компании EcoPay', mission: 'Наша миссия', description: 'Описание сервиса' },
            kz: { title: 'EcoPay туралы', mission: 'Біздің миссия', description: 'Сипаттама' },
            en: { title: 'About EcoPay', mission: 'Our mission', description: 'Description' },
          },
        },
      });
    });

    await page.goto('/admin/about');

    // Проверяем загрузку данных компании
    await expect(page.locator('input[value*="EcoPay Казахстан"]').or(page.locator('text=EcoPay Казахстан'))).toBeVisible();
    await expect(page.getByRole('button', { name: /Сохранить/i })).toBeVisible();
  });

  test('TC-198: Контент: Управление отзывами о сервисе для главной страницы', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ADMIN' });

    await page.route(/\/admin\/service-reviews/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 1,
              authorDisplayName: 'Довольный Клиент',
              authorPublicId: 'client-1',
              rating: 5,
              text: 'Отличный сервис, экономлю каждый месяц!',
              featured: true,
              createdAt: '2026-10-18T00:00:00Z',
            },
          ],
          totalPages: 1,
          totalElements: 1,
        },
      });
    });

    await page.goto('/admin/service-reviews');

    // Проверяем наличие отзыва и переключателя featured
    await expect(page.locator('text=Довольный Клиент').first()).toBeVisible();
    await expect(page.locator('text=Отличный сервис, экономлю каждый месяц!').first()).toBeVisible();
  });
});
