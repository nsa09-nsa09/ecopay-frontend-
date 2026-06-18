import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Bell, CheckCheck, Inbox, Loader2, RefreshCw } from "lucide-react";
import { Card, Button, Badge, EmptyState, SkeletonCard } from "../ds-primitives";
import { useI18n, type Language } from "../i18n-provider";
import { useNotifications } from "../notifications/notifications-provider";
import { useAuth } from "../auth/auth-provider";
import { formatDateTime } from "../../lib/datetime";
import {
  getNotificationsRequest,
  type NotificationDto,
  type NotificationCategory,
} from "../../lib/api";

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === "ru" ? ru : l === "kz" ? kz : en;

const PAGE_SIZE = 30;

type FilterTab = "all" | "unread";

const CATEGORY_OF: Record<string, NotificationCategory> = {
  MEMBER_JOINED: "MEMBERSHIP",
  OWNER_ACCESS_GRANTED: "MEMBERSHIP",
  MEMBER_CONFIRMED: "MEMBERSHIP",
  MEMBERSHIP_ACTIVATED: "MEMBERSHIP",
  MEMBERSHIP_REJECTED: "MEMBERSHIP",
  CONFIRMATION_DEADLINE_WARNING: "MEMBERSHIP",
  ROOM_ACTIVE: "ROOM",
  ROOM_COMPLETED: "ROOM",
  ROOM_BLOCKED: "ROOM",
  ROOM_CANCELLED: "ROOM",
  PAYMENT_SUCCESS: "PAYMENTS",
  PAYMENT_FAILED: "PAYMENTS",
  REFUND_ISSUED: "PAYMENTS",
  PAYOUT_SENT: "PAYMENTS",
  DISPUTE_OPENED: "DISPUTES",
  DISPUTE_RESOLVED: "DISPUTES",
  TICKET_REPLY: "SUPPORT",
  ACCOUNT_BANNED: "ACCOUNT",
  ACCOUNT_UNBANNED: "ACCOUNT",
};

const CATEGORY_VARIANT: Record<NotificationCategory, "default" | "success" | "warning" | "danger" | "info"> = {
  MEMBERSHIP: "info",
  ROOM: "default",
  PAYMENTS: "success",
  DISPUTES: "danger",
  SUPPORT: "warning",
  ACCOUNT: "danger",
};

function categoryLabel(category: NotificationCategory, language: Language): string {
  switch (category) {
    case "MEMBERSHIP": return tx(language, "Участие", "Қатысу", "Membership");
    case "ROOM": return tx(language, "Комната", "Бөлме", "Room");
    case "PAYMENTS": return tx(language, "Платежи", "Төлемдер", "Payments");
    case "DISPUTES": return tx(language, "Споры", "Даулар", "Disputes");
    case "SUPPORT": return tx(language, "Поддержка", "Қолдау", "Support");
    case "ACCOUNT": return tx(language, "Аккаунт", "Аккаунт", "Account");
    default: return category;
  }
}

export function NotificationsInboxPage() {
  const { language } = useI18n();
  const navigate = useNavigate();
  const { authorizedRequest } = useAuth();
  const { notifications, unreadCount, loading, refresh, markRead, markAllRead } = useNotifications();

  const [tab, setTab] = useState<FilterTab>("all");
  // Pages beyond the first that the provider already holds, loaded on demand.
  const [older, setOlder] = useState<NotificationDto[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // A second page may exist once the provider's first page fills.
  useEffect(() => {
    setHasMore(notifications.length >= PAGE_SIZE);
  }, [notifications.length]);

  const merged = useMemo(() => {
    const seen = new Set<number>();
    const out: NotificationDto[] = [];
    for (const n of [...notifications, ...older]) {
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      out.push(n);
    }
    return out;
  }, [notifications, older]);

  const visible = useMemo(
    () => (tab === "unread" ? merged.filter((n) => !n.read) : merged),
    [merged, tab],
  );

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await authorizedRequest((token) =>
        getNotificationsRequest(token, { page: next, size: PAGE_SIZE }),
      );
      setOlder((prev) => [...prev, ...res.items]);
      setPage(next);
      setHasMore(res.hasNext);
    } catch {
      /* swallow — button stays available for retry */
    } finally {
      setLoadingMore(false);
    }
  };

  const handleOpen = (n: NotificationDto) => {
    void markRead(n.id);
    // Keep the older-pages list visually in sync.
    setOlder((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    if (n.link) navigate(n.link);
  };

  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Bell size={20} style={{ color: "var(--eco-primary)" }} />
          <h1 className="text-[20px] font-semibold" style={{ color: "var(--eco-text)" }}>
            {tx(language, "Уведомления", "Хабарламалар", "Notifications")}
          </h1>
          {unreadCount > 0 && <Badge variant="info">{unreadCount}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setOlder([]); setPage(0); void refresh(); }}>
            <RefreshCw size={14} />
            {tx(language, "Обновить", "Жаңарту", "Refresh")}
          </Button>
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={() => void markAllRead()}>
              <CheckCheck size={14} />
              {tx(language, "Прочитать все", "Барлығын оқу", "Mark all read")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {(["all", "unread"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className="px-3 py-1.5 rounded-lg text-[13px] cursor-pointer transition-colors"
            style={{
              background: tab === value ? "var(--eco-brand-50)" : "var(--eco-surface)",
              color: tab === value ? "var(--eco-primary)" : "var(--eco-text-secondary)",
              border: "1px solid var(--eco-border)",
            }}
          >
            {value === "all"
              ? tx(language, "Все", "Барлығы", "All")
              : tx(language, "Непрочитанные", "Оқылмаған", "Unread")}
          </button>
        ))}
      </div>

      {loading && merged.length === 0 ? (
        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            title={tx(language, "Пока пусто", "Әзірге бос", "Nothing yet")}
            description={tx(
              language,
              "Здесь появятся уведомления о ваших комнатах, платежах и заявках.",
              "Мұнда бөлмелер, төлемдер және өтінімдер туралы хабарламалар көрінеді.",
              "Notifications about your rooms, payments and requests will appear here.",
            )}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((n) => {
            const category = CATEGORY_OF[String(n.type)] ?? "ROOM";
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleOpen(n)}
                className="text-left rounded-xl p-4 cursor-pointer transition-colors hover:opacity-95"
                style={{
                  background: n.read ? "var(--eco-surface)" : "var(--eco-brand-50)",
                  border: "1px solid var(--eco-border)",
                }}
              >
                <div className="flex items-start gap-3">
                  {!n.read && (
                    <span
                      className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                      style={{ background: "var(--eco-primary)" }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-medium" style={{ color: "var(--eco-text)" }}>
                        {n.title}
                      </span>
                      <Badge variant={CATEGORY_VARIANT[category]}>{categoryLabel(category, language)}</Badge>
                    </div>
                    <div className="text-[13px] mt-1" style={{ color: "var(--eco-text-secondary)" }}>
                      {n.body}
                    </div>
                    <div className="text-[11px] mt-1.5" style={{ color: "var(--eco-text-tertiary)" }}>
                      {formatDateTime(n.createdAt, language)}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {tab === "all" && hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="ghost" size="sm" onClick={() => void loadMore()} disabled={loadingMore}>
                {loadingMore ? <Loader2 size={14} className="animate-spin" /> : <Inbox size={14} />}
                {tx(language, "Загрузить ещё", "Тағы жүктеу", "Load more")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
