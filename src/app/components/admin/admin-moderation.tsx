import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Button, Badge } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { useI18n } from "../i18n-provider";
import { useAuth } from "../auth/auth-provider";
import {
  assignModerationItemRequest,
  blockRoomRequest,
  confirmModerationItemRequest,
  getModerationQueueRequest,
  rejectModerationItemRequest,
  type ModerationQueueItemDto,
} from "../../lib/api";
import {
  Shield,
  CheckCircle2,
  XCircle,
  ShieldX,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { ConfirmActionModal, FlashBanner, formatAdminApiError, useFlash } from "./admin-action-ui";

type ActionKind = "CONFIRM" | "REJECT" | "BLOCK";

type ActionState = {
  kind: ActionKind;
  item: ModerationQueueItemDto;
};

function riskNumeric(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isNaN(n) ? null : n;
}

function riskColor(score: number | null) {
  if (score == null) return "var(--eco-text-tertiary)";
  if (score >= 70) return "var(--eco-negative)";
  if (score >= 40) return "var(--eco-warning)";
  return "var(--eco-positive)";
}

function entityLabelKey(type: string): string {
  const t = type.toUpperCase();
  if (t.includes("ROOM_MEMBER") || t === "MEMBER") return "moderationItemMember";
  if (t.includes("ROOM")) return "moderationItemRoom";
  return "moderationItemUnknown";
}

export function AdminModerationPage() {
  const { t } = useI18n();
  const { authorizedRequest, user } = useAuth();

  const [items, setItems] = useState<ModerationQueueItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [action, setAction] = useState<ActionState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyAssignId, setBusyAssignId] = useState<number | null>(null);

  const { flash, show: showFlash } = useFlash();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authorizedRequest((token) => getModerationQueueRequest(token));
      setItems(data);
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyUpdate = (updated: ModerationQueueItemDto) => {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleAssign = async (item: ModerationQueueItemDto) => {
    setBusyAssignId(item.id);
    try {
      const updated = await authorizedRequest((token) => assignModerationItemRequest(item.id, token));
      applyUpdate(updated);
      showFlash("success", t("actionCompletedAndLogged"));
    } catch (err) {
      showFlash("error", formatAdminApiError(err, t));
    } finally {
      setBusyAssignId(null);
    }
  };

  const openAction = (kind: ActionKind, item: ModerationQueueItemDto) => {
    setAction({ kind, item });
    setActionError(null);
  };

  const closeAction = () => {
    setAction(null);
    setActionError(null);
  };

  const submitAction = async (reason: string) => {
    if (!action) return;
    setSubmitting(true);
    setActionError(null);
    try {
      if (action.kind === "CONFIRM") {
        const updated = await authorizedRequest((token) =>
          confirmModerationItemRequest(action.item.id, reason, token),
        );
        applyUpdate(updated);
        // Resolved items leave the active queue.
        if (updated.status && updated.status !== "OPEN" && updated.status !== "ASSIGNED") {
          removeItem(updated.id);
        }
      } else if (action.kind === "REJECT") {
        const updated = await authorizedRequest((token) =>
          rejectModerationItemRequest(action.item.id, reason, token),
        );
        applyUpdate(updated);
        if (updated.status && updated.status !== "OPEN" && updated.status !== "ASSIGNED") {
          removeItem(updated.id);
        }
      } else if (action.kind === "BLOCK") {
        if (!action.item.roomId) {
          throw new ApiError(400, t("loadFailedTitle"));
        }
        await authorizedRequest((token) =>
          blockRoomRequest(action.item.roomId!, reason, token),
        );
        // Block doesn't return the item; reload list so derived status reflects reality.
        await load();
      }
      showFlash("success", t("actionCompletedAndLogged"));
      closeAction();
    } catch (err) {
      setActionError(formatAdminApiError(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  const activeQueue = useMemo(
    () => items.filter((it) => !it.status || it.status === "OPEN" || it.status === "ASSIGNED"),
    [items],
  );

  const actionTitle = useMemo(() => {
    if (!action) return "";
    if (action.kind === "CONFIRM") return t("confirmModerationTitle");
    if (action.kind === "REJECT") return t("rejectModerationTitle");
    return t("blockRoomTitle");
  }, [action, t]);

  const actionDescription = useMemo(() => {
    if (!action) return null;
    if (action.kind === "CONFIRM") return t("confirmModerationItem");
    if (action.kind === "REJECT") return t("rejectModerationItem");
    return t("blockRoomConfirm");
  }, [action, t]);

  const submitLabel = useMemo(() => {
    if (!action) return "";
    if (action.kind === "CONFIRM") return t("confirmLabel");
    if (action.kind === "REJECT") return t("rejectLabel");
    return t("blockRoomShort");
  }, [action, t]);

  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{t("moderationQueue")}</h1>
            <p className="text-[13px] mt-1" style={{ color: "var(--eco-text-tertiary)" }}>
              {t("itemsPendingReview", { count: activeQueue.length })}
            </p>
          </div>
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

        {loading && items.length === 0 ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl"
                style={{ background: "var(--eco-surface-raised)", border: "1px solid var(--eco-border)", minHeight: 80 }}
              />
            ))}
          </div>
        ) : activeQueue.length === 0 && !error ? (
          <Card className="text-center py-12">
            <CheckCircle2 size={28} className="mx-auto mb-3" style={{ color: "var(--eco-positive)" }} />
            <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>{t("queueClear")}</div>
            <div className="text-[13px] mt-1" style={{ color: "var(--eco-text-tertiary)" }}>
              {t("noItemsPendingModeration")}
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-12 gap-3 px-5 py-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              <div className="col-span-1">ID</div>
              <div className="col-span-3">{t("colEntity")}</div>
              <div className="col-span-2">{t("reasonCode")}</div>
              <div className="col-span-1">{t("colScore")}</div>
              <div className="col-span-2">{t("assignedTo")}</div>
              <div className="col-span-1">{t("colSubmitted")}</div>
              <div className="col-span-2">{t("colActions")}</div>
            </div>

            {activeQueue.map((item) => {
              const score = riskNumeric(item.riskScore);
              const isMine = item.assignedAdminId != null && user?.id != null && item.assignedAdminId === user.id;
              const canBlock = item.roomId != null;
              return (
                <Card key={item.id} className="flex flex-col gap-3">
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-1 text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>
                      MQ-{item.id}
                    </div>
                    <div className="col-span-3">
                      <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>
                        {t(entityLabelKey(item.entityType))} #{item.entityId}
                      </div>
                      <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
                        {item.roomId ? `R-${item.roomId}` : ""}
                        {item.roomMemberId ? ` · M-${item.roomMemberId}` : ""}
                      </div>
                    </div>
                    <div className="col-span-2">
                      {item.reasonCode ? <Badge variant="warning">{item.reasonCode}</Badge> : <span style={{ color: "var(--eco-text-tertiary)" }}>—</span>}
                    </div>
                    <div className="col-span-1">
                      <span className="text-[14px]" style={{ color: riskColor(score) }}>
                        {score ?? "—"}
                      </span>
                    </div>
                    <div className="col-span-2 text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
                      {item.assignedAdminId
                        ? isMine
                          ? t("meLabel")
                          : `#${item.assignedAdminId}`
                        : t("unassigned")}
                    </div>
                    <div className="col-span-1 text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                    <div className="col-span-2 flex gap-1.5 flex-wrap">
                      {!isMine && (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={busyAssignId === item.id}
                          onClick={() => void handleAssign(item)}
                          title={t("assignToMe")}
                        >
                          <UserPlus size={12} />
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openAction("CONFIRM", item)}
                        title={t("confirmLabel")}
                      >
                        <CheckCircle2 size={12} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openAction("REJECT", item)}
                        title={t("rejectLabel")}
                      >
                        <XCircle size={12} />
                      </Button>
                      {canBlock && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openAction("BLOCK", item)}
                          title={t("blockRoomShort")}
                        >
                          <ShieldX size={12} />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
                    <Shield size={11} />
                    {t("colStatus")}: {item.status}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <ConfirmActionModal
          open={!!action}
          onClose={closeAction}
          title={actionTitle}
          description={actionDescription}
          subjectLabel={
            action ? (
              <>
                <div style={{ color: "var(--eco-text-tertiary)" }}>{t("colEntity")}</div>
                <div style={{ color: "var(--eco-text)" }}>
                  {t(entityLabelKey(action.item.entityType))} #{action.item.entityId}
                  {action.item.roomId ? ` · R-${action.item.roomId}` : ""}
                </div>
              </>
            ) : null
          }
          destructive={action?.kind !== "CONFIRM"}
          submitLabel={submitLabel}
          submitting={submitting}
          errorMessage={actionError}
          onConfirm={submitAction}
        />
      </div>
    </AdminLayout>
  );
}
