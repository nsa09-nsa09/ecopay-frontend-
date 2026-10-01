// Shared STOMP-over-WebSocket client factory.
//
// Every live subscription (notifications, ban listener, support chat, room
// chat, staff ticket queue) goes through here so they all get the same
// production behaviour:
// - a fresh access token on every (re)connect (no stale-token reconnect loop);
// - exponential backoff with a cap instead of a fixed 5 s retry;
// - a hard stop after repeated failures (e.g. auth rejected at the handshake),
//   resumed only when the tab becomes visible again or the device comes back
//   online — never an infinite reconnect storm;
// - deterministic teardown on unmount/logout.

import { Client, ReconnectionTimeMode } from '@stomp/stompjs';
import { buildSupportWebSocketUrl } from './api';

export interface RealtimeOptions {
  /** Returns a currently valid access token, or null when signed out. */
  getAccessToken: () => Promise<string | null>;
  /** Called after every successful (re)connect: (re)create subscriptions here. */
  onConnect: (client: Client) => void;
  /** Consecutive failed attempts before giving up until visibility/online. */
  maxConsecutiveFailures?: number;
}

export interface RealtimeHandle {
  stop: () => void;
}

const INITIAL_DELAY_MS = 2000;
const MAX_DELAY_MS = 60_000;

export function startRealtime(options: RealtimeOptions): RealtimeHandle {
  const maxFailures = options.maxConsecutiveFailures ?? 6;
  let failures = 0;
  let stopped = false;
  let suspended = false;
  let connected = false;

  const client = new Client({
    webSocketFactory: () => new WebSocket(buildSupportWebSocketUrl()),
    reconnectDelay: INITIAL_DELAY_MS,
    reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
    maxReconnectDelay: MAX_DELAY_MS,
    heartbeatIncoming: 20_000,
    heartbeatOutgoing: 20_000,
    debug: () => {},
    beforeConnect: async () => {
      let token: string | null = null;
      try {
        token = await options.getAccessToken();
      } catch {
        token = null;
      }
      if (!token || stopped) {
        // Signed out (or refresh rejected): do not keep knocking.
        suspend();
        return;
      }
      client.connectHeaders = { Authorization: `Bearer ${token}` };
    },
    onConnect: () => {
      connected = true;
      failures = 0;
      try {
        options.onConnect(client);
      } catch {
        /* a subscriber bug must not kill the connection loop */
      }
    },
    onStompError: () => {
      // The broker rejected the CONNECT/SUBSCRIBE (commonly an expired or
      // invalid token). Count it; the next attempt fetches a fresh token.
      registerFailure();
    },
    onWebSocketClose: () => {
      if (!connected) registerFailure();
      connected = false;
    },
    onWebSocketError: () => {
      /* followed by onWebSocketClose */
    },
  });

  function registerFailure() {
    failures += 1;
    if (failures >= maxFailures) suspend();
  }

  function suspend() {
    if (suspended || stopped) return;
    suspended = true;
    void client.deactivate();
  }

  function resume() {
    if (stopped || !suspended) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    suspended = false;
    failures = 0;
    client.activate();
  }

  const onVisibility = () => {
    if (document.visibilityState === 'visible') resume();
  };
  const onOnline = () => resume();

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('online', onOnline);
  }

  client.activate();

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', onOnline);
      }
      try {
        void client.deactivate();
      } catch {
        /* ignore */
      }
    },
  };
}

/** Parses a STOMP message body as JSON; malformed pushes are ignored. */
export function parseMessageBody<T>(body: string): T | null {
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}
