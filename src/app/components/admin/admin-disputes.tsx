import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Button, Badge, Modal, Select } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { useI18n } from "../i18n-provider";
import { useAuth } from "../auth/auth-provider";
import {
  applyOwnerViolationSanctionRequest,
  assignDisputeToMeRequest,
  decideDisputeRequest,
  getAdminDisputesRequest,
  getRefundsByDisputeRequest,
  markRefundFailRequest,
  markRefundSuccessRequest,
  type DisputeResponse,
  type RefundTransactionResponse,
} from "../../lib/api";
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserPlus,
  Scale,
  AlertTriangle,
  Banknote,
  Check,
  X,
} from "lucide-react";
import { FlashBanner, formatAdminApiError, useFlash, REASON_MIN_LENGTH } from "./admin-action-ui";

const PAGE_SIZE = 20;

const statusVar: Record<string, "warning" | "info" | "success" | "danger" | "default"> = {
  OPEN: "warning",
  UNDER_REVIEW: "info",
  RESOLVED: "success",
  REJECTED: "danger",
};

export function AdminDisputesPage() {
  const { t, language } = useI18n();
  const { authorizedRequest, user } = useAuth();
  const tx = (ru: string, kz: string, en: string) =>
    language === "ru" ? ru : language === "kz" ? kz : en;

  const [items, setItems] = useState<DisputeResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<string>("FAVOR_MEMBER");
  const [decisionComment, setDecisionComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const { flash, show: showFlash } = useFlash();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await authorizedRequest((token) =>
        getAdminDisputesRequest(token, { page, size: PAGE_SIZE }),
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
    () => items.find((d) => d.id === selectedId) ?? null,
    [items, selectedId],
  );

  const applyUpdate = (updated: DisputeResponse) => {
    setItems((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleAssignToMe = async () => {
    if (!selected) return;
    setAssignSubmitting(true);
    setActionError(null);
    try {
      const updated = await authorizedRequest((token) => assignDisputeToMeRequest(selected.id, token));
      applyUpdate(updated);
      showFlash("success", t("actionCompletedAndLogged"));
    } catch (err) {
      setActionError(formatAdminApiError(err, t));
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleDecide = async () => {
    if (!selected || decisionComment.trim().length < REASON_MIN_LENGTH) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const updated = await authorizedRequest((token) =>
        decideDisputeRequest(selected.id, { decision: decisionType, decisionComment: decisionComment.trim() }, token),
      );
      applyUpdate(updated);
      showFlash("success", t("actionCompletedAndLogged"));
      setDecisionModalOpen(false);
      setDecisionComment("");
    } catch (err) {
      setActionError(formatAdminApiError(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  const decisionOptions = [
    { value: "FAVOR_MEMBER", label: t("decisionFavorMember") },
    { value: "FAVOR_OWNER", label: t("decisionFavorOwner") },
    { value: "REJECTED", label: t("decisionRejected") },
  ];

  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{t("disputesPageTitle")}</h1>
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
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl"
                    style={{ background: "var(--eco-surface-raised)", border: "1px solid var(--eco-border)", minHeight: 70 }}
                  />
                ))}
              </>
            )}
            {!loading && items.length === 0 && (
              <Card className="text-center text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
                {t("emptyDisputes")}
              </Card>
            )}
            {items.map((d) => {
              const active = selectedId === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className="text-left p-4 rounded-xl cursor-pointer"
                  style={{
                    background: active ? "var(--eco-brand-50)" : "var(--eco-surface-raised)",
                    border: `1px solid ${active ? "var(--eco-primary)" : "var(--eco-border)"}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>
                      D-{d.id}
                    </span>
                    <Badge variant={statusVar[d.status] ?? "default"}>{d.status}</Badge>
                  </div>
                  <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>
                    {d.roomId ? `${t("rooms")} #${d.roomId}` : "—"}
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
                    {new Date(d.createdAt).toLocaleString()}
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
                {t("selectDispute")}
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                <Card className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[18px]" style={{ color: "var(--eco-text)" }}>
                        D-{selected.id}
                        {selected.roomId ? ` · ${t("rooms")} #${selected.roomId}` : ""}
                      </div>
                      <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                        {selected.ticketId ? `${t("fromTicket", { ticket: selected.ticketId })} · ` : ""}
                        {t("createdLabel")} {new Date(selected.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant={statusVar[selected.status] ?? "default"}>{selected.status}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[13px]">
                    <div className="p-3 rounded-lg" style={{ background: "var(--eco-surface)" }}>
                      <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("claimant")}</div>
                      <div style={{ color: "var(--eco-text)" }}>#{selected.openedByUserId ?? "—"}</div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: "var(--eco-surface)" }}>
                      <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("assignToMe")}</div>
                      <div style={{ color: "var(--eco-text)" }}>
                        {selected.assignedAdminId ? `#${selected.assignedAdminId}` : "—"}
                      </div>
                    </div>
                  </div>

                  {selected.description && (
                    <div>
                      <div className="text-[12px] mb-1" style={{ color: "var(--eco-text-tertiary)" }}>{t("summaryLabel")}</div>
                      <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{selected.description}</div>
                    </div>
                  )}

                  {selected.decision && (
                    <div className="p-3 rounded-lg" style={{ background: "var(--eco-surface)" }}>
                      <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("decision")}</div>
                      <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>{selected.decision}</div>
                      {selected.decisionComment && (
                        <div className="text-[12px] mt-1" style={{ color: "var(--eco-text-secondary)" }}>{selected.decisionComment}</div>
                      )}
                    </div>
                  )}

                  {actionError && (
                    <div className="text-[13px]" role="alert" style={{ color: "var(--eco-negative)" }}>{actionError}</div>
                  )}

                  {selected.status !== "RESOLVED" && selected.status !== "REJECTED" && (
                    <div className="flex flex-wrap gap-2">
                      {(!selected.assignedAdminId || selected.assignedAdminId !== user?.id) && (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={assignSubmitting}
                          onClick={() => void handleAssignToMe()}
                        >
                          <UserPlus size={13} /> {t("assignToMe")}
                        </Button>
                      )}
                      <Button variant="primary" size="sm" onClick={() => setDecisionModalOpen(true)}>
                        <Scale size={13} /> {t("decision")}
                      </Button>
                      <OwnerViolationButton
                        dispute={selected}
                        onApplied={(updated) => { applyUpdate(updated); showFlash("success", t("actionCompletedAndLogged")); }}
                      />
                    </div>
                  )}
                </Card>

                <DisputeRefundsPanel disputeId={selected.id} />
              </div>
            )}
          </div>
        </div>

        <Modal
          open={decisionModalOpen}
          onClose={() => setDecisionModalOpen(false)}
          title={t("decision")}
        >
          <div className="flex flex-col gap-4">
            <Select
              label={t("decision")}
              options={decisionOptions}
              value={decisionType}
              onChange={(e) => setDecisionType(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px]" style={{ color: "var(--eco-text)" }}>
                {t("comment")} <span style={{ color: "var(--eco-negative)" }}>*</span>
              </label>
              <textarea
                rows={3}
                value={decisionComment}
                onChange={(e) => setDecisionComment(e.target.value)}
                placeholder={t("decisionCommentPlaceholder")}
                className="px-3 py-2 rounded-lg outline-none resize-none text-[13px]"
                style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
              />
              <span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
                {t("reasonMinLength", { n: REASON_MIN_LENGTH })}
              </span>
            </div>
            {actionError && (
              <div className="text-[13px]" role="alert" style={{ color: "var(--eco-negative)" }}>{actionError}</div>
            )}
            <div className="text-[11px] flex items-center gap-1" style={{ color: "var(--eco-text-tertiary)" }}>
              <Shield size={11} /> {t("auditLoggedShort")}
            </div>
            <Button
              variant="primary"
              disabled={decisionComment.trim().length < REASON_MIN_LENGTH}
              loading={submitting}
              onClick={() => void handleDecide()}
            >
              {t("submit")}
            </Button>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}

function OwnerViolationButton({
  dispute,
  onApplied,
}: {
  dispute: DisputeResponse;
  onApplied: (updated: DisputeResponse) => void;
}) {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();
  const tx = (ru: string, kz: string, en: string) =>
    language === "ru" ? ru : language === "kz" ? kz : en;

  const [open, setOpen] = useState(false);
  const [createRefund, setCreateRefund] = useState(true);
  const [paymentTxId, setPaymentTxId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReason(""); setError(null); setPaymentTxId(""); setRefundAmount("");
      setCreateRefund(true);
    }
  }, [open]);

  const tooShort = reason.trim().length < REASON_MIN_LENGTH;

  const submit = async () => {
    if (tooShort) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await authorizedRequest((token) =>
        applyOwnerViolationSanctionRequest(dispute.id, {
          createRefund,
          paymentTransactionId: paymentTxId.trim() ? Number(paymentTxId.trim()) : undefined,
          refundAmount: refundAmount.trim() ? Number(refundAmount.trim()) : undefined,
          reason: reason.trim(),
        }, token),
      );
      onApplied(updated);
      setOpen(false);
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <AlertTriangle size={13} /> {tx("Санкции владельцу", "Иесіне санкция", "Owner violation")}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={tx("Санкции: нарушение владельца", "Санкция: иесінің бұзушылығы", "Sanction: owner violation")}>
        <div className="flex flex-col gap-4">
          <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            {tx(
              "Зафиксировать нарушение со стороны владельца по этому спору. Опционально — инициировать возврат участнику.",
              "Осы дау бойынша иесінің бұзушылығын тіркеу. Қаласаңыз — қатысушыға қайтаруды бастау.",
              "Record an owner violation on this dispute. Optionally start a refund to the member.",
            )}
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={createRefund} onChange={(e) => setCreateRefund(e.target.checked)} />
            <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>
              {tx("Создать возврат", "Қайтаруды құру", "Create a refund")}
            </span>
          </label>

          {createRefund && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px]" style={{ color: "var(--eco-text)" }}>
                  {tx("ID транзакции (опц.)", "Транзакция ID (міндетті емес)", "Tx ID (optional)")}
                </label>
                <input
                  value={paymentTxId}
                  onChange={(e) => setPaymentTxId(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  className="px-2 py-1.5 rounded-lg outline-none text-[13px]"
                  style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px]" style={{ color: "var(--eco-text)" }}>
                  {tx("Сумма (опц.)", "Сома (міндетті емес)", "Amount (optional)")}
                </label>
                <input
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  inputMode="decimal"
                  className="px-2 py-1.5 rounded-lg outline-none text-[13px]"
                  style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px]" style={{ color: "var(--eco-text)" }}>
              {t("reason")} <span style={{ color: "var(--eco-negative)" }}>*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("mandatoryAuditLogged")}
              className="px-3 py-2 rounded-lg outline-none resize-none text-[13px]"
              style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
            />
            <span className="text-[11px]" style={{ color: tooShort ? "var(--eco-text-tertiary)" : "var(--eco-positive)" }}>
              {t("reasonMinLength", { n: REASON_MIN_LENGTH })}
            </span>
          </div>

          {error && (
            <div className="text-[13px]" role="alert" style={{ color: "var(--eco-negative)" }}>{error}</div>
          )}

          <Button variant="destructive" disabled={tooShort} loading={submitting} onClick={() => void submit()}>
            {tx("Применить санкции", "Санкцияны қолдану", "Apply sanction")}
          </Button>
        </div>
      </Modal>
    </>
  );
}

function DisputeRefundsPanel({ disputeId }: { disputeId: number }) {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();
  const tx = (ru: string, kz: string, en: string) =>
    language === "ru" ? ru : language === "kz" ? kz : en;

  const [refunds, setRefunds] = useState<RefundTransactionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await authorizedRequest((token) => getRefundsByDisputeRequest(disputeId, token));
      setRefunds(list);
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, disputeId, t]);

  useEffect(() => { void load(); }, [load]);

  const apply = (updated: RefundTransactionResponse) => {
    setRefunds((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleSuccess = async (id: number) => {
    const providerRefundId = window.prompt(tx("Provider refund ID (опц.)", "Provider refund ID (міндетті емес)", "Provider refund ID (optional)")) ?? undefined;
    setBusyId(id);
    try {
      const updated = await authorizedRequest((token) => markRefundSuccessRequest(id, { providerRefundId: providerRefundId || undefined }, token));
      apply(updated);
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setBusyId(null);
    }
  };

  const handleFail = async (id: number) => {
    const providerRefundId = window.prompt(tx("Provider refund ID (опц.)", "Provider refund ID (міндетті емес)", "Provider refund ID (optional)")) ?? undefined;
    setBusyId(id);
    try {
      const updated = await authorizedRequest((token) => markRefundFailRequest(id, { providerRefundId: providerRefundId || undefined }, token));
      apply(updated);
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-[14px] flex items-center gap-2" style={{ color: "var(--eco-text)" }}>
          <Banknote size={14} /> {tx("Возвраты по спору", "Дау бойынша қайтарулар", "Refunds for dispute")}
        </div>
        <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={12} /> {t("retry")}
        </Button>
      </div>

      {error && (
        <div className="text-[13px]" style={{ color: "var(--eco-negative)" }}>{error}</div>
      )}

      {!loading && refunds.length === 0 && !error && (
        <div className="text-[13px] text-center py-3" style={{ color: "var(--eco-text-tertiary)" }}>
          {tx("Возвратов нет.", "Қайтарулар жоқ.", "No refunds yet.")}
        </div>
      )}

      {refunds.map((r) => (
        <div key={r.id} className="p-3 rounded-lg flex flex-col gap-2" style={{ background: "var(--eco-surface)" }}>
          <div className="flex items-center justify-between">
            <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>R-{r.id}</span>
            <Badge variant={r.status === "SUCCESS" ? "success" : r.status === "FAILED" ? "danger" : "warning"}>{r.status}</Badge>
          </div>
          <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>
            {r.amount} {r.currency ?? ""}{" "}
            {r.paymentTransactionId ? <span style={{ color: "var(--eco-text-tertiary)" }}>· tx #{r.paymentTransactionId}</span> : null}
          </div>
          {r.reason && (
            <div className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>{r.reason}</div>
          )}
          {r.status === "PENDING" && (
            <div className="flex gap-2">
              <Button variant="primary" size="sm" loading={busyId === r.id} onClick={() => void handleSuccess(r.id)}>
                <Check size={13} /> {tx("Отметить успешным", "Сәтті деп белгілеу", "Mark success")}
              </Button>
              <Button variant="destructive" size="sm" loading={busyId === r.id} onClick={() => void handleFail(r.id)}>
                <X size={13} /> {tx("Отметить неудачным", "Сәтсіз деп белгілеу", "Mark failed")}
              </Button>
            </div>
          )}
        </div>
      ))}
    </Card>
  );
}
