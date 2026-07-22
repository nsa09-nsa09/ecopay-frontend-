// What a member hands over when joining a room, and how it is checked.
//
// Mirrors the backend's ContactIdentifiers (same allowed types, same phone
// shape, same email rules via email-validation.ts) so the join form can reject
// a typo without a round trip. UX layer only — the backend re-validates and
// stays the authority.

import { checkEmail } from './email-validation';
import type { ServiceAccessType } from './api';

export type IdentifierType = 'EMAIL' | 'PHONE' | 'SIM' | 'ESIM' | 'ACCOUNT';

/** The types a service accepts, in the order the join form should offer them. */
export function allowedIdentifierTypes(accessType: ServiceAccessType): IdentifierType[] {
  switch (accessType) {
    case 'EMAIL':
      return ['EMAIL'];
    case 'PHONE':
      return ['PHONE', 'SIM', 'ESIM', 'ACCOUNT'];
    case 'BOTH':
      return ['EMAIL', 'PHONE'];
  }
}

/** What the form should preselect for this service. */
export function defaultIdentifierType(accessType: ServiceAccessType): IdentifierType {
  return accessType === 'EMAIL' ? 'EMAIL' : 'PHONE';
}

const PHONE_NOISE = /[\s ()\-.]/g;
const PHONE_SHAPE = /^\+7\d{10}$/;

function isPhoneFamily(type: IdentifierType) {
  return type === 'PHONE' || type === 'SIM' || type === 'ESIM';
}

/**
 * Canonical form to send to the API: addresses lowercased, numbers stripped of the
 * separators people paste in, a leading `8` rewritten to `+7`.
 */
export function normalizeIdentifier(type: IdentifierType, raw: string): string {
  if (type === 'EMAIL') {
    return checkEmail(raw).normalized;
  }
  if (isPhoneFamily(type)) {
    const digits = raw.replace(PHONE_NOISE, '');
    if (digits.length === 11 && digits.startsWith('8')) return `+7${digits.slice(1)}`;
    if (digits.length === 11 && digits.startsWith('7')) return `+${digits}`;
    return digits;
  }
  return raw.trim();
}

export type IdentifierError = 'required' | 'invalid';

/** `null` when the value is good; otherwise which message the field should show. */
export function validateIdentifier(type: IdentifierType, raw: string): IdentifierError | null {
  const normalized = normalizeIdentifier(type, raw);
  if (!normalized) return 'required';
  if (type === 'EMAIL') return checkEmail(normalized).ok ? null : 'invalid';
  if (isPhoneFamily(type)) return PHONE_SHAPE.test(normalized) ? null : 'invalid';
  return normalized.length >= 4 ? null : 'invalid';
}
