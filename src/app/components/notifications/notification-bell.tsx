import { useState } from "react";
import { useNavigate } from "react-router";
import { Bell, CheckCheck, Settings } from "lucide-react";
import { useI18n, type Language } from "../i18n-provider";
import { useNotifications } from "./notifications-provider";
import { formatDateTime } from "../../lib/datetime";
import type { NotificationDto } from "../../lib/api";

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === "ru" ? ru : l === "kz" ? kz : en;

export function NotificationBell() {
  const { language } = useI18n();
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const recent = notifications.slice(0, 8);

  const handleOpen = (notification: NotificationDto) => {
    void markRead(notification.id);
    setOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={tx(language, "Уведомления", "Хабарламалар", "Notifications")}
        className="relative w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
        style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}
      >
        <Bell size={15} style={{ color: "var(--eco-text-secondary)" }} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center text-[10px] font-semibold"
            style={{ background: "var(--eco-negative)", color: "#fff" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-10 w-[360px] max-w-[92vw] rounded-xl shadow-lg z-50 overflow-hidden"
            style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "var(--eco-border)" }}
            >
              <span className="text-[14px] font-medium" style={{ color: "var(--eco-text)" }}>
                {tx(language, "Уведомления", "Хабарламалар", "Notifications")}
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="flex items-center gap-1 text-[12px] cursor-pointer"
                  style={{ color: "var(--eco-primary)", background: "transparent" }}
                >
                  <CheckCheck size={13} />
                  {tx(language, "Прочитать все", "Барлығын оқу", "Mark all read")}
                </button>
              )}
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {recent.length === 0 ? (
                <div
                  className="px-4 py-10 text-center text-[13px]"
                  style={{ color: "var(--eco-text-tertiary)" }}
                >
                  {tx(language, "Нет уведомлений", "Хабарламалар жоқ", "No notifications")}
                </div>
              ) : (
                recent.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleOpen(n)}
                    className="block w-full text-left px-4 py-3 border-b cursor-pointer transition-colors hover:opacity-90"
                    style={{
                      borderColor: "var(--eco-border)",
                      background: n.read ? "transparent" : "var(--eco-brand-50)",
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <span
                          className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                          style={{ background: "var(--eco-primary)" }}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-[13px] font-medium truncate"
                          style={{ color: "var(--eco-text)" }}
                        >
                          {n.title}
                        </div>
                        <div
                          className="text-[12px] mt-0.5 line-clamp-2"
                          style={{ color: "var(--eco-text-secondary)" }}
                        >
                          {n.body}
                        </div>
                        <div className="text-[11px] mt-1" style={{ color: "var(--eco-text-tertiary)" }}>
                          {formatDateTime(n.createdAt, language)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div
              className="flex items-center justify-between px-4 py-2.5 border-t"
              style={{ borderColor: "var(--eco-border)" }}
            >
              <button
                type="button"
                onClick={() => { setOpen(false); navigate("/notifications-inbox"); }}
                className="text-[13px] cursor-pointer"
                style={{ color: "var(--eco-primary)", background: "transparent" }}
              >
                {tx(language, "Все уведомления", "Барлық хабарламалар", "View all")}
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); navigate("/notification-prefs"); }}
                aria-label={tx(language, "Настройки", "Параметрлер", "Settings")}
                className="flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer"
                style={{ color: "var(--eco-text-tertiary)", background: "transparent" }}
              >
                <Settings size={15} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
