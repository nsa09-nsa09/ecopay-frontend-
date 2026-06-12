import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Button, Badge, Input, Modal, Select } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { useI18n, type Language } from "../i18n-provider";
import { useAuth } from "../auth/auth-provider";
import {
  banUserRequest,
  createAdminUserRequest,
  getAdminUserRequest,
  getAdminUsersRequest,
  unbanUserRequest,
  updateAdminUserOwnerVerifiedRequest,
  updateAdminUserRoleRequest,
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
  UserPlus,
  Repeat2,
  BadgeCheck,
  RotateCcw,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { ConfirmActionModal, FlashBanner, formatAdminApiError, useFlash } from "./admin-action-ui";

const PAGE_SIZE = 20;

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === "ru" ? ru : l === "kz" ? kz : en;

type AdminRole = "USER" | "SUPPORT" | "ADMIN";
const ROLE_OPTIONS: AdminRole[] = ["USER", "SUPPORT", "ADMIN"];

function roleBadgeVariant(role: string | null | undefined): "default" | "info" | "warning" | "danger" {
  if (role === "ADMIN") return "danger";
  if (role === "SUPPORT") return "warning";
  if (role === "USER") return "info";
  return "default";
}

function generatePassword(length = 14): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[arr[i] % alphabet.length];
  return out;
}

