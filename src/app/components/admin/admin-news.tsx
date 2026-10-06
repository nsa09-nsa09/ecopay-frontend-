import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminLayout } from './admin-layout';
import { useI18n, type Language } from '../i18n-provider';
import { formatDateTime } from '../../lib/datetime';
import { useAuth } from '../auth/auth-provider';
import { Button, Input, Modal, Select, Skeleton, Tabs } from '../ds-primitives';
import { FlashBanner, formatAdminApiError, useFlash } from './admin-action-ui';
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Newspaper,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  adminCreateNews,
  adminDeleteNews,
  adminDeleteNewsImage,
  adminDeleteNewsLocalizedImage,
  adminListNews,
  adminUpdateNews,
  adminUploadNewsImage,
  adminUploadNewsLocalizedImage,
  clearNewsCache,
  type AdminNewsDto,
  type NewsStatus,
  type UpsertNewsPayload,
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

const NEWS_STATUS: Record<NewsStatus, { tone: AdminStatusTone; key: string }> = {
  PUBLISHED: { tone: 'success', key: 'adminNewsStatusPublished' },
  DRAFT: { tone: 'info', key: 'adminNewsStatusDraft' },
  ARCHIVED: { tone: 'default', key: 'adminNewsStatusArchived' },
};

const NEWS_LANGS: readonly Language[] = ['kz', 'ru', 'en'] as const;
type NewsLang = (typeof NEWS_LANGS)[number];

const TITLE_MAX = 200;
const BODY_MAX = 4000;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

type LangFields = { title: string; body: string };
type LangBag = Record<NewsLang, LangFields>;
type ImageMode = 'shared' | 'localized';

interface FormState {
  langs: LangBag;
  status: NewsStatus;
  sortOrder: number;
}

const EMPTY_LANGS: LangBag = {
  kz: { title: '', body: '' },
  ru: { title: '', body: '' },
  en: { title: '', body: '' },
};

const EMPTY_FORM: FormState = {
  langs: EMPTY_LANGS,
  status: 'DRAFT',
  sortOrder: 0,
};

function toForm(item: AdminNewsDto): FormState {
  return {
    langs: {
      kz: { title: item.titleKz ?? '', body: item.bodyKz ?? '' },
      ru: { title: item.titleRu ?? '', body: item.bodyRu ?? '' },
      en: { title: item.titleEn ?? '', body: item.bodyEn ?? '' },
    },
    status: item.status,
    sortOrder: item.sortOrder ?? 0,
  };
}

function buildPayload(form: FormState): UpsertNewsPayload {
  const trim = (v: string) => (v.trim().length > 0 ? v.trim() : null);
  return {
    titleKz: trim(form.langs.kz.title),
    titleRu: trim(form.langs.ru.title),
    titleEn: trim(form.langs.en.title),
    bodyKz: trim(form.langs.kz.body),
    bodyRu: trim(form.langs.ru.body),
    bodyEn: trim(form.langs.en.body),
    status: form.status,
    sortOrder: form.sortOrder,
  };
}

function pickLocalized(
  item: {
    titleKz?: string | null;
    titleRu?: string | null;
    titleEn?: string | null;
    bodyKz?: string | null;
    bodyRu?: string | null;
    bodyEn?: string | null;
  },
  language: Language,
) {
  const titleKey = language === 'kz' ? 'titleKz' : language === 'en' ? 'titleEn' : 'titleRu';
  const bodyKey = language === 'kz' ? 'bodyKz' : language === 'en' ? 'bodyEn' : 'bodyRu';
  const title =
    ((item as Record<string, unknown>)[titleKey] as string | null | undefined) ||
    item.titleRu ||
    item.titleEn ||
    item.titleKz ||
    '';
  const body =
    ((item as Record<string, unknown>)[bodyKey] as string | null | undefined) ||
    item.bodyRu ||
    item.bodyEn ||
    item.bodyKz ||
    '';
  return { title, body };
}

