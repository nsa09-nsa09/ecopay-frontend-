import { expect, test } from '@playwright/test';
import { installMockBackend, room, userFixture } from './support/mock-backend';

const digitalRoom = {
  ...room(100),
  id: 100,
  ownerUserId: 2,
  ownerDisplayName: 'Владелец Подписки',
  title: 'Spotify Premium Family 6 мест',
  serviceAccessType: 'EMAIL',
  roomType: 'DIGITAL',
  status: 'ACTIVE',
  joinable: true,
  pricePerMember: 1200,
  shareKzt: 1000,
  commissionKzt: 200,
  payableTotalKzt: 1200,
  settlementCurrency: 'KZT',
  maxMembers: 6,
  freeSeats: 4,
};

test.describe('EcoPay QA Matrix: Модули «Чат комнаты» и «Поддержка» (TC-106..TC-140)', () => {
  test('TC-106: Отправка сообщения в чат комнаты', async ({ page }) => {
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

    let sentMessage: string | null = null;
    await page.route('**/api/v1/rooms/100/chat/messages*', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        sentMessage = body.body;
        await route.fulfill({
          status: 201,
          json: {
            id: 9901,
            roomId: 100,
            senderId: userFixture.id,
            senderName: userFixture.displayName,
            owner: false,
            body: sentMessage,
            createdAt: new Date().toISOString(),
          },
        });
      } else {
        await route.fulfill({
          status: 200,
          json: {
            items: [],
            totalItems: 0,
            page: 0,
            size: 50,
            totalPages: 1,
          },
        });
      }
    });

    await page.goto('/rooms/member/100');

    // Находим поле ввода сообщения в чате
    const chatInput = page.locator('input[placeholder*="сообщение"]').first();
    await expect(chatInput).toBeVisible();
    await chatInput.fill('Здравствуйте! Доступ работает отлично.');

    const sendBtn = page.locator('button:has-text("Отправить")').first();
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();

    expect(sentMessage).toBe('Здравствуйте! Доступ работает отлично.');
  });

  test('TC-107: Отображение истории сообщений в чате с именем и временем', async ({ page }) => {
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

    await page.route('**/api/v1/rooms/100/chat/messages*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 9901,
              roomId: 100,
              senderId: 2,
              senderName: 'Владелец Подписки',
              owner: true,
              body: 'Приветствуем всех в семейной группе Spotify!',
              createdAt: '2026-10-17T02:00:00Z',
            },
          ],
          totalItems: 1,
          page: 0,
          size: 50,
          totalPages: 1,
        },
      });
    });

    await page.goto('/rooms/member/100');

    // Проверяем отображение сообщения владельца и плашки «Владелец»
    await expect(page.locator('text=Приветствуем всех в семейной группе Spotify!')).toBeVisible();
    await expect(page.locator('text=Владелец').first()).toBeVisible();
  });

  test('TC-109: Защита от XSS в сообщениях чата комнаты', async ({ page }) => {
    let alertTriggered = false;
    page.on('dialog', async (dialog) => {
      alertTriggered = true;
      await dialog.dismiss();
    });

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

    await page.route('**/api/v1/rooms/100/chat/messages*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 9902,
              roomId: 100,
              senderId: 3,
              senderName: 'Attacker',
              owner: false,
              body: '<script>alert("XSS")</script><img src=x onerror=alert(1)>',
              createdAt: '2026-10-17T02:05:00Z',
            },
          ],
          totalItems: 1,
          page: 0,
          size: 50,
          totalPages: 1,
        },
      });
    });

    await page.goto('/rooms/member/100');

    // alert() не должен срабатывать
    expect(alertTriggered).toBe(false);

    // Текст должен рендериться безопасно
    await expect(page.locator('text=<script>alert("XSS")</script>').first()).toBeVisible();
  });

  test('TC-132: Страница поддержки /support отображает Центр поддержки', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/support-tickets*', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 101,
            subject: 'Вопрос по списанию средств',
            topic: 'payment',
            status: 'NEW',
            createdAt: '2026-10-17T01:00:00Z',
          },
        ],
      });
    });

    await page.goto('/support');

    await expect(page.locator('h1:has-text("Центр поддержки")')).toBeVisible();
    await expect(page.locator('text=Вопрос по списанию средств')).toBeVisible();
  });

  test('TC-133: Фильтры обращений поддержки (Все, Активные, Закрытые)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    await page.route('**/api/v1/support-tickets*', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 101,
            subject: 'Активный тикет по доступу',
            topic: 'access',
            status: 'NEW',
            createdAt: '2026-10-17T01:00:00Z',
          },
        ],
      });
    });

    await page.goto('/support');

    // Проверяем фильтры
    await expect(page.locator('button:has-text("Все")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Активные")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Закрытые")').first()).toBeVisible();
  });

  test('TC-139: Форма обратной связи /feedback (отправка отзыва)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });

    let feedbackSent = false;
    await page.route('**/api/v1/feedback*', async (route) => {
      if (route.request().method() === 'POST') {
        feedbackSent = true;
        await route.fulfill({
          status: 201,
          json: { id: 777, status: 'NEW', createdAt: new Date().toISOString() },
        });
      } else {
        await route.fulfill({ status: 200, json: [] });
      }
    });

    await page.goto('/feedback');

    // Проверяем форму обратной связи
    const subjectInput = page.locator('input').first();
    await expect(subjectInput).toBeVisible();
    await subjectInput.fill('Предложение по улучшению интерфейса');

    const messageInput = page.locator('textarea').first();
    await expect(messageInput).toBeVisible();
    await messageInput.fill('Хотелось бы добавить темную тему для мобильных устройств.');

    const submitBtn = page.locator('button:has-text("Отправить")').first();
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    expect(feedbackSent).toBe(true);
  });
});
