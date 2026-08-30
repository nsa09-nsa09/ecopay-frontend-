// What a member hands over when joining a room, and how it is checked.
// SIM/eSIM/account can still describe a tariff, but the member-facing join
// question is now only email or phone number.

import { checkEmail } from './email-validation';
import { normalizePhone, type ServiceAccessType } from './api';

export type IdentifierType = 'EMAIL' | 'PHONE';

/** The types a service accepts, in the order the join form should offer them. */
export function allowedIdentifierTypes(accessType: ServiceAccessType): IdentifierType[] {
  switch (accessType) {
    case 'EMAIL':
      return ['EMAIL'];
    case 'PHONE':
      return ['PHONE'];
    case 'BOTH':
      return ['EMAIL', 'PHONE'];
  }
}

/** What the form should preselect for this service. */
export function defaultIdentifierType(accessType: ServiceAccessType): IdentifierType {
  return accessType === 'EMAIL' ? 'EMAIL' : 'PHONE';
}

const PHONE_SHAPE = /^\+7\d{10}$/;

/**
 * Canonical form to send to the API: addresses lowercased, numbers stripped of the
 * separators people paste in, a leading `8` rewritten to `+7`.
 */
export function normalizeIdentifier(type: IdentifierType, raw: string): string {
  if (type === 'EMAIL') {
    return checkEmail(raw).normalized;
  }
  return normalizePhone(raw);
}

export type IdentifierError = 'required' | 'invalid';

/** `null` when the value is good; otherwise which message the field should show. */
export function validateIdentifier(type: IdentifierType, raw: string): IdentifierError | null {
  const normalized = normalizeIdentifier(type, raw);
  if (!normalized) return 'required';
  if (type === 'EMAIL') return checkEmail(normalized).ok ? null : 'invalid';
  return PHONE_SHAPE.test(normalized) ? null : 'invalid';
}
