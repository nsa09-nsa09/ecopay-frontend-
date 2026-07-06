import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BellRing,
  Check,
  ChevronDown,
  ChevronUp,
  History,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { AdminLayout } from './admin-layout';
import { Badge, Button, Card, Drawer, Input, Modal, Select } from '../ds-primitives';
import { useI18n, type Language } from '../i18n-provider';
import { useAuth } from '../auth/auth-provider';
import { FlashBanner, formatAdminApiError, useFlash } from './admin-action-ui';
import { formatDateTime } from '../../lib/datetime';
import {
  adminAcknowledgePricingChange,
  adminCheckPricingProvider,
  adminCreatePricingProvider,
  adminDeletePricingProvider,
  adminGetPricingHistory,
  adminListPricingChanges,
  adminListPricingProviders,
  adminUpdatePricingProvider,
  type PricingChangeDto,
  type PricingExtractionType,
  type PricingProviderDto,
  type PricingProviderStatus,
  type PricingSnapshotDto,
  type PricingSnapshotOutcome,
  type UpsertPricingProviderPayload,
} from '../../lib/api';

const CURRENCIES = ['KZT', 'USD', 'EUR', 'RUB', 'CNY', 'GBP', 'UZS', 'KGS'];
const EXTRACTION_TYPES: PricingExtractionType[] = [
  'AUTO',
  'JSON_LD',
  'META',
  'CSS',
  'REGEX',
  'MANUAL',
];

type BadgeVariant = 'success' | 'warning' | 'danger' | 'default';
type LabelMap = Record<string, { ru: string; kz: string; en: string }>;

/**
 * Normalize a raw enum value from the backend. Handles null/undefined, lower-
 * case, and whitespace so an unexpected shape ("ok " / "Pending" / null) does
 * not crash the render.
 */
function normalizeEnum(value: unknown): string {
  if (value == null) return '';
  return String(value).trim().toUpperCase();
}

/**
 * Safe dictionary lookup: never reads `.ru` off `undefined`. Falls back to the
 * raw enum value (so admins still see *something* recognizable) and, as a last
 * resort, an em-dash.
 */
function pickLabel(map: LabelMap, raw: unknown, lang: Language): string {
  const key = normalizeEnum(raw);
  const entry = map[key];
  if (entry) return entry[lang] ?? entry.en ?? key;
  return key || '—';
}

const STATUS_LABELS: LabelMap = {
  OK: { ru: 'OK', kz: 'OK', en: 'OK' },
  STALE: { ru: 'Устарело', kz: 'Ескірген', en: 'Stale' },
  FAILING: { ru: 'Сбой', kz: 'Қате', en: 'Failing' },
  BLOCKED: { ru: 'Заблокировано', kz: 'Бұғатталған', en: 'Blocked' },
  PENDING: { ru: 'Ожидает проверки', kz: 'Тексеруді күтуде', en: 'Pending' },
};

const OUTCOME_LABELS: LabelMap = {
  // Backend emits SUCCESS for a good fetch; keep OK/UNCHANGED aliases so an
  // older cached response doesn't slip through as an unlabelled em-dash.
  SUCCESS: { ru: 'Успех', kz: 'Сәтті', en: 'Success' },
  OK: { ru: 'OK', kz: 'OK', en: 'OK' },
  UNCHANGED: { ru: 'Без изменений', kz: 'Өзгеріссіз', en: 'Unchanged' },
  PARSE_FAILED: { ru: 'Ошибка парсинга', kz: 'Талдау қатесі', en: 'Parse failed' },
  FETCH_FAILED: { ru: 'Ошибка запроса', kz: 'Сұрау қатесі', en: 'Fetch failed' },
  BLOCKED: { ru: 'Заблокировано', kz: 'Бұғатталған', en: 'Blocked' },
  PENDING: { ru: 'Ожидает', kz: 'Күтуде', en: 'Pending' },
};

