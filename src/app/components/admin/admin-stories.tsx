import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminLayout } from './admin-layout';
import { useI18n, type Language } from '../i18n-provider';
import { formatDateTime } from '../../lib/datetime';
import { useAuth } from '../auth/auth-provider';
import { Button, Input, Modal, Select, Tabs } from '../ds-primitives';
import { FlashBanner, formatAdminApiError, useFlash } from './admin-action-ui';
import { LogoCropModal } from './logo-crop-modal';
import { Image as ImageIcon, Pencil, Plus, Save, Sparkles, Trash2, Upload, X } from 'lucide-react';
import {
  adminCreateStory,
  adminDeleteStory,
  adminDeleteStoryImage,
  adminDeleteStoryLocalizedImage,
  adminListStories,
  adminUpdateStory,
  adminUploadStoryImage,
  adminUploadStoryLocalizedImage,
  clearStoriesCache,
  type AdminStoryDto,
  type StoryStatus,
  type UpsertStoryPayload,
} from '../../lib/api';
import {
  AdminCard,
  AdminConfirm,
  AdminDataTable,
  AdminEmptyState,
  AdminErrorState,
  AdminPage,
  AdminPageHeader,
  AdminRefreshButton,
  AdminStatusBadge,
  type AdminColumn,
  type AdminStatusTone,
} from './admin-ui';

const STORY_STATUS: Record<StoryStatus, { tone: AdminStatusTone; key: string }> = {
  PUBLISHED: { tone: 'success', key: 'adminNewsStatusPublished' },
  DRAFT: { tone: 'info', key: 'adminNewsStatusDraft' },
  ARCHIVED: { tone: 'default', key: 'adminNewsStatusArchived' },
};

const STORY_LANGS: readonly Language[] = ['kz', 'ru', 'en'] as const;
type StoryLang = (typeof STORY_LANGS)[number];

const TITLE_MAX = 120;
const HEADING_MAX = 180;
const BODY_MAX = 700;
const CTA_MAX = 80;
const URL_MAX = 500;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const DEFAULT_GRADIENT = 'linear-gradient(160deg, #FF8C42 0%, #F0741F 55%, #C55A12 100%)';
const STORY_IMAGE_OUTPUT_SIZE = { width: 900, height: 1600 };


type LangFields = { title: string; heading: string; body: string; ctaLabel: string };
type LangBag = Record<StoryLang, LangFields>;
type ImageMode = 'shared' | 'localized';

interface FormState {
  langs: LangBag;
  ctaUrl: string;
  emoji: string;
  gradient: string;
  status: StoryStatus;
  sortOrder: number;
}

const EMPTY_LANGS: LangBag = {
  kz: { title: '', heading: '', body: '', ctaLabel: '' },
  ru: { title: '', heading: '', body: '', ctaLabel: '' },
  en: { title: '', heading: '', body: '', ctaLabel: '' },
};

const EMPTY_FORM: FormState = {
  langs: EMPTY_LANGS,
  ctaUrl: '',
  emoji: '',
  gradient: DEFAULT_GRADIENT,
  status: 'DRAFT',
  sortOrder: 0,
};

function toForm(item: AdminStoryDto): FormState {
  return {
    langs: {
      kz: {
        title: item.titleKz ?? '',
        heading: item.headingKz ?? '',
        body: item.bodyKz ?? '',
        ctaLabel: item.ctaLabelKz ?? '',
      },
      ru: {
        title: item.titleRu ?? '',
        heading: item.headingRu ?? '',
        body: item.bodyRu ?? '',
        ctaLabel: item.ctaLabelRu ?? '',
      },
      en: {
        title: item.titleEn ?? '',
        heading: item.headingEn ?? '',
        body: item.bodyEn ?? '',
        ctaLabel: item.ctaLabelEn ?? '',
      },
    },
    ctaUrl: item.ctaUrl ?? '',
    emoji: item.emoji ?? '',
    gradient: item.gradient ?? DEFAULT_GRADIENT,
    status: item.status,
    sortOrder: item.sortOrder ?? 0,
  };
}

