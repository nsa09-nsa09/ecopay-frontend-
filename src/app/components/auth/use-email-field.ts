import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  checkEmail,
  looksLikeEmail,
  type EmailCheckResult,
  type EmailFieldStatus,
  type EmailFormatError,
} from '../../lib/email-validation';

/** How long the field stays quiet after the last keystroke before it judges the input. */
const DEBOUNCE_MS = 500;

export interface UseEmailFieldOptions {
  /**
   * When true, an input with no '@' is left unjudged (status stays 'empty').
   * Useful for optional email-like fields where non-email text should not be
   * judged until the user actually starts typing an address.
   */
  onlyWhenEmailLike?: boolean;
}

export interface EmailField {
  value: string;
  setValue: (next: string) => void;
  /** Canonical form to submit. Falls back to the raw value before the first check. */
  normalized: string;
  status: EmailFieldStatus;
  /** Format problem, once the debounce has settled. */
  error: EmailFormatError | null;
  /** Likely intended address, e.g. after typing "gmial.com". */
  suggestion: string | null;
  /** Applies `suggestion` to the field and clears it. */
  acceptSuggestion: () => void;
  /** Dismisses the suggestion without changing the value (the address may be correct). */
  dismissSuggestion: () => void;
  /** True once the input passes the local format check. */
  isValid: boolean;
  /** Runs the check immediately, skipping the debounce. Call this on submit. */
  validateNow: () => EmailCheckResult;
  /** Clears the field back to its untouched state. */
  reset: () => void;
}

/**
 * Debounced inline email validation for a single input.
 *
 * <p>Deliberately debounced rather than per-keystroke: validating on every
 * character means the field screams "invalid" at someone who has typed "a",
 * which trains people to ignore it. We wait until they pause, then judge.
 *
 * <p>This is format-only (level 1). The domain check and the uniqueness check
 * live on the server and surface through the submit path.
 */
export function useEmailField(
  initial = '',
  { onlyWhenEmailLike = false }: UseEmailFieldOptions = {},
): EmailField {
  const [value, setValue] = useState(initial);
  const [result, setResult] = useState<EmailCheckResult | null>(null);
  const [status, setStatus] = useState<EmailFieldStatus>('empty');
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);

  // Tracks the latest debounce so a fast typist can't have an older timer
  // overwrite the state computed from newer input.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = value.trim();
    if (!trimmed || (onlyWhenEmailLike && !looksLikeEmail(trimmed))) {
      setStatus('empty');
      setResult(null);
      return;
    }

    setStatus('checking');
    timerRef.current = setTimeout(() => {
      const next = checkEmail(value);
      setResult(next);
      setStatus(next.ok ? 'valid' : 'invalid');
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, onlyWhenEmailLike]);

  const update = useCallback((next: string) => {
    setValue(next);
    // A fresh edit may well be the user acting on the previous hint, so let a
    // new suggestion through rather than staying dismissed forever.
    setSuggestionDismissed(false);
  }, []);

  const validateNow = useCallback((): EmailCheckResult => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const next = checkEmail(value);
    setResult(next);
    setStatus(next.ok ? 'valid' : 'invalid');
    return next;
  }, [value]);

  const acceptSuggestion = useCallback(() => {
    const suggestion = result?.suggestion;
    if (!suggestion) return;
    setValue(suggestion);
    setSuggestionDismissed(false);
  }, [result]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setValue('');
    setResult(null);
    setStatus('empty');
    setSuggestionDismissed(false);
  }, []);

  const suggestion = useMemo(
    () => (suggestionDismissed ? null : (result?.suggestion ?? null)),
    [result, suggestionDismissed],
  );

  return {
    value,
    setValue: update,
    normalized: result?.normalized ?? value.trim().toLowerCase(),
    status,
    error: status === 'invalid' ? (result?.error ?? null) : null,
    suggestion,
    acceptSuggestion,
    dismissSuggestion: () => setSuggestionDismissed(true),
    isValid: status === 'valid',
    validateNow,
    reset,
  };
}

/**
 * Countdown for a "resend code" button. The server enforces its own 60s
 * cooldown; this just stops the user from firing requests that are guaranteed
 * to be rejected, and tells them how long is left.
 */
export function useResendCountdown(seconds = 60) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  return {
    remaining,
    canResend: remaining <= 0,
    start: useCallback(() => setRemaining(seconds), [seconds]),
    reset: useCallback(() => setRemaining(0), []),
  };
}
