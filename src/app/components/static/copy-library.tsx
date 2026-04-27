import { useState, useMemo } from "react";
import { useI18n } from "../i18n-provider";
import {
  AlertTriangle, Bell, BookOpen, Check, CheckCircle2, ChevronDown,
  ChevronRight, Clock, Copy, FileText, Globe2, Hash, Heart, Info, Layers,
  List, Lock, Minus, MousePointerClick, PenLine, Search, Shield,
  ShieldCheck, Type, X, Zap,
} from "lucide-react";

/* ═══════ CORE TYPES ═══════ */
type Tone = "neutral" | "positive" | "reassuring" | "warning" | "urgent" | "empathetic" | "celebratory";

interface CopyEntry {
  key: string;
  ru: string;
  kz: string;
  en: string;
  context: string;
  tone: Tone;
  maxChars?: number;
  placeholders?: string[];
}

interface CopyCategory {
  id: string;
  titleKey: string;
  icon: React.ElementType;
  color: string;
  description: string;
  entries: CopyEntry[];
}

/* ═══════ TONE MAP ═══════ */
const TONE_MAP: Record<Tone, { label: string; color: string; bg: string }> = {
  neutral: { label: "Neutral", color: "var(--eco-text-secondary)", bg: "var(--eco-neutral-100)" },
  positive: { label: "Positive", color: "var(--eco-success-500)", bg: "var(--eco-success-100)" },
  reassuring: { label: "Reassuring", color: "var(--eco-brand-600)", bg: "var(--eco-brand-50)" },
  warning: { label: "Warning", color: "var(--eco-warning-500)", bg: "var(--eco-warning-100)" },
  urgent: { label: "Urgent", color: "var(--eco-danger-500)", bg: "var(--eco-danger-100)" },
  empathetic: { label: "Empathetic", color: "var(--eco-primary)", bg: "var(--eco-brand-50)" },
  celebratory: { label: "Celebratory", color: "var(--eco-success-500)", bg: "var(--eco-success-100)" },
};

