import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { setCurrentLanguage } from '../lib/locale';

export type Language = 'ru' | 'kz' | 'en';

type Translations = {
  [key: string]: {
    ru: string;
    kz: string;
    en: string;
  };
};

const translations: Translations = {
  // ===== Navigation & Header =====
  catalog: { ru: 'Каталог', kz: 'Каталог', en: 'Catalog' },
  news: { ru: 'Новости', kz: 'Жаңалықтар', en: 'News' },
  memberReviewsTitle: {
    ru: 'Отзывы участников',
    kz: 'Қатысушылар пікірлері',
    en: 'Member reviews',
  },
  inviteOffPlatformTitle: {
    ru: 'Пригласить вне платформы',
    kz: 'Платформадан тыс шақыру',
    en: 'Invite off-platform',
  },
  inviteOffPlatformDesc: {
    ru: 'Поделитесь этой ссылкой — открывший её человек войдёт или зарегистрируется и попадёт в комнату.',
    kz: 'Бұл сілтемемен бөлісіңіз — оны ашқан адам кіреді немесе тіркеліп, бөлмеге қосылады.',
    en: 'Share this link — opening it will let someone sign in or register and land directly in your room.',
  },
  inviteLinkCopy: { ru: 'Скопировать ссылку', kz: 'Сілтемені көшіру', en: 'Copy link' },
  inviteLinkCopiedToast: { ru: 'Ссылка скопирована', kz: 'Сілтеме көшірілді', en: 'Link copied' },
  inviteLinkCopyFailed: {
    ru: 'Не удалось скопировать автоматически — скопируйте вручную.',
    kz: 'Автоматты түрде көшіру мүмкін болмады — қолмен көшіріңіз.',
    en: 'Could not copy automatically — copy it manually.',
  },
  browseRooms: { ru: 'Открытые комнаты', kz: 'Ашық бөлмелер', en: 'Open Rooms' },
  myRooms: { ru: 'Мои комнаты', kz: 'Менің бөлмелерім', en: 'My Rooms' },
  support: { ru: 'Поддержка', kz: 'Қолдау', en: 'Support' },
  aboutUs: { ru: 'О нас', kz: 'Біз туралы', en: 'About Us' },
  signIn: { ru: 'Войти', kz: 'Кіру', en: 'Sign In' },
  signUp: { ru: 'Регистрация', kz: 'Тіркелу', en: 'Sign Up' },
  profile: { ru: 'Профиль', kz: 'Профиль', en: 'Profile' },
  settings: { ru: 'Настройки', kz: 'Баптаулар', en: 'Settings' },
  signOut: { ru: 'Выйти', kz: 'Шығу', en: 'Sign Out' },
  searchPlans: { ru: 'Поиск планов...', kz: 'Жоспарларды іздеу...', en: 'Search plans...' },
  menu: { ru: 'Меню', kz: 'Мәзір', en: 'Menu' },

  // ===== Footer =====
  product: { ru: 'Продукт', kz: 'Өнім', en: 'Product' },
  company: { ru: 'Компания', kz: 'Компания', en: 'Company' },
  howItWorks: { ru: 'Как это работает', kz: 'Қалай жұмыс істейді', en: 'How it Works' },
  pricing: { ru: 'Цены', kz: 'Бағалар', en: 'Pricing' },
  faq: { ru: 'Вопросы', kz: 'Сұрақтар', en: 'FAQ' },
  about: { ru: 'О нас', kz: 'Біз туралы', en: 'About' },
  terms: { ru: 'Условия', kz: 'Шарттар', en: 'Terms' },
  privacy: { ru: 'Конфиденциальность', kz: 'Құпиялылық', en: 'Privacy' },
  forOwners: { ru: 'Для владельцев', kz: 'Иелерге', en: 'For Owners' },
  createTicket: { ru: 'Создать заявку', kz: 'Өтінім жасау', en: 'Create Ticket' },
  ticketStatus: { ru: 'Статус заявки', kz: 'Өтінім мәртебесі', en: 'Ticket Status' },
  developedBy: {
    ru: 'Разработано Apex Digital',
    kz: 'Apex Digital әзірлеген',
    en: 'Developed by Apex Digital',
  },
  copyright: {
    ru: '© 2026 EcoPay · Астана, Казахстан',
    kz: '© 2026 EcoPay · Астана, Қазақстан',
    en: '© 2026 EcoPay · Astana, Kazakhstan',
  },

  // ===== Auth Pages =====
  createAccount: { ru: 'Создать аккаунт', kz: 'Тіркелгі жасау', en: 'Create Account' },
  displayName: { ru: 'Отображаемое имя', kz: 'Көрсетілетін ат', en: 'Display Name' },
  email: { ru: 'Эл. почта', kz: 'Электрондық пошта', en: 'Email' },
  password: { ru: 'Пароль', kz: 'Құпия сөз', en: 'Password' },
  confirmPassword: { ru: 'Подтвердите пароль', kz: 'Құпия сөзді растаңыз', en: 'Confirm Password' },
  enterPassword: { ru: 'Введите пароль', kz: 'Құпия сөзді енгізіңіз', en: 'Enter password' },
  yourEmail: { ru: 'ваш@email.com', kz: 'сіздің@email.com', en: 'your@email.com' },
  exampleName: { ru: 'например, Айдар', kz: 'мысалы, Айдар', en: 'e.g. Aidar' },
  alreadyHaveAccount: {
    ru: 'Уже есть аккаунт?',
    kz: 'Тіркелгіңіз бар ма?',
    en: 'Already have an account?',
  },
  dontHaveAccount: { ru: 'Нет аккаунта?', kz: 'Тіркелгіңіз жоқ па?', en: "Don't have an account?" },
  welcomeBack: {
    ru: 'Добро пожаловать в EcoPay',
    kz: 'EcoPay-ке қайта келіңіз',
    en: 'Welcome back to EcoPay',
  },
  joinEcoPay: {
    ru: 'Присоединяйтесь к EcoPay и начните экономить',
    kz: 'EcoPay-ке қосылып, үнемдеуді бастаңыз',
    en: 'Join EcoPay and start saving today',
  },
  rememberMe: { ru: 'Запомнить меня', kz: 'Мені есте сақта', en: 'Remember me' },
  forgotPassword: { ru: 'Забыли пароль?', kz: 'Құпия сөзді ұмыттыңыз ба?', en: 'Forgot password?' },
  resetPassword: { ru: 'Сбросить пароль', kz: 'Құпия сөзді қалпына келтіру', en: 'Reset Password' },
  backToSignIn: { ru: 'Назад ко входу', kz: 'Кіруге оралу', en: 'Back to Sign In' },
  checkYourEmail: {
    ru: 'Проверьте вашу почту',
    kz: 'Поштаңызды тексеріңіз',
    en: 'Check Your Email',
  },
  resetLinkSent: {
    ru: 'Мы отправили ссылку для сброса пароля на вашу почту. Ссылка действует 30 минут.',
    kz: 'Біз құпия сөзді қалпына келтіру сілтемесін поштаңызға жібердік. Сілтеме 30 минут жарамды.',
    en: 'We sent a password reset link to your email. Link expires in 30 minutes.',
  },
  resendEmail: { ru: 'Отправить повторно', kz: 'Қайта жіберу', en: 'Resend Email' },
  enterEmailForReset: {
    ru: 'Введите ваш email, и мы отправим инструкции для сброса пароля',
    kz: 'Email енгізіңіз, біз құпия сөзді қалпына келтіру нұсқауларын жібереміз',
    en: "Enter your email and we'll send you instructions to reset your password",
  },
  sendResetLink: { ru: 'Отправить ссылку', kz: 'Сілтеме жіберу', en: 'Send Reset Link' },
  show: { ru: 'Показать', kz: 'Көрсету', en: 'Show' },
  hide: { ru: 'Скрыть', kz: 'Жасыру', en: 'Hide' },

  // ===== Home/Catalog Page =====
  heroTitle: { ru: 'Делитесь тарифами.', kz: 'Тарифтерді бөлісіңіз.', en: 'Share plans.' },
  heroTitleHighlight: { ru: 'Экономьте.', kz: 'Үнемдеңіз.', en: 'Split costs.' },
  heroSubtitle: {
    ru: 'Находите или создавайте общие комнаты для семейных тарифов операторов связи. Экономьте до 70% от ежемесячного счёта.',
    kz: 'Байланыс операторларының отбасылық тарифтері үшін ортақ бөлмелер табыңыз немесе жасаңыз. Ай сайынғы төлемді 70% дейін үнемдеңіз.',
    en: 'Find or create shared rooms for telecom family plans. Save up to 70% on your monthly bill.',
  },
  mobileOperators: {
    ru: 'Мобильные операторы',
    kz: 'Мобильді операторлар',
    en: 'Mobile Operators',
  },
  familyGroupPlansAvailable: {
    ru: 'Семейные и групповые тарифы для совместного использования',
    kz: 'Отбасылық және топтық тарифтер бірлескен пайдалану үшін',
    en: 'Family & group plans available for splitting',
  },
  plansRooms: {
    ru: '{{plans}} тарифов · {{rooms}} комнат',
    kz: '{{plans}} тариф · {{rooms}} бөлме',
    en: '{{plans}} plans · {{rooms}} rooms',
  },
  noFamilyPlansAvailable: {
    ru: 'Нет семейных тарифов',
    kz: 'Отбасылық тарифтер жоқ',
    en: 'No family plans available',
  },
  homeInternet: { ru: 'Домашний интернет', kz: 'Үй интернеті', en: 'Home Internet' },
  bundledInternetPlans: {
    ru: 'Пакетные интернет-тарифы с мобильными операторами',
    kz: 'Мобильді операторлармен бірге интернет тарифтері',
    en: 'Bundled internet plans with mobile operators',
  },
  comingQ3: { ru: 'Скоро Q3 2026', kz: 'Жақында Q3 2026', en: 'Coming Q3 2026' },
  digitalSubscriptions: {
    ru: 'Цифровые подписки',
    kz: 'Цифрлық жазылымдар',
    en: 'Digital Subscriptions',
  },
  comingSoon: { ru: 'Скоро', kz: 'Жақында', en: 'Coming Soon' },
  available: { ru: 'Доступно', kz: 'Қолжетімді', en: 'Available' },
  beta: { ru: 'Бета', kz: 'Бета', en: 'Beta' },
  videoStreaming: { ru: 'Видео стриминг', kz: 'Видео ағын', en: 'Video Streaming' },
  music: { ru: 'Музыка', kz: 'Музыка', en: 'Music' },
  aiTools: { ru: 'AI инструменты', kz: 'AI құралдар', en: 'AI Tools' },
  premiumApps: { ru: 'Премиум приложения', kz: 'Премиум қолданбалар', en: 'Premium Apps' },

  // ===== Operator Detail Page =====
  familyPlansFor: {
    ru: 'Семейные тарифы {{operator}}',
    kz: '{{operator}} отбасылық тарифтері',
    en: '{{operator}} Family Plans',
  },
  selectPlanToJoin: {
    ru: 'Выберите тариф, чтобы присоединиться к комнате или создать свою',
    kz: 'Бөлмеге қосылу немесе өзіңіздікін жасау үшін тариф таңдаңыз',
    en: 'Select a plan to join a room or create your own',
  },
  gb: { ru: 'ГБ', kz: 'ГБ', en: 'GB' },
  unlimited: { ru: 'Безлимит', kz: 'Шексіз', en: 'Unlimited' },
  perMonth: { ru: '/мес', kz: '/ай', en: '/mo' },
  data: { ru: 'Интернет', kz: 'Интернет', en: 'Data' },
  minutes: { ru: 'Минуты', kz: 'Минуттар', en: 'Minutes' },
  sms: { ru: 'SMS', kz: 'SMS', en: 'SMS' },
  slots: { ru: 'слотов', kz: 'слот', en: 'slots' },
  availableRooms: { ru: 'Доступные комнаты', kz: 'Қолжетімді бөлмелер', en: 'Available Rooms' },
  createNewRoom: { ru: 'Создать новую комнату', kz: 'Жаңа бөлме жасау', en: 'Create New Room' },

  // ===== Rooms Module =====
  activeRooms: { ru: 'Активные комнаты', kz: 'Белсенді бөлмелер', en: 'Active Rooms' },
  pendingInvites: {
    ru: 'Ожидающие приглашения',
    kz: 'Күтіп тұрған шақырулар',
    en: 'Pending Invites',
  },
  completedRooms: { ru: 'Завершённые комнаты', kz: 'Аяқталған бөлмелер', en: 'Completed Rooms' },
  owner: { ru: 'Владелец', kz: 'Иесі', en: 'Owner' },
  member: { ru: 'Участник', kz: 'Қатысушы', en: 'Member' },
  invited: { ru: 'Приглашён', kz: 'Шақырылған', en: 'Invited' },
  createRoom: { ru: 'Создать комнату', kz: 'Бөлме жасау', en: 'Create Room' },
  chooseOperatorAndPlan: {
    ru: 'Выберите оператора и тариф для совместного использования',
    kz: 'Бірлескен пайдалану үшін оператор мен тарифті таңдаңыз',
    en: 'Choose operator and plan to share',
  },
  operator: { ru: 'Оператор', kz: 'Оператор', en: 'Operator' },
  selectOperator: { ru: 'Выберите оператора', kz: 'Операторды таңдаңыз', en: 'Select Operator' },
  plan: { ru: 'Тариф', kz: 'Тариф', en: 'Plan' },
  selectPlanFirst: {
    ru: 'Сначала выберите оператора',
    kz: 'Алдымен операторды таңдаңыз',
    en: 'Select operator first',
  },
  selectPlan: { ru: 'Выберите тариф', kz: 'Тарифті таңдаңыз', en: 'Select Plan' },
  roomSettings: { ru: 'Настройки комнаты', kz: 'Бөлме баптаулары', en: 'Room Settings' },
  roomName: { ru: 'Название комнаты', kz: 'Бөлме атауы', en: 'Room Name' },
  optionalCustomName: {
    ru: 'Опционально, например «Семья Серик»',
    kz: 'Міндетті емес, мысалы «Серік отбасы»',
    en: 'Optional, e.g. "Serik Family"',
  },
  visibility: { ru: 'Видимость', kz: 'Көрінуі', en: 'Visibility' },
  publicRoom: { ru: 'Публичная', kz: 'Ашық', en: 'Public' },
  publicRoomDesc: {
    ru: 'Любой может найти и присоединиться',
    kz: 'Кез келген адам таба алады және қосыла алады',
    en: 'Anyone can find and join',
  },
  privateRoom: { ru: 'Приватная', kz: 'Жеке', en: 'Private' },
  privateRoomDesc: { ru: 'Только по приглашению', kz: 'Тек шақыру бойынша', en: 'Invite-only' },
  autoAccept: { ru: 'Автоматическое принятие', kz: 'Автоматты қабылдау', en: 'Auto-accept' },
  autoAcceptDesc: {
    ru: 'Автоматически принимать новых участников без одобрения',
    kz: 'Растаусыз жаңа қатысушыларды автоматты қабылдау',
    en: 'Automatically accept new members without approval',
  },
  cancel: { ru: 'Отмена', kz: 'Болдырмау', en: 'Cancel' },
  next: { ru: 'Далее', kz: 'Келесі', en: 'Next' },
  back: { ru: 'Назад', kz: 'Артқа', en: 'Back' },
  finish: { ru: 'Завершить', kz: 'Аяқтау', en: 'Finish' },
  reviewAndConfirm: {
    ru: 'Проверка и подтверждение',
    kz: 'Тексеру және растау',
    en: 'Review & Confirm',
  },
  reviewRoomDetails: {
    ru: 'Проверьте детали вашей комнаты перед созданием',
    kz: 'Жасамас бұрын бөлме деректерін тексеріңіз',
    en: 'Review your room details before creating',
  },
  totalCost: { ru: 'Общая стоимость', kz: 'Жалпы құны', en: 'Total Cost' },
  costPerMember: { ru: 'За участника', kz: 'Қатысушы үшін', en: 'Per Member' },
  maxMembers: { ru: 'Макс. участников', kz: 'Макс. қатысушылар', en: 'Max Members' },

  // ===== Room Detail =====
  roomDetails: { ru: 'Детали комнаты', kz: 'Бөлме деректері', en: 'Room Details' },
  members: { ru: 'Участники', kz: 'Қатысушылар', en: 'Members' },
  payments: { ru: 'Платежи', kz: 'Төлемдер', en: 'Payments' },
  activity: { ru: 'Активность', kz: 'Белсенділік', en: 'Activity' },
  inviteLink: { ru: 'Ссылка для приглашения', kz: 'Шақыру сілтемесі', en: 'Invite Link' },
  copyLink: { ru: 'Копировать ссылку', kz: 'Сілтемені көшіру', en: 'Copy Link' },
  shareRoom: { ru: 'Поделиться', kz: 'Бөлісу', en: 'Share' },
  leaveRoom: { ru: 'Покинуть комнату', kz: 'Бөлмеден шығу', en: 'Leave Room' },
  deleteRoom: { ru: 'Удалить комнату', kz: 'Бөлмені жою', en: 'Delete Room' },
  joined: { ru: 'Присоединился', kz: 'Қосылды', en: 'Joined' },
  pending: { ru: 'Ожидает', kz: 'Күтуде', en: 'Pending' },
  paid: { ru: 'Оплачено', kz: 'Төленді', en: 'Paid' },
  unpaid: { ru: 'Не оплачено', kz: 'Төленбеді', en: 'Unpaid' },
  approve: { ru: 'Одобрить', kz: 'Растау', en: 'Approve' },
  reject: { ru: 'Отклонить', kz: 'Қабылдамау', en: 'Reject' },
  remove: { ru: 'Удалить', kz: 'Жою', en: 'Remove' },
  sendReminder: { ru: 'Напомнить', kz: 'Еске салу', en: 'Send Reminder' },

  // ===== Support/Tickets =====
  tickets: { ru: 'Заявки', kz: 'Өтінімдер', en: 'Tickets' },
  myTickets: { ru: 'Мои заявки', kz: 'Менің өтінімдерім', en: 'My Tickets' },
  createNewTicket: { ru: 'Создать заявку', kz: 'Өтінім жасау', en: 'Create New Ticket' },
  ticketDetails: { ru: 'Детали заявки', kz: 'Өтінім деректері', en: 'Ticket Details' },
  subject: { ru: 'Тема', kz: 'Тақырып', en: 'Subject' },
  category: { ru: 'Категория', kz: 'Санат', en: 'Category' },
  priority: { ru: 'Приоритет', kz: 'Басымдық', en: 'Priority' },
  description: { ru: 'Описание', kz: 'Сипаттама', en: 'Description' },
  attachments: { ru: 'Вложения', kz: 'Қосымшалар', en: 'Attachments' },
  submit: { ru: 'Отправить', kz: 'Жіберу', en: 'Submit' },
  status: { ru: 'Статус', kz: 'Мәртебе', en: 'Status' },
  open: { ru: 'Открыта', kz: 'Ашық', en: 'Open' },
  inProgress: { ru: 'В работе', kz: 'Орындалуда', en: 'In Progress' },
  resolved: { ru: 'Решена', kz: 'Шешілді', en: 'Resolved' },
  closed: { ru: 'Закрыта', kz: 'Жабық', en: 'Closed' },
  low: { ru: 'Низкий', kz: 'Төмен', en: 'Low' },
  medium: { ru: 'Средний', kz: 'Орташа', en: 'Medium' },
  high: { ru: 'Высокий', kz: 'Жоғары', en: 'High' },
  urgent: { ru: 'Срочно', kz: 'Шұғыл', en: 'Urgent' },
  reply: { ru: 'Ответить', kz: 'Жауап беру', en: 'Reply' },
  closeTicket: { ru: 'Закрыть заявку', kz: 'Өтінімді жабу', en: 'Close Ticket' },
  reopenTicket: { ru: 'Открыть заново', kz: 'Қайта ашу', en: 'Reopen Ticket' },

  // ===== Payments Module =====
  checkout: { ru: 'Оформление оплаты', kz: 'Төлемді рәсімдеу', en: 'Checkout' },
  paymentMethod: { ru: 'Способ оплаты', kz: 'Төлем әдісі', en: 'Payment Method' },
  cardNumber: { ru: 'Номер карты', kz: 'Карта нөмірі', en: 'Card Number' },
  expiryDate: { ru: 'Срок действия', kz: 'Жарамдылық мерзімі', en: 'Expiry Date' },
  cvv: { ru: 'CVV', kz: 'CVV', en: 'CVV' },
  cardholderName: { ru: 'Имя держателя карты', kz: 'Карта иесінің аты', en: 'Cardholder Name' },
  saveCard: { ru: 'Сохранить карту', kz: 'Картаны сақтау', en: 'Save Card' },
  payNow: { ru: 'Оплатить', kz: 'Төлеу', en: 'Pay Now' },
  paymentConfirmation: {
    ru: 'Подтверждение оплаты',
    kz: 'Төлем растамасы',
    en: 'Payment Confirmation',
  },
  paymentSuccessful: { ru: 'Оплата успешна', kz: 'Төлем сәтті', en: 'Payment Successful' },
  paymentPending: { ru: 'Ожидание оплаты', kz: 'Төлемді күту', en: 'Payment Pending' },
  transactionId: { ru: 'ID транзакции', kz: 'Транзакция ID', en: 'Transaction ID' },
  amount: { ru: 'Сумма', kz: 'Сома', en: 'Amount' },
  date: { ru: 'Дата', kz: 'Күні', en: 'Date' },
  downloadReceipt: { ru: 'Скачать чек', kz: 'Чекті жүктеу', en: 'Download Receipt' },
  refundStatus: { ru: 'Статус возврата', kz: 'Қайтару мәртебесі', en: 'Refund Status' },
  refundRequested: {
    ru: 'Возврат запрошен',
    kz: 'Қайтаруға өтінім берілді',
    en: 'Refund Requested',
  },
  refundApproved: { ru: 'Возврат одобрен', kz: 'Қайтару расталды', en: 'Refund Approved' },
  refundProcessing: {
    ru: 'Возврат обрабатывается',
    kz: 'Қайтару өңделуде',
    en: 'Refund Processing',
  },
  refundCompleted: { ru: 'Возврат завершён', kz: 'Қайтару аяқталды', en: 'Refund Completed' },
  ownerPayout: { ru: 'Выплата владельцу', kz: 'Иеге төлем', en: 'Owner Payout' },
  payoutHistory: { ru: 'История выплат', kz: 'Төлем тарихы', en: 'Payout History' },
  requestPayout: { ru: 'Запросить выплату', kz: 'Төлемге өтінім беру', en: 'Request Payout' },

  // ===== Profile =====
  myProfile: { ru: 'Мой профиль', kz: 'Менің профилім', en: 'My Profile' },
  editProfile: { ru: 'Редактировать', kz: 'Өңдеу', en: 'Edit Profile' },
  reputation: { ru: 'Репутация', kz: 'Беделі', en: 'Reputation' },
  reviews: { ru: 'Отзывы', kz: 'Пікірлер', en: 'Reviews' },
  verified: { ru: 'Верифицирован', kz: 'Расталған', en: 'Verified' },
  notVerified: { ru: 'Не верифицирован', kz: 'Расталмаған', en: 'Not Verified' },
  verifyAccount: { ru: 'Верифицировать аккаунт', kz: 'Тіркелгіні растау', en: 'Verify Account' },
  phoneNumber: { ru: 'Телефон', kz: 'Телефон', en: 'Phone Number' },
  language: { ru: 'Язык', kz: 'Тіл', en: 'Language' },
  notifications: { ru: 'Уведомления', kz: 'Хабарландырулар', en: 'Notifications' },
  security: { ru: 'Безопасность', kz: 'Қауіпсіздік', en: 'Security' },
  changePassword: { ru: 'Изменить пароль', kz: 'Құпия сөзді өзгерту', en: 'Change Password' },
  deleteAccount: { ru: 'Удалить аккаунт', kz: 'Тіркелгіні жою', en: 'Delete Account' },
  save: { ru: 'Сохранить', kz: 'Сақтау', en: 'Save' },

  // ===== Admin Portal =====
  adminDashboard: { ru: 'Панель администратора', kz: 'Әкімші панелі', en: 'Admin Dashboard' },
  moderationQueue: { ru: 'Очередь модерации', kz: 'Модерация кезегі', en: 'Moderation Queue' },
  users: { ru: 'Пользователи', kz: 'Пайдаланушылар', en: 'Users' },
  rooms: { ru: 'Комнаты', kz: 'Бөлмелер', en: 'Rooms' },
  disputes: { ru: 'Споры', kz: 'Дау-дамайлар', en: 'Disputes' },
  refunds: { ru: 'Возвраты', kz: 'Қайтарулар', en: 'Refunds' },
  analytics: { ru: 'Аналитика', kz: 'Аналитика', en: 'Analytics' },
  logs: { ru: 'Логи', kz: 'Логтар', en: 'Logs' },
  totalUsers: { ru: 'Всего пользователей', kz: 'Барлық пайдаланушылар', en: 'Total Users' },
  activeRoomsCount: { ru: 'Активные комнаты', kz: 'Белсенді бөлмелер', en: 'Active Rooms' },
  totalRevenue: { ru: 'Общий доход', kz: 'Жалпы табыс', en: 'Total Revenue' },
  pendingTickets: { ru: 'Ожидающие заявки', kz: 'Күтіп тұрған өтінімдер', en: 'Pending Tickets' },
  banUser: { ru: 'Заблокировать', kz: 'Бұғаттау', en: 'Ban User' },
  unbanUser: { ru: 'Разблокировать', kz: 'Бұғаттан шығару', en: 'Unban User' },
  viewDetails: { ru: 'Подробнее', kz: 'Толығырақ', en: 'View Details' },

  // ===== Digital Subscriptions =====
  digitalSubscriptionsAvailable: {
    ru: 'Цифровые подписки — Доступно',
    kz: 'Цифрлық жазылымдар — Қолжетімді',
    en: 'Digital Subscriptions — Available',
  },
  shareDigitalServices: {
    ru: 'Делитесь премиум-сервисами',
    kz: 'Премиум қызметтерді бөлісіңіз',
    en: 'Share premium services',
  },
  googleOneFamily: {
    ru: 'Google One Семейная',
    kz: 'Google One Отбасылық',
    en: 'Google One Family',
  },
  appleOne: { ru: 'Apple One', kz: 'Apple One', en: 'Apple One' },
  yandexPlus: { ru: 'Яндекс Плюс', kz: 'Яндекс Плюс', en: 'Yandex Plus' },
  yandexDisk: { ru: 'Яндекс Диск', kz: 'Яндекс Диск', en: 'Yandex Disk' },
  storage: { ru: 'Хранилище', kz: 'Сақтау орны', en: 'Storage' },
  familySharing: { ru: 'Семейный доступ', kz: 'Отбасылық қатынас', en: 'Family Sharing' },

  // ===== Static Pages =====
  aboutEcoPay: { ru: 'Об EcoPay', kz: 'EcoPay туралы', en: 'About EcoPay' },
  ourMission: { ru: 'Наша миссия', kz: 'Біздің миссия', en: 'Our Mission' },
  aboutSubtitle: {
    ru: 'Надёжная платформа Казахстана для совместных тарифов связи',
    kz: 'Қазақстанның сенімді платформасы — бірлескен байланыс тарифтері үшін',
    en: "Kazakhstan's trusted platform for shared telecom plans",
  },
  missionText: {
    ru: 'EcoPay делает семейные тарифы операторов связи доступными для всех в Казахстане. Присоединяйтесь к общей комнате, разделяйте оплату и экономьте до 70% от ежемесячного счёта — без контрактов и лишних хлопот.',
    kz: 'EcoPay Қазақстандағы отбасылық тарифтерді барлығына қолжетімді етеді. Ортақ бөлмеге қосылып, төлемді бөлісіп, ай сайынғы төлемнен 70%-ға дейін үнемдеңіз — келісімшарттар мен қиындықтар жоқ.',
    en: 'EcoPay makes telecom family plans accessible to everyone in Kazakhstan. Join a shared room, split the cost, and save up to 70% on your monthly bill — no contracts, no hassle.',
  },
  trustPrivacyTitle: {
    ru: 'Доверие и приватность прежде всего',
    kz: 'Сенімділік және құпиялылық бірінші орында',
    en: 'Trust & Privacy First',
  },
  trustPrivacyText: {
    ru: 'Ваша личная информация никогда не передаётся между пользователями. Все транзакции защищены, а общение происходит через нашу службу поддержки — без прямого контакта между пользователями.',
    kz: 'Жеке ақпаратыңыз пайдаланушылар арасында бөлінбейді. Барлық транзакциялар қорғалған, ал барлық байланыс біздің қолдау қызметі арқылы жүреді — пайдаланушылар арасында тікелей контакт жоқ.',
    en: 'Your personal information is never shared between users. All transactions are secure, and all communication happens through our support system — no direct user-to-user contact.',
  },
  bulletVerifiedPayments: {
    ru: 'Проверенная обработка платежей',
    kz: 'Тексерілген төлемдерді өңдеу',
    en: 'Verified payment processing',
  },
  bulletNoPersonalContact: {
    ru: 'Личные контактные данные не передаются',
    kz: 'Жеке байланыс мәліметтері бөліспейді',
    en: 'No personal contact details shared',
  },
  bulletSupportOnly: {
    ru: 'Модель общения через поддержку',
    kz: 'Тек қолдау арқылы байланыс моделі',
    en: 'Support-only communication model',
  },
  howWeHelpTitle: { ru: 'Как мы помогаем', kz: 'Біз қалай көмектесеміз', en: 'How We Help' },
  howWeHelpText: {
    ru: 'Мы соединяем людей, желающих разделить семейные тарифы ведущих операторов Казахстана: Beeline, Activ, Altel, Tele2 и Kcell. Наша платформа обеспечивает обработку платежей, верификацию и поддержку, чтобы вы могли сосредоточиться на экономии.',
    kz: 'Біз Қазақстанның негізгі операторлары — Beeline, Activ, Altel, Tele2 және Kcell — бойынша отбасылық тарифтерді бөлісуді қалайтын адамдарды біріктіреміз. Біздің платформа төлемдерді, тексеруді және қолдауды қамтамасыз етеді, сонда сіз үнемдеуге назар аударасыз.',
    en: "We connect people who want to share family plans from Kazakhstan's major telecom operators: Beeline, Activ, Altel, Tele2, and Kcell. Our platform handles payments, verification, and support so you can focus on savings.",
  },
  contactGetInTouch: { ru: 'Связаться с нами', kz: 'Бізбен байланысыңыз', en: 'Get in Touch' },
  contactPhoneNote: {
    ru: '(Деловой контакт, может измениться до запуска)',
    kz: '(Іскерлік байланыс, іске қосылғанға дейін өзгеруі мүмкін)',
    en: '(Business contact, subject to change before launch)',
  },
  contactPhoneNumber: { ru: '+7 747 226 6885', kz: '+7 747 226 6885', en: '+7 747 226 6885' },
  contactEmail: { ru: 'support@ecopay.kz', kz: 'support@ecopay.kz', en: 'support@ecopay.kz' },
  contactLocation: { ru: 'Алматы, Казахстан', kz: 'Алматы, Қазақстан', en: 'Almaty, Kazakhstan' },
  buildingTrust: {
    ru: 'Создаём доверие с помощью технологий',
    kz: 'Технология арқылы сенімділікті құру',
    en: 'Building trust through technology',
  },
  howItWorksTitle: { ru: 'Как это работает', kz: 'Қалай жұмыс істейді', en: 'How It Works' },
  termsOfService: { ru: 'Условия использования', kz: 'Пайдалану шарттары', en: 'Terms of Service' },
  privacyPolicy: {
    ru: 'Политика конфиденциальности',
    kz: 'Құпиялылық саясаты',
    en: 'Privacy Policy',
  },
  lastUpdated: { ru: 'Обновлено', kz: 'Жаңартылды', en: 'Last Updated' },

  // ===== Common UI Elements =====
  loading: { ru: 'Загрузка...', kz: 'Жүктеу...', en: 'Loading...' },
  error: { ru: 'Ошибка', kz: 'Қате', en: 'Error' },
  success: { ru: 'Успешно', kz: 'Сәтті', en: 'Success' },
  warning: { ru: 'Предупреждение', kz: 'Ескерту', en: 'Warning' },
  info: { ru: 'Информация', kz: 'Ақпарат', en: 'Info' },
  confirm: { ru: 'Подтвердить', kz: 'Растау', en: 'Confirm' },
  delete: { ru: 'Удалить', kz: 'Жою', en: 'Delete' },
  edit: { ru: 'Редактировать', kz: 'Өңдеу', en: 'Edit' },
  close: { ru: 'Закрыть', kz: 'Жабу', en: 'Close' },
  search: { ru: 'Поиск', kz: 'Іздеу', en: 'Search' },
  filter: { ru: 'Фильтр', kz: 'Сүзгі', en: 'Filter' },
  sort: { ru: 'Сортировка', kz: 'Сұрыптау', en: 'Sort' },
  reset: { ru: 'Сбросить', kz: 'Қалпына келтіру', en: 'Reset' },
  apply: { ru: 'Применить', kz: 'Қолдану', en: 'Apply' },
  export: { ru: 'Экспорт', kz: 'Экспорт', en: 'Export' },
  import: { ru: 'Импорт', kz: 'Импорт', en: 'Import' },
  download: { ru: 'Скачать', kz: 'Жүктеу', en: 'Download' },
  upload: { ru: 'Загрузить', kz: 'Жүктеп салу', en: 'Upload' },
  share: { ru: 'Поделиться', kz: 'Бөлісу', en: 'Share' },
  copy: { ru: 'Копировать', kz: 'Көшіру', en: 'Copy' },
  copied: { ru: 'Скопировано', kz: 'Көшірілді', en: 'Copied' },
  more: { ru: 'Ещё', kz: 'Тағы', en: 'More' },
  less: { ru: 'Меньше', kz: 'Азырақ', en: 'Less' },
  all: { ru: 'Все', kz: 'Барлығы', en: 'All' },
  none: { ru: 'Нет', kz: 'Жоқ', en: 'None' },
  yes: { ru: 'Да', kz: 'Иә', en: 'Yes' },
  no: { ru: 'Нет', kz: 'Жоқ', en: 'No' },
  required: { ru: 'Обязательно', kz: 'Міндетті', en: 'Required' },
  optional: { ru: 'Опционально', kz: 'Міндетті емес', en: 'Optional' },
  na: { ru: 'Н/Д', kz: 'Қ/Ж', en: 'N/A' },

  // ===== Time & Dates =====
  today: { ru: 'Сегодня', kz: 'Бүгін', en: 'Today' },
  tomorrow: { ru: 'Завтра', kz: 'Ертең', en: 'Tomorrow' },
  thisWeek: { ru: 'На этой неделе', kz: 'Осы аптада', en: 'This Week' },
  thisMonth: { ru: 'В этом месяце', kz: 'Осы айда', en: 'This Month' },
  thisYear: { ru: 'В этом году', kz: 'Биыл', en: 'This Year' },

  // ===== Validation Messages =====
  invalidEmail: { ru: 'Неверный email', kz: 'Дұрыс емес email', en: 'Invalid email' },
  passwordTooShort: {
    ru: 'Пароль слишком короткий',
    kz: 'Құпия сөз тым қысқа',
    en: 'Password too short',
  },
  passwordsDoNotMatch: {
    ru: 'Пароли не совпадают',
    kz: 'Құпия сөздер сәйкес келмейді',
    en: 'Passwords do not match',
  },

  // ===== Empty States =====
  noRoomsYet: { ru: 'Пока нет комнат', kz: 'Әлі бөлмелер жоқ', en: 'No rooms yet' },
  noTicketsYet: { ru: 'Пока нет заявок', kz: 'Әлі өтінімдер жоқ', en: 'No tickets yet' },
  noResultsFound: {
    ru: 'Результаты не найдены',
    kz: 'Нәтижелер табылмады',
    en: 'No results found',
  },
  noDataAvailable: { ru: 'Нет данных', kz: 'Деректер жоқ', en: 'No data available' },

  // ===== Reputation & Reviews =====
  reputationScore: { ru: 'Репутация', kz: 'Беделі', en: 'Reputation Score' },
  rating: { ru: 'Рейтинг', kz: 'Рейтинг', en: 'Rating' },
  averageRating: { ru: 'Средний рейтинг', kz: 'Орташа рейтинг', en: 'Average Rating' },
  roomsCreated: { ru: 'Создано комнат', kz: 'Жасалған бөлмелер', en: 'Rooms Created' },
  roomsJoined: { ru: 'Присоединился к комнатам', kz: 'Қосылған бөлмелер', en: 'Rooms Joined' },
  successfulPeriods: { ru: 'Успешные периоды', kz: 'Сәтті кезеңдер', en: 'Successful Periods' },
  completedPeriods: {
    ru: 'Завершённые периоды',
    kz: 'Аяқталған кезеңдер',
    en: 'Completed Periods',
  },
  recentRooms: { ru: 'Недавние комнаты', kz: 'Соңғы бөлмелер', en: 'Recent Rooms' },
  reviewsTitle: { ru: 'Отзывы', kz: 'Пікірлер', en: 'Reviews' },
  allReviews: { ru: 'Все', kz: 'Барлығы', en: 'All' },
  positiveReviews: { ru: 'Положительные', kz: 'Оң', en: 'Positive' },
  negativeReviews: { ru: 'Отрицательные', kz: 'Теріс', en: 'Negative' },
  recentReviews: { ru: 'Недавние', kz: 'Соңғы', en: 'Recent' },
  leaveReview: { ru: 'Оставить отзыв', kz: 'Пікір қалдыру', en: 'Leave a Review' },
  leaveAReview: { ru: 'Оставить отзыв', kz: 'Пікір қалдыру', en: 'Leave a Review' },
  writeReview: { ru: 'Написать отзыв', kz: 'Пікір жазу', en: 'Write Review' },
  reviewLocked: {
    ru: 'Вы можете оставить отзыв только после того, как вы поделились комнатой и период завершён.',
    kz: 'Пікір қалдыру үшін бөлмені бөлісіп, кезең аяқталуы керек.',
    en: 'You can review only after you shared a room and the period is completed.',
  },
  reviewEligibilityTitle: {
    ru: 'Кто может оставлять отзывы',
    kz: 'Кім пікір қалдыра алады',
    en: 'Who Can Leave Reviews',
  },
  reviewEligibilityDesc: {
    ru: 'Только участники из одной комнаты могут оставлять отзывы.',
    kz: 'Тек бір бөлмедегі қатысушылар пікір қалдыра алады.',
    en: 'Only participants from the same room can review.',
  },
  selectCompletedRoom: {
    ru: 'Выберите завершённую комнату',
    kz: 'Аяқталған бөлмені таңдаңыз',
    en: 'Select a completed room',
  },
  yourRating: { ru: 'Ваша оценка', kz: 'Сіздің бағаңыз', en: 'Your Rating' },
  reviewText: { ru: 'Текст отзыва', kz: 'Пікір мәтіні', en: 'Review Text' },
  reviewTextPlaceholder: {
    ru: 'Опишите ваш опыт совместного использования...',
    kz: 'Бірлескен пайдалану тәжірибеңізді сипаттаңыз...',
    en: 'Describe your sharing experience...',
  },
  submitReview: { ru: 'Отправить отзыв', kz: 'Пікір жіберу', en: 'Submit Review' },
  reviewSubmitted: { ru: 'Отзыв отправлен', kz: 'Пікір жіберілді', en: 'Review Submitted' },
  thankYouForReview: {
    ru: 'Спасибо за ваш отзыв!',
    kz: 'Пікіріңіз үшін рахмет!',
    en: 'Thank you for your review!',
  },
  reputationExplanation: {
    ru: 'Объяснение репутации',
    kz: 'Беделді түсіндіру',
    en: 'Reputation Explanation',
  },
  reputationFactors: { ru: 'Факторы репутации', kz: 'Беделі факторлары', en: 'Reputation Factors' },
  reputationFactorsDesc: {
    ru: 'Репутация рассчитывается на основе:',
    kz: 'Беделі мына негізде есептеледі:',
    en: 'Reputation is calculated based on:',
  },
  factorAverageRating: {
    ru: 'Средний рейтинг от отзывов',
    kz: 'Пікірлердің орташа рейтингі',
    en: 'Average rating from reviews',
  },
  factorCompletedPeriods: {
    ru: 'Количество завершённых периодов',
    kz: 'Аяқталған кезеңдер саны',
    en: 'Number of completed periods',
  },
  factorDisputes: {
    ru: 'Споры и жалобы',
    kz: 'Дау-дамайлар және шағымдар',
    en: 'Disputes and complaints',
  },
  factorViolations: {
    ru: 'Подтверждённые нарушения',
    kz: 'Расталған бұзушылықтар',
    en: 'Confirmed violations',
  },
  reputationLevel: { ru: 'Уровень репутации', kz: 'Бедел деңгейі', en: 'Reputation level' },
  repLevelNewcomer: { ru: 'Новичок', kz: 'Жаңадан келген', en: 'Newcomer' },
  repLevelBronze: { ru: 'Бронза', kz: 'Қола', en: 'Bronze' },
  repLevelSilver: { ru: 'Серебро', kz: 'Күміс', en: 'Silver' },
  repLevelGold: { ru: 'Золото', kz: 'Алтын', en: 'Gold' },
  repLevelPlatinum: { ru: 'Платина', kz: 'Платина', en: 'Platinum' },
  repPointsToNext: { ru: 'очк. до уровня', kz: 'ұпай келесі деңгейге', en: 'pts to' },
  repMaxLevel: { ru: 'Максимальный уровень', kz: 'Ең жоғары деңгей', en: 'Top level reached' },
  reportedByAdmin: {
    ru: 'Сообщено администратором',
    kz: 'Әкімші хабарлаған',
    en: 'Reported by Admin',
  },
  hiddenByAdmin: { ru: 'Скрыто администратором', kz: 'Әкімші жасырған', en: 'Hidden by Admin' },
  moderatedReview: {
    ru: 'Модерированный отзыв',
    kz: 'Модерацияланған пікір',
    en: 'Moderated Review',
  },
  reviewModeratedNote: {
    ru: 'Этот отзыв был скрыт модераторами за нарушение правил.',
    kz: 'Бұл пікір ережелерді бұзғаны үшін модераторлар жасырды.',
    en: 'This review was hidden by moderators for violating rules.',
  },
  noReviewsYet: { ru: 'Пока нет отзывов', kz: 'Әлі пікірлер жоқ', en: 'No reviews yet' },
  beTheFirst: {
    ru: 'Станьте первым, кто оставит отзыв',
    kz: 'Пікір қалдырған бірінші адам болыңыз',
    en: 'Be the first to leave a review',
  },
  starsOutOfFive: { ru: 'из 5', kz: '5-тен', en: 'out of 5' },
  basedOnReviews: {
    ru: 'на основе {{count}} отзывов',
    kz: '{{count}} пікір негізінде',
    en: 'based on {{count}} reviews',
  },
  memberSince: { ru: 'Участник с', kz: 'Қатысушы', en: 'Member since' },
  lastActive: { ru: 'Был в сети', kz: 'Соңғы белсенділік', en: 'Last active' },
  publicProfile: { ru: 'Публичный профиль', kz: 'Ашық профиль', en: 'Public Profile' },
  viewingProfile: { ru: 'Просмотр профиля', kz: 'Профильді көру', en: 'Viewing Profile' },
  stars: { ru: 'звёзд', kz: 'жұлдыз', en: 'stars' },
  star: { ru: 'звезда', kz: 'жұлдыз', en: 'star' },
  clickToRate: { ru: 'Нажмите, чтобы оценить', kz: 'Бағалау үшін басыңыз', en: 'Click to rate' },
  room: { ru: 'Комната', kz: 'Бөлме', en: 'Room' },
  period: { ru: 'Период', kz: 'Кезең', en: 'Period' },
  ago: { ru: 'назад', kz: 'бұрын', en: 'ago' },
  daysAgo: { ru: '{{count}} дней назад', kz: '{{count}} күн бұрын', en: '{{count}} days ago' },
  monthsAgo: {
    ru: '{{count}} месяцев назад',
    kz: '{{count}} ай бұрын',
    en: '{{count}} months ago',
  },
  yearsAgo: { ru: '{{count}} лет назад', kz: '{{count}} жыл бұрын', en: '{{count}} years ago' },
  helpful: { ru: 'Полезно', kz: 'Пайдалы', en: 'Helpful' },
  report: { ru: 'Пожаловаться', kz: 'Шағымдану', en: 'Report' },
  reported: { ru: 'Отмечено', kz: 'Белгіленген', en: 'Reported' },

  // ===== States, SLA & Edge Cases (Page 09) =====
  statesSlaTitle: {
    ru: 'Состояния, SLA и крайние случаи',
    kz: 'Күйлер, SLA және шекті жағдайлар',
    en: 'States, SLA & Edge Cases',
  },
  statesSlaSubtitle: {
    ru: 'Карта переходов состояний, SLA-таймеры и поведение UI в исключительных сценариях',
    kz: 'Күй ауысуларының картасы, SLA-таймерлер және ерекше сценарийлердегі UI мінез-құлқы',
    en: 'State transition maps, SLA timers, and UI behavior for exceptional scenarios',
  },
  roomStates: { ru: 'Состояния комнаты', kz: 'Бөлме күйлері', en: 'Room States' },
  memberStates: { ru: 'Состояния участника', kz: 'Қатысушы күйлері', en: 'Member States' },
  slaPanels: { ru: 'SLA-панели', kz: 'SLA-панельдер', en: 'SLA Panels' },
  edgeCases: { ru: 'Крайние случаи', kz: 'Шекті жағдайлар', en: 'Edge Cases' },
  stateOpen: { ru: 'Открыта', kz: 'Ашық', en: 'Open' },
  stateInVerification: { ru: 'На верификации', kz: 'Тексеруде', en: 'In Verification' },
  stateActive: { ru: 'Активна', kz: 'Белсенді', en: 'Active' },
  stateCompleted: { ru: 'Завершена', kz: 'Аяқталған', en: 'Completed' },
  stateCancelled: { ru: 'Отменена', kz: 'Бас тартылды', en: 'Cancelled' },
  stateBlocked: { ru: 'Заблокирована', kz: 'Бұғатталған', en: 'Blocked' },
  stateApplied: { ru: 'Подана заявка', kz: 'Өтінім берілді', en: 'Applied' },
  statePending: { ru: 'Ожидание', kz: 'Күтуде', en: 'Pending' },
  stateRejected: { ru: 'Отклонена', kz: 'Қабылданбады', en: 'Rejected' },
  stateCancelledBeforePayment: {
    ru: 'Отменена до оплаты',
    kz: 'Төлемге дейін болдырмау',
    en: 'Cancelled Before Payment',
  },
  allowedActions: { ru: 'Доступные действия', kz: 'Қолжетімді әрекеттер', en: 'Allowed Actions' },
  primaryCta: { ru: 'Основная кнопка', kz: 'Негізгі батырма', en: 'Primary CTA' },
  whatUserSees: { ru: 'Что видит пользователь', kz: 'Пайдаланушы не көреді', en: 'What User Sees' },
  transitionsTo: { ru: 'Переходы', kz: 'Ауысулар', en: 'Transitions' },
  roomOpenDesc: {
    ru: 'Комната создана, ожидает участников. Владелец может редактировать, делиться ссылкой.',
    kz: 'Бөлме жасалды, қатысушыларды күтуде. Иесі өңдей алады, сілтемені бөлісе алады.',
    en: 'Room created, awaiting members. Owner can edit, share invite link.',
  },
  roomVerifDesc: {
    ru: 'Все слоты заполнены. Владелец подтверждает доступ каждому участнику.',
    kz: 'Барлық слоттар толды. Иесі әр қатысушыға қатынасты растайды.',
    en: 'All slots filled. Owner confirms access for each member.',
  },
  roomActiveDesc: {
    ru: 'Все участники подтверждены, платежи проводятся. Нормальная работа комнаты.',
    kz: 'Барлық қатысушылар расталды, төлемдер жүргізілуде. Бөлменің қалыпты жұмысы.',
    en: 'All members confirmed, payments processing. Room operating normally.',
  },
  roomCompletedDesc: {
    ru: 'Срок действия истёк или владелец закрыл комнату. Отзывы доступны.',
    kz: 'Мерзімі біткен немесе иесі бөлмені жапты. Пікірлер қолжетімді.',
    en: 'Plan expired or owner closed room. Reviews available.',
  },
  roomCancelledDesc: {
    ru: 'Владелец отменил комнату до завершения верификации. Возвраты инициированы.',
    kz: 'Иесі тексеру аяқталмай тұрып бөлмеден бас тартты. Қайтарулар басталды.',
    en: 'Owner cancelled room before verification completed. Refunds initiated.',
  },
  roomBlockedDesc: {
    ru: 'Администратор заблокировал комнату. Все действия приостановлены, расследование.',
    kz: 'Әкімші бөлмені бұғаттады. Барлық әрекеттер тоқтатылды, тексеру.',
    en: 'Admin blocked room. All actions suspended, investigation ongoing.',
  },
  memberAppliedDesc: {
    ru: 'Пользователь подал заявку на вступление. Ожидает одобрения владельца.',
    kz: 'Пайдаланушы кіру өтінімін берді. Иесінің мақұлдауын күтуде.',
    en: 'User submitted join request. Awaiting owner approval.',
  },
  memberPendingDesc: {
    ru: 'Заявка одобрена. Ожидание оплаты и предоставления доступа.',
    kz: 'Өтінім мақұлданды. Төлемді және қатынас беруді күтуде.',
    en: 'Application approved. Awaiting payment and access provision.',
  },
  memberActiveDesc: {
    ru: 'Доступ подтверждён, платежи активны. Полноценный участник комнаты.',
    kz: 'Қатынас расталды, төлемдер белсенді. Бөлменің толыққанды қатысушысы.',
    en: 'Access confirmed, payments active. Full room member.',
  },
  memberRejectedDesc: {
    ru: 'Владелец отклонил заявку. Пользователь может подать повторно.',
    kz: 'Иесі өтінімді қабылдамады. Пайдаланушы қайта бере алады.',
    en: 'Owner rejected application. User can reapply.',
  },
  memberBlockedDesc: {
    ru: 'Участник заблокирован за нарушения. Доступ отозван.',
    kz: 'Қатысушы бұзушылықтар үшін бұғатталды. Қатынас алынды.',
    en: 'Member blocked for violations. Access revoked.',
  },
  memberCancelledPayDesc: {
    ru: 'Участник отменил до оплаты. Слот освобождён.',
    kz: 'Қатысушы төлемге дейін болдырды. Слот босатылды.',
    en: 'Member cancelled before payment. Slot freed.',
  },
  slotsRule: {
    ru: 'Правило: учитываются только PENDING + ACTIVE',
    kz: 'Ереже: тек PENDING + ACTIVE есептеледі',
    en: 'Rule: only PENDING + ACTIVE count',
  },
  joinClosedAfterStart: {
    ru: 'Вступление закрыто после даты старта',
    kz: 'Басталу күнінен кейін кіру жабық',
    en: 'Join closed after start date',
  },
  postPaymentAdminOnly: {
    ru: 'Изменения после оплаты — только через админа',
    kz: 'Төлемнен кейінгі өзгерістер — тек әкімші арқылы',
    en: 'Post-payment changes — admin only',
  },
  slaWaitingAccess: {
    ru: 'Ожидание предоставления доступа',
    kz: 'Қатынас беруді күту',
    en: 'Waiting for access grant',
  },
  slaNormal: { ru: 'Нормальный', kz: 'Қалыпты', en: 'Normal' },
  slaWarning: { ru: 'Предупреждение', kz: 'Ескерту', en: 'Warning' },
  slaBreached: { ru: 'Нарушен', kz: 'Бұзылған', en: 'Breached' },
  slaTimeRemaining: { ru: 'Осталось времени', kz: 'Қалған уақыт', en: 'Time remaining' },
  slaOwnerMustGrant: {
    ru: 'Владелец должен предоставить доступ участнику',
    kz: 'Иесі қатысушыға қатынас беруі керек',
    en: 'Owner must grant access to member',
  },
  slaConfirmAccess: {
    ru: 'Подтвердите получение доступа',
    kz: 'Қатынас алғаныңызды растаңыз',
    en: 'Confirm access received',
  },
  slaMemberConfirmDeadline: {
    ru: 'Дедлайн подтверждения участником',
    kz: 'Қатысушының растау мерзімі',
    en: 'Member confirmation deadline',
  },
  slaMemberMustConfirm: {
    ru: 'Участник должен подтвердить получение доступа к тарифу',
    kz: 'Қатысушы тарифке қатынас алғанын растауы керек',
    en: 'Member must confirm plan access was received',
  },
  slaAutoTicketCreated: {
    ru: 'Заявка создана автоматически',
    kz: 'Өтінім автоматты жасалды',
    en: 'Ticket created automatically',
  },
  slaAutoTicketDesc: {
    ru: 'SLA нарушен — заявка в поддержку создана автоматически. Одна заявка на участника.',
    kz: 'SLA бұзылды — қолдау өтінімі автоматты жасалды. Қатысушыға бір өтінім.',
    en: 'SLA breached — support ticket auto-created. One per membership.',
  },
  slaAutoDisputeCreated: {
    ru: 'Спор создан автоматически',
    kz: 'Дау автоматты жасалды',
    en: 'Dispute created automatically',
  },
  edgePaymentNoAccess: {
    ru: 'Оплата прошла, доступ не предоставлен',
    kz: 'Төлем өтті, қатынас берілмеді',
    en: 'Payment OK, access not granted',
  },
  edgePaymentNoAccessDesc: {
    ru: 'Оплата успешна, но владелец не предоставил доступ в SLA. Авто-заявка + флаг модерации.',
    kz: 'Төлем сәтті, бірақ иесі SLA ішінде қатынас бермеді. Авто-өтінім + модерация белгісі.',
    en: "Payment successful but owner didn't grant access within SLA. Auto-ticket + admin flag.",
  },
  edgeMemberNoConfirm: {
    ru: 'Участник не подтвердил доступ',
    kz: 'Қатысушы қатынасты растамады',
    en: "Member didn't confirm access",
  },
  edgeMemberNoConfirmDesc: {
    ru: 'Владелец утверждает, что дал доступ, но участник не подтвердил в T_confirm. Спор создан.',
    kz: 'Иесі қатынас бергенін мәлімдейді, бірақ қатысушы T_confirm ішінде растамады. Дау жасалды.',
    en: "Owner claims access granted but member didn't confirm within T_confirm. Dispute created.",
  },
  edgeRoomBlockedMidVerif: {
    ru: 'Блокировка в процессе верификации',
    kz: 'Тексеру кезінде бұғаттау',
    en: 'Blocked mid-verification',
  },
  edgeRoomBlockedMidVerifDesc: {
    ru: 'Админ заблокировал комнату при верификации. Участники уведомлены, платежи заморожены.',
    kz: 'Әкімші тексеру кезінде бөлмені бұғаттады. Қатысушылар хабарландырылды, төлемдер тоқтатылды.',
    en: 'Admin blocked room during verification. Members notified, payments frozen.',
  },
  edgeRefundInitiated: {
    ru: 'Возврат инициирован',
    kz: 'Қайтару басталды',
    en: 'Refund initiated',
  },
  edgeRefundInitiatedDesc: {
    ru: 'Возврат запущен. Статус в платёжном профиле, таймлайн обновлён.',
    kz: 'Қайтару іске қосылды. Төлем профилінде мәртебе, уақыт шкаласы жаңартылды.',
    en: 'Refund started. Status in payment profile, timeline updated.',
  },
  edgeRiskFlags: {
    ru: 'Флаги риска сработали',
    kz: 'Тәуекел белгілері іске қосылды',
    en: 'Risk flags triggered',
  },
  edgeRiskFlagsDesc: {
    ru: 'Подозрительная активность. Комната на модерации с пояснением для участников.',
    kz: 'Күдікті белсенділік. Бөлме модерацияда, қатысушыларға түсіндірмемен.',
    en: 'Suspicious activity detected. Room in moderation with explanation for members.',
  },
  requiresAdminReview: {
    ru: 'Требуется проверка админа',
    kz: 'Әкімші тексеруін қажет етеді',
    en: 'Requires admin review',
  },
  moderationExplanation: {
    ru: 'Пояснение модерации',
    kz: 'Модерация түсіндірмесі',
    en: 'Moderation explanation',
  },
  autoSupportTicket: {
    ru: 'Авто-заявка в поддержку',
    kz: 'Авто-қолдау өтінімі',
    en: 'Auto support ticket',
  },
  adminReviewFlag: { ru: 'Флаг модерации', kz: 'Модерация белгісі', en: 'Admin review flag' },
  paymentsFrozen: { ru: 'Платежи заморожены', kz: 'Төлемдер тоқтатылды', en: 'Payments frozen' },
  safeNextSteps: {
    ru: 'Безопасные следующие шаги',
    kz: 'Қауіпсіз келесі қадамдар',
    en: 'Safe next steps',
  },
  waitForResolution: {
    ru: 'Дождитесь решения администратора',
    kz: 'Әкімші шешімін күтіңіз',
    en: 'Wait for admin resolution',
  },
  contactSupport: { ru: 'Связаться с поддержкой', kz: 'Қолдауға хабарласу', en: 'Contact support' },
  viewTicket: { ru: 'Посмотреть заявку', kz: 'Өтінімді қарау', en: 'View ticket' },
  idempotentNote: {
    ru: 'Одна заявка на участника (идемпотентно)',
    kz: 'Қатысушыға бір өтінім (идемпотентті)',
    en: 'One per membership (idempotent)',
  },
  accessGranted: { ru: 'Доступ предоставлен', kz: 'Қатынас берілді', en: 'Access granted' },
  confirmAccessReceived: {
    ru: 'Подтвердить получение доступа',
    kz: 'Қатынас алғанын растау',
    en: 'Confirm access received',
  },
  grantAccess: { ru: 'Предоставить доступ', kz: 'Қатынас беру', en: 'Grant access' },
  refundTimeline: { ru: 'Таймлайн возврата', kz: 'Қайтару уақыт шкаласы', en: 'Refund timeline' },
  investigationOngoing: {
    ru: 'Расследование продолжается',
    kz: 'Тексеру жалғасуда',
    en: 'Investigation ongoing',
  },
  allActionsSuspended: {
    ru: 'Все действия приостановлены',
    kz: 'Барлық әрекеттер тоқтатылды',
    en: 'All actions suspended',
  },

  // ===== Privacy & Audit Patterns (Page 10) =====
  privacyAuditTitle: {
    ru: 'Приватность и аудит',
    kz: 'Құпиялылық және аудит',
    en: 'Privacy & Audit Patterns',
  },
  privacyAuditSubtitle: {
    ru: 'Маскирование идентификаторов, раскрытие по причине, аудит-лог и правила отсутствия прямых контактов',
    kz: 'Идентификаторларды маскалау, себеп бойынша ашу, аудит-лог және тікелей байланыстардың жоқтығы ережелері',
    en: 'Identifier masking, reveal-with-reason flows, audit trails, and no-direct-contacts rules',
  },
  identifierMasking: {
    ru: 'Маскирование идентификаторов',
    kz: 'Идентификаторларды маскалау',
    en: 'Identifier Masking',
  },
  revealFlow: { ru: 'Раскрытие данных', kz: 'Деректерді ашу', en: 'Reveal Flow' },
  auditTrail: { ru: 'Аудит-лог', kz: 'Аудит-лог', en: 'Audit Trail' },
  noDirectContacts: {
    ru: 'Без прямых контактов',
    kz: 'Тікелей байланыстарсыз',
    en: 'No Direct Contacts',
  },
  phoneMasked: { ru: 'Телефон (маскирован)', kz: 'Телефон (маскаланған)', en: 'Phone (masked)' },
  contractId: { ru: 'ID контракта', kz: 'Келісімшарт ID', en: 'Contract ID' },
  contractIdMasked: {
    ru: 'ID контракта (маскирован)',
    kz: 'Келісімшарт ID (маскаланған)',
    en: 'Contract ID (masked)',
  },
  visibleToOwnerAfterPayment: {
    ru: 'Видно владельцу только после успешной оплаты',
    kz: 'Иесіне тек сәтті төлемнен кейін көрінеді',
    en: 'Visible to Owner only after payment success',
  },
  visibleToAdminOnly: {
    ru: 'Видно только администратору',
    kz: 'Тек әкімшіге көрінеді',
    en: 'Visible to admin only',
  },
  maskedDefault: {
    ru: 'По умолчанию маскирован',
    kz: 'Әдепкі бойынша маскаланған',
    en: 'Masked by default',
  },
  viewFull: { ru: 'Показать полностью', kz: 'Толық көрсету', en: 'View full' },
  revealIdentifier: {
    ru: 'Раскрыть идентификатор',
    kz: 'Идентификаторды ашу',
    en: 'Reveal Identifier',
  },
  revealReason: { ru: 'Причина раскрытия', kz: 'Ашу себебі', en: 'Reason for reveal' },
  selectReason: { ru: 'Выберите причину', kz: 'Себепті таңдаңыз', en: 'Select reason' },
  reasonVerifyIdentity: {
    ru: 'Подтверждение личности участника',
    kz: 'Қатысушы жеке басын растау',
    en: 'Verify member identity',
  },
  reasonPaymentDispute: { ru: 'Спор по платежу', kz: 'Төлем дауы', en: 'Payment dispute' },
  reasonSupportEscalation: {
    ru: 'Эскалация заявки поддержки',
    kz: 'Қолдау өтінімін күшейту',
    en: 'Support ticket escalation',
  },
  reasonComplianceCheck: {
    ru: 'Проверка соответствия',
    kz: 'Сәйкестік тексеру',
    en: 'Compliance check',
  },
  reasonAccessProvisioning: {
    ru: 'Предоставление доступа к тарифу',
    kz: 'Тарифке қатынас беру',
    en: 'Plan access provisioning',
  },
  optionalComment: {
    ru: 'Комментарий (опционально)',
    kz: 'Түсініктеме (міндетті емес)',
    en: 'Comment (optional)',
  },
  addContextComment: {
    ru: 'Добавьте контекст при необходимости...',
    kz: 'Қажет болса контекст қосыңыз...',
    en: 'Add context if needed...',
  },
  confirmReveal: { ru: 'Подтвердить и раскрыть', kz: 'Растау және ашу', en: 'Confirm & Reveal' },
  actionLogged: {
    ru: 'Действие записано в аудит-лог',
    kz: 'Әрекет аудит-логқа жазылды',
    en: 'Action logged to audit trail',
  },
  accessDenied: { ru: 'Доступ запрещён', kz: 'Қатынас тыйым салынды', en: 'Access Denied' },
  accessDeniedDesc: {
    ru: 'У вас нет прав для просмотра этих данных. Если это ошибка — обратитесь в поддержку.',
    kz: 'Сізде бұл деректерді көру құқығы жоқ. Қате болса — қолдауға хабарласыңыз.',
    en: "You don't have permission to view this data. If you believe this is an error, contact support.",
  },
  auditActor: { ru: 'Действующее лицо', kz: 'Әрекет етуші', en: 'Actor' },
  auditTimestamp: { ru: 'Время', kz: 'Уақыт', en: 'Timestamp' },
  auditReason: { ru: 'Причина', kz: 'Себеп', en: 'Reason' },
  auditEntity: { ru: 'Объект', kz: 'Нысан', en: 'Entity' },
  auditAction: { ru: 'Действие', kz: 'Әрекет', en: 'Action' },
  auditViewedPhone: {
    ru: 'Просмотрел номер телефона',
    kz: 'Телефон нөмірін көрді',
    en: 'Viewed phone number',
  },
  auditViewedContract: {
    ru: 'Просмотрел ID контракта',
    kz: 'Келісімшарт ID көрді',
    en: 'Viewed contract ID',
  },
  auditRevealedIdentifier: {
    ru: 'Раскрыл идентификатор',
    kz: 'Идентификаторды ашты',
    en: 'Revealed identifier',
  },
  auditBlockedMember: {
    ru: 'Заблокировал участника',
    kz: 'Қатысушыны бұғаттады',
    en: 'Blocked member',
  },
  auditApprovedRefund: { ru: 'Одобрил возврат', kz: 'Қайтаруды мақұлдады', en: 'Approved refund' },
  noDirectContactsTitle: {
    ru: 'Прямые контакты запрещены',
    kz: 'Тікелей байланыстарға тыйым салынған',
    en: 'Direct contacts prohibited',
  },
  noDirectContactsDesc: {
    ru: 'EcoPay не раскрывает личные данные участников друг другу. Все взаимодействия происходят через платформу.',
    kz: 'EcoPay қатысушылардың жеке деректерін бір-біріне ашпайды. Барлық өзара әрекеттер платформа арқылы жүреді.',
    en: "EcoPay does not expose members' personal data to each other. All interactions happen through the platform.",
  },
  noDirectContactsRule1: {
    ru: 'Телефоны, email и реальные имена скрыты от других участников',
    kz: 'Телефондар, email және нақты аттар басқа қатысушылардан жасырылған',
    en: 'Phone numbers, emails, and real names hidden from other members',
  },
  noDirectContactsRule2: {
    ru: 'Владелец видит маскированный телефон только после оплаты',
    kz: 'Иесі маскаланған телефонды тек төлемнен кейін көреді',
    en: 'Owner sees masked phone only after payment',
  },
  noDirectContactsRule3: {
    ru: 'Полные данные доступны только через аудитируемый запрос',
    kz: 'Толық деректер тек аудиттелетін сұрау арқылы қолжетімді',
    en: 'Full data accessible only via audited request',
  },
  noDirectContactsRule4: {
    ru: 'Нет чата между пользователями — только уведомления платформы',
    kz: 'Пайдаланушылар арасында чат жоқ — тек платформа хабарландырулары',
    en: 'No user-to-user chat — platform notifications only',
  },
  usedOn: { ru: 'Используется на', kz: 'Қолданылады', en: 'Used on' },
  roomDetailsPage: { ru: 'Детали комнаты', kz: 'Бөлме деректері', en: 'Room Details' },
  profilePage: { ru: 'Профиль', kz: 'Профиль', en: 'Profile' },
  joinFlowPage: { ru: 'Вступление в комнату', kz: 'Бөлмеге кіру', en: 'Join Flow' },
  supportPages: { ru: 'Страницы поддержки', kz: 'Қолдау беттері', en: 'Support Pages' },
  adminPanels: { ru: 'Админ-панели', kz: 'Әкімші панельдері', en: 'Admin Panels' },
  maskingPatterns: { ru: 'Паттерны маскирования', kz: 'Маскалау үлгілері', en: 'Masking Patterns' },
  fullValue: { ru: 'Полное значение', kz: 'Толық мән', en: 'Full Value' },
  maskedValue: { ru: 'Маскированное значение', kz: 'Маскаланған мән', en: 'Masked Value' },
  visibilityRule: { ru: 'Правило видимости', kz: 'Көрінуі ережесі', en: 'Visibility Rule' },
  revealRequiresReason: {
    ru: 'Раскрытие требует указания причины',
    kz: 'Ашу себепті көрсетуді қажет етеді',
    en: 'Reveal requires stating a reason',
  },
  allRevealsAudited: {
    ru: 'Все раскрытия записываются в аудит-лог',
    kz: 'Барлық ашулар аудит-логқа жазылады',
    en: 'All reveals are logged to audit trail',
  },

  // ===== Disputes & Refunds (Page 13) =====
  disputesPageTitle: {
    ru: 'Споры и возвраты',
    kz: 'Даулар мен қайтарулар',
    en: 'Disputes & Refunds',
  },
  disputesPageSubtitle: {
    ru: 'Пользовательские и административные потоки — от создания до решения',
    kz: 'Пайдаланушы және әкімші ағындары — жасаудан шешімге дейін',
    en: 'User and admin dispute workflows — from creation to resolution',
  },
  userFlows: { ru: 'Потоки пользователя', kz: 'Пайдаланушы ағындары', en: 'User Flows' },
  adminWorkspace: {
    ru: 'Рабочее пространство админа',
    kz: 'Әкімші жұмыс кеңістігі',
    en: 'Admin Workspace',
  },
  createDispute: { ru: 'Создать спор', kz: 'Дау жасау', en: 'Create Dispute' },
  disputeDetail: { ru: 'Детали спора', kz: 'Дау мәліметтері', en: 'Dispute Detail' },
  disputeTopic: { ru: 'Тема спора', kz: 'Дау тақырыбы', en: 'Dispute Topic' },
  topicNotConnected: {
    ru: 'Не подключили к тарифу',
    kz: 'Тарифке қосылмаған',
    en: 'Not connected to plan',
  },
  topicWrongTariff: {
    ru: 'Подключили не тот тариф',
    kz: 'Басқа тариф қосылған',
    en: 'Wrong tariff connected',
  },
  topicEarlyDisconnect: { ru: 'Раннее отключение', kz: 'Ерте ажырату', en: 'Early disconnect' },
  topicOther: { ru: 'Другое', kz: 'Басқа', en: 'Other' },
  selectRoom: { ru: 'Выберите комнату', kz: 'Бөлмені таңдаңыз', en: 'Select room' },
  evidenceUpload: {
    ru: 'Загрузка доказательств',
    kz: 'Дәлелдемелерді жүктеу',
    en: 'Evidence Upload',
  },
  evidenceRules: {
    ru: 'PNG, JPG или PDF, макс. 5 МБ, до 3 файлов',
    kz: 'PNG, JPG немесе PDF, макс. 5 МБ, 3 файлға дейін',
    en: 'PNG, JPG or PDF, max 5 MB, up to 3 files',
  },
  shortDescription: { ru: 'Краткое описание', kz: 'Қысқаша сипаттама', en: 'Short description' },
  shortDescriptionHint: {
    ru: 'Опишите проблему кратко (макс. 300 символов)',
    kz: 'Мәселені қысқаша сипаттаңыз (макс. 300 таңба)',
    en: 'Describe the issue briefly (max 300 chars)',
  },
  submitDispute: { ru: 'Отправить спор', kz: 'Дауды жіберу', en: 'Submit Dispute' },
  disputeSubmitted: { ru: 'Спор отправлен', kz: 'Дау жіберілді', en: 'Dispute submitted' },
  disputeOpen: { ru: 'Открыт', kz: 'Ашық', en: 'Open' },
  disputeInReview: { ru: 'На рассмотрении', kz: 'Қарастыруда', en: 'In Review' },
  disputeDecision: { ru: 'Решение принято', kz: 'Шешім қабылданды', en: 'Decision Made' },
  disputeRefundSent: { ru: 'Возврат отправлен', kz: 'Қайтару жіберілді', en: 'Refund Sent' },
  disputeRejected: { ru: 'Отклонён', kz: 'Қабылданбады', en: 'Rejected' },
  addMoreEvidence: {
    ru: 'Добавить ещё доказательства',
    kz: 'Тағы дәлелдеме қосу',
    en: 'Add more evidence',
  },
  evidenceRateLimited: {
    ru: 'Можно добавить ещё 1 раз в течение 24 ч',
    kz: '24 сағат ішінде тағы 1 рет қосуға болады',
    en: 'Can add 1 more time within 24h',
  },
  messagesLabel: { ru: 'Сообщения', kz: 'Хабарламалар', en: 'Messages' },
  onlySupportMessages: {
    ru: 'Общение только с поддержкой — не между пользователями',
    kz: 'Тек қолдаумен қарым-қатынас — пайдаланушылар арасында емес',
    en: 'Communication with support only — not between users',
  },
  disputeTriageList: { ru: 'Список споров', kz: 'Даулар тізімі', en: 'Dispute Triage List' },
  assignToMe: { ru: 'Назначить мне', kz: 'Маған тағайындау', en: 'Assign to me' },
  requestInfo: { ru: 'Запросить инфо', kz: 'Ақпарат сұрау', en: 'Request info' },
  roomSnapshot: { ru: 'Снимок комнаты', kz: 'Бөлме суреті', en: 'Room Snapshot' },
  memberSnapshot: { ru: 'Участие участника', kz: 'Қатысушы қатысуы', en: 'Member Participation' },
  evidenceViewer: {
    ru: 'Просмотр доказательств',
    kz: 'Дәлелдемелерді қарау',
    en: 'Evidence Viewer',
  },
  decisionPanel: { ru: 'Панель решения', kz: 'Шешім панелі', en: 'Decision Panel' },
  favorClaimant: {
    ru: 'В пользу заявителя',
    kz: 'Өтініш берушінің пайдасына',
    en: 'Favor claimant',
  },
  favorOwner: { ru: 'В пользу владельца', kz: 'Иесінің пайдасына', en: 'Favor owner' },
  refundFull: { ru: 'Полный возврат', kz: 'Толық қайтару', en: 'Full refund' },
  refundPartial: { ru: 'Частичный возврат', kz: 'Ішінара қайтару', en: 'Partial refund' },
  refundNone: { ru: 'Без возврата', kz: 'Қайтарусыз', en: 'No refund' },
  mandatoryComment: {
    ru: 'Обязательный комментарий',
    kz: 'Міндетті түсініктеме',
    en: 'Mandatory comment',
  },
  noDuplicateRefunds: {
    ru: 'Дубликаты возвратов невозможны (идемпотентно)',
    kz: 'Қайтарулар дубликаты мүмкін емес (идемпотентті)',
    en: 'Duplicate refunds not possible (idempotent)',
  },
  issueDecision: { ru: 'Вынести решение', kz: 'Шешім шығару', en: 'Issue Decision' },
  entryPointPending: {
    ru: 'Из экрана «Ожидание слишком долго»',
    kz: '«Тым ұзақ күту» экранынан',
    en: "From 'PENDING too long' screen",
  },
  entryPointRefund: {
    ru: 'Из экрана статуса возврата',
    kz: 'Қайтару мәртебесі экранынан',
    en: 'From Refund status screen',
  },
  disputeId: { ru: 'ID спора', kz: 'Дау ID', en: 'Dispute ID' },
  claimant: { ru: 'Заявитель', kz: 'Өтініш беруші', en: 'Claimant' },
  respondent: { ru: 'Ответчик', kz: 'Жауапкер', en: 'Respondent' },
  planDetails: { ru: 'Данные тарифа', kz: 'Тариф деректері', en: 'Plan Details' },
  paymentHistory: { ru: 'История платежей', kz: 'Төлем тарихы', en: 'Payment history' },
  joinDate: { ru: 'Дата вступления', kz: 'Кіру күні', en: 'Join date' },
  lastPayment: { ru: 'Последний платёж', kz: 'Соңғы төлем', en: 'Last payment' },
  riskLevel: { ru: 'Уровень риска', kz: 'Тәуекел деңгейі', en: 'Risk level' },
  riskHigh: { ru: 'Высокий', kz: 'Жоғары', en: 'High' },
  riskMedium: { ru: 'Средний', kz: 'Орташа', en: 'Medium' },
  riskLow: { ru: 'Низкий', kz: 'Төмен', en: 'Low' },
  uploadedBy: { ru: 'Загружено', kz: 'Жүктеген', en: 'Uploaded by' },
  dragOrClick: {
    ru: 'Перетащите или нажмите для загрузки',
    kz: 'Сүйреңіз немесе жүктеу үшін басыңыз',
    en: 'Drag or click to upload',
  },
  filesAttached: { ru: 'файлов прикреплено', kz: 'файл тіркелді', en: 'files attached' },
  decisionSummary: { ru: 'Резюме решения', kz: 'Шешім түйіні', en: 'Decision summary' },
  writeDecisionComment: {
    ru: 'Напишите обоснование решения...',
    kz: 'Шешім негіздемесін жазыңыз...',
    en: 'Write decision rationale...',
  },
  refundAmount: { ru: 'Сумма возврата', kz: 'Қайтару сомасы', en: 'Refund amount' },
  slaIndicator: { ru: 'SLA индикатор', kz: 'SLA көрсеткіші', en: 'SLA indicator' },
  assigned: { ru: 'Назначен', kz: 'Тағайындалған', en: 'Assigned' },
  unassigned: { ru: 'Не назначен', kz: 'Тағайындалмаған', en: 'Unassigned' },

  // ===== Notifications & Inbox (Page 14) =====
  notificationsTitle: { ru: 'Уведомления', kz: 'Хабарландырулар', en: 'Notifications' },
  notificationsSubtitle: {
    ru: 'Входящие уведомления, настройки каналов и библиотека шаблонов',
    kz: 'Кіріс хабарландырулар, арна параметрлері және үлгілер кітапханасы',
    en: 'In-app inbox, channel preferences, and notification template library',
  },
  notifDropdown: { ru: 'Выпадающий список', kz: 'Ашылмалы тізім', en: 'Dropdown' },
  notifCenter: { ru: 'Центр уведомлений', kz: 'Хабарландыру орталығы', en: 'Notification Center' },
  notifTemplates: {
    ru: 'Шаблоны уведомлений',
    kz: 'Хабарландыру үлгілері',
    en: 'Notification Templates',
  },
  markAllRead: {
    ru: 'Отметить все как прочитанные',
    kz: 'Барлығын оқылған деп белгілеу',
    en: 'Mark all as read',
  },
  noNotifications: { ru: 'Нет уведомлений', kz: 'Хабарландырулар жоқ', en: 'No notifications' },
  noNotificationsDesc: {
    ru: 'Когда появятся обновления, вы увидите их здесь',
    kz: 'Жаңартулар пайда болғанда, оларды мұнда көресіз',
    en: "When there are updates, you'll see them here",
  },
  allNotifs: { ru: 'Все', kz: 'Барлығы', en: 'All' },
  catRooms: { ru: 'Комнаты', kz: 'Бөлмелер', en: 'Rooms' },
  catPayments: { ru: 'Платежи', kz: 'Төлемдер', en: 'Payments' },
  catSupport: { ru: 'Поддержка', kz: 'Қолдау', en: 'Support' },
  catSecurity: { ru: 'Безопасность', kz: 'Қауіпсіздік', en: 'Security' },
  viewAll: { ru: 'Смотреть все', kz: 'Барлығын көру', en: 'View all' },
  justNow: { ru: 'Только что', kz: 'Жаңа ғана', en: 'Just now' },
  minutesAgo: { ru: 'мин назад', kz: 'мин бұрын', en: 'min ago' },
  hoursAgo: { ru: 'ч назад', kz: 'сағ бұрын', en: 'h ago' },
  yesterday: { ru: 'Вчера', kz: 'Кеше', en: 'Yesterday' },
  viewRoom: { ru: 'Перейти к комнате', kz: 'Бөлмеге өту', en: 'View room' },
  viewPayment: { ru: 'Перейти к платежу', kz: 'Төлемге өту', en: 'View payment' },
  viewDispute: { ru: 'Перейти к спору', kz: 'Дауға өту', en: 'View dispute' },
  viewProfile: { ru: 'Перейти к профилю', kz: 'Профильге өту', en: 'View profile' },
  notifUserJoinedRoom: {
    ru: 'Новый участник присоединился к вашей комнате',
    kz: 'Жаңа қатысушы бөлмеңізге қосылды',
    en: 'A new member joined your room',
  },
  notifUserJoinedRoomBody: {
    ru: 'User_k9x3p присоединился к «Beeline Family 30GB». Предоставьте доступ к тарифу.',
    kz: 'User_k9x3p «Beeline Family 30GB» бөлмесіне қосылды. Тарифке қатынас беріңіз.',
    en: "User_k9x3p joined 'Beeline Family 30GB'. Please grant plan access.",
  },
  notifAccessGranted: {
    ru: 'Владелец предоставил доступ',
    kz: 'Иесі қатынас берді',
    en: 'Owner granted access',
  },
  notifAccessGrantedBody: {
    ru: 'Доступ к тарифу в комнате «Activ Start 15GB» предоставлен. Подтвердите получение.',
    kz: '«Activ Start 15GB» бөлмесінде тарифке қатынас берілді. Алғаныңызды растаңыз.',
    en: "Plan access in room 'Activ Start 15GB' has been granted. Please confirm receipt.",
  },
  notifAccessConfirmed: {
    ru: 'Доступ подтверждён администратором',
    kz: 'Қатынас әкімші растады',
    en: 'Access confirmed by admin',
  },
  notifAccessConfirmedBody: {
    ru: 'Администратор подтвердил доступ для User_m2k9x в комнате RM-0412.',
    kz: 'Әкімші RM-0412 бөлмесінде User_m2k9x қатынасын растады.',
    en: 'Admin confirmed access for User_m2k9x in room RM-0412.',
  },
  notifDisputeCreated: { ru: 'Спор создан', kz: 'Дау жасалды', en: 'Dispute created' },
  notifDisputeCreatedBody: {
    ru: 'Спор DSP-001 по комнате RM-0412 принят в обработку. Ожидайте ответа.',
    kz: 'RM-0412 бөлмесі бойынша DSP-001 дауы өңдеуге қабылданды. Жауап күтіңіз.',
    en: "Dispute DSP-001 for room RM-0412 has been received. We'll respond shortly.",
  },
  notifDisputeClosed: { ru: 'Спор закрыт', kz: 'Дау жабылды', en: 'Dispute closed' },
  notifDisputeClosedBody: {
    ru: 'Решение по спору DSP-001 принято в вашу пользу. Возврат инициирован.',
    kz: 'DSP-001 дауы бойынша шешім сіздің пайдаңызға шешілді. Қайтару басталды.',
    en: 'Dispute DSP-001 was resolved in your favor. Refund has been initiated.',
  },
  notifPaymentReceived: { ru: 'Платёж получен', kz: 'Төлем алынды', en: 'Payment received' },
  notifPaymentReceivedBody: {
    ru: 'Платёж 4 500 ₸ за комнату «Beeline Family 30GB» успешно обработан.',
    kz: '«Beeline Family 30GB» бөлмесі үшін 4 500 ₸ төлем сәтті өңделді.',
    en: "Payment of 4,500 ₸ for room 'Beeline Family 30GB' processed successfully.",
  },
  notifMemberBanned: {
    ru: 'Участник заблокирован',
    kz: 'Қатысушы бұғатталды',
    en: 'Member blocked',
  },
  notifMemberBannedBody: {
    ru: 'User_r7n1q заблокирован в комнате RM-0399 из-за нарушения правил.',
    kz: 'User_r7n1q RM-0399 бөлмесінде ережелерді бұзғаны үшін бұғатталды.',
    en: 'User_r7n1q has been blocked in room RM-0399 due to a policy violation.',
  },
  notifMemberUnbanned: { ru: 'Блокировка снята', kz: 'Бұғаттау алынды', en: 'Member unblocked' },
  notifMemberUnbannedBody: {
    ru: 'Блокировка User_r7n1q в комнате RM-0399 снята.',
    kz: 'RM-0399 бөлмесінде User_r7n1q бұғаттауы алынды.',
    en: 'User_r7n1q has been unblocked in room RM-0399.',
  },
  notifRoomStatusChanged: {
    ru: 'Статус комнаты изменён',
    kz: 'Бөлме мәртебесі өзгерді',
    en: 'Room status changed',
  },
  notifRoomStatusChangedBody: {
    ru: 'Комната «Kcell Unlimited» перешла в статус ACTIVE.',
    kz: '«Kcell Unlimited» бөлмесі ACTIVE мәртебесіне ауысты.',
    en: "Room 'Kcell Unlimited' moved to ACTIVE status.",
  },
  notifRefundSent: { ru: 'Возврат отправлен', kz: 'Қайтару жіберілді', en: 'Refund sent' },
  notifRefundSentBody: {
    ru: 'Возврат 4 500 ₸ по спору DSP-001 отправлен на карту. Ожидайте 1–3 рабочих дня.',
    kz: 'DSP-001 бойынша 4 500 ₸ қайтару картаға жіберілді. 1–3 жұмыс күн күтіңіз.',
    en: 'Refund of 4,500 ₸ for dispute DSP-001 sent to your card. Expect 1–3 business days.',
  },
  loadingNotifications: {
    ru: 'Загрузка уведомлений...',
    kz: 'Хабарландырулар жүктелуде...',
    en: 'Loading notifications...',
  },
  templateLibrary: { ru: 'Библиотека шаблонов', kz: 'Үлгілер кітапханасы', en: 'Template Library' },
  templateLibraryDesc: {
    ru: 'Стандартные карточки уведомлений для всех типов событий',
    kz: 'Барлық оқиға түрлері үшін стандартты хабарландыру карталары',
    en: 'Standard notification cards for all platform event types',
  },
  eventType: { ru: 'Тип события', kz: 'Оқиға түрі', en: 'Event type' },
  recipient: { ru: 'Получатель', kz: 'Алушы', en: 'Recipient' },
  channel: { ru: 'Канал', kz: 'Арна', en: 'Channel' },
  inApp: { ru: 'В приложении', kz: 'Қолданбада', en: 'In-app' },
  push: { ru: 'Push', kz: 'Push', en: 'Push' },
  emailChannel: { ru: 'Email', kz: 'Email', en: 'Email' },

  // ===== Quality Pass (Page 15) =====
  qualityPassTitle: {
    ru: 'Проверка качества: Пустые / Ошибки / Загрузка',
    kz: 'Сапа тексеру: Бос / Қателер / Жүктелу',
    en: 'Quality Pass: Empty / Error / Loading',
  },
  qualityPassSubtitle: {
    ru: 'Переиспользуемые состояния для каждого модуля с локализацией и CTA',
    kz: 'Әр модуль үшін қайта пайдаланылатын күйлер, аудармалар және CTA',
    en: 'Reusable states for each module with localized copy and recommended CTAs',
  },
  moduleAuth: { ru: 'Авторизация', kz: 'Авторизация', en: 'Auth' },
  moduleCatalog: { ru: 'Каталог', kz: 'Каталог', en: 'Catalog' },
  moduleRoomDetail: { ru: 'Детали комнаты', kz: 'Бөлме мәліметтері', en: 'Room Details' },
  modulePayments: { ru: 'Платежи', kz: 'Төлемдер', en: 'Payments' },
  moduleSupport: { ru: 'Поддержка', kz: 'Қолдау', en: 'Support' },
  moduleAdmin: { ru: 'Админ', kz: 'Әкімші', en: 'Admin' },
  stateError: { ru: 'Ошибка', kz: 'Қате', en: 'Error' },
  stateInfo: { ru: 'Информация', kz: 'Ақпарат', en: 'Info' },
  recommendedCta: { ru: 'Рекомендуемый CTA', kz: 'Ұсынылған CTA', en: 'Recommended CTA' },
  authLoginError: {
    ru: 'Неверный номер телефона или пароль',
    kz: 'Телефон нөмірі немесе құпия сөз қате',
    en: 'Incorrect phone number or password',
  },
  authLoginErrorDesc: {
    ru: 'Проверьте введённые данные и попробуйте снова',
    kz: 'Деректерді тексеріп, қайта көріңіз',
    en: 'Please check your credentials and try again',
  },
  authLoginErrorCta: {
    ru: 'Забыли пароль?',
    kz: 'Құпия сөзді ұмыттыңыз ба?',
    en: 'Forgot password?',
  },
  authRateLimited: {
    ru: 'Слишком много попыток входа',
    kz: 'Кіру әрекеттері тым көп',
    en: 'Too many login attempts',
  },
  authRateLimitedDesc: {
    ru: 'Подождите 5 минут перед следующей попыткой. Это защищает ваш аккаунт.',
    kz: 'Келесі әрекетке дейін 5 минут күтіңіз. Бұл тіркелгіңізді қорғайды.',
    en: 'Please wait 5 minutes before trying again. This protects your account.',
  },
  authRateLimitedCta: {
    ru: 'Восстановить доступ',
    kz: 'Қатынасты қалпына келтіру',
    en: 'Recover access',
  },
  authEmailSent: { ru: 'Письмо отправлено', kz: 'Хат жіберілді', en: 'Email sent' },
  authEmailSentDesc: {
    ru: 'Ссылка для сброса пароля отправлена на почту. Проверьте «Спам».',
    kz: 'Құпия сөзді қалпына келтіру сілтемесі поштаға жіберілді. «Спам» тексеріңіз.',
    en: 'A password reset link has been sent. Check your spam folder.',
  },
  authEmailSentCta: { ru: 'Открыть почту', kz: 'Поштаны ашу', en: 'Open email' },
  catalogNoRooms: {
    ru: 'Нет доступных комнат',
    kz: 'Қолжетімді бөлмелер жоқ',
    en: 'No rooms available',
  },
  catalogNoRoomsDesc: {
    ru: 'Пока нет комнат по этому оператору. Создайте свою.',
    kz: 'Бұл оператор бойынша бөлмелер жоқ. Өзіңіз жасаңыз.',
    en: 'No rooms for this operator yet. Create your own.',
  },
  catalogNoRoomsCta: { ru: 'Создать комнату', kz: 'Бөлме жасау', en: 'Create room' },
  catalogFilterEmpty: { ru: 'Ничего не найдено', kz: 'Ештеңе табылмады', en: 'No results found' },
  catalogFilterEmptyDesc: {
    ru: 'Попробуйте изменить фильтры или сбросить параметры',
    kz: 'Сүзгілерді өзгертіп немесе параметрлерді қайта орнатыңыз',
    en: 'Try adjusting your filters or resetting search criteria',
  },
  catalogFilterEmptyCta: {
    ru: 'Сбросить фильтры',
    kz: 'Сүзгілерді қайта орнату',
    en: 'Reset filters',
  },
  roomFullState: { ru: 'Комната заполнена', kz: 'Бөлме толы', en: 'Room is full' },
  roomFullStateDesc: {
    ru: 'Все слоты заняты. Можете следить за освобождением.',
    kz: 'Барлық слоттар бос емес. Орын босағанын бақылауға болады.',
    en: 'All slots are taken. You can watch for openings.',
  },
  roomFullStateCta: {
    ru: 'Искать другие комнаты',
    kz: 'Басқа бөлмелерді іздеу',
    en: 'Browse other rooms',
  },
  roomJoinClosed: { ru: 'Присоединение закрыто', kz: 'Қосылу жабық', en: 'Joining is closed' },
  roomJoinClosedDesc: {
    ru: 'Вступление закрыто после даты старта тарифа',
    kz: 'Тариф басталған күннен кейін қосылу жабылды',
    en: 'Joining closed after the plan start date',
  },
  roomJoinClosedCta: { ru: 'Смотреть каталог', kz: 'Каталогты қарау', en: 'Browse catalog' },
  paymentFailed: { ru: 'Платёж не прошёл', kz: 'Төлем сәтсіз болды', en: 'Payment failed' },
  paymentFailedDesc: {
    ru: 'Транзакция отклонена банком. Средства не списаны.',
    kz: 'Транзакция банк тарапынан қабылданбады. Қаражат шығарылмады.',
    en: 'Transaction declined by bank. No funds were charged.',
  },
  paymentFailedCta: { ru: 'Повторить оплату', kz: 'Төлемді қайталау', en: 'Retry payment' },
  paymentPendingHold: {
    ru: 'Платёж обрабатывается',
    kz: 'Төлем өңделуде',
    en: 'Payment is processing',
  },
  paymentPendingHoldDesc: {
    ru: 'Средства зарезервированы. Подтверждение — до 15 минут.',
    kz: 'Қаражат сақталды. Растау 15 минутқа дейін.',
    en: 'Funds on hold. Confirmation may take up to 15 minutes.',
  },
  paymentPendingHoldCta: { ru: 'Проверить статус', kz: 'Мәртебені тексеру', en: 'Check status' },
  paymentRetrySafe: { ru: 'Безопасный повтор', kz: 'Қауіпсіз қайталау', en: 'Safe to retry' },
  paymentRetrySafeDesc: {
    ru: 'Предыдущий платёж отменён. Повтор не вызовет двойного списания.',
    kz: 'Алдыңғы төлем бас тартылды. Қайталау қос есептен шығармайды.',
    en: "Previous payment was cancelled. Retrying won't cause a double charge.",
  },
  paymentRetrySafeCta: { ru: 'Оплатить заново', kz: 'Қайта төлеу', en: 'Pay again' },
  supportNoTickets: { ru: 'Нет обращений', kz: 'Өтініштер жоқ', en: 'No tickets' },
  supportNoTicketsDesc: {
    ru: 'У вас пока нет обращений. Мы здесь, если нужна помощь.',
    kz: 'Сізде әлі өтініштер жоқ. Көмек керек болса, біз осындамыз.',
    en: "You have no tickets yet. We're here if you need help.",
  },
  supportNoTicketsCta: { ru: 'Создать обращение', kz: 'Өтініш жасау', en: 'Create ticket' },
  supportAttachRejected: { ru: 'Файл отклонён', kz: 'Файл қабылданбады', en: 'File rejected' },
  supportAttachRejectedDesc: {
    ru: 'Только PNG, JPG, PDF до 5 МБ. Выберите другой файл.',
    kz: 'Тек PNG, JPG, PDF 5 МБ дейін. Басқа файлды таңдаңыз.',
    en: 'Only PNG, JPG, PDF up to 5 MB. Please choose another file.',
  },
  supportAttachRejectedCta: {
    ru: 'Выбрать другой файл',
    kz: 'Басқа файлды таңдау',
    en: 'Choose another file',
  },
  adminQueueEmpty: { ru: 'Очередь пуста', kz: 'Кезек бос', en: 'Queue is empty' },
  adminQueueEmptyDesc: {
    ru: 'Все задачи обработаны. Новые появятся автоматически.',
    kz: 'Барлық тапсырмалар өңделді. Жаңалары автоматты пайда болады.',
    en: 'All tasks processed. New items will appear automatically.',
  },
  adminQueueEmptyCta: { ru: 'Обновить', kz: 'Жаңарту', en: 'Refresh' },
  adminPermDenied: { ru: 'Доступ запрещён', kz: 'Қатынас тыйым салынған', en: 'Access denied' },
  adminPermDeniedDesc: {
    ru: 'Нет прав для этого действия. Обратитесь к старшему админу.',
    kz: 'Бұл әрекетке құқық жоқ. Аға әкімшіге хабарласыңыз.',
    en: "You don't have permission. Contact a senior admin.",
  },
  adminPermDeniedCta: { ru: 'Запросить доступ', kz: 'Қатынас сұрау', en: 'Request access' },
  waitSeconds: { ru: 'Подождите', kz: 'Күтіңіз', en: 'Please wait' },

  // ===== Accessibility & Content Safety (Page 16) =====
  a11yTitle: {
    ru: 'Доступность и безопасность контента',
    kz: 'Қолжетімділік және мазмұн қауіпсіздігі',
    en: 'Accessibility & Content Safety',
  },
  a11ySubtitle: {
    ru: 'Фокус-кольца, контрастность, валидация форм, тон ошибок и безопасные формулировки',
    kz: 'Фокус-сақиналары, контрастность, форма валидациясы, қате тоны және қауіпсіз тұжырымдар',
    en: 'Focus rings, contrast ratios, form validation, error message tone, and safe copy guidelines',
  },
  sectionFocusRings: { ru: 'Фокус-кольца', kz: 'Фокус-сақиналары', en: 'Focus Rings' },
  sectionContrast: { ru: 'Контрастность', kz: 'Контрастность', en: 'Contrast Checks' },
  sectionFormValidation: { ru: 'Валидация форм', kz: 'Форма валидациясы', en: 'Form Validation' },
  sectionErrorTone: { ru: 'Тон ошибок', kz: 'Қателер тоны', en: 'Error Tone' },
  sectionSafeCopy: { ru: 'Безопасные формулировки', kz: 'Қауіпсіз тұжырымдар', en: 'Safe Copy' },
  focusRingDesc: {
    ru: 'Все интерактивные элементы: видимое кольцо фокуса 2px с отступом 2px',
    kz: 'Барлық интерактивті элементтер: 2px аралықты 2px фокус сақинасы',
    en: 'All interactive elements: visible 2px focus ring with 2px offset',
  },
  keyboardNavDesc: {
    ru: 'Tab — навигация, Enter/Space — активация, Escape — закрытие',
    kz: 'Tab — навигация, Enter/Space — белсендіру, Escape — жабу',
    en: 'Tab to navigate, Enter/Space to activate, Escape to close',
  },
  contrastPassLabel: { ru: 'Проходит', kz: 'Өтеді', en: 'Pass' },
  contrastFailLabel: { ru: 'Не проходит', kz: 'Өтпейді', en: 'Fail' },
  contrastAaLabel: { ru: 'AA (4.5:1)', kz: 'AA (4.5:1)', en: 'AA (4.5:1)' },
  contrastAaaLabel: { ru: 'AAA (7:1)', kz: 'AAA (7:1)', en: 'AAA (7:1)' },
  inlineValidation: {
    ru: 'Встроенная валидация',
    kz: 'Кірістірілген валидация',
    en: 'Inline validation',
  },
  summaryValidation: { ru: 'Сводка ошибок', kz: 'Қателер жиынтығы', en: 'Error summary' },
  fieldRequired: { ru: 'Обязательное поле', kz: 'Міндетті өріс', en: 'Required field' },
  fieldInvalidPhone: {
    ru: 'Формат: +7 (XXX) XXX-XX-XX',
    kz: 'Формат: +7 (XXX) XXX-XX-XX',
    en: 'Format: +7 (XXX) XXX-XX-XX',
  },
  fieldPasswordWeak: {
    ru: 'Мин. 8 символов, буква и цифра',
    kz: 'Кем дегенде 8 таңба, әріп пен сан',
    en: 'Min 8 chars, letter and number',
  },
  fieldPriceRange: {
    ru: 'Цена от 500 до 50 000 ₸',
    kz: 'Баға 500-ден 50 000 ₸-ге дейін',
    en: 'Price from 500 to 50,000 ₸',
  },
  fieldMaxLength: {
    ru: 'Превышен лимит символов',
    kz: 'Таңба шегінен асты',
    en: 'Character limit exceeded',
  },
  fieldInvalidFile: {
    ru: 'Только PNG, JPG, PDF до 5 МБ',
    kz: 'Тек PNG, JPG, PDF 5 МБ дейін',
    en: 'Only PNG, JPG, PDF up to 5 MB',
  },
  errorToneGood: { ru: 'Хороший тон', kz: 'Жақсы тон', en: 'Good tone' },
  errorToneBad: { ru: 'Плохой тон', kz: 'Жаман тон', en: 'Bad tone' },
  errorToneRule1: {
    ru: 'Не обвиняйте пользователя',
    kz: 'Пайдаланушыны кінәламаңыз',
    en: "Don't blame the user",
  },
  errorToneRule2: {
    ru: 'Никаких технических деталей',
    kz: 'Техникалық мәліметтер жоқ',
    en: 'No technical details or stack traces',
  },
  errorToneRule3: {
    ru: 'Всегда предлагайте следующий шаг',
    kz: 'Әрқашан келесі қадамды ұсыныңыз',
    en: 'Always suggest a next step',
  },
  errorToneRule4: {
    ru: 'Не раскрывайте существование аккаунтов',
    kz: 'Тіркелгілердің бар екенін ашпаңыз',
    en: "Don't reveal account existence",
  },
  safeCopyRateLimitBad: {
    ru: 'Ваш IP заблокирован из-за подозрительной активности.',
    kz: 'IP күдікті белсенділік салдарынан бұғатталды.',
    en: 'Your IP has been blocked due to suspicious activity.',
  },
  safeCopyRateLimitGood: {
    ru: 'Слишком много попыток. Подождите 5 минут и попробуйте снова.',
    kz: 'Тым көп әрекет. 5 минут күтіп, қайта көріңіз.',
    en: 'Too many attempts. Wait 5 minutes and try again.',
  },
  safeCopyAuthBad: {
    ru: 'Пользователь с таким email не найден.',
    kz: 'Бұл email бар пайдаланушы табылмады.',
    en: 'No user found with this email.',
  },
  safeCopyAuthGood: {
    ru: 'Если аккаунт существует, мы отправили ссылку для сброса.',
    kz: 'Тіркелгі бар болса, қалпына келтіру сілтемесін жібердік.',
    en: "If an account exists, we've sent a reset link.",
  },
  safeCopyFraudBad: {
    ru: 'Обнаружена мошенническая активность на вашем аккаунте.',
    kz: 'Тіркелгіде алаяқтық белсенділік анықталды.',
    en: 'Fraudulent activity detected on your account.',
  },
  safeCopyFraudGood: {
    ru: 'Для безопасности действие временно приостановлено. Обратитесь в поддержку.',
    kz: 'Қауіпсіздік үшін әрекет тоқтатылды. Қолдауға хабарласыңыз.',
    en: 'For your security, this action is paused. Contact support.',
  },
  safeCopyPayBad: {
    ru: 'Карта отклонена. Код: CARD_DECLINED_INSUFFICIENT_FUNDS.',
    kz: 'Карта қабылданбады. Код: CARD_DECLINED_INSUFFICIENT_FUNDS.',
    en: 'Card declined. Error: CARD_DECLINED_INSUFFICIENT_FUNDS.',
  },
  safeCopyPayGood: {
    ru: 'Платёж не прошёл. Проверьте данные карты или попробуйте другую.',
    kz: 'Төлем сәтсіз. Карта деректерін тексеріңіз немесе басқасын қолданыңыз.',
    en: "Payment didn't go through. Check card details or try another.",
  },
  wcagNote: {
    ru: 'WCAG 2.1 AA — минимальный стандарт',
    kz: 'WCAG 2.1 AA — ең төменгі стандарт',
    en: 'WCAG 2.1 AA — minimum standard',
  },
  focusVisible: { ru: 'Видимый фокус', kz: 'Көрінетін фокус', en: 'Visible focus' },
  ariaLabelRequired: {
    ru: 'aria-label обязателен для иконок-кнопок',
    kz: 'белгіше-батырмалар үшін aria-label міндетті',
    en: 'aria-label required for icon buttons',
  },

  // ===== Component Audit & Variants (Page 17) =====
  compAuditTitle: {
    ru: 'Аудит компонентов и варианты',
    kz: 'Компонент аудиті және нұсқалар',
    en: 'Component Audit & Variants',
  },
  compAuditSubtitle: {
    ru: 'Унифицированные переиспользуемые компоненты — пагинация, таблицы, загрузки, таймлайны, баннеры и тосты',
    kz: 'Бірыңғай қайта пайдаланылатын компоненттер — пагинация, кестелер, жүктеулер, уақыт шкалалары, баннерлер мен тосттар',
    en: 'Unified reusable components — pagination, tables, uploads, timelines, banners, and toasts',
  },
  sectionPagination: {
    ru: 'Пагинация и фильтры',
    kz: 'Пагинация және сүзгілер',
    en: 'Pagination & Filters',
  },
  sectionTables: { ru: 'Таблицы', kz: 'Кестелер', en: 'Tables' },
  sectionUpload: { ru: 'Загрузка файлов', kz: 'Файл жүктеу', en: 'File Upload' },
  sectionTimeline: { ru: 'Таймлайн статусов', kz: 'Мәртебе уақыт шкаласы', en: 'Status Timeline' },
  sectionBannersToasts: {
    ru: 'Баннеры и тосты',
    kz: 'Баннерлер мен тосттар',
    en: 'Banners & Toasts',
  },
  paginationPrev: { ru: 'Назад', kz: 'Артқа', en: 'Previous' },
  paginationNext: { ru: 'Далее', kz: 'Алға', en: 'Next' },
  paginationOf: { ru: 'из', kz: 'ішінен', en: 'of' },
  sortBy: { ru: 'Сортировать', kz: 'Сұрыптау', en: 'Sort by' },
  sortPrice: { ru: 'Цена', kz: 'Баға', en: 'Price' },
  sortDate: { ru: 'Дата', kz: 'Күні', en: 'Date' },
  sortRating: { ru: 'Рейтинг', kz: 'Рейтинг', en: 'Rating' },
  sortMembers: { ru: 'Участники', kz: 'Қатысушылар', en: 'Members' },
  filterChipOperator: { ru: 'Оператор', kz: 'Оператор', en: 'Operator' },
  filterChipStatus: { ru: 'Статус', kz: 'Мәртебе', en: 'Status' },
  filterChipPriceRange: { ru: 'Диапазон цен', kz: 'Баға ауқымы', en: 'Price range' },
  filterSaved: { ru: 'Сохранённые фильтры', kz: 'Сақталған сүзгілер', en: 'Saved filters' },
  filterSave: { ru: 'Сохранить фильтр', kz: 'Сүзгіні сақтау', en: 'Save filter' },
  tableDense: { ru: 'Компактная', kz: 'Ықшам', en: 'Dense' },
  tableComfortable: { ru: 'Просторная', kz: 'Кең', en: 'Comfortable' },
  tableActions: { ru: 'Действия', kz: 'Әрекеттер', en: 'Actions' },
  tableBulkSelect: { ru: 'Выбрано', kz: 'Таңдалды', en: 'Selected' },
  tableStickyHeader: {
    ru: 'Закреплённый заголовок',
    kz: 'Бекітілген тақырып',
    en: 'Sticky header',
  },
  uploadNormal: {
    ru: 'Перетащите файл или нажмите для выбора',
    kz: 'Файлды сүйреңіз немесе таңдау үшін басыңыз',
    en: 'Drag file or click to browse',
  },
  uploadError: {
    ru: 'Ошибка загрузки. Попробуйте другой файл.',
    kz: 'Жүктеу қатесі. Басқа файлды қолданыңыз.',
    en: 'Upload failed. Try another file.',
  },
  uploadScanning: {
    ru: 'Проверка безопасности файла…',
    kz: 'Файл қауіпсіздігін тексеру…',
    en: 'Scanning file for safety…',
  },
  uploadSuccess: { ru: 'Файл загружен', kz: 'Файл жүктелді', en: 'File uploaded' },
  uploadFormats: {
    ru: 'PNG, JPG, PDF — до 5 МБ',
    kz: 'PNG, JPG, PDF — 5 МБ дейін',
    en: 'PNG, JPG, PDF — up to 5 MB',
  },
  timelinePayment: { ru: 'Таймлайн платежа', kz: 'Төлем уақыт шкаласы', en: 'Payment timeline' },
  timelineDispute: { ru: 'Таймлайн спора', kz: 'Дау уақыт шкаласы', en: 'Dispute timeline' },
  timelineVerification: {
    ru: 'Таймлайн верификации',
    kz: 'Тексеру уақыт шкаласы',
    en: 'Verification timeline',
  },
  bannerInfo: { ru: 'Информационный', kz: 'Ақпараттық', en: 'Info' },
  bannerWarning: { ru: 'Предупреждение', kz: 'Ескерту', en: 'Warning' },
  bannerBlocking: { ru: 'Блокирующий', kz: 'Бұғаттаушы', en: 'Blocking' },
  toastSuccess: { ru: 'Успешное действие', kz: 'Сәтті әрекет', en: 'Action successful' },
  toastError: {
    ru: 'Что-то пошло не так',
    kz: 'Бірдеңе дұрыс болмады',
    en: 'Something went wrong',
  },
  toastWarning: { ru: 'Обратите внимание', kz: 'Назар аударыңыз', en: 'Heads up' },
  toastInfo: { ru: 'К сведению', kz: 'Мәлімет үшін', en: 'For your info' },
  dismiss: { ru: 'Закрыть', kz: 'Жабу', en: 'Dismiss' },
  bannerInfoMsg: {
    ru: 'Плановое обслуживание 5 апреля, 03:00–05:00. Сервис может быть недоступен.',
    kz: '5 сәуір 03:00–05:00 жоспарлы қызмет көрсету. Сервис қолжетімсіз болуы мүмкін.',
    en: 'Scheduled maintenance Apr 5, 03:00–05:00. Service may be unavailable.',
  },
  bannerWarnMsg: {
    ru: 'Ваш платёж просрочен. Обновите способ оплаты.',
    kz: 'Төлем мерзімі өткен. Төлем әдісін жаңартыңыз.',
    en: 'Your payment is overdue. Please update your payment method.',
  },
  bannerBlockMsg: {
    ru: 'Аккаунт временно ограничен. Обратитесь в поддержку.',
    kz: 'Тіркелгі уақытша шектелген. Қолдауға хабарласыңыз.',
    en: 'Account temporarily restricted. Contact support to restore access.',
  },
  componentCount: { ru: 'компонентов', kz: 'компонент', en: 'components' },
  variantCount: { ru: 'вариантов', kz: 'нұсқа', en: 'variants' },

  // ===== QA & Release Readiness (Page 20) =====
  qaTitle: {
    ru: 'QA и готовность к релизу',
    kz: 'QA және шығаруға дайындық',
    en: 'QA & Release Readiness',
  },
  qaSubtitle: {
    ru: 'Матрица покрытия, адаптивность, стресс-тест i18n, безопасность UX, критические сценарии и критерии приёмки',
    kz: 'Қамту матрицасы, бейімділік, i18n стресс-тесті, UX қауіпсіздігі, маңызды сценарийлер және қабылдау критерийлері',
    en: 'Coverage matrix, responsive checks, i18n stress test, security UX, critical journeys, and acceptance criteria',
  },
  sectionCovMatrix: { ru: 'Матрица покрытия', kz: 'Қамту матрицасы', en: 'Coverage Matrix' },
  sectionResponsive: { ru: 'Адаптивность', kz: 'Бейімділік', en: 'Responsive & Overflow' },
  sectionI18nStress: { ru: 'Стресс-тест i18n', kz: 'i18n стресс-тесті', en: 'i18n Stress Test' },
  sectionSecurityUx: { ru: 'Безопасность UX', kz: 'UX қауіпсіздігі', en: 'Security UX Checks' },
  sectionJourneys: {
    ru: 'Критические сценарии',
    kz: 'Маңызды сценарийлер',
    en: 'Critical Journeys',
  },
  sectionAcceptance: {
    ru: 'Критерии приёмки',
    kz: 'Қабылдау критерийлері',
    en: 'Acceptance Criteria',
  },
  stateEmpty: { ru: 'Пусто', kz: 'Бос', en: 'Empty' },
  stateLoading: { ru: 'Загрузка', kz: 'Жүктелуде', en: 'Loading' },
  statePermission: { ru: 'Нет доступа', kz: 'Қатынас жоқ', en: 'No Access' },
  stateOffline: { ru: 'Оффлайн', kz: 'Оффлайн', en: 'Offline' },
  stateRateLimit: { ru: 'Лимит запросов', kz: 'Сұраулар шектеуі', en: 'Rate-Limited' },
  covered: { ru: 'Покрыто', kz: 'Қамтылған', en: 'Covered' },
  notApplicable: { ru: 'Н/П', kz: 'Қ/Ж', en: 'N/A' },
  missingState: { ru: 'Отсутствует', kz: 'Жетіспейді', en: 'Missing' },
  breakpointDesktop: { ru: 'Десктоп', kz: 'Десктоп', en: 'Desktop' },
  breakpointTablet: { ru: 'Планшет', kz: 'Планшет', en: 'Tablet' },
  breakpointMobile: { ru: 'Мобильді', kz: 'Мобильді', en: 'Mobile' },
  truncationRule: { ru: 'Правило обрезки', kz: 'Қиып алу ережесі', en: 'Truncation rule' },
  overflowNote: { ru: 'Переполнение', kz: 'Толып кету', en: 'Overflow note' },
  longestString: { ru: 'Самая длинная строка', kz: 'Ең ұзын жол', en: 'Longest string' },
  dateFormat: { ru: 'Формат даты', kz: 'Күн форматы', en: 'Date format' },
  currencyFormat: { ru: 'Формат валюты', kz: 'Валюта форматы', en: 'Currency format' },
  pluralNotes: { ru: 'Множественное число', kz: 'Көпше түрі', en: 'Pluralization' },
  piiMasking: { ru: 'Маскировка ПДн', kz: 'ДЖД маскалау', en: 'PII Masking' },
  revealWithReason: {
    ru: 'Показ с обоснованием',
    kz: 'Негіздемемен көрсету',
    en: 'Reveal-with-Reason',
  },
  noChatRule: {
    ru: 'Нет чата между пользователями',
    kz: 'Пайдаланушылар арасында чат жоқ',
    en: 'No user-to-user chat',
  },
  journeyJoin: {
    ru: 'Присоединение → Оплата → Ожидание → Активно',
    kz: 'Қосылу → Төлем → Күту → Белсенді',
    en: 'Join → Pay → Pending → Active',
  },
  journeyCreate: {
    ru: 'Создание → Верификация → Доступ',
    kz: 'Құру → Тексеру → Қатынас',
    en: 'Create → Verify → Grant Access',
  },
  journeyDispute: {
    ru: 'Спор → Решение → Возврат',
    kz: 'Дау → Шешім → Қайтару',
    en: 'Dispute → Decision → Refund',
  },
  mvpDod: {
    ru: 'MVP Definition of Done (дизайн)',
    kz: 'MVP Definition of Done (дизайн)',
    en: 'MVP Definition of Done (Design)',
  },
  dodItem1: {
    ru: 'Все 6 модулей покрыты всеми состояниями',
    kz: 'Барлық 6 модуль барлық күйлермен қамтылған',
    en: 'All 6 modules covered for all states',
  },
  dodItem2: {
    ru: 'Адаптивность на 4 брейкпоинтах',
    kz: '4 брейкпоинтта бейімділік',
    en: 'Responsive at 4 breakpoints',
  },
  dodItem3: {
    ru: 'RU/KZ/EN — строки + обрезка',
    kz: 'RU/KZ/EN — жолдар + қиып алу',
    en: 'RU/KZ/EN — strings + truncation',
  },
  dodItem4: {
    ru: 'ПДн скрыты, показ задокументирован',
    kz: 'ДЖД жасырылған, көрсету құжатталған',
    en: 'PII hidden, reveal documented',
  },
  dodItem5: {
    ru: '3 критических сценария прокликаны',
    kz: '3 маңызды сценарий тексерілді',
    en: '3 critical journeys click-tested',
  },
  dodItem6: {
    ru: 'Контрастность AA для всех пар',
    kz: 'Барлық жұптар үшін AA контрастность',
    en: 'AA contrast for all pairs',
  },
  dodItem7: {
    ru: 'Фокус-кольца на всех элементах',
    kz: 'Барлық элементтерде фокус-сақиналар',
    en: 'Focus rings on all elements',
  },
  dodItem8: {
    ru: 'Нет прямого чата — только поддержка',
    kz: 'Тікелей чат жоқ — тек қолдау',
    en: 'No direct chat — support only',
  },
  qaPass: { ru: 'Принято', kz: 'Қабылданды', en: 'Pass' },
  qaFail: { ru: 'Не принято', kz: 'Қабылданбады', en: 'Fail' },
  qaPartial: { ru: 'Частично', kz: 'Ішінара', en: 'Partial' },
  stepNum: { ru: 'Шаг', kz: 'Қадам', en: 'Step' },
  expectedUi: { ru: 'Ожидаемый UI', kz: 'Күтілетін UI', en: 'Expected UI' },
  recoveryCta: { ru: 'Восстановление', kz: 'Қалпына келтіру', en: 'Recovery CTA' },

  // ===== Governance & Rules (Page 21) =====
  govTitle: { ru: 'Гавернанс и правила', kz: 'Басқару және ережелер', en: 'Governance & Rules' },
  govSubtitle: {
    ru: 'Правила использования токенов, компонентов, типографики, статусов, текста и i18n-ключей',
    kz: 'Токендер, компоненттер, типография, мәртебелер, мәтін және i18n-кілттерді пайдалану ережелері',
    en: 'Rules for tokens, components, typography, statuses, copy, and i18n keys',
  },
  sectionTokenRules: { ru: 'Правила токенов', kz: 'Токен ережелері', en: 'Token Rules' },
  sectionCompRules: { ru: 'Правила компонентов', kz: 'Компонент ережелері', en: 'Component Rules' },
  sectionCopyRules: { ru: 'Правила текста', kz: 'Мәтін ережелері', en: 'Copy Rules' },
  sectionIconRules: { ru: 'Правила иконок', kz: 'Белгіше ережелері', en: 'Icon Rules' },
  sectionStatusRules: { ru: 'Правила статусов', kz: 'Мәртебе ережелері', en: 'Status Language' },
  sectionI18nRules: { ru: 'Правила i18n-ключей', kz: 'i18n-кілт ережелері', en: 'i18n Key Rules' },
  govDo: { ru: 'Правильно', kz: 'Дұрыс', en: 'Do' },
  govDont: { ru: 'Неправильно', kz: 'Қате', en: "Don't" },
  govWhy: { ru: 'Почему', kz: 'Неліктен', en: 'Why' },
  govRule: { ru: 'Правило', kz: 'Ереже', en: 'Rule' },
  govRuleCount: { ru: 'правил', kz: 'ереже', en: 'rules' },

  // ===== Payment History & Receipts (Page 22) =====
  phTitle: {
    ru: 'История платежей и квитанции',
    kz: 'Төлем тарихы және түбіртектер',
    en: 'Payment History & Receipts',
  },
  phSubtitle: {
    ru: 'Полная финансовая история: входящие, исходящие, возвраты — с фильтрами и квитанциями',
    kz: 'Толық қаржы тарихы: кіріс, шығыс, қайтару — сүзгілер және түбіртектермен',
    en: 'Complete financial trail: incoming, outgoing, refunds — with filters and receipts',
  },
  phUserView: { ru: 'Мои платежи', kz: 'Менің төлемдерім', en: 'My Payments' },
  phAdminView: { ru: 'Все транзакции', kz: 'Барлық транзакциялар', en: 'All Transactions' },
  phReceiptView: { ru: 'Квитанция', kz: 'Түбіртек', en: 'Receipt' },
  phFilterAll: { ru: 'Все', kz: 'Барлығы', en: 'All' },
  phFilterIncoming: { ru: 'Входящие', kz: 'Кіріс', en: 'Incoming' },
  phFilterOutgoing: { ru: 'Исходящие', kz: 'Шығыс', en: 'Outgoing' },
  phFilterRefunds: { ru: 'Возвраты', kz: 'Қайтару', en: 'Refunds' },
  phAmount: { ru: 'Сумма', kz: 'Сома', en: 'Amount' },
  phDate: { ru: 'Дата', kz: 'Күні', en: 'Date' },
  phRoom: { ru: 'Комната', kz: 'Бөлме', en: 'Room' },
  phOperator: { ru: 'Оператор', kz: 'Оператор', en: 'Operator' },
  phMethod: { ru: 'Способ оплаты', kz: 'Төлем әдісі', en: 'Payment method' },
  phIntentId: { ru: 'ID намерения', kz: 'Ниет ID', en: 'Intent ID' },
  phTxnId: { ru: 'ID транзакции', kz: 'Транзакция ID', en: 'Transaction ID' },
  phRefundId: { ru: 'ID возврата', kz: 'Қайтару ID', en: 'Refund ID' },
  phViewReceipt: { ru: 'Квитанция', kz: 'Түбіртек', en: 'Receipt' },
  phExport: { ru: 'Экспорт', kz: 'Экспорт', en: 'Export' },
  phExportCsv: { ru: 'Экспорт CSV', kz: 'CSV экспорт', en: 'Export CSV' },
  phExportPdf: { ru: 'Экспорт PDF', kz: 'PDF экспорт', en: 'Export PDF' },
  phNoResults: {
    ru: 'Нет транзакций за выбранный период',
    kz: 'Таңдалған кезеңде транзакция жоқ',
    en: 'No transactions for selected period',
  },
  phTotal: { ru: 'Итого', kz: 'Барлығы', en: 'Total' },
  phReceiptTitle: { ru: 'Платёжная квитанция', kz: 'Төлем түбіртегі', en: 'Payment Receipt' },
  phReceiptFrom: { ru: 'Плательщик', kz: 'Төлеуші', en: 'From' },
  phReceiptTo: { ru: 'Получатель', kz: 'Алушы', en: 'To' },
  phReceiptGenerated: { ru: 'Сгенерировано', kz: 'Жасалған', en: 'Generated' },
  phPeriod: { ru: 'Период', kz: 'Кезең', en: 'Period' },
  phThisMonth: { ru: 'Этот месяц', kz: 'Бұл ай', en: 'This month' },
  phLast3: { ru: '3 месяца', kz: '3 ай', en: '3 months' },
  phLast6: { ru: '6 месяцев', kz: '6 ай', en: '6 months' },
  phAllTime: { ru: 'Всё время', kz: 'Бүкіл уақыт', en: 'All time' },
  phSummary: { ru: 'Сводка', kz: 'Жиынтық', en: 'Summary' },
  phPaid: { ru: 'Оплачено', kz: 'Төленді', en: 'Paid' },
  phReceived: { ru: 'Получено', kz: 'Алынды', en: 'Received' },
  phRefunded: { ru: 'Возвращено', kz: 'Қайтарылды', en: 'Refunded' },
  phNet: { ru: 'Чистая сумма', kz: 'Таза сома', en: 'Net' },

  // ===== Geo: Best Operator Here (Page 23) =====
  geoTitle: {
    ru: 'Лучший оператор рядом',
    kz: 'Жақын жердегі ең жақсы оператор',
    en: 'Best Operator Here',
  },
  geoSubtitle: {
    ru: 'Найдите лучший тариф по вашему местоположению — покрытие, скорость и цена',
    kz: 'Орналасқан жеріңіз бойынша ең жақсы тарифті табыңыз — қамту, жылдамдық және баға',
    en: 'Find the best plan at your location — coverage, speed, and price',
  },
  geoPermTitle: {
    ru: 'Доступ к геолокации',
    kz: 'Геолокацияға қол жеткізу',
    en: 'Location Access',
  },
  geoPermDesc: {
    ru: 'Разрешите доступ, чтобы показать покрытие операторов в вашем районе',
    kz: 'Аймағыңыздағы операторлар қамтуын көрсету үшін рұқсат беріңіз',
    en: 'Allow access to show operator coverage in your area',
  },
  geoPermBtn: { ru: 'Разрешить геолокацию', kz: 'Геолокацияға рұқсат беру', en: 'Allow Location' },
  geoPermSkip: {
    ru: 'Выбрать город вручную',
    kz: 'Қаланы қолмен таңдау',
    en: 'Choose city manually',
  },
  geoPermPrivacy: {
    ru: 'Мы не сохраняем ваши координаты. Данные используются только для подбора.',
    kz: 'Координаталарыңыз сақталмайды. Деректер тек таңдау үшін қолданылады.',
    en: "We don't store your coordinates. Data is used only for matching.",
  },
  geoResults: { ru: 'Результаты', kz: 'Нәтижелер', en: 'Results' },
  geoCoverage: { ru: 'Покрытие', kz: 'Қамту', en: 'Coverage' },
  geoSpeed: { ru: 'Скорость', kz: 'Жылдамдық', en: 'Speed' },
  geoPrice: { ru: 'Цена', kz: 'Баға', en: 'Price' },
  geoBestFor: { ru: 'Лучший для', kz: 'Ең жақсы', en: 'Best for' },
  geoDisclaimer: {
    ru: 'Данные покрытия приблизительные и основаны на открытых источниках. Реальное покрытие может отличаться.',
    kz: 'Қамту деректері шамамен және ашық көздерге негізделген. Нақты қамту өзгеше болуы мүмкін.',
    en: 'Coverage data is approximate and based on public sources. Actual coverage may vary.',
  },
  geoViewPlans: { ru: 'Смотреть тарифы', kz: 'Тарифтерді қарау', en: 'View Plans' },
  geoExcellent: { ru: 'Отличное', kz: 'Тамаша', en: 'Excellent' },
  geoGood: { ru: 'Хорошее', kz: 'Жақсы', en: 'Good' },
  geoFair: { ru: 'Среднее', kz: 'Орташа', en: 'Fair' },
  geoWeak: { ru: 'Слабое', kz: 'Әлсіз', en: 'Weak' },
  geoYourLocation: {
    ru: 'Ваше местоположение',
    kz: 'Сіздің орналасқан жеріңіз',
    en: 'Your location',
  },
  geoSortBy: { ru: 'Сортировка', kz: 'Сұрыптау', en: 'Sort by' },
  geoOverall: { ru: 'Общий рейтинг', kz: 'Жалпы рейтинг', en: 'Overall rating' },
  geoShareable: { ru: 'Тарифов доступно', kz: 'Қолжетімді тарифтер', en: 'Shareable plans' },

  // ===== Notification Preferences (Page 24) =====
  npTitle: {
    ru: 'Настройки уведомлений',
    kz: 'Хабарландыру баптаулары',
    en: 'Notification Preferences',
  },
  npSubtitle: {
    ru: 'Выберите, как и о чём вас уведомлять — в приложении, push или email',
    kz: 'Хабарландыру тәсілі мен мазмұнын таңдаңыз — қосымшада, push немесе email',
    en: 'Choose how and what to be notified about — in-app, push, or email',
  },
  npInApp: { ru: 'В приложении', kz: 'Қосымшада', en: 'In-App' },
  npPush: { ru: 'Push', kz: 'Push', en: 'Push' },
  npEmail: { ru: 'Email', kz: 'Email', en: 'Email' },
  npCatPayments: { ru: 'Платежи', kz: 'Төлемдер', en: 'Payments' },
  npCatRooms: { ru: 'Комнаты', kz: 'Бөлмелер', en: 'Rooms' },
  npCatDisputes: { ru: 'Споры', kz: 'Даулар', en: 'Disputes' },
  npCatSecurity: { ru: 'Безопасность', kz: 'Қауіпсіздік', en: 'Security' },
  npCatMarketing: { ru: 'Новости и акции', kz: 'Жаңалықтар мен акциялар', en: 'News & Offers' },
  npCatSystem: { ru: 'Системные', kz: 'Жүйелік', en: 'System' },
  npSavePrefs: { ru: 'Сохранить настройки', kz: 'Баптауларды сақтау', en: 'Save Preferences' },
  npReset: { ru: 'Сбросить', kz: 'Қалпына келтіру', en: 'Reset to Defaults' },
  npPrivacyNote: {
    ru: 'Вы можете изменить настройки в любое время. Мы не продаём ваши данные третьим лицам.',
    kz: 'Баптауларды кез келген уақытта өзгерте аласыз. Деректеріңізді үшінші тарапқа сатпаймыз.',
    en: 'You can change preferences anytime. We never sell your data to third parties.',
  },
  npQuietHours: { ru: 'Тихие часы', kz: 'Тыныш сағаттар', en: 'Quiet Hours' },
  npQuietDesc: {
    ru: 'Push-уведомления не будут отправляться в указанный период',
    kz: 'Көрсетілген кезеңде push-хабарландырулар жіберілмейді',
    en: "Push notifications won't be sent during this period",
  },
  npDigest: { ru: 'Дайджест', kz: 'Дайджест', en: 'Digest' },
  npDigestDesc: {
    ru: 'Получайте сводку вместо отдельных писем',
    kz: 'Жеке хаттардың орнына жиынтық алыңыз',
    en: 'Get a summary instead of individual emails',
  },
  npRequired: { ru: 'Обязательное', kz: 'Міндетті', en: 'Required' },
  npAlwaysOn: { ru: 'Всегда включено', kz: 'Әрқашан қосулы', en: 'Always on' },

  // ===== UI Data Contracts & API Mapping (Page 23) =====
  dcTitle: {
    ru: 'UI Data Contracts & API Mapping',
    kz: 'UI деректер келісімшарттары және API салыстыру',
    en: 'UI Data Contracts & API Mapping',
  },
  dcSubtitle: {
    ru: 'Каждый экран: поля, состояния, зависимости от бэкенда, маскирование и форматирование',
    kz: 'Әр экран: өрістер, күйлер, бэкенд тәуелділіктері, маскалау және пішімдеу',
    en: 'Every screen: fields, states, backend dependencies, masking, and formatting',
  },
  dcDataContract: { ru: 'Контракт данных', kz: 'Деректер келісімшарты', en: 'Data Contract' },
  dcApiMapping: { ru: 'API-маппинг', kz: 'API салыстыру', en: 'API Mapping' },
  dcStateHandling: { ru: 'Обработка состояний', kz: 'Күйлерді өңдеу', en: 'State Handling' },
  dcFormatRules: {
    ru: 'Форматирование и конфиденциальность',
    kz: 'Пішімдеу және құпиялылық',
    en: 'Formatting & Privacy',
  },
  dcField: { ru: 'Поле', kz: 'Өріс', en: 'Field' },
  dcType: { ru: 'Тип', kz: 'Түрі', en: 'Type' },
  dcRequired: { ru: 'Обяз.', kz: 'Міндетті', en: 'Req' },
  dcNullHandling: { ru: 'Если null/пусто', kz: 'Null/бос болса', en: 'If null/empty' },
  dcExample: { ru: 'Пример', kz: 'Мысал', en: 'Example' },
  dcEndpoint: { ru: 'Эндпоинт', kz: 'Эндпоинт', en: 'Endpoint' },
  dcMethod: { ru: 'Метод', kz: 'Әдіс', en: 'Method' },
  dcParams: { ru: 'Параметры', kz: 'Параметрлер', en: 'Params' },
  dcResponse: { ru: 'Ответ', kz: 'Жауап', en: 'Response' },
  dcState: { ru: 'Состояние', kz: 'Күй', en: 'State' },
  dcBehavior: { ru: 'Поведение UI', kz: 'UI мінез-құлқы', en: 'UI Behavior' },
  dcRule: { ru: 'Правило', kz: 'Ереже', en: 'Rule' },
  dcFormat: { ru: 'Формат', kz: 'Пішім', en: 'Format' },
  dcStatus: { ru: 'Статус', kz: 'Мәртебе', en: 'Status' },
  dcBadge: { ru: 'Бейдж', kz: 'Бейдж', en: 'Badge' },
  dcColor: { ru: 'Цвет', kz: 'Түс', en: 'Color' },
  dcAction: { ru: 'Действие', kz: 'Әрекет', en: 'Action' },
  dcPermission: { ru: 'Доступ', kz: 'Рұқсат', en: 'Permission' },
  dcCatalogList: { ru: 'Каталог тарифов', kz: 'Тариф каталогы', en: 'Catalog List' },
  dcOperatorPage: { ru: 'Страница оператора', kz: 'Оператор беті', en: 'Operator Page' },
  dcRoomDetail: { ru: 'Детали комнаты', kz: 'Бөлме мәліметтері', en: 'Room Details' },
  dcJoinCheckout: { ru: 'Вступление и оплата', kz: 'Қосылу және төлем', en: 'Join & Checkout' },
  dcPendingHold: { ru: 'Ожидание и холд', kz: 'Күту және холд', en: 'Pending & Hold' },
  dcSupportTicket: { ru: 'Тикет поддержки', kz: 'Қолдау тикеті', en: 'Support Ticket' },
  dcAdminModeration: { ru: 'Админ: модерация', kz: 'Админ: модерация', en: 'Admin: Moderation' },
  dcProfileReviews: {
    ru: 'Профиль и отзывы',
    kz: 'Профиль және пікірлер',
    en: 'Profile & Reviews',
  },
  dcNotifCenter: {
    ru: 'Центр уведомлений',
    kz: 'Хабарландыру орталығы',
    en: 'Notification Center',
  },
  dcStatusMaps: { ru: 'Таблицы статусов', kz: 'Мәртебе кестелері', en: 'Status Mapping Tables' },
  dcFormattingSpec: {
    ru: 'Спецификация форматирования',
    kz: 'Пішімдеу спецификациясы',
    en: 'Formatting Specification',
  },
  dcI18nConventions: {
    ru: 'Конвенции i18n-ключей',
    kz: 'i18n-кілт конвенциялары',
    en: 'i18n Key Conventions',
  },
  dcModules: { ru: 'модулей', kz: 'модуль', en: 'modules' },
  dcContracts: { ru: 'контрактов', kz: 'келісімшарт', en: 'contracts' },
  dcEndpoints: { ru: 'эндпоинтов', kz: 'эндпоинт', en: 'endpoints' },
  dcStatuses: { ru: 'статусов', kz: 'мәртебе', en: 'statuses' },

  // ===== Copy Library (Page 24) =====
  clTitle: {
    ru: 'Copy Library (RU/KZ/EN)',
    kz: 'Мәтін кітапханасы (RU/KZ/EN)',
    en: 'Copy Library (RU/KZ/EN)',
  },
  clSubtitle: {
    ru: 'Стандартизированная микрокопия: CTA, ошибки, подтверждения, безопасность, споры, уведомления',
    kz: 'Стандартталған микрокөшірме: CTA, қателер, растаулар, қауіпсіздік, дау, хабарландырулар',
    en: 'Standardized microcopy: CTAs, errors, confirmations, security, disputes, notifications',
  },
  clCtas: { ru: 'CTA / Кнопки', kz: 'CTA / Түймелер', en: 'CTAs / Buttons' },
  clForms: { ru: 'Формы и валидация', kz: 'Пішіндер және валидация', en: 'Forms & Validation' },
  clEmpty: { ru: 'Пустые состояния', kz: 'Бос күйлер', en: 'Empty States' },
  clErrors: { ru: 'Ошибки и сбои', kz: 'Қателер және ақаулар', en: 'Errors & Failures' },
  clSuccess: {
    ru: 'Успех и подтверждения',
    kz: 'Сәттілік және растаулар',
    en: 'Success & Confirmations',
  },
  clSecurity: {
    ru: 'Безопасность и фрод',
    kz: 'Қауіпсіздік және алаяқтық',
    en: 'Security & Fraud',
  },
  clDisputes: { ru: 'Споры и возвраты', kz: 'Даулар және қайтарулар', en: 'Disputes & Refunds' },
  clNotifs: { ru: 'Уведомления', kz: 'Хабарландырулар', en: 'Notifications' },
  clPlurals: { ru: 'Множественное число', kz: 'Көпше түрі', en: 'Pluralization' },
  clNumbers: { ru: 'Числа и форматы', kz: 'Сандар және пішімдер', en: 'Numbers & Formatting' },
  clKey: { ru: 'Ключ', kz: 'Кілт', en: 'Key' },
  clContext: { ru: 'Контекст', kz: 'Контекст', en: 'Context' },
  clTone: { ru: 'Тон', kz: 'Тон', en: 'Tone' },
  clCategory: { ru: 'Категория', kz: 'Санат', en: 'Category' },
  clEntries: { ru: 'записей', kz: 'жазба', en: 'entries' },
  clCategories: { ru: 'категорий', kz: 'санат', en: 'categories' },
  clToneGuide: { ru: 'Руководство по тону', kz: 'Тон нұсқаулығы', en: 'Tone Guide' },
  clSearchCopy: { ru: 'Поиск по копии…', kz: 'Көшірмеден іздеу…', en: 'Search copy…' },

  // ===== Build Checklist & Acceptance Criteria (Page 26) =====
  bcTitle: {
    ru: 'Build Checklist & Acceptance Criteria',
    kz: 'Құрастыру тізімі және қабылдау критерийлері',
    en: 'Build Checklist & Acceptance Criteria',
  },
  bcSubtitle: {
    ru: 'Полный план реализации: компоненты, модули, безопасность, производительность и определение готовности',
    kz: 'Толық жүзеге асыру жоспары: компоненттер, модульдер, қауіпсіздік, өнімділік және дайындық анықтамасы',
    en: 'Complete implementation plan: components, modules, security, performance, and definition of done',
  },
  bcComponents: { ru: 'Компоненты', kz: 'Компоненттер', en: 'Components' },
  bcModules: { ru: 'Модули', kz: 'Модульдер', en: 'Modules' },
  bcPerfUx: { ru: 'Производительность / UX', kz: 'Өнімділік / UX', en: 'Performance / UX' },
  bcSecPrivacy: {
    ru: 'Безопасность / Конфиденциальность',
    kz: 'Қауіпсіздік / Құпиялылық',
    en: 'Security / Privacy',
  },
  bcDod: { ru: 'Definition of Done', kz: 'Дайындық анықтамасы', en: 'Definition of Done' },
  bcAcceptance: { ru: 'Критерии приёмки', kz: 'Қабылдау критерийлері', en: 'Acceptance Criteria' },
  bcPriority: { ru: 'Приоритет', kz: 'Басымдық', en: 'Priority' },
  bcStatus: { ru: 'Статус', kz: 'Мәртебе', en: 'Status' },
  bcBlocks: { ru: 'Блокирует', kz: 'Бұғаттайды', en: 'Blocks' },
  bcTasks: { ru: 'задач', kz: 'тапсырма', en: 'tasks' },
  bcCritical: { ru: 'Критичных', kz: 'Маңызды', en: 'Critical' },
  bcMust: { ru: 'Обязательных', kz: 'Міндетті', en: 'Must-have' },
  bcNice: { ru: 'Желательных', kz: 'Қалаулы', en: 'Nice-to-have' },
  bcPassed: { ru: 'Пройдено', kz: 'Өтті', en: 'Passed' },
  bcFailed: { ru: 'Не пройдено', kz: 'Өтпеді', en: 'Failed' },
  bcPending: { ru: 'Ожидает', kz: 'Күтуде', en: 'Pending' },

  // ===== Analytics & Event Tracking Plan (Page 25) =====
  anTitle: {
    ru: 'Analytics & Event Tracking Plan',
    kz: 'Аналитика және оқиғаларды бақылау жоспары',
    en: 'Analytics & Event Tracking Plan',
  },
  anSubtitle: {
    ru: 'Продуктовые события, воронки, сигналы фрода и административная аналитика — для инструментирования с первого дня',
    kz: 'Өнім оқиғалары, воронкалар, алаяқтық сигналдары және әкімшілік аналитика — бірінші күннен бастап инструментациялау',
    en: 'Product events, funnels, fraud signals, and admin analytics — instrument from day one',
  },
  anFunnels: { ru: 'Воронки', kz: 'Воронкалар', en: 'Funnels' },
  anEvents: { ru: 'Продуктовые события', kz: 'Өнім оқиғалары', en: 'Product Events' },
  anAbuse: {
    ru: 'Фрод / Абьюз сигналы',
    kz: 'Алаяқтық / Зиян сигналдары',
    en: 'Fraud / Abuse Signals',
  },
  anAdmin: { ru: 'Административные события', kz: 'Әкімшілік оқиғалар', en: 'Admin Events' },
  anProperties: { ru: 'Свойства', kz: 'Сипаттар', en: 'Properties' },
  anTrigger: { ru: 'Триггер в UI', kz: 'UI триггері', en: 'UI Trigger' },
  anMetric: { ru: 'Целевая метрика', kz: 'Мақсатты метрика', en: 'Success Metric' },
  anEventName: { ru: 'Имя события', kz: 'Оқиға аты', en: 'Event Name' },
  anModule: { ru: 'Модуль', kz: 'Модуль', en: 'Module' },
  anThreshold: { ru: 'Порог', kz: 'Шек', en: 'Threshold' },
  anAction: { ru: 'Действие', kz: 'Әрекет', en: 'Action' },
  anSeverity: { ru: 'Критичность', kz: 'Маңыздылық', en: 'Severity' },
  anFunnelConversion: {
    ru: 'Воронка конверсий',
    kz: 'Конверсия воронкасы',
    en: 'Conversion Funnel',
  },
  anRetention: { ru: 'Удержание', kz: 'Ұстап қалу', en: 'Retention' },
  anImplementation: { ru: 'Реализация', kz: 'Жүзеге асыру', en: 'Implementation' },
  anSearchEvents: { ru: 'Поиск событий…', kz: 'Оқиғаларды іздеу…', en: 'Search events…' },
  anTotalEvents: { ru: 'событий', kz: 'оқиға', en: 'events' },
  anSignals: { ru: 'сигналов', kz: 'сигнал', en: 'signals' },

  // ===== Backend enum / status labels (do not show raw enum values) =====
  'roomStatus.OPEN': { ru: 'Открыта', kz: 'Ашық', en: 'Open' },
  'roomStatus.IN_VERIFICATION': { ru: 'На верификации', kz: 'Тексеруде', en: 'In Verification' },
  'roomStatus.ACTIVE': { ru: 'Активна', kz: 'Белсенді', en: 'Active' },
  'roomStatus.COMPLETED': { ru: 'Завершена', kz: 'Аяқталған', en: 'Completed' },
  'roomStatus.CANCELLED': { ru: 'Отменена', kz: 'Бас тартылды', en: 'Cancelled' },
  'roomStatus.BLOCKED': { ru: 'Заблокирована', kz: 'Бұғатталған', en: 'Blocked' },

  'memberStatus.APPLIED': { ru: 'Подал заявку', kz: 'Өтінім берген', en: 'Applied' },
  'memberStatus.PENDING': { ru: 'Ожидает', kz: 'Күтуде', en: 'Pending' },
  'memberStatus.ACTIVE': { ru: 'Активен', kz: 'Белсенді', en: 'Active' },
  'memberStatus.REJECTED': { ru: 'Отклонён', kz: 'Қабылданбады', en: 'Rejected' },
  'memberStatus.BLOCKED': { ru: 'Заблокирован', kz: 'Бұғатталған', en: 'Blocked' },
  'memberStatus.CANCELLED': { ru: 'Отменён', kz: 'Бас тартылды', en: 'Cancelled' },

  'ticketStatus.OPEN': { ru: 'Открыта', kz: 'Ашық', en: 'Open' },
  'ticketStatus.IN_PROGRESS': { ru: 'В работе', kz: 'Орындалуда', en: 'In Progress' },
  'ticketStatus.RESOLVED': { ru: 'Решена', kz: 'Шешілді', en: 'Resolved' },
  'ticketStatus.CLOSED': { ru: 'Закрыта', kz: 'Жабық', en: 'Closed' },

  'disputeStatus.OPEN': { ru: 'Открыт', kz: 'Ашық', en: 'Open' },
  'disputeStatus.UNDER_REVIEW': { ru: 'На рассмотрении', kz: 'Қарастыруда', en: 'Under Review' },
  'disputeStatus.RESOLVED': { ru: 'Решён', kz: 'Шешілді', en: 'Resolved' },

  'refundStatus.PENDING': { ru: 'Ожидает', kz: 'Күтуде', en: 'Pending' },
  'refundStatus.PROCESSING': { ru: 'Обрабатывается', kz: 'Өңделуде', en: 'Processing' },
  'refundStatus.COMPLETED': { ru: 'Завершён', kz: 'Аяқталды', en: 'Completed' },
  'refundStatus.FAILED': { ru: 'Ошибка', kz: 'Сәтсіз', en: 'Failed' },

  'paymentStatus.PAID': { ru: 'Оплачено', kz: 'Төленді', en: 'Paid' },
  'paymentStatus.PENDING': { ru: 'Ожидает', kz: 'Күтуде', en: 'Pending' },
  'paymentStatus.PROCESSING': { ru: 'Обрабатывается', kz: 'Өңделуде', en: 'Processing' },
  'paymentStatus.FAILED': { ru: 'Ошибка', kz: 'Сәтсіз', en: 'Failed' },
  'paymentStatus.REFUNDED': { ru: 'Возвращено', kz: 'Қайтарылды', en: 'Refunded' },

  // ===== Admin: shared chrome =====
  adminPortal: { ru: 'Админ-портал', kz: 'Әкімші порталы', en: 'Admin Portal' },
  dashboard: { ru: 'Панель управления', kz: 'Басқару тақтасы', en: 'Dashboard' },
  adminLogs: { ru: 'Логи администратора', kz: 'Әкімші логтары', en: 'Admin Logs' },
  adminSearchPlaceholder: {
    ru: 'Поиск комнат, пользователей, заявок...',
    kz: 'Бөлмелерді, пайдаланушыларды, өтінімдерді іздеу...',
    en: 'Search rooms, users, tickets...',
  },
  adminRoleLabel: { ru: 'Администратор', kz: 'Әкімші', en: 'Admin' },
  administrationAndSupport: {
    ru: 'Администрирование и поддержка',
    kz: 'Әкімшілік және қолдау',
    en: 'Administration & Support',
  },
  twoFaCode: { ru: 'Код 2FA', kz: '2FA коды', en: '2FA Code' },
  sixDigitCode: { ru: '6-значный код', kz: '6 таңбалы код', en: '6-digit code' },
  enterAuthCode: {
    ru: 'Введите код из приложения-аутентификатора',
    kz: 'Аутентификатор қолданбасынан кодты енгізіңіз',
    en: 'Enter code from your authenticator app',
  },
  signInToPortal: { ru: 'Войти в портал', kz: 'Порталға кіру', en: 'Sign In to Portal' },
  verifyAndSignIn: { ru: 'Подтвердить и войти', kz: 'Растау және кіру', en: 'Verify and Sign In' },
  twoFactorSentTo: {
    ru: 'Мы отправили код на {{email}}',
    kz: 'Біз кодты {{email}} мекенжайына жібердік',
    en: 'We sent a verification code to {{email}}',
  },
  twoFactorExpiresAt: {
    ru: 'Код действует до {{time}}',
    kz: 'Код {{time}} дейін жарамды',
    en: 'Code valid until {{time}}',
  },
  resendCode: { ru: 'Отправить код повторно', kz: 'Кодты қайта жіберу', en: 'Resend code' },
  resendInSeconds: {
    ru: 'Повторная отправка через {{s}} с',
    kz: '{{s}} с кейін қайта жіберу',
    en: 'Resend in {{s}}s',
  },
  invalidCredentialsError: {
    ru: 'Неверный email или пароль.',
    kz: 'Қате email немесе құпия сөз.',
    en: 'Invalid email or password.',
  },
  noStaffAccessError: {
    ru: 'У этого аккаунта нет доступа в админ-портал.',
    kz: 'Бұл тіркелгінің әкімші порталына кіруі жоқ.',
    en: 'This account does not have staff access.',
  },
  challengeExpiredError: {
    ru: 'Срок действия кода истёк. Войдите снова.',
    kz: 'Кодтың мерзімі бітті. Қайта кіріңіз.',
    en: 'Verification code expired. Please sign in again.',
  },
  invalidTwoFactorCodeError: {
    ru: 'Неверный код подтверждения.',
    kz: 'Растау коды дұрыс емес.',
    en: 'Invalid verification code.',
  },
  tooManyAttemptsError: {
    ru: 'Слишком много попыток. Попробуйте позже.',
    kz: 'Тым көп әрекет. Кейінірек көріңіз.',
    en: 'Too many attempts. Please try again later.',
  },
  genericSignInError: {
    ru: 'Не удалось войти. Попробуйте позже.',
    kz: 'Кіру мүмкін болмады. Кейінірек көріңіз.',
    en: 'Unable to sign in right now.',
  },
  networkError: {
    ru: 'Проблема с подключением. Проверьте сеть.',
    kz: 'Желіге қосылу мәселесі. Қосылымды тексеріңіз.',
    en: 'Network error. Check your connection.',
  },
  demoCredentials: { ru: 'Демо-доступ', kz: 'Демо-деректер', en: 'Demo Credentials' },
  loginLabel: { ru: 'Логин', kz: 'Логин', en: 'Login' },
  figmaOnlyNote: {
    ru: 'Видно только в Figma — удалите перед продакшеном.',
    kz: 'Тек Figma үшін көрінеді — өндіріске дейін жойыңыз.',
    en: 'Visible for Figma only — remove before production.',
  },
  reasonMinLength: {
    ru: 'Минимум {{n}} символов.',
    kz: 'Кемінде {{n}} таңба.',
    en: 'At least {{n}} characters.',
  },
  actionCompletedAndLogged: {
    ru: 'Действие выполнено и записано в аудит.',
    kz: 'Әрекет орындалды және аудитке жазылды.',
    en: 'Action completed and logged.',
  },
  switchAccount: { ru: 'Сменить аккаунт', kz: 'Тіркелгіні ауыстыру', en: 'Switch account' },
  signedInAs: {
    ru: 'Вы вошли как {{email}}',
    kz: 'Сіз {{email}} ретінде кірдіңіз',
    en: 'Signed in as {{email}}',
  },
  goToDashboard: { ru: 'Перейти в панель', kz: 'Басқару тақтасына өту', en: 'Go to dashboard' },
  noNewNotifications: {
    ru: 'Нет новых уведомлений',
    kz: 'Жаңа хабарландырулар жоқ',
    en: 'No new notifications',
  },
  moderationItemRoom: { ru: 'Комната', kz: 'Бөлме', en: 'Room' },
  moderationItemMember: { ru: 'Участник', kz: 'Қатысушы', en: 'Member' },
  moderationItemUnknown: { ru: 'Объект', kz: 'Нысан', en: 'Entity' },
  riskScoreLabel: { ru: 'Балл риска', kz: 'Тәуекел балы', en: 'Risk score' },
  reasonCode: { ru: 'Код причины', kz: 'Себеп коды', en: 'Reason code' },
  assignedTo: { ru: 'Назначено', kz: 'Тағайындалған', en: 'Assigned to' },
  meLabel: { ru: 'Я', kz: 'Мен', en: 'Me' },
  confirmLabel: { ru: 'Подтвердить', kz: 'Растау', en: 'Confirm' },
  rejectLabel: { ru: 'Отклонить', kz: 'Қабылдамау', en: 'Reject' },
  blockRoomShort: { ru: 'Заблокировать', kz: 'Бұғаттау', en: 'Block' },
  confirmModerationTitle: { ru: 'Подтвердить элемент', kz: 'Элементті растау', en: 'Confirm item' },
  rejectModerationTitle: { ru: 'Отклонить элемент', kz: 'Элементті қабылдамау', en: 'Reject item' },
  blockRoomTitle: { ru: 'Заблокировать комнату', kz: 'Бөлмені бұғаттау', en: 'Block room' },
  accessDeniedTitle: { ru: 'Доступ запрещён', kz: 'Қатынау тыйым салынған', en: 'Access denied' },
  accessDeniedBody: {
    ru: 'У этого аккаунта нет прав на админ-портал.',
    kz: 'Бұл тіркелгінің әкімші порталына құқықтары жоқ.',
    en: 'This account does not have permission to view the admin portal.',
  },
  backToHome: { ru: 'На главную', kz: 'Басты бетке', en: 'Back to home' },
  loadFailedTitle: {
    ru: 'Не удалось загрузить данные',
    kz: 'Деректерді жүктеу мүмкін болмады',
    en: "Couldn't load data",
  },
  sessionExpiredError: {
    ru: 'Сессия истекла. Войдите снова.',
    kz: 'Сессия аяқталды. Қайта кіріңіз.',
    en: 'Your session has expired. Please sign in again.',
  },
  serverErrorTitle: {
    ru: 'Ошибка сервера. Попробуйте позже.',
    kz: 'Сервер қатесі. Кейінірек қайталап көріңіз.',
    en: 'Server error. Please try again later.',
  },
  errSectionUnavailable: {
    ru: 'Раздел временно недоступен.',
    kz: 'Бөлім уақытша қолжетімсіз.',
    en: 'This section is temporarily unavailable.',
  },
  errLoadCardFailed: {
    ru: 'Не удалось загрузить карточку.',
    kz: 'Картаны жүктеу мүмкін болмады.',
    en: "Couldn't load this card.",
  },
  banReasonHint: {
    ru: 'Бан и разбан удерживают аудит/платёжную историю. Удаление пользователя не используется.',
    kz: 'Бан мен бан алу аудит/төлем тарихын сақтайды. Пайдаланушыны өшіру жоқ.',
    en: 'Ban / unban preserves audit and payment history. Hard delete is not used.',
  },
  noData: { ru: 'Нет данных', kz: 'Деректер жоқ', en: 'No data' },
  searchUsersPlaceholder: {
    ru: 'Поиск пользователей…',
    kz: 'Пайдаланушыларды іздеу…',
    en: 'Search users…',
  },
  prevPage: { ru: 'Назад', kz: 'Артқа', en: 'Prev' },
  nextPage: { ru: 'Далее', kz: 'Алға', en: 'Next' },
  pageOf: {
    ru: 'Стр. {{page}} из {{total}}',
    kz: '{{page}} / {{total}} бет',
    en: 'Page {{page}} of {{total}}',
  },
  totalRoomsLabel: { ru: 'Всего комнат', kz: 'Барлық бөлмелер', en: 'Total rooms' },
  totalUsersLabel: { ru: 'Всего пользователей', kz: 'Барлық пайдаланушылар', en: 'Total users' },
  activeUsersLabel: { ru: 'Активные', kz: 'Белсенді', en: 'Active users' },
  bannedUsersLabel: { ru: 'Заблокированные', kz: 'Бұғатталған', en: 'Banned users' },
  blockedRoomsLabel: {
    ru: 'Заблокированные комнаты',
    kz: 'Бұғатталған бөлмелер',
    en: 'Blocked rooms',
  },
  pendingModerationLabel: {
    ru: 'Ожидают модерации',
    kz: 'Модерация күтуде',
    en: 'Pending moderation',
  },
  totalRevenueLabel: { ru: 'Общий доход', kz: 'Жалпы табыс', en: 'Total revenue' },
  totalRefundsLabel: { ru: 'Возвраты', kz: 'Қайтарулар', en: 'Refunds' },
  pendingPayoutsLabel: { ru: 'Выплаты в ожидании', kz: 'Күтудегі төлемдер', en: 'Pending payouts' },
  emptyAdminLogs: {
    ru: 'Логи администратора пусты.',
    kz: 'Әкімші логтары бос.',
    en: 'No admin action logs yet.',
  },
  emptyRoomEvents: {
    ru: 'Журнал событий комнат пуст.',
    kz: 'Бөлме оқиғалар журналы бос.',
    en: 'No room events yet.',
  },
  emptyDisputes: { ru: 'Споров нет.', kz: 'Даулар жоқ.', en: 'No disputes.' },
  emptyTickets: { ru: 'Заявок нет.', kz: 'Өтінімдер жоқ.', en: 'No tickets.' },
  emptyUsers: {
    ru: 'Пользователи не найдены.',
    kz: 'Пайдаланушылар табылмады.',
    en: 'No users found.',
  },
  emptyRooms: { ru: 'Комнаты не найдены.', kz: 'Бөлмелер табылмады.', en: 'No rooms found.' },
  tabAdminActions: { ru: 'Действия администратора', kz: 'Әкімші әрекеттері', en: 'Admin actions' },
  tabRoomEvents: { ru: 'События комнат', kz: 'Бөлме оқиғалары', en: 'Room events' },
  filterEntityType: { ru: 'Тип объекта', kz: 'Нысан түрі', en: 'Entity type' },
  filterEventType: { ru: 'Тип события', kz: 'Оқиға түрі', en: 'Event type' },
  filterDateFrom: { ru: 'С даты', kz: 'Бастап', en: 'From' },
  filterDateTo: { ru: 'По дату', kz: 'Дейін', en: 'To' },
  filterApply: { ru: 'Применить', kz: 'Қолдану', en: 'Apply' },
  filterReset: { ru: 'Сбросить', kz: 'Қалпына келтіру', en: 'Reset' },
  decision: { ru: 'Решение', kz: 'Шешім', en: 'Decision' },
  decisionFavorMember: { ru: 'В пользу участника', kz: 'Қатысушы пайдасына', en: 'Favor member' },
  decisionFavorOwner: { ru: 'В пользу владельца', kz: 'Иесі пайдасына', en: 'Favor owner' },
  decisionRejected: { ru: 'Отклонить спор', kz: 'Дауды қабылдамау', en: 'Reject dispute' },
  decisionCommentPlaceholder: {
    ru: 'Комментарий по решению (обязательно)',
    kz: 'Шешім бойынша түсініктеме (міндетті)',
    en: 'Decision comment (required)',
  },
  takeTicket: { ru: 'Взять заявку', kz: 'Өтінімді алу', en: 'Take ticket' },
  setStatus: { ru: 'Изменить статус', kz: 'Мәртебесін өзгерту', en: 'Change status' },
  statusOpen: { ru: 'Открыт', kz: 'Ашық', en: 'Open' },
  statusInProgress: { ru: 'В работе', kz: 'Жұмыста', en: 'In progress' },
  statusClosed: { ru: 'Закрыт', kz: 'Жабық', en: 'Closed' },

  // ===== Admin: dashboard =====
  openDisputes: { ru: 'Открытые споры', kz: 'Ашық даулар', en: 'Open Disputes' },
  refundsPending: { ru: 'Возвраты в ожидании', kz: 'Күтудегі қайтарулар', en: 'Refunds Pending' },
  ticketsOpen: { ru: 'Открытые заявки', kz: 'Ашық өтінімдер', en: 'Tickets Open' },
  activeBans: { ru: 'Активные блокировки', kz: 'Белсенді бұғаттаулар', en: 'Active Bans' },
  totalRooms: { ru: 'Всего комнат', kz: 'Барлық бөлмелер', en: 'Total Rooms' },
  monthlyRevenue: { ru: 'Доход за месяц', kz: 'Айлық табыс', en: 'Monthly Revenue' },
  recentActivity: { ru: 'Недавняя активность', kz: 'Соңғы белсенділік', en: 'Recent Activity' },

  // ===== Admin: moderation =====
  itemsPendingReview: {
    ru: '{{count}} элементов на проверке',
    kz: '{{count}} элемент тексеруде',
    en: '{{count}} items pending review',
  },
  queueClear: { ru: 'Очередь пуста', kz: 'Кезек бос', en: 'Queue is clear' },
  noItemsPendingModeration: {
    ru: 'Нет элементов на модерации.',
    kz: 'Модерацияда элементтер жоқ.',
    en: 'No items pending moderation.',
  },
  colEntity: { ru: 'Объект', kz: 'Нысан', en: 'Entity' },
  colRiskFlags: { ru: 'Флаги риска', kz: 'Тәуекел белгілері', en: 'Risk Flags' },
  colScore: { ru: 'Балл', kz: 'Балл', en: 'Score' },
  colIdentifier: { ru: 'Идентификатор', kz: 'Идентификатор', en: 'Identifier' },
  colSubmitted: { ru: 'Отправлено', kz: 'Жіберілді', en: 'Submitted' },
  colActions: { ru: 'Действия', kz: 'Әрекеттер', en: 'Actions' },
  colTimestamp: { ru: 'Время', kz: 'Уақыт', en: 'Timestamp' },
  colActor: { ru: 'Действующее лицо', kz: 'Әрекет етуші', en: 'Actor' },
  colType: { ru: 'Тип', kz: 'Түрі', en: 'Type' },
  colAction: { ru: 'Действие', kz: 'Әрекет', en: 'Action' },
  colReason: { ru: 'Причина', kz: 'Себеп', en: 'Reason' },
  colUser: { ru: 'Пользователь', kz: 'Пайдаланушы', en: 'User' },
  colAmount: { ru: 'Сумма', kz: 'Сома', en: 'Amount' },
  colStatus: { ru: 'Статус', kz: 'Мәртебе', en: 'Status' },
  colDispute: { ru: 'Спор', kz: 'Дау', en: 'Dispute' },
  roomVerification: { ru: 'Проверка комнаты', kz: 'Бөлмені тексеру', en: 'Room verification' },
  memberVerification: {
    ru: 'Проверка участника',
    kz: 'Қатысушыны тексеру',
    en: 'Member verification',
  },
  confirmModerationItem: {
    ru: 'Подтвердите, что элемент прошёл модерацию.',
    kz: 'Элемент модерациядан өткенін растаңыз.',
    en: 'Confirm this item passes moderation review.',
  },
  rejectModerationItem: {
    ru: 'Отклонить элемент. Объект будет уведомлён.',
    kz: 'Элементті қабылдамау. Нысан хабарландырылады.',
    en: 'Reject this item. The entity will be notified.',
  },
  requestInfoModerationItem: {
    ru: 'Запросить дополнительную информацию у владельца или участника.',
    kz: 'Иесінен немесе қатысушыдан қосымша ақпарат сұрау.',
    en: 'Request additional information from the owner/member.',
  },
  comment: { ru: 'Комментарий', kz: 'Түсініктеме', en: 'Comment' },
  mandatoryActionReason: {
    ru: 'Обязательная причина действия (записывается в аудит)...',
    kz: 'Әрекеттің міндетті себебі (аудитке жазылады)...',
    en: 'Mandatory reason for this action (logged for audit)...',
  },
  actionRecordedAuditLogs: {
    ru: 'Это действие будет записано в журнал аудита администратора.',
    kz: 'Бұл әрекет әкімші аудит журналына жазылады.',
    en: 'This action will be recorded in admin audit logs.',
  },
  sendRequest: { ru: 'Отправить запрос', kz: 'Сұрау жіберу', en: 'Send Request' },
  reason: { ru: 'Причина', kz: 'Себеп', en: 'Reason' },
  reveal: { ru: 'Раскрыть', kz: 'Ашу', en: 'Reveal' },
  revealIdentifierReasonPrompt: {
    ru: 'Укажите причину просмотра полного идентификатора. Это записывается для аудита.',
    kz: 'Толық идентификаторды көру себебін көрсетіңіз. Бұл аудит үшін жазылады.',
    en: 'Provide a reason for viewing the full identifier. This is logged for audit compliance.',
  },
  reasonPlaceholderModeration: {
    ru: 'напр., Проверка личности для модерации',
    kz: 'мыс., Модерация үшін жеке басын тексеру',
    en: 'e.g., Verifying identity for moderation',
  },
  revealActionLogged: {
    ru: 'Действие раскрытия записано',
    kz: 'Ашу әрекеті жазылды',
    en: 'Reveal action logged',
  },

  // ===== Admin: logs =====
  auditTrailSubtitle: {
    ru: 'Полный журнал аудита всех действий администраторов и поддержки',
    kz: 'Әкімшілер мен қолдау әрекеттерінің толық аудит журналы',
    en: 'Complete audit trail of all admin and support actions',
  },
  immutableAuditLog: {
    ru: 'Неизменяемый журнал аудита',
    kz: 'Өзгермейтін аудит журналы',
    en: 'Immutable audit log',
  },

  // ===== Admin: rooms =====
  selectRoomToView: {
    ru: 'Выберите комнату для просмотра деталей',
    kz: 'Деректерді көру үшін бөлмені таңдаңыз',
    en: 'Select a room to view details',
  },
  seats: { ru: 'Слоты', kz: 'Орындар', en: 'Seats' },
  seatsLower: { ru: 'мест', kz: 'орын', en: 'seats' },
  startLabel: { ru: 'Старт', kz: 'Басталуы', en: 'Start' },
  ownerIdLabel: { ru: 'ID владельца', kz: 'Иесінің ID', en: 'Owner ID' },
  reasonRequired: { ru: 'Требуется причина', kz: 'Себеп қажет', en: 'Reason required' },
  blockRoom: { ru: 'Заблокировать комнату', kz: 'Бөлмені бұғаттау', en: 'Block Room' },
  unblockRoom: { ru: 'Разблокировать комнату', kz: 'Бөлмені бұғаттан шығару', en: 'Unblock Room' },
  roomEventLog: {
    ru: 'Журнал событий комнаты',
    kz: 'Бөлме оқиғалар журналы',
    en: 'Room Event Log',
  },
  risk: { ru: 'Риск', kz: 'Тәуекел', en: 'Risk' },
  blockRoomConfirm: {
    ru: 'Блокировка комнаты остановит всю активность. Активные участники будут уведомлены.',
    kz: 'Бөлмені бұғаттау барлық белсенділікті тоқтатады. Белсенді қатысушылар хабарландырылады.',
    en: 'Blocking this room will prevent all activity. Active members will be notified.',
  },
  unblockRoomConfirm: {
    ru: 'Разблокировка восстановит комнату в её прежнее активное состояние.',
    kz: 'Бұғаттан шығару бөлмені бұрынғы белсенді күйіне қайтарады.',
    en: 'Unblocking will restore the room to its previous active state.',
  },
  mandatoryReasonAudit: {
    ru: 'Обязательная причина (записывается в аудит)...',
    kz: 'Міндетті себеп (аудитке жазылады)...',
    en: 'Mandatory reason (audit logged)...',
  },
  actionRecordedAuditLog: {
    ru: 'Действие записано в журнал аудита администратора.',
    kz: 'Әрекет әкімші аудит журналына жазылды.',
    en: 'Action recorded in admin audit log.',
  },
  provideReasonAuditLogged: {
    ru: 'Укажите причину. Это действие записывается в аудит.',
    kz: 'Себепті көрсетіңіз. Бұл әрекет аудитке жазылады.',
    en: 'Provide a reason. This action is audit-logged.',
  },
  reasonPlaceholder: { ru: 'Причина...', kz: 'Себеп...', en: 'Reason...' },

  // ===== Admin: users =====
  selectUserToView: {
    ru: 'Выберите пользователя для просмотра деталей',
    kz: 'Деректерді көру үшін пайдаланушыны таңдаңыз',
    en: 'Select a user to view details',
  },
  bannedBadge: { ru: 'ЗАБЛОКИРОВАН', kz: 'БҰҒАТТАЛҒАН', en: 'BANNED' },
  owned: { ru: 'Владеет', kz: 'Иелігінде', en: 'Owned' },
  joinedCount: { ru: 'Вступления', kz: 'Қосылулар', en: 'Joined' },
  sinceLabel: { ru: 'С', kz: 'Бері', en: 'Since' },
  reasonRequiredAuditLogged: {
    ru: 'Требуется причина · Записывается в аудит',
    kz: 'Себеп қажет · Аудитке жазылады',
    en: 'Reason required · Audit logged',
  },
  banUserConfirm: {
    ru: 'Блокировка отключит возможность пользователя создавать комнаты и вступать в них.',
    kz: 'Бұғаттау пайдаланушының бөлме жасау және оларға қосылу мүмкіндігін өшіреді.',
    en: "Banning will disable the user's ability to create/join rooms.",
  },
  unbanUserConfirm: {
    ru: 'Разблокировка восстановит полный доступ.',
    kz: 'Бұғаттан шығару толық қатынасты қалпына келтіреді.',
    en: 'Unbanning restores full access.',
  },
  mandatoryAuditLogged: {
    ru: 'Обязательно (записывается в аудит)...',
    kz: 'Міндетті (аудитке жазылады)...',
    en: 'Mandatory (audit logged)...',
  },
  auditLoggedShort: { ru: 'Записано в аудит.', kz: 'Аудитке жазылды.', en: 'Audit logged.' },
  provideReasonAuditLoggedShort: {
    ru: 'Укажите причину. Записывается в аудит.',
    kz: 'Себепті көрсетіңіз. Аудитке жазылады.',
    en: 'Provide reason. Audit logged.',
  },

  // ===== Admin: tickets =====
  ticketsSupportView: {
    ru: 'Заявки (поддержка)',
    kz: 'Өтінімдер (қолдау)',
    en: 'Tickets (Support View)',
  },
  escalatedBadge: { ru: 'Эскалировано', kz: 'Күшейтілген', en: 'Escalated' },
  selectTicket: { ru: 'Выберите заявку', kz: 'Өтінімді таңдаңыз', en: 'Select a ticket' },
  noRoom: { ru: 'Без комнаты', kz: 'Бөлмесіз', en: 'No room' },
  escalateToDispute: { ru: 'Эскалировать в спор', kz: 'Дауға күшейту', en: 'Escalate to Dispute' },
  escalatedToDisputeReview: {
    ru: 'Эскалировано в рассмотрение спора',
    kz: 'Дау қарастыруына күшейтілді',
    en: 'Escalated to dispute review',
  },
  replyAsSupport: {
    ru: 'Ответить как поддержка...',
    kz: 'Қолдау атынан жауап беру...',
    en: 'Reply as Support...',
  },
  escalateDisputeConfirm: {
    ru: 'Это создаст спор и уведомит пользователя и команду администраторов.',
    kz: 'Бұл дау жасап, пайдаланушы мен әкімшілер тобын хабарландырады.',
    en: 'This will create a dispute and notify the user and admin team.',
  },
  escalationReasonPlaceholder: {
    ru: 'Причина эскалации (записывается в аудит)...',
    kz: 'Күшейту себебі (аудитке жазылады)...',
    en: 'Escalation reason (audit logged)...',
  },
  escalate: { ru: 'Эскалировать', kz: 'Күшейту', en: 'Escalate' },
  supportLabel: { ru: 'Поддержка', kz: 'Қолдау', en: 'Support' },
  adminLabelRole: { ru: 'Администратор', kz: 'Әкімші', en: 'Admin' },

  // ===== Admin: disputes & refunds =====
  selectDispute: { ru: 'Выберите спор', kz: 'Дауды таңдаңыз', en: 'Select a dispute' },
  fromTicket: {
    ru: 'Из заявки {{ticket}}',
    kz: '{{ticket}} өтінімінен',
    en: 'From ticket {{ticket}}',
  },
  createdLabel: { ru: 'Создан', kz: 'Жасалған', en: 'Created' },
  summaryLabel: { ru: 'Резюме', kz: 'Түйіндеме', en: 'Summary' },
  evidenceAttachments: {
    ru: 'Прикреплённые доказательства',
    kz: 'Тіркелген дәлелдемелер',
    en: 'Evidence Attachments',
  },
  favorRespondent: {
    ru: 'В пользу ответчика',
    kz: 'Жауапкердің пайдасына',
    en: 'Favor Respondent',
  },
  process: { ru: 'Обработать', kz: 'Өңдеу', en: 'Process' },
  retry: { ru: 'Повторить', kz: 'Қайталау', en: 'Retry' },
  idempotencyLabel: { ru: 'Идемпотентность:', kz: 'Идемпотенттік:', en: 'Idempotency:' },
  idempotencyNote: {
    ru: 'Каждый возврат привязан к уникальному ID намерения. Повтор неудачного возврата использует то же намерение, чтобы избежать дублирования. Все действия с возвратами записываются в аудит.',
    kz: 'Әр қайтару бірегей ниет ID-мен байланысты. Сәтсіз қайтаруды қайталау қосарлануды болдырмау үшін сол ниетті қайта пайдаланады. Барлық қайтару әрекеттері аудитке жазылады.',
    en: 'Each refund is tied to a unique intent ID. Retrying a failed refund reuses the same intent to prevent duplicate processing. All refund actions are audit-logged.',
  },
  favorClaimantDesc: {
    ru: 'Решение в пользу заявителя. Может быть инициирован возврат.',
    kz: 'Өтініш беруші пайдасына шешім. Қайтару басталуы мүмкін.',
    en: 'Ruling in favor of the claimant. A refund may be initiated.',
  },
  favorRespondentDesc: {
    ru: 'Решение в пользу ответчика. Возврат не будет произведён.',
    kz: 'Жауапкер пайдасына шешім. Қайтару жасалмайды.',
    en: 'Ruling in favor of the respondent. No refund will be issued.',
  },
  decisionRationalePlaceholder: {
    ru: 'Обоснование решения (обязательно, записывается в аудит)...',
    kz: 'Шешім негіздемесі (міндетті, аудитке жазылады)...',
    en: 'Decision rationale (mandatory, audit logged)...',
  },
  decisionRecorded: {
    ru: 'Решение записано без возможности изменения.',
    kz: 'Шешім өзгертілмейтіндей жазылды.',
    en: 'Decision permanently recorded.',
  },
  confirmDecision: { ru: 'Подтвердить решение', kz: 'Шешімді растау', en: 'Confirm Decision' },
  processRefund: { ru: 'Обработать возврат', kz: 'Қайтаруды өңдеу', en: 'Process Refund' },
  refundStubNote: {
    ru: 'Это заглушка. В продакшене это вызывает API платёжного процессора с указанным выше ID намерения.',
    kz: 'Бұл — үлгі. Өндірісте бұл жоғарыдағы ниет ID-мен төлем процессоры API-ын іске қосады.',
    en: 'This is a stub. In production, this triggers the payment processor API with the intent ID above.',
  },
  initiateRefund: { ru: 'Инициировать возврат', kz: 'Қайтаруды бастау', en: 'Initiate Refund' },
  intentIdLabel: { ru: 'ID намерения', kz: 'Ниет ID', en: 'Intent ID' },
  refundIdLabel: { ru: 'ID возврата', kz: 'Қайтару ID', en: 'Refund ID' },
  disputesTab: { ru: 'Споры', kz: 'Даулар', en: 'Disputes' },
  refundsTab: { ru: 'Возвраты', kz: 'Қайтарулар', en: 'Refunds' },

  // ===== Auth: register =====
  pwMin8: { ru: 'Минимум 8 символов', kz: 'Кемінде 8 таңба', en: 'Min 8 characters' },
  pwUppercase: { ru: 'Одна заглавная буква', kz: 'Бір бас әріп', en: 'One uppercase letter' },
  pwOneNumber: { ru: 'Одна цифра', kz: 'Бір сан', en: 'One number' },
  unableToCreateAccount: {
    ru: 'Не удалось создать аккаунт. Попробуйте позже.',
    kz: 'Тіркелгі жасау мүмкін болмады. Кейінірек көріңіз.',
    en: 'Unable to create the account right now.',
  },

  // ===== Catalog: home =====
  unableToLoadCatalog: {
    ru: 'Не удалось загрузить каталог.',
    kz: 'Каталогты жүктеу мүмкін болмады.',
    en: 'Unable to load the live catalog right now.',
  },
  splitDigitalServicesTeaser: {
    ru: 'Делитесь стримингом, музыкой и AI-инструментами — запуск позже в 2026 году',
    kz: 'Стриминг, музыка және AI құралдарын бөлісіңіз — 2026 жылы кейінірек іске қосылады',
    en: 'Split streaming, music, AI tools — launching later in 2026',
  },
  bundleIncludesInternet: {
    ru: 'Пакет включает домашний интернет',
    kz: 'Топтамаға үй интернеті кіреді',
    en: 'Bundle includes home internet',
  },
  promoFirstMonth: {
    ru: 'Промо-цена в первый месяц',
    kz: 'Бірінші айда промо-баға',
    en: 'Promo price first month',
  },

  // ===== Catalog: operator =====
  operatorNotFound: {
    ru: 'Оператор не найден.',
    kz: 'Оператор табылмады.',
    en: 'Operator not found.',
  },
  unableToLoadOperator: {
    ru: 'Не удалось загрузить данные оператора.',
    kz: 'Оператор деректерін жүктеу мүмкін болмады.',
    en: 'Unable to load operator details right now.',
  },
  loadingOperator: {
    ru: 'Загрузка данных оператора...',
    kz: 'Оператор деректері жүктелуде...',
    en: 'Loading operator details...',
  },
  operatorUnavailable: {
    ru: 'Оператор недоступен',
    kz: 'Оператор қолжетімсіз',
    en: 'Operator unavailable',
  },
  operatorCouldNotLoad: {
    ru: 'Этого оператора не удалось загрузить.',
    kz: 'Бұл операторды жүктеу мүмкін болмады.',
    en: 'This operator could not be loaded.',
  },
  noFamilyGroupPlans: {
    ru: 'Нет семейных или групповых тарифов',
    kz: 'Отбасылық немесе топтық тарифтер жоқ',
    en: 'No family/group plans available',
  },
  plansOpenRooms: {
    ru: '{{plans}} тарифов · {{rooms}} открытых комнат',
    kz: '{{plans}} тариф · {{rooms}} ашық бөлме',
    en: '{{plans}} plans · {{rooms}} open rooms',
  },
  noShareableTariffs: {
    ru: '{{operator}} сейчас не предоставляет тарифов для совместного использования.',
    kz: '{{operator}} қазір бірлескен пайдалануға тарифтер ұсынбайды.',
    en: "{{operator}} doesn't currently expose any shareable tariffs.",
  },
  tabPlans: { ru: 'Тарифы', kz: 'Тарифтер', en: 'Plans' },
  colTotalPerPeriod: { ru: 'Всего / период', kz: 'Барлығы / кезең', en: 'Total / period' },
  colPerMember: { ru: 'За участника', kz: 'Қатысушыға', en: 'Per member' },
  connection: { ru: 'Подключение', kz: 'Қосылым', en: 'Connection' },
  allPrices: { ru: 'Все цены', kz: 'Барлық бағалар', en: 'All prices' },
  priceUnder3000: { ru: 'До ₸3,000', kz: '₸3,000-ге дейін', en: 'Under ₸3,000' },
  priceMid: { ru: '₸3,000–₸5,000', kz: '₸3,000–₸5,000', en: '₸3,000–₸5,000' },
  priceOver5000: { ru: 'Свыше ₸5,000', kz: '₸5,000-нан жоғары', en: 'Over ₸5,000' },
  noMatchingRooms: {
    ru: 'Нет подходящих комнат',
    kz: 'Сәйкес бөлмелер жоқ',
    en: 'No matching rooms',
  },
  noMatchingRoomsDesc: {
    ru: 'Попробуйте другой фильтр цены или создайте новую комнату позже.',
    kz: 'Басқа баға сүзгісін қолданып көріңіз немесе кейінірек жаңа бөлме жасаңыз.',
    en: 'Try another price filter or create a new room later.',
  },
  maxMembersCount: {
    ru: 'Макс. {{count}} участников',
    kz: 'Макс. {{count}} қатысушы',
    en: 'Max {{count}} members',
  },
  ownerColon: { ru: 'Владелец: {{name}}', kz: 'Иесі: {{name}}', en: 'Owner: {{name}}' },
  tbd: { ru: 'Уточняется', kz: 'Анықталады', en: 'TBD' },

  // ===== Rooms: my-rooms =====
  tabJoined: { ru: 'Участвую', kz: 'Қатысамын', en: 'Joined' },
  tabCreated: { ru: 'Создал', kz: 'Жасадым', en: 'Created' },
  filters: { ru: 'Фильтры', kz: 'Сүзгілер', en: 'Filters' },
  allStatuses: { ru: 'Все статусы', kz: 'Барлық мәртебелер', en: 'All statuses' },
  allOperators: { ru: 'Все операторы', kz: 'Барлық операторлар', en: 'All operators' },
  clearFilters: { ru: 'Сбросить фильтры', kz: 'Сүзгілерді тазалау', en: 'Clear filters' },
  noRoomsFound: { ru: 'Комнаты не найдены', kz: 'Бөлмелер табылмады', en: 'No Rooms Found' },
  noRoomsJoinedDesc: {
    ru: 'Нет комнат по вашим фильтрам. Измените фильтры или найдите комнату в каталоге.',
    kz: 'Сүзгілерге сәйкес бөлмелер жоқ. Сүзгілерді өзгертіңіз немесе каталогтан бөлме табыңыз.',
    en: 'No rooms match your filters. Try adjusting or browse the catalog to join a room.',
  },
  noRoomsCreatedDesc: {
    ru: 'Нет комнат по вашим фильтрам. Создайте комнату, чтобы начать делиться тарифом.',
    kz: 'Сүзгілерге сәйкес бөлмелер жоқ. Тарифті бөлісу үшін бөлме жасаңыз.',
    en: 'No rooms match your filters. Create a room to start sharing a plan.',
  },
  viewDetailsAction: { ru: 'Подробнее', kz: 'Толығырақ', en: 'View details' },
  manage: { ru: 'Управлять', kz: 'Басқару', en: 'Manage' },
  pendingCount: { ru: '{{count}} в ожидании', kz: '{{count}} күтуде', en: '{{count}} pending' },
  perMonthShort: { ru: '/мес', kz: '/ай', en: '/mo' },
  perMemberMonth: { ru: '/мес за участника', kz: '/ай қатысушыға', en: '/mo per member' },

  // ===== Rooms: error states =====
  roomIsFull: { ru: 'Комната заполнена', kz: 'Бөлме толды', en: 'Room is Full' },
  roomFullDescLong: {
    ru: 'Все места в этой комнате заняты. Вы можете посмотреть похожие тарифы или создать свою комнату.',
    kz: 'Бұл бөлмедегі барлық орындар толды. Ұқсас тарифтерді қарай аласыз немесе өз бөлмеңізді жасай аласыз.',
    en: 'All seats in this room have been filled. You can browse similar plans or create your own room.',
  },
  roomDetailsLabel: { ru: 'Детали комнаты', kz: 'Бөлме деректері', en: 'Room details' },
  seatsFull: { ru: '4/4 (заполнено)', kz: '4/4 (толы)', en: '4/4 (full)' },
  browseCatalog: { ru: 'Смотреть каталог', kz: 'Каталогты қарау', en: 'Browse Catalog' },
  createYourOwnRoom: {
    ru: 'Создать свою комнату',
    kz: 'Өз бөлмеңізді жасау',
    en: 'Create Your Own Room',
  },
  paymentCouldNotProcess: {
    ru: 'Ваш платёж не удалось обработать. Ваша заявка ещё активна — вы можете повторить с тем же платёжным намерением.',
    kz: 'Төлеміңізді өңдеу мүмкін болмады. Өтініміңіз әлі белсенді — сол төлем ниетімен қайталай аласыз.',
    en: 'Your payment could not be processed. Your application is still active — you can retry using the same payment intent.',
  },
  paymentDetails: { ru: 'Детали платежа', kz: 'Төлем деректері', en: 'Payment details' },
  insufficientFunds: {
    ru: 'Недостаточно средств',
    kz: 'Қаражат жеткіліксіз',
    en: 'Insufficient funds',
  },
  retryPaymentAction: { ru: 'Повторить оплату', kz: 'Төлемді қайталау', en: 'Retry Payment' },
  paymentIntentValid24h: {
    ru: 'Платёжное намерение действует 24 часа. Двойного списания не будет.',
    kz: 'Төлем ниеті 24 сағат жарамды. Қос есептен шығару болмайды.',
    en: 'Your payment intent remains valid for 24 hours. No duplicate charges will occur.',
  },
  roomBlockedTitle: { ru: 'Комната заблокирована', kz: 'Бөлме бұғатталды', en: 'Room Blocked' },
  roomBlockedDescLong: {
    ru: 'Эта комната заблокирована администратором после проверки. Все активные участники получат инструкции по возврату.',
    kz: 'Бұл бөлмені әкімші тексеруден кейін бұғаттады. Барлық белсенді қатысушылар қайтару нұсқауларын алады.',
    en: 'This room has been blocked by an administrator following a review. All active members will receive refund instructions.',
  },
  detailsLabel: { ru: 'Детали', kz: 'Мәліметтер', en: 'Details' },
  blockedOn: { ru: 'Заблокировано', kz: 'Бұғатталды', en: 'Blocked on' },
  adminDecisionPendingReview: {
    ru: 'Решение администратора — на рассмотрении',
    kz: 'Әкімші шешімі — қарастырылуда',
    en: 'Admin decision — pending review',
  },
  roomBlockedSupportNote: {
    ru: 'Если вы считаете это ошибкой, обратитесь в поддержку. Возвраты активным участникам обрабатываются в течение 5–7 рабочих дней.',
    kz: 'Бұны қате деп санасаңыз, қолдау қызметіне хабарласыңыз. Белсенді қатысушыларға қайтарулар 5–7 жұмыс күні ішінде өңделеді.',
    en: 'If you believe this is an error, please contact our support team. Refunds for active members are processed within 5–7 business days.',
  },
  backToMyRooms: {
    ru: 'Назад к моим комнатам',
    kz: 'Менің бөлмелеріме оралу',
    en: 'Back to My Rooms',
  },

  // ===== Catalog: sorting & marketplace =====
  sortByLabel: { ru: 'Сортировка', kz: 'Сұрыптау', en: 'Sort by' },
  sortNameAsc: { ru: 'Название: А→Я', kz: 'Атау: А→Я', en: 'Name: A→Z' },
  sortNameDesc: { ru: 'Название: Я→А', kz: 'Атау: Я→А', en: 'Name: Z→A' },
  sortPriceAsc: { ru: 'Цена: по возрастанию', kz: 'Бағасы: өсу', en: 'Price: low to high' },
  sortPriceDesc: { ru: 'Цена: по убыванию', kz: 'Бағасы: кему', en: 'Price: high to low' },
  sortNewest: { ru: 'Сначала новые', kz: 'Алдымен жаңалары', en: 'Newest first' },
  marketplaceFromPrice: { ru: 'от', kz: 'бастап', en: 'from' },
  marketplaceNoTariffs: { ru: 'Тарифов пока нет', kz: 'Әзірге тарифтер жоқ', en: 'No tariffs yet' },
  marketplaceTariffsCount: {
    ru: '{{count}} тарифов',
    kz: '{{count}} тариф',
    en: '{{count}} tariffs',
  },
  marketplaceLoadFailed: {
    ru: 'Не удалось загрузить каталог',
    kz: 'Каталог жүктелмеді',
    en: 'Failed to load catalog',
  },
  marketplaceNoServices: {
    ru: 'Сервисы не найдены',
    kz: 'Сервистер табылмады',
    en: 'No services found',
  },

  // ===== Admin: Catalog =====
  adminCatalog: { ru: 'Каталог', kz: 'Каталог', en: 'Catalog' },
  catalogCategoriesTab: { ru: 'Категории', kz: 'Санаттар', en: 'Categories' },
  catalogServicesTab: { ru: 'Сервисы', kz: 'Сервистер', en: 'Services' },
  catalogTariffsTab: { ru: 'Тарифы', kz: 'Тарифтер', en: 'Tariffs' },
  catalogCreateCategory: { ru: 'Создать категорию', kz: 'Санат жасау', en: 'Create category' },
  catalogCreateService: { ru: 'Создать сервис', kz: 'Сервис жасау', en: 'Create service' },
  catalogCreateTariff: { ru: 'Создать тариф', kz: 'Тариф жасау', en: 'Create tariff' },
  catalogEdit: { ru: 'Изменить', kz: 'Өзгерту', en: 'Edit' },
  catalogDelete: { ru: 'Удалить', kz: 'Жою', en: 'Delete' },
  catalogActive: { ru: 'Активно', kz: 'Белсенді', en: 'Active' },
  catalogInactive: { ru: 'Неактивно', kz: 'Белсенді емес', en: 'Inactive' },
  catalogPickCategory: { ru: 'Выберите категорию', kz: 'Санатты таңдаңыз', en: 'Pick a category' },
  catalogPickService: { ru: 'Выберите сервис', kz: 'Сервисті таңдаңыз', en: 'Pick a service' },
  catalogConfirmDelete: {
    ru: 'Подтвердите деактивацию',
    kz: 'Өшіруді растаңыз',
    en: 'Confirm deactivation',
  },
  catalogFieldName: { ru: 'Название', kz: 'Атауы', en: 'Name' },
  catalogFieldSlug: { ru: 'Slug (автогенерация)', kz: 'Slug (автоматты)', en: 'Slug (auto)' },
  catalogFieldSortOrder: { ru: 'Порядок сортировки', kz: 'Сұрыптау реті', en: 'Sort order' },
  catalogFieldProviderType: { ru: 'Тип провайдера', kz: 'Провайдер түрі', en: 'Provider type' },
  catalogFieldPeriodType: { ru: 'Период', kz: 'Кезең', en: 'Period type' },
  catalogFieldMaxMembers: { ru: 'Макс. участников', kz: 'Макс. қатысушылар', en: 'Max members' },
  catalogFieldBasePrice: { ru: 'Цена тарифа', kz: 'Тариф бағасы', en: 'Base price total' },
  catalogFieldCurrency: { ru: 'Валюта', kz: 'Валюта', en: 'Currency' },
  catalogFieldConnectionType: { ru: 'Тип подключения', kz: 'Қосылым түрі', en: 'Connection type' },
  catalogFieldOperatorRules: {
    ru: 'Правила оператора',
    kz: 'Оператор ережелері',
    en: 'Operator rules',
  },

  // ===== Service reviews =====
  serviceReviewsTitle: {
    ru: 'Отзывы участников',
    kz: 'Қатысушылар пікірлері',
    en: 'Member reviews',
  },
  serviceReviewMyTitle: {
    ru: 'Мой отзыв о EcoPay',
    kz: 'EcoPay туралы пікірім',
    en: 'My EcoPay review',
  },
  serviceReviewLeavePrompt: {
    ru: 'Оставьте отзыв о сервисе',
    kz: 'Сервис туралы пікір қалдырыңыз',
    en: 'Leave a review about the service',
  },
  serviceReviewModerationNote: {
    ru: 'Отзыв проходит модерацию перед показом на главной.',
    kz: 'Пікір басты бетке шығу алдында модерациядан өтеді.',
    en: 'Your review is moderated before appearing on the homepage.',
  },
  serviceReviewSubmit: { ru: 'Отправить отзыв', kz: 'Пікір жіберу', en: 'Submit review' },
  serviceReviewSave: { ru: 'Сохранить изменения', kz: 'Өзгерістерді сақтау', en: 'Save changes' },
  serviceReviewDelete: { ru: 'Удалить отзыв', kz: 'Пікірді жою', en: 'Delete review' },
  serviceReviewEdit: { ru: 'Изменить', kz: 'Өзгерту', en: 'Edit' },
  serviceReviewTextLabel: { ru: 'Текст отзыва', kz: 'Пікір мәтіні', en: 'Review text' },
  serviceReviewRatingLabel: { ru: 'Оценка', kz: 'Баға', en: 'Rating' },
  serviceReviewSignInPrompt: {
    ru: 'Войдите, чтобы оставить отзыв.',
    kz: 'Пікір қалдыру үшін кіріңіз.',
    en: 'Sign in to leave a review.',
  },
  serviceReviewFeaturedBadge: { ru: 'На главной', kz: 'Басты бетте', en: 'Featured' },
  serviceReviewExistsError: {
    ru: 'Вы уже оставляли отзыв.',
    kz: 'Сіз бұрын пікір қалдырғансыз.',
    en: 'You have already left a review.',
  },
  serviceReviewDeleteConfirm: {
    ru: 'Удалить ваш отзыв?',
    kz: 'Пікіріңізді жою керек пе?',
    en: 'Delete your review?',
  },

  // ===== Admin: Service reviews moderation =====
  adminServiceReviews: { ru: 'Отзывы о сервисе', kz: 'Сервис пікірлері', en: 'Service reviews' },
  adminServiceReviewsAll: { ru: 'Все', kz: 'Барлығы', en: 'All' },
  adminServiceReviewsFeatured: { ru: 'На главной', kz: 'Басты бетте', en: 'Featured' },
  adminServiceReviewsNotFeatured: {
    ru: 'Не на главной',
    kz: 'Басты бетте емес',
    en: 'Not featured',
  },
  adminServiceReviewFeatureToggle: {
    ru: 'Показывать на главной',
    kz: 'Басты бетте көрсету',
    en: 'Show on homepage',
  },
  adminServiceReviewOpenAuthor: {
    ru: 'Открыть профиль автора',
    kz: 'Автор профилін ашу',
    en: 'Open author profile',
  },
  adminServiceReviewEditTitle: {
    ru: 'Редактировать отзыв',
    kz: 'Пікірді өңдеу',
    en: 'Edit review',
  },
  adminServiceReviewDeleteConfirm: {
    ru: 'Удалить отзыв?',
    kz: 'Пікірді жою керек пе?',
    en: 'Delete this review?',
  },

  // ===== Admin: About / site content =====
  adminAboutNav: { ru: 'О нас', kz: 'Біз туралы', en: 'About' },
  adminAboutTitle: { ru: 'Страница «О нас»', kz: '«Біз туралы» беті', en: 'About page' },
  adminAboutHint: {
    ru: 'Содержимое отображается на публичной странице /about. Изменения логируются в аудит.',
    kz: 'Мазмұн /about ашық бетте көрсетіледі. Өзгерістер аудитке жазылады.',
    en: 'Content is shown on the public /about page. Changes are written to the audit log.',
  },
  adminAboutCompanyName: { ru: 'Название компании', kz: 'Компания атауы', en: 'Company name' },
  adminAboutPageTitle: { ru: 'Заголовок страницы', kz: 'Бет тақырыбы', en: 'Page title' },
  adminAboutMission: { ru: 'Миссия', kz: 'Миссия', en: 'Mission' },
  adminAboutDescription: { ru: 'Описание', kz: 'Сипаттама', en: 'Description' },
  adminAboutContactEmail: { ru: 'Контактный email', kz: 'Байланыс email', en: 'Contact email' },
  adminAboutContactPhone: {
    ru: 'Контактный телефон',
    kz: 'Байланыс телефоны',
    en: 'Contact phone',
  },
  adminAboutLastUpdated: { ru: 'Обновлено', kz: 'Жаңартылды', en: 'Last updated' },

  // ===== Public profile by hash & account =====
  publicProfileLink: {
    ru: 'Моя публичная ссылка',
    kz: 'Менің ашық сілтемем',
    en: 'My public link',
  },
  publicProfileCopy: { ru: 'Скопировать', kz: 'Көшіру', en: 'Copy' },
  publicProfileCopied: { ru: 'Скопировано', kz: 'Көшірілді', en: 'Copied' },
  publicProfileNotFound: {
    ru: 'Профиль не найден',
    kz: 'Профиль табылмады',
    en: 'Profile not found',
  },
  publicProfileSearchTitle: {
    ru: 'Найти пользователя',
    kz: 'Пайдаланушыны табу',
    en: 'Find a user',
  },
  publicProfileSearchHint: {
    ru: 'Вставьте публичную ссылку или хэш профиля.',
    kz: 'Ашық сілтемені немесе профиль хэшін қойыңыз.',
    en: 'Paste a public link or profile hash.',
  },
  publicProfileSearchGo: { ru: 'Открыть', kz: 'Ашу', en: 'Open' },
  deleteAccountTitle: {
    ru: 'Удалить аккаунт навсегда?',
    kz: 'Тіркелгіні мәңгілікке жою керек пе?',
    en: 'Delete account permanently?',
  },
  deleteAccountWarning: {
    ru: 'Аккаунт будет деактивирован, личные данные обезличены. Финансовые записи сохранятся для аудита.',
    kz: 'Тіркелгі өшіріліп, дербес деректер анонимдендіріледі. Қаржы жазбалары аудит үшін сақталады.',
    en: 'Your account will be deactivated and personal data anonymised. Financial records will be retained for audit.',
  },
  deleteAccountConfirm: {
    ru: 'Да, удалить аккаунт',
    kz: 'Иә, тіркелгіні жою',
    en: 'Yes, delete my account',
  },
  deleteAccountFailed: {
    ru: 'Не удалось удалить аккаунт.',
    kz: 'Тіркелгіні жою мүмкін болмады.',
    en: 'Could not delete the account.',
  },

  // ===== Avatar upload =====
  avatarUpload: { ru: 'Загрузить аватар', kz: 'Аватарды жүктеу', en: 'Upload avatar' },
  avatarDelete: { ru: 'Удалить', kz: 'Жою', en: 'Remove' },
  avatarHint: {
    ru: 'PNG или JPEG, до 5 МБ',
    kz: 'PNG немесе JPEG, 5 МБ дейін',
    en: 'PNG or JPEG, up to 5 MB',
  },
  viewMyPublicProfile: {
    ru: 'Мой публичный профиль',
    kz: 'Менің ашық профилім',
    en: 'My public profile',
  },

  // ===== Dashboard chart =====
  dashboardSignups: { ru: 'Регистрации', kz: 'Тіркелулер', en: 'Registrations' },
  dashboardLogins: { ru: 'Входы', kz: 'Кірулер', en: 'Logins' },
  dashboardGranularity: { ru: 'Гранулярность', kz: 'Бөлшектік', en: 'Granularity' },
  dashboardGranularityMonth: { ru: 'Месяц', kz: 'Ай', en: 'Month' },
  dashboardGranularityDay: { ru: 'День', kz: 'Күн', en: 'Day' },
  dashboardRange: { ru: 'Период', kz: 'Кезең', en: 'Range' },
  dashboardRange12m: { ru: '12 месяцев', kz: '12 ай', en: '12 months' },
  dashboardRange30d: { ru: '30 дней', kz: '30 күн', en: '30 days' },
  dashboardChartTitle: {
    ru: 'Регистрации и входы',
    kz: 'Тіркелулер және кірулер',
    en: 'Registrations & logins',
  },
  dashboardMetricsLoadFailed: {
    ru: 'Не удалось загрузить метрики',
    kz: 'Метрикалар жүктелмеді',
    en: 'Failed to load metrics',
  },
  dashboardNewLast30d: {
    ru: 'Новых за 30 дней',
    kz: 'Соңғы 30 күнде жаңа',
    en: 'New in last 30 days',
  },

  // ===== Admin users — extras =====
  openPublicProfile: {
    ru: 'Открыть публичный профиль',
    kz: 'Ашық профильді ашу',
    en: 'Open public profile',
  },
  lastLoginLabel: { ru: 'Последний вход', kz: 'Соңғы кіру', en: 'Last login' },
  lastLoginNever: { ru: 'нет данных', kz: 'деректер жоқ', en: 'no data' },

  // ===== Catalog tariff features =====
  catalogFieldFeatures: {
    ru: 'Плюшки подписки',
    kz: 'Жазылым артықшылықтары',
    en: 'Subscription features',
  },
  catalogFeatureAdd: { ru: 'Добавить пункт', kz: 'Тармақ қосу', en: 'Add item' },
  catalogFeaturePlaceholder: {
    ru: 'Например: 4K, до 4 устройств',
    kz: 'Мысалы: 4K, 4 құрылғыға дейін',
    en: 'e.g. 4K, up to 4 devices',
  },
  catalogActiveToggle: { ru: 'Активность', kz: 'Белсенділік', en: 'Active' },

  // ===== Admin About — language tabs =====
  adminAboutLangKz: { ru: 'Қазақша', kz: 'Қазақша', en: 'Қазақша' },
  adminAboutLangRu: { ru: 'Русский', kz: 'Орысша', en: 'Русский' },
  adminAboutLangEn: { ru: 'English', kz: 'English', en: 'English' },
  adminAboutLangHint: {
    ru: 'Заполните вкладки для каждого языка. Пустые поля скрываются на публичной странице (откатываются на русский).',
    kz: 'Әр тіл үшін қойындыларды толтырыңыз. Бос өрістер жалпыға арналған бетте жасырылады (орысшаға қайтады).',
    en: 'Fill the tab for each language. Empty fields fall back to Russian on the public page.',
  },

  // ===== Feedback (user) =====
  feedbackTitle: { ru: 'Обратная связь', kz: 'Кері байланыс', en: 'Feedback' },
  feedbackIntro: {
    ru: 'Поделитесь жалобой, идеей или просьбой — мы прочитаем каждое обращение.',
    kz: 'Шағым, идея немесе өтінішпен бөлісіңіз — біз әрбір өтінімді оқимыз.',
    en: 'Share a complaint, idea, or request — we read every submission.',
  },
  feedbackTypeLabel: { ru: 'Тип обращения', kz: 'Өтініш түрі', en: 'Type' },
  feedbackTypeComplaint: { ru: 'Жалоба', kz: 'Шағым', en: 'Complaint' },
  feedbackTypeIdea: { ru: 'Идея', kz: 'Идея', en: 'Idea' },
  feedbackTypeRequest: { ru: 'Просьба', kz: 'Өтініш', en: 'Request' },
  feedbackSubjectLabel: {
    ru: 'Тема (необязательно)',
    kz: 'Тақырып (міндетті емес)',
    en: 'Subject (optional)',
  },
  feedbackSubjectPlaceholder: {
    ru: 'Кратко — о чём',
    kz: 'Қысқаша — не туралы',
    en: 'Briefly — what about',
  },
  feedbackMessageLabel: { ru: 'Сообщение', kz: 'Хабарлама', en: 'Message' },
  feedbackMessagePlaceholder: {
    ru: 'Опишите подробно, чтобы мы могли быстро разобраться.',
    kz: 'Тез шеше алатындай нақты сипаттаңыз.',
    en: 'Describe it clearly so we can help quickly.',
  },
  feedbackCharCount: {
    ru: '{{count}} / {{max}} символов',
    kz: '{{count}} / {{max}} таңба',
    en: '{{count}} / {{max}} characters',
  },
  feedbackSubmit: { ru: 'Отправить', kz: 'Жіберу', en: 'Send' },
  feedbackSubmitted: {
    ru: 'Спасибо! Ваше обращение принято.',
    kz: 'Рахмет! Өтінішіңіз қабылданды.',
    en: 'Thanks! Your message has been sent.',
  },
  feedbackRateLimited: {
    ru: 'Слишком много обращений. Попробуйте позже.',
    kz: 'Тым көп өтініш. Кейінірек көріңіз.',
    en: 'Too many submissions. Please try again later.',
  },
  feedbackRateLimitedRetryIn: {
    ru: 'Повторите через {{seconds}} с.',
    kz: '{{seconds}} секундтан кейін қайталаңыз.',
    en: 'Try again in {{seconds}}s.',
  },
  feedbackRetryInLabel: {
    ru: 'Подождите {{seconds}} с',
    kz: '{{seconds}} с күтіңіз',
    en: 'Wait {{seconds}}s',
  },
  feedbackSubmitFailed: {
    ru: 'Не удалось отправить. Попробуйте снова.',
    kz: 'Жіберу мүмкін болмады. Қайталап көріңіз.',
    en: "Couldn't send. Please try again.",
  },
  feedbackMessageEmpty: {
    ru: 'Сообщение не может быть пустым.',
    kz: 'Хабарлама бос болмауы керек.',
    en: "Message can't be empty.",
  },
  feedbackMessageTooLong: {
    ru: 'Слишком длинное сообщение.',
    kz: 'Хабарлама тым ұзақ.',
    en: 'Message is too long.',
  },
  feedbackMyList: { ru: 'Мои обращения', kz: 'Менің өтініштерім', en: 'My feedback' },
  feedbackMyListEmpty: {
    ru: 'Вы ещё ничего не отправляли.',
    kz: 'Сіз ештеңе жібермедіңіз.',
    en: "You haven't sent anything yet.",
  },
  feedbackStatusNew: { ru: 'Новое', kz: 'Жаңа', en: 'New' },
  feedbackStatusInReview: { ru: 'В работе', kz: 'Жұмыста', en: 'In review' },
  feedbackStatusResolved: { ru: 'Решено', kz: 'Шешілді', en: 'Resolved' },
  feedbackStatusDismissed: { ru: 'Отклонено', kz: 'Қабылданбады', en: 'Dismissed' },

  // ===== Feedback (admin) =====
  adminFeedbackNav: { ru: 'Обращения', kz: 'Өтініштер', en: 'Feedback' },
  adminFeedbackTitle: {
    ru: 'Обращения пользователей',
    kz: 'Пайдаланушы өтініштері',
    en: 'User feedback',
  },
  adminFeedbackSearchPlaceholder: {
    ru: 'Поиск по теме или тексту',
    kz: 'Тақырып немесе мәтін бойынша іздеу',
    en: 'Search subject or text',
  },
  adminFeedbackFilterType: { ru: 'Тип', kz: 'Түрі', en: 'Type' },
  adminFeedbackFilterStatus: { ru: 'Статус', kz: 'Мәртебе', en: 'Status' },
  adminFeedbackColAuthor: { ru: 'От кого', kz: 'Кімнен', en: 'Author' },
  adminFeedbackColType: { ru: 'Тип', kz: 'Түрі', en: 'Type' },
  adminFeedbackColSubject: { ru: 'Тема', kz: 'Тақырып', en: 'Subject' },
  adminFeedbackColDate: { ru: 'Дата', kz: 'Күні', en: 'Date' },
  adminFeedbackColStatus: { ru: 'Статус', kz: 'Мәртебе', en: 'Status' },
  adminFeedbackAllTypes: { ru: 'Все типы', kz: 'Барлық түрлері', en: 'All types' },
  adminFeedbackAllStatuses: { ru: 'Все статусы', kz: 'Барлық мәртебелер', en: 'All statuses' },
  adminFeedbackSelect: {
    ru: 'Выберите обращение из списка',
    kz: 'Тізімнен өтінішті таңдаңыз',
    en: 'Select a submission to view details',
  },
  adminFeedbackEmpty: {
    ru: 'Обращений не найдено.',
    kz: 'Өтініштер табылмады.',
    en: 'No feedback found.',
  },
  adminFeedbackAuthorAnon: { ru: 'Аноним', kz: 'Аноним', en: 'Anonymous' },
  adminFeedbackMessage: { ru: 'Сообщение', kz: 'Хабарлама', en: 'Message' },
  adminFeedbackAdminNote: { ru: 'Заметка администратора', kz: 'Әкімші жазбасы', en: 'Admin note' },
  adminFeedbackNotePlaceholder: {
    ru: 'Внутренний комментарий',
    kz: 'Ішкі түсініктеме',
    en: 'Internal note',
  },
  adminFeedbackSetStatus: { ru: 'Изменить статус', kz: 'Мәртебесін өзгерту', en: 'Change status' },
  adminFeedbackSaveChanges: {
    ru: 'Сохранить изменения',
    kz: 'Өзгерістерді сақтау',
    en: 'Save changes',
  },
  adminFeedbackUpdateFailed: {
    ru: 'Не удалось обновить.',
    kz: 'Жаңарту мүмкін болмады.',
    en: 'Update failed.',
  },

  // ===== Currency picker (create-room) =====
  currencyLabel: { ru: 'Валюта', kz: 'Валюта', en: 'Currency' },
  currencyKzt: { ru: 'Тенге (KZT, ₸)', kz: 'Теңге (KZT, ₸)', en: 'Tenge (KZT, ₸)' },
  currencyUsd: { ru: 'Доллар США (USD, $)', kz: 'АҚШ доллары (USD, $)', en: 'US Dollar (USD, $)' },
  currencyEur: { ru: 'Евро (EUR, €)', kz: 'Еуро (EUR, €)', en: 'Euro (EUR, €)' },
  currencyCny: { ru: 'Юань (CNY, ¥)', kz: 'Юань (CNY, ¥)', en: 'Yuan (CNY, ¥)' },
  currencyGbp: {
    ru: 'Фунт стерлингов (GBP, £)',
    kz: 'Фунт стерлинг (GBP, £)',
    en: 'Pound Sterling (GBP, £)',
  },
  currencyRub: { ru: 'Рубль (RUB, ₽)', kz: 'Рубль (RUB, ₽)', en: 'Ruble (RUB, ₽)' },
  currencyUzs: {
    ru: 'Узбекский сум (UZS, сум)',
    kz: 'Өзбек сомы (UZS, сум)',
    en: 'Uzbek Sum (UZS, soʼm)',
  },
  currencyKgs: {
    ru: 'Киргизский сом (KGS, сом)',
    kz: 'Қырғыз сомы (KGS, сом)',
    en: 'Kyrgyz Som (KGS, som)',
  },
  priceAmountLabel: { ru: 'Сумма', kz: 'Сома', en: 'Amount' },
  priceKztEquivalent: {
    ru: '≈ {{amount}} в тенге',
    kz: '≈ {{amount}} теңгеде',
    en: '≈ {{amount}} in tenge',
  },
  priceFxUnavailable: {
    ru: 'Курс валют недоступен',
    kz: 'Валюта курсы қолжетімсіз',
    en: 'FX rate unavailable',
  },
  priceFxUpdatedAt: {
    ru: 'Курсы обновлены: {{time}}',
    kz: 'Курстар жаңартылды: {{time}}',
    en: 'Rates updated: {{time}}',
  },

  // ===== Member dashboard =====
  memberDashboardTitle: { ru: 'Моя статистика', kz: 'Менің статистикам', en: 'My stats' },
  memberDashboardRefresh: { ru: 'Обновить', kz: 'Жаңарту', en: 'Refresh' },
  memberStatActiveRooms: { ru: 'Активные комнаты', kz: 'Белсенді бөлмелер', en: 'Active rooms' },
  memberStatCompletedRooms: {
    ru: 'Завершённые комнаты',
    kz: 'Аяқталған бөлмелер',
    en: 'Completed rooms',
  },
  memberStatTotalJoined: { ru: 'Всего комнат', kz: 'Барлық бөлмелер', en: 'Total rooms' },
  memberStatMonthlySpend: { ru: 'Расходы в месяц', kz: 'Айлық шығын', en: 'Monthly spend' },
  memberStatTotalSpent: { ru: 'Всего потрачено', kz: 'Барлық жұмсалғаны', en: 'Total spent' },
  memberStatTotalSaved: { ru: 'Сэкономлено', kz: 'Үнемделген', en: 'Total saved' },
  memberStatNextPayment: { ru: 'Ближайший платёж', kz: 'Жақын төлем', en: 'Next payment' },
  memberStatReputation: { ru: 'Репутация', kz: 'Репутация', en: 'Reputation' },
  memberStatReviewsReceived: {
    ru: 'Полученные отзывы',
    kz: 'Алынған пікірлер',
    en: 'Reviews received',
  },
  memberStatDisputes: { ru: 'Споры', kz: 'Даулар', en: 'Disputes' },
  memberSpendChartTitle: { ru: 'Динамика трат', kz: 'Шығын динамикасы', en: 'Spend over time' },
  memberRecentEvents: { ru: 'Последние события', kz: 'Соңғы оқиғалар', en: 'Recent events' },
  memberRecentEventsEmpty: {
    ru: 'Событий пока нет',
    kz: 'Әзірге оқиғалар жоқ',
    en: 'No events yet',
  },
  memberDashboardLoadFailed: {
    ru: 'Не удалось загрузить статистику',
    kz: 'Статистиканы жүктеу мүмкін болмады',
    en: 'Unable to load stats',
  },
  memberNoUpcomingPayment: {
    ru: 'Нет запланированных платежей',
    kz: 'Жоспарланған төлемдер жоқ',
    en: 'No upcoming payments',
  },

  // ===== Admin: dashboard — extended KPIs =====
  kpiUniqueVisitorsToday: {
    ru: 'Уникальные гости сегодня',
    kz: 'Бүгінгі бірегей қонақтар',
    en: 'Unique visitors today',
  },
  kpiUniqueVisitors30d: {
    ru: 'Уникальные гости за 30 дней',
    kz: '30 күндегі бірегей қонақтар',
    en: 'Unique visitors (30d)',
  },
  kpiPageViews30d: {
    ru: 'Просмотры за 30 дней',
    kz: '30 күндегі қаралымдар',
    en: 'Page views (30d)',
  },
  kpiConversion30d: {
    ru: 'Конверсия гость → регистрация',
    kz: 'Конверсия қонақ → тіркелу',
    en: 'Visitor → signup conversion',
  },
  kpiAvgRoomFill: {
    ru: 'Средняя заполняемость комнат',
    kz: 'Бөлмелердің орташа толтыруы',
    en: 'Avg room fill rate',
  },
  kpiAvgMembersPerRoom: {
    ru: 'В среднем участников на комнату',
    kz: 'Бөлмеге орташа қатысушылар',
    en: 'Avg members per room',
  },
  kpiActiveSubsValue: {
    ru: 'Стоимость активных подписок',
    kz: 'Белсенді жазылымдар құны',
    en: 'Active subscriptions value',
  },
  kpiNewRooms30d: {
    ru: 'Новые комнаты за 30 дней',
    kz: '30 күндегі жаңа бөлмелер',
    en: 'New rooms (30d)',
  },
  kpiRefundRate: { ru: 'Доля возвратов', kz: 'Қайтару үлесі', en: 'Refund rate' },
  kpiOpenTickets: { ru: 'Открытые тикеты', kz: 'Ашық тикеттер', en: 'Open tickets' },
  dashboardChartTrafficTitle: {
    ru: 'Трафик: уникальные гости и просмотры',
    kz: 'Трафик: бірегей қонақтар және қаралымдар',
    en: 'Traffic: unique visitors and page views',
  },
  dashboardChartNewRoomsTitle: { ru: 'Новые комнаты', kz: 'Жаңа бөлмелер', en: 'New rooms' },
  dashboardChartRevenueTitle: { ru: 'Выручка (KZT)', kz: 'Табыс (KZT)', en: 'Revenue (KZT)' },
  dashboardMetricUniqueVisitors: {
    ru: 'Уникальные гости',
    kz: 'Бірегей қонақтар',
    en: 'Unique visitors',
  },
  dashboardMetricPageViews: { ru: 'Просмотры', kz: 'Қаралымдар', en: 'Page views' },
  dashboardMetricNewRooms: { ru: 'Новые комнаты', kz: 'Жаңа бөлмелер', en: 'New rooms' },
  dashboardMetricRevenue: { ru: 'Выручка', kz: 'Табыс', en: 'Revenue' },
  dashboardSectionAudience: {
    ru: 'Аудитория и спрос',
    kz: 'Аудитория мен сұраныс',
    en: 'Audience & Demand',
  },
  dashboardSectionAudienceHint: {
    ru: 'Распределение комнат по операторам, валютам, категориям и статусам.',
    kz: 'Бөлмелердің операторлар, валюталар, санаттар және мәртебелер бойынша бөлінуі.',
    en: 'How rooms break down by operator, currency, category and status.',
  },
  refresh: { ru: 'Обновить', kz: 'Жаңарту', en: 'Refresh' },
  dashboardPopularServicesTitle: {
    ru: 'Популярные подписки',
    kz: 'Танымал жазылымдар',
    en: 'Popular subscriptions',
  },
  dashboardOperatorDistributionTitle: {
    ru: 'Распределение по операторам',
    kz: 'Операторлар бойынша бөлу',
    en: 'Operator distribution',
  },
  dashboardCurrencyDistributionTitle: {
    ru: 'Валюты комнат',
    kz: 'Бөлме валюталары',
    en: 'Room currencies',
  },
  dashboardCategoryDistributionTitle: { ru: 'Категории', kz: 'Санаттар', en: 'Categories' },
  dashboardRoomStatusDistributionTitle: {
    ru: 'Статусы комнат',
    kz: 'Бөлме мәртебелері',
    en: 'Room statuses',
  },
  dashboardMetricRooms: { ru: 'Комнаты', kz: 'Бөлмелер', en: 'Rooms' },
  dashboardMetricActiveMembers: {
    ru: 'Активные участники',
    kz: 'Белсенді қатысушылар',
    en: 'Active members',
  },
  dashboardEmptyChart: { ru: 'Нет данных', kz: 'Деректер жоқ', en: 'No data' },
  dashboardOtherSlice: { ru: 'Другое', kz: 'Басқа', en: 'Other' },
  dashboardCountryDistributionTitle: {
    ru: 'Распределение по странам',
    kz: 'Елдер бойынша бөлу',
    en: 'Country distribution',
  },
  kpiSectionOperations: { ru: 'Операции', kz: 'Операциялар', en: 'Operations' },
  kpiSectionFinance: { ru: 'Финансы', kz: 'Қаржы', en: 'Finance' },
  kpiSectionAudience: { ru: 'Аудитория', kz: 'Аудитория', en: 'Audience' },
  kpiSectionRooms: { ru: 'Комнаты', kz: 'Бөлмелер', en: 'Rooms' },
  kpiSectionUsers: { ru: 'Пользователи', kz: 'Пайдаланушылар', en: 'Users' },
  activeRoomsLabel: { ru: 'Активные комнаты', kz: 'Белсенді бөлмелер', en: 'Active rooms' },
  adminSearchLoading: { ru: 'Ищем…', kz: 'Іздеу…', en: 'Searching…' },
  adminSearchEmpty: { ru: 'Ничего не найдено', kz: 'Ештеңе табылмады', en: 'No results' },
  adminSearchGroupRooms: { ru: 'Комнаты', kz: 'Бөлмелер', en: 'Rooms' },
  adminSearchGroupUsers: { ru: 'Пользователи', kz: 'Пайдаланушылар', en: 'Users' },
  adminSearchGroupFeedback: { ru: 'Обращения', kz: 'Өтінімдер', en: 'Feedback' },

  // ===== Sign-in gates (e.g. /rooms for guests) =====
  signInToSeeRooms: {
    ru: 'Войдите, чтобы увидеть свои комнаты',
    kz: 'Бөлмелеріңізді көру үшін кіріңіз',
    en: 'Sign in to see your rooms',
  },
  signInToSeeRoomsDesc: {
    ru: 'После входа вы увидите список созданных и присоединённых комнат подписки.',
    kz: 'Кіргеннен кейін сіз жасаған және қосылған жазылым бөлмелерінің тізімін көресіз.',
    en: "Once signed in, you'll see all the subscription rooms you created or joined.",
  },

  // ===== Verification mode (room protection type) =====
  verificationModeRiskBased: {
    ru: 'Защита по риску',
    kz: 'Тәуекелге қарай қорғау',
    en: 'Risk-based protection',
  },
  verificationModeAuto: { ru: 'Авто-проверка', kz: 'Авто тексеру', en: 'Auto verification' },
  verificationModeAdminRequired: {
    ru: 'Проверка администратора',
    kz: 'Әкімші тексеруі',
    en: 'Admin verification',
  },

  // ===== Navbar typeahead (public catalog search) =====
  navbarSearchPlaceholder: { ru: 'Поиск планов…', kz: 'Жоспарларды іздеу…', en: 'Search plans…' },
  navbarSearchLoading: { ru: 'Ищем…', kz: 'Іздеу…', en: 'Searching…' },
  navbarSearchEmpty: { ru: 'Ничего не найдено', kz: 'Ештеңе табылмады', en: 'No results' },
  navbarSearchHint: {
    ru: 'Введите минимум 2 символа',
    kz: 'Кемінде 2 таңба енгізіңіз',
    en: 'Type at least 2 characters',
  },
  navbarSearchClose: { ru: 'Закрыть', kz: 'Жабу', en: 'Close' },

  // ===== News (home + admin) =====
  newsSectionTitle: { ru: 'Новости', kz: 'Жаңалықтар', en: 'News' },
  newsSectionSubtitle: {
    ru: 'Свежие обновления EcoPay — релизы, изменения и истории сообщества.',
    kz: 'EcoPay жаңартулары — релиздер, өзгерістер және қауымдастық оқиғалары.',
    en: 'Latest EcoPay updates — releases, changes, and community stories.',
  },
  newsReadMore: { ru: 'Читать', kz: 'Оқу', en: 'Read' },
  newsEmptyTitle: { ru: 'Новостей пока нет', kz: 'Әзірге жаңалықтар жоқ', en: 'No news yet' },
  newsEmptyDesc: {
    ru: 'Как только мы что-то опубликуем — оно появится здесь.',
    kz: 'Жариялаған кезде осында пайда болады.',
    en: 'When we publish something, it will appear here.',
  },
  newsLoadFailed: {
    ru: 'Не удалось загрузить новости',
    kz: 'Жаңалықтарды жүктеу мүмкін болмады',
    en: 'Failed to load news',
  },

  // ===== Admin: Create room shortcut =====
  adminCreateRoomNav: { ru: 'Создать комнату', kz: 'Бөлме жасау', en: 'Create room' },

  // ===== Admin: News =====
  adminNewsNav: { ru: 'Новости', kz: 'Жаңалықтар', en: 'News' },
  adminNewsTitle: { ru: 'Новости', kz: 'Жаңалықтар', en: 'News' },
  adminNewsHint: {
    ru: 'Управляйте новостями, видимыми на главной. Заполняйте все три языка — пустые откатываются на русский.',
    kz: 'Басты беттегі жаңалықтарды басқарыңыз. Барлық үш тілді толтырыңыз — бос өрістер орысшаға қайтады.',
    en: 'Manage news visible on the home page. Fill all three languages — empty ones fall back to Russian.',
  },
  adminNewsCreate: { ru: 'Новая новость', kz: 'Жаңа жаңалық', en: 'New post' },
  adminNewsEdit: { ru: 'Редактировать', kz: 'Өңдеу', en: 'Edit' },
  adminNewsDelete: { ru: 'Удалить', kz: 'Жою', en: 'Delete' },
  adminNewsDeleteConfirm: {
    ru: 'Удалить эту новость?',
    kz: 'Бұл жаңалықты жою керек пе?',
    en: 'Delete this post?',
  },
  adminNewsFieldTitle: { ru: 'Заголовок', kz: 'Тақырып', en: 'Title' },
  adminNewsFieldBody: { ru: 'Текст', kz: 'Мәтін', en: 'Body' },
  adminNewsFieldStatus: { ru: 'Статус', kz: 'Мәртебесі', en: 'Status' },
  adminNewsFieldSortOrder: { ru: 'Порядок', kz: 'Реті', en: 'Sort order' },
  adminNewsFieldImage: { ru: 'Изображение', kz: 'Сурет', en: 'Image' },
  adminNewsImageUpload: { ru: 'Загрузить', kz: 'Жүктеу', en: 'Upload' },
  adminNewsImageReplace: { ru: 'Заменить', kz: 'Ауыстыру', en: 'Replace' },
  adminNewsImageRemove: { ru: 'Убрать', kz: 'Алу', en: 'Remove' },
  adminNewsImageHint: {
    ru: 'PNG/JPG, до 5 МБ. Сначала сохраните пост, потом загрузите картинку.',
    kz: 'PNG/JPG, 5 МБ-қа дейін. Алдымен жазбаны сақтаңыз, содан кейін суретті жүктеңіз.',
    en: 'PNG/JPG, up to 5 MB. Save the post first, then upload an image.',
  },
  adminNewsStatusPublished: { ru: 'Опубликовано', kz: 'Жарияланды', en: 'Published' },
  adminNewsStatusDraft: { ru: 'Черновик', kz: 'Жоба', en: 'Draft' },
  adminNewsStatusArchived: { ru: 'В архиве', kz: 'Мұрағатта', en: 'Archived' },
  adminNewsCarouselTitle: {
    ru: 'Опубликованные новости',
    kz: 'Жарияланған жаңалықтар',
    en: 'Published news',
  },
  adminNewsCarouselEmpty: {
    ru: 'Пока нет опубликованных',
    kz: 'Әзірге жарияланғаны жоқ',
    en: 'No published items yet',
  },
  adminNewsCarouselNext: { ru: 'Вперёд', kz: 'Алға', en: 'Next' },
  adminNewsCarouselPrev: { ru: 'Назад', kz: 'Артқа', en: 'Back' },
  adminNewsListTitle: { ru: 'Все записи', kz: 'Барлық жазбалар', en: 'All posts' },
  adminNewsEmpty: { ru: 'Новостей ещё нет', kz: 'Жаңалықтар әлі жоқ', en: 'No news yet' },
  adminNewsListColTitle: { ru: 'Заголовок', kz: 'Тақырып', en: 'Title' },
  adminNewsListColStatus: { ru: 'Статус', kz: 'Мәртебесі', en: 'Status' },
  adminNewsListColSort: { ru: 'Порядок', kz: 'Реті', en: 'Order' },
  adminNewsListColUpdated: { ru: 'Обновлено', kz: 'Жаңартылды', en: 'Updated' },
  adminNewsFormCreate: { ru: 'Создать новость', kz: 'Жаңалық жасау', en: 'Create post' },
  adminNewsFormEdit: { ru: 'Редактирование', kz: 'Өңдеу', en: 'Editing' },
  adminNewsSaveSuccess: { ru: 'Сохранено', kz: 'Сақталды', en: 'Saved' },
  adminNewsDeleteSuccess: { ru: 'Удалено', kz: 'Жойылды', en: 'Deleted' },
  adminNewsImageRequired: {
    ru: 'Сначала сохраните новость — потом можно загрузить картинку.',
    kz: 'Алдымен жаңалықты сақтаңыз — содан кейін суретті жүктеуге болады.',
    en: 'Save the post first, then you can upload an image.',
  },
  adminNewsImageAtCreateHint: {
    ru: 'PNG/JPG/WebP, до 5 МБ. Картинка загрузится сразу после сохранения.',
    kz: 'PNG/JPG/WebP, 5 МБ-қа дейін. Сурет сақтаудан кейін жүктеледі.',
    en: 'PNG/JPG/WebP, up to 5 MB. The image uploads right after the post is saved.',
  },
  adminNewsImageInvalidType: {
    ru: 'Поддерживаются только PNG, JPG и WebP.',
    kz: 'Тек PNG, JPG және WebP қолдау табады.',
    en: 'Only PNG, JPG and WebP are supported.',
  },
  adminNewsImageTooBig: {
    ru: 'Файл больше 5 МБ — выберите поменьше.',
    kz: 'Файл 5 МБ-тан үлкен — кішірек таңдаңыз.',
    en: 'File is larger than 5 MB — please pick a smaller one.',
  },

  // ===== Admin catalog — service logo =====
  catalogFieldLogo: { ru: 'Логотип', kz: 'Логотип', en: 'Logo' },
  catalogLogoUpload: { ru: 'Загрузить логотип', kz: 'Логотипті жүктеу', en: 'Upload logo' },
  catalogLogoReplace: { ru: 'Заменить логотип', kz: 'Логотипті ауыстыру', en: 'Replace logo' },
  catalogLogoHint: {
    ru: 'PNG/JPG, до 5 МБ. Будет показан на карточке сервиса в каталоге.',
    kz: 'PNG/JPG, 5 МБ-қа дейін. Каталогтағы сервис карточкасында көрсетіледі.',
    en: 'PNG/JPG, up to 5 MB. Shown on the service tile in the catalog.',
  },
  catalogLogoAtCreateHint: {
    ru: 'PNG/JPG, до 5 МБ. Загрузится сразу после сохранения сервиса.',
    kz: 'PNG/JPG, 5 МБ-қа дейін. Сервис сақталғаннан кейін бірден жүктеледі.',
    en: 'PNG/JPG, up to 5 MB. Uploads right after the service is saved.',
  },
  catalogLogoInvalidType: {
    ru: 'Поддерживаются только PNG и JPG.',
    kz: 'Тек PNG және JPG қолдау табады.',
    en: 'Only PNG and JPG are supported.',
  },
  catalogLogoTooBig: {
    ru: 'Файл больше 5 МБ — выберите поменьше.',
    kz: 'Файл 5 МБ-тан үлкен — кішірек таңдаңыз.',
    en: 'File is larger than 5 MB — please pick a smaller one.',
  },

  // ===== FAQ extra (8–12 questions) =====
  faqSectionTitle: { ru: 'Частые вопросы', kz: 'Жиі сұрақтар', en: 'FAQ' },

  // ===== Ban event (realtime) =====
  bannedHeadline: { ru: 'Аккаунт заблокирован', kz: 'Тіркелгі бұғатталды', en: 'Account blocked' },
  bannedReasonLabel: { ru: 'Причина', kz: 'Себебі', en: 'Reason' },
  bannedAtLabel: { ru: 'Дата блокировки', kz: 'Бұғаттау уақыты', en: 'Blocked at' },
  bannedDescription: {
    ru: 'Доступ к аккаунту закрыт администрацией. Если вы считаете это ошибкой, обратитесь в поддержку.',
    kz: 'Әкімшілік тіркелгіге қолжетімділікті жапты. Бұны қате деп санасаңыз, қолдау қызметіне хабарласыңыз.',
    en: 'Administrators have blocked access to this account. Contact support if you believe this is a mistake.',
  },

  // ===== /privacy =====
  privacyHeroSubtitle: {
    ru: 'Конфиденциальность — наш приоритет. Вот как мы защищаем ваши данные.',
    kz: 'Құпиялылық — біздің басымдығымыз. Сіздің деректеріңізді қалай қорғайтынымызды осында оқыңыз.',
    en: "Your privacy is our priority. Here's how we protect your data.",
  },
  privacyLastUpdatedDate: {
    ru: 'Обновлено: 3 апреля 2026',
    kz: 'Жаңартылды: 2026 жылғы 3 сәуір',
    en: 'Last updated: April 3, 2026',
  },
  privacyPrinciplesHeading: {
    ru: 'Наши принципы конфиденциальности',
    kz: 'Біздің құпиялылық принциптеріміз',
    en: 'Our Privacy Principles',
  },
  privacyPrincipleEncryptionTitle: {
    ru: 'Ваши данные зашифрованы',
    kz: 'Деректеріңіз шифрланған',
    en: 'Your Data is Encrypted',
  },
  privacyPrincipleEncryptionDesc: {
    ru: 'Все персональные данные и платёжная информация шифруются при передаче и хранении по отраслевым стандартам.',
    kz: 'Барлық жеке және төлем деректері өнеркәсіптік стандарттарға сай тасымалдау және сақтау кезінде шифрланады.',
    en: 'All personal information and payment data is encrypted in transit and at rest using industry-standard protocols.',
  },
  privacyPrincipleNoContactTitle: {
    ru: 'Контакты не передаются',
    kz: 'Байланыс деректері берілмейді',
    en: 'No Contact Sharing',
  },
  privacyPrincipleNoContactDesc: {
    ru: 'Мы никогда не передаём ваш номер, e-mail или личные данные другим пользователям. Всё взаимодействие — через платформу.',
    kz: 'Біз сіздің телефон нөміріңізді, e-mail-ыңызды немесе жеке мәліметтеріңізді басқа пайдаланушыларға бермейміз. Барлық үйлестіру платформа арқылы өтеді.',
    en: 'We never share your phone number, email, or personal details with other users. All coordination happens through our platform.',
  },
  privacyPrincipleSupportOnlyTitle: {
    ru: 'Общение только через поддержку',
    kz: 'Қарым-қатынас тек қолдау арқылы',
    en: 'Support-Only Communication',
  },
  privacyPrincipleSupportOnlyDesc: {
    ru: 'Прямой переписки между пользователями нет. Все вопросы решаются через официальные заявки в поддержку, которые проверяет наша команда.',
    kz: 'Пайдаланушылар арасында тікелей хабар алмасу жоқ. Барлық сұрақтар біздің команда қарайтын ресми қолдау өтінімдері арқылы шешіледі.',
    en: 'There is no direct user-to-user messaging. All communication is handled through official support tickets monitored by our team.',
  },
  privacyPrincipleTransparentTitle: {
    ru: 'Прозрачное использование данных',
    kz: 'Деректерді мөлдір пайдалану',
    en: 'Transparent Data Usage',
  },
  privacyPrincipleTransparentDesc: {
    ru: 'Мы собираем только то, что необходимо для работы сервиса. Вы можете в любой момент запросить просмотр, экспорт или удаление своих данных.',
    kz: 'Біз қызмет жұмысы үшін қажетті деректерді ғана жинаймыз. Кез келген уақытта деректеріңізді көру, экспорттау немесе жою сұранысын жасай аласыз.',
    en: 'We only collect data necessary to provide our service. You can request to see, export, or delete your data at any time.',
  },
  privacyPrincipleMinimalTitle: {
    ru: 'Минимальный сбор данных',
    kz: 'Деректерді ең аз көлемде жинау',
    en: 'Minimal Data Collection',
  },
  privacyPrincipleMinimalDesc: {
    ru: 'Только необходимое: имя, e-mail, номер телефона и реквизиты платежа. Никакой истории браузера, отслеживания геолокации или сторонней аналитики.',
    kz: 'Тек қажеттісі: аты-жөні, e-mail, телефон нөмірі және төлем деректемелері. Шолғыш тарихы, геолокацияны бақылау немесе сыртқы аналитика жоқ.',
    en: 'We collect only essential information: name, email, phone number, and payment details. No browsing history, location tracking, or third-party analytics.',
  },
  privacyPrincipleComplianceTitle: {
    ru: 'Соответствие и защита',
    kz: 'Сәйкестік және қорғау',
    en: 'Compliance & Protection',
  },
  privacyPrincipleComplianceDesc: {
    ru: 'Мы соблюдаем требования законодательства Казахстана о защите данных и применяем международные передовые практики.',
    kz: 'Біз Қазақстанның дербес деректерді қорғау туралы талаптарын сақтаймыз және халықаралық озық тәжірибелерді қолданамыз.',
    en: 'We comply with Kazakhstan data protection regulations and international best practices to keep your information safe.',
  },

  privacyDataHeading: {
    ru: 'Какие данные мы собираем',
    kz: 'Қандай деректерді жинаймыз',
    en: 'What Data We Collect',
  },
  privacyDataAccountTitle: {
    ru: 'Данные аккаунта',
    kz: 'Тіркелгі деректері',
    en: 'Account Information',
  },
  privacyDataAccountItem1: { ru: 'Полное имя', kz: 'Толық аты-жөні', en: 'Full name' },
  privacyDataAccountItem2: { ru: 'Адрес e-mail', kz: 'E-mail мекенжайы', en: 'Email address' },
  privacyDataAccountItem3: { ru: 'Номер телефона', kz: 'Телефон нөмірі', en: 'Phone number' },
  privacyDataAccountItem4: {
    ru: 'Пароль (хешированный)',
    kz: 'Құпиясөз (хэштелген)',
    en: 'Password (hashed)',
  },

  privacyDataPaymentTitle: {
    ru: 'Платёжные данные',
    kz: 'Төлем деректері',
    en: 'Payment Information',
  },
  privacyDataPaymentItem1: {
    ru: 'Реквизиты способа оплаты',
    kz: 'Төлем тәсілінің деректемелері',
    en: 'Payment method details',
  },
  privacyDataPaymentItem2: {
    ru: 'История транзакций',
    kz: 'Транзакциялар тарихы',
    en: 'Transaction history',
  },
  privacyDataPaymentItem3: { ru: 'Платёжный адрес', kz: 'Төлем мекенжайы', en: 'Billing address' },

  privacyDataUsageTitle: {
    ru: 'Использование сервиса',
    kz: 'Қызметті пайдалану',
    en: 'Usage Data',
  },
  privacyDataUsageItem1: {
    ru: 'История участия в комнатах',
    kz: 'Бөлмелерге қатысу тарихы',
    en: 'Room participation history',
  },
  privacyDataUsageItem2: {
    ru: 'Записи заявок в поддержку',
    kz: 'Қолдау өтінімдерінің жазбалары',
    en: 'Support ticket records',
  },
  privacyDataUsageItem3: { ru: 'Активность входов', kz: 'Кіру белсенділігі', en: 'Login activity' },

  privacyDataTechnicalTitle: {
    ru: 'Технические данные',
    kz: 'Техникалық деректер',
    en: 'Technical Data',
  },
  privacyDataTechnicalItem1: { ru: 'IP-адрес', kz: 'IP-мекенжай', en: 'IP address' },
  privacyDataTechnicalItem2: { ru: 'Тип браузера', kz: 'Шолғыш түрі', en: 'Browser type' },
  privacyDataTechnicalItem3: {
    ru: 'Сведения об устройстве',
    kz: 'Құрылғы туралы мәліметтер',
    en: 'Device information',
  },

  privacyCommitmentsHeading: {
    ru: 'Ключевые обязательства',
    kz: 'Негізгі міндеттемелер',
    en: 'Key Commitments',
  },
  privacyCommitmentNoSellingLabel: { ru: 'Никаких продаж:', kz: 'Сатылмайды:', en: 'No selling:' },
  privacyCommitmentNoSellingDesc: {
    ru: 'Мы никогда не продаём ваши данные третьим сторонам.',
    kz: 'Біз сіздің деректеріңізді ешқашан үшінші тұлғаларға сатпаймыз.',
    en: 'We never sell your data to third parties.',
  },
  privacyCommitmentNoUserSharingLabel: {
    ru: 'Никакого обмена между пользователями:',
    kz: 'Пайдаланушылар арасында бөлісу жоқ:',
    en: 'No user-to-user sharing:',
  },
  privacyCommitmentNoUserSharingDesc: {
    ru: 'Ваши контактные данные никогда не передаются другим пользователям.',
    kz: 'Сіздің байланыс деректеріңіз ешқашан басқа пайдаланушыларға берілмейді.',
    en: 'Your contact information is never shared with other users.',
  },
  privacyCommitmentDeletionLabel: {
    ru: 'Право на удаление:',
    kz: 'Жою құқығы:',
    en: 'Right to deletion:',
  },
  privacyCommitmentDeletionDesc: {
    ru: 'Вы можете в любое время запросить удаление аккаунта и данных.',
    kz: 'Кез келген уақытта тіркелгі мен деректерді жоюды талап ете аласыз.',
    en: 'You can request account and data deletion at any time.',
  },
  privacyCommitmentPortabilityLabel: {
    ru: 'Переносимость данных:',
    kz: 'Деректердің тасымалдануы:',
    en: 'Data portability:',
  },
  privacyCommitmentPortabilityDesc: {
    ru: 'Вы можете экспортировать свои данные в стандартном формате.',
    kz: 'Деректеріңізді стандартты пішімде экспорттай аласыз.',
    en: 'You can export your data in a standard format.',
  },

  privacyContactHeading: {
    ru: 'Вопросы о конфиденциальности?',
    kz: 'Құпиялылық туралы сұрақтар бар ма?',
    en: 'Privacy Questions?',
  },
  privacyContactDescBefore: {
    ru: 'Если у вас есть вопросы об этой политике или том, как мы обращаемся с данными, напишите нам на ',
    kz: 'Осы саясат немесе деректерді қалай өңдейтініміз туралы сұрақтарыңыз болса, бізге хат жазыңыз: ',
    en: 'If you have questions about this privacy policy or how we handle your data, contact us at ',
  },
  privacyContactDescAfter: {
    ru: ' или через нашу систему поддержки.',
    kz: ' немесе қолдау жүйеміз арқылы хабарласыңыз.',
    en: ' or through our support system.',
  },

  // ===== /how-it-works =====
  howItWorksSubtitle: {
    ru: 'Присоединяйтесь к общим тарифам в четыре простых шага. Экономьте без лишних хлопот.',
    kz: 'Ортақ тарифтерге төрт қарапайым қадаммен қосылыңыз. Артық қиындықсыз үнемдеңіз.',
    en: 'Join shared telecom plans in four simple steps. Save money without the hassle.',
  },
  howItWorksStep1Title: {
    ru: 'Создайте или присоединитесь к комнате',
    kz: 'Бөлме құрыңыз немесе оған қосылыңыз',
    en: 'Create or Join a Room',
  },
  howItWorksStep1Desc: {
    ru: 'Изучите доступные общие тарифы по оператору (Beeline, Activ, Altel, Tele2, Kcell) и присоединитесь к существующей комнате — или создайте свою, если у вас есть семейный тариф, которым можно поделиться.',
    kz: 'Оператор бойынша қолжетімді ортақ тарифтерді (Beeline, Activ, Altel, Tele2, Kcell) қараңыз да, бар бөлмеге қосылыңыз немесе бөлісуге болатын отбасылық тарифіңіз болса, өзіңіздің бөлмеңізді құрыңыз.',
    en: 'Browse available shared plans by operator (Beeline, Activ, Altel, Tele2, Kcell) and join an existing room, or create your own if you have a family plan to share.',
  },
  howItWorksStep1Detail1: {
    ru: 'Выберите оператора и тариф',
    kz: 'Операторды және тарифті таңдаңыз',
    en: 'Pick your operator and plan',
  },
  howItWorksStep1Detail2: {
    ru: 'Посмотрите свободные места',
    kz: 'Бос орындарды көріңіз',
    en: 'See available slots',
  },
  howItWorksStep1Detail3: {
    ru: 'Мгновенное создание комнаты',
    kz: 'Бөлмені бірден құру',
    en: 'Instant room creation',
  },

  howItWorksStep2Title: {
    ru: 'Укажите идентификатор',
    kz: 'Идентификаторыңызды енгізіңіз',
    en: 'Enter Your Identifier',
  },
  howItWorksStep2Desc: {
    ru: 'Укажите телеком-идентификатор (номер телефона или ID аккаунта), чтобы владелец тарифа смог добавить вас. Контактные данные остаются приватными — передаются только проверенные идентификаторы.',
    kz: 'Телеком идентификаторыңызды (телефон нөмірі немесе тіркелгі ID-сі) енгізіңіз — иесі сізді тарифіне қоса алады. Байланыс деректеріңіз құпия қалады, тек тексерілген идентификаторлар ғана беріледі.',
    en: 'Provide your telecom identifier (phone number or account ID) so the plan owner can add you to their family plan. Your contact info stays private—only verified identifiers are shared.',
  },
  howItWorksStep2Detail1: {
    ru: 'Безопасная отправка идентификатора',
    kz: 'Идентификаторды қауіпсіз жіберу',
    en: 'Secure identifier submission',
  },
  howItWorksStep2Detail2: {
    ru: 'Без передачи личных контактов',
    kz: 'Жеке байланыс деректерін бермейміз',
    en: 'No personal contact sharing',
  },
  howItWorksStep2Detail3: {
    ru: 'Проверено платформой',
    kz: 'Платформа тексереді',
    en: 'Verified by platform',
  },

  howItWorksStep3Title: {
    ru: 'Оплатите свою долю',
    kz: 'Өз үлесіңізді төлеңіз',
    en: 'Pay Your Share',
  },
  howItWorksStep3Desc: {
    ru: 'Безопасно оплатите ежемесячную долю через платформу. Средства хранятся на эскроу-счёте и переводятся владельцу комнаты только после подтверждения активной услуги.',
    kz: 'Ай сайынғы үлесіңізді платформа арқылы қауіпсіз төлеңіз. Қаражат эскроу-шотта сақталып, қызмет белсенді екені расталғаннан кейін ғана бөлме иесіне аударылады.',
    en: 'Pay your monthly share securely through the platform. Payments are held in escrow and released to the room owner once service is confirmed active.',
  },
  howItWorksStep3Detail1: {
    ru: 'Безопасная обработка платежей',
    kz: 'Қауіпсіз төлемді өңдеу',
    en: 'Secure payment processing',
  },
  howItWorksStep3Detail2: {
    ru: 'Защита через эскроу',
    kz: 'Эскроу арқылы қорғау',
    en: 'Escrow protection',
  },
  howItWorksStep3Detail3: { ru: 'Прозрачные цены', kz: 'Айқын бағалар', en: 'Transparent pricing' },

  howItWorksStep4Title: {
    ru: 'Подтверждение и активация',
    kz: 'Растау және белсендіру',
    en: 'Verify & Activate',
  },
  howItWorksStep4Desc: {
    ru: 'Владелец комнаты добавляет вас в тариф. После проверки услуга активируется, и вы начинаете экономить. Все вопросы — только через заявки в поддержку, без прямого общения.',
    kz: 'Бөлме иесі сізді тарифіне қосады. Тексеруден кейін қызмет белсендіріледі, ал сіз үнемдеуді бастайсыз. Барлық үйлестіру тікелей емес, қолдау өтінімдері арқылы өтеді.',
    en: 'The room owner adds you to their plan. Once verified, your service activates and you start saving. All coordination happens through support tickets—no direct user contact needed.',
  },
  howItWorksStep4Detail1: {
    ru: 'Владелец добавляет вас в тариф',
    kz: 'Иесі сізді тарифке қосады',
    en: 'Owner adds you to plan',
  },
  howItWorksStep4Detail2: {
    ru: 'Проверка платформой',
    kz: 'Платформа тексеруі',
    en: 'Platform verification',
  },
  howItWorksStep4Detail3: {
    ru: 'Активация услуги подтверждена',
    kz: 'Қызметтің белсендірілуі расталды',
    en: 'Service activation confirmed',
  },

  howItWorksNoticeTitle: {
    ru: 'Важно: между пользователями нет чата',
    kz: 'Маңызды: пайдаланушылар арасында чат жоқ',
    en: 'Important: No User-to-User Chat',
  },
  howItWorksNoticeDesc: {
    ru: 'EcoPay не предоставляет прямого общения между пользователями. Все вопросы и координация решаются через официальные заявки в поддержку, которые проверяет наша команда. Это защищает вашу приватность и обеспечивает безопасность и фиксацию всех взаимодействий.',
    kz: 'EcoPay пайдаланушылар арасында тікелей хабарласуды қамтамасыз етпейді. Барлық сұрақтар мен үйлестіру біздің команда қарайтын ресми қолдау өтінімдері арқылы шешіледі. Бұл сіздің құпиялылығыңызды қорғайды әрі барлық әрекеттің қауіпсіз және құжатталған болуын қамтамасыз етеді.',
    en: 'EcoPay does not provide direct messaging between users. All communication, questions, and coordination happen through official support tickets monitored by our team. This protects your privacy and ensures all interactions are secure and documented.',
  },

  howItWorksHelpTitle: { ru: 'Нужна помощь?', kz: 'Көмек керек пе?', en: 'Need Help?' },
  howItWorksHelpDesc: {
    ru: 'Наша служба поддержки готова ответить на любые вопросы о присоединении к комнатам, оплате и активации тарифа.',
    kz: 'Біздің қолдау тобы бөлмеге қосылу, төлеу немесе тарифті белсендіру туралы кез келген сұраққа жауап беруге дайын.',
    en: 'Our support team is here to help with any questions about joining rooms, payments, or plan activation.',
  },
  howItWorksCreateTicketCta: {
    ru: 'Создать заявку в поддержку',
    kz: 'Қолдау өтінімін жасау',
    en: 'Create Support Ticket',
  },

  howItWorksReadyTitle: {
    ru: 'Готовы начать экономить?',
    kz: 'Үнемдеуге дайынсыз ба?',
    en: 'Ready to Start Saving?',
  },
  howItWorksReadyDesc: {
    ru: 'Изучите доступные тарифы от ведущих операторов Казахстана и присоединяйтесь к комнате уже сегодня.',
    kz: 'Қазақстанның жетекші операторларының қолжетімді тарифтерін қарап шығып, бүгін бөлмеге қосылыңыз.',
    en: "Browse available plans from Kazakhstan's top operators and join a room today.",
  },
  howItWorksViewCatalogCta: { ru: 'Открыть каталог', kz: 'Каталогты ашу', en: 'View Catalog' },

  // ===== Legal documents (Terms / Privacy) =====
  agreeCheckboxLabel: {
    ru: 'Я прочитал(а) и принимаю',
    kz: 'Мен оқыдым және қабылдаймын',
    en: 'I have read and accept',
  },
  agreeTermsLink: {
    ru: 'Условия использования',
    kz: 'Пайдалану шарттарын',
    en: 'the Terms of Service',
  },
  agreePrivacyLink: {
    ru: 'согласие на обработку персональных данных',
    kz: 'дербес деректерді өңдеуге келісімді',
    en: 'the Privacy consent',
  },
  mustAcceptTerms: {
    ru: 'Чтобы продолжить, отметьте согласие с условиями и обработкой персональных данных.',
    kz: 'Жалғастыру үшін шарттарды және дербес деректерді өңдеуге келісімді белгілеңіз.',
    en: 'You must accept the Terms of Service and the Privacy consent to continue.',
  },
  termsScrollHint: {
    ru: 'Пожалуйста, ознакомьтесь с полным текстом условий (можно прокручивать).',
    kz: 'Толық шарттармен танысыңыз (айналдыруға болады).',
    en: 'Please read the full text below (scrollable).',
  },

  adminLegalNav: {
    ru: 'Юр. документы',
    kz: 'Заңды құжаттар',
    en: 'Legal docs',
  },
  adminLegalTitle: {
    ru: 'Юридические документы',
    kz: 'Заңды құжаттар',
    en: 'Legal documents',
  },
  adminLegalHint: {
    ru: 'Выберите документ и язык. Каждое сохранение фиксируется в журнале действий администратора и увеличивает версию.',
    kz: 'Құжатты және тілді таңдаңыз. Әрбір сақтау әкімші журналына жазылып, нұсқаны арттырады.',
    en: 'Pick a document and language. Every save is recorded in the admin action log and bumps the version.',
  },
  adminLegalDocTerms: {
    ru: 'Условия использования',
    kz: 'Пайдалану шарттары',
    en: 'Terms of Service',
  },
  adminLegalDocPrivacy: {
    ru: 'Согласие на обработку ПДн',
    kz: 'Дербес деректерді өңдеуге келісім',
    en: 'Privacy consent',
  },
  adminLegalDocTitle: { ru: 'Заголовок', kz: 'Тақырып', en: 'Title' },
  adminLegalBody: { ru: 'Текст документа', kz: 'Құжаттың мәтіні', en: 'Document body' },
  adminLegalLastUpdated: { ru: 'Обновлено', kz: 'Жаңартылды', en: 'Last updated' },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>(null!);

const LANGUAGE_STORAGE_KEY = 'ecopay-language';
const SUPPORTED_LANGUAGES: Language[] = ['ru', 'kz', 'en'];

function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as string[]).includes(value);
}

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'ru';
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  } catch {
    // localStorage may be unavailable (private mode, SSR) — fall back silently
  }
  return 'ru';
}

/**
 * Replaces {{placeholder}} tokens in a translated string with provided params.
 * Missing params are left untouched so the UI never crashes on incomplete data.
 */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined || value === null ? match : String(value);
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // Mirror the active language into the module-level locale store so non-React
  // code (api.ts) can localize friendly fallback messages without dragging in
  // the i18n context. Sync synchronously each render so any API call triggered
  // during the same render sees the correct language.
  setCurrentLanguage(language);
  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      } catch {
        // ignore persistence errors
      }
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[key];
    if (!translation) {
      if (import.meta.env?.DEV) {
        console.warn(`[i18n] Missing translation key: "${key}"`);
      }
      return key;
    }
    // Fallback order: current language -> English -> key
    const raw = translation[language] || translation.en || key;
    return interpolate(raw, params);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
