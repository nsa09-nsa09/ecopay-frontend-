import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Button, Badge, Input, Modal, Select, Skeleton } from '../ds-primitives';
import { AdminLayout } from './admin-layout';
import { useI18n } from '../i18n-provider';
import { formatDate, formatDateTime } from '../../lib/datetime';
import { useAuth } from '../auth/auth-provider';
import {
  ApiError,
  banUserRequest,
  createAdminUserRequest,
  getDeletedAdminUsersRequest,
  getAdminUserRequest,
  getAdminUsersRequest,
  getRoomEventLogsRequest,
  revealDeletedIdentifiersRequest,
  unbanUserRequest,
  updateAdminUserOwnerVerifiedRequest,
  updateAdminUserRoleRequest,
  type AdminUserDto,
  type DeletedAdminUserDto,
  type RevealedDeletedIdentifiersDto,
  type RoomEventLogDto,
} from '../../lib/api';
import {
  Ban,
  ShieldCheck,
  Shield,
  Star,
  Home,
  MessageSquare,
  AlertTriangle,
  MousePointerClick,
  Users as UsersIcon,
  UserPlus,
  Repeat2,
  BadgeCheck,
  RotateCcw,
  Eye,
  EyeOff,
  ExternalLink,
  Clock,
  Loader2,
} from 'lucide-react';
import { ConfirmActionModal, FlashBanner, formatAdminApiError, useFlash } from './admin-action-ui';
import { RestrictionModal } from './restriction-modal';
import { reputationOutOfTen } from '../../lib/reputation';
import { localizeFieldErrors } from '../../lib/field-errors';
import {
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminId,
  AdminListSkeleton,
  AdminPage,
  AdminPageHeader,
  AdminPagination,
  AdminRefreshButton,
  AdminStatCard,
  AdminTabs,
  AdminToolbar,
} from './admin-ui';

const PAGE_SIZE = 20;


type AdminRole = 'USER' | 'SUPPORT' | 'ADMIN';
const ROLE_OPTIONS: AdminRole[] = ['USER', 'SUPPORT', 'ADMIN'];

function generatePassword(length = 14): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[arr[i] % alphabet.length];
  return out;
}

