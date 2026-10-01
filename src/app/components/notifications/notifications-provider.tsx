import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  getNotificationsRequest,
  getUnreadNotificationCountRequest,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
  notificationsTopic,
  type NotificationDto,
} from '../../lib/api';
import { useAuth } from '../auth/auth-provider';
import { parseMessageBody, startRealtime } from '../../lib/realtime';

interface NotificationsContextType {
  notifications: NotificationDto[];
  unreadCount: number;
  loading: boolean;
  /** Re-fetch the latest page + unread count from the server. */
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType>(null!);

const PAGE_SIZE = 30;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, authorizedRequest, getAccessToken } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // `authorizedRequest` is recreated on every AuthProvider render (it closes
  // over the session and is not memoized). Keep it behind a ref so our effects
  // and callbacks can use the latest one WITHOUT taking it as a dependency —
  // otherwise every render would re-run the load + tear down/recreate the
  // WebSocket, a storm that also starved sibling pages' data fetches.
  const authRef = useRef(authorizedRequest);
  authRef.current = authorizedRequest;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [page, count] = await Promise.all([
        authRef.current((token) => getNotificationsRequest(token, { size: PAGE_SIZE })),
        authRef.current((token) => getUnreadNotificationCountRequest(token)),
      ]);
      setNotifications(page.items);
      setUnreadCount(count.count);
    } catch {
      // Best-effort — the bell silently shows the last known state.
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load whenever the signed-in user changes (stable deps only).
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    void refresh();
  }, [isAuthenticated, user?.id, refresh]);

  // Live push subscription on the user's personal notifications topic.
  // Reconnects with backoff and a fresh token; stops on logout/unmount.
  useEffect(() => {
    const userId = user?.id;
    if (!isAuthenticated || !userId) return;
    let reconnect = false;
    const handle = startRealtime({
      getAccessToken,
      onConnect: (client) => {
        client.subscribe(notificationsTopic(userId), (message) => {
          const dto = parseMessageBody<NotificationDto>(message.body);
          if (!dto) return;
          setNotifications((prev) => (prev.some((n) => n.id === dto.id) ? prev : [dto, ...prev]));
          if (!dto.read) {
            setUnreadCount((c) => c + 1);
          }
        });
        // Catch up on anything pushed while the socket was down (the initial
        // load effect above already covers the first connect).
        if (reconnect) void refresh();
        reconnect = true;
      },
    });
    return () => handle.stop();
  }, [isAuthenticated, user?.id, getAccessToken, refresh]);

  const markRead = useCallback(
    async (id: number) => {
      // Optimistic: flip locally, then persist.
      let wasUnread = false;
      setNotifications((prev) =>
        prev.map((n) => {
          if (n.id === id && !n.read) {
            wasUnread = true;
            return { ...n, read: true };
          }
          return n;
        }),
      );
      if (wasUnread) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      try {
        await authRef.current((token) => markNotificationReadRequest(id, token));
      } catch {
        // Roll back the count on failure; the list stays read to avoid flicker.
        void refresh();
      }
    },
    [refresh],
  );

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));
    setUnreadCount(0);
    try {
      await authRef.current((token) => markAllNotificationsReadRequest(token));
    } catch {
      void refresh();
    }
  }, [refresh]);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, loading, refresh, markRead, markAllRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return ctx;
}
