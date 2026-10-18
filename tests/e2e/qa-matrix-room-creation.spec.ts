import { expect, test } from '@playwright/test';
import { installMockBackend, room, userFixture } from './support/mock-backend';

const digitalService = {
  id: 1,
  name: 'Spotify Family',
  slug: 'spotify-family',
  categoryId: 1,
  providerType: 'DIGITAL',
  popularity: 10,
  logoUrl: null,
};

const telecomService = {
  id: 2,
  name: 'Beeline Family',
  slug: 'beeline-family',
  categoryId: 2,
  providerType: 'OPERATOR',
  popularity: 20,
  logoUrl: null,
};

const digitalTariff5Seats = {
  id: 101,
  serviceId: 1,
  name: 'Premium 6 мест',
  maxMembers: 6,
  basePriceTotal: 6000,
  currency: 'KZT',
  periodType: 'MONTHLY',
  connectionType: 'INVITE',
  description: null,
};

const smallTariff4Seats = {
  id: 102,
  serviceId: 1,
  name: 'Small 4 места',
  maxMembers: 4,
  basePriceTotal: 4000,
  currency: 'KZT',
  periodType: 'MONTHLY',
  connectionType: 'INVITE',
  description: null,
};

const telecomTariff6Seats = {
  id: 201,
  serviceId: 2,
  name: 'Семья 6 номеров',
  maxMembers: 6,
  basePriceTotal: 7800,
  currency: 'KZT',
  periodType: 'MONTHLY',
  connectionType: 'ESIM',
  description: null,
};

function setupRoomCreationMocks(page: import('@playwright/test').Page, overrides: { phoneVerified?: boolean; hasPayoutCard?: boolean } = {}) {
  const isPhoneVerified = overrides.phoneVerified ?? true;
  const hasCard = overrides.hasPayoutCard ?? true;

  // Мок списка сервисов
  page.route('**/api/v1/catalog/services**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([digitalService, telecomService]),
    });
  });

  // Мок тарифов для сервиса 1 (цифровой)
  page.route('**/api/v1/catalog/services/1/tariffs**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([digitalTariff5Seats, smallTariff4Seats]),
    });
  });

  // Мок тарифов для сервиса 2 (телеком)
  page.route('**/api/v1/catalog/services/2/tariffs**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([telecomTariff6Seats]),
    });
  });

  // Мок минимальной вместимости (5 мест)
  page.route('**/api/v1/site/room-settings**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ minimumRoomMembers: 5 }),
    });
  });

  // Мок расчета цен
  page.route('**/api/v1/rooms/pricing-preview**', async (route) => {
    const postData = route.request().postDataJSON() || {};
    const existing = postData.existingMembersCount || 1;
    const max = 6;
    const marketplaceCapacity = max - existing;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        tariffPlanId: postData.tariffPlanId || 101,
        maxMembers: max,
        existingMembersCount: existing,
        marketplaceCapacity,
        originalTariffPrice: 6000,
        originalTariffCurrency: 'KZT',
        shareKzt: 1000,
        commissionKzt: 200,
        payableTotalKzt: 1200,
        potentialMemberPaymentsTotalKzt: 1200 * marketplaceCapacity,
        potentialOwnerPayoutKzt: 1000 * marketplaceCapacity,
        potentialEcoPayCommissionKzt: 200 * marketplaceCapacity,
      }),
    });
  });

  // Мок карт для выплат
  page.route('**/api/v1/payouts/methods**', async (route) => {
    if (hasCard) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, maskedPan: '4405 **** **** 1234', isDefault: true, status: 'ACTIVE' },
        ]),
      });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  });

  // Мок создания комнаты
  page.route('**/api/v1/rooms', async (route) => {
    if (route.request().method() === 'POST') {
      const payload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(room(888, { title: payload.title, maxMembers: 6 })),
      });
    } else {
      await route.fallback();
    }
  });
}

