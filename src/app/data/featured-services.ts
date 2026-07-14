// Curated showcase services for the home catalog. Used to guarantee the
// catalog never looks empty: entries whose name is not already present in the
// API response are appended after live services.

export interface FeaturedService {
  name: string;
  category: { ru: string; kz: string; en: string };
  description: { ru: string; kz: string; en: string };
  fullPrice: number;
  memberPrice: number;
  discount: number; // percent off the solo price
}

export const featuredServices: FeaturedService[] = [
  {
    name: "Netflix",
    category: { ru: "Видео", kz: "Видео", en: "Video" },
    description: {
      ru: "Фильмы и сериалы в 4K на семейном тарифе Premium.",
      kz: "Premium отбасылық тарифінде 4K фильмдер мен сериалдар.",
      en: "Movies and shows in 4K on the Premium family plan.",
    },
    fullPrice: 4990,
    memberPrice: 1250,
    discount: 75,
  },
  {
    name: "Яндекс Плюс",
    category: { ru: "Приложения", kz: "Қосымшалар", en: "Apps" },
    description: {
      ru: "Кинопоиск, Музыка и кэшбэк баллами в одной подписке.",
      kz: "Кинопоиск, Музыка және балл кэшбэгі бір жазылымда.",
      en: "Kinopoisk, Music, and points cashback in one subscription.",
    },
    fullPrice: 1990,
    memberPrice: 500,
    discount: 75,
  },
  {
    name: "Spotify",
    category: { ru: "Музыка", kz: "Музыка", en: "Music" },
    description: {
      ru: "Музыка без рекламы для всей семьи — до 6 аккаунтов.",
      kz: "Жарнамасыз музыка — 6 аккаунтқа дейін.",
      en: "Ad-free music for the whole family — up to 6 accounts.",
    },
    fullPrice: 3390,
    memberPrice: 680,
    discount: 80,
  },
  {
    name: "YouTube Premium",
    category: { ru: "Видео", kz: "Видео", en: "Video" },
    description: {
      ru: "Без рекламы, фоновое воспроизведение и YouTube Music.",
      kz: "Жарнамасыз, фондық ойнату және YouTube Music.",
      en: "No ads, background play, and YouTube Music included.",
    },
    fullPrice: 3990,
    memberPrice: 790,
    discount: 80,
  },
  {
    name: "Disney+",
    category: { ru: "Видео", kz: "Видео", en: "Video" },
    description: {
      ru: "Disney, Pixar, Marvel и Star Wars на 4 экранах.",
      kz: "Disney, Pixar, Marvel және Star Wars 4 экранда.",
      en: "Disney, Pixar, Marvel, and Star Wars on 4 screens.",
    },
    fullPrice: 3490,
    memberPrice: 890,
    discount: 74,
  },
  {
    name: "Microsoft 365",
    category: { ru: "Приложения", kz: "Қосымшалар", en: "Apps" },
    description: {
      ru: "Word, Excel и 1 ТБ OneDrive на семейной подписке.",
      kz: "Word, Excel және отбасылық жазылымда 1 ТБ OneDrive.",
      en: "Word, Excel, and 1 TB OneDrive on the family plan.",
    },
    fullPrice: 4290,
    memberPrice: 720,
    discount: 83,
  },
  {
    name: "HBO Max",
    category: { ru: "Видео", kz: "Видео", en: "Video" },
    description: {
      ru: "Сериалы HBO и премьеры Warner Bros. в день выхода.",
      kz: "HBO сериалдары мен Warner Bros. премьералары.",
      en: "HBO originals and Warner Bros. premieres day one.",
    },
    fullPrice: 4590,
    memberPrice: 1150,
    discount: 75,
  },
  {
    name: "Apple Music",
    category: { ru: "Музыка", kz: "Музыка", en: "Music" },
    description: {
      ru: "100 млн треков в lossless на семейном тарифе.",
      kz: "Отбасылық тарифте lossless форматындағы 100 млн трек.",
      en: "100M songs in lossless on the family plan.",
    },
    fullPrice: 2990,
    memberPrice: 600,
    discount: 80,
  },
  {
    name: "Amazon Prime Video",
    category: { ru: "Видео", kz: "Видео", en: "Video" },
    description: {
      ru: "Эксклюзивы Amazon Originals и большая библиотека кино.",
      kz: "Amazon Originals эксклюзивтері және үлкен кино кітапханасы.",
      en: "Amazon Originals exclusives and a huge movie library.",
    },
    fullPrice: 2790,
    memberPrice: 700,
    discount: 75,
  },
  {
    name: "Activ",
    category: { ru: "Связь", kz: "Байланыс", en: "Telecom" },
    description: {
      ru: "Семейный тариф: делите гигабайты и минуты с близкими.",
      kz: "Отбасылық тариф: гигабайт пен минуттарды бөлісіңіз.",
      en: "Family plan: share gigabytes and minutes with your people.",
    },
    fullPrice: 6990,
    memberPrice: 1750,
    discount: 75,
  },
  {
    name: "Telegram Premium",
    category: { ru: "Приложения", kz: "Қосымшалар", en: "Apps" },
    description: {
      ru: "Большие файлы, быстрые загрузки и без рекламы в каналах.",
      kz: "Үлкен файлдар, жылдам жүктеу және каналдарда жарнамасыз.",
      en: "Big files, faster downloads, and no ads in channels.",
    },
    fullPrice: 2490,
    memberPrice: 830,
    discount: 67,
  },
  {
    name: "Duolingo Super",
    category: { ru: "Обучение", kz: "Оқыту", en: "Education" },
    description: {
      ru: "Языки без рекламы и с безлимитными жизнями — до 6 человек.",
      kz: "Жарнамасыз тілдер және шексіз өмірлер — 6 адамға дейін.",
      en: "Languages ad-free with unlimited hearts — up to 6 people.",
    },
    fullPrice: 4790,
    memberPrice: 960,
    discount: 80,
  },
];
