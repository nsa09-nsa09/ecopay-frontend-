# EcoSplit i18n Key Map

**Complete trilingual coverage (RU/KZ/EN) for the entire application.**

This document serves as a reference for all internationalization keys available in the EcoSplit application. All user-facing strings should use these keys via the `useI18n()` hook and `t()` function.

## 📋 Usage Example

```tsx
import { useI18n } from './i18n-provider';

function MyComponent() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div>
      <h1>{t('heroTitle')}</h1>
      <p>{t('heroSubtitle')}</p>
    </div>
  );
}
```

---

## 🗂️ Categories

### Navigation & Header

- `catalog` - Каталог / Каталог / Catalog
- `myRooms` - Мои комнаты / Менің бөлмелерім / My Rooms
- `support` - Поддержка / Қолдау / Support
- `aboutUs` - О нас / Біз туралы / About Us
- `signIn` - Войти / Кіру / Sign In
- `signUp` - Регистрация / Тіркелу / Sign Up
- `profile` - Профиль / Профиль / Profile
- `settings` - Настройки / Баптаулар / Settings
- `signOut` - Выйти / Шығу / Sign Out
- `searchPlans` - Поиск планов... / Жоспарларды іздеу... / Search plans...
- `menu` - Меню / Мәзір / Menu

### Footer

- `product` - Продукт / Өнім / Product
- `company` - Компания / Компания / Company
- `howItWorks` - Как это работает / Қалай жұмыс істейді / How it Works
- `pricing` - Цены / Бағалар / Pricing
- `faq` - Вопросы / Сұрақтар / FAQ
- `about` - О нас / Біз туралы / About
- `terms` - Условия / Шарттар / Terms
- `privacy` - Конфиденциальность / Құпиялылық / Privacy
- `forOwners` - Для владельцев / Иелерге / For Owners
- `createTicket` - Создать заявку / Өтінім жасау / Create Ticket
- `ticketStatus` - Статус заявки / Өтінім мәртебесі / Ticket Status
- `developedBy` - Разработано Apex Digital / Apex Digital әзірлеген / Developed by Apex Digital
- `copyright` - © 2026 EcoPay · Астана, Казахстан / © 2026 EcoPay · Астана, Қазақстан / © 2026 EcoPay · Astana, Kazakhstan

### Authentication

- `createAccount` - Создать аккаунт / Тіркелгі жасау / Create Account
- `joinEcoSplit` - Присоединяйтесь к EcoSplit... / EcoSplit-ке қосылыңыз... / Join EcoSplit to share...
- `displayName` - Отображаемое имя / Көрсетілетін ат / Display Name
- `email` - Эл. почта / Электрондық пошта / Email
- `password` - Пароль / Құпия сөз / Password
- `confirmPassword` - Подтвердите пароль / Құпия сөзді растаңыз / Confirm Password
- `enterPassword` - Введите пароль / Құпия сөзді енгізіңіз / Enter password
- `yourEmail` - ваш@email.com / сіздің@email.com / your@email.com
- `exampleName` - например, Айдар / мысалы, Айдар / e.g. Aidar
- `alreadyHaveAccount` - Уже есть аккаунт? / Тіркелгіңіз бар ма? / Already have an account?
- `dontHaveAccount` - Нет аккаунта? / Тіркелгіңіз жоқ па? / Don't have an account?
- `welcomeBack` - Добро пожаловать в EcoSplit / EcoSplit-ке қайта келіңіз / Welcome back to EcoSplit
- `rememberMe` - Запомнить меня / Мені есте сақта / Remember me
- `forgotPassword` - Забыли пароль? / Құпия сөзді ұмыттыңыз ба? / Forgot password?
- `resetPassword` - Сбросить пароль / Құпия сөзді қалпына келтіру / Reset Password
- `backToSignIn` - Назад ко входу / Кіруге оралу / Back to Sign In
- `checkYourEmail` - Проверьте вашу почту / Поштаңызды тексеріңіз / Check Your Email
- `resetLinkSent` - Мы отправили ссылку... / Біз құпия сөзді... / We sent a password reset...
- `resendEmail` - Отправить повторно / Қайта жіберу / Resend Email
- `enterEmailForReset` - Введите ваш email... / Email енгізіңіз... / Enter your email and...
- `sendResetLink` - Отправить ссылку / Сілтеме жіберу / Send Reset Link
- `show` - Показать / Көрсету / Show
- `hide` - Скрыть / Жасыру / Hide

