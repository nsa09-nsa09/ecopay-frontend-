import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Button, RoomStatusBadge } from '../ds-primitives';
import { AdminLayout } from './admin-layout';
import { useI18n } from '../i18n-provider';
import { useAuth } from '../auth/auth-provider';
import {
  blockRoomRequest,
  unblockRoomRequest,
  getAdminRoomsRequest,
  type RoomSummaryDto,
} from '../../lib/api';
import { ShieldX, ShieldCheck, Home, MousePointerClick } from 'lucide-react';
import { ConfirmActionModal, FlashBanner, formatAdminApiError, useFlash } from './admin-action-ui';
import { AdminRoomSettingsCard } from './admin-room-settings-card';
import { formatNumber } from '../../lib/datetime';
import {
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminField,
  AdminId,
  AdminListSkeleton,
  AdminPage,
  AdminPageHeader,
  AdminPagination,
  AdminRefreshButton,
} from './admin-ui';

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

  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  // Honor `?selected=<id>` so the global admin search can deep-link straight
  // to a room's detail panel.
  useEffect(() => {
    // Keep the id as a string: 64-bit ids would be corrupted by Number().
    const raw = searchParams.get('selected');
    if (!raw) return;
    setSelectedId(raw);
  }, [searchParams]);
  const [blockModal, setBlockModal] = useState<RoomSummaryDto | null>(null);
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [unblockModal, setUnblockModal] = useState<RoomSummaryDto | null>(null);
  const [unblockSubmitting, setUnblockSubmitting] = useState(false);
  const [unblockError, setUnblockError] = useState<string | null>(null);
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
    () => items.find((r) => String(r.id) === String(selectedId)) ?? null,
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
        prev.map((r) => (r.id === blockModal.id ? { ...r, status: 'BLOCKED' } : r)),
      );
      showFlash('success', t('actionCompletedAndLogged'));
      closeBlockModal();
    } catch (err) {
      setBlockError(formatAdminApiError(err, t));
    } finally {
      setBlockSubmitting(false);
    }
  };

  const closeUnblockModal = () => {
    setUnblockModal(null);
    setUnblockError(null);
  };

  const submitUnblock = async (reason: string) => {
    if (!unblockModal) return;
    setUnblockSubmitting(true);
    setUnblockError(null);
    try {
      await authorizedRequest((token) => unblockRoomRequest(unblockModal.id, reason, token));
      setItems((prev) =>
        prev.map((r) => (r.id === unblockModal.id ? { ...r, status: 'ACTIVE' } : r)),
      );
      showFlash('success', t('actionCompletedAndLogged'));
      closeUnblockModal();
    } catch (err) {
      setUnblockError(formatAdminApiError(err, t));
    } finally {
      setUnblockSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader
          title={t('rooms')}
          actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
        />

        <FlashBanner flash={flash} />

        <AdminRoomSettingsCard
          onSuccess={(message) => showFlash('success', message)}
          onError={(message) => showFlash('error', message)}
        />

        {error && !loading && items.length > 0 && (
          <AdminErrorState inline message={error} onRetry={() => void load()} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 flex flex-col gap-2 min-w-0">
            {loading && items.length === 0 && <AdminListSkeleton rows={5} height={80} />}
            {!loading && error && items.length === 0 && (
              <AdminCard>
                <AdminErrorState message={error} onRetry={() => void load()} />
              </AdminCard>
            )}
            {!loading && !error && items.length === 0 && (
              <AdminCard>
                <AdminEmptyState
                  icon={Home}
                  title={t('emptyRooms')}
                  description={t('adminRoomsEmptyHint')}
                  compact
                />
              </AdminCard>
            )}
            {items.map((r) => {
              const active = String(selectedId) === String(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  aria-pressed={active}
                  className={`eco-admin-record is-clickable text-left px-4 py-3 rounded-xl ${active ? 'is-active' : ''}`}
                  style={{ minHeight: 80 }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <AdminId>R-{r.id}</AdminId>
                    <RoomStatusBadge status={r.status} />
                  </div>
                  <div
                    className="text-[13px] font-semibold break-words"
                    style={{ color: 'var(--eco-text)' }}
                  >
                    {r.title}
                  </div>
                  <div className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
                    {r.serviceName} · <span className="tabular-nums">{r.maxMembers}</span>{' '}
                    {t('seatsLower')}
                  </div>
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
                <AdminEmptyState icon={MousePointerClick} title={t('selectRoomToView')} />
              </AdminCard>
            ) : (
              <AdminCard
                title={<span className="break-words">{selected.title}</span>}
                description={
                  <>
                    R-{selected.id} · {selected.serviceName}
                  </>
                }
                actions={<RoomStatusBadge status={selected.status} />}
                footer={
                  <>
                    {selected.status !== 'BLOCKED' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setBlockModal(selected)}
                      >
                        <ShieldX size={13} /> {t('blockRoom')}
                      </Button>
                    )}
                    {selected.status === 'BLOCKED' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setUnblockModal(selected)}
                      >
                        <ShieldCheck size={13} /> {t('unblockRoom')}
                      </Button>
                    )}
                  </>
                }
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <AdminField label={t('seats')} numeric>
                    {selected.maxMembers}
                  </AdminField>
                  <AdminField label={t('startLabel')} numeric>
                    {selected.startDate}
                  </AdminField>
                  <AdminField label={t('totalCost')} numeric>
                    <span className="whitespace-nowrap">
                      ₸{formatNumber(selected.priceTotal ?? 0)}
                    </span>
                  </AdminField>
                  <AdminField label={t('owner')}>
                    {selected.ownerUserId ? (
                      <Link
                        to={`/admin/users?selected=${selected.ownerUserId}`}
                        style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
                      >
                        {selected.ownerDisplayName ?? `#${selected.ownerUserId}`}
                      </Link>
                    ) : (
                      (selected.ownerDisplayName ?? `#${selected.ownerUserId}`)
                    )}
                  </AdminField>
                </div>
              </AdminCard>
            )}
          </div>
        </div>

        <ConfirmActionModal
          open={!!blockModal}
          onClose={closeBlockModal}
          title={blockModal ? t('blockRoom') : ''}
          description={t('blockRoomConfirm')}
          subjectLabel={blockModal ? `R-${blockModal.id} · ${blockModal.title}` : null}
          destructive
          submitLabel={t('blockRoom')}
          submitting={blockSubmitting}
          errorMessage={blockError}
          onConfirm={submitBlock}
        />

        <ConfirmActionModal
          open={!!unblockModal}
          onClose={closeUnblockModal}
          title={unblockModal ? t('unblockRoom') : ''}
          description={t('unblockRoomConfirm')}
          subjectLabel={unblockModal ? `R-${unblockModal.id} · ${unblockModal.title}` : null}
          submitLabel={t('unblockRoom')}
          submitting={unblockSubmitting}
          errorMessage={unblockError}
          onConfirm={submitUnblock}
        />
      </AdminPage>
    </AdminLayout>
  );
}
