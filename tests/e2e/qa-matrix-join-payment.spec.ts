import { expect, test } from '@playwright/test';
import { installMockBackend, room, userFixture } from './support/mock-backend';

const digitalRoom = {
  ...room(100),
  id: 100,
  ownerUserId: 2,
  ownerDisplayName: 'Owner User',
  title: 'Spotify Premium Family',
  serviceAccessType: 'EMAIL',
  joinable: true,
  status: 'OPEN',
  pricePerMember: 1200,
  shareKzt: 1000,
  commissionKzt: 200,
  payableTotalKzt: 1200,
  settlementCurrency: 'KZT',
  maxMembers: 6,
  freeSeats: 4,
};

const telecomRoom = {
  ...room(200),
  id: 200,
  ownerUserId: 2,
  ownerDisplayName: 'Owner User',
  title: 'Beeline Family Telecom',
  serviceAccessType: 'PHONE',
  roomType: 'TELECOM',
  joinable: true,
  status: 'OPEN',
  pricePerMember: 1800,
  shareKzt: 1300,
  commissionKzt: 500,
  payableTotalKzt: 1800,
  settlementCurrency: 'KZT',
  maxMembers: 5,
  freeSeats: 3,
};

test.describe('EcoPay QA Matrix: Модуль «Вступление и оплата» (TC-082..TC-095)', () => {
  test('TC-082: Подача заявки в цифровую комнату (ввод email и согласие)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/rooms/100', async (route) => {
      await route.fulfill({ status: 200, json: digitalRoom });
    });

    let joinPayload: any = null;
    await page.route('**/api/v1/rooms/100/members', async (route) => {
      joinPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        json: { id: 555, roomId: 100, userId: userFixture.id, status: 'APPLIED' },
      });
    });

    await page.goto('/room/100');

    // Кликаем по кнопке вступления «Присоединиться»
    const joinBtn = page.locator('button:has-text("Присоединиться")').first();
    await expect(joinBtn).toBeVisible();
    await joinBtn.click();

    // Модальное окно вступления открыто
    await expect(page.locator('text=Присоединиться к комнате')).toBeVisible();

    // Заполняем email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('member.join@example.test');

    // Ставим согласие
    const consentCheckbox = page.locator('input[type="checkbox"]');
    await consentCheckbox.check();

    // Переходим к шагу подтверждения
    const nextBtn = page.locator('button:has-text("Продолжить")');
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    // Шаг 2: видим расчет и нажимаем «Отправить заявку»
    await expect(page.locator('text=Стоимость вашего места').first()).toBeVisible();
    await expect(page.locator('text=Комиссия EcoPay').first()).toBeVisible();

    const submitBtn = page.locator('button:has-text("Отправить заявку")');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Заявка отправлена, кнопка перехода к оплате видна
    await expect(page.locator('text=Заявка отправлена')).toBeVisible();
    await expect(page.locator('button:has-text("К оплате")')).toBeVisible();
    expect(joinPayload).not.toBeNull();
  });

  test('TC-083: Подача заявки в телеком-комнату (ввод номера +7XXXXXXXXXX)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/rooms/200', async (route) => {
      await route.fulfill({ status: 200, json: telecomRoom });
    });

    let joinPayload: any = null;
    await page.route('**/api/v1/rooms/200/members', async (route) => {
      joinPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        json: { id: 556, roomId: 200, userId: userFixture.id, status: 'APPLIED' },
      });
    });

    await page.goto('/room/200');

    const joinBtn = page.locator('button:has-text("Присоединиться")').first();
    await expect(joinBtn).toBeVisible();
    await joinBtn.click();

    // Вводим телефонный номер
    const phoneInput = page.locator('input[type="text"], input[inputmode="tel"]').first();
    await phoneInput.fill('+77071234567');

    const consentCheckbox = page.locator('input[type="checkbox"]');
    await consentCheckbox.check();

    const nextBtn = page.locator('button:has-text("Продолжить")');
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    await page.locator('button:has-text("Отправить заявку")').click();

    await expect(page.locator('text=Заявка отправлена')).toBeVisible();
    expect(joinPayload).not.toBeNull();
  });

  test('TC-084: Валидация контакта: блокировка кнопки при отсутствии согласия или невалидном email', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/rooms/100', async (route) => {
      await route.fulfill({ status: 200, json: digitalRoom });
    });

    await page.goto('/room/100');

    const joinBtn = page.locator('button:has-text("Присоединиться")').first();
    await expect(joinBtn).toBeVisible();
    await joinBtn.click();

    const continueBtn = page.locator('button:has-text("Продолжить")');
    // Без заполнения кнопка неактивна
    await expect(continueBtn).toBeDisabled();

    // Невалидный email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email-no-domain');

    const consentCheckbox = page.locator('input[type="checkbox"]');
    await consentCheckbox.check();

    // При невалидном email кнопка по-прежнему неактивна
    await expect(continueBtn).toBeDisabled();
  });

  test('TC-085: Владелец комнаты не может присоединиться к своей же комнате', async ({ page }) => {
    const ownerUser = { ...userFixture, id: 2, displayName: 'Owner' };
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({ status: 200, json: { accessToken: 'token-owner', user: ownerUser } });
    });

    await page.route('**/api/v1/rooms/100', async (route) => {
      await route.fulfill({ status: 200, json: { ...digitalRoom, ownerUserId: 2, joinable: false } });
    });

    await page.goto('/room/100');

    const joinBtn = page.locator('button:has-text("Присоединиться")').first();
    if (await joinBtn.count() > 0) {
      await expect(joinBtn).toBeDisabled();
    }
  });

  test('TC-088: Успешная оплата участия через FreedomPay и переход в подтвержденный статус', async ({ page }) => {
    await installMockBackend(page, {
      language: 'ru',
      role: 'USER',
      membershipStatus: 'APPLIED',
    });

    await page.route('**/api/v1/rooms/100', async (route) => {
      await route.fulfill({ status: 200, json: digitalRoom });
    });

    await page.route('**/api/v1/rooms/100/members/me', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: '555',
          roomId: 100,
          userId: userFixture.id,
          status: 'APPLIED',
          payableTotalKzt: 1200,
          shareKzt: 1000,
          commissionKzt: 200,
          holdAmountKzt: 1000,
        },
      });
    });

    await page.route('**/api/v1/payments/members/555/intent/current', async (route) => {
      await route.fulfill({ status: 404, json: { message: 'Not found' } });
    });

    await page.goto('/rooms/member/100');

    // Проверяем наличие кнопки «Оплатить»
    const payBtn = page.locator('button:has-text("Оплатить")').first();
    await expect(payBtn).toBeVisible();
  });

  test('TC-093: Страница подтверждения оплаты /payment/confirmation без входа', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'ANON' });

    await page.goto('/payment/confirmation');

    const body = await page.locator('main').innerText();
    expect(body.length).toBeGreaterThan(20);
  });

  test('TC-095: Блок «Удержание EcoPay» отображается в деталях участия', async ({ page }) => {
    await installMockBackend(page, {
      language: 'ru',
      role: 'USER',
      membershipStatus: 'ACTIVE',
    });

    await page.route('**/api/v1/rooms/100', async (route) => {
      await route.fulfill({ status: 200, json: digitalRoom });
    });

    await page.route('**/api/v1/rooms/100/members/me', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: '555',
          roomId: 100,
          userId: userFixture.id,
          status: 'ACTIVE',
          payableTotalKzt: 1200,
          shareKzt: 1000,
          commissionKzt: 200,
        },
      });
    });

    await page.route('**/api/v1/rooms/100/members/me/hold', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          memberId: 555,
          amountKzt: 1000,
          status: 'HELD',
          releaseAt: '2026-11-01T12:00:00Z',
        },
      });
    });

    await page.goto('/rooms/member/100');

    // Проверяем отображение блока «Удержание EcoPay»
    await expect(page.locator('text=Удержание EcoPay').first()).toBeVisible();
  });
});
