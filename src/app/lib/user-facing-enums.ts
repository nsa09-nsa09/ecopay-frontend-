import type { Language } from './locale';

type Labels = Record<Language, string>;

/** Badge/pill colour buckets shared by every customer-facing status surface. */
export type StatusVariant = 'success' | 'warning' | 'info' | 'danger' | 'default';

const UNKNOWN: Labels = {
  ru: 'Статус уточняется',
  kz: 'Мәртебесі анықталуда',
  en: 'Status unavailable',
};

const UNKNOWN_EVENT: Labels = {
  ru: 'Обновление операции',
  kz: 'Операция жаңартылды',
  en: 'Operation update',
};

// ---------------------------------------------------------------------------
// Single source of truth for every backend status value a customer can see.
//
// Covers the authoritative backend enums (verified against ecopay-backend
// entity/*.java): PaymentIntentStatus, PaymentTransactionStatus, RefundStatus,
// RefundRequestStatus, MemberStatus, SavedCardStatus, PayoutBlockStatus,
// DisputeStatus, RoomStatus, UserStatus, ModerationQueueStatus,
// SupportTicketStatus, plus the free-form Payout.status strings
// (PENDING/PROCESSING/SUCCESS/FAILED/PENDING_METHOD/PENDING_PROVIDER/
// REQUIRES_REVIEW/FROZEN/REVERSED/CANCELED/RELEASED).
//
// Money-state wording follows strict rules: "pending/checking" states never
// read as success or failure; "review" states read as "support is looking at
// this", never as the user's fault and never as "retry"; refund states read as
// "a refund is on its way" so nobody panics.
// ---------------------------------------------------------------------------
const STATUS_LABELS: Record<string, Labels> = {
  // ----- Support tickets -----
  OPEN: { ru: 'Открыта', kz: 'Ашық', en: 'Open' },
  IN_PROGRESS: { ru: 'В работе', kz: 'Орындалуда', en: 'In progress' },
  WAITING_USER: {
    ru: 'Ожидает вашего ответа',
    kz: 'Сіздің жауабыңызды күтуде',
    en: 'Waiting for your reply',
  },
  ESCALATED: { ru: 'Передана специалисту', kz: 'Маманға жіберілді', en: 'Escalated to a specialist' },
  CLOSED: { ru: 'Закрыта', kz: 'Жабық', en: 'Closed' },

  // ----- Membership / room application -----
  APPLIED: { ru: 'Заявка подана', kz: 'Өтінім берілді', en: 'Applied' },
  PENDING: { ru: 'Ожидает', kz: 'Күтуде', en: 'Pending' },
  ACTIVE: { ru: 'Активно', kz: 'Белсенді', en: 'Active' },
  REJECTED: { ru: 'Отклонено', kz: 'Қабылданбады', en: 'Rejected' },
  CANCELLED_BEFORE_PAYMENT: {
    ru: 'Отменено до оплаты',
    kz: 'Төлемге дейін бас тартылды',
    en: 'Cancelled before payment',
  },
  BLOCKED: { ru: 'Заблокировано', kz: 'Бұғатталған', en: 'Blocked' },
  BLOCKED_BY_ADMIN: { ru: 'Заблокировано', kz: 'Бұғатталған', en: 'Blocked' },

  // ----- Room lifecycle -----
  IN_VERIFICATION: { ru: 'На проверке', kz: 'Тексеруде', en: 'In verification' },
  COMPLETED: { ru: 'Завершено', kz: 'Аяқталды', en: 'Completed' },
  CANCELLED: { ru: 'Отменено', kz: 'Бас тартылды', en: 'Cancelled' },

  // ----- Generic positive terminals -----
  SUCCESS: { ru: 'Успешно', kz: 'Сәтті', en: 'Success' },
  SUCCEEDED: { ru: 'Успешно', kz: 'Сәтті', en: 'Succeeded' },
  PAID: { ru: 'Оплачено', kz: 'Төленді', en: 'Paid' },
  SENT: { ru: 'Отправлено', kz: 'Жіберілді', en: 'Sent' },
  PROCESSED: { ru: 'Обработано', kz: 'Өңделді', en: 'Processed' },
  APPROVED: { ru: 'Одобрено', kz: 'Мақұлданды', en: 'Approved' },

  // ----- In-flight / queued -----
  QUEUED: { ru: 'В очереди', kz: 'Кезекте', en: 'Queued' },
  HOLD: { ru: 'На удержании', kz: 'Ұсталымда', en: 'On hold' },
  PROCESSING: { ru: 'Обрабатывается', kz: 'Өңделуде', en: 'Processing' },
  REQUESTED: { ru: 'Запрошено', kz: 'Сұралды', en: 'Requested' },
  IN_REVIEW: { ru: 'На рассмотрении', kz: 'Қарастырылуда', en: 'In review' },

  // ----- Negative terminals -----
  FAILED: { ru: 'Ошибка', kz: 'Сәтсіз', en: 'Failed' },
  EXPIRED: { ru: 'Срок истёк', kz: 'Мерзімі өтті', en: 'Expired' },

  // ===== DEFECT 1 additions — money states =====
  // PaymentIntentStatus — "we are checking this", never success, never failure.
  UNKNOWN: { ru: 'Проверяем статус платежа', kz: 'Төлем күйі тексерілуде', en: 'Checking payment status' },
  RECONCILING: { ru: 'Сверяем платёж', kz: 'Төлем салыстырылуда', en: 'Reconciling payment' },
  // Refund is being prepared / is on its way — no reason to panic or open a ticket.
  REFUND_REQUIRED: { ru: 'Готовится возврат', kz: 'Қайтарым дайындалуда', en: 'Refund is being prepared' },
  REFUND_PENDING: { ru: 'Возврат в обработке', kz: 'Қайтарым өңделуде', en: 'Refund in progress' },
  REFUNDED: { ru: 'Возврат выполнен', kz: 'Қайтарым орындалды', en: 'Refunded' },
  // Under review by support — not the user's fault, not something to retry.
  REQUIRES_REVIEW: {
    ru: 'На проверке поддержки',
    kz: 'Қолдау қызметінің тексеруінде',
    en: 'Under review by support',
  },
  CAPTURE_ANOMALY: {
    ru: 'Платёж на дополнительной проверке',
    kz: 'Төлем қосымша тексеруде',
    en: 'Payment under additional review',
  },

  // PaymentTransactionStatus — partial vs full must be distinguishable.
  REFUNDED_PARTIAL: {
    ru: 'Возврат части суммы',
    kz: 'Сома бір бөлігі қайтарылды',
    en: 'Partially refunded',
  },
  REFUNDED_FULL: { ru: 'Возврат полной суммы', kz: 'Сома толық қайтарылды', en: 'Fully refunded' },

  // RefundStatus — PENDING_PROVIDER = handed to the bank, still in flight.
  PENDING_PROVIDER: {
    ru: 'Отправлено в банк',
    kz: 'Банкке жіберілді',
    en: 'Sent to the bank',
  },

  // RefundRequestStatus / DisputeStatus — admin is looking at it.
  UNDER_REVIEW: { ru: 'На рассмотрении', kz: 'Қарастырылуда', en: 'Under review' },
  RESOLVED: { ru: 'Решено', kz: 'Шешілді', en: 'Resolved' },

  // Payout free-form statuses.
  PENDING_METHOD: {
    ru: 'Ожидает привязки карты для выплаты',
    kz: 'Төлем картасын байланыстыруды күтуде',
    en: 'Awaiting a payout card',
  },
  FROZEN: { ru: 'Удерживается EcoPay', kz: 'EcoPay ұстап тұр', en: 'Held by EcoPay' },
  REVERSED: { ru: 'Выплата возвращена банком', kz: 'Аударымды банк қайтарды', en: 'Payout reversed' },
  CANCELED: { ru: 'Отменено', kz: 'Бас тартылды', en: 'Canceled' },
  RELEASED: { ru: 'Удержание снято', kz: 'Ұсталым алынды', en: 'Released' },

  // SavedCardStatus.
  REVOKED: { ru: 'Карта отвязана', kz: 'Карта ажыратылды', en: 'Card removed' },

  // UserStatus (shown on own profile / membership rows).
  BANNED: { ru: 'Заблокирован', kz: 'Бұғатталған', en: 'Banned' },
  DELETED: { ru: 'Удалён', kz: 'Жойылған', en: 'Deleted' },
};

