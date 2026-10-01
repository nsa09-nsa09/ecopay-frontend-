import { useEffect } from 'react';

/** Path prefixes that must never be indexed (account, payment and staff areas). */
const PRIVATE_PREFIXES = [
  '/admin',
  '/payment',
  '/payments',
  '/rooms',
  '/profile',
  '/support',
  '/feedback',
  '/notifications-inbox',
  '/notification-prefs',
  '/reset-password',
  '/verify-email',
  '/login',
  '/register',
  '/forgot-password',
];

export function isPrivatePath(pathname: string) {
  return PRIVATE_PREFIXES.some(
    (prefix) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(`${prefix}-`),
  );
}

/**
 * Keeps <meta name="robots"> in sync: "noindex, nofollow" on private pages
 * (robots.txt alone does not stop indexing of linked URLs).
 */
export function useRobotsMeta(noindex: boolean) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = noindex ? 'noindex, nofollow' : 'index, follow';
  }, [noindex]);
}
