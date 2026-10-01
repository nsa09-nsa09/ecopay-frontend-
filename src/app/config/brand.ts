// Static `import.meta.env.VITE_*` access only: a dynamic `import.meta.env[key]`
// makes Vite inline the whole env object, leaking every VITE_* variable
// (including local dev URLs) into the production bundle.
const clean = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export const appBrand = {
  name: clean(import.meta.env.VITE_APP_NAME) || 'EcoPay',
  supportEmail: clean(import.meta.env.VITE_SUPPORT_EMAIL),
  instagramUrl: clean(import.meta.env.VITE_INSTAGRAM_URL),
  tiktokUrl: clean(import.meta.env.VITE_TIKTOK_URL),
} as const;
