import { Check, Loader2 } from 'lucide-react';
import { useI18n, type Language } from '../i18n-provider';
import type {
  EmailFieldStatus,
  EmailFormatError,
  ServerEmailErrorCode,
} from '../../lib/email-validation';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

/**
 * Localized text for each format problem. Deliberately specific — "введите
 * корректный email" tells the user nothing they didn't already know, whereas
 * "не хватает домена после @" tells them where to look.
 */
export function emailFormatErrorText(error: EmailFormatError, language: Language): string {
  switch (error) {
    case 'empty':
      return tx(language, 'Укажите email.', 'Email көрсетіңіз.', 'Enter an email address.');
    case 'noAt':
      return tx(
        language,
        'В адресе не хватает символа @.',
        'Мекенжайда @ таңбасы жоқ.',
        'The address is missing an @ sign.',
      );
    case 'noLocalPart':
      return tx(
        language,
        'Укажите имя до символа @.',
        '@ таңбасына дейін атын көрсетіңіз.',
        'Enter the name before the @ sign.',
      );
    case 'noDomain':
      return tx(
        language,
        'Укажите домен после символа @.',
        '@ таңбасынан кейін доменді көрсетіңіз.',
        'Enter the domain after the @ sign.',
      );
    case 'noTld':
      return tx(
        language,
        'В домене не хватает зоны — например, .com или .kz.',
        'Доменде аймақ жоқ — мысалы, .com немесе .kz.',
        'The domain needs an extension — for example .com or .kz.',
      );
    case 'doubleDot':
      return tx(
        language,
        'В адресе две точки подряд.',
        'Мекенжайда қатарынан екі нүкте бар.',
        'The address has two dots in a row.',
      );
    case 'strayDot':
      return tx(
        language,
        'Адрес не может начинаться или заканчиваться точкой.',
        'Мекенжай нүктеден басталып немесе аяқтала алмайды.',
        'The address cannot start or end with a dot.',
      );
    case 'illegalChar':
      return tx(
        language,
        'В адресе есть недопустимый символ.',
        'Мекенжайда рұқсат етілмеген таңба бар.',
        'The address contains an invalid character.',
      );
    case 'tooLong':
      return tx(
        language,
        'Адрес слишком длинный.',
        'Мекенжай тым ұзын.',
        'The address is too long.',
      );
  }
}

/** Localized text for the checks only the server can make. */
export function serverEmailErrorText(code: ServerEmailErrorCode, language: Language): string {
  switch (code) {
    case 'EMAIL_INVALID_FORMAT':
      return tx(
        language,
        'Адрес указан неверно. Проверьте написание.',
        'Мекенжай дұрыс емес. Жазылуын тексеріңіз.',
        'That address is not valid. Please check the spelling.',
      );
    case 'EMAIL_DOMAIN_NOT_FOUND':
      return tx(
        language,
        'Такой почтовый домен не существует или не принимает письма.',
        'Мұндай пошта домені жоқ немесе хат қабылдамайды.',
        "That email domain doesn't exist or doesn't accept mail.",
      );
    case 'EMAIL_DOMAIN_UNVERIFIABLE':
      return tx(
        language,
        'Не удалось проверить домен. Попробуйте ещё раз.',
        'Доменді тексеру мүмкін болмады. Қайталап көріңіз.',
        "We couldn't verify that domain. Please try again.",
      );
    case 'EMAIL_DELIVERY_FAILED':
      return tx(
        language,
        'Не удалось отправить письмо. Попробуйте через минуту.',
        'Хатты жіберу мүмкін болмады. Бір минуттан кейін көріңіз.',
        "We couldn't send the email. Please try again in a minute.",
      );
  }
}

/**
 * The "did you mean …?" row. Offers the correction as a one-click fix and lets
 * the user wave it away — we are guessing, and small real domains do sometimes
 * sit one character from a big one.
 */
export function EmailSuggestion({
  suggestion,
  onAccept,
  onDismiss,
}: {
  suggestion: string;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const { language } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
      <span style={{ color: 'var(--eco-text-secondary)' }}>
        {tx(language, 'Возможно, вы имели в виду', 'Мүмкін сіз мынаны меңзедіңіз', 'Did you mean')}{' '}
        <span style={{ color: 'var(--eco-text)' }}>{suggestion}</span>?
      </span>
      <button
        type="button"
        onClick={onAccept}
        className="cursor-pointer underline"
        style={{ color: 'var(--eco-primary)', background: 'none', border: 'none', padding: 0 }}
      >
        {tx(language, 'Исправить', 'Түзету', 'Fix it')}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="cursor-pointer"
        style={{
          color: 'var(--eco-text-tertiary)',
          background: 'none',
          border: 'none',
          padding: 0,
        }}
      >
        {tx(language, 'Оставить как есть', 'Сол күйінде қалдыру', 'Keep it')}
      </button>
    </div>
  );
}

/** Small trailing indicator for the field's live state. */
export function EmailFieldStatusHint({ status }: { status: EmailFieldStatus }) {
  const { language } = useI18n();

  if (status === 'checking') {
    return (
      <span
        className="flex items-center gap-1 text-[12px]"
        style={{ color: 'var(--eco-text-tertiary)' }}
      >
        <Loader2 size={12} className="animate-spin" />
        {tx(language, 'Проверяем…', 'Тексеріп жатырмыз…', 'Checking…')}
      </span>
    );
  }

  if (status === 'valid') {
    return (
      <span
        className="flex items-center gap-1 text-[12px]"
        style={{ color: 'var(--eco-positive)' }}
      >
        <Check size={12} />
        {tx(language, 'Адрес выглядит корректно', 'Мекенжай дұрыс көрінеді', 'Address looks good')}
      </span>
    );
  }

  return null;
}
