// Localized mapping of backend error responses to user-safe copy.
//
// The backend (ecopay-backend) throws ~300 English messages and, today, sends
// a stable `ErrorResponse.code` for only a handful of cases. This module turns
// a backend error into localized ru/kz/en copy via two lookups:
//
//   1. by `ErrorResponse.code`  — the stable, preferred path.
//   2. by the exact English message string — the fallback for the (currently
//      majority) cases where no code is sent. Matching is exact on the trimmed
//      string, case-insensitively. NO fuzzy / regex matching: on money-related
//      text a wrong match is worse than a generic fallback.
//
// Every entry is classified:
//   USER_ACTIONABLE — the user can understand and fix it → show the specific copy.
//   SUPPORT         — not the user's fault → show reassuring copy, point to support.
//   INTERNAL        — infra/provider/crypto detail → NEVER shown; resolve() returns
//                     null so the caller falls back to the generic localized message
//                     for the HTTP status.
//
// `resolveServerMessage()` is consumed only by lib/api.ts `buildFriendlyApiMessage`.
// It never returns a provider (FreedomPay/Mobizon) string, a stack trace, a
// token/card-mask/idempotency-key, or any INTERNAL copy.

import type { Language } from './locale';

export type ServerMessageClass = 'USER_ACTIONABLE' | 'SUPPORT' | 'INTERNAL';

interface Entry {
  readonly cls: ServerMessageClass;
  /** Localized copy. Omitted for INTERNAL entries (they are never shown). */
  readonly ru?: string;
  readonly kz?: string;
  readonly en?: string;
}

const SUPPORT_HINT = {
  ru: 'Обратитесь в поддержку, мы поможем разобраться.',
  kz: 'Қолдау қызметіне хабарласыңыз, біз көмектесеміз.',
  en: 'Please contact support and we will help sort it out.',
} as const;

function a(ru: string, kz: string, en: string): Entry {
  return { cls: 'USER_ACTIONABLE', ru, kz, en };
}
function s(ru: string, kz: string, en: string): Entry {
  return { cls: 'SUPPORT', ru, kz, en };
}
const INTERNAL: Entry = { cls: 'INTERNAL' };

// ---------------------------------------------------------------------------
// 1. Stable code map (ErrorResponse.code → copy). Preferred path.
//    These codes are already emitted by the backend today.
// ---------------------------------------------------------------------------
const BY_CODE: Record<string, Entry> = {
  ROOM_FULL: a(
    'В этой комнате не осталось свободных мест.',
    'Бұл бөлмеде бос орын қалмады.',
    'This room has no free seats left.',
  ),
  IDEMPOTENCY_KEY_CONFLICT: s(
    'Этот платёж уже обрабатывается. Обновите страницу — повторно платить не нужно.',
    'Бұл төлем өңделуде. Бетті жаңартыңыз — қайта төлеудің қажеті жоқ.',
    'This payment is already being processed. Refresh the page — no need to pay again.',
  ),
  PAYMENTS_TEMPORARILY_DISABLED: s(
    'Платежи временно недоступны. Попробуйте немного позже.',
    'Төлемдер уақытша қолжетімсіз. Сәл кейінірек қайталап көріңіз.',
    'Payments are temporarily unavailable. Please try again a little later.',
  ),
  ACCOUNT_DELETION_BLOCKED: s(
    'Аккаунт нельзя удалить, пока есть незавершённые операции или обязательства.',
    'Аяқталмаған операциялар немесе міндеттемелер болса, аккаунтты жою мүмкін емес.',
    'Your account can’t be deleted while you have unfinished operations or obligations.',
  ),
  USER_REPORT_ALREADY_OPEN: a(
    'По этому пользователю уже есть открытая жалоба.',
    'Бұл пайдаланушы бойынша ашық шағым бар.',
    'There is already an open report about this user.',
  ),
  USER_REPORT_CLOSED: a(
    'Эта жалоба уже закрыта.',
    'Бұл шағым жабылған.',
    'This report has already been closed.',
  ),
  // ACCOUNT_BANNED carries its own `reason`/`banUntil` and is rendered by the
  // auth screens directly; mapped here so generic callers stay safe.
  ACCOUNT_BANNED: s(
    'Доступ к аккаунту ограничен.',
    'Аккаунтқа қолжетімділік шектелген.',
    'Access to this account is restricted.',
  ),
};

