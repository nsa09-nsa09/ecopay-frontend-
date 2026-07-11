export type SubscriptionCategory = 'video' | 'music' | 'cloud' | 'ai' | 'design' | 'apps';

export type PaymentStatus =
  'pending' | 'paid' | 'hold_30_days' | 'released' | 'refunded' | 'disputed';

export type ParticipationStatus =
  | 'pending_payment'
  | 'paid_hold'
  | 'access_pending'
  | 'access_confirmed'
  | 'active'
  | 'dispute_opened'
  | 'cancelled'
  | 'expired';

export type SubscriptionListing = {
  id: string;
  name: string;
  service: string;
  category: SubscriptionCategory;
  owner: string;
  plan: string;
  pricePerSeat: number;
  fullPrice: number;
  currency: 'KZT' | 'USD';
  seats: number;
  filled: number;
  holdDays: number;
  startDate: string;
  accessMethod: string;
  rules: string;
  tone: string;
  logoUrl: string;
  paymentStatus: PaymentStatus;
  participationStatus: ParticipationStatus;
};

export const subscriptionListings: SubscriptionListing[] = [
  {
    id: 'r1',
    name: 'YouTube Premium Family',
    service: 'YouTube Premium',
    category: 'video',
    owner: 'Aidar K.',
    plan: 'Family · 5 мест',
    pricePerSeat: 790,
    fullPrice: 3290,
    currency: 'KZT',
    seats: 5,
    filled: 4,
    holdDays: 30,
    startDate: '2026-05-20',
    accessMethod: 'email_invite',
    rules: 'Владелец добавляет участника по email в семейную группу.',
    tone: '#FF0033',
    logoUrl: 'https://cdn.simpleicons.org/youtube/FF0000',
    paymentStatus: 'hold_30_days',
    participationStatus: 'access_pending',
  },
  {
    id: 'r2',
    name: 'Spotify Premium Family',
    service: 'Spotify',
    category: 'music',
    owner: 'Dana M.',
    plan: 'Family · 6 мест',
    pricePerSeat: 850,
    fullPrice: 4990,
    currency: 'KZT',
    seats: 6,
    filled: 6,
    holdDays: 30,
    startDate: '2026-05-01',
    accessMethod: 'invite_link',
    rules: 'Доступ через семейное приглашение. Участник подтверждает работу аккаунта.',
    tone: '#1DB954',
    logoUrl: 'https://cdn.simpleicons.org/spotify/1DB954',
    paymentStatus: 'released',
    participationStatus: 'active',
  },
  {
    id: 'r3',
    name: 'Netflix Premium 4K',
    service: 'Netflix',
    category: 'video',
    owner: 'Askar S.',
    plan: 'Premium · 4 профиля',
    pricePerSeat: 1990,
    fullPrice: 7990,
    currency: 'KZT',
    seats: 4,
    filled: 3,
    holdDays: 30,
    startDate: '2026-05-18',
    accessMethod: 'profile_invite',
    rules: 'Отдельный профиль, доступ к 4K, без передачи пароля вне EcoSplit.',
    tone: '#E50914',
    logoUrl: 'https://cdn.simpleicons.org/netflix/E50914',
    paymentStatus: 'paid',
    participationStatus: 'pending_payment',
  },
  {
    id: 'r4',
    name: 'Google One 2 TB',
    service: 'Google One',
    category: 'cloud',
    owner: 'Mira T.',
    plan: '2 TB Family · 6 мест',
    pricePerSeat: 745,
    fullPrice: 2690,
    currency: 'KZT',
    seats: 6,
    filled: 4,
    holdDays: 30,
    startDate: '2026-05-16',
    accessMethod: 'email_invite',
    rules: 'Добавление в семейную группу Google после оплаты.',
    tone: '#4285F4',
    logoUrl: 'https://cdn.simpleicons.org/google/4285F4',
    paymentStatus: 'hold_30_days',
    participationStatus: 'access_confirmed',
  },
  {
    id: 'r5',
    name: 'ChatGPT Team',
    service: 'ChatGPT',
    category: 'ai',
    owner: 'Timur B.',
    plan: 'Team workspace · 3 места',
    pricePerSeat: 4300,
    fullPrice: 12900,
    currency: 'KZT',
    seats: 3,
    filled: 2,
    holdDays: 30,
    startDate: '2026-05-22',
    accessMethod: 'email_invite',
    rules: 'Доступ в workspace через корпоративное приглашение.',
    tone: '#10A37F',
    logoUrl: 'https://cdn.simpleicons.org/openai/10A37F',
    paymentStatus: 'disputed',
    participationStatus: 'dispute_opened',
  },
  {
    id: 'r6',
    name: 'Canva Pro Teams',
    service: 'Canva',
    category: 'design',
    owner: 'Aruzhan N.',
    plan: 'Teams · 5 мест',
    pricePerSeat: 1200,
    fullPrice: 5990,
    currency: 'KZT',
    seats: 5,
    filled: 2,
    holdDays: 30,
    startDate: '2026-05-25',
    accessMethod: 'email_invite',
    rules: 'Владелец добавляет email участника в команду Canva.',
    tone: '#00C4CC',
    logoUrl: 'https://cdn.simpleicons.org/canva/00C4CC',
    paymentStatus: 'pending',
    participationStatus: 'pending_payment',
  },
  {
    id: 'r7',
    name: 'Яндекс Плюс Семья',
    service: 'Яндекс Плюс',
    category: 'apps',
    owner: 'Ruslan M.',
    plan: 'Семья · 4 места',
    pricePerSeat: 500,
    fullPrice: 1990,
    currency: 'KZT',
    seats: 4,
    filled: 3,
    holdDays: 30,
    startDate: '2026-05-14',
    accessMethod: 'invite_link',
    rules: 'Ссылка-приглашение действует 24 часа после оплаты.',
    tone: '#FC3F1D',
    logoUrl: 'https://cdn.simpleicons.org/yandex/FC3F1D',
    paymentStatus: 'released',
    participationStatus: 'active',
  },
  {
    id: 'r8',
    name: 'iCloud+ Family',
    service: 'iCloud',
    category: 'cloud',
    owner: 'Sanzhar A.',
    plan: '2 TB · 5 мест',
    pricePerSeat: 900,
    fullPrice: 4490,
    currency: 'KZT',
    seats: 5,
    filled: 4,
    holdDays: 30,
    startDate: '2026-05-19',
    accessMethod: 'family_invite',
    rules: 'Приглашение в Apple Family Sharing. Доступ подтверждается участником.',
    tone: '#111827',
    logoUrl: 'https://cdn.simpleicons.org/icloud/3693F3',
    paymentStatus: 'hold_30_days',
    participationStatus: 'paid_hold',
  },
];

