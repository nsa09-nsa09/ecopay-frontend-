import { Mail, Phone, AtSign } from 'lucide-react';
import type { ServiceAccessType } from '../lib/api';
import { useI18n } from './i18n-provider';

/**
 * Every service grants access differently: Spotify and YouTube invite the member's own
 * email, operators need the number. `accessType` carries that per service, and these
 * helpers keep the catalog card, the room page and the join form telling the same story.
 */

const icons = { EMAIL: Mail, PHONE: Phone, BOTH: AtSign } as const;

const labelKeys = {
  EMAIL: 'accessTypeEmail',
  PHONE: 'accessTypePhone',
  BOTH: 'accessTypeBoth',
} as const;

const hintKeys = {
  EMAIL: 'accessTypeEmailHint',
  PHONE: 'accessTypePhoneHint',
  BOTH: 'accessTypeBothHint',
} as const;

/** Older rooms and services predate the field; treat a missing value as email. */
export function normalizeAccessType(value?: ServiceAccessType | null): ServiceAccessType {
  return value === 'PHONE' || value === 'BOTH' ? value : 'EMAIL';
}

export function useAccessTypeCopy(value?: ServiceAccessType | null) {
  const { t } = useI18n();
  const accessType = normalizeAccessType(value);
  return {
    accessType,
    Icon: icons[accessType],
    label: t(labelKeys[accessType]),
    hint: t(hintKeys[accessType]),
  };
}

/**
 * Compact "what you need to get in" marker. Sits in catalog cards and next to the room
 * title, so it stays quiet — tertiary text, no fill — and never competes with the price.
 */
export function AccessTypeTag({
  accessType,
  size = 'sm',
}: {
  accessType?: ServiceAccessType | null;
  size?: 'sm' | 'md';
}) {
  const { Icon, label } = useAccessTypeCopy(accessType);
  const iconSize = size === 'md' ? 14 : 12;

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${size === 'md' ? 'text-[13px]' : 'text-[12px]'}`}
      style={{ color: 'var(--eco-text-tertiary)' }}
    >
      <Icon size={iconSize} className="shrink-0" aria-hidden />
      {label}
    </span>
  );
}

/** The same marker with the explanatory line, for pages that have room to explain. */
export function AccessTypeNote({ accessType }: { accessType?: ServiceAccessType | null }) {
  const { Icon, label, hint } = useAccessTypeCopy(accessType);

  return (
    <div className="flex items-start gap-2.5">
      <Icon
        size={16}
        className="mt-0.5 shrink-0"
        style={{ color: 'var(--eco-primary)' }}
        aria-hidden
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
          {label}
        </span>
        <span className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
          {hint}
        </span>
      </div>
    </div>
  );
}