const EXTRACTION_LABELS: LabelMap = {
  AUTO: { ru: 'Авто', kz: 'Авто', en: 'Auto' },
  JSON_LD: { ru: 'JSON-LD', kz: 'JSON-LD', en: 'JSON-LD' },
  META: { ru: 'Meta-теги', kz: 'Meta тегтері', en: 'Meta tags' },
  CSS: { ru: 'CSS-селектор', kz: 'CSS селекторы', en: 'CSS selector' },
  REGEX: { ru: 'Regex', kz: 'Regex', en: 'Regex' },
  MANUAL: { ru: 'Вручную', kz: 'Қолмен', en: 'Manual' },
};

function statusVariant(status: unknown): BadgeVariant {
  switch (normalizeEnum(status)) {
    case 'OK':
      return 'success';
    case 'STALE':
      return 'warning';
    case 'PENDING':
      return 'default';
    case 'FAILING':
    case 'BLOCKED':
      return 'danger';
    default:
      return 'default';
  }
}

function outcomeVariant(outcome: unknown): BadgeVariant {
  switch (normalizeEnum(outcome)) {
    case 'SUCCESS':
    case 'OK':
      return 'success';
    case 'UNCHANGED':
    case 'PENDING':
      return 'default';
    case 'PARSE_FAILED':
      return 'warning';
    case 'FETCH_FAILED':
    case 'BLOCKED':
      return 'danger';
    default:
      return 'default';
  }
}

function statusLabelText(status: unknown, lang: Language): string {
  return pickLabel(STATUS_LABELS, status, lang);
}

function outcomeLabelText(outcome: unknown, lang: Language): string {
  return pickLabel(OUTCOME_LABELS, outcome, lang);
}

function extractionLabelText(type: unknown, lang: Language): string {
  return pickLabel(EXTRACTION_LABELS, type, lang);
}

function formatRelative(iso: string | null, lang: Language): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const diff = Date.now() - date.getTime();
  const sec = Math.max(0, Math.round(diff / 1000));
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  const pick = (ru: string, kz: string, en: string) =>
    lang === 'ru' ? ru : lang === 'kz' ? kz : en;
  if (sec < 45) return pick('только что', 'жаңа ғана', 'just now');
  if (min < 60) return pick(`${min} мин назад`, `${min} мин бұрын`, `${min}m ago`);
  if (hr < 24) return pick(`${hr} ч назад`, `${hr} сағ бұрын`, `${hr}h ago`);
  return pick(`${day} дн назад`, `${day} күн бұрын`, `${day}d ago`);
}