// ---------------------------------------------------------------------------
// 2. Exact-English-message map (fallback when no code is sent). Keyed by the
//    trimmed, lower-cased English string exactly as the backend throws it.
// ---------------------------------------------------------------------------
const BY_MESSAGE_RAW: Record<string, Entry> = {
  // ---- English messages that the backend pairs with a stable code today.
  //      Duplicated here on the message path because the frontend does not yet
  //      plumb ErrorResponse.code into buildFriendlyApiMessage (see
  //      docs/BACKEND_ERROR_CODES.md handover item). Once plumbed, the BY_CODE
  //      path takes over automatically. ----
  'Room is full': a(
    'В этой комнате не осталось свободных мест.',
    'Бұл бөлмеде бос орын қалмады.',
    'This room has no free seats left.',
  ),
  'New payments are temporarily disabled': s(
    'Платежи временно недоступны. Попробуйте немного позже.',
    'Төлемдер уақытша қолжетімсіз. Сәл кейінірек қайталап көріңіз.',
    'Payments are temporarily unavailable. Please try again a little later.',
  ),
  'Report already open': a(
    'По этому пользователю уже есть открытая жалоба.',
    'Бұл пайдаланушы бойынша ашық шағым бар.',
    'There is already an open report about this user.',
  ),
  'Report already closed': a(
    'Эта жалоба уже закрыта.',
    'Бұл шағым жабылған.',
    'This report has already been closed.',
  ),
  'Account is not active': s(
    'С аккаунтом возникла проблема.',
    'Аккаунтпен мәселе туындады.',
    'There is a problem with your account.',
  ),

  // ---- Rooms: join / capacity / start-date / lifecycle ----
  'Cannot join room after start date': a(
    'Присоединиться нельзя: дата старта комнаты уже прошла.',
    'Қосылу мүмкін емес: бөлменің басталу күні өтіп кетті.',
    'You can’t join: the room’s start date has already passed.',
  ),
  'Room is not available for joining': a(
    'Комната сейчас недоступна для присоединения.',
    'Бөлме қазір қосылуға қолжетімсіз.',
    'This room isn’t open for joining right now.',
  ),
  'Payment window is closed for this room': a(
    'Окно оплаты для этой комнаты закрыто.',
    'Бұл бөлмеге төлем терезесі жабылды.',
    'The payment window for this room is closed.',
  ),
  'No available slots in this room': a(
    'В этой комнате не осталось свободных мест.',
    'Бұл бөлмеде бос орын қалмады.',
    'This room has no free seats left.',
  ),
  'User has already joined this room': a(
    'Вы уже участвуете в этой комнате.',
    'Сіз бұл бөлмеге бұрыннан қосылғансыз.',
    'You have already joined this room.',
  ),
  'Room owner cannot join own room': a(
    'Владелец не может присоединиться к собственной комнате.',
    'Иесі өз бөлмесіне қосыла алмайды.',
    'The owner can’t join their own room.',
  ),
  'Consent must be accepted': a(
    'Чтобы продолжить, подтвердите согласие с условиями.',
    'Жалғастыру үшін шарттармен келісіміңізді растаңыз.',
    'Please accept the terms to continue.',
  ),
  'Only OPEN rooms can be updated': a(
    'Комнату можно редактировать только пока она открыта.',
    'Бөлмені тек ашық кезінде ғана өңдеуге болады.',
    'A room can only be edited while it is open.',
  ),
  'Room cannot be updated after start date': a(
    'После даты старта комнату изменить нельзя.',
    'Басталу күнінен кейін бөлмені өзгерту мүмкін емес.',
    'A room can’t be changed after its start date.',
  ),
  'Room is not blocked': a(
    'Эта комната не заблокирована.',
    'Бұл бөлме бұғатталмаған.',
    'This room is not blocked.',
  ),
  'Max members must be at least 2': a(
    'В комнате должно быть не меньше 2 участников.',
    'Бөлмеде кемінде 2 қатысушы болуы керек.',
    'A room needs at least 2 members.',
  ),
  'maxMembers must be at least 2': a(
    'В комнате должно быть не меньше 2 участников.',
    'Бөлмеде кемінде 2 қатысушы болуы керек.',
    'A room needs at least 2 members.',
  ),
  'Start date must be in the future': a(
    'Дата старта должна быть в будущем.',
    'Басталу күні болашақта болуы керек.',
    'The start date must be in the future.',
  ),
  'Operator terms must be confirmed for TELECOM room': a(
    'Подтвердите условия оператора, чтобы создать комнату.',
    'Бөлмені құру үшін оператор шарттарын растаңыз.',
    'Confirm the operator’s terms to create the room.',
  ),
  'Connection type is required for TELECOM room': a(
    'Укажите способ подключения для комнаты оператора.',
    'Оператор бөлмесі үшін қосылу әдісін көрсетіңіз.',
    'Choose a connection method for the operator room.',
  ),
  'Provider name is required for TELECOM room': a(
    'Укажите оператора для этой комнаты.',
    'Бұл бөлме үшін операторды көрсетіңіз.',
    'Choose a provider for this room.',
  ),

  // ---- Membership lifecycle (member-facing) ----
  'Owner has not confirmed access yet': a(
    'Владелец ещё не подтвердил доступ. Подтвердить получение можно после этого.',
    'Иесі әлі қолжетімділікті растаған жоқ. Одан кейін растауға болады.',
    'The owner hasn’t granted access yet. You can confirm once they do.',
  ),
  'Access can only be confirmed for PENDING membership': a(
    'Подтвердить доступ можно только для участия в статусе «Ожидает».',
    'Қолжетімділікті тек «Күтуде» мәртебесіндегі қатысу үшін растауға болады.',
    'Access can only be confirmed while the membership is pending.',
  ),
  'There is already an open complaint for this membership': a(
    'По этому участию уже открыта жалоба.',
    'Бұл қатысу бойынша шағым ашылған.',
    'There is already an open complaint for this membership.',
  ),

  // ---- Payments ----
  'Inactive users cannot create payments': a(
    'Подтвердите аккаунт, чтобы совершать платежи.',
    'Төлем жасау үшін аккаунтыңызды растаңыз.',
    'Verify your account to make payments.',
  ),
  'Saved card not found or inactive': a(
    'Сохранённая карта недоступна. Выберите другую или добавьте новую.',
    'Сақталған карта қолжетімсіз. Басқасын таңдаңыз немесе жаңасын қосыңыз.',
    'That saved card isn’t available. Pick another or add a new one.',
  ),
  'Idempotency key belongs to another user': s(
    'Не удалось продолжить этот платёж. Начните оплату заново.',
    'Бұл төлемді жалғастыру мүмкін болмады. Төлемді қайта бастаңыз.',
    'We couldn’t continue this payment. Please start the payment again.',
  ),
  'Idempotency key belongs to a different payment request': s(
    'Этот платёж уже обрабатывается. Обновите страницу — повторно платить не нужно.',
    'Бұл төлем өңделуде. Бетті жаңартыңыз — қайта төлеудің қажеті жоқ.',
    'This payment is already being processed. Refresh the page — no need to pay again.',
  ),

  // ---- Payout / card binding (owner-facing) ----
  'Card is not active': a(
    'Эта карта неактивна. Привяжите другую карту для выплат.',
    'Бұл карта белсенді емес. Төлемдер үшін басқа картаны байланыстырыңыз.',
    'This card isn’t active. Connect a different payout card.',
  ),
  'Card binding not found': a(
    'Привязка карты не найдена. Попробуйте привязать карту заново.',
    'Карта байланысы табылмады. Картаны қайта байланыстырып көріңіз.',
    'Card connection not found. Try connecting the card again.',
  ),
  'Payout amount must be greater than zero': s(
    'Сумму выплаты не удалось рассчитать. Обратитесь в поддержку.',
    'Аударым сомасын есептеу мүмкін болмады. Қолдау қызметіне хабарласыңыз.',
    'The payout amount couldn’t be calculated. Please contact support.',
  ),

  // ---- Refunds / disputes (user-facing informational) ----
  'Dispute has already been decided': a(
    'Решение по этому спору уже принято. Обновите страницу.',
    'Бұл дау бойынша шешім қабылданған. Бетті жаңартыңыз.',
    'This dispute has already been decided. Refresh the page.',
  ),
  'Approved refund request cannot be rejected': a(
    'Одобренный возврат уже нельзя отклонить.',
    'Мақұлданған қайтарымнан бас тарту мүмкін емес.',
    'An approved refund can no longer be rejected.',
  ),
  'Rejected refund request cannot be approved': a(
    'Отклонённый возврат уже нельзя одобрить.',
    'Қабылданбаған қайтарымды мақұлдау мүмкін емес.',
    'A rejected refund can no longer be approved.',
  ),

  // ---- Support tickets ----
  'Cannot write to closed ticket': a(
    'Эта заявка закрыта. Создайте новую, если нужна помощь.',
    'Бұл өтінім жабық. Көмек қажет болса, жаңасын жасаңыз.',
    'This ticket is closed. Open a new one if you still need help.',
  ),
  'You can only write to your own ticket': s(
    'Эту заявку нельзя открыть.',
    'Бұл өтінімді ашу мүмкін емес.',
    'This ticket can’t be opened.',
  ),
  'You cannot create ticket for this membership': a(
    'По этому участию нельзя создать заявку.',
    'Бұл қатысу бойынша өтінім жасау мүмкін емес.',
    'You can’t open a ticket for this membership.',
  ),
  'Message is empty': a(
    'Введите сообщение.',
    'Хабарлама енгізіңіз.',
    'Please enter a message.',
  ),

  // ---- Reviews & reports ----
  'Cannot review yourself': a(
    'Нельзя оставить отзыв самому себе.',
    'Өзіңізге пікір қалдыра алмайсыз.',
    'You can’t review yourself.',
  ),
  'Cannot report yourself': a(
    'Нельзя пожаловаться на самого себя.',
    'Өзіңізге шағымдана алмайсыз.',
    'You can’t report yourself.',
  ),
  'Report description must contain at least 20 characters': a(
    'Опишите проблему подробнее — не меньше 20 символов.',
    'Мәселені толығырақ сипаттаңыз — кемінде 20 таңба.',
    'Describe the problem in at least 20 characters.',
  ),
  'You have already submitted a service review': a(
    'Вы уже оставили отзыв об этом сервисе.',
    'Сіз бұл сервис туралы пікір қалдырғансыз.',
    'You have already reviewed this service.',
  ),
  'Only a paid active or pending membership can be reported': a(
    'Пожаловаться можно только по оплаченному участию.',
    'Тек төленген қатысу бойынша ғана шағымдануға болады.',
    'Only a paid membership can be reported.',
  ),

  // ---- Profile / slug / email ----
  'Invalid slug': a(
    'Такой адрес профиля использовать нельзя. Выберите другой.',
    'Мұндай профиль мекенжайын пайдалану мүмкін емес. Басқасын таңдаңыз.',
    'That profile address can’t be used. Choose another.',
  ),
  'Slug is already taken': a(
    'Этот адрес профиля уже занят.',
    'Бұл профиль мекенжайы бос емес.',
    'That profile address is already taken.',
  ),
  'This email is already attached to your account': a(
    'Эта почта уже привязана к вашему аккаунту.',
    'Бұл пошта аккаунтыңызға бұрыннан байланыстырылған.',
    'This email is already attached to your account.',
  ),

  // ---- Account / room creation gating ----
  'Verify your phone number before creating a room': a(
    'Подтвердите номер телефона, чтобы создать комнату.',
    'Бөлме құру үшін телефон нөміріңізді растаңыз.',
    'Verify your phone number before creating a room.',
  ),

  // ---- Verification codes ----
  'Invalid verification code': a(
    'Неверный код. Проверьте и введите ещё раз.',
    'Код қате. Тексеріп, қайта енгізіңіз.',
    'Wrong code. Check it and try again.',
  ),
  'Invalid or expired verification code': a(
    'Код неверный или истёк. Запросите новый.',
    'Код қате немесе мерзімі өтті. Жаңасын сұратыңыз.',
    'The code is wrong or expired. Request a new one.',
  ),

  // ---- Avatar / image upload (user-facing: their file is the problem) ----
  'File is required': a(
    'Выберите файл.',
    'Файл таңдаңыз.',
    'Please choose a file.',
  ),
  'Файл не передан': a(
    'Выберите файл.',
    'Файл таңдаңыз.',
    'Please choose a file.',
  ),
  'File is too large': a(
    'Файл слишком большой. Выберите изображение поменьше.',
    'Файл тым үлкен. Кішірек суретті таңдаңыз.',
    'That file is too large. Pick a smaller image.',
  ),
  'Image dimensions are too large': a(
    'Изображение слишком большое. Загрузите поменьше.',
    'Сурет тым үлкен. Кішірегін жүктеңіз.',
    'That image is too large. Upload a smaller one.',
  ),
  'Only PNG and JPG files are supported': a(
    'Поддерживаются только файлы PNG и JPG.',
    'Тек PNG және JPG файлдары қолдау көрсетіледі.',
    'Only PNG and JPG files are supported.',
  ),
  'Разрешены только файлы png, jpg, jpeg': a(
    'Поддерживаются только файлы PNG и JPG.',
    'Тек PNG және JPG файлдары қолдау көрсетіледі.',
    'Only PNG and JPG files are supported.',
  ),
  'File is not a valid image': a(
    'Это не похоже на изображение. Выберите другой файл.',
    'Бұл суретке ұқсамайды. Басқа файл таңдаңыз.',
    'That doesn’t look like an image. Choose another file.',
  ),
  'Файл не похож на изображение (неверная сигнатура)': a(
    'Это не похоже на изображение. Выберите другой файл.',
    'Бұл суретке ұқсамайды. Басқа файл таңдаңыз.',
    'That doesn’t look like an image. Choose another file.',
  ),
  'Failed to decode image': a(
    'Не удалось открыть это изображение. Попробуйте другой файл.',
    'Бұл суретті ашу мүмкін болмады. Басқа файлды көріңіз.',
    'We couldn’t open that image. Try another file.',
  ),
  'Не удалось декодировать изображение': a(
    'Не удалось открыть это изображение. Попробуйте другой файл.',
    'Бұл суретті ашу мүмкін болмады. Басқа файлды көріңіз.',
    'We couldn’t open that image. Try another file.',
  ),

  // ---- Rate limits ----
  'Please wait before requesting another code.': a(
    'Подождите немного перед запросом нового кода.',
    'Жаңа кодты сұрамас бұрын сәл күтіңіз.',
    'Please wait a moment before requesting another code.',
  ),
  'Too many confirmation emails. Try again later.': a(
    'Слишком много писем с кодом. Попробуйте позже.',
    'Кодпен хат тым көп жіберілді. Кейінірек қайталаңыз.',
    'Too many confirmation emails. Please try again later.',
  ),
  'Too many user reports. Try again later.': a(
    'Слишком много жалоб. Попробуйте позже.',
    'Шағым тым көп. Кейінірек қайталаңыз.',
    'Too many reports. Please try again later.',
  ),

  // =========================================================================
  // INTERNAL — infra / crypto / provider. NEVER shown to a user.
  // =========================================================================
  'Failed to process image': INTERNAL,
  'Failed to store image': INTERNAL,
  'Failed to read file': INTERNAL,
  'Не удалось обработать изображение': INTERNAL,
  'Не удалось сохранить файл в хранилище': INTERNAL,
  'Не удалось прочитать файл': INTERNAL,
  'Failed to decrypt field': INTERNAL,
  'Failed to encrypt field': INTERNAL,
  'MD5 not available': INTERNAL,
  'SHA-256 not available': INTERNAL,
  'SHA-256 is unavailable': INTERNAL,
  'ImageIO returned no JPEG writer': INTERNAL,
  'bad HTTP status': INTERNAL,
  'providerCardToken is required': INTERNAL,
  'app.frontend-url must be configured': INTERNAL,
  // Provider strings (FreedomPay / Mobizon) — never surfaced in any language.
  'Freedom Pay request failed': INTERNAL,
  'Mobizon SMS request failed': INTERNAL,
  'Mobizon SMS request interrupted': INTERNAL,
  'Mobizon SMS request was rejected': INTERNAL,
  'Email sending interrupted': INTERNAL,
  'Unable to send email right now': INTERNAL,
};

