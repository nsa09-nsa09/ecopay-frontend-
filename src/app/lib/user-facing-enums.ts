import type { Language } from './locale';

type Labels = Record<Language, string>;

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

const STATUS_LABELS: Record<string, Labels> = {
  OPEN: { ru: 'Открыта', kz: 'Ашық', en: 'Open' },
  IN_PROGRESS: { ru: 'В работе', kz: 'Орындалуда', en: 'In progress' },
  WAITING_USER: { ru: 'Ожидает вашего ответа', kz: 'Сіздің жауабыңызды күтуде', en: 'Waiting for your reply' },
  ESCALATED: { ru: 'Передана специалисту', kz: 'Маманға жіберілді', en: 'Escalated to a specialist' },
  CLOSED: { ru: 'Закрыта', kz: 'Жабық', en: 'Closed' },
  APPLIED: { ru: 'Заявка подана', kz: 'Өтінім берілді', en: 'Applied' },
  PENDING: { ru: 'Ожидает', kz: 'Күтуде', en: 'Pending' },
  ACTIVE: { ru: 'Активно', kz: 'Белсенді', en: 'Active' },
  REJECTED: { ru: 'Отклонено', kz: 'Қабылданбады', en: 'Rejected' },
  BLOCKED: { ru: 'Заблокировано', kz: 'Бұғатталған', en: 'Blocked' },
  BLOCKED_BY_ADMIN: { ru: 'Заблокировано', kz: 'Бұғатталған', en: 'Blocked' },
  IN_VERIFICATION: { ru: 'На проверке', kz: 'Тексеруде', en: 'In verification' },
  COMPLETED: { ru: 'Завершено', kz: 'Аяқталды', en: 'Completed' },
  CANCELLED: { ru: 'Отменено', kz: 'Бас тартылды', en: 'Cancelled' },
  SUCCESS: { ru: 'Успешно', kz: 'Сәтті', en: 'Success' },
  SUCCEEDED: { ru: 'Успешно', kz: 'Сәтті', en: 'Succeeded' },
  PAID: { ru: 'Оплачено', kz: 'Төленді', en: 'Paid' },
  SENT: { ru: 'Отправлено', kz: 'Жіберілді', en: 'Sent' },
  PROCESSED: { ru: 'Обработано', kz: 'Өңделді', en: 'Processed' },
  QUEUED: { ru: 'В очереди', kz: 'Кезекте', en: 'Queued' },
  HOLD: { ru: 'На удержании', kz: 'Ұсталымда', en: 'On hold' },
  PROCESSING: { ru: 'Обрабатывается', kz: 'Өңделуде', en: 'Processing' },
  APPROVED: { ru: 'Одобрено', kz: 'Мақұлданды', en: 'Approved' },
  REQUESTED: { ru: 'Запрошено', kz: 'Сұралды', en: 'Requested' },
  IN_REVIEW: { ru: 'На рассмотрении', kz: 'Қарастырылуда', en: 'In review' },
  FAILED: { ru: 'Ошибка', kz: 'Сәтсіз', en: 'Failed' },
  EXPIRED: { ru: 'Срок истёк', kz: 'Мерзімі өтті', en: 'Expired' },
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

/** Never returns an untrusted/raw enum value on a customer-facing surface. */
export function userStatusLabel(value: unknown, language: Language): string {
  return (STATUS_LABELS[code(value)] ?? UNKNOWN)[language];
}

/** Human label for customer activity feeds; unknown backend events stay generic. */
export function userEventLabel(value: unknown, language: Language): string {
  return (EVENT_LABELS[code(value)] ?? UNKNOWN_EVENT)[language];
}

