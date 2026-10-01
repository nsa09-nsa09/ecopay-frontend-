/**
 * Returns `candidate` only if it is a same-origin in-app path; otherwise the
 * fallback. Blocks protocol-relative ("//evil.example"), backslash tricks
 * ("/\\evil.example"), absolute URLs and javascript: payloads in ?redirect=.
 */
export function safeRedirectPath(candidate: string | null | undefined, fallback: string): string {
  if (!candidate) return fallback;
  const value = candidate.trim();
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}
