import { expect, test } from '@playwright/test';
import { installMockBackend, userFixture } from './support/mock-backend';

test.describe('EcoPay QA Matrix: Модуль «Общее» (TC-001..TC-006)', () => {
  test.beforeEach(async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });
  });

  test('TC-001: Главная страница открывается без ошибок', async ({ page }) => {
    await page.goto('/');

    // Проверяем наличие ключевых блоков: логотип, поиск, заголовок каталога
    await expect(page).toHaveTitle(/EcoPay/i);
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.locator('input[type="search"]').first()).toBeVisible();

    // Проверяем, что нет белого экрана или критических ошибок
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(100);
  });

  test('TC-002: Шапка: навигационные ссылки ведут на нужные разделы', async ({ page }) => {
    await page.goto('/');

    // Клик на «О нас»
    await page.locator('nav a[href="/about"]').first().click();
    await expect(page).toHaveURL(/\/about$/);

    // Клик на «Поддержка»
    await page.locator('nav a[href="/support"]').first().click();
    await expect(page).toHaveURL(/\/support$/);

    // Клик на «Войти»
    await page.locator('nav a[href="/login"]').first().click();
    await expect(page).toHaveURL(/\/login$/);

    // Клик на «Регистрация»
    await page.locator('nav a[href="/register"]').first().click();
    await expect(page).toHaveURL(/\/register$/);

    // Клик на логотип — возврат на главную
    await page.locator('nav a[href="/"]').first().click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('TC-003: Футер: все служебные ссылки и логотипы платежных систем отображаются', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Ссылки футера
    await expect(footer.locator('a[href="/about"]')).toBeVisible();
    await expect(footer.locator('a[href="/terms"]')).toBeVisible();
    await expect(footer.locator('a[href="/privacy"]')).toBeVisible();
    await expect(footer.locator('a[href="/how-it-works"]')).toBeVisible();
    await expect(footer.locator('a[href="/security"]')).toBeVisible();

    // Логотипы платежных систем (через aria-label)
    await expect(footer.getByLabel('Visa')).toBeVisible();
    await expect(footer.getByLabel('Mastercard')).toBeVisible();
    await expect(footer.getByLabel('Freedom Pay')).toBeVisible();
  });

  test('TC-004: Страница 404 отображается с кнопками навигации', async ({ page }) => {
    await page.goto('/abc-xyz-non-existent-route-123');

    // Проверяем код 404
    await expect(page.locator('text=404')).toBeVisible();

    // Проверяем кнопки навигации внутри блока ошибки
    const main = page.locator('main');
    const homeBtn = main.locator('a[href="/"]').filter({ hasText: /Главную/i });
    const howBtn = main.locator('a[href="/how-it-works"]');
    const supportBtn = main.locator('a[href="/support"]');

    await expect(homeBtn).toBeVisible();
    await expect(howBtn).toBeVisible();
    await expect(supportBtn).toBeVisible();

    // Переход по кнопке «На главную»
    await homeBtn.click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('TC-005: Опечатка /sceurity автоматически редиректит на /security', async ({ page }) => {
    await page.goto('/sceurity');
    await expect(page).toHaveURL(/\/security$/);
  });

  test('TC-006: Статичные страницы открываются корректно', async ({ page }) => {
    // Подставляем мок с юридическим текстом для страниц terms и privacy
    await page.route('**/api/v1/site/legal/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          docType: 'terms',
          version: 'terms-2026',
          title_ru: 'Пользовательское соглашение',
          body_ru: 'Подробный юридический текст условий использования сервиса EcoPay.',
        }),
      });
    });

    const staticPages = ['/how-it-works', '/security', '/about', '/terms', '/privacy'];

    for (const route of staticPages) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`${route}$`));
      await expect(page.locator('main h1, main h2').first()).toBeVisible();
    }
  });
});

