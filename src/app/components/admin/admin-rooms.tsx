import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Card, Button, RoomStatusBadge } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { useI18n } from "../i18n-provider";
import { useAuth } from "../auth/auth-provider";
import {
  blockRoomRequest,
  getAdminRoomsRequest,
  type RoomSummaryDto,
} from "../../lib/api";
import {
  ShieldX,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ConfirmActionModal, FlashBanner, formatAdminApiError, useFlash } from "./admin-action-ui";

const PAGE_SIZE = 20;

export function AdminRoomsPage() {
  const { t } = useI18n();
  const { authorizedRequest } = useAuth();
  const [searchParams] = useSearchParams();

  const [items, setItems] = useState<RoomSummaryDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Honor `?selected=<id>` so the global admin search can deep-link straight
  // to a room's detail panel.
  useEffect(() => {
    const raw = searchParams.get("selected");
    if (!raw) return;
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) setSelectedId(parsed);
  }, [searchParams]);
  const [blockModal, setBlockModal] = useState<RoomSummaryDto | null>(null);
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  const { flash, show: showFlash } = useFlash();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await authorizedRequest((token) =>
        getAdminRoomsRequest(token, { page, size: PAGE_SIZE }),
      );
      setItems(result.items);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, page, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => items.find((r) => r.id === selectedId) ?? null,
    [items, selectedId],
  );

  const closeBlockModal = () => {
    setBlockModal(null);
    setBlockError(null);
  };

  const submitBlock = async (reason: string) => {
    if (!blockModal) return;
    setBlockSubmitting(true);
    setBlockError(null);
    try {
      await authorizedRequest((token) => blockRoomRequest(blockModal.id, reason, token));
      // Optimistically update local list
      setItems((prev) =>
        prev.map((r) => (r.id === blockModal.id ? { ...r, status: "BLOCKED" } : r)),
      );
      showFlash("success", t("actionCompletedAndLogged"));
      closeBlockModal();
    } catch (err) {
      setBlockError(formatAdminApiError(err, t));
    } finally {
      setBlockSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{t("rooms")}</h1>
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={13} /> {t("retry")}
          </Button>
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
                {t("emptyRooms")}
              </Card>
            )}
            {items.map((r) => {
              const active = selectedId === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="text-left p-4 rounded-xl transition-all cursor-pointer"
                  style={{
                    background: active ? "var(--eco-brand-50)" : "var(--eco-surface-raised)",
                    border: `1px solid ${active ? "var(--eco-primary)" : "var(--eco-border)"}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>
                      R-{r.id}
                    </span>
                    <RoomStatusBadge status={r.status} />
                  </div>
                  <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{r.title}</div>
                  <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                    {r.serviceName} · {r.maxMembers} {t("seatsLower")}
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

          <div className="lg:col-span-2">
            {!selected ? (
              <Card className="flex items-center justify-center py-16 text-[14px]" style={{ color: "var(--eco-text-tertiary)" }}>
                {t("selectRoomToView")}
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                <Card className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="text-[18px] break-words" style={{ color: "var(--eco-text)" }}>{selected.title}</div>
                      <div className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
                        R-{selected.id} · {selected.serviceName}
                      </div>
                    </div>
                    <RoomStatusBadge status={selected.status} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
                    {[
                      { label: t("seats"), value: `${selected.maxMembers}` },
                      { label: t("startLabel"), value: selected.startDate },
                      { label: t("totalCost"), value: `₸${(selected.priceTotal ?? 0).toLocaleString()}` },
                      { label: t("owner"), value: selected.ownerDisplayName ?? `#${selected.ownerUserId}` },
                    ].map((s) => (
                      <div key={s.label}>
                        <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{s.label}</div>
                        <div style={{ color: "var(--eco-text)" }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {selected.status !== "BLOCKED" && (
                      <Button variant="destructive" size="sm" onClick={() => setBlockModal(selected)}>
                        <ShieldX size={13} /> {t("blockRoom")}
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>

        <ConfirmActionModal
          open={!!blockModal}
          onClose={closeBlockModal}
          title={blockModal ? t("blockRoom") : ""}
          description={t("blockRoomConfirm")}
          subjectLabel={blockModal ? `R-${blockModal.id} — ${blockModal.title}` : null}
          destructive
          submitLabel={t("blockRoom")}
          submitting={blockSubmitting}
          errorMessage={blockError}
          onConfirm={submitBlock}
        />
      </div>
    </AdminLayout>
  );
}