export function AdminUsersPage() {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();
  const [searchParams] = useSearchParams();

  const [items, setItems] = useState<AdminUserDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const listRequest = useRef<AbortController | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [segment, setSegment] = useState<'USERS' | 'ADMINS' | 'DELETED'>('USERS');
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [adminsCount, setAdminsCount] = useState<number | null>(null);

  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [detail, setDetail] = useState<AdminUserDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [roomEvents, setRoomEvents] = useState<RoomEventLogDto[]>([]);
  const [roomEventsLoading, setRoomEventsLoading] = useState(false);
  const [roomEventsError, setRoomEventsError] = useState<string | null>(null);

  const [banModal, setBanModal] = useState<{ user: AdminUserDto; action: 'BAN' | 'UNBAN' } | null>(
    null,
  );
  const [banSubmitting, setBanSubmitting] = useState(false);
  const [banError, setBanError] = useState<string | null>(null);
  const [restrictionUserId, setRestrictionUserId] = useState<number | string | null>(null);

  const [roleModal, setRoleModal] = useState<{ user: AdminUserDto } | null>(null);
  const [newRole, setNewRole] = useState<AdminRole>('USER');
  const [roleReason, setRoleReason] = useState('');
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const [verifyModal, setVerifyModal] = useState<{ user: AdminUserDto; next: boolean } | null>(
    null,
  );
  const [verifyReason, setVerifyReason] = useState('');
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);

  const { flash, show: showFlash } = useFlash();

  // Honor `?selected=<id>` so the global admin search can deep-link straight
  // to a user's detail panel.
  useEffect(() => {
    // Keep the id as a string: user ids are 64-bit and Number() would corrupt them.
    const raw = searchParams.get('selected');
    if (!raw) return;
    setSelectedId(raw);
  }, [searchParams]);

  const load = useCallback(async () => {
    if (segment === 'DELETED') return;
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;
    setLoading(true);
    setError(null);
    try {
      const result = await authorizedRequest((token) =>
        getAdminUsersRequest(token, {
          page,
          size: PAGE_SIZE,
          search: search || undefined,
          role: segment === 'ADMINS' ? 'ADMIN' : 'USER',
        }, controller.signal),
      );
      if (controller.signal.aborted) return;
      setItems(result.items);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (err) {
      if (!controller.signal.aborted) setError(formatAdminApiError(err, t));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [authorizedRequest, page, search, segment, t]);

  // Fetch the two segment counters once (and after mutations that could change them
  // via the create/role-change modals) via lightweight size=1 requests.
  const refreshCounts = useCallback(async () => {
    try {
      const [usersPage, adminsPage] = await Promise.all([
        authorizedRequest((token) => getAdminUsersRequest(token, { size: 1, role: 'USER' })),
        authorizedRequest((token) => getAdminUsersRequest(token, { size: 1, role: 'ADMIN' })),
      ]);
      setUsersCount(usersPage.totalItems);
      setAdminsCount(adminsPage.totalItems);
    } catch {
      // counters are non-critical; leave as null on failure
    }
  }, [authorizedRequest]);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    void load();
    return () => listRequest.current?.abort();
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
    setDetail(null);
    setDetailLoading(true);
    authorizedRequest((token) => getAdminUserRequest(selectedId, token))
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setDetail(items.find((u) => String(u.id) === String(selectedId)) ?? null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, authorizedRequest]);

  useEffect(() => {
    if (selectedId == null) {
      setRoomEvents([]);
      setRoomEventsError(null);
      return;
    }

    let cancelled = false;
    setRoomEventsLoading(true);
    setRoomEventsError(null);
    authorizedRequest((token) =>
      getRoomEventLogsRequest(token, { actorUserId: String(selectedId), page: 0, size: 10 }),
    )
      .then((result) => {
        if (!cancelled) setRoomEvents(result.items);
      })
      .catch((err) => {
        if (!cancelled) setRoomEventsError(formatAdminApiError(err, t));
      })
      .finally(() => {
        if (!cancelled) setRoomEventsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authorizedRequest, selectedId, t]);

  const listSelected = useMemo(
    () => items.find((u) => String(u.id) === String(selectedId)) ?? null,
    [items, selectedId],
  );
  const selected = detail ?? listSelected;

  const isBanned = (u: AdminUserDto) => u.status === 'BANNED';
  const hasScheduledRestriction = (u: AdminUserDto) =>
    Boolean(u.banStartsAt && new Date(u.banStartsAt) > new Date());
  const restrictionLabel = (u: AdminUserDto) => {
    if (u.banStartsAt && new Date(u.banStartsAt) > new Date())
      return (
        t('adminRestrictionScheduledFrom') + ` ${formatDateTime(u.banStartsAt, language)}`
      );
    if (!isBanned(u)) return null;
    return u.banUntil
      ? t('adminBlockedUntil') +
          ` ${formatDateTime(u.banUntil, language)}`
      : t('adminBlockedIndefinitely');
  };
  const roleLabel = (role: string) =>
    role === 'ADMIN'
      ? t('adminAdministrator')
      : role === 'SUPPORT'
        ? t('notFoundSupport')
        : t('adminUser');

  const replaceUser = (updated: AdminUserDto) => {
    setItems((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    if (String(selectedId) === String(updated.id)) setDetail(updated);
  };

  const closeBanModal = () => {
    setBanModal(null);
    setBanError(null);
  };

  const submitBan = async (reason: string) => {
    if (!banModal || banSubmitting) return;
    setBanSubmitting(true);
    setBanError(null);
    try {
      const updated = await authorizedRequest((token) =>
        banModal.action === 'BAN'
          ? banUserRequest(banModal.user.id, reason, token)
          : unbanUserRequest(banModal.user.id, reason, token),
      );
      replaceUser(updated);
      showFlash('success', t('actionCompletedAndLogged'));
      closeBanModal();
    } catch (err) {
      setBanError(formatAdminApiError(err, t));
    } finally {
      setBanSubmitting(false);
    }
  };

  const openRoleModal = (user: AdminUserDto) => {
    setRoleModal({ user });
    setNewRole((user.role as AdminRole) ?? 'USER');
    setRoleReason('');
    setRoleError(null);
  };

  const submitRoleChange = async () => {
    if (!roleModal || roleSubmitting) return;
    if (roleReason.trim().length < 10) {
      setRoleError(t('reasonMinLength', { n: 10 }));
      return;
    }
    setRoleSubmitting(true);
    setRoleError(null);
    try {
      const updated = await authorizedRequest((token) =>
        updateAdminUserRoleRequest(
          roleModal.user.id,
          { role: newRole, reason: roleReason.trim() },
          token,
        ),
      );
      replaceUser(updated);
      showFlash('success', t('actionCompletedAndLogged'));
      setRoleModal(null);
    } catch (err) {
      setRoleError(formatAdminApiError(err, t));
    } finally {
      setRoleSubmitting(false);
    }
  };

  const openVerifyModal = (user: AdminUserDto, next: boolean) => {
    setVerifyModal({ user, next });
    setVerifyReason('');
    setVerifyError(null);
  };

  const submitVerifyChange = async () => {
    if (!verifyModal || verifySubmitting) return;
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
      showFlash('success', t('actionCompletedAndLogged'));
      setVerifyModal(null);
    } catch (err) {
      setVerifyError(formatAdminApiError(err, t));
    } finally {
      setVerifySubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader
          title={t('users')}
          actions={
            <>
              <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
                <UserPlus size={13} />{' '}
                {t('adminAddUser')}
              </Button>
              <AdminRefreshButton onClick={() => void load()} loading={loading} />
            </>
          }
        />

        <AdminTabs<'USERS' | 'ADMINS' | 'DELETED'>
          tabs={[
            {
              id: 'USERS',
              label: (
                <>
                  {t('usersSegmentUsers')}
                  <span className="tabular-nums" style={{ color: 'var(--eco-text-tertiary)' }}>
                    ({usersCount ?? '…'})
                  </span>
                </>
              ),
            },
            {
              id: 'ADMINS',
              label: (
                <>
                  {t('usersSegmentAdmins')}
                  <span className="tabular-nums" style={{ color: 'var(--eco-text-tertiary)' }}>
                    ({adminsCount ?? '…'})
                  </span>
                </>
              ),
            },
            { id: 'DELETED', label: t('adminDeleted') },
          ]}
          active={segment}
          onChange={(key) => {
            if (segment === key) return;
            setSegment(key);
            setPage(0);
            setSelectedId(null);
          }}
        />

        {segment === 'DELETED' && <DeletedUsersPanel />}
        {segment !== 'DELETED' && (
          <>
            <AdminToolbar>
              <div className="flex-[1_1_240px] min-w-0 max-w-md">
                <Input
                  placeholder={t('searchUsersPlaceholder')}
                  aria-label={t('searchUsersPlaceholder')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </AdminToolbar>

            <FlashBanner flash={flash} />

            {error && !loading && items.length > 0 && (
              <AdminErrorState inline message={error} onRetry={() => void load()} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-1 flex flex-col gap-2 min-w-0">
                {loading && items.length === 0 && <AdminListSkeleton rows={5} height={84} />}
                {!loading && error && items.length === 0 && (
                  <AdminCard>
                    <AdminErrorState message={error} onRetry={() => void load()} />
                  </AdminCard>
                )}
                {!loading && !error && items.length === 0 && (
                  <AdminCard>
                    <AdminEmptyState
                      icon={UsersIcon}
                      title={t('emptyUsers')}
                      description={t('adminFilteredEmptyHint')}
                      compact
                    />
                  </AdminCard>
                )}
                {items.map((u) => {
                  const active = String(selectedId) === String(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedId(u.id)}
                      aria-pressed={active}
                      className={`eco-admin-record is-clickable text-left px-4 py-3 rounded-xl ${active ? 'is-active' : ''}`}
                      style={{ minHeight: 84 }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <AdminId>U-{u.id}</AdminId>
                        <div className="flex items-center gap-1.5">
                          {u.role && <Badge variant="default">{roleLabel(u.role)}</Badge>}
                        </div>
                      </div>
                      <div
                        className="text-[13px] font-semibold break-words"
                        style={{ color: 'var(--eco-text)' }}
                      >
                        {u.displayName}
                      </div>
                      {restrictionLabel(u) && (
                        <div className="mt-1 text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                          {restrictionLabel(u)}
                        </div>
                      )}
                      <div
                        className="flex items-center gap-2 text-[12px] min-w-0"
                        style={{ color: 'var(--eco-text-secondary)' }}
                      >
                        <span
                          className="flex items-center gap-0.5 tabular-nums shrink-0"
                          style={{ color: 'var(--eco-warning-500)' }}
                        >
                          <Star size={11} fill="currentColor" />{' '}
                          {reputationOutOfTen(u.reputation).toFixed(1)}/10
                        </span>
                        <span className="truncate">· {u.emailMasked ?? u.email}</span>
                      </div>
                      {segment === 'ADMINS' && (
                        <div
                          className="mt-1 flex items-center gap-1 text-[12px]"
                          style={{ color: 'var(--eco-text-tertiary)' }}
                        >
                          <Clock size={11} />
                          <span>{t('usersLastLogin')}:</span>
                          <span className="tabular-nums" style={{ color: 'var(--eco-text-secondary)' }}>
                            {u.lastLoginAt ? formatDateTime(u.lastLoginAt, language) : '—'}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}

                <AdminPagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  disabled={loading}
                />
              </div>

              <div className="lg:col-span-2 min-w-0">
                {!selected ? (
                  <AdminCard>
                    <AdminEmptyState icon={MousePointerClick} title={t('selectUserToView')} />
                  </AdminCard>
                ) : (
                  <div className="flex flex-col gap-4">
                    <AdminCard
                      footer={
                        <>
                          {selected.publicId && (
                            <Link
                              to={`/u/${selected.publicId}`}
                              className="eco-btn eco-btn-secondary inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-[13px]"
                              style={{ textDecoration: 'none' }}
                            >
                              <ExternalLink size={13} /> {t('openPublicProfile')}
                            </Link>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openRoleModal(selected)}
                          >
                            <Repeat2 size={13} />{' '}
                            {t('adminChangeRole')}
                          </Button>
                          <Button
                            variant={selected.ownerVerified ? 'ghost' : 'secondary'}
                            size="sm"
                            onClick={() => openVerifyModal(selected, !selected.ownerVerified)}
                          >
                            {selected.ownerVerified ? (
                              <>
                                <RotateCcw size={13} />{' '}
                                {t('adminRevokeOwnerMark')}
                              </>
                            ) : (
                              <>
                                <BadgeCheck size={13} />{' '}
                                {t('adminMarkAsOwner')}
                              </>
                            )}
                          </Button>
                          {!isBanned(selected) && !hasScheduledRestriction(selected) ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setRestrictionUserId(selected.id)}
                            >
                              <Ban size={13} />{' '}
                              {t('adminBlockUser2')}
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setBanModal({ user: selected, action: 'UNBAN' })}
                            >
                              <ShieldCheck size={13} />{' '}
                              {selected.banStartsAt && new Date(selected.banStartsAt) > new Date()
                                ? t('adminCancelScheduledRestriction')
                                : t('adminRemoveRestriction')}
                            </Button>
                          )}
                        </>
                      }
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-semibold shrink-0"
                              style={{
                                background: 'var(--eco-brand-50)',
                                color: 'var(--eco-brand-700)',
                              }}
                              aria-hidden
                            >
                              {(selected.displayName || '?').charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h2
                                className="text-[15px] font-semibold flex items-center gap-2 break-words"
                                style={{ color: 'var(--eco-text)' }}
                              >
                                {selected.displayName}
                                {detailLoading && (
                                  <Loader2
                                    size={12}
                                    className="animate-spin"
                                    style={{ color: 'var(--eco-text-tertiary)' }}
                                  />
                                )}
                              </h2>
                              <div
                                className="text-[12px] break-all"
                                style={{ color: 'var(--eco-text-secondary)' }}
                              >
                                U-{selected.id} · {selected.emailMasked ?? selected.email}
                                {selected.createdAt
                                  ? ` · ${t('sinceLabel')} ${formatDate(selected.createdAt, language)}`
                                  : ''}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {restrictionLabel(selected) && (
                              <Badge variant="danger">{restrictionLabel(selected)}</Badge>
                            )}
                            {selected.role && (
                              <Badge variant="default">{roleLabel(selected.role)}</Badge>
                            )}
                            {selected.ownerVerified && (
                              <Badge variant="success">
                                <BadgeCheck size={12} /> {t('financeColOwner')}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                          {[
                            {
                              label: t('rating'),
                              value: `${reputationOutOfTen(selected.reputation).toFixed(1)}/10`,
                              icon: Star,
                            },
                            { label: t('owned'), value: `${selected.roomsOwned ?? 0}`, icon: Home },
                            {
                              label: t('joinedCount'),
                              value: `${selected.roomsJoined ?? 0}`,
                              icon: Home,
                            },
                            {
                              label: t('tickets'),
                              value: `${selected.tickets ?? 0}`,
                              icon: MessageSquare,
                            },
                            {
                              label: t('disputes'),
                              value: `${selected.disputes ?? 0}`,
                              icon: AlertTriangle,
                            },
                          ].map((s) => (
                            <AdminStatCard
                              key={s.label}
                              label={s.label}
                              value={s.value}
                              icon={s.icon}
                            />
                          ))}
                        </div>

                        {selected.phoneMasked && (
                          <div
                            className="flex items-center gap-2 text-[12px] pt-3 border-t"
                            style={{ borderColor: 'var(--eco-border)' }}
                          >
                            <Shield size={12} style={{ color: 'var(--eco-text-tertiary)' }} />
                            <span
                              style={{
                                color: 'var(--eco-text-secondary)',
                                fontFamily: 'ui-monospace, monospace',
                              }}
                            >
                              {selected.phoneMasked}
                            </span>
                          </div>
                        )}

                        <div
                          className="flex items-center flex-wrap gap-2 text-[12px] pt-3 border-t"
                          style={{
                            borderColor: 'var(--eco-border)',
                            color: 'var(--eco-text-tertiary)',
                          }}
                        >
                          <Clock size={12} />
                          <span>{t('lastLoginLabel')}:</span>
                          <span className="tabular-nums" style={{ color: 'var(--eco-text-secondary)' }}>
                            {selected.lastLoginAt
                              ? formatDateTime(selected.lastLoginAt, language)
                              : t('lastLoginNever')}
                          </span>
                        </div>
                      </div>
                    </AdminCard>

                    <AdminCard
                      title={t('adminUserRoomEvents')}
                      actions={<Badge variant="info">{roomEvents.length}</Badge>}
                    >
                      {roomEventsLoading ? (
                        <div className="flex flex-col gap-2" aria-busy="true" aria-label={t('loading')}>
                          <Skeleton height={36} rounded={6} />
                          <Skeleton height={36} rounded={6} />
                          <Skeleton height={36} rounded={6} />
                        </div>
                      ) : roomEventsError ? (
                        <AdminErrorState inline message={roomEventsError} />
                      ) : roomEvents.length === 0 ? (
                        <AdminEmptyState
                          icon={Home}
                          title={t('adminNoRoomEvents')}
                          compact
                        />
                      ) : (
                        <div className="flex flex-col">
                          {roomEvents.map((event) => (
                            <div
                              key={event.id}
                              className="flex items-start justify-between gap-3 py-2 border-t first:border-t-0"
                              style={{ borderColor: 'var(--eco-border)' }}
                            >
                              <div className="min-w-0">
                                <code
                                  className="text-[12px] break-all"
                                  style={{ color: 'var(--eco-text)' }}
                                >
                                  {event.eventType}
                                </code>
                                <div
                                  className="text-[12px] mt-0.5 tabular-nums"
                                  style={{ color: 'var(--eco-text-tertiary)' }}
                                >
                                  {formatDateTime(event.createdAt, language)}
                                </div>
                              </div>
                              {event.roomId != null && (
                                <Link
                                  to={`/admin/rooms?selected=${event.roomId}`}
                                  className="text-[12px] shrink-0"
                                  style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
                                >
                                  R-{event.roomId}
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </AdminCard>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <ConfirmActionModal
          open={!!banModal}
          onClose={closeBanModal}
          title={banModal ? (banModal.action === 'BAN' ? t('banUser') : t('unbanUser')) : ''}
          description={
            banModal ? (
              <>
                {banModal.action === 'BAN' ? t('banUserConfirm') : t('unbanUserConfirm')}
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--eco-text-tertiary)' }}>
                  {t('banReasonHint')}
                </div>
              </>
            ) : null
          }
          subjectLabel={banModal ? `U-${banModal.user.id} · ${banModal.user.displayName}` : null}
          destructive={banModal?.action === 'BAN'}
          submitLabel={banModal ? (banModal.action === 'BAN' ? t('banUser') : t('unbanUser')) : ''}
          submitting={banSubmitting}
          errorMessage={banError}
          onConfirm={submitBan}
        />

        <RestrictionModal
          userId={restrictionUserId}
          onClose={() => setRestrictionUserId(null)}
          onSaved={(updated) => {
            replaceUser(updated);
            showFlash('success', t('actionCompletedAndLogged'));
          }}
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
            showFlash('success', t('actionCompletedAndLogged'));
            setCreateOpen(false);
          }}
        />
      </AdminPage>
    </AdminLayout>
  );
}

function DeletedUsersPanel() {
  const { language, t } = useI18n();
  const { authorizedRequest, isAuthenticated, user } = useAuth();
  const [items, setItems] = useState<DeletedAdminUserDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DeletedAdminUserDto | null>(null);
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [reason, setReason] = useState('');
  const [revealed, setRevealed] = useState<RevealedDeletedIdentifiersDto | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);
  const listRequest = useRef<AbortController | null>(null);
  const revealVersion = useRef(0);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') return;
    revealVersion.current += 1;
    setSelected(null);
    setRevealed(null);
    setReason('');
    setRevealError(null);
  }, [isAuthenticated, user?.id, user?.role]);

  const loadDeleted = useCallback(async () => {
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;
    setLoading(true);
    setError(null);
    try {
      const result = await authorizedRequest((token) =>
        getDeletedAdminUsersRequest(token, { page, size: PAGE_SIZE, search: search || undefined }, controller.signal),
      );
      if (controller.signal.aborted) return;
      setItems(result.items);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        revealVersion.current += 1;
        setSelected(null);
        setRevealed(null);
        setReason('');
      }
      setError(formatAdminApiError(err, t));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [authorizedRequest, page, search, t]);

  useEffect(() => {
    void loadDeleted();
    return () => listRequest.current?.abort();
  }, [loadDeleted]);

  const close = () => {
    if (revealing) return;
    revealVersion.current += 1;
    setSelected(null);
    setStage(1);
    setReason('');
    setRevealed(null);
    setRevealError(null);
  };

  const reveal = async () => {
    if (!selected || revealing || !reason.trim()) return;
    const version = ++revealVersion.current;
    setRevealing(true);
    setRevealError(null);
    try {
      const data = await authorizedRequest((token) =>
        revealDeletedIdentifiersRequest(selected.userId, reason.trim(), token),
      );
      if (version !== revealVersion.current) return;
      setRevealed(data);
      setStage(3);
    } catch (err) {
      if (version !== revealVersion.current) return;
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setSelected(null);
        setRevealed(null);
        setReason('');
      }
      setRevealError(formatAdminApiError(err, t));
    } finally {
      if (version === revealVersion.current) setRevealing(false);
    }
  };

  return (
    <>
      <AdminToolbar>
        <div className="flex-[1_1_240px] min-w-0 max-w-md">
          <Input
            placeholder={t('adminSearchDeletedUsers')}
            aria-label={t('adminSearchDeletedUsers')}
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
            }}
          />
        </div>
      </AdminToolbar>
      {error && !loading && items.length > 0 && <AdminErrorState inline message={error} />}
      {loading ? (
        <AdminListSkeleton rows={4} height={92} />
      ) : error && items.length === 0 ? (
        <AdminCard>
          <AdminErrorState message={error} />
        </AdminCard>
      ) : items.length === 0 ? (
        <AdminCard>
          <AdminEmptyState
            icon={UsersIcon}
            title={t('adminNoDeletedUsers')}
            compact
          />
        </AdminCard>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.userId}
              className="eco-admin-record rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0"
            >
              <div className="min-w-0 flex-1">
                <div
                  className="text-[13px] font-semibold break-words"
                  style={{ color: 'var(--eco-text)' }}
                >
                  {item.displayNameAtDeletion}
                </div>
                <div
                  className="text-[12px] break-all"
                  style={{ color: 'var(--eco-text-secondary)' }}
                >
                  {item.slugAtDeletion ? `@${item.slugAtDeletion}` : `U-${item.userId}`}
                </div>
                <div
                  className="mt-1 text-[12px] tabular-nums"
                  style={{ color: 'var(--eco-text-tertiary)' }}
                >
                  {t('adminDeleted2')}{' '}
                  {formatDateTime(item.deletedAt, language)}
                </div>
              </div>
              <div
                className="min-w-0 sm:w-[250px] text-[13px] break-all"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {item.identityArchived ? (
                  <>
                    <div>{item.emailMasked || '—'}</div>
                    <div>{item.phoneMasked || '—'}</div>
                  </>
                ) : (
                  t('adminContactsWereDeletedBeforeArchivingWas')
                )}
              </div>
              {item.identityArchived && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="self-start sm:self-center shrink-0"
                  onClick={() => {
                    revealVersion.current += 1;
                    setSelected(item);
                    setStage(1);
                    setReason('');
                    setRevealed(null);
                    setRevealError(null);
                  }}
                >
                  <Eye size={13} />{' '}
                  {t('adminShowContacts')}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        disabled={loading}
      />
      <Modal
        open={selected != null}
        onClose={close}
        title={
          stage === 1
            ? t('adminRevealOriginalContactDetails')
            : stage === 2
              ? t('adminConfirmAccess')
              : t('adminContactDetails')
        }
      >
        {stage === 3 && revealed ? (
          <div
            className="flex flex-col gap-3 text-[13px] break-all"
            style={{ color: 'var(--eco-text)' }}
          >
            <div>
              {t('email')}: {revealed.email || '—'}
            </div>
            <div>
              {t('adminPhone')}: {revealed.phone || '—'}
            </div>
            <div>@{revealed.slug || '—'}</div>
            <Button variant="secondary" onClick={close}>
              {t('navbarSearchClose')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {stage === 1 ? (
              <>
                <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
                  {t('adminAccessIsRecordedInTheSecurity')}
                </p>
                <label
                  className="text-[13px] flex flex-col gap-1"
                  style={{ color: 'var(--eco-text-secondary)' }}
                >
                  {t('adminReasonForAccess')}
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="rounded-lg p-2"
                    style={{
                      background: 'var(--eco-surface)',
                      color: 'var(--eco-text)',
                      border: '1px solid var(--eco-border)',
                    }}
                  />
                </label>
              </>
            ) : (
              <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
                {t('adminOriginalDetailsWillAppearOnlyIn')}
              </p>
            )}
            {revealError && (
              <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                {revealError}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                disabled={revealing}
                onClick={() => (stage === 1 ? close() : setStage(1))}
              >
                {stage === 1
                  ? t('adminCancel')
                  : t('adminNewsCarouselPrev')}
              </Button>
              <Button
                className="flex-1"
                disabled={revealing || !reason.trim()}
                loading={revealing}
                onClick={() => (stage === 1 ? setStage(2) : void reveal())}
              >
                {stage === 1
                  ? t('adminContinue')
                  : t('confirmLabel')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function RoleChangeModal({
  open,
  user,
  role,
  reason,
  submitting,
  error,
  onRoleChange,
  onReasonChange,
  onSubmit,
  onClose,
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
  const { t } = useI18n();
  const tooShort = reason.trim().length < 10;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('adminChangeRole')}
    >
      <div className="flex flex-col gap-4">
        {user && (
          <div
            className="p-3 rounded-lg text-[12px]"
            style={{ background: 'var(--eco-surface)', color: 'var(--eco-text)' }}
          >
            U-{user.id} · {user.displayName}{' '}
            <span style={{ color: 'var(--eco-text-tertiary)' }}>
              · {t('adminCurrently')}: {user.role ?? '—'}
            </span>
          </div>
        )}
        <Select
          label={t('adminNewRole')}
          value={role}
          onChange={(e) => onRoleChange(e.target.value as AdminRole)}
          options={ROLE_OPTIONS.map((r) => ({ value: r, label: r }))}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
            {t('reason')} <span style={{ color: 'var(--eco-negative)' }}>*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder={t('mandatoryAuditLogged')}
            className="px-3 py-2 rounded-lg outline-none resize-none text-[13px]"
            style={{
              background: 'var(--eco-surface)',
              border: '1px solid var(--eco-border)',
              color: 'var(--eco-text)',
            }}
          />
          <span
            className="text-[12px]"
            style={{ color: tooShort ? 'var(--eco-text-tertiary)' : 'var(--eco-positive)' }}
          >
            {t('reasonMinLength', { n: 10 })}
          </span>
        </div>
        {error && (
          <div className="text-[13px]" role="alert" style={{ color: 'var(--eco-negative)' }}>
            {error}
          </div>
        )}
        <Button
          variant="primary"
          disabled={tooShort || user?.role === role}
          loading={submitting}
          onClick={onSubmit}
        >
          {t('adminSaveNewRole')}
        </Button>
      </div>
    </Modal>
  );
}

function OwnerVerifyModal({
  open,
  user,
  next,
  reason,
  submitting,
  error,
  onReasonChange,
  onSubmit,
  onClose,
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
  const { t } = useI18n();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        next
          ? t('adminMarkAsVerifiedOwner')
          : t('adminRevokeVerifiedOwner')
      }
    >
      <div className="flex flex-col gap-4">
        {user && (
          <div
            className="p-3 rounded-lg text-[12px]"
            style={{ background: 'var(--eco-surface)', color: 'var(--eco-text)' }}
          >
            U-{user.id} · {user.displayName}
          </div>
        )}
        <div className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
          {next
            ? t('adminTheUserWillBeMarkedAs')
            : t('adminTheVerifiedOwnerMarkWillBe')}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
            {t('reason')}{' '}
            <span style={{ color: 'var(--eco-text-tertiary)' }}>
              ({t('adminOptional')})
            </span>
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder={t('mandatoryAuditLogged')}
            className="px-3 py-2 rounded-lg outline-none resize-none text-[13px]"
            style={{
              background: 'var(--eco-surface)',
              border: '1px solid var(--eco-border)',
              color: 'var(--eco-text)',
            }}
          />
        </div>
        {error && (
          <div className="text-[13px]" role="alert" style={{ color: 'var(--eco-negative)' }}>
            {error}
          </div>
        )}
        <Button variant={next ? 'primary' : 'destructive'} loading={submitting} onClick={onSubmit}>
          {next
            ? t('confirmLabel')
            : t('adminRevoke')}
        </Button>
      </div>
    </Modal>
  );
}

function CreateUserModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (u: AdminUserDto) => void;
}) {
  const { language, t } = useI18n();
  const { authorizedRequest } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AdminRole>('USER');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setEmail('');
      setDisplayName('');
      setPassword('');
      setPhone('');
      setRole('USER');
      setError(null);
      setFieldErrors({});
      setShowPassword(false);
    }
  }, [open]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = t('adminEnterAValidEmail');
    }
    if (!displayName.trim()) {
      errs.displayName = t('adminDisplayNameRequired');
    }
    if (password.length < 8) {
      errs.password = t('adminAtLeast8Characters');
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    if (submitting) return;
    setError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = await authorizedRequest((token) =>
        createAdminUserRequest(
          {
            email: email.trim(),
            displayName: displayName.trim(),
            password,
            role,
            phone: phone.trim() || undefined,
          },
          token,
        ),
      );
      onCreated(user);
    } catch (err) {
      if (err instanceof ApiError) setFieldErrors(localizeFieldErrors(err.errors, language));
      setError(formatAdminApiError(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('adminAddUser')}
    >
      <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
        <Input
          label={t('email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          placeholder="user@example.com"
        />
        <Input
          label={t('adminDisplayName')}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={fieldErrors.displayName}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
            {t('password')}
          </label>
          <div className="flex gap-2">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg outline-none text-[14px]"
              style={{
                background: 'var(--eco-surface)',
                border: '1px solid var(--eco-border)',
                color: 'var(--eco-text)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="px-2 rounded-lg cursor-pointer"
              style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
              aria-label={
                showPassword
                  ? t('hide')
                  : t('show')
              }
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              type="button"
              onClick={() => {
                setPassword(generatePassword());
                setShowPassword(true);
              }}
              className="px-3 rounded-lg cursor-pointer text-[12px]"
              style={{
                background: 'var(--eco-surface)',
                border: '1px solid var(--eco-border)',
                color: 'var(--eco-text-secondary)',
              }}
            >
              {t('adminGenerate')}
            </button>
          </div>
          {fieldErrors.password && (
            <span className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
              {fieldErrors.password}
            </span>
          )}
        </div>
        <Select
          label={t('adminRole')}
          value={role}
          onChange={(e) => setRole(e.target.value as AdminRole)}
          options={ROLE_OPTIONS.map((r) => ({ value: r, label: r }))}
        />
        <Input
          label={t('adminPhoneOptional')}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+77001234567"
          error={fieldErrors.phone}
        />
        {error && (
          <div className="text-[13px]" role="alert" style={{ color: 'var(--eco-negative)' }}>
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button variant="primary" className="flex-1" loading={submitting} onClick={submit}>
            {t('adminPricingCreate')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
