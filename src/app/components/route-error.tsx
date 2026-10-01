import { useEffect } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { safeGetItem, safeSetItem } from '../lib/safe-storage';

const CHUNK_RELOAD_KEY = 'ecopay.chunkReloadAt';
const CHUNK_RELOAD_WINDOW_MS = 60_000;

/**
 * True for "the code for this page could not be downloaded" — typically a
 * deploy replaced the hashed chunks while the tab was open, or the network
 * dropped. Message shapes differ per browser.
 */
export function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : typeof error === 'string'
        ? error
        : '';
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Loading chunk [\w-]+ failed|Unable to preload CSS/i.test(
    message,
  );
}

/**
 * Reloads the page once per minute at most, so a stale tab picks up the new
 * deploy without ever entering a reload loop. Returns false when a reload was
 * attempted recently (the caller then shows the manual fallback).
 */
export function reloadOnceForStaleChunks(): boolean {
  const last = Number(safeGetItem(CHUNK_RELOAD_KEY, 'session') ?? 0);
  if (Number.isFinite(last) && Date.now() - last < CHUNK_RELOAD_WINDOW_MS) return false;
  if (!safeSetItem(CHUNK_RELOAD_KEY, String(Date.now()), 'session')) return false;
  window.location.reload();
  return true;
}

function currentLanguage(): 'ru' | 'kz' | 'en' {
  const stored = safeGetItem('ecopay-language');
  return stored === 'kz' || stored === 'en' ? stored : 'ru';
}

const COPY = {
  ru: {
    errorTitle: 'Что-то пошло не так',
    errorBody: 'Попробуйте обновить страницу или вернитесь на главную.',
    chunkTitle: 'Доступна новая версия EcoPay',
    chunkBody: 'Страницу не удалось загрузить. Обновите её, чтобы продолжить.',
    notFoundTitle: 'Страница не найдена',
    notFoundBody: 'Возможно, ссылка устарела или в адресе опечатка.',
    reload: 'Обновить страницу',
    home: 'На главную',
  },
  kz: {
    errorTitle: 'Бірдеңе дұрыс болмады',
    errorBody: 'Бетті жаңартып көріңіз немесе басты бетке оралыңыз.',
    chunkTitle: 'EcoPay-дің жаңа нұсқасы қолжетімді',
    chunkBody: 'Бетті жүктеу мүмкін болмады. Жалғастыру үшін оны жаңартыңыз.',
    notFoundTitle: 'Бет табылмады',
    notFoundBody: 'Сілтеме ескірген немесе мекенжайда қате болуы мүмкін.',
    reload: 'Бетті жаңарту',
    home: 'Басты бетке',
  },
  en: {
    errorTitle: 'Something went wrong',
    errorBody: 'Try reloading the page or go back to the home page.',
    chunkTitle: 'A new version of EcoPay is available',
    chunkBody: 'This page could not be loaded. Reload to continue.',
    notFoundTitle: 'Page not found',
    notFoundBody: 'The link may be outdated or the address may contain a typo.',
    reload: 'Reload page',
    home: 'Go to home page',
  },
} as const;

/**
 * Route-level error boundary. It may render outside the normal layout, so it
 * reads the language from storage and uses plain elements (no providers).
 */
export function RouteErrorFallback() {
  const error = useRouteError();
  const chunkError = isChunkLoadError(error);
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const copy = COPY[currentLanguage()];

  useEffect(() => {
    if (chunkError) reloadOnceForStaleChunks();
  }, [chunkError]);

  const title = notFound ? copy.notFoundTitle : chunkError ? copy.chunkTitle : copy.errorTitle;
  const body = notFound ? copy.notFoundBody : chunkError ? copy.chunkBody : copy.errorBody;

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    padding: '0 18px',
    borderRadius: 10,
    fontSize: 14,
    cursor: 'pointer',
    textDecoration: 'none',
  } as const;

  return (
    <div
      role="alert"
      style={{
        padding: '48px 16px',
        textAlign: 'center',
        color: 'var(--eco-text)',
        background: 'var(--eco-bg)',
        minHeight: '60vh',
      }}
    >
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>{title}</h1>
      <p style={{ color: 'var(--eco-text-secondary)', marginBottom: 24 }}>{body}</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {!notFound && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              ...buttonStyle,
              background: 'var(--eco-primary)',
              color: '#fff',
              border: 'none',
            }}
          >
            {copy.reload}
          </button>
        )}
        <a
          href="/"
          style={{
            ...buttonStyle,
            background: 'var(--eco-surface)',
            color: 'var(--eco-text)',
            border: '1px solid var(--eco-border)',
          }}
        >
          {copy.home}
        </a>
      </div>
    </div>
  );
}

/** In-layout 404 for unknown public paths (keeps header/footer navigation). */
export function NotFoundPage() {
  const copy = COPY[currentLanguage()];
  return (
    <div style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--eco-text)' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>{copy.notFoundTitle}</h1>
      <p style={{ color: 'var(--eco-text-secondary)', marginBottom: 24 }}>{copy.notFoundBody}</p>
      <a
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          minHeight: 44,
          padding: '0 18px',
          borderRadius: 10,
          background: 'var(--eco-primary)',
          color: '#fff',
          textDecoration: 'none',
        }}
      >
        {copy.home}
      </a>
    </div>
  );
}