function buildPayload(form: FormState): UpsertStoryPayload {
  const trim = (v: string) => (v.trim().length > 0 ? v.trim() : null);
  return {
    titleKz: trim(form.langs.kz.title),
    titleRu: trim(form.langs.ru.title),
    titleEn: trim(form.langs.en.title),
    headingKz: trim(form.langs.kz.heading),
    headingRu: trim(form.langs.ru.heading),
    headingEn: trim(form.langs.en.heading),
    bodyKz: trim(form.langs.kz.body),
    bodyRu: trim(form.langs.ru.body),
    bodyEn: trim(form.langs.en.body),
    ctaLabelKz: trim(form.langs.kz.ctaLabel),
    ctaLabelRu: trim(form.langs.ru.ctaLabel),
    ctaLabelEn: trim(form.langs.en.ctaLabel),
    ctaUrl: trim(form.ctaUrl),
    emoji: trim(form.emoji),
    gradient: trim(form.gradient),
    status: form.status,
    sortOrder: form.sortOrder,
  };
}

function pickLocalized(item: AdminStoryDto, language: Language) {
  const suffix = language === 'kz' ? 'Kz' : language === 'en' ? 'En' : 'Ru';
  const title =
    (item[`title${suffix}` as keyof AdminStoryDto] as string | null | undefined) ||
    item.titleRu ||
    item.titleEn ||
    item.titleKz ||
    '';
  const heading =
    (item[`heading${suffix}` as keyof AdminStoryDto] as string | null | undefined) ||
    item.headingRu ||
    item.headingEn ||
    item.headingKz ||
    title;
  return { title, heading };
}

