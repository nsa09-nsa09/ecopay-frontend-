import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from './admin-layout';
import { useI18n, type Language } from '../i18n-provider';
import { formatDateTime } from '../../lib/datetime';
import { useAuth } from '../auth/auth-provider';
import { Button, Card, Input, Tabs } from '../ds-primitives';
import { FlashBanner, formatAdminApiError, useFlash } from './admin-action-ui';
import { RefreshCw, Save } from 'lucide-react';
import {
  adminGetSiteAbout,
  adminUpdateSiteAbout,
  type SiteAboutContent,
  type UpdateSiteAboutPayload,
} from '../../lib/api';

// Length budgets shown to admins and enforced softly via maxLength on the
// inputs. Mirror the rough ranges used by the public page so very long
// pasted text doesn't blow up the layout.
const TITLE_MAX = 120;
const MISSION_MAX = 600;
const DESCRIPTION_MAX = 2000;

// Editable languages (matches i18n).
const ABOUT_LANGS: readonly Language[] = ['kz', 'ru', 'en'] as const;
type AboutLang = (typeof ABOUT_LANGS)[number];

type LangFields = { title: string; mission: string; description: string };
type LangBag = Record<AboutLang, LangFields>;

interface FormState {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  apexLink: string;
  langs: LangBag;
}

const EMPTY_LANGS: LangBag = {
  kz: { title: '', mission: '', description: '' },
  ru: { title: '', mission: '', description: '' },
  en: { title: '', mission: '', description: '' },
};

const EMPTY: FormState = {
  companyName: '',
  contactEmail: '',
  contactPhone: '',
  apexLink: '',
  langs: EMPTY_LANGS,
};

function toForm(content: SiteAboutContent): FormState {
  // Backend keeps the legacy single-language fields populated for backward
  // compatibility. We treat them as the seed for the Russian tab when the
  // per-language *_ru variant is empty.
  const ru: LangFields = {
    title: content.title_ru?.trim() || content.title || '',
    mission: content.mission_ru?.trim() || content.mission || '',
    description: content.description_ru?.trim() || content.description || '',
  };
  return {
    companyName: content.companyName ?? '',
    contactEmail: content.contactEmail ?? '',
    contactPhone: content.contactPhone ?? '',
    apexLink: content.apexLink ?? '',
    langs: {
      kz: {
        title: content.title_kz ?? '',
        mission: content.mission_kz ?? '',
        description: content.description_kz ?? '',
      },
      ru,
      en: {
        title: content.title_en ?? '',
        mission: content.mission_en ?? '',
        description: content.description_en ?? '',
      },
    },
  };
}

function buildPayload(form: FormState): UpdateSiteAboutPayload {
  const ruTitle = form.langs.ru.title.trim();
  const ruMission = form.langs.ru.mission.trim();
  const ruDescription = form.langs.ru.description.trim();
  return {
    companyName: form.companyName.trim(),
    // Keep legacy fields populated with the Russian variant so older
    // clients that only read `title`/`mission`/`description` still work.
    title: ruTitle,
    mission: ruMission || null,
    description: ruDescription || null,
    title_ru: ruTitle || null,
    mission_ru: ruMission || null,
    description_ru: ruDescription || null,
    title_kz: form.langs.kz.title.trim() || null,
    mission_kz: form.langs.kz.mission.trim() || null,
    description_kz: form.langs.kz.description.trim() || null,
    title_en: form.langs.en.title.trim() || null,
    mission_en: form.langs.en.mission.trim() || null,
    description_en: form.langs.en.description.trim() || null,
    contactEmail: form.contactEmail.trim() || null,
    contactPhone: form.contactPhone.trim() || null,
    apexLink: form.apexLink.trim() || null,
  };
}