// ---------------------------------------------------------------------------
// Colour variant for each status. 'default' is reserved for genuinely unknown
// values. Review/anomaly states are deliberately 'info' (neutral attention),
// never 'danger', so a payment held for manual review is not shown as an error
// the customer caused.
// ---------------------------------------------------------------------------
const STATUS_VARIANTS: Record<string, StatusVariant> = {
  // success — a positive terminal the customer can trust
  SUCCESS: 'success',
  SUCCEEDED: 'success',
  COMPLETED: 'success',
  ACTIVE: 'success',
  PAID: 'success',
  SENT: 'success',
  PROCESSED: 'success',
  APPROVED: 'success',
  REFUNDED: 'success',
  REFUNDED_FULL: 'success',
  RELEASED: 'success',
  RESOLVED: 'success',

  // info — being looked at / informational, not an error and not final-good
  PROCESSING: 'info',
  IN_REVIEW: 'info',
  IN_VERIFICATION: 'info',
  UNDER_REVIEW: 'info',
  REQUIRES_REVIEW: 'info',
  CAPTURE_ANOMALY: 'info',
  REFUNDED_PARTIAL: 'info',

  // warning — pending / in-between money states ("we are checking this")
  PENDING: 'warning',
  PENDING_PROVIDER: 'warning',
  PENDING_METHOD: 'warning',
  RECONCILING: 'warning',
  UNKNOWN: 'warning',
  QUEUED: 'warning',
  HOLD: 'warning',
  FROZEN: 'warning',
  REFUND_REQUIRED: 'warning',
  REFUND_PENDING: 'warning',
  APPLIED: 'warning',
  REQUESTED: 'warning',
  OPEN: 'warning',
  IN_PROGRESS: 'warning',
  WAITING_USER: 'warning',
  ESCALATED: 'warning',

  // danger — a negative terminal / blocked state
  FAILED: 'danger',
  REJECTED: 'danger',
  CANCELLED: 'danger',
  CANCELED: 'danger',
  CANCELLED_BEFORE_PAYMENT: 'danger',
  EXPIRED: 'danger',
  BLOCKED: 'danger',
  BLOCKED_BY_ADMIN: 'danger',
  BANNED: 'danger',
  DELETED: 'danger',
  REVOKED: 'danger',
  REVERSED: 'danger',
};