export function AdminStoriesPage() {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();
  const { flash, show } = useFlash();

  const [items, setItems] = useState<AdminStoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminStoryDto | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [activeLang, setActiveLang] = useState<StoryLang>('ru');
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminStoryDto | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<ImageMode>('shared');
  const [pendingLocalizedFiles, setPendingLocalizedFiles] = useState<Partial<Record<StoryLang, File>>>({});
  const [pendingLocalizedPreviews, setPendingLocalizedPreviews] = useState<Partial<Record<StoryLang, string>>>({});
  const localizedPreviewRef = useRef<Partial<Record<StoryLang, string>>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);

  useEffect(() => {
    if (!pendingImagePreview) return;
    return () => URL.revokeObjectURL(pendingImagePreview);
  }, [pendingImagePreview]);
  useEffect(() => { localizedPreviewRef.current = pendingLocalizedPreviews; }, [pendingLocalizedPreviews]);
  useEffect(() => () => Object.values(localizedPreviewRef.current).forEach((url) => URL.revokeObjectURL(url)), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authorizedRequest((token) => adminListStories(token));
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetPendingImage = () => {
    Object.values(pendingLocalizedPreviews).forEach((url) => URL.revokeObjectURL(url));
    setPendingImageFile(null);
    setCropFile(null);
    setPendingImagePreview(null);
    setPendingLocalizedFiles({});
    setPendingLocalizedPreviews({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setActiveLang('ru');
    setEditorError(null);
    setImageMode('shared');
    resetPendingImage();
    setEditorOpen(true);
  };

  const openEdit = (item: AdminStoryDto) => {
    setEditing(item);
    setForm(toForm(item));
    setActiveLang('ru');
    setEditorError(null);
    setImageMode(item.imageUrlKz || item.imageUrlRu || item.imageUrlEn ? 'localized' : 'shared');
    resetPendingImage();
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;
    setEditorOpen(false);
    setEditing(null);
    setEditorError(null);
    resetPendingImage();
  };

  const validateImageFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return t('adminStoriesImageInvalidType');
    if (file.size > IMAGE_MAX_BYTES) return t('adminStoriesImageTooBig');
    return null;
  };

  const handlePickFile = (file: File) => {
    const error = validateImageFile(file);
    if (error) {
      setEditorError(error);
      return;
    }
    setEditorError(null);
    setCropFile(file);
  };

  const handleImageCropped = (cropped: File) => {
    setCropFile(null);
    if (imageMode === 'shared') {
      if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
      setPendingImageFile(cropped);
      setPendingImagePreview(URL.createObjectURL(cropped));
    } else {
      const old = pendingLocalizedPreviews[activeLang];
      if (old) URL.revokeObjectURL(old);
      setPendingLocalizedFiles((prev) => ({ ...prev, [activeLang]: cropped }));
      setPendingLocalizedPreviews((prev) => ({ ...prev, [activeLang]: URL.createObjectURL(cropped) }));
    }
  };

  const clearPendingLocalizedImage = (locale: StoryLang) => {
    const preview = pendingLocalizedPreviews[locale];
    if (preview) URL.revokeObjectURL(preview);
    setPendingLocalizedFiles((prev) => ({ ...prev, [locale]: undefined }));
    setPendingLocalizedPreviews((prev) => ({ ...prev, [locale]: undefined }));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setEditorError(null);
    try {
      const payload = buildPayload(form);
      const editingId = editing?.id;
      let saved =
        editingId != null
          ? await authorizedRequest((token) => adminUpdateStory(editingId, payload, token))
          : await authorizedRequest((token) => adminCreateStory(payload, token));

      if (imageMode === 'shared' && pendingImageFile) {
        saved = await authorizedRequest((token) =>
          adminUploadStoryImage(saved.id, pendingImageFile, token),
        );
      }
      if (imageMode === 'shared') {
        for (const locale of STORY_LANGS) {
          saved = await authorizedRequest((token) => adminDeleteStoryLocalizedImage(saved.id, locale, token));
        }
      } else {
        for (const locale of STORY_LANGS) {
          const file = pendingLocalizedFiles[locale];
          if (file) saved = await authorizedRequest((token) => adminUploadStoryLocalizedImage(saved.id, locale, file, token));
        }
      }

      setItems((prev) => {
        const next = prev.filter((it) => it.id !== saved.id);
        next.push(saved);
        return next.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      });
      clearStoriesCache();
      show('success', t('adminStoriesSaveSuccess'));
      resetPendingImage();
      setEditorOpen(false);
      setEditing(null);
    } catch (err) {
      setEditorError(formatAdminApiError(err, t));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: AdminStoryDto) => {
    setDeletingId(item.id);
    try {
      await authorizedRequest((token) => adminDeleteStory(item.id, token));
      setItems((prev) => prev.filter((it) => it.id !== item.id));
      clearStoriesCache();
      show('success', t('adminStoriesDeleteSuccess'));
    } catch (err) {
      show('error', formatAdminApiError(err, t));
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const handleRemoveImage = async () => {
    if (!editing) return;
    setUploadingId(editing.id);
    try {
      const updated = await authorizedRequest((token) => imageMode === 'shared'
        ? adminDeleteStoryImage(editing.id, token)
        : adminDeleteStoryLocalizedImage(editing.id, activeLang, token));
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      setEditing(updated);
      clearStoriesCache();
    } catch (err) {
      setEditorError(formatAdminApiError(err, t));
    } finally {
      setUploadingId(null);
    }
  };

  const setLangField = (lang: StoryLang, field: keyof LangFields, value: string) => {
    setForm((prev) => ({
      ...prev,
      langs: { ...prev.langs, [lang]: { ...prev.langs[lang], [field]: value } },
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

  const statusOptions = useMemo(
    () => [
      { value: 'PUBLISHED', label: t('adminNewsStatusPublished') },
      { value: 'DRAFT', label: t('adminNewsStatusDraft') },
      { value: 'ARCHIVED', label: t('adminNewsStatusArchived') },
    ],
    [t],
  );

  const canSave = form.langs.ru.title.trim().length > 0 && !saving;
  const currentFields = form.langs[activeLang];

  const columns: AdminColumn<AdminStoryDto>[] = [
    {
      id: 'title',
      header: t('adminStoriesListColTitle'),
      priority: 'primary',
      minWidth: 260,
      cell: (it) => {
        const { title, heading } = pickLocalized(it, language);
        return (
          <div className="flex items-center gap-2 min-w-0">
            {it.imageUrl ? (
              <img
                src={it.imageUrl}
                alt=""
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: it.gradient || DEFAULT_GRADIENT }}
              >
                {it.emoji ? (
                  <span>{it.emoji}</span>
                ) : (
                  <ImageIcon size={14} style={{ color: 'var(--eco-text-on-primary)' }} />
                )}
              </div>
            )}
            <div className="min-w-0">
              <div className="break-words md:truncate md:max-w-[360px]">
                {title || `#${it.id}`}
              </div>
              <div
                className="text-[12px] break-words md:truncate md:max-w-[360px]"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                {heading}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: t('adminNewsListColStatus'),
      priority: 'primary',
      nowrap: true,
      cell: (it) => (
        <AdminStatusBadge tone={STORY_STATUS[it.status].tone}>
          {t(STORY_STATUS[it.status].key)}
        </AdminStatusBadge>
      ),
    },
    {
      id: 'sort',
      header: t('adminNewsListColSort'),
      numeric: true,
      cell: (it) => it.sortOrder ?? 0,
    },
    {
      id: 'updated',
      header: t('adminNewsListColUpdated'),
      priority: 'secondary',
      nowrap: true,
      cell: (it) => (
        <span className="tabular-nums" style={{ color: 'var(--eco-text-secondary)' }}>
          {formatDateTime(it.updatedAt, language)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: <span className="sr-only">{t('colActions')}</span>,
      label: t('colActions'),
      priority: 'actions',
      align: 'right',
      nowrap: true,
      cell: (it) => (
        <div className="inline-flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(it)}>
            <Pencil size={13} /> {t('adminNewsEdit')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(it)}
            disabled={deletingId === it.id}
            aria-label={t('adminNewsDelete')}
            title={t('adminNewsDelete')}
          >
            <Trash2 size={13} style={{ color: 'var(--eco-negative)' }} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <AdminPage width="wide">
        <AdminPageHeader
          title={t('adminStoriesTitle')}
          subtitle={t('adminStoriesHint')}
          actions={
            <>
              <AdminRefreshButton onClick={() => void load()} loading={loading} />
              <Button variant="primary" size="sm" onClick={openCreate}>
                <Plus size={13} /> {t('adminStoriesCreate')}
              </Button>
            </>
          }
        />

        <FlashBanner flash={flash} />

        <section className="flex flex-col gap-3 min-w-0">
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--eco-text)' }}>
            {t('adminStoriesListTitle')}
          </h2>
          {error && !loading && items.length > 0 && (
            <AdminErrorState inline message={error} onRetry={() => void load()} />
          )}
          <AdminDataTable
            columns={columns}
            rows={items}
            rowKey={(it) => it.id}
            loading={loading}
            error={error}
            onRetry={() => void load()}
            skeletonRows={4}
            minWidth={760}
            empty={
              <AdminCard>
                <AdminEmptyState
                  icon={Sparkles}
                  title={t('adminStoriesEmpty')}
                  action={
                    <Button variant="primary" size="sm" onClick={openCreate}>
                      <Plus size={13} /> {t('adminStoriesCreate')}
                    </Button>
                  }
                />
              </AdminCard>
            }
          />
        </section>
      </AdminPage>

      <Modal
        open={editorOpen}
        onClose={closeEditor}
        title={editing ? t('adminStoriesFormEdit') : t('adminStoriesFormCreate')}
      >
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
          <Tabs
            tabs={langTabs}
            active={activeLang}
            onChange={(id) => setActiveLang(id as StoryLang)}
          />

          <FormRow label={t('adminStoriesFieldTitle')}>
            <Input
              value={currentFields.title}
              onChange={(e) =>
                setLangField(activeLang, 'title', e.target.value.slice(0, TITLE_MAX))
              }
              maxLength={TITLE_MAX}
              hint={`${currentFields.title.length} / ${TITLE_MAX}`}
            />
          </FormRow>
          <FormRow label={t('adminStoriesFieldHeading')}>
            <Input
              value={currentFields.heading}
              onChange={(e) =>
                setLangField(activeLang, 'heading', e.target.value.slice(0, HEADING_MAX))
              }
              maxLength={HEADING_MAX}
              hint={`${currentFields.heading.length} / ${HEADING_MAX}`}
            />
          </FormRow>
          <FormRow label={t('adminStoriesFieldBody')}>
            <textarea
              value={currentFields.body}
              onChange={(e) => setLangField(activeLang, 'body', e.target.value.slice(0, BODY_MAX))}
              rows={4}
              maxLength={BODY_MAX}
              className="w-full px-3 py-2 rounded-lg text-[14px]"
              style={{
                background: 'var(--eco-bg)',
                color: 'var(--eco-text)',
                border: '1px solid var(--eco-border)',
                resize: 'vertical',
              }}
            />
            <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {currentFields.body.length} / {BODY_MAX}
            </span>
          </FormRow>
          <FormRow label={t('adminStoriesFieldCtaLabel')}>
            <Input
              value={currentFields.ctaLabel}
              onChange={(e) =>
                setLangField(activeLang, 'ctaLabel', e.target.value.slice(0, CTA_MAX))
              }
              maxLength={CTA_MAX}
            />
          </FormRow>
          <FormRow label={t('adminStoriesFieldCtaUrl')}>
            <Input
              value={form.ctaUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, ctaUrl: e.target.value.slice(0, URL_MAX) }))
              }
              maxLength={URL_MAX}
              placeholder="/catalog"
            />
          </FormRow>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormRow label={t('adminNewsFieldStatus')}>
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value as StoryStatus }))
                }
                options={statusOptions}
              />
            </FormRow>
            <FormRow label={t('adminNewsFieldSortOrder')}>
              <Input
                type="number"
                value={String(form.sortOrder)}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))
                }
              />
            </FormRow>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormRow label={t('adminStoriesFieldEmoji')}>
              <Input
                value={form.emoji}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, emoji: e.target.value.slice(0, 16) }))
                }
                placeholder="⭐"
              />
            </FormRow>
            <FormRow label={t('adminStoriesFieldGradient')}>
              <Input
                value={form.gradient}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, gradient: e.target.value.slice(0, 255) }))
                }
              />
            </FormRow>
          </div>

          <FormRow label={t('adminNewsFieldImage')}>
            {(() => {
              const localizedKey = activeLang === 'kz' ? 'imageUrlKz' : activeLang === 'en' ? 'imageUrlEn' : 'imageUrlRu';
              const previewUrl = imageMode === 'shared'
                ? pendingImagePreview || editing?.imageUrl || null
                : pendingLocalizedPreviews[activeLang] || editing?.[localizedKey] || null;
              const uploadingNow = editing ? uploadingId === editing.id : false;
              return (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2 text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
                    <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={imageMode === 'shared'} onChange={() => setImageMode('shared')} /> {t('adminImageModeShared')}</label>
                    <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={imageMode === 'localized'} onChange={() => setImageMode('localized')} /> {t('adminImageModeLocalized')}</label>
                  </div>
                <div className="flex items-center gap-3">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt=""
                      width={80}
                      height={142}
                      className="w-20 h-[142px] rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="w-20 h-[142px] rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: form.gradient || DEFAULT_GRADIENT }}
                    >
                      {form.emoji ? (
                        <span className="text-[28px]">{form.emoji}</span>
                      ) : (
                        <ImageIcon size={20} style={{ color: '#fff' }} />
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-2 flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_IMAGE_TYPES.join(',')}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        if (file) handlePickFile(file);
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={uploadingNow}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={13} />{' '}
                        {previewUrl ? t('adminNewsImageReplace') : t('adminNewsImageUpload')}
                      </Button>
                      {(imageMode === 'shared' ? pendingImageFile : pendingLocalizedFiles[activeLang]) && (
                        <Button variant="ghost" size="sm" onClick={() => imageMode === 'shared' ? resetPendingImage() : clearPendingLocalizedImage(activeLang)}>
                          <X size={13} /> {t('cancel')}
                        </Button>
                      )}
                      {Boolean(imageMode === 'shared' ? editing?.imageUrl : editing?.[localizedKey]) && !(imageMode === 'shared' ? pendingImageFile : pendingLocalizedFiles[activeLang]) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleRemoveImage()}
                          disabled={uploadingNow}
                        >
                          <X size={13} /> {t('adminNewsImageRemove')}
                        </Button>
                      )}
                    </div>
                    <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                      {imageMode === 'localized' ? t('adminImageForLang', { lang: langTabs.find((tab) => tab.id === activeLang)?.label ?? '' }) : t('adminStoriesImageHint')}
                    </span>
                  </div>
                </div>
                </div>
              );
            })()}
          </FormRow>

          {editorError && (
            <div className="text-[13px]" style={{ color: 'var(--eco-negative)' }}>
              {editorError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={closeEditor} disabled={saving}>
              {t('cancel')}
            </Button>
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
      </Modal>

      <LogoCropModal
        open={!!cropFile}
        file={cropFile}
        title={t('adminCropImage')}
        description={t('adminDragAndZoomSoTheImage')}
        aspectRatio="9 / 16"
        maxFrameWidth={230}
        outputSize={STORY_IMAGE_OUTPUT_SIZE}
        onCancel={() => setCropFile(null)}
        onApply={handleImageCropped}
      />

      <AdminConfirm
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={t('adminStoriesDeleteConfirm')}
        confirmLabel={t('adminNewsDelete')}
        loading={confirmDelete !== null && deletingId === confirmDelete.id}
        onConfirm={() => (confirmDelete ? handleDelete(confirmDelete) : undefined)}
      >
        {confirmDelete && (
          <p className="text-[13px] break-words" style={{ color: 'var(--eco-text-secondary)' }}>
            {pickLocalized(confirmDelete, language).title || `#${confirmDelete.id}`}
          </p>
        )}
      </AdminConfirm>
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

