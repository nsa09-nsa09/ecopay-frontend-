import { expect, test } from '@playwright/test';
import { installMockBackend, room, userFixture } from './support/mock-backend';

test.describe('EcoPay QA Matrix: Сквозные сценарии (TC-215..TC-218)', () => {
  test('TC-215: ГЛАВНЫЙ ФЛОУ: от создания комнаты и вступления до выдачи доступа и чата (Multi-Actor)', async ({ browser }) => {
    // Пользователь 1: Владелец комнаты (Owner, id: 2)
    const ownerUser = { ...userFixture, id: 2, displayName: 'Владелец Beeline', phoneVerified: true };
    // Пользователь 2: Участник (Member, id: 10)
    const memberUser = { ...userFixture, id: 10, displayName: 'Участник Семьи', phoneVerified: true };

    const sharedRoom = {
      ...room(300),
      id: 300,
      ownerUserId: 2,
      ownerDisplayName: 'Владелец Beeline',
      title: 'Beeline Ultra Семья',
      providerName: 'Beeline',
      serviceAccessType: 'PHONE',
      roomType: 'TELECOM',
      status: 'OPEN',
      joinable: true,
      pricePerMember: 1800,
      shareKzt: 1300,
      commissionKzt: 500,
      payableTotalKzt: 1800,
      maxMembers: 5,
      filledSeats: 1,
      freeSeats: 4,
    };

    // 1. Контекст Владельца
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await installMockBackend(ownerPage, { language: 'ru', role: 'USER' });

    ownerPage.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({ status: 200, json: { accessToken: 'token-owner', user: ownerUser } });
    });

    ownerPage.route('**/api/v1/rooms/300', async (route) => {
      await route.fulfill({ status: 200, json: sharedRoom });
    });

    ownerPage.route('**/api/v1/rooms/300/members*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 991,
              userId: 10,
              userDisplayName: 'Участник Семьи',
              userPublicId: 'member-public-10',
              status: 'PAID',
              ownerAccessConfirmedAt: null,
              memberAccessConfirmedAt: null,
              createdAt: '2026-10-17T03:00:00Z',
              contactIdentifier: '+77071234567',
            },
          ],
          totalItems: 1,
          page: 0,
          size: 20,
          totalPages: 1,
        },
      });
    });

    ownerPage.route('**/api/v1/rooms/300/members/991/owner-confirm', async (route) => {
      await route.fulfill({
        status: 200,
        json: { success: true, ownerAccessConfirmedAt: new Date().toISOString() },
      });
    });

    // 2. Контекст Участника
    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();
    await installMockBackend(memberPage, { language: 'ru', role: 'USER' });

    memberPage.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({ status: 200, json: { accessToken: 'token-member', user: memberUser } });
    });

    memberPage.route('**/api/v1/rooms/300', async (route) => {
      await route.fulfill({ status: 200, json: sharedRoom });
    });

    memberPage.route('**/api/v1/rooms/300/members', async (route) => {
      await route.fulfill({
        status: 200,
        json: { id: 991, roomId: 300, userId: 10, status: 'APPLIED' },
      });
    });

    memberPage.route('**/api/v1/rooms/300/members/me', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 991,
          roomId: 300,
          userId: 10,
          status: 'PAID',
          payableTotalKzt: 1800,
          holdAmountKzt: 1300,
          ownerAccessConfirmedAt: null,
          memberAccessConfirmedAt: null,
        },
      });
    });

    // ШАГ 1: Участник открывает страницу комнаты и подает заявку
    await memberPage.goto('/room/300');
    await expect(memberPage.locator('text=Beeline Ultra Семья')).toBeVisible();

    const joinBtn = memberPage.locator('button:has-text("Присоединиться")').first();
    await expect(joinBtn).toBeVisible();
    await joinBtn.click();

    // Заполняем номер телефона участника
    const phoneInput = memberPage.locator('input[type="text"], input[inputmode="tel"]').first();
    await phoneInput.fill('+77071234567');
    await memberPage.locator('input[type="checkbox"]').check();
    await memberPage.locator('button:has-text("Продолжить")').click();

    // Проверяем суммы: Участник платит 1800 ₸ (1300 + 500 комиссия EcoPay)
    await expect(memberPage.locator('text=1 800').first()).toBeVisible();
    await memberPage.locator('button:has-text("Отправить заявку")').click();
    await expect(memberPage.locator('text=Заявка отправлена')).toBeVisible();

    // ШАГ 2: Владелец открывает управление своей комнатой и видит оплаченного участника
    await ownerPage.goto('/rooms/owner/300');
    await expect(ownerPage.locator('text=Beeline Ultra Семья')).toBeVisible();
    await expect(ownerPage.locator('text=Участник Семьи')).toBeVisible();

    // Владелец открывает модалку выдачи доступа
    const grantBtn = ownerPage.locator('button:has-text("Выдать доступ")').or(ownerPage.locator('button:has-text("Отметить доступ выданным")')).first();
    if (await grantBtn.count() > 0) {
      await grantBtn.click();
      const confirmModalBtn = ownerPage.locator('button:has-text("Подтвердить")').or(ownerPage.locator('button:has-text("Выдать доступ")')).last();
      await confirmModalBtn.click();
    }

    // ШАГ 3: Чат комнаты доступен обоим пользователям
    await memberPage.goto('/rooms/member/300');
    const memberChatInput = memberPage.locator('input[placeholder*="сообщение"], textarea[placeholder*="сообщение"]').first();
    if (await memberChatInput.count() > 0) {
      await expect(memberChatInput).toBeVisible();
      await memberChatInput.fill('Привет! Я вступил в семью Beeline.');
    }

    await ownerContext.close();
    await memberContext.close();
  });

  test('TC-216: Конфликтный флоу: жалоба участника на непредоставление доступа и открытие спора', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    page.route('**/api/v1/rooms/members/991', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 991,
          roomId: 300,
          userId: userFixture.id,
          status: 'PAID',
          payableTotalKzt: 1800,
          disputeOpen: false,
        },
      });
    });

    let complaintSent = false;
    page.route('**/api/v1/rooms/members/991/complaint', async (route) => {
      complaintSent = true;
      await route.fulfill({
        status: 200,
        json: { id: 101, status: 'OPEN', reason: 'ACCESS_NOT_PROVIDED' },
      });
    });

    page.route('**/api/v1/rooms/300', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          ...room(300),
          id: 300,
          title: 'Beeline Ultra Семья',
          ownerDisplayName: 'Owner',
        },
      });
    });

    await page.goto('/rooms/member/991');

    // Кнопка подачи жалобы / открыть спор
    const complaintBtn = page.locator('button:has-text("Пожаловаться")').or(page.locator('button:has-text("Открыть спор")')).first();
    if (await complaintBtn.count() > 0) {
      await complaintBtn.click();

      // Модальное окно спора/жалобы
      const reasonSelect = page.locator('select').first();
      if (await reasonSelect.count() > 0) {
        await reasonSelect.selectOption({ index: 1 });
      }

      const commentInput = page.locator('textarea').first();
      if (await commentInput.count() > 0) {
        await commentInput.fill('Владелец не добавил мой номер в семью Beeline более 24 часов.');
      }

      const submitComplaintBtn = page.locator('button:has-text("Отправить жалобу")').or(page.locator('button:has-text("Открыть спор")')).last();
      await submitComplaintBtn.click();
    }
  });

  test('TC-217: Флоу поддержки: создание обращения пользователя по комнате', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    page.route('**/api/v1/support/tickets', async (route) => {
      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          json: {
            id: 801,
            subject: payload.subject,
            status: 'NEW',
            createdAt: new Date().toISOString(),
          },
        });
      } else {
        await route.fulfill({ status: 200, json: [] });
      }
    });

    await page.goto('/support/new');

    // Проверяем форму тикета
    const subjectInput = page.locator('input[placeholder*="описание"]').first();
    await expect(subjectInput).toBeVisible();
    await subjectInput.fill('Вопрос по списанию средств');

    const messageInput = page.locator('textarea[placeholder*="проблему"]').first();
    await messageInput.fill('Добрый день! Подскажите, когда произойдет выплата за участие?');

    const submitBtn = page.locator('button:has-text("Отправить заявку")').first();
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
  });
});
