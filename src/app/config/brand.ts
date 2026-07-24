const readEnv = (key: string): string => {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value.trim() : '';
};

export const appBrand = {
  name: readEnv('VITE_APP_NAME') || 'EcoPay',
  supportEmail: readEnv('VITE_SUPPORT_EMAIL'),
  instagramUrl: readEnv('VITE_INSTAGRAM_URL'),
  tiktokUrl: readEnv('VITE_TIKTOK_URL'),
} as const;
