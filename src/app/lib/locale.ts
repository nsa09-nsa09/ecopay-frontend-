// Lightweight module-level locale + friendly error strings.
//
// The API layer (lib/api.ts) has to produce user-visible fallback text when an
// HTTP error happens, but it cannot use the React i18n context (it is not a
// component). To keep raw server exceptions from leaking into the UI we route
// the fallback through this module: I18nProvider syncs the current language
// here on every render, and `getFriendlyApiMessage(code)` returns a translated
// string that is safe to display.

export type Language = 'ru' | 'kz' | 'en';

let currentLanguage: Language = 'ru';

export function setCurrentLanguage(lang: Language): void {
  currentLanguage = lang;
}

export function getCurrentLanguage(): Language {
  return currentLanguage;
}

export type FriendlyApiErrorCode =
  | 'notAvailable' // 404 / "no static resource"
  | 'noAccess' // 401 / 403
  | 'sessionExpired' // 401 (when token expired)
  | 'serverError' // 5xx
  | 'rateLimited' // 429 (too many requests)
  | 'network' // fetch failure, no response
  | 'timeout' // no response within the client time budget
  | 'validation' // 400 / 422 — the request was rejected as invalid
  | 'conflict' // 409 — state changed (already done, taken, stale data)
  | 'generic'; // anything else

const FRIENDLY: Record<FriendlyApiErrorCode, Record<Language, string>> = {
  notAvailable: {
    ru: 'Раздел временно недоступен.',
    kz: 'Бөлім уақытша қолжетімсіз.',
    en: 'This section is temporarily unavailable.',
  },
  noAccess: {
    ru: 'Недостаточно прав.',
    kz: 'Құқықтар жеткіліксіз.',
    en: "You don't have permission to do this.",
  },
  sessionExpired: {
    ru: 'Сессия истекла. Войдите снова.',
    kz: 'Сессия аяқталды. Қайта кіріңіз.',
    en: 'Your session has expired. Please sign in again.',
  },
  serverError: {
    ru: 'Не удалось загрузить данные. Попробуйте позже.',
    kz: 'Деректерді жүктеу мүмкін болмады. Кейінірек қайталап көріңіз.',
    en: "Couldn't load the data. Please try again later.",
  },
  rateLimited: {
    ru: 'Слишком много запросов. Попробуйте позже.',
    kz: 'Сұраныстар тым көп. Кейінірек қайталап көріңіз.',
    en: 'Too many requests. Please try again later.',
  },
  network: {
    ru: 'Проблема с подключением. Проверьте сеть.',
    kz: 'Желіге қосылу мәселесі. Қосылымды тексеріңіз.',
    en: 'Network error. Check your connection.',
  },
  timeout: {
    ru: 'Сервер долго не отвечает. Проверьте результат, прежде чем повторять действие.',
    kz: 'Сервер ұзақ жауап бермей тұр. Әрекетті қайталамас бұрын нәтижесін тексеріңіз.',
    en: 'The server is taking too long. Check the result before repeating the action.',
  },
  validation: {
    ru: 'Проверьте введённые данные.',
    kz: 'Енгізілген деректерді тексеріңіз.',
    en: 'Please check the entered data.',
  },
  conflict: {
    ru: 'Данные изменились. Обновите страницу и попробуйте снова.',
    kz: 'Деректер өзгерді. Бетті жаңартып, қайталап көріңіз.',
    en: 'The data has changed. Refresh the page and try again.',
  },
  generic: {
    ru: 'Не удалось загрузить данные.',
    kz: 'Деректерді жүктеу мүмкін болмады.',
    en: "Couldn't load the data.",
  },
};

export function getFriendlyApiMessage(code: FriendlyApiErrorCode): string {
  const entry = FRIENDLY[code];
  return entry[currentLanguage] || entry.ru;
}
