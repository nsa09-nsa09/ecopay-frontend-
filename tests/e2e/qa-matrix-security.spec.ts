import { expect, test } from '@playwright/test';
import { installMockBackend, room, userFixture } from './support/mock-backend';

test.describe('EcoPay QA Matrix: Безопасность и доступы (TC-202..TC-207)', () => {
  test('TC-202: Защита от IDOR: чужая комната в режиме владельца и участника', async ({ page }) => {
    // Пользователь с id: 10
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    // 1. Попытка открыть чужую комнату владельца (владелец id: 2)
    await page.route('**/api/v1/rooms/999', async (route) => {
      await route.fulfill({
        status: 403,
        json: { message: 'Forbidden: You are not the owner of this room' },
      });
    });

    await page.goto('/rooms/owner/999');
    await expect(page.locator('text=Вы не владелец этой комнаты.')).toBeVisible();

    // 2. Попытка открыть страницу участия чужой комнаты, где юзер не состоит
    await page.route('**/api/v1/rooms/999/members/me', async (route) => {
      await route.fulfill({
        status: 404,
        json: { message: 'Not found: You are not a member of this room' },
      });
    });

    await page.goto('/rooms/member/999');
    // Должна отображаться ошибка или отсутствие членства, чужие данные не раскрываются
    const bodyText = await page.locator('main').innerText();
    expect(bodyText).not.toContain('paymentUrl');
  });

  test('TC-203: Закрытые страницы защищены от неавторизованного гостя (ANON)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    // 1. /rooms/create -> редирект на /login
    await page.goto('/rooms/create');
    await expect(page).toHaveURL(/\/login\?redirect=%2Frooms%2Fcreate/);

    // 2. /profile -> сообщение с предложением войти
    await page.goto('/profile');
    await expect(page.locator('text=Войдите, чтобы управлять аккаунтом EcoPay.')).toBeVisible();

    // 3. /admin/dashboard -> редирект на /admin-login
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin-login/);
  });

  test('TC-204: Защита от XSS инъекций в пользовательских полях', async ({ page }) => {
    let alertTriggered = false;
    page.on('dialog', async (dialog) => {
      alertTriggered = true;
      await dialog.dismiss();
    });

    const maliciousUser = {
      ...userFixture,
      id: 10,
      displayName: '<script>alert("XSS")</script><img src=x onerror=alert(1)>',
    };

    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({ status: 200, json: { accessToken: 'token', user: maliciousUser } });
    });

    await page.route('**/api/v1/users/me', async (route) => {
      await route.fulfill({ status: 200, json: maliciousUser });
    });

    await page.goto('/profile');

    // Ожидаем отрисовки страницы
    await expect(page.locator('h1').first()).toBeVisible();

    // alert() не должен был сработать
    expect(alertTriggered).toBe(false);

    // Текст должен отображаться как безопасный экранированный текст
    await expect(page.locator('text=<script>alert("XSS")</script>').first()).toBeVisible();
  });

  test('TC-205: Персональные контакты участников не утекают в публичный доступ', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    const publicRoom = {
      ...room(100),
      id: 100,
      title: 'Публичная комната',
      ownerUserId: 2,
      ownerDisplayName: 'Owner Display Name',
    };

    await page.route('**/api/v1/rooms/100', async (route) => {
      await route.fulfill({ status: 200, json: publicRoom });
    });

    await page.goto('/room/100');

    // Проверяем, что в HTML страницы нет персональных телефонов и паролей участников
    const content = await page.content();
    expect(content).not.toContain('+77071234567');
    expect(content).not.toContain('password');
  });
});
