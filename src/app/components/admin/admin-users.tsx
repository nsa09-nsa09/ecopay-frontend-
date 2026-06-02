import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Button, Badge, Input } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { useI18n } from "../i18n-provider";
import { useAuth } from "../auth/auth-provider";
import {
  banUserRequest,
  getAdminUsersRequest,
  unbanUserRequest,
  type AdminUserDto,
} from "../../lib/api";
import {
  Ban,
  ShieldCheck,
  Shield,
  Star,
  Home,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ConfirmActionModal, FlashBanner, formatAdminApiError, useFlash } from "./admin-action-ui";

const PAGE_SIZE = 20;

export function AdminUsersPage() {
  const { t } = useI18n();
  const { authorizedRequest } = useAuth();

  const [items, setItems] = useState<AdminUserDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [banModal, setBanModal] = useState<{ user: AdminUserDto; action: "BAN" | "UNBAN" } | null>(null);
  const [banSubmitting, setBanSubmitting] = useState(false);
  const [banError, setBanError] = useState<string | null>(null);
  const { flash, show: showFlash } = useFlash();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await authorizedRequest((token) =>
        getAdminUsersRequest(token, { page, size: PAGE_SIZE, search: search || undefined }),
      );
      setItems(result.items);
      setTotalPages(Math.max(1, result.totalPages));
      // Keep selection coherent across reloads
      if (selectedId && !result.items.some((u) => u.id === selectedId)) {
        setSelectedId(null);
      }
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, page, search, selectedId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  // Debounce the search input → query state
  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const selected = useMemo(
    () => items.find((u) => u.id === selectedId) ?? null,
    [items, selectedId],
  );

  const isBanned = (u: AdminUserDto) => u.status === "BANNED";

  const closeBanModal = () => {
    setBanModal(null);
    setBanError(null);
  };

  const submitBan = async (reason: string) => {
    if (!banModal) return;
    setBanSubmitting(true);
    setBanError(null);
    try {
      const updated = await authorizedRequest((token) =>
        banModal.action === "BAN"
          ? banUserRequest(banModal.user.id, reason, token)
          : unbanUserRequest(banModal.user.id, reason, token),
      );
      setItems((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showFlash("success", t("actionCompletedAndLogged"));
      closeBanModal();
    } catch (err) {
      setBanError(formatAdminApiError(err, t));
    } finally {
      setBanSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{t("users")}</h1>
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={13} /> {t("retry")}
          </Button>
        </div>

        <div className="mb-4 max-w-md">
          <Input
            placeholder={t("searchUsersPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <FlashBanner flash={flash} />

        {error && !loading && (
          <Card className="flex flex-col gap-2 mb-4">
            <div className="text-[14px]" style={{ color: "var(--eco-negative)" }}>{t("loadFailedTitle")}</div>
            <div className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{error}</div>
            <Button variant="primary" size="sm" onClick={() => void load()}>
              <RefreshCw size={13} /> {t("retry")}
            </Button>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-1 flex flex-col gap-2">
            {loading && items.length === 0 && (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl"
                    style={{ background: "var(--eco-surface-raised)", border: "1px solid var(--eco-border)", minHeight: 80 }}
                  />
                ))}
              </>
            )}
            {!loading && items.length === 0 && (
              <Card className="text-center text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
                {t("emptyUsers")}
              </Card>
            )}
            {items.map((u) => {
              const banned = isBanned(u);
              const active = selectedId === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedId(u.id)}
                  className="text-left p-4 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: active ? "var(--eco-brand-50)" : "var(--eco-surface-raised)",
                    border: `1px solid ${active ? "var(--eco-primary)" : "var(--eco-border)"}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>
                      U-{u.id}
                    </span>
                    {banned && <Badge variant="danger">{t("bannedBadge")}</Badge>}
                  </div>
                  <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{u.displayName}</div>
                  <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                    <span className="flex items-center gap-0.5" style={{ color: "var(--eco-warning-500)" }}>
                      <Star size={10} fill="currentColor" /> {u.reputation ?? 0}
                    </span>
                    · {u.emailMasked ?? u.email}
                  </div>
                </button>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-2 text-[12px]">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 0 || loading}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft size={12} /> {t("prevPage")}
                </Button>
                <span style={{ color: "var(--eco-text-tertiary)" }}>
                  {t("pageOf", { page: page + 1, total: totalPages })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages - 1 || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t("nextPage")} <ChevronRight size={12} />
                </Button>
              </div>
            )}
          </div>

          {/* Detail */}
          <div className="lg:col-span-2">
            {!selected ? (
              <Card className="flex items-center justify-center py-16 text-[14px]" style={{ color: "var(--eco-text-tertiary)" }}>
                {t("selectUserToView")}
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                <Card className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[14px]"
                        style={{ background: "var(--eco-surface)", color: "var(--eco-text-secondary)" }}
                      >
                        {(selected.displayName || "?").charAt(0)}
                      </div>
                      <div>
                        <div className="text-[18px]" style={{ color: "var(--eco-text)" }}>{selected.displayName}</div>
                        <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                          U-{selected.id} · {selected.emailMasked ?? selected.email}
                          {selected.createdAt ? ` · ${t("sinceLabel")} ${new Date(selected.createdAt).toLocaleDateString()}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isBanned(selected) && <Badge variant="danger">{t("bannedBadge")}</Badge>}
                      {selected.role && <Badge variant="info">{selected.role}</Badge>}
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { label: t("rating"), value: `${selected.reputation ?? 0}`, icon: Star },
                      { label: t("owned"), value: `${selected.roomsOwned ?? 0}`, icon: Home },
                      { label: t("joinedCount"), value: `${selected.roomsJoined ?? 0}`, icon: Home },
                      { label: t("tickets"), value: `${selected.tickets ?? 0}`, icon: MessageSquare },
                      { label: t("disputes"), value: `${selected.disputes ?? 0}`, icon: AlertTriangle },
                    ].map((s) => {
                      const Icon = s.icon;
                      return (
                        <div key={s.label} className="p-2.5 rounded-lg" style={{ background: "var(--eco-surface)" }}>
                          <div className="flex items-center gap-1.5 text-[11px] mb-0.5" style={{ color: "var(--eco-text-tertiary)" }}>
                            <Icon size={11} /> {s.label}
                          </div>
                          <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>{s.value}</div>
                        </div>
                      );
                    })}
                  </div>

                  {selected.phoneMasked && (
                    <div className="flex items-center gap-2 text-[12px] pt-3 border-t" style={{ borderColor: "var(--eco-border)" }}>
                      <Shield size={12} style={{ color: "var(--eco-text-tertiary)" }} />
                      <span style={{ color: "var(--eco-text-secondary)", fontFamily: "monospace" }}>
                        {selected.phoneMasked}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!isBanned(selected) ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setBanModal({ user: selected, action: "BAN" })}
                      >
                        <Ban size={13} /> {t("banUser")}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setBanModal({ user: selected, action: "UNBAN" })}
                      >
                        <ShieldCheck size={13} /> {t("unbanUser")}
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>

        <ConfirmActionModal
          open={!!banModal}
          onClose={closeBanModal}
          title={banModal ? (banModal.action === "BAN" ? t("banUser") : t("unbanUser")) : ""}
          description={
            banModal
              ? (
                  <>
                    {banModal.action === "BAN" ? t("banUserConfirm") : t("unbanUserConfirm")}
                    <div style={{ marginTop: 8, fontSize: 12, color: "var(--eco-text-tertiary)" }}>
                      {t("banReasonHint")}
                    </div>
                  </>
                )
              : null
          }
          subjectLabel={banModal ? `U-${banModal.user.id} — ${banModal.user.displayName}` : null}
          destructive={banModal?.action === "BAN"}
          submitLabel={banModal ? (banModal.action === "BAN" ? t("banUser") : t("unbanUser")) : ""}
          submitting={banSubmitting}
          errorMessage={banError}
          onConfirm={submitBan}
        />
      </div>
    </AdminLayout>
  );
}