const EVENT_LABELS: Record<string, Labels> = {
  PAYMENT_SUCCESS: { ru: 'Оплата прошла успешно', kz: 'Төлем сәтті өтті', en: 'Payment completed' },
  PAYMENT_FAILED: { ru: 'Оплата не прошла', kz: 'Төлем өтпеді', en: 'Payment failed' },
  REFUND_ISSUED: { ru: 'Возврат отправлен', kz: 'Қайтарым жіберілді', en: 'Refund issued' },
  PAYOUT_SENT: { ru: 'Выплата отправлена', kz: 'Төлем жіберілді', en: 'Payout sent' },
  MEMBER_JOINED: { ru: 'Новая заявка на участие', kz: 'Қатысуға жаңа өтінім', en: 'New membership request' },
  MEMBER_CONFIRMED: { ru: 'Участник подтвердил доступ', kz: 'Қатысушы қолжетімділікті растады', en: 'Member confirmed access' },
  MEMBERSHIP_ACTIVATED: { ru: 'Участие активировано', kz: 'Қатысу белсендірілді', en: 'Membership activated' },
  ROOM_ACTIVE: { ru: 'Комната активирована', kz: 'Бөлме белсендірілді', en: 'Room activated' },
  ROOM_BLOCKED: { ru: 'Комната заблокирована', kz: 'Бөлме бұғатталды', en: 'Room blocked' },
  ROOM_CANCELLED: { ru: 'Комната отменена', kz: 'Бөлме тоқтатылды', en: 'Room cancelled' },
  DISPUTE_OPENED: { ru: 'Спор открыт', kz: 'Дау ашылды', en: 'Dispute opened' },
  DISPUTE_RESOLVED: { ru: 'Спор решён', kz: 'Дау шешілді', en: 'Dispute resolved' },
  TICKET_REPLY: { ru: 'Ответ поддержки', kz: 'Қолдау жауабы', en: 'Support reply' },
};