### Home/Catalog

- `heroTitle` - Делитесь тарифами. / Тарифтерді бөлісіңіз. / Share plans.
- `heroTitleHighlight` - Экономьте. / Үнемдеңіз. / Split costs.
- `heroSubtitle` - Находите или создавайте... / Байланыс операторларының... / Find or create shared...
- `mobileOperators` - Мобильные операторы / Мобильді операторлар / Mobile Operators
- `familyGroupPlansAvailable` - Семейные и групповые тарифы... / Отбасылық және топтық... / Family & group plans...
- `plansRooms` - {{plans}} тарифов · {{rooms}} комнат / {{plans}} тариф · {{rooms}} бөлме / {{plans}} plans · {{rooms}} rooms
- `noFamilyPlansAvailable` - Нет семейных тарифов / Отбасылық тарифтер жоқ / No family plans available
- `homeInternet` - Домашний интернет / Үй интернеті / Home Internet
- `bundledInternetPlans` - Пакетные интернет-тарифы... / Мобильді операторлармен... / Bundled internet plans...
- `comingQ3` - Скоро Q3 2026 / Жақында Q3 2026 / Coming Q3 2026
- `digitalSubscriptions` - Цифровые подписки / Цифрлық жазылымдар / Digital Subscriptions
- `comingSoon` - Скоро / Жақында / Coming Soon
- `available` - Доступно / Қолжетімді / Available
- `beta` - Бета / Бета / Beta
- `videoStreaming` - Видео стриминг / Видео ағын / Video Streaming
- `music` - Музыка / Музыка / Music
- `aiTools` - AI инструменты / AI құралдар / AI Tools
- `premiumApps` - Премиум приложения / Премиум қолданбалар / Premium Apps
- `viewAll` - Смотреть все / Барлығын көру / View All

### Operator Detail

- `familyPlansFor` - Семейные тарифы {{operator}} / {{operator}} отбасылық тарифтері / {{operator}} Family Plans
- `selectPlanToJoin` - Выберите тариф... / Бөлмеге қосылу... / Select a plan to join...
- `gb` - ГБ / ГБ / GB
- `unlimited` - Безлимит / Шексіз / Unlimited
- `perMonth` - /мес / /ай / /mo
- `data` - Интернет / Интернет / Data
- `minutes` - Минуты / Минуттар / Minutes
- `sms` - SMS / SMS / SMS
- `slots` - слотов / слот / slots
- `availableRooms` - Доступные комнаты / Қолжетімді бөлмелер / Available Rooms
- `createNewRoom` - Создать новую комнату / Жаңа бөлме жасау / Create New Room

### Rooms Module