export function AdminUsersPage() {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();

  const [items, setItems] = useState<AdminUserDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminUserDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [banModal, setBanModal] = useState<{ user: AdminUserDto; action: "BAN" | "UNBAN" } | null>(null);
  const [banSubmitting, setBanSubmitting] = useState(false);
  const [banError, setBanError] = useState<string | null>(null);

  const [roleModal, setRoleModal] = useState<{ user: AdminUserDto } | null>(null);
  const [newRole, setNewRole] = useState<AdminRole>("USER");
  const [roleReason, setRoleReason] = useState("");
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const [verifyModal, setVerifyModal] = useState<{ user: AdminUserDto; next: boolean } | null>(null);
  const [verifyReason, setVerifyReason] = useState("");
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);

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

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  // Load full detail whenever the selection changes — the list-level DTO already
  // contains everything for this endpoint, but the dedicated GET reflects the
  // freshest fields (e.g. ownerVerified) after admin actions.
  useEffect(() => {
    if (selectedId == null) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    authorizedRequest((token) => getAdminUserRequest(selectedId, token))
      .then((data) => { if (!cancelled) setDetail(data); })
      .catch(() => { if (!cancelled) setDetail(items.find((u) => u.id === selectedId) ?? null); })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId, authorizedRequest, items]);

  const listSelected = useMemo(
    () => items.find((u) => u.id === selectedId) ?? null,
    [items, selectedId],
  );
  const selected = detail ?? listSelected;

  const isBanned = (u: AdminUserDto) => u.status === "BANNED";

  const replaceUser = (updated: AdminUserDto) => {
    setItems((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    if (selectedId === updated.id) setDetail(updated);
  };

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
      replaceUser(updated);
      showFlash("success", t("actionCompletedAndLogged"));
      closeBanModal();
    } catch (err) {
      setBanError(formatAdminApiError(err, t));
    } finally {
      setBanSubmitting(false);
    }
  };

  const openRoleModal = (user: AdminUserDto) => {
    setRoleModal({ user });
    setNewRole((user.role as AdminRole) ?? "USER");
    setRoleReason("");
    setRoleError(null);
  };

  const submitRoleChange = async () => {
    if (!roleModal) return;
    if (roleReason.trim().length < 10) {
      setRoleError(t("reasonMinLength", { n: 10 }));
      return;
    }
    setRoleSubmitting(true);
    setRoleError(null);
    try {
      const updated = await authorizedRequest((token) =>
        updateAdminUserRoleRequest(roleModal.user.id, { role: newRole, reason: roleReason.trim() }, token),
      );
      replaceUser(updated);
      showFlash("success", t("actionCompletedAndLogged"));
      setRoleModal(null);
    } catch (err) {
      setRoleError(formatAdminApiError(err, t));
    } finally {
      setRoleSubmitting(false);
    }
  };

  const openVerifyModal = (user: AdminUserDto, next: boolean) => {
    setVerifyModal({ user, next });
    setVerifyReason("");
    setVerifyError(null);
  };

  const submitVerifyChange = async () => {
    if (!verifyModal) return;
    setVerifySubmitting(true);
    setVerifyError(null);
    try {
      const updated = await authorizedRequest((token) =>
        updateAdminUserOwnerVerifiedRequest(
          verifyModal.user.id,
          { verified: verifyModal.next, reason: verifyReason.trim() || undefined },
          token,
        ),
      );
      replaceUser(updated);
      showFlash("success", t("actionCompletedAndLogged"));
      setVerifyModal(null);
    } catch (err) {
      setVerifyError(formatAdminApiError(err, t));
    } finally {
      setVerifySubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{t("users")}</h1>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              <UserPlus size={13} /> {tx(language, "Добавить пользователя", "Пайдаланушы қосу", "Add user")}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw size={13} /> {t("retry")}
            </Button>
          </div>
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
                    <div className="flex items-center gap-1.5">
                      {u.role && <Badge variant={roleBadgeVariant(u.role)}>{u.role}</Badge>}
                      {banned && <Badge variant="danger">{t("bannedBadge")}</Badge>}
                    </div>
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
                        <div className="text-[18px] flex items-center gap-2" style={{ color: "var(--eco-text)" }}>
                          {selected.displayName}
                          {detailLoading && <Loader2 size={12} className="animate-spin" style={{ color: "var(--eco-text-tertiary)" }} />}
                        </div>
                        <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                          U-{selected.id} · {selected.emailMasked ?? selected.email}
                          {selected.createdAt ? ` · ${t("sinceLabel")} ${new Date(selected.createdAt).toLocaleDateString()}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isBanned(selected) && <Badge variant="danger">{t("bannedBadge")}</Badge>}
                      {selected.role && <Badge variant={roleBadgeVariant(selected.role)}>{selected.role}</Badge>}
                      {selected.ownerVerified && (
                        <Badge variant="success">
                          <BadgeCheck size={11} /> {tx(language, "Владелец", "Иесі", "Owner")}
                        </Badge>
                      )}
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

                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openRoleModal(selected)}>
                      <Repeat2 size={13} /> {tx(language, "Изменить роль", "Рөлді өзгерту", "Change role")}
                    </Button>
                    <Button
                      variant={selected.ownerVerified ? "ghost" : "secondary"}
                      size="sm"
                      onClick={() => openVerifyModal(selected, !selected.ownerVerified)}
                    >
                      {selected.ownerVerified
                        ? <><RotateCcw size={13} /> {tx(language, "Снять метку владельца", "Иесі белгісін алу", "Revoke owner mark")}</>
                        : <><BadgeCheck size={13} /> {tx(language, "Отметить как владельца", "Иесі деп белгілеу", "Mark as owner")}</>}
                    </Button>
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

        <RoleChangeModal
          open={!!roleModal}
          user={roleModal?.user ?? null}
          role={newRole}
          reason={roleReason}
          submitting={roleSubmitting}
          error={roleError}
          onRoleChange={setNewRole}
          onReasonChange={setRoleReason}
          onSubmit={submitRoleChange}
          onClose={() => setRoleModal(null)}
        />

        <OwnerVerifyModal
          open={!!verifyModal}
          user={verifyModal?.user ?? null}
          next={verifyModal?.next ?? false}
          reason={verifyReason}
          submitting={verifySubmitting}
          error={verifyError}
          onReasonChange={setVerifyReason}
          onSubmit={submitVerifyChange}
          onClose={() => setVerifyModal(null)}
        />

        <CreateUserModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={(u) => {
            setItems((prev) => [u, ...prev]);
            setSelectedId(u.id);
            showFlash("success", t("actionCompletedAndLogged"));
            setCreateOpen(false);
          }}
        />
      </div>
    </AdminLayout>
  );
}

function RoleChangeModal({
  open, user, role, reason, submitting, error,
  onRoleChange, onReasonChange, onSubmit, onClose,
}: {
  open: boolean;
  user: AdminUserDto | null;
  role: AdminRole;
  reason: string;
  submitting: boolean;
  error: string | null;
  onRoleChange: (r: AdminRole) => void;
  onReasonChange: (s: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const { language, t } = useI18n();
  const tooShort = reason.trim().length < 10;
  return (
    <Modal open={open} onClose={onClose} title={tx(language, "Изменить роль", "Рөлді өзгерту", "Change role")}>
      <div className="flex flex-col gap-4">
        {user && (
          <div className="p-3 rounded-lg text-[12px]" style={{ background: "var(--eco-surface)", color: "var(--eco-text)" }}>
            U-{user.id} — {user.displayName}{" "}
            <span style={{ color: "var(--eco-text-tertiary)" }}>
              · {tx(language, "сейчас", "қазір", "currently")}: {user.role ?? "—"}
            </span>
          </div>
        )}
        <Select
          label={tx(language, "Новая роль", "Жаңа рөл", "New role")}
          value={role}
          onChange={(e) => onRoleChange(e.target.value as AdminRole)}
          options={ROLE_OPTIONS.map((r) => ({ value: r, label: r }))}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px]" style={{ color: "var(--eco-text)" }}>
            {t("reason")} <span style={{ color: "var(--eco-negative)" }}>*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder={t("mandatoryAuditLogged")}
            className="px-3 py-2 rounded-lg outline-none resize-none text-[13px]"
            style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
          />
          <span className="text-[11px]" style={{ color: tooShort ? "var(--eco-text-tertiary)" : "var(--eco-positive)" }}>
            {t("reasonMinLength", { n: 10 })}
          </span>
        </div>
        {error && (
          <div className="text-[13px]" role="alert" style={{ color: "var(--eco-negative)" }}>{error}</div>
        )}
        <Button variant="primary" disabled={tooShort || (user?.role === role)} loading={submitting} onClick={onSubmit}>
          {tx(language, "Сохранить новую роль", "Жаңа рөлді сақтау", "Save new role")}
        </Button>
      </div>
    </Modal>
  );
}

function OwnerVerifyModal({
  open, user, next, reason, submitting, error,
  onReasonChange, onSubmit, onClose,
}: {
  open: boolean;
  user: AdminUserDto | null;
  next: boolean;
  reason: string;
  submitting: boolean;
  error: string | null;
  onReasonChange: (s: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const { language, t } = useI18n();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        next
          ? tx(language, "Отметить как проверенного владельца", "Расталған иесі деп белгілеу", "Mark as verified owner")
          : tx(language, "Снять метку проверенного владельца", "Иесі белгісін алу", "Revoke verified owner")
      }
    >
      <div className="flex flex-col gap-4">
        {user && (
          <div className="p-3 rounded-lg text-[12px]" style={{ background: "var(--eco-surface)", color: "var(--eco-text)" }}>
            U-{user.id} — {user.displayName}
          </div>
        )}
        <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
          {next
            ? tx(
                language,
                "Пользователь получит метку проверенного владельца. Это влияет на доверие и риск-скор.",
                "Пайдаланушы расталған иесі белгісін алады. Бұл сенім мен тәуекел ұпайына әсер етеді.",
                "The user will be marked as a verified owner. This affects trust and risk scoring.",
              )
            : tx(
                language,
                "Метка проверенного владельца будет снята.",
                "Расталған иесі белгісі алынады.",
                "The verified owner mark will be removed.",
              )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px]" style={{ color: "var(--eco-text)" }}>
            {t("reason")} <span style={{ color: "var(--eco-text-tertiary)" }}>({tx(language, "опционально", "міндетті емес", "optional")})</span>
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder={t("mandatoryAuditLogged")}
            className="px-3 py-2 rounded-lg outline-none resize-none text-[13px]"
            style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
          />
        </div>
        {error && (
          <div className="text-[13px]" role="alert" style={{ color: "var(--eco-negative)" }}>{error}</div>
        )}
        <Button variant={next ? "primary" : "destructive"} loading={submitting} onClick={onSubmit}>
          {next
            ? tx(language, "Подтвердить", "Растау", "Confirm")
            : tx(language, "Снять метку", "Белгіні алу", "Revoke")}
        </Button>
      </div>
    </Modal>
  );
}

function CreateUserModal({
  open, onClose, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (u: AdminUserDto) => void;
}) {
  const { language, t } = useI18n();
  const { authorizedRequest } = useAuth();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<AdminRole>("USER");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setEmail(""); setDisplayName(""); setPassword(""); setPhone("");
      setRole("USER"); setError(null); setFieldErrors({});
      setShowPassword(false);
    }
  }, [open]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = tx(language, "Введите корректный email", "Дұрыс email енгізіңіз", "Enter a valid email");
    }
    if (!displayName.trim()) {
      errs.displayName = tx(language, "Укажите имя", "Атын көрсетіңіз", "Display name required");
    }
    if (password.length < 8) {
      errs.password = tx(language, "Минимум 8 символов", "Кемінде 8 таңба", "At least 8 characters");
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    setError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = await authorizedRequest((token) => createAdminUserRequest({
        email: email.trim(),
        displayName: displayName.trim(),
        password,
        role,
        phone: phone.trim() || undefined,
      }, token));
      onCreated(user);
    } catch (err) {
      if (err && typeof err === "object" && "errors" in err) {
        setFieldErrors((err as { errors: Record<string, string> }).errors ?? {});
      }
      setError(formatAdminApiError(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={tx(language, "Добавить пользователя", "Пайдаланушы қосу", "Add user")}>
      <div className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          placeholder="user@example.com"
        />
        <Input
          label={tx(language, "Отображаемое имя", "Көрсетілетін ат", "Display name")}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={fieldErrors.displayName}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px]" style={{ color: "var(--eco-text)" }}>
            {tx(language, "Пароль", "Құпия сөз", "Password")}
          </label>
          <div className="flex gap-2">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg outline-none text-[14px]"
              style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="px-2 rounded-lg cursor-pointer"
              style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}
              aria-label={showPassword ? tx(language, "Скрыть", "Жасыру", "Hide") : tx(language, "Показать", "Көрсету", "Show")}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              type="button"
              onClick={() => { setPassword(generatePassword()); setShowPassword(true); }}
              className="px-3 rounded-lg cursor-pointer text-[12px]"
              style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text-secondary)" }}
            >
              {tx(language, "Сгенерировать", "Жасау", "Generate")}
            </button>
          </div>
          {fieldErrors.password && (
            <span className="text-[11px]" style={{ color: "var(--eco-negative)" }}>{fieldErrors.password}</span>
          )}
        </div>
        <Select
          label={tx(language, "Роль", "Рөл", "Role")}
          value={role}
          onChange={(e) => setRole(e.target.value as AdminRole)}
          options={ROLE_OPTIONS.map((r) => ({ value: r, label: r }))}
        />
        <Input
          label={tx(language, "Телефон (опционально)", "Телефон (міндетті емес)", "Phone (optional)")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+77001234567"
          error={fieldErrors.phone}
        />
        {error && (
          <div className="text-[13px]" role="alert" style={{ color: "var(--eco-negative)" }}>{error}</div>
        )}
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            {tx(language, "Отмена", "Болдырмау", "Cancel")}
          </Button>
          <Button variant="primary" className="flex-1" loading={submitting} onClick={submit}>
            {tx(language, "Создать", "Жасау", "Create")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