// Normalize the raw map keys once for case-insensitive exact matching.
const BY_MESSAGE: Map<string, Entry> = new Map(
  Object.entries(BY_MESSAGE_RAW).map(([k, v]) => [k.trim().toLowerCase(), v]),
);

function localized(entry: Entry, language: Language): string | null {
  if (entry.cls === 'INTERNAL') return null;
  const value = entry[language] ?? entry.ru ?? entry.en ?? null;
  if (!value) return null;
  if (entry.cls === 'SUPPORT') {
    // Append a support pointer unless the copy already mentions support.
    const hint = SUPPORT_HINT[language] ?? SUPPORT_HINT.ru;
    const mentionsSupport = /поддержк|қолдау|support/i.test(value);
    return mentionsSupport ? value : `${value} ${hint}`;
  }
  return value;
}

/**
 * Resolve a backend error into localized, user-safe copy.
 *
 * @returns localized string for USER_ACTIONABLE / SUPPORT entries, or `null`
 *   when there is no mapping OR the mapping is INTERNAL (caller must then use
 *   its own generic localized fallback for the HTTP status).
 */
export function resolveServerMessage(
  _status: number,
  code: string | null | undefined,
  rawMessage: string | null | undefined,
  language: Language,
): string | null {
  // 1. Stable code path (preferred).
  if (code) {
    const byCode = BY_CODE[code.trim().toUpperCase()];
    if (byCode) return localized(byCode, language);
  }

  // 2. Exact English-string path (case-insensitive, trimmed — never fuzzy).
  if (rawMessage) {
    const byMessage = BY_MESSAGE.get(rawMessage.trim().toLowerCase());
    if (byMessage) return localized(byMessage, language);
  }

  return null;
}

/** Test/scanner hook: every mapped entry, with its classification. */
export function allServerMessageEntries(): Array<{ key: string; entry: Entry }> {
  return [
    ...Object.entries(BY_CODE).map(([key, entry]) => ({ key: `code:${key}`, entry })),
    ...Object.entries(BY_MESSAGE_RAW).map(([key, entry]) => ({ key: `msg:${key}`, entry })),
  ];
}