- `activeRooms` - Активные комнаты / Белсенді бөлмелер / Active Rooms
- `pendingInvites` - Ожидающие приглашения / Күтіп тұрған шақырулар / Pending Invites
- `completedRooms` - Завершённые комнаты / Аяқталған бөлмелер / Completed Rooms
- `owner` - Владелец / Иесі / Owner
- `member` - Участник / Қатысушы / Member
- `invited` - Приглашён / Шақырылған / Invited
- `createRoom` - Создать комнату / Бөлме жасау / Create Room
- `chooseOperatorAndPlan` - Выберите оператора и тариф... / Бірлескен пайдалану үшін... / Choose operator and plan...
- `operator` - Оператор / Оператор / Operator
- `selectOperator` - Выберите оператора / Операторды таңдаңыз / Select Operator
- `plan` - Тариф / Тариф / Plan
- `selectPlanFirst` - Сначала выберите оператора / Алдымен операторды таңдаңыз / Select operator first
- `selectPlan` - Выберите тариф / Тарифті таңдаңыз / Select Plan
- `roomSettings` - Настройки комнаты / Бөлме баптаулары / Room Settings
- `roomName` - Название комнаты / Бөлме атауы / Room Name
- `optionalCustomName` - Опционально, например... / Міндетті емес, мысалы... / Optional, e.g. ...
- `visibility` - Видимость / Көрінуі / Visibility
- `publicRoom` - Публичная / Ашық / Public
- `publicRoomDesc` - Любой может найти... / Кез келген адам... / Anyone can find...
- `privateRoom` - Приватная / Жеке / Private
- `privateRoomDesc` - Только по приглашению / Тек шақыру бойынша / Invite-only
- `autoAccept` - Автоматическое принятие / Автоматты қабылдау / Auto-accept
- `autoAcceptDesc` - Автоматически принимать... / Растаусыз жаңа... / Automatically accept...
- `cancel` - Отмена / Болдырмау / Cancel
- `next` - Далее / Келесі / Next
- `back` - Назад / Артқа / Back
- `finish` - Завершить / Аяқтау / Finish
- `reviewAndConfirm` - Проверка и подтверждение / Тексеру және растау / Review & Confirm
- `reviewRoomDetails` - Проверьте детали... / Жасамас бұрын... / Review your room details...
- `totalCost` - Общая стоимость / Жалпы құны / Total Cost
- `costPerMember` - За участника / Қатысушы үшін / Per Member
- `maxMembers` - Макс. участников / Макс. қатысушылар / Max Members

### Room Detail

- `roomDetails` - Детали комнаты / Бөлме деректері / Room Details
- `members` - Участники / Қатысушылар / Members
- `payments` - Платежи / Төлемдер / Payments
- `activity` - Активность / Белсенділік / Activity
- `inviteLink` - Ссылка для приглашения / Шақыру сілтемесі / Invite Link
- `copyLink` - Копировать ссылку / Сілтемені көшіру / Copy Link
- `shareRoom` - Поделиться / Бөлісу / Share
- `leaveRoom` - Покинуть комнату / Бөлмеден шығу / Leave Room
- `deleteRoom` - Удалить комнату / Бөлмені жою / Delete Room
- `joined` - Присоединился / Қосылды / Joined
- `pending` - Ожидает / Күтуде / Pending
- `paid` - Оплачено / Төленді / Paid
- `unpaid` - Не оплачено / Төленбеді / Unpaid
- `approve` - Одобрить / Растау / Approve
- `reject` - Отклонить / Қабылдамау / Reject
- `remove` - Удалить / Жою / Remove
- `sendReminder` - Напомнить / Еске салу / Send Reminder
- `viewProfile` - Профиль / Профиль / View Profile

### Support/Tickets

- `tickets` - Заявки / Өтінімдер / Tickets
- `myTickets` - Мои заявки / Менің өтінімдерім / My Tickets
- `createNewTicket` - Создать заявку / Өтінім жасау / Create New Ticket
- `ticketDetails` - Детали заявки / Өтінім деректері / Ticket Details
- `subject` - Тема / Тақырып / Subject
- `category` - Категория / Санат / Category
- `priority` - Приоритет / Басымдық / Priority
- `description` - Описание / Сипаттама / Description
- `attachments` - Вложения / Қосымшалар / Attachments
- `submit` - Отправить / Жіберу / Submit
- `status` - Статус / Мәртебе / Status
- `open` - Открыта / Ашық / Open
- `inProgress` - В работе / Орындалуда / In Progress
- `resolved` - Решена / Шешілді / Resolved
- `closed` - Закрыта / Жабық / Closed
- `low` - Низкий / Төмен / Low
- `medium` - Средний / Орташа / Medium
- `high` - Высокий / Жоғары / High
- `urgent` - Срочно / Шұғыл / Urgent
- `reply` - Ответить / Жауап беру / Reply
- `closeTicket` - Закрыть заявку / Өтінімді жабу / Close Ticket
- `reopenTicket` - Открыть заново / Қайта ашу / Reopen Ticket

### Payments

