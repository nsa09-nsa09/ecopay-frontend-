# _design_reference — что это и как использовать

Это вырезанные «лучшие части» дизайна из новой версии фронта (та, что нравится руководству).
Положено в корень старого (рабочего) фронта только как РЕФЕРЕНС для интеграции.
НЕ подключать эту папку к сборке, НЕ импортировать из неё в рантайме.
После интеграции папку можно удалить.

Пути внутри зеркалят целевые пути в `src/`, чтобы было удобно сравнивать (`diff`) с живыми файлами.

| Файл в _design_reference | Что с ним делать в живом `src/` |
|---|---|
| `src/app/components/brand-logo.tsx` | СКОПИРОВАТЬ как есть в `src/app/components/brand-logo.tsx` (новый файл). |
| `src/app/data/subscriptions.ts` | СКОПИРОВАТЬ как есть в `src/app/data/subscriptions.ts` (новый файл, самодостаточный, без импортов). Это статичные витринные данные для лендинга — НЕ подключать к API. |
| `src/app/assets/ecopay-logo-transparent-256.png` | СКОПИРОВАТЬ в `src/app/assets/` (папки assets в старом фронте нет — создать). Нужен для `brand-logo.tsx`. |
| `src/app/assets/ecopay-logo-transparent.png` | СКОПИРОВАТЬ в `src/app/assets/`. |
| `src/styles/index.css` | НЕ заменять. Взять отсюда ТОЛЬКО блок анимаций (`@keyframes ecopayReviewsMarquee`, `@keyframes ecopayPricePulse`, классы `.ecopay-price-pulse`, `.ecopay-reviews-marquee`, `.ecopay-reviews-track`, `.ecopay-review-card`, блок `@media (prefers-reduced-motion: reduce)`) и ДОПИСАТЬ в конец живого `src/styles/index.css`. Три `@import` сверху в живом файле не трогать. |
| `src/app/components/ds-primitives.tsx` | НЕ заменять целиком. Перенести в живой файл обратно-совместимые улучшения: `Tabs` с поддержкой элементов `{ id, label }` (старый вызов со `string[]` должен продолжать работать), хелпер `statusLabel(status, lang)` и связанные правки `StatusBadge`. Сверь, что текущие вызовы `Tabs`/`StatusBadge` по проекту остаются валидными. |
| `src/app/components/catalog/home.tsx` | ЗАМЕНИТЬ живой `home.tsx` этой версией (новый лендинг: витрина/шаги/отзывы/FAQ). Затем починить импорты под старый проект (`ds-primitives`, `i18n-provider`, `../../data/subscriptions`, `lucide-react`). CTA-кнопки навести на реальные маршруты: `/browse`, `/register`, `/rooms/create`, `/how-it-works`. |
| `src/app/components/layout.tsx` | НЕ заменять целиком. Перенести только переход шапки на `<BrandLogo>`. ОБЯЗАТЕЛЬНО сохранить пункт навигации на `/browse` (rooms-catalog) — в этой референс-версии он удалён, в рабочем фронте он нужен и работает. |
| `src/app/components/catalog/operator.tsx` | НЕ заменять вслепую. Сравнить (`diff`) с живым и перенести только визуальные правки, не трогая обращения к API, если они есть. |
