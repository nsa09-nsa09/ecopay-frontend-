// Mock data for the home "Stories" strip (Instagram/TikTok-style).
//
// Shape is intentionally close to what a future `GET /api/v1/stories` endpoint
// would return: each Story is a group of full-screen slides. Text fields are
// localized objects ({ ru, kz, en }) — mirror how the catalog data files carry
// translations (see data/featured-services.ts) — so swapping the mock for a
// live API means replacing `mockStories` with a fetch + the same field names.
//
// `seen` here is only a seed value; the viewer persists real seen-state to
// localStorage so it survives reloads (see components/catalog/stories.tsx).

export interface LocalizedText {
  ru: string;
  kz: string;
  en: string;
}

export interface StoryCta {
  label: LocalizedText;
  /** Internal SPA route or absolute URL. Internal routes start with "/". */
  url: string;
}

export interface StorySlide {
  id: string;
  /** Optional cover image. When absent, `gradient` is the full-bleed fallback. */
  image?: string;
  /** CSS background value used when there is no image (or while it loads). */
  gradient?: string;
  heading: LocalizedText;
  text: LocalizedText;
  cta?: StoryCta;
}

export interface Story {
  id: string;
  title: LocalizedText;
  /** Ring/preview cover. Falls back to the first slide's gradient if empty. */
  cover?: string;
  /** Emoji shown in the preview bubble when there is no cover image. */
  emoji?: string;
  gradient: string;
  slides: StorySlide[];
  seen: boolean;
}

// Brand-orange leaning gradients (EcoSplit coral, from #FF8C42) with a couple of
// accent hues so the strip doesn't read as one flat block.
const G = {
  coral: 'linear-gradient(160deg, #FF8C42 0%, #F0741F 55%, #C55A12 100%)',
  sunset: 'linear-gradient(160deg, #FFAE75 0%, #FF6A13 60%, #96430E 100%)',
  violet: 'linear-gradient(160deg, #FF9A55 0%, #C55A12 40%, #5E2A09 100%)',
  teal: 'linear-gradient(160deg, #FFB27A 0%, #F0741F 50%, #22A06B 140%)',
  night: 'linear-gradient(165deg, #3A3A52 0%, #25253B 60%, #131326 100%)',
  gold: 'linear-gradient(160deg, #FFD27A 0%, #FF9A55 45%, #F0741F 100%)',
};

