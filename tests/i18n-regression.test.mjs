import assert from 'node:assert/strict';
import test from 'node:test';

import {
  KNOWN_BACKEND_STATUSES,
  userEventLabel,
  userStatusLabel,
  userStatusVariant,
} from '../src/app/lib/user-facing-enums.ts';
import {
  allServerMessageEntries,
  resolveServerMessage,
} from '../src/app/lib/server-messages.ts';

const LOCALES = ['ru', 'kz', 'en'];

// The generic "unknown status" fallback copy, per language. A real status must
// never resolve to any of these.
const UNKNOWN_FALLBACK = {
  ru: 'Статус уточняется',
  kz: 'Мәртебесі анықталуда',
  en: 'Status unavailable',
};

test('all support statuses have RU/KZ/EN labels', () => {
  const statuses = ['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'ESCALATED', 'CLOSED'];
  for (const status of statuses) {
    for (const locale of LOCALES) {
      const label = userStatusLabel(status, locale);
      assert.ok(label.length > 0);
      assert.notEqual(label, status);
    }
  }
});

test('every known backend status resolves to a specific, non-raw label', () => {
  for (const status of KNOWN_BACKEND_STATUSES) {
    for (const locale of LOCALES) {
      const label = userStatusLabel(status, locale);
      assert.ok(label && label.trim().length > 0, `${status}/${locale} empty`);
      // never the raw SCREAMING_SNAKE_CASE enum
      assert.notEqual(label, status, `${status}/${locale} is raw enum`);
      // never the generic unknown fallback (would mean "not mapped")
      assert.notEqual(
        label,
        UNKNOWN_FALLBACK[locale],
        `${status}/${locale} fell through to the unknown fallback`,
      );
    }
  }
});

test('money "review" states are never coloured as a user error (danger)', () => {
  for (const status of ['REQUIRES_REVIEW', 'CAPTURE_ANOMALY', 'UNDER_REVIEW', 'RECONCILING', 'UNKNOWN']) {
    assert.notEqual(userStatusVariant(status), 'danger', `${status} must not be danger`);
  }
  // refunded-full is a trustworthy terminal; partial is distinguishable.
  assert.equal(userStatusVariant('REFUNDED_FULL'), 'success');
  assert.notEqual(userStatusLabel('REFUNDED_PARTIAL', 'ru'), userStatusLabel('REFUNDED_FULL', 'ru'));
});

test('unknown customer status never exposes its raw enum', () => {
  for (const locale of LOCALES) {
    assert.notEqual(userStatusLabel('FUTURE_BACKEND_STATUS', locale), 'FUTURE_BACKEND_STATUS');
    assert.ok(userStatusLabel('FUTURE_BACKEND_STATUS', locale).length > 0);
  }
  assert.equal(userStatusVariant('FUTURE_BACKEND_STATUS'), 'default');
});

test('dashboard events are localized and unknown actions remain customer-safe', () => {
  assert.equal(userEventLabel('ROOM_BLOCKED', 'ru'), 'Комната заблокирована');
  assert.equal(userEventLabel('ROOM_BLOCKED', 'kz'), 'Бөлме бұғатталды');
  assert.equal(userEventLabel('ROOM_BLOCKED', 'en'), 'Room blocked');
  assert.notEqual(userEventLabel('INTERNAL_ACTION_V2', 'en'), 'INTERNAL_ACTION_V2');
});

// ---------------------------------------------------------------------------
// server-messages.ts
// ---------------------------------------------------------------------------

test('every USER_ACTIONABLE / SUPPORT entry resolves to non-empty RU/KZ/EN', () => {
  for (const { key, entry } of allServerMessageEntries()) {
    if (entry.cls === 'INTERNAL') continue;
    const [kind, raw] = splitKey(key);
    for (const locale of LOCALES) {
      const out =
        kind === 'code'
          ? resolveServerMessage(409, raw, null, locale)
          : resolveServerMessage(400, null, raw, locale);
      assert.ok(out && out.trim().length > 0, `${key}/${locale} resolved empty`);
      // must not echo the raw English back into a RU/KZ surface
      if (locale !== 'en' && kind === 'msg') {
        assert.notEqual(out.trim().toLowerCase(), raw.trim().toLowerCase(), `${key}/${locale} echoed raw`);
      }
    }
  }
});

test('no INTERNAL-classified backend message is ever returned to a caller', () => {
  for (const { key, entry } of allServerMessageEntries()) {
    if (entry.cls !== 'INTERNAL') continue;
    const [kind, raw] = splitKey(key);
    for (const locale of LOCALES) {
      const out =
        kind === 'code'
          ? resolveServerMessage(500, raw, null, locale)
          : resolveServerMessage(500, null, raw, locale);
      assert.equal(out, null, `${key}/${locale} leaked an INTERNAL message`);
    }
  }
});

test('provider strings and unknown messages fall through to the generic path', () => {
  for (const locale of LOCALES) {
    assert.equal(resolveServerMessage(502, null, 'Freedom Pay request failed', locale), null);
    assert.equal(resolveServerMessage(500, null, 'Mobizon SMS request failed', locale), null);
    assert.equal(resolveServerMessage(500, null, 'some brand-new backend message', locale), null);
    assert.equal(resolveServerMessage(500, null, 'Failed to decrypt field', locale), null);
  }
});

test('a known coded conflict resolves via the message path today', () => {
  // Backend does not yet plumb ErrorResponse.code into the FE; the message path
  // must still localize ROOM_FULL's English message.
  const ru = resolveServerMessage(409, null, 'Room is full', 'ru');
  assert.ok(ru && /мест/i.test(ru));
});

function splitKey(key) {
  const idx = key.indexOf(':');
  return [key.slice(0, idx), key.slice(idx + 1)];
}
