import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from './admin-layout';
import { useI18n, type Language } from '../i18n-provider';
import { formatDateTime } from '../../lib/datetime';
import { useAuth } from '../auth/auth-provider';
import { Button, Card, Input, Tabs } from '../ds-primitives';
import { FlashBanner, formatAdminApiError, useFlash } from './admin-action-ui';
import { RefreshCw, Save } from 'lucide-react';
import {
  adminGetLegalDocument,
  adminUpdateLegalDocument,
  type LegalDocType,
  type LegalDocumentDto,
  type UpdateLegalDocumentPayload,
} from '../../lib/api';

const TITLE_MAX = 300;
const BODY_MAX = 200_000;

const LEGAL_LANGS: readonly Language[] = ['kz', 'ru', 'en'] as const;
type LegalLang = (typeof LEGAL_LANGS)[number];

type LangFields = { title: string; body: string };
type LangBag = Record<LegalLang, LangFields>;

const EMPTY_LANGS: LangBag = {
  kz: { title: '', body: '' },
  ru: { title: '', body: '' },
  en: { title: '', body: '' },
};

function toForm(doc: LegalDocumentDto): LangBag {
  return {
    kz: { title: doc.title_kz ?? '', body: doc.body_kz ?? '' },
    ru: { title: doc.title_ru ?? '', body: doc.body_ru ?? '' },
    en: { title: doc.title_en ?? '', body: doc.body_en ?? '' },
  };
}

function buildPayload(form: LangBag): UpdateLegalDocumentPayload {
  return {
    title_kz: form.kz.title.trim() || null,
    title_ru: form.ru.title.trim() || null,
    title_en: form.en.title.trim() || null,
    body_kz: form.kz.body || null,
    body_ru: form.ru.body || null,
    body_en: form.en.body || null,
  };
}

const DOC_TYPES: readonly LegalDocType[] = ['terms', 'privacy'] as const;

export function AdminLegalPage() {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();
  const [docType, setDocType] = useState<LegalDocType>('terms');
  const [form, setForm] = useState<LangBag>(EMPTY_LANGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [activeLang, setActiveLang] = useState<LegalLang>('ru');
  const { flash, show } = useFlash();

  const load = useCallback(
    async (which: LegalDocType) => {
      setLoading(true);
      setError(null);
      try {
        const data = await authorizedRequest((token) => adminGetLegalDocument(which, token));
        setForm(toForm(data));
        setUpdatedAt(data.updatedAt);
        setVersion(data.version);
      } catch (err) {
        setError(formatAdminApiError(err, t));
      } finally {
        setLoading(false);
      }
    },
    [authorizedRequest, t],
  );

  useEffect(() => {
    void load(docType);
  }, [load, docType]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await authorizedRequest((token) =>
        adminUpdateLegalDocument(docType, buildPayload(form), token),
      );
      setForm(toForm(updated));
      setUpdatedAt(updated.updatedAt);
      setVersion(updated.version);
      show('success', t('actionCompletedAndLogged'));
    } catch (err) {
      show('error', formatAdminApiError(err, t));
    } finally {
      setSaving(false);
    }
  };

  const setLangField = (lang: LegalLang, field: keyof LangFields, value: string) => {
    setForm((prev) => ({
      ...prev,
      [lang]: { ...prev[lang], [field]: value },
    }));
  };

  const docTabs = useMemo(
    () => [
      { id: 'terms', label: t('adminLegalDocTerms') },
      { id: 'privacy', label: t('adminLegalDocPrivacy') },
    ],
    [t],
  );

  const langTabs = useMemo(
    () => [
      { id: 'kz', label: t('adminAboutLangKz') },
      { id: 'ru', label: t('adminAboutLangRu') },
      { id: 'en', label: t('adminAboutLangEn') },
    ],
    [t],
  );

  const currentFields = form[activeLang];

  return (
    <AdminLayout>
      <div className="max-w-[860px]">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h1 className="text-[24px]" style={{ color: 'var(--eco-text)' }}>
            {t('adminLegalTitle')}
          </h1>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void load(docType)}
            disabled={loading || saving}
          >
            <RefreshCw size={13} /> {t('retry')}
          </Button>
        </div>

        <FlashBanner flash={flash} />

        {error && (
          <Card>
            <span className="text-[13px]" style={{ color: 'var(--eco-negative)' }}>
              {error}
            </span>
          </Card>
        )}

        <Card>
          <div className="flex flex-col gap-4">
            <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
              {t('adminLegalHint')}
            </p>

            <Tabs
              tabs={docTabs}
              active={docType}
              onChange={(id) => setDocType(id as LegalDocType)}
            />

            {loading ? (
              <span className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {t('loading')}
              </span>
            ) : (
              <>
                <Tabs
                  tabs={langTabs}
                  active={activeLang}
                  onChange={(id) => setActiveLang(id as LegalLang)}
                />

                <FormRow label={t('adminLegalDocTitle')}>
                  <Input
                    value={currentFields.title}
                    onChange={(e) =>
                      setLangField(activeLang, 'title', e.target.value.slice(0, TITLE_MAX))
                    }
                    maxLength={TITLE_MAX}
                    hint={`${currentFields.title.length} / ${TITLE_MAX}`}
                  />
                </FormRow>

                <FormRow label={t('adminLegalBody')}>
                  <textarea
                    value={currentFields.body}
                    onChange={(e) =>
                      setLangField(activeLang, 'body', e.target.value.slice(0, BODY_MAX))
                    }
                    rows={18}
                    maxLength={BODY_MAX}
                    className="w-full px-3 py-2 rounded-lg text-[13px] leading-relaxed font-mono"
                    style={{
                      background: 'var(--eco-bg)',
                      color: 'var(--eco-text)',
                      border: '1px solid var(--eco-border)',
                      resize: 'vertical',
                    }}
                  />
                  <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {currentFields.body.length} / {BODY_MAX}
                  </span>
                </FormRow>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                  <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {updatedAt
                      ? `${t('adminLegalLastUpdated')}: ${formatDateTime(updatedAt, language)}${version != null ? ` · v${version}` : ''}`
                      : ''}
                  </span>
                  <Button
                    variant="primary"
                    onClick={() => void handleSave()}
                    disabled={saving}
                    loading={saving}
                  >
                    <Save size={13} /> {t('save')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
        {label}
      </span>
      {children}
    </label>
  );
}