/* ═══════ ALL COPY ENTRIES ═══════ */
const COPY_CATEGORIES: CopyCategory[] = [

  /* ─── 1. CTAs / BUTTONS ─── */
  {
    id: "ctas", titleKey: "clCtas", icon: MousePointerClick, color: "var(--eco-primary)",
    description: "All interactive button labels — keep short (max 28 chars), verb-first, no punctuation.",
    entries: [
      { key: "ctaJoinRoom", ru: "Присоединиться", kz: "Қосылу", en: "Join Room", context: "Primary CTA on room card & detail", tone: "positive", maxChars: 20 },
      { key: "ctaLeaveRoom", ru: "Покинуть комнату", kz: "Бөлмеден шығу", en: "Leave Room", context: "Destructive action in room settings", tone: "warning" },
      { key: "ctaCreateRoom", ru: "Создать комнату", kz: "Бөлме құру", en: "Create Room", context: "Primary CTA on empty state & header", tone: "positive" },
      { key: "ctaPay", ru: "Оплатить", kz: "Төлеу", en: "Pay Now", context: "Checkout primary button", tone: "neutral", maxChars: 16 },
      { key: "ctaPayAmount", ru: "Оплатить {amount}", kz: "{amount} төлеу", en: "Pay {amount}", context: "Checkout with amount shown", tone: "neutral", placeholders: ["{amount}"] },
      { key: "ctaConfirm", ru: "Подтвердить", kz: "Растау", en: "Confirm", context: "Generic confirmation button", tone: "neutral" },
      { key: "ctaCancel", ru: "Отмена", kz: "Болдырмау", en: "Cancel", context: "Cancel / dismiss action", tone: "neutral" },
      { key: "ctaSave", ru: "Сохранить", kz: "Сақтау", en: "Save", context: "Save settings, profile, preferences", tone: "neutral" },
      { key: "ctaSaveChanges", ru: "Сохранить изменения", kz: "Өзгерістерді сақтау", en: "Save Changes", context: "Form save with edits", tone: "neutral" },
      { key: "ctaEdit", ru: "Редактировать", kz: "Өңдеу", en: "Edit", context: "Enter edit mode", tone: "neutral" },
      { key: "ctaDelete", ru: "Удалить", kz: "Жою", en: "Delete", context: "Destructive removal — always confirm first", tone: "urgent" },
      { key: "ctaRetry", ru: "Попробовать снова", kz: "Қайта байқап көру", en: "Try Again", context: "Retry after error state", tone: "reassuring" },
      { key: "ctaRefresh", ru: "Обновить", kz: "Жаңарту", en: "Refresh", context: "Reload data", tone: "neutral" },
      { key: "ctaViewAll", ru: "Смотреть все", kz: "Барлығын көру", en: "View All", context: "Expand list / go to full view", tone: "neutral" },
      { key: "ctaViewDetails", ru: "Подробнее", kz: "Толығырақ", en: "View Details", context: "Navigate to detail page", tone: "neutral" },
      { key: "ctaLogIn", ru: "Войти", kz: "Кіру", en: "Log In", context: "Auth login button", tone: "neutral" },
      { key: "ctaSignUp", ru: "Зарегистрироваться", kz: "Тіркелу", en: "Sign Up", context: "Auth registration button", tone: "positive" },
      { key: "ctaLogOut", ru: "Выйти", kz: "Шығу", en: "Log Out", context: "Session logout", tone: "neutral" },
      { key: "ctaSubmitTicket", ru: "Отправить обращение", kz: "Өтінішті жіберу", en: "Submit Ticket", context: "Support ticket creation", tone: "neutral" },
      { key: "ctaContactSupport", ru: "Написать в поддержку", kz: "Қолдауға жазу", en: "Contact Support", context: "Link to support from error states", tone: "reassuring" },
      { key: "ctaApplyPromo", ru: "Применить", kz: "Қолдану", en: "Apply", context: "Promo code apply button", tone: "neutral", maxChars: 12 },
      { key: "ctaCopyId", ru: "Скопировать", kz: "Көшіру", en: "Copy", context: "Copy ID/reference to clipboard", tone: "neutral", maxChars: 14 },
      { key: "ctaDownload", ru: "Скачать", kz: "Жүктеу", en: "Download", context: "Export CSV / PDF / receipt", tone: "neutral" },
      { key: "ctaShare", ru: "Поделиться", kz: "Бөлісу", en: "Share", context: "Share room link / invite", tone: "positive" },
      { key: "ctaGotIt", ru: "Понятно", kz: "Түсінікті", en: "Got It", context: "Dismiss informational modal", tone: "neutral" },
      { key: "ctaLearnMore", ru: "Узнать больше", kz: "Толығырақ білу", en: "Learn More", context: "Link to help / how-it-works", tone: "neutral" },
    ],
  },

  /* ─── 2. FORMS & VALIDATION ─── */
  {
    id: "forms", titleKey: "clForms", icon: PenLine, color: "var(--eco-brand-600)",
    description: "Placeholders, labels, inline validation. Keep validation messages under 60 chars. No exclamation marks.",
    entries: [
      { key: "valRequired", ru: "Обязательное поле", kz: "Міндетті өріс", en: "This field is required", context: "Generic required field validation", tone: "neutral" },
      { key: "valEmailInvalid", ru: "Введите корректный email", kz: "Дұрыс email енгізіңіз", en: "Enter a valid email address", context: "Email format validation", tone: "neutral" },
      { key: "valPhoneInvalid", ru: "Введите корректный номер телефона", kz: "Дұрыс телефон нөмірін енгізіңіз", en: "Enter a valid phone number", context: "Phone format validation", tone: "neutral" },
      { key: "valPasswordShort", ru: "Минимум 8 символов", kz: "Кем дегенде 8 таңба", en: "At least 8 characters", context: "Password minimum length", tone: "neutral" },
      { key: "valPasswordWeak", ru: "Добавьте цифру или спецсимвол", kz: "Сан немесе арнайы таңба қосыңыз", en: "Add a number or special character", context: "Password strength hint", tone: "reassuring" },
      { key: "valPasswordsMatch", ru: "Пароли не совпадают", kz: "Құпиясөздер сәйкес келмейді", en: "Passwords don't match", context: "Confirm password mismatch", tone: "neutral" },
      { key: "valNameTooShort", ru: "Минимум 2 символа", kz: "Кем дегенде 2 таңба", en: "At least 2 characters", context: "Display name minimum", tone: "neutral" },
      { key: "valNameTooLong", ru: "Максимум 50 символов", kz: "Ең көбі 50 таңба", en: "50 characters maximum", context: "Display name maximum", tone: "neutral" },
      { key: "valPromoInvalid", ru: "Промокод не найден", kz: "Промокод табылмады", en: "Promo code not found", context: "Invalid promo code at checkout", tone: "neutral" },
      { key: "valPromoExpired", ru: "Промокод истёк", kz: "Промокод мерзімі өтті", en: "This promo code has expired", context: "Expired promo", tone: "neutral" },
      { key: "valFileTooLarge", ru: "Файл слишком большой (макс. 5 МБ)", kz: "Файл тым үлкен (макс. 5 МБ)", en: "File is too large (max 5 MB)", context: "Upload file size limit", tone: "neutral" },
      { key: "valFileType", ru: "Допустимы: JPG, PNG, PDF", kz: "Рұқсат етілген: JPG, PNG, PDF", en: "Allowed: JPG, PNG, PDF", context: "Upload file type restriction", tone: "neutral" },
      { key: "phEmail", ru: "Email", kz: "Email", en: "Email", context: "Email input placeholder", tone: "neutral" },
      { key: "phPhone", ru: "+7 (___) ___-__-__", kz: "+7 (___) ___-__-__", en: "+7 (___) ___-__-__", context: "Phone input placeholder with mask", tone: "neutral" },
      { key: "phPassword", ru: "Пароль", kz: "Құпиясөз", en: "Password", context: "Password input placeholder", tone: "neutral" },
      { key: "phSearch", ru: "Поиск…", kz: "Іздеу…", en: "Search…", context: "Global search placeholder", tone: "neutral" },
      { key: "phMessage", ru: "Введите сообщение…", kz: "Хабарлама жазыңыз…", en: "Type a message…", context: "Chat / support message input", tone: "neutral" },
      { key: "phDisplayName", ru: "Ваше имя", kz: "Сіздің атыңыз", en: "Your name", context: "Profile display name placeholder", tone: "neutral" },
      { key: "labelOptional", ru: "(необязательно)", kz: "(міндетті емес)", en: "(optional)", context: "Suffix for optional form fields", tone: "neutral" },
      { key: "labelCharCount", ru: "{count}/{max} символов", kz: "{count}/{max} таңба", en: "{count}/{max} characters", context: "Character counter below textarea", tone: "neutral", placeholders: ["{count}", "{max}"] },
    ],
  },

  /* ─── 3. EMPTY STATES ─── */
  {
    id: "empty", titleKey: "clEmpty", icon: Layers, color: "var(--eco-text-tertiary)",
    description: "Shown when lists are empty. Always include a title + subtitle + action CTA. Keep calm, never blame the user.",
    entries: [
      { key: "emptyRoomsTitle", ru: "Нет комнат", kz: "Бөлмелер жоқ", en: "No rooms yet", context: "My rooms list empty", tone: "neutral" },
      { key: "emptyRoomsSub", ru: "Создайте комнату или найдите подходящую в каталоге", kz: "Бөлме құрыңыз немесе каталогтан табыңыз", en: "Create a room or find one in the catalog", context: "My rooms empty subtitle", tone: "reassuring" },
      { key: "emptySearchTitle", ru: "Ничего не найдено", kz: "Ештеңе табылмады", en: "No results found", context: "Search / filter returns empty", tone: "neutral" },
      { key: "emptySearchSub", ru: "Попробуйте изменить фильтры или поисковый запрос", kz: "Сүзгілерді немесе іздеу сұрауын өзгертіп көріңіз", en: "Try adjusting your filters or search terms", context: "Search empty subtitle", tone: "reassuring" },
      { key: "emptyNotifTitle", ru: "Нет уведомлений", kz: "Хабарландырулар жоқ", en: "All caught up", context: "Notification center empty", tone: "celebratory" },
      { key: "emptyNotifSub", ru: "Мы сообщим, когда что-то произойдёт", kz: "Бірдеңе болғанда хабарлаймыз", en: "We'll let you know when something happens", context: "Notification empty subtitle", tone: "reassuring" },
      { key: "emptyReviewsTitle", ru: "Нет отзывов", kz: "Пікірлер жоқ", en: "No reviews yet", context: "Profile reviews empty", tone: "neutral" },
      { key: "emptyReviewsSub", ru: "Отзывы появятся после совместного использования комнат", kz: "Пікірлер бөлмелерді бірге пайдаланғаннан кейін пайда болады", en: "Reviews will appear after sharing rooms together", context: "Reviews empty subtitle", tone: "reassuring" },
      { key: "emptyTicketsTitle", ru: "Нет обращений", kz: "Өтініштер жоқ", en: "No tickets", context: "Support tickets empty", tone: "positive" },
      { key: "emptyTicketsSub", ru: "Это хороший знак — всё работает", kz: "Бұл жақсы белгі — бәрі жұмыс істейді", en: "That's a good sign — everything's working", context: "Support empty subtitle", tone: "celebratory" },
      { key: "emptyPaymentsTitle", ru: "Нет платежей", kz: "Төлемдер жоқ", en: "No payments yet", context: "Payment history empty", tone: "neutral" },
      { key: "emptyPaymentsSub", ru: "Здесь появится история ваших платежей", kz: "Мұнда төлем тарихыңыз пайда болады", en: "Your payment history will appear here", context: "Payments empty subtitle", tone: "neutral" },
      { key: "emptyMembersTitle", ru: "Нет участников", kz: "Қатысушылар жоқ", en: "No members yet", context: "Room members list empty (new room)", tone: "neutral" },
      { key: "emptyMembersSub", ru: "Поделитесь ссылкой, чтобы пригласить участников", kz: "Қатысушыларды шақыру үшін сілтемемен бөлісіңіз", en: "Share a link to invite members", context: "Room members empty subtitle", tone: "reassuring" },
    ],
  },

  /* ─── 4. ERRORS & FAILURES ─── */
  {
    id: "errors", titleKey: "clErrors", icon: AlertTriangle, color: "var(--eco-danger-500)",
    description: "Error messages must be specific, honest, and actionable. Never blame the user. Always suggest a next step.",
    entries: [
      { key: "errGeneric", ru: "Что-то пошло не так", kz: "Бірдеңе дұрыс болмады", en: "Something went wrong", context: "Catch-all error title", tone: "empathetic" },
      { key: "errGenericSub", ru: "Попробуйте обновить страницу. Если проблема повторяется — напишите в поддержку.", kz: "Бетті жаңартып көріңіз. Мәселе қайталанса — қолдауға жазыңыз.", en: "Try refreshing the page. If it keeps happening, contact support.", context: "Catch-all error subtitle", tone: "reassuring" },
      { key: "errNetwork", ru: "Нет подключения к интернету", kz: "Интернет байланысы жоқ", en: "No internet connection", context: "Network / offline error", tone: "neutral" },
      { key: "errNetworkSub", ru: "Проверьте подключение и попробуйте снова", kz: "Байланысты тексеріп, қайта байқап көріңіз", en: "Check your connection and try again", context: "Network error subtitle", tone: "reassuring" },
      { key: "errTimeout", ru: "Сервер не отвечает", kz: "Сервер жауап бермейді", en: "Server not responding", context: "Request timeout", tone: "empathetic" },
      { key: "errTimeoutSub", ru: "Сейчас высокая нагрузка. Подождите минуту и попробуйте снова.", kz: "Қазір жүктеме жоғары. Бір минут күтіп, қайта байқап көріңіз.", en: "It's busy right now. Wait a moment and try again.", context: "Timeout subtitle", tone: "reassuring" },
      { key: "err404Title", ru: "Страница не найдена", kz: "Бет табылмады", en: "Page not found", context: "404 error title", tone: "neutral" },
      { key: "err404Sub", ru: "Возможно, ссылка устарела или была удалена", kz: "Мүмкін, сілтеме ескірген немесе жойылған", en: "The link may be outdated or the page was removed", context: "404 subtitle", tone: "neutral" },
      { key: "err403Title", ru: "Доступ ограничен", kz: "Қол жеткізу шектелген", en: "Access restricted", context: "403 / permission denied", tone: "neutral" },
      { key: "err403Sub", ru: "У вас нет прав для просмотра этой страницы", kz: "Сізде бұл бетті көру құқығы жоқ", en: "You don't have permission to view this page", context: "403 subtitle", tone: "neutral" },
      { key: "errRateLimit", ru: "Слишком много запросов", kz: "Тым көп сұраныс", en: "Too many requests", context: "429 rate limit", tone: "warning" },
      { key: "errRateLimitSub", ru: "Подождите немного — мы временно ограничили запросы для защиты сервиса", kz: "Аз күтіңіз — қызметті қорғау үшін сұрауларды уақытша шектедік", en: "Please wait — we've temporarily limited requests to protect the service", context: "Rate limit subtitle", tone: "reassuring" },
      { key: "errPayDeclined", ru: "Карта отклонена", kz: "Карта қабылданбады", en: "Card declined", context: "Payment card declined", tone: "neutral" },
      { key: "errPayDeclinedSub", ru: "Проверьте данные карты или попробуйте другой способ оплаты", kz: "Карта деректерін тексеріңіз немесе басқа төлем тәсілін қолданыңыз", en: "Check your card details or try a different payment method", context: "Card declined subtitle", tone: "reassuring" },
      { key: "errPayInsufficient", ru: "Недостаточно средств", kz: "Қаражат жеткіліксіз", en: "Insufficient funds", context: "Not enough balance on card", tone: "neutral" },
      { key: "errPayExpired", ru: "Срок карты истёк", kz: "Карта мерзімі өтті", en: "Card has expired", context: "Expired card at checkout", tone: "neutral" },
      { key: "errSessionExpired", ru: "Сессия истекла", kz: "Сессия мерзімі өтті", en: "Session expired", context: "Auth session timeout", tone: "neutral" },
      { key: "errSessionExpiredSub", ru: "Пожалуйста, войдите снова", kz: "Қайта кіріңіз", en: "Please log in again", context: "Session expired subtitle", tone: "neutral" },
      { key: "errRoomFull", ru: "Комната заполнена", kz: "Бөлме толды", en: "Room is full", context: "Race condition — filled during checkout", tone: "empathetic" },
      { key: "errRoomFullSub", ru: "Все места заняты. Посмотрите другие комнаты.", kz: "Барлық орындар бос емес. Басқа бөлмелерді қараңыз.", en: "All spots are taken. Browse other rooms.", context: "Room full subtitle", tone: "reassuring" },
      { key: "errRoomBlocked", ru: "Комната заблокирована", kz: "Бөлме бұғатталған", en: "Room is blocked", context: "Room suspended by admin", tone: "warning" },
      { key: "errRoomBlockedSub", ru: "Обнаружено нарушение. Обратитесь в поддержку, если считаете это ошибкой.", kz: "Бұзушылық анықталды. Қате деп санасаңыз, қолдауға хабарласыңыз.", en: "A violation was detected. Contact support if you think this is a mistake.", context: "Room blocked subtitle", tone: "reassuring" },
    ],
  },

  /* ─── 5. SUCCESS & CONFIRMATIONS ─── */
  {
    id: "success", titleKey: "clSuccess", icon: CheckCircle2, color: "var(--eco-success-500)",
    description: "Toast messages and success states. Keep concise (max 50 chars for toasts). Celebrate without being over-the-top.",
    entries: [
      { key: "toastSaved", ru: "Сохранено", kz: "Сақталды", en: "Saved", context: "Settings / profile saved toast", tone: "positive", maxChars: 20 },
      { key: "toastCopied", ru: "Скопировано", kz: "Көшірілді", en: "Copied", context: "Copy to clipboard toast", tone: "positive", maxChars: 20 },
      { key: "toastPaySuccess", ru: "Оплата прошла успешно", kz: "Төлем сәтті өтті", en: "Payment successful", context: "Payment confirmation toast", tone: "celebratory" },
      { key: "toastJoinedRoom", ru: "Вы присоединились к комнате", kz: "Сіз бөлмеге қосылдыңыз", en: "You've joined the room", context: "Room join confirmation", tone: "celebratory" },
      { key: "toastLeftRoom", ru: "Вы покинули комнату", kz: "Сіз бөлмеден шықтыңыз", en: "You've left the room", context: "Room leave confirmation", tone: "neutral" },
      { key: "toastRoomCreated", ru: "Комната создана", kz: "Бөлме құрылды", en: "Room created", context: "Room creation success", tone: "celebratory" },
      { key: "toastTicketSent", ru: "Обращение отправлено", kz: "Өтініш жіберілді", en: "Ticket submitted", context: "Support ticket created", tone: "positive" },
      { key: "toastReviewPosted", ru: "Отзыв опубликован", kz: "Пікір жарияланды", en: "Review posted", context: "Review submitted", tone: "positive" },
      { key: "toastPasswordChanged", ru: "Пароль изменён", kz: "Құпиясөз өзгертілді", en: "Password changed", context: "Password update success", tone: "positive" },
      { key: "toastPromoApplied", ru: "Промокод применён", kz: "Промокод қолданылды", en: "Promo code applied", context: "Promo code accepted", tone: "celebratory" },
      { key: "toastExportReady", ru: "Файл готов к скачиванию", kz: "Файл жүктеуге дайын", en: "File ready for download", context: "CSV/PDF export complete", tone: "positive" },
      { key: "confirmLeaveRoom", ru: "Вы уверены, что хотите покинуть комнату? Подписка будет активна до конца оплаченного периода.", kz: "Бөлмеден шығуға сенімдісіз бе? Жазылым төленген кезеңнің соңына дейін белсенді болады.", en: "Are you sure you want to leave? Your subscription stays active until the end of the paid period.", context: "Leave room confirmation modal body", tone: "neutral" },
      { key: "confirmDeleteAccount", ru: "Это действие нельзя отменить. Все данные будут удалены в течение 30 дней.", kz: "Бұл әрекетті кері қайтару мүмкін емес. Барлық деректер 30 күн ішінде жойылады.", en: "This can't be undone. All data will be deleted within 30 days.", context: "Account deletion confirmation", tone: "urgent" },
      { key: "confirmCancelPayment", ru: "Отменить платёж? Удержанные средства вернутся в течение 3–5 рабочих дней.", kz: "Төлемді болдырмау керек пе? Ұсталған қаражат 3–5 жұмыс күні ішінде қайтарылады.", en: "Cancel this payment? Held funds will be returned within 3–5 business days.", context: "Cancel on-hold payment", tone: "neutral" },
    ],
  },

  /* ─── 6. SECURITY & FRAUD ─── */
  {
    id: "security", titleKey: "clSecurity", icon: ShieldCheck, color: "var(--eco-success-500)",
    description: "Security messaging must be calm and factual. Never panic the user. Explain what happened and what they should do.",
    entries: [
      { key: "secNewDevice", ru: "Вход с нового устройства", kz: "Жаңа құрылғыдан кіру", en: "Login from a new device", context: "New device detection notification", tone: "warning" },
      { key: "secNewDeviceSub", ru: "Если это были не вы — немедленно смените пароль", kz: "Бұл сіз болмасаңыз — құпиясөзді дереу өзгертіңіз", en: "If this wasn't you, change your password immediately", context: "New device notification subtitle", tone: "warning" },
      { key: "secSuspiciousTitle", ru: "Необычная активность", kz: "Әдеттен тыс белсенділік", en: "Unusual activity detected", context: "Suspicious account activity alert title", tone: "warning" },
      { key: "secSuspiciousSub", ru: "Мы заметили необычные действия в вашем аккаунте. Для вашей безопасности проверьте последние действия.", kz: "Аккаунтыңызда әдеттен тыс әрекеттерді байқадық. Қауіпсіздігіңіз үшін соңғы әрекеттерді тексеріңіз.", en: "We noticed unusual activity on your account. For your safety, review your recent actions.", context: "Suspicious activity alert subtitle", tone: "reassuring" },
      { key: "secAccountLocked", ru: "Аккаунт временно заблокирован", kz: "Аккаунт уақытша бұғатталды", en: "Account temporarily locked", context: "Too many failed login attempts", tone: "warning" },
      { key: "secAccountLockedSub", ru: "Слишком много попыток входа. Попробуйте через {minutes} минут или восстановите пароль.", kz: "Тым көп кіру әрекеті. {minutes} минуттан кейін байқап көріңіз немесе құпиясөзді қалпына келтіріңіз.", en: "Too many login attempts. Try again in {minutes} minutes or reset your password.", context: "Account locked subtitle", tone: "reassuring", placeholders: ["{minutes}"] },
      { key: "secPasswordChanged", ru: "Ваш пароль был изменён", kz: "Құпиясөзіңіз өзгертілді", en: "Your password was changed", context: "Password change notification", tone: "neutral" },
      { key: "secPasswordChangedSub", ru: "Если это были не вы — обратитесь в поддержку", kz: "Бұл сіз болмасаңыз — қолдауға хабарласыңыз", en: "If this wasn't you, contact support", context: "Password change notification subtitle", tone: "reassuring" },
      { key: "secPrivacyNote", ru: "Мы не передаём ваши данные третьим лицам", kz: "Деректеріңізді үшінші тарапқа бермейміз", en: "We don't share your data with third parties", context: "Privacy reassurance in settings", tone: "reassuring" },
      { key: "secGeoPrivacy", ru: "Координаты не сохраняются и используются только для подбора", kz: "Координаталар сақталмайды және тек таңдау үшін қолданылады", en: "Your coordinates aren't stored — only used for matching", context: "Geolocation privacy note", tone: "reassuring" },
      { key: "secDataEncrypted", ru: "Все данные зашифрованы и защищены", kz: "Барлық деректер шифрланған және қорғалған", en: "All data is encrypted and protected", context: "Security footer note", tone: "reassuring" },
      { key: "secFraudWarning", ru: "Не делитесь паролем или кодом подтверждения ни с кем, включая сотрудников EcoPay", kz: "Құпиясөзіңізді немесе растау кодын ешкіммен, соның ішінде EcoPay қызметкерлерімен бөліспеңіз", en: "Never share your password or verification code with anyone, including EcoPay staff", context: "Anti-fraud warning in profile/settings", tone: "warning" },
      { key: "secVerifyIdentity", ru: "Подтвердите вашу личность для продолжения", kz: "Жалғаст��ру үшін жеке басыңызды растаңыз", en: "Verify your identity to continue", context: "Step-up auth prompt", tone: "neutral" },
      { key: "secRevealReason", ru: "Для просмотра полных данных укажите причину", kz: "Толық деректерді көру үшін себеп көрсетіңіз", en: "Provide a reason to reveal full data", context: "Admin PII reveal prompt", tone: "neutral" },
    ],
  },

  /* ─── 7. DISPUTES & REFUNDS ─── */
  {
    id: "disputes", titleKey: "clDisputes", icon: Shield, color: "var(--eco-warning-500)",
    description: "Dispute and refund language must be clear, factual, and non-legal. Avoid words like 'liable', 'prosecute', 'sue'. Stay calm.",
    entries: [
      { key: "dispFiledTitle", ru: "Спор зарегистрирован", kz: "Дау тіркелді", en: "Dispute filed", context: "Dispute creation confirmation", tone: "neutral" },
      { key: "dispFiledSub", ru: "Мы рассмотрим ваше обращение в течение 48 часов", kz: "Өтінішіңізді 48 сағат ішінде қарастырамыз", en: "We'll review your case within 48 hours", context: "Dispute created subtitle", tone: "reassuring" },
      { key: "dispFiledAgainst", ru: "На вас подан спор", kz: "Сізге қарсы дау ашылды", en: "A dispute was filed against you", context: "Respondent notification title", tone: "warning" },
      { key: "dispFiledAgainstSub", ru: "Пожалуйста, ознакомьтесь с деталями и предоставьте вашу позицию", kz: "Мәліметтермен танысып, өз позицияңызды ұсыныңыз", en: "Please review the details and share your side", context: "Respondent notification subtitle", tone: "empathetic" },
      { key: "dispInvestigating", ru: "Спор на рассмотрении", kz: "Дау қарастырылуда", en: "Dispute under review", context: "Investigating status label", tone: "neutral" },
      { key: "dispNeedEvidence", ru: "Предоставьте подтверждающие документы до {deadline}", kz: "{deadline} дейін растайтын құжаттарды беріңіз", en: "Submit supporting documents by {deadline}", context: "Evidence request with deadline", tone: "neutral", placeholders: ["{deadline}"] },
      { key: "dispResolvedFavor", ru: "Спор решён в вашу пользу", kz: "Дау сіздің пайдаңызға шешілді", en: "Dispute resolved in your favor", context: "Reporter wins", tone: "positive" },
      { key: "dispResolvedAgainst", ru: "Спор закрыт — нарушений не обнаружено", kz: "Дау жабылды — бұзушылық табылмады", en: "Dispute closed — no violation found", context: "Respondent wins", tone: "neutral" },
      { key: "dispEscalated", ru: "Спор передан старшему модератору", kz: "Дау аға модераторға жіберілді", en: "Dispute escalated to senior moderator", context: "Escalation notification", tone: "neutral" },
      { key: "refundInitiated", ru: "Возврат оформлен", kz: "Қайтару рәсімделді", en: "Refund initiated", context: "Refund process started", tone: "positive" },
      { key: "refundInitiatedSub", ru: "Средства вернутся на карту в течение 3–5 рабочих дней", kz: "Қаражат 3–5 жұмыс күні ішінде картаға қайтарылады", en: "Funds will return to your card within 3–5 business days", context: "Refund timeline note", tone: "reassuring" },
      { key: "refundPartial", ru: "Частичный возврат: {amount}", kz: "Ішінара қайтару: {amount}", en: "Partial refund: {amount}", context: "Partial refund with amount", tone: "neutral", placeholders: ["{amount}"] },
      { key: "refundFull", ru: "Полный возврат: {amount}", kz: "Толық қайтару: {amount}", en: "Full refund: {amount}", context: "Full refund with amount", tone: "positive", placeholders: ["{amount}"] },
      { key: "refundCompleted", ru: "Возврат завершён", kz: "Қайтару аяқталды", en: "Refund completed", context: "Refund done notification", tone: "positive" },
      { key: "refundDenied", ru: "Возврат отклонён", kz: "Қайтару қабылданбады", en: "Refund request denied", context: "Refund denied notification", tone: "empathetic" },
      { key: "refundDeniedSub", ru: "Подробности указаны в решении по вашему обращению", kz: "Мәліметтер өтінішіңіз бойынша шешімде көрсетілген", en: "Details are available in your case decision", context: "Refund denied subtitle", tone: "neutral" },
    ],
  },

  /* ─── 8. NOTIFICATIONS ─── */
  {
    id: "notifs", titleKey: "clNotifs", icon: Bell, color: "var(--eco-warning-500)",
    description: "Notification titles — max 60 chars. Must be scannable. Lead with the action, not the actor.",
    entries: [
      { key: "notifPayReceived", ru: "Получен платёж — {amount}", kz: "Төлем алынды — {amount}", en: "Payment received — {amount}", context: "Owner receives payment", tone: "positive", placeholders: ["{amount}"] },
      { key: "notifPayFailed", ru: "Платёж не прошёл", kz: "Төлем өтпеді", en: "Payment failed", context: "Payment attempt failed", tone: "warning" },
      { key: "notifPayReminder", ru: "Оплата через {days} дней", kz: "{days} күннен кейін төлем", en: "Payment due in {days} days", context: "Upcoming payment reminder", tone: "neutral", placeholders: ["{days}"] },
      { key: "notifMemberJoined", ru: "{name} присоединился к комнате", kz: "{name} бөлмеге қосылды", en: "{name} joined the room", context: "New member notification", tone: "positive", placeholders: ["{name}"] },
      { key: "notifMemberLeft", ru: "{name} покинул комнату", kz: "{name} бөлмеден шықты", en: "{name} left the room", context: "Member departure notification", tone: "neutral", placeholders: ["{name}"] },
      { key: "notifRoomActive", ru: "Комната активирована", kz: "Бөлме белсендірілді", en: "Room activated", context: "Room verified and active", tone: "celebratory" },
      { key: "notifRoomExpiring", ru: "Комната истекает через {days} дней", kz: "Бөлме {days} күннен кейін аяқталады", en: "Room expires in {days} days", context: "Room nearing expiry", tone: "warning", placeholders: ["{days}"] },
      { key: "notifTicketReply", ru: "Новый ответ в обращении #{id}", kz: "#{id} өтінішінде жаңа жауап", en: "New reply on ticket #{id}", context: "Support ticket reply", tone: "neutral", placeholders: ["{id}"] },
      { key: "notifDisputeFiled", ru: "Открыт спор по комнате {room}", kz: "{room} бөлмесі бойынша дау ашылды", en: "Dispute opened for room {room}", context: "Dispute filed notification", tone: "warning", placeholders: ["{room}"] },
      { key: "notifDisputeResolved", ru: "Спор #{id} закрыт", kz: "#{id} дау жабылды", en: "Dispute #{id} resolved", context: "Dispute resolution notification", tone: "positive", placeholders: ["{id}"] },
      { key: "notifMaintenance", ru: "Плановые работы {date} с {from} до {to}", kz: "{date} жоспарлы жұмыстар {from}–{to}", en: "Scheduled maintenance on {date}, {from}–{to}", context: "System maintenance notification", tone: "neutral", placeholders: ["{date}", "{from}", "{to}"] },
      { key: "notifWelcome", ru: "Добро пожаловать в EcoPay", kz: "EcoPay-ге қош келдіңіз", en: "Welcome to EcoPay", context: "First login welcome notification", tone: "celebratory" },
    ],
  },

  /* ─── 9. PLURALIZATION ─── */
  {
    id: "plurals", titleKey: "clPlurals", icon: Hash, color: "var(--eco-brand-600)",
    description: "Russian has 3 plural forms (1, 2-4, 5+). Kazakh uses a suffix. English has 2 forms. Always use {count} placeholder.",
    entries: [
      { key: "pluralRoom_1", ru: "{count} комната", kz: "{count} бөлме", en: "{count} room", context: "1 room (Russian: 1, 21, 31…)", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralRoom_2", ru: "{count} комнаты", kz: "{count} бөлме", en: "{count} rooms", context: "2-4 rooms (Russian: 2, 3, 4, 22…)", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralRoom_5", ru: "{count} комнат", kz: "{count} бөлме", en: "{count} rooms", context: "5+ rooms (Russian: 5-20, 25…)", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralSeat_1", ru: "{count} место", kz: "{count} орын", en: "{count} spot", context: "1 seat/spot in room", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralSeat_2", ru: "{count} места", kz: "{count} орын", en: "{count} spots", context: "2-4 seats/spots", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralSeat_5", ru: "{count} мест", kz: "{count} орын", en: "{count} spots", context: "5+ seats/spots", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralDay_1", ru: "{count} день", kz: "{count} күн", en: "{count} day", context: "1 day", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralDay_2", ru: "{count} дня", kz: "{count} күн", en: "{count} days", context: "2-4 days", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralDay_5", ru: "{count} дней", kz: "{count} күн", en: "{count} days", context: "5+ days", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralHour_1", ru: "{count} час", kz: "{count} сағат", en: "{count} hour", context: "1 hour", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralHour_2", ru: "{count} часа", kz: "{count} сағат", en: "{count} hours", context: "2-4 hours", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralHour_5", ru: "{count} часов", kz: "{count} сағат", en: "{count} hours", context: "5+ hours", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralReview_1", ru: "{count} отзыв", kz: "{count} пікір", en: "{count} review", context: "1 review", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralReview_2", ru: "{count} отзыва", kz: "{count} пікір", en: "{count} reviews", context: "2-4 reviews", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralReview_5", ru: "{count} отзывов", kz: "{count} пікір", en: "{count} reviews", context: "5+ reviews", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralMember_1", ru: "{count} участник", kz: "{count} қатысушы", en: "{count} member", context: "1 member", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralMember_2", ru: "{count} участника", kz: "{count} қатысушы", en: "{count} members", context: "2-4 members", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralMember_5", ru: "{count} участников", kz: "{count} қатысушы", en: "{count} members", context: "5+ members", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralPlan_1", ru: "{count} тариф", kz: "{count} тариф", en: "{count} plan", context: "1 plan", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralPlan_2", ru: "{count} тарифа", kz: "{count} тариф", en: "{count} plans", context: "2-4 plans", tone: "neutral", placeholders: ["{count}"] },
      { key: "pluralPlan_5", ru: "{count} тарифов", kz: "{count} тариф", en: "{count} plans", context: "5+ plans", tone: "neutral", placeholders: ["{count}"] },
    ],
  },

  /* ─── 10. NUMBERS & FORMATTING ─── */
  {
    id: "numbers", titleKey: "clNumbers", icon: Type, color: "var(--eco-text-secondary)",
    description: "Number and currency formatting reference. All amounts stored in tiyn server-side. Display rules by locale.",
    entries: [
      { key: "fmtCurrencyKZT", ru: "{amount} ₸", kz: "{amount} ₸", en: "{amount} ₸", context: "Standard KZT display. Amount pre-formatted with locale grouping.", tone: "neutral", placeholders: ["{amount}"] },
      { key: "fmtCurrencyFree", ru: "Бесплатно", kz: "Тегін", en: "Free", context: "Zero amount display", tone: "neutral" },
      { key: "fmtCurrencyNeg", ru: "−{amount} ₸", kz: "−{amount} ₸", en: "−{amount} ₸", context: "Negative/refund amount. Use U+2212 minus, not hyphen.", tone: "neutral", placeholders: ["{amount}"] },
      { key: "fmtPerMonth", ru: "{amount}/мес", kz: "{amount}/ай", en: "{amount}/mo", context: "Monthly price shorthand", tone: "neutral", placeholders: ["{amount}"] },
      { key: "fmtDateFull", ru: "{day} {month} {year}", kz: "{day} {month} {year}", en: "{month} {day}, {year}", context: "Full date. Note: EN order differs.", tone: "neutral", placeholders: ["{day}", "{month}", "{year}"] },
      { key: "fmtDateShort", ru: "{day} {month_short}", kz: "{day} {month_short}", en: "{month_short} {day}", context: "Short date for lists / tables", tone: "neutral", placeholders: ["{day}", "{month_short}"] },
      { key: "fmtRelativeNow", ru: "только что", kz: "жаңа ғана", en: "just now", context: "Relative time: <1 minute", tone: "neutral" },
      { key: "fmtRelativeMin", ru: "{n} мин назад", kz: "{n} мин бұрын", en: "{n}m ago", context: "Relative time: 1-59 minutes", tone: "neutral", placeholders: ["{n}"] },
      { key: "fmtRelativeHour", ru: "{n} ч назад", kz: "{n} с бұрын", en: "{n}h ago", context: "Relative time: 1-23 hours", tone: "neutral", placeholders: ["{n}"] },
      { key: "fmtRelativeYesterday", ru: "вчера", kz: "кеше", en: "yesterday", context: "Relative time: 24-48h ago", tone: "neutral" },
      { key: "fmtPercent", ru: "{n}%", kz: "{n}%", en: "{n}%", context: "Percentage. No space before % in all locales.", tone: "neutral", placeholders: ["{n}"] },
      { key: "fmtDataGB", ru: "{n} ГБ", kz: "{n} ГБ", en: "{n} GB", context: "Data amount in gigabytes", tone: "neutral", placeholders: ["{n}"] },
      { key: "fmtDataUnlimited", ru: "Безлимит", kz: "Шексіз", en: "Unlimited", context: "Unlimited data/calls", tone: "neutral" },
      { key: "fmtMaskedCard", ru: "•••• {last4}", kz: "•••• {last4}", en: "•••• {last4}", context: "Masked card number", tone: "neutral", placeholders: ["{last4}"] },
      { key: "fmtMaskedPhone", ru: "+7 ••• ••• ••{last2}", kz: "+7 ••• ••• ••{last2}", en: "+7 ••• ••• ••{last2}", context: "Masked phone number", tone: "neutral", placeholders: ["{last2}"] },
      { key: "fmtMaskedEmail", ru: "{first}•••@{domain}", kz: "{first}•••@{domain}", en: "{first}•••@{domain}", context: "Masked email", tone: "neutral", placeholders: ["{first}", "{domain}"] },
    ],
  },
];

/* ═══════ SHARED PRIMITIVES ═══════ */
const SC = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl ${className}`} style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>{children}</div>
);

function ToneBadge({ tone }: { tone: Tone }) {
  const t = TONE_MAP[tone];
  return <span className="text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: t.bg, color: t.color }}>{t.label}</span>;
}

function CopyChip({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-colors"
      style={{ background: "var(--eco-neutral-100)", color: "var(--eco-primary)" }}
      title="Copy key"
    >
      <code>{text}</code>
      {copied ? <Check size={8} style={{ color: "var(--eco-success-500)" }} /> : <Copy size={8} />}
    </button>
  );
}

function LangPreview({ ru, kz, en, activeLang }: { ru: string; kz: string; en: string; activeLang: "ru" | "kz" | "en" }) {
  const map = { ru, kz, en };
  return (
    <div className="flex flex-col gap-1">
      {(["ru", "kz", "en"] as const).map((lang) => (
        <div key={lang} className="flex items-start gap-1.5">
          <span
            className="text-[8px] uppercase px-1 py-0.5 rounded shrink-0 mt-0.5"
            style={{
              background: lang === activeLang ? "var(--eco-primary)" : "var(--eco-neutral-100)",
              color: lang === activeLang ? "var(--eco-text-on-primary)" : "var(--eco-text-tertiary)",
            }}
          >{lang}</span>
          <span className="text-[12px]" style={{ color: lang === activeLang ? "var(--eco-text)" : "var(--eco-text-tertiary)" }}>{map[lang]}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════ ENTRY ROW ═══════ */
function EntryRow({ entry, lang, isLast }: { entry: CopyEntry; lang: "ru" | "kz" | "en"; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ borderBottom: isLast ? "none" : "1px solid var(--eco-border)" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-3 cursor-pointer text-left transition-colors hover:bg-[var(--eco-bg)]"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <CopyChip text={entry.key} />
            <ToneBadge tone={entry.tone} />
            {entry.maxChars && (
              <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-text-tertiary)" }}>max {entry.maxChars}</span>
            )}
            {entry.placeholders?.map((p) => (
              <code key={p} className="text-[9px] px-1 py-0.5 rounded" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>{p}</code>
            ))}
          </div>
          <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>{entry[lang]}</div>
          <div className="text-[10px] mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{entry.context}</div>
        </div>
        <ChevronRight
          size={14}
          className="shrink-0 transition-transform"
          style={{ color: "var(--eco-neutral-300)", transform: expanded ? "rotate(90deg)" : "rotate(0)" }}
        />
      </button>

      {expanded && (
        <div className="px-5 pb-4 pt-0">
          <div className="rounded-lg p-3" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
            <LangPreview ru={entry.ru} kz={entry.kz} en={entry.en} activeLang={lang} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════ CATEGORY CARD ═══════ */
function CategoryCard({ cat, lang, searchTerm }: { cat: CopyCategory; lang: "ru" | "kz" | "en"; searchTerm: string }) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const Icon = cat.icon;

  const filtered = searchTerm
    ? cat.entries.filter((e) =>
        e.key.toLowerCase().includes(searchTerm) ||
        e.ru.toLowerCase().includes(searchTerm) ||
        e.kz.toLowerCase().includes(searchTerm) ||
        e.en.toLowerCase().includes(searchTerm) ||
        e.context.toLowerCase().includes(searchTerm)
      )
    : cat.entries;

  // Auto-open when searching and there are results
  const showOpen = searchTerm ? filtered.length > 0 : isOpen;

  if (searchTerm && filtered.length === 0) return null;

  return (
    <SC className="!p-0 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-5 py-4 cursor-pointer text-left transition-colors"
        style={{ background: showOpen ? "var(--eco-bg)" : "transparent" }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${cat.color}15` }}>
          <Icon size={16} style={{ color: cat.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t(cat.titleKey)}</div>
          <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{cat.description}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${cat.color}15`, color: cat.color }}>
            {searchTerm ? `${filtered.length}/${cat.entries.length}` : cat.entries.length}
          </span>
          <ChevronDown
            size={14}
            className="transition-transform"
            style={{ color: "var(--eco-neutral-300)", transform: showOpen ? "rotate(180deg)" : "rotate(0)" }}
          />
        </div>
      </button>

      {showOpen && (
        <div style={{ borderTop: "1px solid var(--eco-border)" }}>
          {filtered.map((entry, i) => (
            <EntryRow key={entry.key} entry={entry} lang={lang} isLast={i === filtered.length - 1} />
          ))}
        </div>
      )}
    </SC>
  );
}

/* ═══════ TONE GUIDE CARD ═══════ */
function ToneGuide() {
  const { t } = useI18n();
  const toneRules = [
    { tone: "neutral" as Tone, doText: "State facts plainly. No extra emotion.", dontText: "Don't add filler words or exclamation marks.", example: "Комната заполнена → Room is full" },
    { tone: "positive" as Tone, doText: "Acknowledge success briefly. One short sentence.", dontText: "Don't over-celebrate small actions. No confetti for 'Saved'.", example: "Оплата прошла успешно → Payment successful" },
    { tone: "reassuring" as Tone, doText: "Calm the user. Explain what happens next. Suggest a fix.", dontText: "Don't minimize the problem or blame the user.", example: "Подождите немного — мы скоро всё починим" },
    { tone: "warning" as Tone, doText: "Be factual and direct. State the consequence clearly.", dontText: "Don't use scary language or ALL CAPS.", example: "Вход с нового устройства → Login from a new device" },
    { tone: "urgent" as Tone, doText: "Lead with the action needed. Make the path clear.", dontText: "Don't panic. Never use 'DANGER' or 'ALERT'.", example: "Это действие нельзя отменить → This can't be undone" },
    { tone: "empathetic" as Tone, doText: "Acknowledge frustration. Take responsibility.", dontText: "Don't deflect ('This is your bank's issue').", example: "Что-то пошло не так → Something went wrong" },
    { tone: "celebratory" as Tone, doText: "Brief positive moment. Used sparingly for milestones.", dontText: "Don't use for routine actions. No emoji in copy.", example: "Добро пожаловать в EcoPay → Welcome to EcoPay" },
  ];

  return (
    <SC className="!p-0 overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--eco-border)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--eco-brand-50)" }}>
          <Heart size={16} style={{ color: "var(--eco-primary)" }} />
        </div>
        <div>
          <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>{t("clToneGuide")}</div>
          <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>7 tones · When to use each one</div>
        </div>
      </div>

      {toneRules.map((rule, i) => (
        <div key={rule.tone} className="px-5 py-3 flex gap-4" style={{ borderBottom: i < toneRules.length - 1 ? "1px solid var(--eco-border)" : "none" }}>
          <div className="w-20 shrink-0 pt-0.5">
            <ToneBadge tone={rule.tone} />
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-[9px] mb-1 flex items-center gap-1" style={{ color: "var(--eco-success-500)" }}><Check size={8} /> DO</div>
              <div className="text-[11px]" style={{ color: "var(--eco-text-secondary)" }}>{rule.doText}</div>
            </div>
            <div>
              <div className="text-[9px] mb-1 flex items-center gap-1" style={{ color: "var(--eco-danger-500)" }}><X size={8} /> DON'T</div>
              <div className="text-[11px]" style={{ color: "var(--eco-text-secondary)" }}>{rule.dontText}</div>
            </div>
            <div>
              <div className="text-[9px] mb-1 flex items-center gap-1" style={{ color: "var(--eco-text-tertiary)" }}><FileText size={8} /> EXAMPLE</div>
              <code className="text-[10px]" style={{ color: "var(--eco-primary)" }}>{rule.example}</code>
            </div>
          </div>
        </div>
      ))}
    </SC>
  );
}

/* ═══════ PLURALIZATION GUIDE ═══════ */
function PluralGuide() {
  return (
    <SC className="!p-0 overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--eco-border)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--eco-brand-50)" }}>
          <Globe2 size={16} style={{ color: "var(--eco-primary)" }} />
        </div>
        <div>
          <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>Pluralization Engine</div>
          <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>How to pick the right form at runtime</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: "var(--eco-border)" }}>
        {/* Russian */}
        <div className="px-5 py-4">
          <div className="text-[10px] tracking-widest uppercase mb-3" style={{ color: "var(--eco-text-tertiary)" }}>RUSSIAN (3 forms)</div>
          <div className="rounded-lg p-3 mb-3" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
            <code className="text-[10px] block leading-relaxed" style={{ color: "var(--eco-primary)" }}>
              {`function pluralRU(n: number): 1|2|5 {\n  const mod10 = n % 10;\n  const mod100 = n % 100;\n  if (mod10===1 && mod100!==11) return 1;\n  if (mod10>=2 && mod10<=4 &&\n    (mod100<10 || mod100>=20)) return 2;\n  return 5;\n}`}
            </code>
          </div>
          <div className="space-y-1 text-[11px]" style={{ color: "var(--eco-text-secondary)" }}>
            <div><code className="text-[10px]" style={{ color: "var(--eco-primary)" }}>1</code> → 1, 21, 31, 101… <span style={{ color: "var(--eco-text-tertiary)" }}>комнат<strong>а</strong></span></div>
            <div><code className="text-[10px]" style={{ color: "var(--eco-primary)" }}>2</code> → 2, 3, 4, 22, 23… <span style={{ color: "var(--eco-text-tertiary)" }}>комнат<strong>ы</strong></span></div>
            <div><code className="text-[10px]" style={{ color: "var(--eco-primary)" }}>5</code> → 0, 5-20, 25-30… <span style={{ color: "var(--eco-text-tertiary)" }}>комнат<strong>∅</strong></span></div>
          </div>
        </div>

        {/* Kazakh */}
        <div className="px-5 py-4">
          <div className="text-[10px] tracking-widest uppercase mb-3" style={{ color: "var(--eco-text-tertiary)" }}>KAZAKH (1 form — no grammatical plural)</div>
          <div className="rounded-lg p-3 mb-3" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
            <code className="text-[10px] block leading-relaxed" style={{ color: "var(--eco-primary)" }}>
              {`// Kazakh doesn't inflect nouns\n// by count — always use base form.\nfunction pluralKZ(): 1 {\n  return 1; // always same form\n}`}
            </code>
          </div>
          <div className="space-y-1 text-[11px]" style={{ color: "var(--eco-text-secondary)" }}>
            <div>1 бөлме, 2 бөлме, 5 бөлме, 100 бөлме</div>
            <div className="text-[10px] mt-2 rounded-lg px-2 py-1" style={{ background: "var(--eco-success-100)", color: "var(--eco-success-500)" }}>Kazakh is the simplest — one key per noun</div>
          </div>
        </div>

        {/* English */}
        <div className="px-5 py-4">
          <div className="text-[10px] tracking-widest uppercase mb-3" style={{ color: "var(--eco-text-tertiary)" }}>ENGLISH (2 forms)</div>
          <div className="rounded-lg p-3 mb-3" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
            <code className="text-[10px] block leading-relaxed" style={{ color: "var(--eco-primary)" }}>
              {`function pluralEN(n: number): 1|2 {\n  return n === 1 ? 1 : 2;\n}`}
            </code>
          </div>
          <div className="space-y-1 text-[11px]" style={{ color: "var(--eco-text-secondary)" }}>
            <div><code className="text-[10px]" style={{ color: "var(--eco-primary)" }}>1</code> → 1 <span style={{ color: "var(--eco-text-tertiary)" }}>room</span></div>
            <div><code className="text-[10px]" style={{ color: "var(--eco-primary)" }}>2</code> → 0, 2, 3, 4, 5… <span style={{ color: "var(--eco-text-tertiary)" }}>rooms</span></div>
          </div>
        </div>
      </div>

      {/* Key naming */}
      <div className="px-5 py-3" style={{ borderTop: "1px solid var(--eco-border)", background: "var(--eco-bg)" }}>
        <div className="text-[10px] tracking-widest uppercase mb-2" style={{ color: "var(--eco-text-tertiary)" }}>KEY NAMING CONVENTION</div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "plural{Noun}_1", desc: "Singular (n=1)" },
            { key: "plural{Noun}_2", desc: "Few (n=2-4, RU only)" },
            { key: "plural{Noun}_5", desc: "Many (n=5+, RU) / Plural (EN)" },
          ].map((k) => (
            <div key={k.key} className="rounded-lg px-3 py-2" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
              <code className="text-[10px]" style={{ color: "var(--eco-primary)" }}>{k.key}</code>
              <div className="text-[9px] mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{k.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </SC>
  );
}

