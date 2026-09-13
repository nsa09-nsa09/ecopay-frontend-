import assert from 'node:assert/strict';
import test from 'node:test';

import { userEventLabel, userStatusLabel } from '../src/app/lib/user-facing-enums.ts';

test('all support statuses have RU/KZ/EN labels', () => {
  const statuses = ['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'ESCALATED', 'CLOSED'];
  for (const status of statuses) {
    for (const locale of ['ru', 'kz', 'en']) {
      const label = userStatusLabel(status, locale);
      assert.ok(label.length > 0);
      assert.notEqual(label, status);
    }
  }
});

test('unknown customer status never exposes its raw enum', () => {
  for (const locale of ['ru', 'kz', 'en']) {
    assert.notEqual(userStatusLabel('FUTURE_BACKEND_STATUS', locale), 'FUTURE_BACKEND_STATUS');
  }
});

test('dashboard events are localized and unknown actions remain customer-safe', () => {
  assert.equal(userEventLabel('ROOM_BLOCKED', 'ru'), 'Комната заблокирована');
  assert.equal(userEventLabel('ROOM_BLOCKED', 'kz'), 'Бөлме бұғатталды');
  assert.equal(userEventLabel('ROOM_BLOCKED', 'en'), 'Room blocked');
  assert.notEqual(userEventLabel('INTERNAL_ACTION_V2', 'en'), 'INTERNAL_ACTION_V2');
});
