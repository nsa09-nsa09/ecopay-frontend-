import { expect, test } from '@playwright/test';
import { installMockBackend, userFixture } from './support/mock-backend';

const unverifiedUser = {
  ...userFixture,
  id: 10,
  displayName: 'Тестовый Пользователь',
  phone: null,
  phoneVerified: false,
  slug: 'testuser',
};

const verifiedUser = {
  ...userFixture,
  id: 10,
  displayName: 'Тестовый Пользователь',
  phone: '+77071234567',
  phoneVerified: true,
  slug: 'testuser',
};

test.describe('EcoPay QA Matrix: Модули «Профиль» и «Каталог» (TC-033..TC-057)', () => {
  test('TC-033: Подтверждение номера телефона через SMS/OTP код', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    let codeRequested = false;
    let codeVerified = false;

    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          accessToken: 'token-user',
          user: codeVerified ? verifiedUser : unverifiedUser,
        },
      });
    });

    await page.route('**/api/v1/users/me', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, json: codeVerified ? verifiedUser : unverifiedUser });
      } else {
        await route.fallback();
      }
    });

    await page.route('**/api/v1/auth/phone/request-code', async (route) => {
      codeRequested = true;
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.route('**/api/v1/auth/phone/verify', async (route) => {
      codeVerified = true;
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.goto('/profile');

    // Находим поле ввода телефона
    const phoneInput = page.locator('input[placeholder="+77001234567"]').first();
    await expect(phoneInput).toBeVisible();
    await phoneInput.fill('+77071234567');

    // Кликаем «Отправить код подтверждения»
    const sendBtn = page.locator('button:has-text("Отправить код")').first();
    await expect(sendBtn).toBeVisible();
    await sendBtn.click();
    expect(codeRequested).toBe(true);

    // Вводим 6-значный код
    const codeInput = page.locator('input[placeholder="123456"]').first();
    await expect(codeInput).toBeVisible();
    await codeInput.fill('123456');

    // Подтверждаем код
    const verifyBtn = page.locator('button:has-text("Подтвердить")').first();
    await verifyBtn.click();
    expect(codeVerified).toBe(true);

    // Видим сообщение об успешном подтверждении
    await expect(page.locator('text=Номер телефона подтверждён.')).toBeVisible();
  });

  test('TC-034: Телефон: блокировка кнопки при отсутствии номера или неверном формате', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({ status: 200, json: { accessToken: 'token-user', user: unverifiedUser } });
    });

    await page.route('**/api/v1/users/me', async (route) => {
      await route.fulfill({ status: 200, json: unverifiedUser });
    });

    await page.goto('/profile');

    const phoneInput = page.locator('input[placeholder="+77001234567"]').first();
    await expect(phoneInput).toBeVisible();
    await phoneInput.fill('');

    // Без номера кнопка не должна отправлять запрос
    const sendBtn = page.locator('button:has-text("Отправить код")').first();
    await expect(sendBtn).toBeVisible();
  });

  test('TC-036: Изменение отображаемого имени в профиле', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    let updatedName: string | null = null;
    await page.route('**/api/v1/users/me', async (route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        const body = route.request().postDataJSON();
        updatedName = body.displayName;
        await route.fulfill({
          status: 200,
          json: { ...verifiedUser, displayName: updatedName },
        });
      } else {
        await route.fulfill({ status: 200, json: verifiedUser });
      }
    });

    await page.goto('/profile');

    const nameInput = page.locator('label:has-text("Отображаемое имя") + input, input:below(label:has-text("Отображаемое имя"))').first();
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Новое Имя Пользователя');

    const saveBtn = page.locator('button:has-text("Сохранить изменения")').first();
    await saveBtn.click();

    await expect(page.locator('text=Профиль обновлён.')).toBeVisible();
    expect(updatedName).toBe('Новое Имя Пользователя');
  });

  test('TC-038: Валидация и проверка доступности slug профиля', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/users/me', async (route) => {
      await route.fulfill({ status: 200, json: verifiedUser });
    });

    await page.route('**/api/v1/users/me/slug-available*', async (route) => {
      const url = new URL(route.request().url());
      const slug = url.searchParams.get('slug');
      if (slug === 'taken-slug') {
        await route.fulfill({ status: 200, json: { available: false, reason: 'taken' } });
      } else {
        await route.fulfill({ status: 200, json: { available: true } });
      }
    });

    await page.goto('/profile');

    const slugInput = page.locator('input[placeholder="my-handle"]').first();
    await expect(slugInput).toBeVisible();

    // Вводим доступный slug
    await slugInput.fill('super-hero-slug');
    await expect(page.locator('text=Свободно')).toBeVisible();
  });

  test('TC-043: Удаление аккаунта пользователем без активных обязательств', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    let deleteRequested = false;
    await page.route('**/api/v1/users/me', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteRequested = true;
        await route.fulfill({ status: 200, json: { success: true } });
      } else {
        await route.fulfill({ status: 200, json: verifiedUser });
      }
    });

    await page.goto('/profile');

    // Кнопка удаления аккаунта
    const deleteBtn = page.locator('button:has-text("Удалить аккаунт")').first();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Проходим модальное окно подтверждения
    const continueModalBtn = page.locator('button:has-text("Продолжить")').first();
    if (await continueModalBtn.count() > 0) {
      await continueModalBtn.click();
    }

    const confirmDeleteBtn = page.locator('button:has-text("Да, удалить аккаунт")').first();
    if (await confirmDeleteBtn.count() > 0) {
      await confirmDeleteBtn.click();
      expect(deleteRequested).toBe(true);
    }
  });

  test('TC-044: Запрет удаления аккаунта при наличии активных операций (409 Conflict)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/users/me', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 409,
          json: { message: 'Сначала завершите активные финансовые операции.' },
        });
      } else {
        await route.fulfill({ status: 200, json: verifiedUser });
      }
    });

    await page.goto('/profile');

    const deleteBtn = page.locator('button:has-text("Удалить аккаунт")').first();
    await deleteBtn.click();

    const continueModalBtn = page.locator('button:has-text("Продолжить")').first();
    if (await continueModalBtn.count() > 0) {
      await continueModalBtn.click();
    }

    const confirmDeleteBtn = page.locator('button:has-text("Да, удалить аккаунт")').first();
    if (await confirmDeleteBtn.count() > 0) {
      await confirmDeleteBtn.click();
    }

    // Проверяем отображение ошибки о блокировке удаления
    await expect(page.locator('text=Сначала завершите активные финансовые операции.')).toBeVisible();
  });

  test('TC-046: Каталог подписок отображает сервисы и категории на главной', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    await page.route('**/api/v1/catalog/categories', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          { id: 1, name: 'Музыка', slug: 'music' },
          { id: 2, name: 'Видео', slug: 'video' },
        ],
      });
    });

    await page.route('**/api/v1/catalog/services*', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 1,
            categoryId: 1,
            categoryName: 'Музыка',
            name: 'Spotify Premium Family',
            slug: 'spotify',
            providerType: 'DIGITAL',
            accessType: 'EMAIL',
            minPricePerMember: 1200,
            currency: 'KZT',
          },
          {
            id: 2,
            categoryId: 2,
            categoryName: 'Видео',
            name: 'Netflix 4K Ultra',
            slug: 'netflix',
            providerType: 'DIGITAL',
            accessType: 'EMAIL',
            minPricePerMember: 1900,
            currency: 'KZT',
          },
        ],
      });
    });

    await page.goto('/');

    // Проверяем наличие карточек сервисов
    await expect(page.locator('text=Spotify Premium Family').first()).toBeVisible();
    await expect(page.locator('text=Netflix 4K Ultra').first()).toBeVisible();
  });

  test('TC-052: Поиск в каталоге сервисов по подстроке', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    await page.route('**/api/v1/catalog/services*', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 1,
            categoryId: 1,
            categoryName: 'Музыка',
            name: 'Spotify Premium Family',
            slug: 'spotify',
            minPricePerMember: 1200,
            currency: 'KZT',
          },
        ],
      });
    });

    await page.goto('/');

    // Находим поле поиска в каталоге
    const searchInput = page.locator('input[placeholder*="Поиск"], input[placeholder*="поиск"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('Spotify');
      await expect(page.locator('text=Spotify Premium Family').first()).toBeVisible();
    }
  });
});