/* ═══════ WRITING RULES ═══════ */
function WritingRules() {
  const rules = [
    { icon: Type, title: "Sentence case everywhere", desc: "Capitalize first word only. 'View all rooms' not 'View All Rooms'. Exception: proper nouns (EcoPay, Beeline)." },
    { icon: Minus, title: "No exclamation marks", desc: "Errors, warnings, and even success messages use periods or no punctuation. Buttons never have punctuation." },
    { icon: Clock, title: "Max 2 sentences per state", desc: "Empty states, errors, confirmations: 1 title + 1 subtitle. Don't write essays in modals." },
    { icon: Zap, title: "Verb-first for buttons", desc: "'Pay now', 'Join room', 'Save changes'. Not 'Payment', 'Room joining', 'Changes'." },
    { icon: Shield, title: "Never blame the user", desc: "'Something went wrong' not 'You broke something'. 'Card declined' not 'Your card was rejected'." },
    { icon: Globe2, title: "Test all 3 locales for length", desc: "Russian is 30-40% longer than English. Kazakh varies. Always test overflow with longest locale." },
    { icon: Lock, title: "No technical jargon in user-facing copy", desc: "'Server not responding' not 'HTTP 503 Gateway Timeout'. 'Try again' not 'Retry request'." },
    { icon: Hash, title: "Use placeholders, not concatenation", desc: "'{name} joined' not userName + ' joined'. This breaks in Kazakh where word order differs." },
  ];

  return (
    <SC className="!p-0 overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--eco-border)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--eco-warning-100)" }}>
          <BookOpen size={16} style={{ color: "var(--eco-warning-500)" }} />
        </div>
        <div>
          <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>Writing Rules</div>
          <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>8 rules every contributor must follow</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
        {rules.map((rule, i) => (
          <div key={rule.title} className="px-5 py-3 flex gap-3" style={{ borderBottom: i < rules.length - 1 ? "1px solid var(--eco-border)" : "none", borderRight: i % 2 === 0 ? "1px solid var(--eco-border)" : "none" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--eco-neutral-100)" }}>
              <rule.icon size={12} style={{ color: "var(--eco-text-secondary)" }} />
            </div>
            <div>
              <div className="text-[12px] mb-0.5" style={{ color: "var(--eco-text)" }}>{rule.title}</div>
              <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{rule.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </SC>
  );
}

/* ═══════ MAIN PAGE COMPONENT ═══════ */
export function CopyLibraryPage() {
  const { t, language } = useI18n();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"library" | "tone" | "plurals" | "rules">("library");

  const searchLower = search.toLowerCase();

  const totalEntries = COPY_CATEGORIES.reduce((s, c) => s + c.entries.length, 0);
  const matchedEntries = searchLower
    ? COPY_CATEGORIES.reduce((s, c) => s + c.entries.filter((e) =>
        e.key.toLowerCase().includes(searchLower) ||
        e.ru.toLowerCase().includes(searchLower) ||
        e.kz.toLowerCase().includes(searchLower) ||
        e.en.toLowerCase().includes(searchLower) ||
        e.context.toLowerCase().includes(searchLower)
      ).length, 0)
    : totalEntries;

  const toneStats = useMemo(() => {
    const counts: Record<Tone, number> = { neutral: 0, positive: 0, reassuring: 0, warning: 0, urgent: 0, empathetic: 0, celebratory: 0 };
    COPY_CATEGORIES.forEach((c) => c.entries.forEach((e) => { counts[e.tone]++; }));
    return counts;
  }, []);

  const tabs = [
    { id: "library" as const, label: `Copy Library (${totalEntries})`, icon: List },
    { id: "tone" as const, label: "Tone Guide (7)", icon: Heart },
    { id: "plurals" as const, label: "Pluralization", icon: Hash },
    { id: "rules" as const, label: "Writing Rules (8)", icon: BookOpen },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>Page 24</span>
          <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--eco-success-100)", color: "var(--eco-success-500)" }}>Content System</span>
        </div>
        <h1 className="text-[30px] mb-2" style={{ color: "var(--eco-text)" }}>{t("clTitle")}</h1>
        <p className="text-[16px]" style={{ color: "var(--eco-text-secondary)" }}>{t("clSubtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {[
          { n: COPY_CATEGORIES.length.toString(), label: t("clCategories"), color: "var(--eco-primary)" },
          { n: totalEntries.toString(), label: t("clEntries"), color: "var(--eco-brand-600)" },
          { n: "3", label: "Languages", color: "var(--eco-success-500)" },
          ...Object.entries(toneStats).slice(0, 4).map(([tone, count]) => ({
            n: count.toString(),
            label: TONE_MAP[tone as Tone].label,
            color: TONE_MAP[tone as Tone].color,
          })),
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
            <div className="text-[18px] tabular-nums" style={{ color: s.color }}>{s.n}</div>
            <div className="text-[9px]" style={{ color: "var(--eco-text-tertiary)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto" style={{ background: "var(--eco-surface)" }}>
        {tabs.map(({ id, label, icon: TIcon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-1.5 flex-1 px-4 py-2.5 rounded-lg text-[12px] transition-all cursor-pointer justify-center whitespace-nowrap"
            style={{
              background: activeTab === id ? "var(--eco-bg)" : "transparent",
              color: activeTab === id ? "var(--eco-text)" : "var(--eco-text-tertiary)",
              boxShadow: activeTab === id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <TIcon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Search — only in library tab */}
      {activeTab === "library" && (
        <div className="mb-6">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--eco-text-tertiary)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("clSearchCopy")}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px]"
              style={{
                background: "var(--eco-surface)",
                border: "1px solid var(--eco-border)",
                color: "var(--eco-text)",
                outline: "none",
              }}
            />
            {search && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-[10px] tabular-nums" style={{ color: "var(--eco-text-tertiary)" }}>{matchedEntries}/{totalEntries}</span>
                <button onClick={() => setSearch("")} className="cursor-pointer" style={{ color: "var(--eco-text-tertiary)" }}><X size={12} /></button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === "library" && (
        <div className="flex flex-col gap-4">
          {COPY_CATEGORIES.map((cat) => (
            <CategoryCard key={cat.id} cat={cat} lang={language} searchTerm={searchLower} />
          ))}
          {searchLower && matchedEntries === 0 && (
            <SC className="!p-8 text-center">
              <Search size={24} className="mx-auto mb-3" style={{ color: "var(--eco-neutral-300)" }} />
              <div className="text-[14px] mb-1" style={{ color: "var(--eco-text)" }}>No matching copy found</div>
              <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>Try a different search term or browse categories</div>
            </SC>
          )}
        </div>
      )}

      {activeTab === "tone" && <ToneGuide />}

      {activeTab === "plurals" && (
        <div className="flex flex-col gap-6">
          <PluralGuide />
          {/* Show the plurals category entries too */}
          {COPY_CATEGORIES.filter((c) => c.id === "plurals").map((cat) => (
            <CategoryCard key={cat.id} cat={cat} lang={language} searchTerm="" />
          ))}
        </div>
      )}

      {activeTab === "rules" && <WritingRules />}

      {/* Footer */}
      <div className="mt-8 rounded-xl px-5 py-3 flex items-start gap-2" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
        <Info size={14} className="mt-0.5 shrink-0" style={{ color: "var(--eco-primary)" }} />
        <span className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
          All copy keys follow the <code className="text-[10px] px-1 rounded" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-primary)" }}>{'module'}{'{Screen}'}{'{Element}'}</code> naming convention from Page 23 — Data Contracts.
          New entries must be reviewed for tone, length, and all 3 locale variants before merging. Russian text is typically 30–40% longer than English — always test overflow.
        </span>
      </div>
    </div>
  );
}