export function AdminAboutPage() {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const { flash, show } = useFlash();
  const [activeLang, setActiveLang] = useState<AboutLang>('ru');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authorizedRequest((token) => adminGetSiteAbout(token));
      setForm(toForm(data));
      setUpdatedAt(data.updatedAt);
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await authorizedRequest((token) =>
        adminUpdateSiteAbout(buildPayload(form), token),
      );
      setForm(toForm(updated));
      setUpdatedAt(updated.updatedAt);
      show('success', t('actionCompletedAndLogged'));
    } catch (err) {
      show('error', formatAdminApiError(err, t));
    } finally {
      setSaving(false);
    }
  };

  const setCompanyName = (value: string) => setForm((prev) => ({ ...prev, companyName: value }));
  const setContactEmail = (value: string) => setForm((prev) => ({ ...prev, contactEmail: value }));
  const setContactPhone = (value: string) => setForm((prev) => ({ ...prev, contactPhone: value }));
  const setApexLink = (value: string) => setForm((prev) => ({ ...prev, apexLink: value }));

  const setLangField = (lang: AboutLang, field: keyof LangFields, value: string) => {
    setForm((prev) => ({
      ...prev,
      langs: {
        ...prev.langs,
        [lang]: { ...prev.langs[lang], [field]: value },
      },
    }));
  };

  const langTabs = useMemo(
    () => [
      { id: 'kz', label: t('adminAboutLangKz') },
      { id: 'ru', label: t('adminAboutLangRu') },
      { id: 'en', label: t('adminAboutLangEn') },
    ],
    [t],
  );

  const canSave =
    form.companyName.trim().length > 0 && form.langs.ru.title.trim().length > 0 && !saving;

  const currentFields = form.langs[activeLang];

  return (
    <AdminLayout>
      <div className="max-w-[860px]">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h1 className="text-[24px]" style={{ color: 'var(--eco-text)' }}>
            {t('adminAboutTitle')}
          </h1>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void load()}
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

        {loading ? (
          <Card>
            <span className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {t('loading')}
            </span>
          </Card>
        ) : (
          <Card>
            <div className="flex flex-col gap-4">
              <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
                {t('adminAboutHint')}
              </p>

              <FormRow label={t('adminAboutCompanyName')}>
                <Input value={form.companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </FormRow>

              <div className="flex flex-col gap-2">
                <Tabs
                  tabs={langTabs}
                  active={activeLang}
                  onChange={(id) => setActiveLang(id as AboutLang)}
                />
                <p className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {t('adminAboutLangHint')}
                </p>
              </div>

              <FormRow label={t('adminAboutPageTitle')}>
                <Input
                  value={currentFields.title}
                  onChange={(e) =>
                    setLangField(activeLang, 'title', e.target.value.slice(0, TITLE_MAX))
                  }
                  maxLength={TITLE_MAX}
                  hint={`${currentFields.title.length} / ${TITLE_MAX}`}
                />
              </FormRow>

              <FormRow label={t('adminAboutMission')}>
                <textarea
                  value={currentFields.mission}
                  onChange={(e) =>
                    setLangField(activeLang, 'mission', e.target.value.slice(0, MISSION_MAX))
                  }
                  rows={4}
                  maxLength={MISSION_MAX}
                  className="w-full px-3 py-2 rounded-lg text-[14px]"
                  style={{
                    background: 'var(--eco-bg)',
                    color: 'var(--eco-text)',
                    border: '1px solid var(--eco-border)',
                    resize: 'vertical',
                  }}
                />
                <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {currentFields.mission.length} / {MISSION_MAX}
                </span>
              </FormRow>

              <FormRow label={t('adminAboutDescription')}>
                <textarea
                  value={currentFields.description}
                  onChange={(e) =>
                    setLangField(
                      activeLang,
                      'description',
                      e.target.value.slice(0, DESCRIPTION_MAX),
                    )
                  }
                  rows={6}
                  maxLength={DESCRIPTION_MAX}
                  className="w-full px-3 py-2 rounded-lg text-[14px]"
                  style={{
                    background: 'var(--eco-bg)',
                    color: 'var(--eco-text)',
                    border: '1px solid var(--eco-border)',
                    resize: 'vertical',
                  }}
                />
                <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {currentFields.description.length} / {DESCRIPTION_MAX}
                </span>
              </FormRow>

              <FormRow label={t('adminAboutContactEmail')}>
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="support@ecopay.kz"
                />
              </FormRow>

              <FormRow label={t('adminAboutContactPhone')}>
                <Input
                  value={form.contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+7 ..."
                />
              </FormRow>

              <FormRow label={t('adminAboutApexLink')}>
                <Input
                  value={form.apexLink}
                  onChange={(e) => setApexLink(e.target.value)}
                  placeholder="https://apex-digital.kz"
                />
              </FormRow>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {updatedAt
                    ? `${t('adminAboutLastUpdated')}: ${formatDateTime(updatedAt, language)}`
                    : ''}
                </span>
                <Button
                  variant="primary"
                  onClick={() => void handleSave()}
                  disabled={!canSave}
                  loading={saving}
                >
                  <Save size={13} /> {t('save')}
                </Button>
              </div>
            </div>
          </Card>
        )}
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
