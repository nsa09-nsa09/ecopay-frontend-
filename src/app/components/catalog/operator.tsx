import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Card, Pill, Select, RoomStatusBadge, EmptyState, Tabs } from '../ds-primitives';
import { ArrowLeft, Users, Filter } from 'lucide-react';
import { useI18n } from '../i18n-provider';
import { AccessTypeTag } from '../access-type';
import {
  getRooms,
  getService,
  getTariffs,
  type RoomSummaryDto,
  type ServiceDto,
  type TariffPlanDto,
} from '../../lib/api';

const moneyFormatter = new Intl.NumberFormat('ru-RU');

const operatorColors: Record<string, string> = {
  'beeline-family': '#FFB800',
  'activ-family': '#9B59B6',
  'altel-family': '#E74C3C',
  'tele2-family': '#1A1A2E',
  'kcell-family': '#00A651',
};

function getOperatorColor(service: ServiceDto | null) {
  if (!service) {
    return 'var(--eco-primary)';
  }

  return operatorColors[service.slug] ?? 'var(--eco-primary)';
}

function formatMoney(value: number | null | undefined) {
  return `₸${moneyFormatter.format(Number(value ?? 0))}`;
}

export function OperatorPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  // Keep the id as a string: service ids are 64-bit and Number() would corrupt them.
  // (Must match room.serviceId, which the backend now serializes as a string.)
  const serviceId = id ?? '';

  const [service, setService] = useState<ServiceDto | null>(null);
  const [plans, setPlans] = useState<TariffPlanDto[]>([]);
  const [rooms, setRooms] = useState<RoomSummaryDto[]>([]);
  const [tab, setTab] = useState<'plans' | 'rooms'>('plans');
  const [priceFilter, setPriceFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadOperator() {
      if (!serviceId) {
        setError(t('operatorNotFound'));
        setLoading(false);
        return;
      }

      try {
        const [serviceResponse, tariffResponse, roomResponse] = await Promise.all([
          getService(serviceId),
          getTariffs(serviceId),
          getRooms({ status: 'OPEN', size: 100 }),
        ]);

        if (!isCancelled) {
          setService(serviceResponse);
          setPlans(tariffResponse);
          setRooms(roomResponse.items.filter((room) => room.serviceId === serviceId));
        }
      } catch {
        if (!isCancelled) {
          setError(t('unableToLoadOperator'));
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadOperator();

    return () => {
      isCancelled = true;
    };
  }, [serviceId]);

  const filteredRooms = rooms.filter((room) => {
    const monthlyPrice = Number(room.pricePerMember ?? 0);

    if (priceFilter === 'low') {
      return monthlyPrice < 3000;
    }

    if (priceFilter === 'mid') {
      return monthlyPrice >= 3000 && monthlyPrice <= 5000;
    }

    if (priceFilter === 'high') {
      return monthlyPrice > 5000;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <Card>{t('loadingOperator')}</Card>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-[13px] mb-6"
          style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
        >
          <ArrowLeft size={14} /> {t('catalog')}
        </Link>
        <EmptyState
          title={t('operatorUnavailable')}
          description={error ?? t('operatorCouldNotLoad')}
        />
      </div>
    );
  }

  const noPlans = plans.length === 0;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-[13px] mb-6"
        style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
      >
        <ArrowLeft size={14} /> {t('catalog')}
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-[18px] shrink-0"
          style={{ background: `${getOperatorColor(service)}18`, color: getOperatorColor(service) }}
        >
          {service.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <h1
            className="text-[22px] sm:text-[24px] break-words"
            style={{ color: 'var(--eco-text)' }}
          >
            {service.name}
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {noPlans
              ? t('noFamilyGroupPlans')
              : t('plansOpenRooms', { plans: plans.length, rooms: rooms.length })}
          </p>
          <div className="mt-1.5">
            <AccessTypeTag accessType={service.accessType} size="md" />
          </div>
        </div>
      </div>

      {noPlans ? (
        <EmptyState
          title={t('noFamilyPlansAvailable')}
          description={t('noShareableTariffs', { operator: service.name })}
        />
      ) : (
        <>
          <Tabs
            tabs={[
              { id: 'plans', label: t('tabPlans') },
              { id: 'rooms', label: t('availableRooms') },
            ]}
            active={tab}
            onChange={(id) => setTab(id as 'plans' | 'rooms')}
          />

          {tab === 'plans' && (
            <div className="mt-6">
              <div
                className="overflow-x-auto rounded-xl border"
                style={{ borderColor: 'var(--eco-border)' }}
              >
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--eco-border)' }}>
                      {[
                        t('plan'),
                        t('members'),
                        t('colTotalPerPeriod'),
                        t('colPerMember'),
                        t('connection'),
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3 text-left text-[12px]"
                          style={{
                            color: 'var(--eco-text-tertiary)',
                            background: 'var(--eco-surface)',
                          }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => (
                      <tr key={plan.id} style={{ borderBottom: '1px solid var(--eco-border)' }}>
                        <td className="px-4 py-3 text-[13px]" style={{ color: 'var(--eco-text)' }}>
                          <div>{plan.name}</div>
                          {plan.features && plan.features.length > 0 && (
                            <ul className="mt-1.5 flex flex-wrap gap-1.5">
                              {plan.features.map((f, i) => (
                                <li
                                  key={`${plan.id}-f-${i}`}
                                  className="text-[11px] px-2 py-0.5 rounded-full"
                                  style={{
                                    background: 'var(--eco-surface)',
                                    color: 'var(--eco-text-secondary)',
                                  }}
                                >
                                  {f}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td
                          className="px-4 py-3 text-[13px]"
                          style={{ color: 'var(--eco-text-secondary)' }}
                        >
                          {plan.maxMembers}
                        </td>
                        <td className="px-4 py-3 text-[13px]" style={{ color: 'var(--eco-text)' }}>
                          {formatMoney(plan.basePriceTotal)}
                        </td>
                        <td
                          className="px-4 py-3 text-[13px]"
                          style={{ color: 'var(--eco-primary)' }}
                        >
                          {formatMoney(
                            Number(plan.basePriceTotal ?? 0) / Math.max(plan.maxMembers ?? 1, 1),
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Pill variant="info">{plan.connectionType}</Pill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'rooms' && (
            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Filter size={14} style={{ color: 'var(--eco-text-tertiary)' }} />
                <Select
                  options={[
                    { value: 'all', label: t('allPrices') },
                    { value: 'low', label: t('priceUnder3000') },
                    { value: 'mid', label: t('priceMid') },
                    { value: 'high', label: t('priceOver5000') },
                  ]}
                  value={priceFilter}
                  onChange={(event) => setPriceFilter(event.target.value)}
                />
              </div>

              {filteredRooms.length === 0 ? (
                <EmptyState title={t('noMatchingRooms')} description={t('noMatchingRoomsDesc')} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredRooms.map((room) => (
                    <Link key={room.id} to={`/room/${room.id}`} style={{ textDecoration: 'none' }}>
                      <Card className="flex flex-col gap-3 hover:shadow-sm transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="text-[14px]" style={{ color: 'var(--eco-text)' }}>
                            {room.title}
                          </span>
                          <RoomStatusBadge status={room.status} />
                        </div>
                        <div className="flex items-center justify-between text-[13px]">
                          <span
                            className="inline-flex items-center gap-1"
                            style={{ color: 'var(--eco-text-secondary)' }}
                          >
                            <Users size={13} /> {t('maxMembersCount', { count: room.maxMembers })}
                          </span>
                          <span style={{ color: 'var(--eco-primary)' }}>
                            {formatMoney(room.pricePerMember)}
                            {t('perMonthShort')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[12px]">
                          <span style={{ color: 'var(--eco-text-tertiary)' }}>
                            {t('owner')}:{' '}
                            {room.ownerSlug || room.ownerPublicId ? (
                              <span
                                role="link"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  navigate(`/u/${room.ownerSlug ?? room.ownerPublicId}`);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigate(`/u/${room.ownerSlug ?? room.ownerPublicId}`);
                                  }
                                }}
                                className="cursor-pointer hover:underline"
                                style={{ color: 'var(--eco-primary)' }}
                              >
                                {room.ownerDisplayName}
                              </span>
                            ) : (
                              room.ownerDisplayName
                            )}
                          </span>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