export const ownerListings = subscriptionListings.filter((item) =>
  ['r3', 'r5', 'r6'].includes(item.id),
);

export const joinedListings = subscriptionListings.filter((item) =>
  ['r1', 'r2', 'r4', 'r5', 'r8'].includes(item.id),
);

export const formatListingMoney = (value: number, currency: 'KZT' | 'USD' = 'KZT') =>
  currency === 'USD' ? `$${value.toLocaleString('en-US')}` : `₸${value.toLocaleString('ru-RU')}`;

export function accessMethodRu(value: string) {
  const map: Record<string, string> = {
    email_invite: 'Приглашение по email',
    invite_link: 'Ссылка-приглашение',
    profile_invite: 'Профиль/приглашение',
    family_invite: 'Семейное приглашение',
  };
  return map[value] ?? value;
}

export function paymentStatusRu(status: PaymentStatus) {
  const map: Record<PaymentStatus, string> = {
    pending: 'Платёж создан',
    paid: 'Оплачено',
    hold_30_days: 'Hold 30 дней',
    released: 'Выплачено владельцу',
    refunded: 'Возврат участнику',
    disputed: 'Открыт спор',
  };
  return map[status];
}

export function participationStatusRu(status: ParticipationStatus) {
  const map: Record<ParticipationStatus, string> = {
    pending_payment: 'Ожидается оплата',
    paid_hold: 'Оплата в hold',
    access_pending: 'Ожидается доступ',
    access_confirmed: 'Доступ подтверждён',
    active: 'Активно',
    dispute_opened: 'Открыт спор',
    cancelled: 'Отменено',
    expired: 'Завершено',
  };
  return map[status];
}
