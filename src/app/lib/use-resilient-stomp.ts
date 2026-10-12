import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';

/**
 * Shared resilient STOMP connection for the support / admin-tickets live views.
 *
 * Why this exists: both call sites previously used a flat `reconnectDelay: 5000`,
 * so an expired or revoked session reconnected forever every 5s — a storm against
 * the backend and a dead UI. This hook instead:
 *
 *  - owns reconnection itself (stompjs auto-reconnect is disabled) with
 *    exponential backoff + jitter, capped (default 1s → 30s);
 *  - STOPS reconnecting on an authorization failure (a STOMP ERROR frame at
 *    CONNECT, or the session token no longer being obtainable) and reports it so
 *    the caller can show a "session expired, sign in again" state;
 *  - re-reads the auth token on every attempt, so a token refreshed elsewhere is
 *    picked up and a stale token is never reused forever;
 *  - keeps exactly one live client (and therefore one subscription per topic):
 *    the previous client is fully torn down before a new one subscribes;
 *  - tears down fully on unmount and whenever `enabled` goes false (logout) — no
 *    orphaned client, no orphaned timer;
 *  - reconnects exactly once on tab resume (visibilitychange) instead of firing a
 *    burst of queued attempts.
 *
 * Changing `url` or `subscriptionKey` tears down and re-subscribes, so callers
 * pass the ticket id as the subscription key to re-target cleanly.
 */

export type StompStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'expired';

export interface ResilientStompOptions {
  /** Connect only while true. Pass `isAuthenticated && hasTarget`; false tears down. */
  enabled: boolean;
  /** WebSocket URL (a stable string value). */
  url: string;
  /** Re-subscribe trigger: changing it tears down and reconnects (e.g. ticket id). */
  subscriptionKey?: string | number | null;
  /** Resolve the current bearer token; reject when the session is gone. */
  getToken: () => Promise<string>;
  /** Register subscriptions here; called on every (re)connect with the live client. */
  onConnect: (client: Client) => void;
  /** Called once when we stop due to an authorization failure. */
  onAuthFailure?: () => void;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export function useResilientStomp(opts: ResilientStompOptions): StompStatus {
  const { enabled, url, subscriptionKey = null } = opts;
  const baseDelay = opts.baseDelayMs ?? 1_000;
  const maxDelay = opts.maxDelayMs ?? 30_000;

  const [status, setStatus] = useState<StompStatus>('idle');

  // Keep the latest callbacks without retriggering the connection effect.
  const getTokenRef = useRef(opts.getToken);
  const onConnectRef = useRef(opts.onConnect);
  const onAuthFailureRef = useRef(opts.onAuthFailure);
  getTokenRef.current = opts.getToken;
  onConnectRef.current = opts.onConnect;
  onAuthFailureRef.current = opts.onAuthFailure;

  useEffect(() => {
    if (!enabled || !url) {
      setStatus('idle');
      return;
    }

    let stopped = false;
    let connected = false;
    let attempt = 0;
    let client: Client | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let generation = 0; // guards stale async connect() resolutions

    const clearTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const teardownClient = () => {
      const c = client;
      client = null;
      connected = false;
      if (c) {
        // Neutralize handlers so deactivate()'s close doesn't trigger a reconnect.
        c.onWebSocketClose = () => {};
        c.onStompError = () => {};
        c.onWebSocketError = () => {};
        void c.deactivate();
      }
    };

    const giveUpAuth = () => {
      if (stopped) return;
      stopped = true;
      clearTimer();
      teardownClient();
      setStatus('expired');
      onAuthFailureRef.current?.();
    };

    const scheduleReconnect = () => {
      if (stopped || timer) return;
      const expo = Math.min(maxDelay, baseDelay * 2 ** attempt);
      const delay = expo + Math.random() * expo * 0.3; // jitter up to +30%
      attempt = Math.min(attempt + 1, 12);
      setStatus('reconnecting');
      timer = setTimeout(() => {
        timer = null;
        void connect();
      }, delay);
    };

    const connect = async () => {
      if (stopped) return;
      const myGen = ++generation;
      setStatus(attempt === 0 ? 'connecting' : 'reconnecting');

      let token: string;
      try {
        token = await getTokenRef.current();
      } catch {
        // Session gone / refresh failed — stop, never storm.
        giveUpAuth();
        return;
      }
      if (stopped || myGen !== generation) return;

      teardownClient(); // exactly one client at a time

      const c = new Client({
        webSocketFactory: () => new WebSocket(url),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 0, // this hook owns reconnection
        onConnect: () => {
          if (stopped) return;
          attempt = 0;
          connected = true;
          setStatus('connected');
          onConnectRef.current(c);
        },
        onStompError: () => {
          // A STOMP ERROR frame at CONNECT is this backend's authorization
          // rejection — stop rather than loop forever with a dead token.
          giveUpAuth();
        },
        onWebSocketClose: () => {
          if (stopped) return;
          connected = false;
          scheduleReconnect();
        },
        onWebSocketError: () => {
          // A close event follows; reconnection is scheduled there.
        },
      });
      client = c;
      c.activate();
    };

    const onVisibility = () => {
      if (stopped || document.visibilityState !== 'visible' || connected) return;
      // Resume: cancel any pending backoff and attempt exactly one reconnect now.
      attempt = 0;
      clearTimer();
      void connect();
    };

    void connect();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', onVisibility);
      clearTimer();
      teardownClient();
    };
  }, [enabled, url, subscriptionKey, baseDelay, maxDelay]);

  return status;
}