function code(value: unknown): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

/**
 * The full set of backend status enum values this module is expected to cover.
 * Exported so the build-time scanner and the i18n regression test can assert
 * nothing regresses silently (a new backend status must be added here too).
 */
export const KNOWN_BACKEND_STATUSES: readonly string[] = Object.freeze([
  // SupportTicketStatus
  'OPEN', 'IN_PROGRESS', 'WAITING_USER', 'ESCALATED', 'CLOSED',
  // MemberStatus
  'APPLIED', 'PENDING', 'ACTIVE', 'REJECTED', 'CANCELLED_BEFORE_PAYMENT', 'BLOCKED_BY_ADMIN',
  // RoomStatus
  'IN_VERIFICATION', 'COMPLETED', 'CANCELLED', 'BLOCKED',
  // PaymentIntentStatus
  'UNKNOWN', 'RECONCILING', 'SUCCESS', 'EXPIRED', 'REFUND_REQUIRED', 'REFUND_PENDING',
  'REFUNDED', 'REQUIRES_REVIEW', 'CAPTURE_ANOMALY', 'FAILED',
  // PaymentTransactionStatus
  'REFUNDED_PARTIAL', 'REFUNDED_FULL',
  // RefundStatus
  'PENDING_PROVIDER',
  // RefundRequestStatus / DisputeStatus
  'REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'RESOLVED',
  // ModerationQueueStatus
  'IN_REVIEW',
  // Payout free-form strings
  'PROCESSING', 'PENDING_METHOD', 'FROZEN', 'REVERSED', 'CANCELED', 'RELEASED', 'SENT',
  // SavedCardStatus
  'REVOKED',
  // UserStatus
  'BANNED', 'DELETED',
  // Generic payout/history terminals
  'SUCCEEDED', 'PAID', 'PROCESSED', 'QUEUED', 'HOLD',
]);

/** Never returns an untrusted/raw enum value on a customer-facing surface. */
export function userStatusLabel(value: unknown, language: Language): string {
  return (STATUS_LABELS[code(value)] ?? UNKNOWN)[language];
}

/**
 * Colour bucket for a status badge/pill. Unknown values collapse to 'default'
 * (neutral) rather than guessing a success/danger colour.
 */
export function userStatusVariant(value: unknown): StatusVariant {
  return STATUS_VARIANTS[code(value)] ?? 'default';
}

/** True when a status value is one we have a curated label for. */
export function isKnownStatus(value: unknown): boolean {
  return code(value) in STATUS_LABELS;
}

/** Human label for customer activity feeds; unknown backend events stay generic. */
export function userEventLabel(value: unknown, language: Language): string {
  return (EVENT_LABELS[code(value)] ?? UNKNOWN_EVENT)[language];
}
