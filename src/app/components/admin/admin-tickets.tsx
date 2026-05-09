import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Badge, Modal, EmptyState, Skeleton } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { Shield, Send, ArrowUpRight, AlertTriangle, Loader2, UserCheck } from "lucide-react";
import { staffTicketsApi } from "../../../lib/api/admin";
import type { SupportTicketResponse } from "../../../lib/api/types";

type ApiStatus = SupportTicketResponse["status"];
const STATUS_BADGE: Record<ApiStatus, "warning" | "info" | "success" | "default"> = {
  OPEN: "warning",
  PENDING: "info",
  RESOLVED: "success",
  CLOSED: "default",
};
const STATUS_LABEL: Record<ApiStatus, string> = {
  OPEN: "Open",
  PENDING: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export function AdminTicketsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"queue" | "mine">("queue");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [escalateModal, setEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");

  const queueQ = useQuery({
    queryKey: ["admin", "tickets", "queue"],
    queryFn: staffTicketsApi.queue,
  });

  const mineQ = useQuery({
    queryKey: ["admin", "tickets", "mine"],
    queryFn: staffTicketsApi.assigned,
  });

  const detailQ = useQuery({
    queryKey: ["admin", "tickets", selectedId],
    queryFn: () => staffTicketsApi.get(selectedId!),
    enabled: !!selectedId,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["admin", "tickets"] });
  };

  const assignMutation = useMutation({
    mutationFn: () => staffTicketsApi.assignToMe(selectedId!),
    onSuccess: () => {
      invalidateAll();
      setTab("mine");
    },
  });

  const replyMutation = useMutation({
    mutationFn: () => staffTicketsApi.reply(selectedId!, { body: reply.trim() }),
    onSuccess: () => {
      setReply("");
      invalidateAll();
    },
  });

  const escalateMutation = useMutation({
    mutationFn: () => staffTicketsApi.escalate(selectedId!),
    onSuccess: () => {
      setEscalateModal(false);
      setEscalateReason("");
      invalidateAll();
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: ApiStatus) =>
      staffTicketsApi.setStatus(selectedId!, { status }),
    onSuccess: () => invalidateAll(),
  });

  const list = tab === "queue" ? queueQ.data ?? [] : mineQ.data ?? [];
  const isLoading = tab === "queue" ? queueQ.isLoading : mineQ.isLoading;
  const isError = tab === "queue" ? queueQ.isError : mineQ.isError;
  const refetch = tab === "queue" ? queueQ.refetch : mineQ.refetch;

  const selected = detailQ.data;

  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <h1 className="text-[24px] mb-2" style={{ color: "var(--eco-text)" }}>Tickets (Support View)</h1>

        <div className="flex gap-0 border-b mb-6" style={{ borderColor: "var(--eco-border)" }}>
          {(["queue", "mine"] as const).map((t) => (
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
              {t === "queue" ? "Queue" : "Assigned to me"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-2">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <Card key={i}>
                  <Skeleton width="40%" height={12} />
                  <div className="mt-2"><Skeleton height={14} /></div>
                  <div className="mt-1"><Skeleton width="60%" height={12} /></div>
                </Card>
              ))
            ) : isError ? (
              <Card className="flex flex-col items-center gap-3 py-8">
                <AlertTriangle size={20} style={{ color: "var(--eco-negative)" }} />
                <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>Failed to load tickets</div>
                <Button variant="secondary" size="sm" onClick={() => refetch()}>Retry</Button>
              </Card>
            ) : list.length === 0 ? (
              <EmptyState
                title={tab === "queue" ? "Queue is empty" : "No assignments"}
                description={tab === "queue" ? "There are no tickets waiting." : "Nothing assigned to you yet."}
              />
            ) : (
              list.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className="text-left p-4 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: selectedId === t.id ? "var(--eco-brand-50)" : "var(--eco-surface-raised)",
                    border: `1px solid ${selectedId === t.id ? "var(--eco-primary)" : "var(--eco-border)"}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>
                      {t.id.slice(0, 8)}
                    </span>
                    <Badge variant={STATUS_BADGE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                  </div>
                  <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>{t.subject}</div>
                  <div className="text-[11px] mt-1" style={{ color: "var(--eco-text-tertiary)" }}>
                    {t.priority ? `${t.priority} · ` : ""}{new Date(t.updatedAt || t.createdAt).toLocaleString()}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="lg:col-span-2">
            {!selectedId ? (
              <Card className="flex items-center justify-center py-16 text-[14px]" style={{ color: "var(--eco-text-tertiary)" }}>
                Select a ticket
              </Card>
            ) : detailQ.isLoading ? (
              <Card className="flex flex-col gap-3">
                <Skeleton width="50%" height={20} />
                <Skeleton width={120} height={20} rounded={4} />
                <Skeleton height={48} rounded={12} />
                <Skeleton height={48} rounded={12} />
              </Card>
            ) : detailQ.isError || !selected ? (
              <Card className="flex flex-col items-center gap-3 py-12">
                <AlertTriangle size={20} style={{ color: "var(--eco-negative)" }} />
                <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>Failed to load ticket</div>
                <Button variant="secondary" size="sm" onClick={() => detailQ.refetch()}>Retry</Button>
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                <Card className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[16px]" style={{ color: "var(--eco-text)" }}>{selected.subject}</div>
                      <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                        {selected.id.slice(0, 8)} · {selected.priority || "NORMAL"} · Created {new Date(selected.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant={STATUS_BADGE[selected.status]}>{STATUS_LABEL[selected.status]}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={assignMutation.isPending}
                      onClick={() => assignMutation.mutate()}
                    >
                      <UserCheck size={13} /> Assign to me
                    </Button>

                    {selected.status !== "RESOLVED" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={statusMutation.isPending}
                        onClick={() => statusMutation.mutate("RESOLVED")}
                      >
                        Mark Resolved
                      </Button>
                    )}

                    {selected.status !== "CLOSED" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => statusMutation.mutate("CLOSED")}
                      >
                        Close
                      </Button>
                    )}

                    {selected.status !== "CLOSED" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setEscalateModal(true)}
                      >
                        <ArrowUpRight size={13} /> Escalate to Dispute
                      </Button>
                    )}
                  </div>
                </Card>

                <Card className="flex flex-col">
                  <div className="flex flex-col gap-4 mb-4" style={{ maxHeight: 400, overflowY: "auto" }}>
                    {(selected.messages ?? []).length === 0 ? (
                      <div className="text-center py-8 text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
                        No messages yet.
                      </div>
                    ) : (
                      (selected.messages ?? []).map((m) => {
                        const fromSupport = !!m.authorName?.toLowerCase().includes("support") || !!m.authorName?.toLowerCase().includes("admin");
                        return (
                          <div key={m.id} className={`flex flex-col gap-1 ${fromSupport ? "items-start" : "items-end"}`}>
                            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
                              {fromSupport ? (
                                <>
                                  <Shield size={10} style={{ color: "var(--eco-primary)" }} />
                                  <span style={{ color: "var(--eco-primary)" }}>{m.authorName || "Support"}</span>
                                </>
                              ) : (
                                <span>{m.authorName || "User"}</span>
                              )}
                              · {new Date(m.createdAt).toLocaleString()}
                            </div>
                            <div className="max-w-sm px-3.5 py-2.5 rounded-xl text-[13px] whitespace-pre-wrap" style={{
                              background: fromSupport ? "var(--eco-brand-50)" : "var(--eco-surface)",
                              color: "var(--eco-text)",
                              borderBottomLeftRadius: fromSupport ? 4 : undefined,
                              borderBottomRightRadius: !fromSupport ? 4 : undefined,
                            }}>
                              {m.body}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {selected.status !== "CLOSED" && (
                    <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: "var(--eco-border)" }}>
                      <input
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && reply.trim()) replyMutation.mutate();
                        }}
                        placeholder="Reply as Support..."
                        disabled={replyMutation.isPending}
                        className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
                        style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
                      />
                      <button
                        className="p-2 rounded-lg cursor-pointer disabled:opacity-50"
                        style={{ background: "var(--eco-primary)", border: "none" }}
                        onClick={() => reply.trim() && replyMutation.mutate()}
                        disabled={!reply.trim() || replyMutation.isPending}
                      >
                        {replyMutation.isPending ? (
                          <Loader2 size={14} className="animate-spin" style={{ color: "var(--eco-text-on-primary)" }} />
                        ) : (
                          <Send size={14} style={{ color: "var(--eco-text-on-primary)" }} />
                        )}
                      </button>
                    </div>
                  )}

                  {(replyMutation.isError || statusMutation.isError || assignMutation.isError) && (
                    <div className="text-[12px] mt-2" style={{ color: "var(--eco-negative)" }}>
                      Action failed. Please try again.
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>

        <Modal
          open={escalateModal}
          onClose={() => { setEscalateModal(false); setEscalateReason(""); }}
          title="Escalate to Dispute"
        >
          <div className="flex flex-col gap-4">
            <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
              This will create a dispute and notify the user and admin team.
            </div>
            <textarea
              rows={3}
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              placeholder="Escalation reason (audit logged)..."
              className="px-3 py-2 rounded-lg outline-none resize-none text-[13px]"
              style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
            />
            <div className="text-[11px] flex items-center gap-1" style={{ color: "var(--eco-text-tertiary)" }}>
              <Shield size={11} /> Audit logged.
            </div>
            {escalateMutation.isError && (
              <div className="text-[12px]" style={{ color: "var(--eco-negative)" }}>Failed to escalate.</div>
            )}
            <Button
              variant="destructive"
              loading={escalateMutation.isPending}
              disabled={!escalateReason.trim() || escalateMutation.isPending}
              onClick={() => escalateMutation.mutate()}
            >
              Escalate
            </Button>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