- `checkout` - Оформление оплаты / Төлемді рәсімдеу / Checkout
- `paymentMethod` - Способ оплаты / Төлем әдісі / Payment Method
- `cardNumber` - Номер карты / Карта нөмірі / Card Number
- `expiryDate` - Срок действия / Жарамдылық мерзімі / Expiry Date
- `cvv` - CVV / CVV / CVV
- `cardholderName` - Имя держателя карты / Карта иесінің аты / Cardholder Name
- `saveCard` - Сохранить карту / Картаны сақтау / Save Card
- `payNow` - Оплатить / Төлеу / Pay Now
- `paymentConfirmation` - Подтверждение оплаты / Төлем растамасы / Payment Confirmation
- `paymentSuccessful` - Оплата успешна / Төлем сәтті / Payment Successful
- `paymentFailed` - Ошибка оплаты / Төлем қатесі / Payment Failed
- `paymentPending` - Ожидание оплаты / Төлемді күту / Payment Pending
- `transactionId` - ID транзакции / Транзакция ID / Transaction ID
- `amount` - Сумма / Сома / Amount
- `date` - Дата / Күні / Date
- `downloadReceipt` - Скачать чек / Чекті жүктеу / Download Receipt
- `refundStatus` - Статус возврата / Қайтару мәртебесі / Refund Status
- `refundRequested` - Возврат запрошен / Қайтаруға өтінім берілді / Refund Requested
- `refundApproved` - Возврат одобрен / Қайтару расталды / Refund Approved
- `refundProcessing` - Возврат обрабатывается / Қайтару өңделуде / Refund Processing
- `refundCompleted` - Возврат завершён / Қайтару аяқталды / Refund Completed
- `ownerPayout` - Выплата владельцу / Иеге төлем / Owner Payout
- `payoutHistory` - История выплат / Төлем тарихы / Payout History
- `requestPayout` - Запросить выплату / Төлемге өтінім беру / Request Payout

### Profile

- `myProfile` - Мой профиль / Менің профилім / My Profile
- `editProfile` - Редактировать / Өңдеу / Edit Profile
- `reputation` - Репутация / Беделі / Reputation
- `reviews` - Отзывы / Пікірлер / Reviews
- `verified` - Верифицирован / Расталған / Verified
- `notVerified` - Не верифицирован / Расталмаған / Not Verified
- `verifyAccount` - Верифицировать аккаунт / Тіркелгіні растау / Verify Account
- `phoneNumber` - Телефон / Телефон / Phone Number
- `language` - Язык / Тіл / Language
- `notifications` - Уведомления / Хабарландырулар / Notifications
- `security` - Безопасность / Қауіпсіздік / Security
- `changePassword` - Изменить пароль / Құпия сөзді өзгер��у / Change Password
- `deleteAccount` - Удалить аккаунт / Тіркелгіні жою / Delete Account
- `save` - Сохранить / Сақтау / Save

### Admin Portal

- `adminDashboard` - Панель администратора / Әкімші панелі / Admin Dashboard
- `moderationQueue` - Очередь модерации / Модерация кезегі / Moderation Queue
- `users` - Пользователи / Пайдаланушылар / Users
- `rooms` - Комнаты / Бөлмелер / Rooms
- `disputes` - Споры / Дау-дамайлар / Disputes
- `refunds` - Возвраты / Қайтарулар / Refunds
- `analytics` - Аналитика / Аналитика / Analytics
- `logs` - Логи / Логтар / Logs
- `totalUsers` - Всего пользователей / Барлық пайдаланушылар / Total Users
- `activeRoomsCount` - Активные комнаты / Белсенді бөлмелер / Active Rooms
- `totalRevenue` - Общий доход / Жалпы табыс / Total Revenue
- `pendingTickets` - Ожидающие заявки / Күтіп тұрған өтінімдер / Pending Tickets
- `banUser` - Заблокировать / Бұғаттау / Ban User
- `unbanUser` - Разблокировать / Бұғаттан шығару / Unban User
- `viewDetails` - Подробнее / Толығырақ / View Details

### Digital Subscriptions

