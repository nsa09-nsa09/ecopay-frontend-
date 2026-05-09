import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Badge, Modal, EmptyState, Skeleton } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { Shield, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { adminModerationApi } from "../../../lib/api/admin";
import type { ModerationQueueItemDto } from "../../../lib/api/types";

type Action = "APPROVE" | "REJECT";

const TYPE_LABEL: Record<ModerationQueueItemDto["type"], string> = {
  ROOM: "Room verification",
  USER: "User verification",
  REVIEW: "Review moderation",
};

export function AdminModerationPage() {
  const qc = useQueryClient();
  const [actionModal, setActionModal] = useState<{ item: ModerationQueueItemDto; action: Action } | null>(null);
  const [comment, setComment] = useState("");

  const queueQ = useQuery({
    queryKey: ["admin", "moderation", "queue"],
    queryFn: adminModerationApi.queue,
  });

  const decideMutation = useMutation({
    mutationFn: ({ item, action }: { item: ModerationQueueItemDto; action: Action }) => {
      const body = { decision: action, comment: comment.trim() };
      return action === "APPROVE"
        ? adminModerationApi.confirm(item.id, body)
        : adminModerationApi.reject(item.id, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "moderation", "queue"] });
      setActionModal(null);
      setComment("");
    },
  });

  const queue = queueQ.data ?? [];

  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>Moderation Queue</h1>
            <p className="text-[13px] mt-1" style={{ color: "var(--eco-text-tertiary)" }}>
              {queueQ.isLoading ? "Loading…" : `${queue.length} items pending review`}
            </p>
          </div>
        </div>

        {queueQ.isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton height={20} />
                <div className="mt-2"><Skeleton width="60%" height={14} /></div>
              </Card>
            ))}
          </div>
        ) : queueQ.isError ? (
          <Card className="flex flex-col items-center gap-3 py-10">
            <AlertTriangle size={20} style={{ color: "var(--eco-negative)" }} />
            <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>Failed to load moderation queue</div>
            <Button variant="secondary" size="md" onClick={() => queueQ.refetch()}>Retry</Button>
          </Card>
        ) : queue.length === 0 ? (
          <Card className="text-center py-12">
            <CheckCircle2 size={28} className="mx-auto mb-3" style={{ color: "var(--eco-positive)" }} />
            <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>Queue is clear</div>
            <div className="text-[13px] mt-1" style={{ color: "var(--eco-text-tertiary)" }}>No items pending moderation.</div>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-12 gap-3 px-5 py-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              <div className="col-span-2">ID</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-3">Target</div>
              <div className="col-span-3">Reason</div>
              <div className="col-span-2">Actions</div>
            </div>

            {queue.map((item) => (
              <Card key={item.id} className="flex flex-col gap-2">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>
                    {item.id.slice(0, 10)}
                  </div>
                  <div className="col-span-2">
                    <Badge variant="info">{TYPE_LABEL[item.type]}</Badge>
                  </div>
                  <div className="col-span-3 text-[12px]" style={{ color: "var(--eco-text-secondary)", fontFamily: "monospace" }}>
                    {item.targetId.slice(0, 14)}
                  </div>
                  <div className="col-span-3 text-[13px]" style={{ color: "var(--eco-text)" }}>
                    {item.reason}
                  </div>
                  <div className="col-span-2 flex gap-1.5">
                    <Button variant="primary" size="sm" onClick={() => { setActionModal({ item, action: "APPROVE" }); setComment(""); }}>
                      <CheckCircle2 size={12} />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => { setActionModal({ item, action: "REJECT" }); setComment(""); }}>
                      <XCircle size={12} />
                    </Button>
                  </div>
                </div>
                <div className="text-[11px] px-1" style={{ color: "var(--eco-text-tertiary)" }}>
                  Reported {new Date(item.createdAt).toLocaleString()}
                </div>
              </Card>
            ))}
          </div>
        )}

        <Modal
          open={!!actionModal}
          onClose={() => { setActionModal(null); setComment(""); }}
          title={actionModal ? `${actionModal.action} — ${actionModal.item.id.slice(0, 10)}` : ""}
        >
          {actionModal && (
            <div className="flex flex-col gap-4">
              <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                {actionModal.action === "APPROVE"
                  ? "Confirm this item passes moderation review."
                  : "Reject this item. The owner/member will be notified."}
              </div>
              <div className="p-3 rounded-lg text-[12px]" style={{ background: "var(--eco-surface)" }}>
                <div style={{ color: "var(--eco-text-tertiary)" }}>Type</div>
                <div style={{ color: "var(--eco-text)" }}>{TYPE_LABEL[actionModal.item.type]}</div>
                <div className="mt-2" style={{ color: "var(--eco-text-tertiary)" }}>Target</div>
                <div style={{ color: "var(--eco-text)", fontFamily: "monospace" }}>{actionModal.item.targetId}</div>
                <div className="mt-2" style={{ color: "var(--eco-text-tertiary)" }}>Reason</div>
                <div style={{ color: "var(--eco-text)" }}>{actionModal.item.reason}</div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px]" style={{ color: "var(--eco-text)" }}>
                  Comment <span style={{ color: "var(--eco-negative)" }}>*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Mandatory reason for this action (logged for audit)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="px-3 py-2 rounded-lg outline-none resize-none text-[13px]"
                  style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
                />
              </div>
              <div className="text-[11px] flex items-center gap-1" style={{ color: "var(--eco-text-tertiary)" }}>
                <Shield size={11} /> This action will be recorded in admin audit logs.
              </div>
              {decideMutation.isError && (
                <div className="text-[12px]" style={{ color: "var(--eco-negative)" }}>Action failed. Try again.</div>
              )}
              <Button
                variant={actionModal.action === "REJECT" ? "destructive" : "primary"}
                loading={decideMutation.isPending}
                disabled={!comment.trim() || decideMutation.isPending}
                onClick={() => decideMutation.mutate(actionModal)}
              >
                {actionModal.action === "APPROVE" ? "Confirm" : "Reject"}
              </Button>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
