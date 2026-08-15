import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminLayout } from './admin-layout';
import { useI18n, type Language } from '../i18n-provider';
import { formatDateTime } from '../../lib/datetime';
import { useAuth } from '../auth/auth-provider';
import { Badge, Button, Card, Input, Modal, Select, Skeleton, Tabs } from '../ds-primitives';
import { FlashBanner, formatAdminApiError, useFlash } from './admin-action-ui';
import { LogoCropModal } from './logo-crop-modal';
import { Image as ImageIcon, Pencil, Plus, RefreshCw, Save, Trash2, Upload, X } from 'lucide-react';
import {
  adminCreateStory,
  adminDeleteStory,
  adminDeleteStoryImage,
  adminListStories,
  adminUpdateStory,
  adminUploadStoryImage,
  clearStoriesCache,
  type AdminStoryDto,
  type StoryStatus,
  type UpsertStoryPayload,
} from '../../lib/api';

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

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

type LangFields = { title: string; heading: string; body: string; ctaLabel: string };
type LangBag = Record<StoryLang, LangFields>;

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);

  useEffect(() => {
    if (!pendingImagePreview) return;
    return () => URL.revokeObjectURL(pendingImagePreview);
  }, [pendingImagePreview]);

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
    setPendingImageFile(null);
    setCropFile(null);
    setPendingImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setActiveLang('ru');
    setEditorError(null);
    resetPendingImage();
    setEditorOpen(true);
  };

  const openEdit = (item: AdminStoryDto) => {
    setEditing(item);
    setForm(toForm(item));
    setActiveLang('ru');
    setEditorError(null);
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
    if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    setPendingImageFile(cropped);
    setPendingImagePreview(URL.createObjectURL(cropped));
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

      if (pendingImageFile) {
        saved = await authorizedRequest((token) =>
          adminUploadStoryImage(saved.id, pendingImageFile, token),
        );
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
      const updated = await authorizedRequest((token) => adminDeleteStoryImage(editing.id, token));
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

  return (
    <AdminLayout>
      <div className="max-w-[1200px]">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h1 className="text-[24px]" style={{ color: 'var(--eco-text)' }}>
            {t('adminStoriesTitle')}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw size={13} /> {t('retry')}
            </Button>
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus size={13} /> {t('adminStoriesCreate')}
            </Button>
          </div>
        </div>

        <FlashBanner flash={flash} />

        <Card className="mb-5">
          <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {t('adminStoriesHint')}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-[16px]" style={{ color: 'var(--eco-text)' }}>
              {t('adminStoriesListTitle')}
            </h2>
          </div>

          {error && (
            <div className="mb-3 text-[13px]" style={{ color: 'var(--eco-negative)' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col gap-2">
              <Skeleton height={48} />
              <Skeleton height={48} />
              <Skeleton height={48} />
            </div>
          ) : items.length === 0 ? (
            <div
              className="py-6 text-center text-[13px]"
              style={{ color: 'var(--eco-text-tertiary)' }}
            >
              {t('adminStoriesEmpty')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--eco-border)',
                      color: 'var(--eco-text-tertiary)',
                    }}
                  >
                    <th className="text-left py-2 pr-3">{t('adminStoriesListColTitle')}</th>
                    <th className="text-left py-2 pr-3">{t('adminNewsListColStatus')}</th>
                    <th className="text-left py-2 pr-3">{t('adminNewsListColSort')}</th>
                    <th className="text-left py-2 pr-3">{t('adminNewsListColUpdated')}</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const { title, heading } = pickLocalized(it, language);
                    return (
                      <tr key={it.id} style={{ borderBottom: '1px solid var(--eco-border)' }}>
                        <td className="py-2 pr-3" style={{ color: 'var(--eco-text)' }}>
                          <div className="flex items-center gap-2">
                            {it.imageUrl ? (
                              <img
                                src={it.imageUrl}
                                alt=""
                                width={36}
                                height={36}
                                className="rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: it.gradient || DEFAULT_GRADIENT }}
                              >
                                {it.emoji ? (
                                  <span>{it.emoji}</span>
                                ) : (
                                  <ImageIcon size={14} style={{ color: '#fff' }} />
                                )}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="truncate" style={{ maxWidth: 360 }}>
                                {title || `#${it.id}`}
                              </div>
                              <div
                                className="truncate text-[12px]"
                                style={{ maxWidth: 360, color: 'var(--eco-text-tertiary)' }}
                              >
                                {heading}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 pr-3">
                          <StatusBadge status={it.status} t={t} />
                        </td>
                        <td className="py-2 pr-3" style={{ color: 'var(--eco-text-secondary)' }}>
                          {it.sortOrder ?? 0}
                        </td>
                        <td className="py-2 pr-3" style={{ color: 'var(--eco-text-tertiary)' }}>
                          {formatDateTime(it.updatedAt, language)}
                        </td>
                        <td className="py-2 text-right whitespace-nowrap">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(it)}>
                            <Pencil size={13} /> {t('adminNewsEdit')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDelete(it)}
                            disabled={deletingId === it.id}
                          >
                            <Trash2 size={13} style={{ color: 'var(--eco-negative)' }} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

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
            <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
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
              const previewUrl = pendingImagePreview || editing?.imageUrl || null;
              const uploadingNow = editing ? uploadingId === editing.id : false;
              return (
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
                      {pendingImageFile && (
                        <Button variant="ghost" size="sm" onClick={resetPendingImage}>
                          <X size={13} /> {t('cancel')}
                        </Button>
                      )}
                      {editing?.imageUrl && !pendingImageFile && (
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
                    <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                      {t('adminStoriesImageHint')}
                    </span>
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
        title={tx(language, 'Кадрирование изображения', 'Суретті кадрлау', 'Crop image')}
        description={tx(
          language,
          'Перетащите и масштабируйте, чтобы изображение заполнило всю область.',
          'Сурет бүкіл аумақты толтыру үшін жылжытып, масштабтаңыз.',
          'Drag and zoom so the image fills the whole area.',
        )}
        aspectRatio="9 / 16"
        maxFrameWidth={230}
        outputSize={STORY_IMAGE_OUTPUT_SIZE}
        onCancel={() => setCropFile(null)}
        onApply={handleImageCropped}
      />

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={t('adminStoriesDeleteConfirm')}
      >
        {confirmDelete && (
          <div className="flex flex-col gap-3">
            <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
              {pickLocalized(confirmDelete, language).title || `#${confirmDelete.id}`}
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>
                {t('cancel')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                loading={deletingId === confirmDelete.id}
                onClick={() => void handleDelete(confirmDelete)}
              >
                <Trash2 size={13} /> {t('adminNewsDelete')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
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

function StatusBadge({ status, t }: { status: StoryStatus; t: (k: string) => string }) {
  const map: Record<StoryStatus, { variant: 'success' | 'info' | 'default'; key: string }> = {
    PUBLISHED: { variant: 'success', key: 'adminNewsStatusPublished' },
    DRAFT: { variant: 'info', key: 'adminNewsStatusDraft' },
    ARCHIVED: { variant: 'default', key: 'adminNewsStatusArchived' },
  };
  const cfg = map[status];
  return <Badge variant={cfg.variant}>{t(cfg.key)}</Badge>;
}
