import { useEffect, useRef, type DependencyList } from 'react';
import { Client } from '@stomp/stompjs';
import { buildSupportWebSocketUrl } from '../../lib/api';
import { useAuth } from '../auth/auth-provider';

// Shared resilient STOMP connection for the support/admin ticket live feeds.
//
// Replaces the old flat `reconnectDelay: 5000` (which reconnected forever every
// 5s on an expired/revoked session — a storm against the backend and a dead UI):
//  - exponential backoff with jitter, capped at MAX_RECONNECT_MS;
//  - STOP reconnecting on an authorization failure and surface it via
//    `onAuthFailure` so the UI can show a "sign in again" action instead of looping;
//  - full teardown on unmount AND on logout (the effect keys on `isAuthenticated`);
//  - exactly one live client/subscription set per render cycle (the previous
//    client is deactivated before a new one is created);
//  - mobile background/resume: a suspended tab reconnects once on resume with the
//    backoff reset to base, never a queued burst.

const BASE_RECONNECT_MS = 1000;
const MAX_RECONNECT_MS = 30000;
const AUTH_FAILURE = /unauthor|forbidden|denied|\b401\b|\b403\b|expired|not authenticated/;

export interface SupportSocketConfig {
  /**
   * Register subscriptions on the freshly-connected client. Runs on every
   * (re)connect; the whole client is deactivated on teardown, so there is
   * nothing to unsubscribe manually.
   */
  onConnect: (client: Client) => void;
  /** Re-establish the socket when any of these change (e.g. [ticketId]). */
  deps: DependencyList;
  /** Only connect while true (e.g. a ticket is open). Defaults to true. */
  enabled?: boolean;
  /** Called once when the session is rejected — surface a "sign in again" state. */
  onAuthFailure?: () => void;
}

export function useSupportSocket({
  onConnect,
  deps,
  enabled = true,
  onAuthFailure,
}: SupportSocketConfig): void {
  const { authorizedRequest, isAuthenticated } = useAuth();

  // Keep the latest callbacks without forcing a reconnect every render.
  const onConnectRef = useRef(onConnect);
  const onAuthFailureRef = useRef(onAuthFailure);
  onConnectRef.current = onConnect;
  onAuthFailureRef.current = onAuthFailure;

  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    let disposed = false;
    let backoff = BASE_RECONNECT_MS;
    let client: Client;

    const stopForAuth = () => {
      if (disposed) return;
      onAuthFailureRef.current?.();
      void client.deactivate(); // stop the reconnect loop for good
    };

    client = new Client({
      webSocketFactory: () => new WebSocket(buildSupportWebSocketUrl()),
      reconnectDelay: BASE_RECONNECT_MS,
      // Attach the current access token before every (re)connect so a long-lived
      // socket uses the latest session token. If the session is gone, stop.
      beforeConnect: async () => {
        try {
          const token = await authorizedRequest(async (t) => t);
          client.connectHeaders = { Authorization: `Bearer ${token}` };
        } catch {
          stopForAuth();
        }
      },
      onConnect: () => {
        backoff = BASE_RECONNECT_MS;
        client.reconnectDelay = BASE_RECONNECT_MS;
        if (!disposed) onConnectRef.current(client);
      },
      onWebSocketClose: () => {
        // Exponential backoff with jitter, capped — no fixed-interval storm.
        backoff = Math.min(backoff * 2, MAX_RECONNECT_MS);
        client.reconnectDelay = backoff + Math.random() * backoff * 0.25;
      },
      onStompError: (frame) => {
        const detail = `${frame.headers?.message ?? ''} ${frame.body ?? ''}`.toLowerCase();
        if (AUTH_FAILURE.test(detail)) {
          stopForAuth();
        } else {
          console.error('Support WebSocket STOMP error:', frame.headers?.message);
        }
      },
    });

    client.activate();

    // A tab suspended on mobile may have missed its reconnect timer. On resume,
    // if the socket is down, reset the backoff and reconnect exactly once.
    const onVisible = () => {
      if (disposed || document.visibilityState !== 'visible' || client.connected) return;
      backoff = BASE_RECONNECT_MS;
      client.reconnectDelay = BASE_RECONNECT_MS;
      void client
        .deactivate()
        .then(() => {
          if (!disposed) client.activate();
        })
        .catch(() => {
          /* best effort — next visibility change retries */
        });
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisible);
      void client.deactivate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorizedRequest, isAuthenticated, enabled, ...deps]);
}