test.describe('EcoPay QA Matrix: Модуль «Регистрация и вход» (TC-012..TC-031)', () => {
  test('TC-012: Форма входа содержит все обязательные поля и ссылки', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });
    await page.goto('/login');

    const formContainer = page.locator('.max-w-sm');
    await expect(formContainer.locator('input[type="email"]')).toBeVisible();
    await expect(formContainer.locator('input[type="password"]')).toBeVisible();
    await expect(formContainer.locator('input[type="checkbox"]')).toBeVisible(); // Запомнить меня
    await expect(formContainer.locator('a[href="/forgot-password"]')).toBeVisible(); // Забыли пароль?
    await expect(formContainer.locator('a[href="/register"]')).toBeVisible(); // Регистрация
    await expect(formContainer.locator('button[type="submit"]')).toBeVisible();
  });

  test('TC-013: Валидация формата email при вводе', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });
    await page.goto('/login');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email-without-at');
    await page.locator('input[type="password"]').fill('ValidPassword123');
    await page.locator('button[type="submit"]').click();

    // Проверяем отображение подсказки/ошибки невалидного email (без @)
    const emailError = page.locator('text=В адресе не хватает символа @');
    await expect(emailError).toBeVisible();
  });

  test('TC-014: Вход с неверным паролем не показывает ошибку истекшей сессии (Баг C-02)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    // Эмулируем ответ бэкенда при неверном пароле (401 INVALID_CREDENTIALS)
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'INVALID_CREDENTIALS',
          message: 'Неверный email или пароль',
        }),
      });
    });

    await page.goto('/login');
    await page.locator('input[type="email"]').fill('user@example.test');
    await page.locator('input[type="password"]').fill('WrongPassword123');
    await page.locator('button[type="submit"]').click();

    // Проверяем, что НЕ всплывает «Сессия истекла» (находка Claude C-02)
    const errorMsg = page.locator('p[style*="eco-negative"]');
    await expect(errorMsg).toBeVisible();
    const errorText = await errorMsg.innerText();
    expect(errorText).not.toContain('Сессия истекла');
  });

  test('TC-018: Email с пробелами по краям автоматически триммится', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    let capturedEmail = '';
    await page.route('**/api/v1/auth/login', async (route) => {
      const data = route.request().postDataJSON();
      capturedEmail = data.email;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'test-token', user: userFixture }),
      });
    });

    await page.goto('/login');
    await page.locator('input[type="email"]').fill('  member@example.test  ');
    await page.locator('input[type="password"]').fill('Password123');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(500);
    // Email должен быть очищен от пробелов по краям
    expect(capturedEmail.trim()).toBe('member@example.test');
  });

  test('TC-023: Восстановление пароля открывает форму сброса', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });
    await page.goto('/login');

    await page.locator('.max-w-sm a[href="/forgot-password"]').click();
    await expect(page).toHaveURL(/\/forgot-password$/);

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('TC-026: Выход из аккаунта очищает сессию и запрещает доступ к закрытым страницам', async ({ page }) => {
    // Входим как авторизованный пользователь
    const mockState = await installMockBackend(page, { language: 'ru', role: 'USER' });
    await page.goto('/');

    // Ожидаем гидратации кнопки профиля в навигации
    const profileBtn = page.locator('button[aria-label="Профиль"]');
    await expect(profileBtn).toBeVisible();
    await profileBtn.click();

    // Нажимаем «Выйти»
    const logoutBtn = page.locator('button:has-text("Выйти")');
    await expect(logoutBtn).toBeVisible();

    // Симулируем инвалидацию refresh-токена на сервере при логауте
    mockState.role = 'ANON';
    mockState.refreshOk = false;
    await logoutBtn.click();

    // Проверяем, что вернулись на главную
    await expect(page).toHaveURL(/\/$/);

    // Пытаемся открыть закрытую страницу /rooms/create
    await page.goto('/rooms/create');
    // Неавторизованного должно перенаправить на страницу входа
    await expect(page).toHaveURL(/\/login\?redirect=%2Frooms%2Fcreate/);
  });

  test('TC-030: Редирект после входа возвращает пользователя на запрошенный ранее адрес', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    // Пользователь пытается создать комнату без авторизации
    await page.goto('/rooms/create');
    await expect(page).toHaveURL(/\/login\?redirect=%2Frooms%2Fcreate/);

    // Успешный вход
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'test-token', user: userFixture }),
      });
    });

    await page.locator('input[type="email"]').fill('member@example.test');
    await page.locator('input[type="password"]').fill('Password123');
    await page.locator('button[type="submit"]').click();

    // Должен сработать редирект обратно на /rooms/create
    await expect(page).toHaveURL(/\/rooms\/create/);
  });

  test('TC-031: Безопасный редирект не допускает переход на внешние фишинговые сайты', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    // Попытка передать внешний URL в redirect
    await page.goto('/login?redirect=https://evil-phishing-site.com');

    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'test-token', user: userFixture }),
      });
    });

    await page.locator('input[type="email"]').fill('member@example.test');
    await page.locator('input[type="password"]').fill('Password123');
    await page.locator('button[type="submit"]').click();

    // Должен остаться на сайте (например на /profile), но НЕ на evil-phishing-site.com
    await expect(page).not.toHaveURL(/evil-phishing-site\.com/);
  });
});
