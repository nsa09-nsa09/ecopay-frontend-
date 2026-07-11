import type { Language } from '../components/i18n-provider';

const ALMATY_TZ = 'Asia/Almaty';

const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  ru: 'ru-RU',
  kz: 'kk-KZ',
  en: 'en-US',
};

function resolveLocale(language?: Language): string {
  return language ? (LOCALE_BY_LANGUAGE[language] ?? 'ru-RU') : 'ru-RU';
}

function parse(value: string | number | Date | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

const dateTimeCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let fmt = dateTimeCache.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, options);
    dateTimeCache.set(key, fmt);
  }
  return fmt;
}

/**
 * Format a date+time value in Asia/Almaty time, honoring the active i18n
 * language. Accepts ISO strings (with or without offset), epoch ms, or Date.
 * Returns an em-dash placeholder for null/invalid values.
 */
export function formatDateTime(
  value: string | number | Date | null | undefined,
  language?: Language,
): string {
  const date = parse(value);
  if (!date) return '—';
  return getFormatter(resolveLocale(language), {
    timeZone: ALMATY_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format only the date portion (no time) in Asia/Almaty.
 */
export function formatDate(
  value: string | number | Date | null | undefined,
  language?: Language,
): string {
  const date = parse(value);
  if (!date) return '—';
  return getFormatter(resolveLocale(language), {
    timeZone: ALMATY_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