test.describe('EcoPay QA Matrix: Модуль «Создание комнаты» (TC-058..TC-067)', () => {
  test('TC-058: Нельзя создать комнату без подтверждённого номера телефона', async ({ page }) => {
    const unverifiedUser = { ...userFixture, phoneVerified: false };
    await installMockBackend(page, {
      language: 'ru',
      role: 'USER',
      seedSession: true,
    });
    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'test-token', user: unverifiedUser }),
      });
    });
    setupRoomCreationMocks(page, { phoneVerified: false });

    await page.goto('/rooms/create');

    // Проверяем баннер о необходимости подтвердить телефон
    const phoneWarning = page.locator('text=Подтвердите номер телефона перед созданием комнаты');
    await expect(phoneWarning).toBeVisible();

    const profileLink = page.locator('a[href="/profile"]').filter({ hasText: /Перейти в профиль/i });
    await expect(profileLink).toBeVisible();
  });

  test('TC-059: Форма создания комнаты требует привязанную карту для выплат', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });
    setupRoomCreationMocks(page, { hasPayoutCard: false });

    await page.goto('/rooms/create');

    // Проверяем предупреждение о необходимости карты
    await expect(page.locator('text=Нужна карта для выплат')).toBeVisible();

    // Кнопка подключения карты
    const connectCardBtn = page.locator('button:has-text("Подключить карту через FreedomPay")');
    await expect(connectCardBtn).toBeVisible();
  });

  test('TC-060: Ошибка подключения карты выплат отображает понятное уведомление', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });
    setupRoomCreationMocks(page, { hasPayoutCard: false });

    // Ошибка от API при попытке привязать карту
    await page.route('**/api/v1/payouts/methods/binding', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Ошибка связи с банком' }),
      });
    });

    await page.goto('/rooms/create');

    const connectCardBtn = page.locator('button:has-text("Подключить карту через FreedomPay")');
    await connectCardBtn.click();

    // Появляется сообщение об ошибке
    await expect(page.locator('text=Ошибка связи с банком')).toBeVisible();
  });

  test('TC-061: Создание цифровой комнаты (4 шага от выбора тарифа до публикации)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });
    setupRoomCreationMocks(page, { hasPayoutCard: true, phoneVerified: true });

    await page.goto('/rooms/create');

    // Шаг 0: Выбор сервиса и тарифа через <select>
    const serviceSelect = page.locator('select').first();
    await serviceSelect.selectOption('1'); // Spotify Family

    const tariffSelect = page.locator('select').nth(1);
    await expect(tariffSelect).toBeVisible();
    await tariffSelect.selectOption('101'); // Premium 6 мест

    // Переходим к настройкам
    await page.locator('button:has-text("Продолжить")').click();

    // Шаг 1: Настройки комнаты
    const titleInput = page.locator('input').first();
    await expect(titleInput).toBeVisible();
    await page.locator('button:has-text("Продолжить")').click();

    // Шаг 2: Для цифровой комнаты идентификатор связи не требуется
    await expect(page.locator('text=Цифровые подписки')).toBeVisible();
    await page.locator('button:has-text("Продолжить")').click();

    // Шаг 3: Проверка и публикация
    await expect(page.locator('text=Проверка и публикация')).toBeVisible();
    const publishBtn = page.locator('button:has-text("Опубликовать комнату")');
    await expect(publishBtn).toBeEnabled();
    await publishBtn.click();

    // Экран успеха
    await expect(page.locator('text=Комната опубликована')).toBeVisible();
    await expect(page.locator('a:has-text("Управлять комнатой")')).toBeVisible();
    await expect(page.locator('a:has-text("Открыть в каталоге")')).toBeVisible();
  });

  test('TC-062: Создание телеком-комнаты требует подтверждения условий оператора', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });
    setupRoomCreationMocks(page, { hasPayoutCard: true, phoneVerified: true });

    await page.goto('/rooms/create');

    // Выбираем Beeline Family
    const serviceSelect = page.locator('select').first();
    await serviceSelect.selectOption('2');

    const tariffSelect = page.locator('select').nth(1);
    await tariffSelect.selectOption('201'); // Семья 6 номеров

    await page.locator('button:has-text("Продолжить")').click(); // На шаг 1
    await page.locator('button:has-text("Продолжить")').click(); // На шаг 2 (условия оператора)

    // Шаг 2: Условия оператора
    await expect(page.locator('text=Ограничения оператора')).toBeVisible();
    const confirmCheckbox = page.locator('input[type="checkbox"]');
    const continueBtn = page.locator('button:has-text("Продолжить")');

    // Без галочки кнопка заблокирована
    await expect(continueBtn).toBeDisabled();

    // Ставим галочку
    await confirmCheckbox.check();
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // Проверяем тип на шаге 3: Связь
    await expect(page.locator('text=Проверка и публикация')).toBeVisible();
    await expect(page.locator('text=Связь')).toBeVisible();
  });

  test('TC-063: На шаге проверки корректно отображаются суммы «Участники заплатят» и «Вам поступит»', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });
    setupRoomCreationMocks(page, { hasPayoutCard: true, phoneVerified: true });

    await page.goto('/rooms/create');

    const serviceSelect = page.locator('select').first();
    await serviceSelect.selectOption('1');
    const tariffSelect = page.locator('select').nth(1);
    await tariffSelect.selectOption('101');

    await page.locator('button:has-text("Продолжить")').click();
    await page.locator('button:has-text("Продолжить")').click();
    await page.locator('button:has-text("Продолжить")').click();

    // Проверяем наличие детальных финансовых строк
    await expect(page.locator('text=Участники заплатят')).toBeVisible();
    await expect(page.locator('text=Вам поступит')).toBeVisible();
    await expect(page.locator('text=Комиссия EcoPay').first()).toBeVisible();
  });

  test('TC-064: Режим «Я + ещё 1 человек» корректно уменьшает число мест для поиска', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });
    setupRoomCreationMocks(page, { hasPayoutCard: true, phoneVerified: true });

    await page.goto('/rooms/create');

    const serviceSelect = page.locator('select').first();
    await serviceSelect.selectOption('1');
    const tariffSelect = page.locator('select').nth(1);
    await tariffSelect.selectOption('101');

    // Кликаем «Я + ещё 1 человек»
    const plusOneBtn = page.locator('button:has-text("Я + ещё 1 человек")');
    await expect(plusOneBtn).toBeVisible();
    await plusOneBtn.click();

    // Проверяем перерасчет: занято 2 из 6, найдет 4
    await expect(page.locator('text=Уже занято: 2 из 6')).toBeVisible();
    await expect(page.locator('text=EcoPay поможет найти ещё 4 человек')).toBeVisible();
  });

  test('TC-065: Тарифы с малым числом мест скрыты в соответствии с правилом минимума (Баг C-09)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });
    setupRoomCreationMocks(page, { hasPayoutCard: true, phoneVerified: true });

    await page.goto('/rooms/create');

    const serviceSelect = page.locator('select').first();
    await serviceSelect.selectOption('1');

    const tariffSelect = page.locator('select').nth(1);
    await expect(tariffSelect).toBeVisible();

    const options = await tariffSelect.locator('option').allInnerTexts();
    // Тариф на 6 мест доступен в списке
    expect(options.some((t) => t.includes('Premium 6 мест'))).toBe(true);
    // Тариф на 4 места скрыт из-за правила 5 мест
    expect(options.some((t) => t.includes('Small 4 места'))).toBe(false);

    // Отображается уведомление о правиле минимальной вместимости
    await expect(page.locator('text=Для новых комнат минимум 5 мест')).toBeVisible();
  });

  test('TC-066: Валидация ограничения длины названия комнаты (макс 150 символов)', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });
    setupRoomCreationMocks(page, { hasPayoutCard: true, phoneVerified: true });

    await page.goto('/rooms/create');

    const serviceSelect = page.locator('select').first();
    await serviceSelect.selectOption('1');
    const tariffSelect = page.locator('select').nth(1);
    await tariffSelect.selectOption('101');

    await page.locator('button:has-text("Продолжить")').click();

    const titleInput = page.locator('input[maxLength="150"]');
    await expect(titleInput).toBeVisible();

    // Пытаемся ввести 170 символов
    const longString = 'a'.repeat(170);
    await titleInput.fill(longString);

    // Поле должно обрезать значение до 150 символов
    const actualValue = await titleInput.inputValue();
    expect(actualValue.length).toBe(150);
    await expect(page.locator('text=150/150')).toBeVisible();
  });

  test('TC-067: HTML-теги в названии комнаты экранируются как безопасный текст', async ({ page }) => {
    await installMockBackend(page, { language: 'ru', role: 'USER' });
    setupRoomCreationMocks(page, { hasPayoutCard: true, phoneVerified: true });

    await page.goto('/rooms/create');

    const serviceSelect = page.locator('select').first();
    await serviceSelect.selectOption('1');
    const tariffSelect = page.locator('select').nth(1);
    await tariffSelect.selectOption('101');

    await page.locator('button:has-text("Продолжить")').click();

    const titleInput = page.locator('input[maxLength="150"]');
    const xssPayload = '<img src=x onerror=alert(1)>';
    await titleInput.fill(xssPayload);

    await page.locator('button:has-text("Продолжить")').click();
    await page.locator('button:has-text("Продолжить")').click();

    // На шаге проверки текст отображается как сырая строка, алерт не всплывает
    const summaryCard = page.locator('.max-w-2xl');
    await expect(summaryCard.locator(`text=${xssPayload}`)).toBeVisible();
  });
});