export const mockStories: Story[] = [
  {
    id: 'st-netflix-deal',
    title: { ru: 'Скидка на Netflix', kz: 'Netflix жеңілдігі', en: 'Netflix deal' },
    emoji: '🎬',
    gradient: G.coral,
    seen: false,
    slides: [
      {
        id: 'st-netflix-1',
        gradient: G.coral,
        heading: {
          ru: 'Netflix Premium дешевле в 4 раза',
          kz: 'Netflix Premium 4 есе арзан',
          en: 'Netflix Premium, 4× cheaper',
        },
        text: {
          ru: 'Присоединяйтесь к семейной комнате и платите только за своё место — вместо полной подписки.',
          kz: 'Отбасылық бөлмеге қосылып, толық жазылымның орнына тек өз орныңыз үшін төлеңіз.',
          en: 'Join a family room and pay only for your seat instead of the whole plan.',
        },
      },
      {
        id: 'st-netflix-2',
        gradient: G.sunset,
        heading: {
          ru: '4K и отдельный профиль',
          kz: '4K және жеке профиль',
          en: '4K and your own profile',
        },
        text: {
          ru: 'Свой профиль, свои рекомендации, качество 4K — без передачи пароля вне EcoSplit.',
          kz: 'Жеке профиль, жеке ұсыныстар, 4K сапасы — құпия сөзді EcoSplit-тен тыс бермей.',
          en: 'Your profile, your recommendations, 4K quality — no password sharing outside EcoSplit.',
        },
        cta: {
          label: { ru: 'Найти комнату', kz: 'Бөлме табу', en: 'Find a room' },
          url: '/catalog',
        },
      },
    ],
  },
  {
    id: 'st-spotify-family',
    title: { ru: 'Spotify Family', kz: 'Spotify Family', en: 'Spotify Family' },
    emoji: '🎧',
    gradient: G.teal,
    seen: false,
    slides: [
      {
        id: 'st-spotify-1',
        gradient: G.teal,
        heading: {
          ru: 'Музыка без рекламы',
          kz: 'Жарнамасыз музыка',
          en: 'Ad-free music',
        },
        text: {
          ru: 'До 6 участников в одной подписке Spotify. Каждый — со своей библиотекой.',
          kz: 'Бір Spotify жазылымында 6 қатысушыға дейін. Әрқайсысының өз кітапханасы.',
          en: 'Up to 6 members on one Spotify plan. Everyone keeps their own library.',
        },
        cta: {
          label: { ru: 'Открыть каталог', kz: 'Каталогты ашу', en: 'Browse catalog' },
          url: '/catalog',
        },
      },
    ],
  },
  {
    id: 'st-how-it-works',
    title: { ru: 'Как это работает', kz: 'Қалай жұмыс істейді', en: 'How it works' },
    emoji: '💡',
    gradient: G.gold,
    seen: false,
    slides: [
      {
        id: 'st-hiw-1',
        gradient: G.gold,
        heading: {
          ru: 'Три шага до подписки',
          kz: 'Жазылымға дейін үш қадам',
          en: 'Three steps to a subscription',
        },
        text: {
          ru: 'Выберите сервис, займите место в комнате, оплатите свою долю. Всё внутри EcoSplit.',
          kz: 'Сервисті таңдаңыз, бөлмеден орын алыңыз, өз үлесіңізді төлеңіз. Барлығы EcoSplit ішінде.',
          en: 'Pick a service, take a seat in a room, pay your share. All inside EcoSplit.',
        },
      },
      {
        id: 'st-hiw-2',
        gradient: G.coral,
        heading: {
          ru: 'Деньги под защитой',
          kz: 'Ақша қорғауда',
          en: 'Your money is protected',
        },
        text: {
          ru: 'Оплата удерживается на hold, пока владелец не выдаст доступ, а вы его не подтвердите.',
          kz: 'Төлем иесі қолжетімділік бергенше және сіз оны растағанша hold-та ұсталады.',
          en: 'Payment stays on hold until the owner grants access and you confirm it.',
        },
        cta: {
          label: { ru: 'Подробнее', kz: 'Толығырақ', en: 'Learn more' },
          url: '/how-it-works',
        },
      },
    ],
  },
  {
    id: 'st-yandex-plus',
    title: { ru: 'Новый: Яндекс Плюс', kz: 'Жаңа: Яндекс Плюс', en: 'New: Yandex Plus' },
    emoji: '⭐',
    gradient: G.violet,
    seen: false,
    slides: [
      {
        id: 'st-yandex-1',
        gradient: G.violet,
        heading: {
          ru: 'Кино, музыка и кэшбэк',
          kz: 'Кино, музыка және кэшбэк',
          en: 'Movies, music and cashback',
        },
        text: {
          ru: 'Кинопоиск, Музыка и баллы кэшбэка в одной подписке — теперь можно делить.',
          kz: 'Кинопоиск, Музыка және кэшбэк баллдары бір жазылымда — енді бөлісуге болады.',
          en: 'Kinopoisk, Music and cashback points in one plan — now shareable.',
        },
        cta: {
          label: { ru: 'Создать комнату', kz: 'Бөлме жасау', en: 'Create a room' },
          url: '/catalog',
        },
      },
    ],
  },
  {
    id: 'st-security',
    title: { ru: 'Безопасность', kz: 'Қауіпсіздік', en: 'Security' },
    emoji: '🛡️',
    gradient: G.night,
    seen: false,
    slides: [
      {
        id: 'st-sec-1',
        gradient: G.night,
        heading: {
          ru: 'Никаких паролей в переписке',
          kz: 'Хат алмасуда құпия сөз жоқ',
          en: 'No passwords in chats',
        },
        text: {
          ru: 'Доступ выдаётся через приглашение сервиса. Телефонные номера шифруются и видны только после оплаты.',
          kz: 'Қолжетімділік сервис шақыруы арқылы беріледі. Телефон нөмірлері шифрланады және тек төлемнен кейін көрінеді.',
          en: 'Access is granted via the service invite. Phone numbers are encrypted and shown only after payment.',
        },
        cta: {
          label: { ru: 'Как мы защищаем', kz: 'Қалай қорғаймыз', en: 'How we protect you' },
          url: '/security',
        },
      },
    ],
  },
  {
    id: 'st-youtube',
    title: { ru: 'YouTube Premium', kz: 'YouTube Premium', en: 'YouTube Premium' },
    emoji: '▶️',
    gradient: G.sunset,
    seen: false,
    slides: [
      {
        id: 'st-yt-1',
        gradient: G.sunset,
        heading: {
          ru: 'Без рекламы и в фоне',
          kz: 'Жарнамасыз және фонда',
          en: 'Ad-free and background play',
        },
        text: {
          ru: 'YouTube и YouTube Music без рекламы для всей семейной группы. Ваша доля — от 790 ₸.',
          kz: 'Бүкіл отбасы тобы үшін жарнамасыз YouTube және YouTube Music. Сіздің үлесіңіз — 790 ₸-ден.',
          en: 'Ad-free YouTube and YouTube Music for the whole family group. Your share from 790 ₸.',
        },
        cta: {
          label: { ru: 'Смотреть тарифы', kz: 'Тарифтерді көру', en: 'See plans' },
          url: '/catalog',
        },
      },
    ],
  },
  {
    id: 'st-invite',
    title: { ru: 'Приведи друга', kz: 'Досыңды шақыр', en: 'Invite a friend' },
    emoji: '🎁',
    gradient: G.gold,
    seen: false,
    slides: [
      {
        id: 'st-invite-1',
        gradient: G.gold,
        heading: {
          ru: 'Делите подписки — экономьте вместе',
          kz: 'Жазылыммен бөлісіңіз — бірге үнемдеңіз',
          en: 'Share subscriptions, save together',
        },
        text: {
          ru: 'Пригласите друга в свою комнату по ссылке — он войдёт и займёт свободное место за пару кликов.',
          kz: 'Досыңызды сілтеме арқылы бөлмеге шақырыңыз — ол бірнеше кликпен кіріп, бос орын алады.',
          en: 'Invite a friend to your room with a link — they sign in and grab a free seat in a couple of clicks.',
        },
        cta: {
          label: { ru: 'Мои комнаты', kz: 'Менің бөлмелерім', en: 'My rooms' },
          url: '/rooms/my',
        },
      },
    ],
  },
  {
    id: 'st-ai-tools',
    title: { ru: 'AI-подписки', kz: 'AI жазылымдары', en: 'AI subscriptions' },
    emoji: '🤖',
    gradient: G.coral,
    seen: false,
    slides: [
      {
        id: 'st-ai-1',
        gradient: G.coral,
        heading: {
          ru: 'Нейросети по подписке',
          kz: 'Жасанды интеллект жазылыммен',
          en: 'AI tools on subscription',
        },
        text: {
          ru: 'ChatGPT, Gemini и другие AI-инструменты теперь можно делить с командой и платить меньше.',
          kz: 'ChatGPT, Gemini және басқа AI құралдарын енді командамен бөлісіп, азырақ төлеуге болады.',
          en: 'ChatGPT, Gemini and other AI tools are now shareable with your team for less.',
        },
        cta: {
          label: { ru: 'Смотреть каталог', kz: 'Каталогты көру', en: 'Browse catalog' },
          url: '/catalog',
        },
      },
    ],
  },
];
