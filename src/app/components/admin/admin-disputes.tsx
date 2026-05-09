import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Badge, Modal, EmptyState, Skeleton } from "../ds-primitives";
import { GapBanner } from "../../../lib/ui/GapBanner";
import { AdminLayout } from "./admin-layout";
import { Scale, Shield, CheckCircle2, XCircle, Undo2, AlertTriangle } from "lucide-react";
import {
  adminDisputesApi,
  adminRefundsApi,
} from "../../../lib/api/admin";
import type {
  DisputeResponse,
  DisputeStatus,
  RefundTransactionResponse,
} from "../../../lib/api/types";

const disputeStatusVariant: Record<DisputeStatus, "warning" | "info" | "success" | "danger" | "default"> = {
  OPEN: "warning",
  UNDER_REVIEW: "info",
  RESOLVED_OWNER: "success",
  RESOLVED_MEMBER: "success",
  REJECTED: "danger",
};

const refundStatusVariant: Record<RefundTransactionResponse["status"], "warning" | "info" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "info",
  REJECTED: "danger",
  PROCESSED: "success",
};

export function AdminDisputesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"disputes" | "refunds">("disputes");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decisionModal, setDecisionModal] = useState(false);
  const [decision, setDecision] = useState("");
  const [decisionType, setDecisionType] = useState<"RESOLVE_MEMBER" | "RESOLVE_OWNER" | "REJECT" | "">("");

  const disputesQ = useQuery({
    queryKey: ["admin", "disputes"],
    queryFn: adminDisputesApi.list,
  });

  const detailQ = useQuery({
    queryKey: ["admin", "disputes", selectedId],
    queryFn: () => adminDisputesApi.get(selectedId!),
    enabled: !!selectedId,
  });

  const refundsQ = useQuery({
    queryKey: ["admin", "refunds", "byDispute", selectedId],
    queryFn: () => adminRefundsApi.byDispute(selectedId!),
    enabled: !!selectedId && tab === "refunds",
  });

  const decideMutation = useMutation({
    mutationFn: () =>
      adminDisputesApi.decide(selectedId!, {
        decision: decisionType as "RESOLVE_OWNER" | "RESOLVE_MEMBER" | "REJECT",
        comment: decision.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "disputes"] });
      qc.invalidateQueries({ queryKey: ["admin", "disputes", selectedId] });
      setDecisionModal(false);
      setDecision("");
      setDecisionType("");
    },
  });

  const refundMarkSuccess = useMutation({
    mutationFn: (refundId: string) =>
      adminRefundsApi.markSuccess(refundId, { status: "PROCESSED" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "refunds"] }),
  });

  const refundMarkFail = useMutation({
    mutationFn: (refundId: string) => adminRefundsApi.markFail(refundId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "refunds"] }),
  });

  const disputes = disputesQ.data ?? [];
  const selected = detailQ.data;
  const refunds = refundsQ.data ?? [];

  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <h1 className="text-[24px] mb-6" style={{ color: "var(--eco-text)" }}>Disputes & Refunds</h1>

        <div className="flex gap-0 border-b mb-6" style={{ borderColor: "var(--eco-border)" }}>
          {(["disputes", "refunds"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2.5 text-[14px] cursor-pointer"
              style={{
                color: tab === t ? "var(--eco-primary)" : "var(--eco-text-secondary)",
                borderBottom: tab === t ? "2px solid var(--eco-primary)" : "2px solid transparent",
                marginBottom: -1,
                background: "transparent",
                border: "none",
                borderBottomStyle: "solid",
                borderBottomWidth: 2,
                borderBottomColor: tab === t ? "var(--eco-primary)" : "transparent",
              }}
            >
              {t === "disputes" ? "Disputes" : "Refunds"}
              {t === "disputes" && (
                <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--eco-danger-100)", color: "var(--eco-danger-500)" }}>
                  {disputes.filter((d) => d.status === "OPEN" || d.status === "UNDER_REVIEW").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "disputes" && (
          <DisputesTab
            disputes={disputes}
            isLoading={disputesQ.isLoading}
            isError={disputesQ.isError}
            refetch={disputesQ.refetch}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            selected={selected}
            detailLoading={detailQ.isLoading}
            onOpenDecide={(type) => {
              setDecisionType(type);
              setDecisionModal(true);
            }}
          />
        )}

        {tab === "refunds" && (
          <RefundsTab
            disputes={disputes}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            refunds={refunds}
            isLoading={refundsQ.isLoading}
            isFetching={refundsQ.isFetching}
            onProcess={(id) => refundMarkSuccess.mutate(id)}
            onFail={(id) => refundMarkFail.mutate(id)}
            processing={refundMarkSuccess.isPending || refundMarkFail.isPending}
          />
        )}

        <Modal
          open={decisionModal}
          onClose={() => { setDecisionModal(false); setDecision(""); setDecisionType(""); }}
          title="Issue Decision"
        >
          <div className="flex flex-col gap-4">
            <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
              {decisionType === "RESOLVE_MEMBER" && "Ruling in favor of the member. A refund may be initiated."}
              {decisionType === "RESOLVE_OWNER" && "Ruling in favor of the room owner. No refund will be issued."}
              {decisionType === "REJECT" && "Reject this dispute. No further action will be taken."}
            </div>
            <textarea
              rows={3}
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              placeholder="Decision rationale (mandatory, audit logged)..."
              className="px-3 py-2 rounded-lg outline-none resize-none text-[13px]"
              style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
            />
            <div className="text-[11px] flex items-center gap-1" style={{ color: "var(--eco-text-tertiary)" }}>
              <Shield size={11} /> Decision permanently recorded.
            </div>
            {decideMutation.isError && (
              <div className="text-[12px]" style={{ color: "var(--eco-negative)" }}>Failed to record decision.</div>
            )}
            <Button
              variant={decisionType === "RESOLVE_MEMBER" ? "primary" : "secondary"}
              loading={decideMutation.isPending}
              disabled={!decision.trim() || decideMutation.isPending}
              onClick={() => decideMutation.mutate()}
            >
              Confirm Decision
            </Button>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}

function DisputesTab({
  disputes,
  isLoading,
  isError,
  refetch,
  selectedId,
  setSelectedId,
  selected,
  detailLoading,
  onOpenDecide,
}: {
  disputes: DisputeResponse[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  selected: DisputeResponse | undefined;
  detailLoading: boolean;
  onOpenDecide: (type: "RESOLVE_MEMBER" | "RESOLVE_OWNER" | "REJECT") => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 flex flex-col gap-2">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton width="40%" height={12} />
              <div className="mt-2"><Skeleton width="80%" height={14} /></div>
            </Card>
          ))
        ) : isError ? (
          <Card className="flex flex-col items-center gap-3 py-8">
            <AlertTriangle size={20} style={{ color: "var(--eco-negative)" }} />
            <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>Failed to load disputes</div>
            <Button variant="secondary" size="sm" onClick={refetch}>Retry</Button>
          </Card>
        ) : disputes.length === 0 ? (
          <EmptyState title="No disputes" description="The disputes queue is empty." />
        ) : (
          disputes.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              className="text-left p-4 rounded-xl cursor-pointer"
              style={{
                background: selectedId === d.id ? "var(--eco-brand-50)" : "var(--eco-surface-raised)",
                border: `1px solid ${selectedId === d.id ? "var(--eco-primary)" : "var(--eco-border)"}`,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>
                  {d.id.slice(0, 10)}
                </span>
                <Badge variant={disputeStatusVariant[d.status]}>{d.status.replace("_", " ")}</Badge>
              </div>
              <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>Room {d.roomId.slice(0, 8)}</div>
              <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
                Opened {new Date(d.createdAt).toLocaleDateString()}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="lg:col-span-2">
        {!selectedId ? (
          <Card className="flex items-center justify-center py-16 text-[14px]" style={{ color: "var(--eco-text-tertiary)" }}>
            <Scale size={20} style={{ color: "var(--eco-text-tertiary)" }} /> &nbsp; Select a dispute
          </Card>
        ) : detailLoading ? (
          <Card>
            <Skeleton height={20} />
            <div className="mt-2"><Skeleton width="60%" height={14} /></div>
            <div className="mt-3"><Skeleton height={14} /></div>
            <div className="mt-1"><Skeleton width="80%" height={14} /></div>
          </Card>
        ) : !selected ? (
          <Card className="flex flex-col items-center gap-3 py-12">
            <AlertTriangle size={20} style={{ color: "var(--eco-negative)" }} />
            <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>Failed to load dispute</div>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            <Card className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[18px]" style={{ color: "var(--eco-text)" }}>
                    {selected.id.slice(0, 10)} — Room {selected.roomId.slice(0, 8)}
                  </div>
                  <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                    Opened by {selected.openedById.slice(0, 8)} · {new Date(selected.createdAt).toLocaleString()}
                  </div>
                </div>
                <Badge variant={disputeStatusVariant[selected.status]}>{selected.status.replace("_", " ")}</Badge>
              </div>

              <div>
                <div className="text-[12px] mb-1" style={{ color: "var(--eco-text-tertiary)" }}>Reason</div>
                <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{selected.reason}</div>
              </div>
            </Card>

            {selected.status !== "RESOLVED_OWNER" && selected.status !== "RESOLVED_MEMBER" && selected.status !== "REJECTED" && (
              <Card className="flex flex-col gap-3">
                <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>Decision Panel</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" size="sm" onClick={() => onOpenDecide("RESOLVE_MEMBER")}>
                    <CheckCircle2 size={13} /> Favor Member
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => onOpenDecide("RESOLVE_OWNER")}>
                    <CheckCircle2 size={13} /> Favor Owner
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onOpenDecide("REJECT")}>
                    <XCircle size={13} /> Reject Dispute
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RefundsTab({
  disputes,
  selectedId,
  setSelectedId,
  refunds,
  isLoading,
  isFetching,
  onProcess,
  onFail,
  processing,
}: {
  disputes: DisputeResponse[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  refunds: RefundTransactionResponse[];
  isLoading: boolean;
  isFetching: boolean;
  onProcess: (id: string) => void;
  onFail: (id: string) => void;
  processing: boolean;
}) {
  return (
    <>
      <GapBanner label="A platform-wide refund list endpoint (GET /admin/refunds) is not implemented yet — only per-dispute refunds can be displayed." />

      <div className="flex flex-col gap-4 mb-6">
        <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
          Select a dispute to view its refunds:
        </div>
        <div className="flex flex-wrap gap-2">
          {disputes.length === 0 ? (
            <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>No disputes available.</span>
          ) : (
            disputes.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className="px-3 py-1.5 rounded-lg text-[12px] cursor-pointer"
                style={{
                  background: selectedId === d.id ? "var(--eco-brand-50)" : "var(--eco-surface)",
                  border: `1px solid ${selectedId === d.id ? "var(--eco-primary)" : "var(--eco-border)"}`,
                  color: "var(--eco-text)",
                  fontFamily: "monospace",
                }}
              >
                {d.id.slice(0, 10)}
              </button>
            ))
          )}
        </div>
      </div>

      {!selectedId ? (
        <EmptyState
          title="Select a dispute"
          description="Refunds are listed per-dispute. Pick a dispute above to view related refunds."
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <Card key={i}>
              <Skeleton height={16} />
            </Card>
          ))}
        </div>
      ) : refunds.length === 0 ? (
        <EmptyState title="No refunds" description="No refunds are linked to this dispute." />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-12 gap-3 px-5 py-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
            <div className="col-span-3">ID</div>
            <div className="col-span-3">Payment</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Actions</div>
          </div>
          {refunds.map((r) => (
            <Card key={r.id}>
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-3 text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>
                  {r.id.slice(0, 12)}
                </div>
                <div className="col-span-3 text-[12px]" style={{ color: "var(--eco-text-secondary)", fontFamily: "monospace" }}>
                  {r.paymentId.slice(0, 12)}
                </div>
                <div className="col-span-2 text-[14px]" style={{ color: "var(--eco-primary)" }}>
                  ₸{r.amount.toLocaleString()}
                </div>
                <div className="col-span-2">
                  <Badge variant={refundStatusVariant[r.status]}>{r.status}</Badge>
                </div>
                <div className="col-span-2 flex gap-1.5">
                  {(r.status === "PENDING" || r.status === "APPROVED") && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        loading={processing}
                        disabled={processing}
                        onClick={() => onProcess(r.id)}
                      >
                        <Undo2 size={12} /> Mark sent
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={processing}
                        onClick={() => onFail(r.id)}
                      >
                        Fail
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isFetching && (
        <div className="text-[12px] mt-3" style={{ color: "var(--eco-text-tertiary)" }}>Refreshing…</div>
      )}

      <div className="flex items-start gap-2 p-4 rounded-lg mt-4" style={{ background: "var(--eco-surface)" }}>
        <Shield size={14} className="mt-0.5 shrink-0" style={{ color: "var(--eco-text-tertiary)" }} />
        <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
          <strong>Idempotency:</strong> Each refund is tied to a unique payment ID. Marking a refund as sent or failed is audit-logged and cannot be reversed.
        </div>
      </div>
    </>
  );
}