- `digitalSubscriptionsAvailable` - Цифровые подписки — Доступно / Цифрлық жазылымдар — Қолжетімді / Digital Subscriptions — Available
- `shareDigitalServices` - Делитесь премиум-сервисами / Премиум қызметтерді бөлісіңіз / Share premium services
- `googleOneFamily` - Google One Семейная / Google One Отбасылық / Google One Family
- `appleOne` - Apple One / Apple One / Apple One
- `yandexPlus` - Яндекс Плюс / Яндекс Плюс / Yandex Plus
- `yandexDisk` - Яндекс Диск / Яндекс Диск / Yandex Disk
- `storage` - Хранилище / Сақтау орны / Storage
- `familySharing` - Семейный доступ / Отбасылық қатынас / Family Sharing

### Common UI

- `loading` - Загрузка... / Жүктеу... / Loading...
- `error` - Ошибка / Қате / Error
- `success` - Успешно / Сәтті / Success
- `warning` - Предупреждение / Ескерту / Warning
- `info` - Информация / Ақпарат / Info
- `confirm` - Подтвердить / Растау / Confirm
- `delete` - Удалить / Жою / Delete
- `edit` - Редактировать / Өңдеу / Edit
- `close` - Закрыть / Жабу / Close
- `search` - Поиск / Іздеу / Search
- `filter` - Фильтр / Сүзгі / Filter
- `sort` - Сортировка / Сұрыптау / Sort
- `reset` - Сбросить / Қалпына келтіру / Reset
- `apply` - Применить / Қолдану / Apply
- `export` - Экспорт / Экспорт / Export
- `import` - Импорт / Импорт / Import
- `download` - Скачать / Жүктеу / Download
- `upload` - Загрузить / Жүктеп салу / Upload
- `share` - Поделиться / Бөлісу / Share
- `copy` - Копировать / Көшіру / Copy
- `copied` - Скопировано / Көшірілді / Copied
- `more` - Ещё / Тағы / More
- `less` - Меньше / Азырақ / Less
- `all` - Все / Барлығы / All
- `none` - Нет / Жоқ / None
- `yes` - Да / Иә / Yes
- `no` - Нет / Жоқ / No
- `required` - Обязательно / Міндетті / Required
- `optional` - Опционально / Міндетті емес / Optional
- `na` - Н/Д / Қ/Ж / N/A

### Time & Dates

- `today` - Сегодня / Бүгін / Today
- `yesterday` - Вчера / Кеше / Yesterday
- `tomorrow` - Завтра / Ертең / Tomorrow
- `thisWeek` - На этой неделе / Осы аптада / This Week
- `thisMonth` - В этом месяце / Осы айда / This Month
- `thisYear` - В этом году / Биыл / This Year

### Validation

- `fieldRequired` - Это поле обязательно / Бұл өріс міндетті / This field is required
- `invalidEmail` - Неверный email / Дұрыс емес email / Invalid email
- `passwordTooShort` - Пароль слишком короткий / Құпия сөз тым қысқа / Password too short
- `passwordsDoNotMatch` - Пароли не совпадают / Құпия сөздер сәйкес келмейді / Passwords do not match

### Empty States

- `noRoomsYet` - Пока нет комнат / Әлі бөлмелер жоқ / No rooms yet
- `noTicketsYet` - Пока нет заявок / Әлі өтінімдер жоқ / No tickets yet
- `noResultsFound` - Результаты не найдены / Нәтижелер табылмады / No results found
- `noDataAvailable` - Нет данных / Деректер жоқ / No data available

---

## 📝 Notes

1. **Typography Scale Updated**: Base font size changed from 18px to 16px with improved readability scale
2. **Mobile Navbar**: Compact design with language selector moved to mobile menu
3. **Language Labels**:
   - Russian: "Рус"
   - Kazakh: "Қаз"
   - English: "Eng"

## 🔄 Adding New Keys

When adding new translation keys:

1. Add to the `translations` object in `/src/app/components/i18n-provider.tsx`
2. Update this document with the new key and its translations
3. Use descriptive camelCase names for keys
4. Group related keys together

---

**Last Updated**: April 3, 2026