function formatPrice(price: number | null, currency: string, lang: Language): string {
  if (price == null) return '—';
  try {
    const locale = lang === 'ru' ? 'ru-RU' : lang === 'kz' ? 'kk-KZ' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}

function ChangeArrow({
  current,
  previous,
}: {
  current: number | null;
  previous: number | null;
}) {
  if (current == null || previous == null || current === previous) {
    return <Minus size={14} style={{ color: 'var(--eco-text-tertiary)' }} />;
  }
  if (current > previous) {
    return <ArrowUpRight size={14} style={{ color: 'var(--eco-negative)' }} />;
  }
  return <ArrowDownRight size={14} style={{ color: 'var(--eco-positive)' }} />;
}

export function AdminPricingPage() {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();

  const [providers, setProviders] = useState<PricingProviderDto[]>([]);
  const [changes, setChanges] = useState<PricingChangeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ids are opaque strings — backend serialises CockroachDB BIGSERIAL as text
  // to survive JS's 2^53 rounding, so match that here.
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [ackingId, setAckingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<PricingProviderDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<PricingProviderDto | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [historyOf, setHistoryOf] = useState<PricingProviderDto | null>(null);
  const { flash, show } = useFlash();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [providersData, changesData] = await Promise.all([
        authorizedRequest((token) => adminListPricingProviders(token)),
        authorizedRequest((token) => adminListPricingChanges(token, { unacknowledged: true })),
      ]);
      setProviders(providersData);
      setChanges(changesData);
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const runCheck = async (provider: PricingProviderDto) => {
    setCheckingId(provider.id);
    try {
      const updated = await authorizedRequest((token) =>
        adminCheckPricingProvider(provider.id, token),
      );
      setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      show('success', t('actionCompletedAndLogged'));
    } catch (err) {
      show('error', formatAdminApiError(err, t));
    } finally {
      setCheckingId(null);
    }
  };

  const ackChange = async (change: PricingChangeDto) => {
    setAckingId(change.id);
    try {
      await authorizedRequest((token) => adminAcknowledgePricingChange(change.id, token));
      setChanges((prev) => prev.filter((c) => c.id !== change.id));
      show('success', t('actionCompletedAndLogged'));
    } catch (err) {
      show('error', formatAdminApiError(err, t));
    } finally {
      setAckingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteSubmitting(true);
    try {
      await authorizedRequest((token) => adminDeletePricingProvider(deleting.id, token));
      setProviders((prev) => prev.filter((p) => p.id !== deleting.id));
      setDeleting(null);
      show('success', t('actionCompletedAndLogged'));
    } catch (err) {
      show('error', formatAdminApiError(err, t));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-[1200px]">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h1 className="text-[24px]" style={{ color: 'var(--eco-text)' }}>
            {t('adminPricingTitle')}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw size={13} /> {t('retry')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
              <Plus size={13} /> {t('adminPricingAddProvider')}
            </Button>
          </div>
        </div>

        <FlashBanner flash={flash} />

        {error && !loading && (
          <Card className="mb-4">
            <span className="text-[13px]" style={{ color: 'var(--eco-negative)' }}>
              {error}
            </span>
          </Card>
        )}

        <RecentChangesBlock
          changes={changes}
          language={language}
          ackingId={ackingId}
          onAck={ackChange}
        />

        {loading ? (
          <Card>
            <span className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {t('loading')}
            </span>
          </Card>
        ) : providers.length === 0 ? (
          <Card className="text-center py-10 text-[13px]">
            <span style={{ color: 'var(--eco-text-tertiary)' }}>{t('adminPricingEmpty')}</span>
          </Card>
        ) : (
          <Card className="p-0 overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--eco-border)' }}>
                  <Th>{t('adminPricingColPlatform')}</Th>
                  <Th>{t('adminPricingColPlan')}</Th>
                  <Th>{t('adminPricingColPrice')}</Th>
                  <Th>{t('adminPricingColLastCheck')}</Th>
                  <Th>{t('adminPricingColStatus')}</Th>
                  <Th align="right">{t('adminPricingColActions')}</Th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--eco-border)' }}>
                    <Td>
                      <div style={{ color: 'var(--eco-text)' }}>{p.platform}</div>
                      <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                        {p.name}
                      </div>
                    </Td>
                    <Td>{p.planName}</Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: 'var(--eco-text)' }}>
                          {formatPrice(p.currentPrice, p.currency, language)}
                        </span>
                        <ChangeArrow current={p.currentPrice} previous={p.previousPrice} />
                      </div>
                      {p.previousPrice != null && (
                        <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                          {t('adminPricingPrevious')}:{' '}
                          {formatPrice(p.previousPrice, p.currency, language)}
                        </div>
                      )}
                    </Td>
                    <Td>
                      <span title={formatDateTime(p.lastCheckedAt, language)}>
                        {formatRelative(p.lastCheckedAt, language)}
                      </span>
                    </Td>
                    <Td>
                      <Badge variant={statusVariant(p.status)}>
                        {statusLabelText(p.status, language)}
                      </Badge>
                      {!p.active && (
                        <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                          {t('adminPricingInactive')}
                        </div>
                      )}
                    </Td>
                    <Td align="right">
                      <div className="flex items-center gap-1 justify-end flex-wrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={checkingId === p.id}
                          onClick={() => void runCheck(p)}
                          title={t('adminPricingCheckNow')}
                        >
                          <RefreshCw size={12} /> {t('adminPricingCheckNow')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setHistoryOf(p)}
                          title={t('adminPricingHistory')}
                        >
                          <History size={12} /> {t('adminPricingHistory')}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditing(p)}>
                          <Pencil size={12} /> {t('catalogEdit')}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(p)}>
                          <Trash2 size={12} /> {t('catalogDelete')}
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <UpsertProviderModal
          open={creating || editing !== null}
          existing={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={(saved, mode) => {
            setProviders((prev) =>
              mode === 'create' ? [saved, ...prev] : prev.map((p) => (p.id === saved.id ? saved : p)),
            );
            setCreating(false);
            setEditing(null);
            show('success', t('actionCompletedAndLogged'));
          }}
        />

        <Modal
          open={deleting !== null}
          onClose={() => setDeleting(null)}
          title={t('adminPricingDeleteConfirmTitle')}
        >
          <div className="flex flex-col gap-4">
            {deleting && (
              <div
                className="p-3 rounded-lg text-[12px]"
                style={{ background: 'var(--eco-surface)', color: 'var(--eco-text)' }}
              >
                {deleting.platform} · {deleting.planName}
              </div>
            )}
            <Button
              variant="destructive"
              loading={deleteSubmitting}
              onClick={() => void confirmDelete()}
            >
              {t('catalogDelete')}
            </Button>
          </div>
        </Modal>

        <HistoryDrawer
          provider={historyOf}
          onClose={() => setHistoryOf(null)}
          language={language}
        />
      </div>
    </AdminLayout>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className="px-4 py-3 text-[12px]"
      style={{
        color: 'var(--eco-text-tertiary)',
        background: 'var(--eco-surface)',
        textAlign: align ?? 'left',
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <td
      className="px-4 py-3 align-top"
      style={{ color: 'var(--eco-text)', textAlign: align ?? 'left' }}
    >
      {children}
    </td>
  );
}

function RecentChangesBlock({
  changes,
  language,
  ackingId,
  onAck,
}: {
  changes: PricingChangeDto[];
  language: Language;
  ackingId: string | null;
  onAck: (change: PricingChangeDto) => void | Promise<void>;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(true);

  if (changes.length === 0) return null;

  return (
    <Card className="mb-4 flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-2 cursor-pointer text-left"
        style={{ background: 'transparent', border: 'none', padding: 0 }}
      >
        <div className="flex items-center gap-2">
          <BellRing size={14} style={{ color: 'var(--eco-warning-500)' }} />
          <span className="text-[14px]" style={{ color: 'var(--eco-text)' }}>
            {t('adminPricingRecentChanges')} · {changes.length}
          </span>
        </div>
        {open ? (
          <ChevronUp size={14} style={{ color: 'var(--eco-text-tertiary)' }} />
        ) : (
          <ChevronDown size={14} style={{ color: 'var(--eco-text-tertiary)' }} />
        )}
      </button>
      {open && (
        <div className="flex flex-col gap-2">
          {changes.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 flex-wrap p-3 rounded-lg"
              style={{ background: 'var(--eco-surface)' }}
            >
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--eco-text)' }}>
                  <ChangeArrow current={c.newPrice} previous={c.oldPrice} />
                  <span className="truncate">
                    {c.providerName} · {c.planName}
                  </span>
                </div>
                <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {formatPrice(c.oldPrice, c.currency, language)} →{' '}
                  {formatPrice(c.newPrice, c.currency, language)} ·{' '}
                  {formatDateTime(c.detectedAt, language)}
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                loading={ackingId === c.id}
                onClick={() => void onAck(c)}
              >
                <Check size={12} /> {t('adminPricingAcknowledge')}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function UpsertProviderModal({
  open,
  existing,
  onClose,
  onSaved,
}: {
  open: boolean;
  existing: PricingProviderDto | null;
  onClose: () => void;
  onSaved: (saved: PricingProviderDto, mode: 'create' | 'update') => void;
}) {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();

  const [platform, setPlatform] = useState('');
  const [name, setName] = useState('');
  const [planName, setPlanName] = useState('');
  const [url, setUrl] = useState('');
  const [extractionType, setExtractionType] = useState<PricingExtractionType>('AUTO');
  const [selector, setSelector] = useState('');
  const [regex, setRegex] = useState('');
  const [jsonPath, setJsonPath] = useState('');
  const [currency, setCurrency] = useState('KZT');
  const [interval, setInterval] = useState(60);
  const [active, setActive] = useState(true);
  const [requiresJs, setRequiresJs] = useState(false);
  const [manualPrice, setManualPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setPlatform(existing.platform);
      setName(existing.name);
      setPlanName(existing.planName);
      setUrl(existing.url);
      setExtractionType(
        EXTRACTION_TYPES.includes(existing.extractionType) ? existing.extractionType : 'AUTO',
      );
      setSelector(existing.extractionConfig?.selector ?? '');
      setRegex(existing.extractionConfig?.regex ?? '');
      setJsonPath(existing.extractionConfig?.jsonPath ?? '');
      setCurrency(existing.currency);
      setInterval(existing.checkIntervalMinutes);
      setActive(existing.active);
      setRequiresJs(existing.requiresJs);
      setManualPrice(existing.currentPrice != null ? String(existing.currentPrice) : '');
    } else {
      setPlatform('');
      setName('');
      setPlanName('');
      setUrl('');
      setExtractionType('AUTO');
      setSelector('');
      setRegex('');
      setJsonPath('');
      setCurrency('KZT');
      setInterval(60);
      setActive(true);
      setRequiresJs(false);
      setManualPrice('');
    }
    setError(null);
  }, [open, existing]);

  const showSelector = extractionType === 'CSS' || extractionType === 'META';
  const showRegex = extractionType === 'REGEX';
  const showJsonPath = extractionType === 'JSON_LD';
  const showManual = extractionType === 'MANUAL';

  const canSubmit =
    platform.trim().length > 0 &&
    planName.trim().length > 0 &&
    url.trim().length > 0 &&
    interval > 0;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const config =
      showSelector || showRegex || showJsonPath
        ? {
            selector: showSelector ? selector.trim() || null : null,
            regex: showRegex ? regex.trim() || null : null,
            jsonPath: showJsonPath ? jsonPath.trim() || null : null,
          }
        : null;

    const payload: UpsertPricingProviderPayload = {
      platform: platform.trim(),
      name: name.trim() || platform.trim(),
      planName: planName.trim(),
      url: url.trim(),
      extractionType,
      extractionConfig: config,
      currency,
      checkIntervalMinutes: interval,
      active,
      requiresJs,
      manualPrice: showManual && manualPrice.trim() ? Number(manualPrice) : null,
    };

    try {
      const saved = existing
        ? await authorizedRequest((token) =>
            adminUpdatePricingProvider(existing.id, payload, token),
          )
        : await authorizedRequest((token) => adminCreatePricingProvider(payload, token));
      onSaved(saved, existing ? 'update' : 'create');
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? t('adminPricingEditTitle') : t('adminPricingCreateTitle')}
    >
      <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
        <Input
          label={t('adminPricingUrl')}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/plan"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={t('adminPricingPlatform')}
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="Netflix"
          />
          <Input
            label={t('adminPricingName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Netflix RU"
          />
        </div>
        <Input
          label={t('adminPricingPlan')}
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="Premium"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label={t('adminPricingExtractionType')}
            value={extractionType}
            onChange={(e) => setExtractionType(e.target.value as PricingExtractionType)}
            options={EXTRACTION_TYPES.map((v) => ({
              value: v,
              label: extractionLabelText(v, language),
            }))}
          />
          <Select
            label={t('adminPricingCurrency')}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            options={CURRENCIES.map((v) => ({ value: v, label: v }))}
          />
        </div>
        {showSelector && (
          <Input
            label={t('adminPricingSelector')}
            value={selector}
            onChange={(e) => setSelector(e.target.value)}
            placeholder=".price, meta[itemprop=price]"
          />
        )}
        {showRegex && (
          <Input
            label={t('adminPricingRegex')}
            value={regex}
            onChange={(e) => setRegex(e.target.value)}
            placeholder="\\$([0-9]+\\.?[0-9]*)"
          />
        )}
        {showJsonPath && (
          <Input
            label={t('adminPricingJsonPath')}
            value={jsonPath}
            onChange={(e) => setJsonPath(e.target.value)}
            placeholder="$.offers.price"
          />
        )}
        {showManual && (
          <Input
            label={t('adminPricingManualPrice')}
            type="number"
            inputMode="decimal"
            value={manualPrice}
            onChange={(e) => setManualPrice(e.target.value)}
            placeholder="4990"
          />
        )}
        <Input
          label={t('adminPricingInterval')}
          type="number"
          inputMode="numeric"
          min={1}
          value={interval}
          onChange={(e) => setInterval(Math.max(1, Number(e.target.value) || 0))}
        />
        <div className="flex flex-col gap-2">
          <label
            className="flex items-center gap-2 text-[13px] cursor-pointer"
            style={{ color: 'var(--eco-text)' }}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            {t('adminPricingActive')}
          </label>
          <label
            className="flex items-center gap-2 text-[13px] cursor-pointer"
            style={{ color: 'var(--eco-text)' }}
          >
            <input
              type="checkbox"
              checked={requiresJs}
              onChange={(e) => setRequiresJs(e.target.checked)}
            />
            {t('adminPricingRequiresJs')}
          </label>
        </div>
        {error && (
          <div className="text-[13px]" style={{ color: 'var(--eco-negative)' }}>
            {error}
          </div>
        )}
        <Button
          variant="primary"
          loading={submitting}
          disabled={!canSubmit}
          onClick={() => void submit()}
        >
          {existing ? t('serviceReviewSave') : t('adminPricingCreate')}
        </Button>
      </div>
    </Modal>
  );
}

function HistoryDrawer({
  provider,
  onClose,
  language,
}: {
  provider: PricingProviderDto | null;
  onClose: () => void;
  language: Language;
}) {
  const { t } = useI18n();
  const { authorizedRequest } = useAuth();
  const [snapshots, setSnapshots] = useState<PricingSnapshotDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!provider) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const data = await authorizedRequest((token) =>
          adminGetPricingHistory(provider.id, token),
        );
        if (!cancelled) setSnapshots(data);
      } catch (err) {
        if (!cancelled) setError(formatAdminApiError(err, t));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [provider, authorizedRequest, t]);

  const priceSeries = useMemo(
    () =>
      snapshots
        .filter((s) => s.price != null)
        .map((s) => s.price as number)
        .reverse(),
    [snapshots],
  );

  return (
    <Drawer
      open={provider !== null}
      onClose={onClose}
      title={provider ? `${provider.platform} · ${provider.planName}` : ''}
    >
      {loading && (
        <div className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          {t('loading')}
        </div>
      )}
      {error && !loading && (
        <div className="text-[13px]" style={{ color: 'var(--eco-negative)' }}>
          {error}
        </div>
      )}
      {!loading && !error && provider && (
        <div className="flex flex-col gap-3">
          {priceSeries.length >= 2 && (
            <Sparkline points={priceSeries} />
          )}
          {snapshots.length === 0 ? (
            <div className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {t('adminPricingHistoryEmpty')}
            </div>
          ) : (
            snapshots.map((s) => (
              <div
                key={s.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg"
                style={{ background: 'var(--eco-surface)' }}
              >
                <div className="flex flex-col min-w-0">
                  <div className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                    {formatPrice(s.price, s.currency, language)}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {formatDateTime(s.capturedAt, language)}
                  </div>
                  {s.errorMessage && (
                    <div
                      className="text-[11px] mt-0.5"
                      style={{ color: 'var(--eco-text-tertiary)' }}
                    >
                      {s.errorMessage}
                    </div>
                  )}
                </div>
                <Badge variant={outcomeVariant(s.outcome)}>
                  {outcomeLabelText(s.outcome, language)}
                </Badge>
              </div>
            ))
          )}
        </div>
      )}
    </Drawer>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const W = 260;
  const H = 60;
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = W / (points.length - 1);
  const path = points
    .map((v, i) => {
      const x = i * step;
      const y = H - ((v - min) / range) * H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <div
      className="p-3 rounded-lg"
      style={{ background: 'var(--eco-surface)' }}
      aria-hidden
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        <path
          d={path}
          fill="none"
          stroke="var(--eco-primary)"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
