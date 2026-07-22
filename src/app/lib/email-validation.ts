// Client-side email checks — the fast half of the validation pipeline.
//
// This module deliberately mirrors the backend's EmailNormalizer (same shape
// rules, same typo table) so the user gets instant feedback without a round
// trip. It is a UX layer only: the backend re-validates everything, adds the
// MX lookup it alone can do, and remains the authority. Never treat a pass
// here as permission to skip the server.

export type EmailFormatError =
  | 'empty'
  | 'noAt'
  | 'noLocalPart'
  | 'noDomain'
  | 'noTld'
  | 'doubleDot'
  | 'strayDot'
  | 'illegalChar'
  | 'tooLong';

/** Field state for the inline validator. Drives the label/hint/border colour. */
export type EmailFieldStatus = 'empty' | 'checking' | 'invalid' | 'valid';

export interface EmailCheckResult {
  /** Canonical form: trimmed, lowercased. Send this to the API, not the raw input. */
  normalized: string;
  ok: boolean;
  /** Set when `ok` is false. Maps to a specific localized message. */
  error?: EmailFormatError;
  /** Set when the domain looks like a typo of a popular one. Advisory — never blocks. */
  suggestion?: string;
}

const MAX_TOTAL_LENGTH = 254;
const MAX_LOCAL_LENGTH = 64;

// Kept in sync with EmailNormalizer.KNOWN_DOMAINS on the backend.
const KNOWN_DOMAINS = [
  'gmail.com',
  'mail.ru',
  'yandex.ru',
  'yandex.kz',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'yahoo.com',
  'bk.ru',
  'inbox.ru',
  'list.ru',
  'internet.ru',
  'proton.me',
  'protonmail.com',
  'mail.kz',
  'kaznu.kz',
  'narxoz.kz',
];

// Kept in sync with EmailNormalizer.COMMON_TYPOS on the backend.
const COMMON_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.ru': 'gmail.com',
  'gnail.com': 'gmail.com',
  'mai.ru': 'mail.ru',
  'mial.ru': 'mail.ru',
  'mail.ri': 'mail.ru',
  'maill.ru': 'mail.ru',
  'yandx.ru': 'yandex.ru',
  'yandex.ryu': 'yandex.ru',
  'yandeks.ru': 'yandex.ru',
  'yndex.ru': 'yandex.ru',
  'yandex.com': 'yandex.ru',
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'iclod.com': 'icloud.com',
  'icoud.com': 'icloud.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
};

const SHAPE = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

/**
 * Canonical form used for both display and submission. Strips the invisible
 * whitespace (non-breaking / zero-width) that survives a plain `.trim()` when
 * an address is pasted out of a chat client.
 */
export function normalizeEmail(raw: string): string {
  // JS \s already covers NBSP and BOM; the zero-width range does not, and those
  // are exactly what survives a copy-paste out of a chat client.
  return raw
    .replace(/\s/g, '')
    .replace(/[\u200B-\u200D]/g, '')
    .toLowerCase();
}

function levenshtein(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}

/**
 * Best guess at the address the user meant, or null when the domain looks fine
 * or we have no confident guess. Advisory only — we offer it, never enforce it.
 */
export function suggestEmailCorrection(normalized: string): string | null {
  const at = normalized.lastIndexOf('@');
  if (at < 0) return null;
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  if (!domain || KNOWN_DOMAINS.includes(domain)) return null;

  const mapped = COMMON_TYPOS[domain];
  if (mapped) return `${local}@${mapped}`;

  // Edit distance is a fallback only, and only for domains long enough that a
  // single-character difference is far more likely a typo than a different
  // (legitimate) provider.
  if (domain.length < 8) return null;
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const candidate of KNOWN_DOMAINS) {
    if (Math.abs(candidate.length - domain.length) > 1) continue;
    const distance = levenshtein(domain, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best && bestDistance === 1 ? `${local}@${best}` : null;
}

/**
 * Level-1 format check. Returns the most specific error it can so the UI can
 * say "no domain extension" rather than a blanket "invalid email".
 */
export function checkEmail(raw: string): EmailCheckResult {
  const normalized = normalizeEmail(raw);

  if (!normalized) {
    return { normalized, ok: false, error: 'empty' };
  }
  if (normalized.length > MAX_TOTAL_LENGTH) {
    return { normalized, ok: false, error: 'tooLong' };
  }

  const at = normalized.lastIndexOf('@');
  if (at < 0) {
    return { normalized, ok: false, error: 'noAt' };
  }

  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);

  if (!local) return { normalized, ok: false, error: 'noLocalPart' };
  if (local.length > MAX_LOCAL_LENGTH) return { normalized, ok: false, error: 'tooLong' };
  if (!domain) return { normalized, ok: false, error: 'noDomain' };
  if (local.includes('@')) return { normalized, ok: false, error: 'illegalChar' };

  if (normalized.includes('..')) return { normalized, ok: false, error: 'doubleDot' };
  if (
    local.startsWith('.') ||
    local.endsWith('.') ||
    domain.startsWith('.') ||
    domain.endsWith('.')
  ) {
    return { normalized, ok: false, error: 'strayDot' };
  }
  // A domain with no dot at all has no TLD; report that specifically because
  // "user@gmail" is a common half-typed state, not random garbage.
  if (!domain.includes('.')) return { normalized, ok: false, error: 'noTld' };

  if (!SHAPE.test(normalized)) {
    // Anything left is a stray character somewhere in an otherwise sane shape.
    return { normalized, ok: false, error: 'illegalChar' };
  }

  return {
    normalized,
    ok: true,
    suggestion: suggestEmailCorrection(normalized) ?? undefined,
  };
}

/** True when the string looks like an email attempt rather than a phone number. */
export function looksLikeEmail(raw: string): boolean {
  return raw.includes('@');
}

/**
 * Backend error codes from InvalidEmailException.Reason plus the adjacent
 * failures the email fields need to render distinctly.
 */
export type ServerEmailErrorCode =
  | 'EMAIL_INVALID_FORMAT'
  | 'EMAIL_DOMAIN_NOT_FOUND'
  | 'EMAIL_DOMAIN_UNVERIFIABLE'
  | 'EMAIL_DELIVERY_FAILED';

/** Reads the stable code the backend puts in `errors.code`, if present. */
export function serverEmailErrorCode(
  errors: Record<string, string> | undefined,
): ServerEmailErrorCode | null {
  const code = errors?.code;
  return code === 'EMAIL_INVALID_FORMAT' ||
    code === 'EMAIL_DOMAIN_NOT_FOUND' ||
    code === 'EMAIL_DOMAIN_UNVERIFIABLE' ||
    code === 'EMAIL_DELIVERY_FAILED'
    ? code
    : null;
}
