const ACCESS_KEY = "ecopay.access";
const REFRESH_KEY = "ecopay.refresh";

export function getAccess(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefresh(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh?: string | null) {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function hasTokens(): boolean {
  return Boolean(getAccess());
}
