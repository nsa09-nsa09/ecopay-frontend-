import type { Language } from '../components/i18n-provider';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

const METADATA_KEYS = new Set(['code', 'reason', 'bannedAt', 'suggestion']);

function fieldLabel(field: string, language: Language): string {
  switch (field) {
    case 'email':
      return tx(language, 'email', 'email', 'email');
    case 'password':
    case 'newPassword':
      return tx(language, 'пароль', 'құпия сөз', 'password');
    case 'confirmPassword':
      return tx(language, 'подтверждение пароля', 'құпия сөзді растау', 'password confirmation');
    case 'displayName':
      return tx(language, 'имя', 'аты', 'name');
    case 'code':
      return tx(language, 'код', 'код', 'code');
    case 'phone':
      return tx(language, 'номер телефона', 'телефон нөмірі', 'phone number');
    case 'termsAccepted':
      return tx(language, 'согласие с условиями', 'шарттармен келісім', 'terms agreement');
    case 'identifierValue':
      return tx(language, 'контакт для комнаты', 'бөлме байланысы', 'room contact');
    case 'slug':
      return tx(language, 'адрес профиля', 'профиль мекенжайы', 'profile address');
    case 'subject':
      return tx(language, 'тему', 'тақырыпты', 'subject');
    case 'message':
    case 'description':
      return tx(language, 'описание', 'сипаттаманы', 'description');
    default:
      return tx(language, 'поле', 'өріс', 'field');
  }
}

function requiredText(field: string, language: Language): string {
  if (field === 'termsAccepted') {
    return tx(
      language,
      'Подтвердите согласие с условиями и политикой конфиденциальности.',
      'Шарттармен және құпиялылық саясатымен келісімді растаңыз.',
      'Accept the terms and privacy policy.',
    );
  }
  return tx(
    language,
    `Заполните ${fieldLabel(field, language)}.`,
    `${fieldLabel(field, language)} толтырыңыз.`,
    `Enter the ${fieldLabel(field, language)}.`,
  );
}

function invalidText(field: string, language: Language): string {
  switch (field) {
    case 'email':
      return tx(
        language,
        'Проверьте email: похоже, в адресе ошибка.',
        'Email-ді тексеріңіз: мекенжайда қате бар сияқты.',
        'Check the email address.',
      );
    case 'phone':
      return tx(
        language,
        'Введите номер в формате +7XXXXXXXXXX.',
        'Нөмірді +7XXXXXXXXXX форматында енгізіңіз.',
        'Enter the number as +7XXXXXXXXXX.',
      );
    case 'code':
      return tx(
        language,
        'Введите корректный 6-значный код.',
        'Дұрыс 6 таңбалы кодты енгізіңіз.',
        'Enter a valid 6-digit code.',
      );
    case 'password':
    case 'newPassword':
      return tx(
        language,
        'Пароль должен быть не короче 8 символов, с заглавной буквой и цифрой.',
        'Құпия сөз кемінде 8 таңба, бас әріп және сан қамтуы керек.',
        'Use at least 8 characters with an uppercase letter and a number.',
      );
    case 'confirmPassword':
      return tx(language, 'Пароли не совпадают.', 'Құпия сөздер сәйкес келмейді.', 'Passwords do not match.');
    default:
      return tx(
        language,
        `Проверьте ${fieldLabel(field, language)}.`,
        `${fieldLabel(field, language)} тексеріңіз.`,
        `Check the ${fieldLabel(field, language)}.`,
      );
  }
}

function localizeFieldError(field: string, raw: string | undefined, language: Language): string {
  const normalized = (raw ?? '').trim().toLowerCase();
  if (!normalized) return invalidText(field, language);

  if (
    normalized.includes('required') ||
    normalized.includes('must not be blank') ||
    normalized.includes('must not be null') ||
    normalized.includes('обяз') ||
    normalized.includes('қажет')
  ) {
    return requiredText(field, language);
  }

  if (
    normalized.includes('valid') ||
    normalized.includes('invalid') ||
    normalized.includes('format') ||
    normalized.includes('too short') ||
    normalized.includes('size must') ||
    normalized.includes('length')
  ) {
    return invalidText(field, language);
  }

  return invalidText(field, language);
}

export function localizeFieldErrors(
  errors: Record<string, string> | undefined,
  language: Language,
): Record<string, string> {
  const localized: Record<string, string> = {};
  for (const [field, raw] of Object.entries(errors ?? {})) {
    if (METADATA_KEYS.has(field)) continue;
    localized[field] = localizeFieldError(field, raw, language);
  }
  return localized;
}