export function AdminNewsPage() {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();
  const { flash, show } = useFlash();

  const [items, setItems] = useState<AdminNewsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminNewsDto | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [activeLang, setActiveLang] = useState<NewsLang>('ru');
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminNewsDto | null>(null);

  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File picked in the editor before the post exists — uploaded as the second
  // step of handleSave for create mode, or right after a save in edit mode.
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<ImageMode>('shared');
  const [pendingLocalizedFiles, setPendingLocalizedFiles] = useState<Partial<Record<NewsLang, File>>>({});
  const [pendingLocalizedPreviews, setPendingLocalizedPreviews] = useState<Partial<Record<NewsLang, string>>>({});
  const localizedPreviewRef = useRef<Partial<Record<NewsLang, string>>>({});

  // Release the object URL when the picked file changes or the editor closes.
  useEffect(() => {
    if (!pendingImagePreview) return;
    return () => {
      URL.revokeObjectURL(pendingImagePreview);
    };
  }, [pendingImagePreview]);

  useEffect(() => { localizedPreviewRef.current = pendingLocalizedPreviews; }, [pendingLocalizedPreviews]);
  useEffect(() => () => Object.values(localizedPreviewRef.current).forEach((url) => URL.revokeObjectURL(url)), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authorizedRequest((token) => adminListNews(token));
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

  const published = useMemo(
    () =>
      [...items]
        .filter((it) => it.status === 'PUBLISHED')
        .sort((a, b) => {
          const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
          const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
          return tb - ta;
        }),
    [items],
  );

  const resetPendingImage = () => {
    Object.values(pendingLocalizedPreviews).forEach((url) => URL.revokeObjectURL(url));
    setPendingImageFile(null);
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

  const openEdit = (item: AdminNewsDto) => {
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
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return t('adminNewsImageInvalidType');
    if (file.size > IMAGE_MAX_BYTES) return t('adminNewsImageTooBig');
    return null;
  };

  const handlePickFile = (file: File) => {
    const error = validateImageFile(file);
    if (error) {
      setEditorError(error);
      return;
    }
    setEditorError(null);
    if (imageMode === 'shared') {
      if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
      setPendingImageFile(file);
      setPendingImagePreview(URL.createObjectURL(file));
    } else {
      const old = pendingLocalizedPreviews[activeLang];
      if (old) URL.revokeObjectURL(old);
      setPendingLocalizedFiles((prev) => ({ ...prev, [activeLang]: file }));
      setPendingLocalizedPreviews((prev) => ({ ...prev, [activeLang]: URL.createObjectURL(file) }));
    }
  };

  const clearPendingLocalizedImage = (locale: NewsLang) => {
    const preview = pendingLocalizedPreviews[locale];
    if (preview) URL.revokeObjectURL(preview);
    setPendingLocalizedFiles((prev) => ({ ...prev, [locale]: undefined }));
    setPendingLocalizedPreviews((prev) => ({ ...prev, [locale]: undefined }));
  };

  const handleSave = async () => {
    // Hard guard against double-submit races: the disabled prop only takes
    // effect after React re-renders, so a fast double-click can fire two
    // POST /admin/news in flight before the button greys out. That's the
    // most common cause of the "duplicate / phantom error" pattern seen on
    // create — kill it here.
    if (saving) return;
    setSaving(true);
    setEditorError(null);
    try {
      const payload = buildPayload(form);
      const editingId = editing?.id;
      let saved =
        editingId != null
          ? await authorizedRequest((token) => adminUpdateNews(editingId, payload, token))
          : await authorizedRequest((token) => adminCreateNews(payload, token));

      // Defensive: some backends respond 201 with an empty body. In that case
      // `saved` is undefined and splicing it into the list would throw — which
      // surfaced as a generic "save failed" toast even though the POST itself
      // returned 2xx. Refetch the list and bail cleanly instead.
      if (!saved || saved.id == null) {
        await load();
        clearNewsCache();
        show('success', t('adminNewsSaveSuccess'));
        resetPendingImage();
        setEditorOpen(false);
        setEditing(null);
        return;
      }

      // If a file was picked while the post had no id yet, upload it now.
      if (imageMode === 'shared' && pendingImageFile) {
        try {
          saved = await authorizedRequest((token) =>
            adminUploadNewsImage(saved.id, pendingImageFile, token),
          );
        } catch (uploadErr) {
          // The post itself was saved — keep the modal open so the admin can
          // retry the image upload without re-typing the body.
          await load();
          setEditing(saved);
          setEditorError(formatAdminApiError(uploadErr, t));
          setSaving(false);
          return;
        }
      }
      if (imageMode === 'shared') {
        for (const locale of NEWS_LANGS) {
          saved = await authorizedRequest((token) => adminDeleteNewsLocalizedImage(saved.id, locale, token));
        }
      } else {
        for (const locale of NEWS_LANGS) {
          const file = pendingLocalizedFiles[locale];
          if (file) saved = await authorizedRequest((token) => adminUploadNewsLocalizedImage(saved.id, locale, file, token));
        }
      }

      setItems((prev) => {
        const next = prev.filter((it) => it.id !== saved.id);
        next.push(saved);
        return next.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      });
      setEditing(saved);
      clearNewsCache();
      resetPendingImage();
      show('success', t('adminNewsSaveSuccess'));
      setEditorOpen(false);
    } catch (err) {
      setEditorError(formatAdminApiError(err, t));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: AdminNewsDto) => {
    setDeletingId(item.id);
    try {
      await authorizedRequest((token) => adminDeleteNews(item.id, token));
      setItems((prev) => prev.filter((it) => it.id !== item.id));
      clearNewsCache();
      show('success', t('adminNewsDeleteSuccess'));
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
        ? adminDeleteNewsImage(editing.id, token)
        : adminDeleteNewsLocalizedImage(editing.id, activeLang, token));
      setItems((prev) =>
        prev.map((it) => (it.id === updated.id ? updated : it)),
      );
      setEditing(updated);
      clearNewsCache();
    } catch (err) {
      setEditorError(formatAdminApiError(err, t));
    } finally {
      setUploadingId(null);
    }
  };

  const setLangField = (lang: NewsLang, field: keyof LangFields, value: string) => {
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

  const columns: AdminColumn<AdminNewsDto>[] = [
    {
      id: 'title',
      header: t('adminNewsListColTitle'),
      priority: 'primary',
      minWidth: 260,
      cell: (it) => {
        const { title } = pickLocalized(it, language);
        return (
          <div className="flex items-center gap-2 min-w-0">
            {it.imageUrl ? (
              <img
                src={it.imageUrl}
                alt=""
                width={36}
                height={36}
                loading="lazy"
                decoding="async"
                className="w-9 h-9 rounded-md object-cover shrink-0"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                style={{ background: 'var(--eco-surface)' }}
              >
                <ImageIcon size={14} style={{ color: 'var(--eco-text-tertiary)' }} />
              </div>
            )}
            <span className="min-w-0 break-words md:truncate md:max-w-[360px]">
              {title || `#${it.id}`}
            </span>
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
        <AdminStatusBadge tone={NEWS_STATUS[it.status].tone}>
          {t(NEWS_STATUS[it.status].key)}
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
          title={t('adminNewsTitle')}
          subtitle={t('adminNewsHint')}
          actions={
            <>
              <AdminRefreshButton onClick={() => void load()} loading={loading || saving} />
              <Button variant="primary" size="sm" onClick={openCreate}>
                <Plus size={13} /> {t('adminNewsCreate')}
              </Button>
            </>
          }
        />

        <FlashBanner flash={flash} />

        {/* Published carousel */}
        <AdminCard title={t('adminNewsCarouselTitle')}>
          {loading ? (
            <Skeleton height={262} rounded={12} />
          ) : (
            <PublishedCarousel items={published} language={language} t={t} />
          )}
        </AdminCard>

        {/* List */}
        <section className="flex flex-col gap-3 min-w-0">
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--eco-text)' }}>
            {t('adminNewsListTitle')}
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
                  icon={Newspaper}
                  title={t('adminNewsEmpty')}
                  action={
                    <Button variant="primary" size="sm" onClick={openCreate}>
                      <Plus size={13} /> {t('adminNewsCreate')}
                    </Button>
                  }
                />
              </AdminCard>
            }
          />
        </section>
      </AdminPage>

      {/* Editor modal */}
      <Modal
        open={editorOpen}
        onClose={closeEditor}
        title={editing ? t('adminNewsFormEdit') : t('adminNewsFormCreate')}
      >
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
          <Tabs
            tabs={langTabs}
            active={activeLang}
            onChange={(id) => setActiveLang(id as NewsLang)}
          />

          <FormRow label={t('adminNewsFieldTitle')}>
            <Input
              value={currentFields.title}
              onChange={(e) =>
                setLangField(activeLang, 'title', e.target.value.slice(0, TITLE_MAX))
              }
              maxLength={TITLE_MAX}
              hint={`${currentFields.title.length} / ${TITLE_MAX}`}
            />
          </FormRow>

          <FormRow label={t('adminNewsFieldBody')}>
            <textarea
              value={currentFields.body}
              onChange={(e) => setLangField(activeLang, 'body', e.target.value.slice(0, BODY_MAX))}
              rows={6}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormRow label={t('adminNewsFieldStatus')}>
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value as NewsStatus }))
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

          {/* Image — works in both create and edit modes. In create mode we
              hold the file in state and upload it after the post exists. */}
          <FormRow label={t('adminNewsFieldImage')}>
            {(() => {
              const localizedKey = activeLang === 'kz' ? 'imageUrlKz' : activeLang === 'en' ? 'imageUrlEn' : 'imageUrlRu';
              const previewUrl = imageMode === 'shared'
                ? pendingImagePreview || editing?.imageUrl || null
                : pendingLocalizedPreviews[activeLang] || editing?.[localizedKey] || null;
              const hasPersistedImage = imageMode === 'shared' ? Boolean(editing?.imageUrl) : Boolean(editing?.[localizedKey]);
              const hasAnyPreview = Boolean(previewUrl);
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
                      width={120}
                      height={80}
                      loading="lazy"
                      decoding="async"
                      className="rounded-lg object-cover shrink-0"
                      style={{ background: 'var(--eco-surface)' }}
                    />
                  ) : (
                    <div
                      className="w-[120px] h-[80px] rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'var(--eco-surface)' }}
                    >
                      <ImageIcon size={20} style={{ color: 'var(--eco-text-tertiary)' }} />
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
                        <Upload size={13} />
                        {hasAnyPreview ? t('adminNewsImageReplace') : t('adminNewsImageUpload')}
                      </Button>
                      {(imageMode === 'shared' ? pendingImageFile : pendingLocalizedFiles[activeLang]) && (
                        <Button variant="ghost" size="sm" onClick={() => imageMode === 'shared' ? resetPendingImage() : clearPendingLocalizedImage(activeLang)}>
                          <X size={13} /> {t('cancel')}
                        </Button>
                      )}
                      {hasPersistedImage && !(imageMode === 'shared' ? pendingImageFile : pendingLocalizedFiles[activeLang]) && editing && (
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
                      {imageMode === 'localized' ? t('adminImageForLang', { lang: langTabs.find((tab) => tab.id === activeLang)?.label ?? '' }) : (editing ? t('adminNewsImageHint') : t('adminNewsImageAtCreateHint'))}
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

      {/* Delete confirmation */}
      <AdminConfirm
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={t('adminNewsDeleteConfirm')}
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

function PublishedCarousel({
  items,
  language,
  t,
}: {
  items: AdminNewsDto[];
  language: Language;
  t: (k: string) => string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length === 0) {
      setIndex(0);
      return;
    }
    if (index > items.length - 1) {
      setIndex(items.length - 1);
    }
  }, [items.length, index]);

  if (items.length === 0) {
    return (
      <div className="py-6 text-center text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
        {t('adminNewsCarouselEmpty')}
      </div>
    );
  }

  const safeIndex = ((index % items.length) + items.length) % items.length;
  const current = items[safeIndex];
  const { title, body } = pickLocalized(current, language);

  const goPrev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const goNext = () => setIndex((i) => (i + 1) % items.length);

  // Basic swipe handling — keeps mobile usable without a heavy lib.
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    if (start == null) return;
    const endX = e.changedTouches[0]?.clientX ?? start;
    const dx = endX - start;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx > 0) goPrev();
    else goNext();
  };

  return (
    <div className="flex flex-col gap-3" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div
        className="rounded-xl overflow-hidden flex flex-col sm:flex-row"
        style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
      >
        {current.imageUrl ? (
          <img
            src={current.imageUrl}
            alt=""
            width={360}
            height={220}
            loading="lazy"
            decoding="async"
            className="w-full sm:w-[360px] h-[200px] sm:h-[220px] object-cover shrink-0"
          />
        ) : (
          <div
            className="w-full sm:w-[360px] h-[200px] sm:h-[220px] flex items-center justify-center shrink-0"
            style={{ background: 'var(--eco-brand-50)' }}
          >
            <ImageIcon size={28} style={{ color: 'var(--eco-primary)' }} />
          </div>
        )}
        <div className="p-4 sm:p-5 flex flex-col gap-2 flex-1 min-w-0">
          <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            {formatDateTime(current.publishedAt ?? current.updatedAt, language)}
          </div>
          <div className="text-[15px] font-semibold" style={{ color: 'var(--eco-text)' }}>
            {title || `#${current.id}`}
          </div>
          <div className="text-[13px] line-clamp-4" style={{ color: 'var(--eco-text-secondary)' }}>
            {body}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={goPrev} disabled={items.length < 2}>
          <ChevronLeft size={14} /> {t('adminNewsCarouselPrev')}
        </Button>
        <div className="flex items-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${i + 1} / ${items.length}`}
              className="w-2 h-2 rounded-full transition-colors cursor-pointer"
              style={{
                background: i === safeIndex ? 'var(--eco-primary)' : 'var(--eco-neutral-200)',
                border: 'none',
              }}
            />
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={goNext} disabled={items.length < 2}>
          {t('adminNewsCarouselNext')} <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}
