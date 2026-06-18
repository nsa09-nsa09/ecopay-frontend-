import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminLayout } from "./admin-layout";
import { useI18n, type Language } from "../i18n-provider";
import { useAuth } from "../auth/auth-provider";
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  Select,
  Tabs,
} from "../ds-primitives";
import { FlashBanner, formatAdminApiError, useFlash } from "./admin-action-ui";
import { Image as ImageIcon, Pencil, Plus, RefreshCw, Trash2, Upload, X } from "lucide-react";
import {
  adminCreateCategory,
  adminCreateService,
  adminCreateTariff,
  adminDeleteCategory,
  adminDeleteService,
  adminDeleteTariff,
  adminGetCategories,
  adminGetServices,
  adminGetTariffs,
  adminUpdateCategory,
  adminUpdateService,
  adminUpdateTariff,
  adminUploadServiceLogo,
  clearServicesCache,
  type AdminCategoryDto,
  type AdminServiceDto,
  type AdminTariffDto,
  type CreateCategoryPayload,
  type CreateServicePayload,
  type CreateTariffPayload,
  type UpdateCategoryPayload,
  type UpdateServicePayload,
  type UpdateTariffPayload,
} from "../../lib/api";

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === "ru" ? ru : l === "kz" ? kz : en;

type CatalogTab = "categories" | "services" | "tariffs";

const PROVIDER_TYPES = ["DIGITAL", "TELECOM"];
const PERIOD_TYPES = ["MONTHLY", "YEARLY", "OTHER"];

export function AdminCatalogPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<CatalogTab>("categories");

  return (
    <AdminLayout>
      <div className="max-w-[1200px]">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{t("adminCatalog")}</h1>
        </div>
        <Tabs
          active={tab}
          onChange={(v) => setTab(v as CatalogTab)}
          tabs={[
            { id: "categories", label: t("catalogCategoriesTab") },
            { id: "services", label: t("catalogServicesTab") },
            { id: "tariffs", label: t("catalogTariffsTab") },
          ]}
        />
        <div className="mt-6">
          {tab === "categories" && <CategoriesSection />}
          {tab === "services" && <ServicesSection />}
          {tab === "tariffs" && <TariffsSection />}
        </div>
      </div>
    </AdminLayout>
  );
}

// ────────────────────────────────────────────────────────────
// Categories
// ────────────────────────────────────────────────────────────

function CategoriesSection() {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();
  const [items, setItems] = useState<AdminCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminCategoryDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<AdminCategoryDto | null>(null);
  const { flash, show } = useFlash();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authorizedRequest((token) => adminGetCategories(token));
      setItems(data);
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, t]);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await authorizedRequest((token) => adminDeleteCategory(deleting.id, token));
      clearServicesCache();
      show("success", t("actionCompletedAndLogged"));
      setDeleting(null);
      void load();
    } catch (err) {
      show("error", formatAdminApiError(err, t));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <FlashBanner flash={flash} />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
          {tx(language, "Включая неактивные", "Белсенді еместерді қоса", "Including inactive")}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={13} /> {t("retry")}
          </Button>
          <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
            <Plus size={13} /> {t("catalogCreateCategory")}
          </Button>
        </div>
      </div>

      {error && (
        <Card>
          <span className="text-[13px]" style={{ color: "var(--eco-negative)" }}>{error}</span>
        </Card>
      )}

      {loading ? (
        <Card><span className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("loading")}</span></Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-[13px]">
              <thead>
                <tr style={{ background: "var(--eco-surface)" }}>
                  <th className="text-left px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>ID</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>{t("catalogFieldName")}</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>Slug</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>{t("catalogFieldSortOrder")}</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>{t("catalogServicesTab")}</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>{tx(language, "Статус", "Мәртебесі", "Status")}</th>
                  <th className="text-right px-4 py-3" style={{ color: "var(--eco-text-tertiary)" }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} style={{ borderTop: "1px solid var(--eco-border)" }}>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>C-{c.id}</td>
                    <td className="px-4 py-3" style={{ color: "var(--eco-text)" }}>{c.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-secondary)", fontFamily: "monospace" }}>{c.slug}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-secondary)" }}>{c.sortOrder}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-secondary)" }}>{c.servicesCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={c.isActive ? "success" : "default"}>
                        {c.isActive ? t("catalogActive") : t("catalogInactive")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(c)}>
                          <Pencil size={12} /> {t("catalogEdit")}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(c)} disabled={!c.isActive}>
                          <Trash2 size={12} /> {t("catalogDelete")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
                      {tx(language, "Категорий пока нет", "Әзірге санаттар жоқ", "No categories yet")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CategoryFormModal
        open={creating || !!editing}
        existing={editing}
        onClose={() => { setEditing(null); setCreating(false); }}
        onSaved={() => { void load(); clearServicesCache(); show("success", t("actionCompletedAndLogged")); }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title={t("catalogConfirmDelete")}>
        <div className="flex flex-col gap-4">
          <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            {tx(language, "Категория будет деактивирована.", "Санат өшіріледі.", "The category will be deactivated.")}
          </p>
          {deleting && (
            <div className="p-3 rounded-lg text-[12px]" style={{ background: "var(--eco-surface)" }}>
              C-{deleting.id} — {deleting.name}
            </div>
          )}
          <Button variant="destructive" onClick={() => void handleDelete()}>{t("catalogDelete")}</Button>
        </div>
      </Modal>
    </div>
  );
}

function CategoryFormModal({
  open, existing, onClose, onSaved,
}: {
  open: boolean;
  existing: AdminCategoryDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const { authorizedRequest } = useAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState<string>("0");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(existing?.name ?? "");
    setSlug(existing?.slug ?? "");
    setSortOrder(String(existing?.sortOrder ?? 0));
    setIsActive(existing?.isActive ?? true);
    setError(null);
  }, [open, existing]);

  const submit = async () => {
    if (!name.trim()) { setError(t("catalogFieldName")); return; }
    setSubmitting(true);
    setError(null);
    try {
      if (existing) {
        const payload: UpdateCategoryPayload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          sortOrder: Number(sortOrder) || 0,
          isActive,
        };
        await authorizedRequest((token) => adminUpdateCategory(existing.id, payload, token));
      } else {
        const payload: CreateCategoryPayload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          sortOrder: Number(sortOrder) || 0,
          isActive,
        };
        await authorizedRequest((token) => adminCreateCategory(payload, token));
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={existing ? t("catalogEdit") : t("catalogCreateCategory")}>
      <div className="flex flex-col gap-4">
        <Input label={t("catalogFieldName")} value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Slug" hint={t("catalogFieldSlug")} value={slug} onChange={(e) => setSlug(e.target.value)} />
        <Input label={t("catalogFieldSortOrder")} type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--eco-text)" }}>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          {t("catalogActive")}
        </label>
        {error && <div className="text-[13px]" style={{ color: "var(--eco-negative)" }}>{error}</div>}
        <Button variant="primary" loading={submitting} onClick={() => void submit()}>{t("catalogEdit")}</Button>
      </div>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────
// Services
// ────────────────────────────────────────────────────────────

function ServicesSection() {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();
  const [categories, setCategories] = useState<AdminCategoryDto[]>([]);
  const [items, setItems] = useState<AdminServiceDto[]>([]);
  const [filterCategoryId, setFilterCategoryId] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminServiceDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<AdminServiceDto | null>(null);
  const { flash, show } = useFlash();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, svcs] = await Promise.all([
        authorizedRequest((token) => adminGetCategories(token)),
        authorizedRequest((token) => adminGetServices(token, filterCategoryId === "ALL" ? undefined : Number(filterCategoryId))),
      ]);
      setCategories(cats);
      setItems(svcs);
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, filterCategoryId, t]);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await authorizedRequest((token) => adminDeleteService(deleting.id, token));
      clearServicesCache();
      show("success", t("actionCompletedAndLogged"));
      setDeleting(null);
      void load();
    } catch (err) {
      show("error", formatAdminApiError(err, t));
    }
  };

  const categoryOptions = useMemo(() => [
    { value: "ALL", label: tx(language, "Все категории", "Барлық санаттар", "All categories") },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ], [categories, language]);

  return (
    <div className="flex flex-col gap-4">
      <FlashBanner flash={flash} />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="w-full sm:w-64">
          <Select
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
            options={categoryOptions}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={13} /> {t("retry")}
          </Button>
          <Button variant="primary" size="sm" onClick={() => setCreating(true)} disabled={categories.length === 0}>
            <Plus size={13} /> {t("catalogCreateService")}
          </Button>
        </div>
      </div>

      {error && <Card><span className="text-[13px]" style={{ color: "var(--eco-negative)" }}>{error}</span></Card>}

      {loading ? (
        <Card><span className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("loading")}</span></Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-[13px]">
              <thead>
                <tr style={{ background: "var(--eco-surface)" }}>
                  <th className="text-left px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>ID</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>{t("catalogFieldName")}</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>{t("catalogCategoriesTab")}</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>{t("catalogFieldProviderType")}</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>{t("catalogTariffsTab")}</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>{tx(language, "Статус", "Мәртебесі", "Status")}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id} style={{ borderTop: "1px solid var(--eco-border)" }}>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>S-{s.id}</td>
                    <td className="px-4 py-3" style={{ color: "var(--eco-text)" }}>
                      {s.name}
                      <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>{s.slug}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-secondary)" }}>{s.categoryName}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><Badge variant="info">{s.providerType}</Badge></td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-secondary)" }}>{s.tariffsCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={s.isActive ? "success" : "default"}>
                        {s.isActive ? t("catalogActive") : t("catalogInactive")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(s)}><Pencil size={12} /> {t("catalogEdit")}</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(s)} disabled={!s.isActive}><Trash2 size={12} /> {t("catalogDelete")}</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
                    {tx(language, "Сервисов пока нет", "Әзірге сервистер жоқ", "No services yet")}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ServiceFormModal
        open={creating || !!editing}
        existing={editing}
        categories={categories}
        onClose={() => { setEditing(null); setCreating(false); }}
        onSaved={() => { void load(); clearServicesCache(); show("success", t("actionCompletedAndLogged")); }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title={t("catalogConfirmDelete")}>
        <div className="flex flex-col gap-4">
          <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            {tx(language, "Сервис будет деактивирован.", "Сервис өшіріледі.", "The service will be deactivated.")}
          </p>
          {deleting && <div className="p-3 rounded-lg text-[12px]" style={{ background: "var(--eco-surface)" }}>S-{deleting.id} — {deleting.name}</div>}
          <Button variant="destructive" onClick={() => void handleDelete()}>{t("catalogDelete")}</Button>
        </div>
      </Modal>
    </div>
  );
}

const LOGO_MAX_BYTES = 5 * 1024 * 1024;
// Must match the backend allowlist (ServiceLogoStorageService): png / jpg / jpeg only.
// WebP is intentionally excluded — Java ImageIO can't decode it server-side.
const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/jpg"];

function ServiceFormModal({
  open, existing, categories, onClose, onSaved,
}: {
  open: boolean;
  existing: AdminServiceDto | null;
  categories: AdminCategoryDto[];
  onClose: () => void;
  onSaved: (saved: AdminServiceDto) => void;
}) {
  const { t } = useI18n();
  const { authorizedRequest } = useAuth();
  const [categoryId, setCategoryId] = useState<string>("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [providerType, setProviderType] = useState<string>(PROVIDER_TYPES[0]);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the locally-edited service so the logo block can show the latest
  // logoUrl after upload without waiting for the parent list to refetch.
  const [current, setCurrent] = useState<AdminServiceDto | null>(existing);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingLogoPreview, setPendingLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setCategoryId(String(existing?.categoryId ?? categories[0]?.id ?? ""));
    setName(existing?.name ?? "");
    setSlug(existing?.slug ?? "");
    setProviderType(existing?.providerType ?? PROVIDER_TYPES[0]);
    setIsActive(existing?.isActive ?? true);
    setError(null);
    setCurrent(existing);
    setPendingLogoFile(null);
    if (pendingLogoPreview) {
      URL.revokeObjectURL(pendingLogoPreview);
      setPendingLogoPreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    // Reset only when the modal (re)opens or switches to another service.
    // `categories` is deliberately NOT a dependency: when the parent reloads
    // its list after a logo upload it hands us a fresh `categories` array, and
    // re-running this effect would clobber the just-uploaded `current.logoUrl`
    // back to the stale `existing`, making the new logo flicker out of preview.
    // pendingLogoPreview is owned here; reset is intentional on every open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existing]);

  const validateLogo = (file: File): string | null => {
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) return t("catalogLogoInvalidType");
    if (file.size > LOGO_MAX_BYTES) return t("catalogLogoTooBig");
    return null;
  };

  const pickLogo = (file: File) => {
    const validationError = validateLogo(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    if (pendingLogoPreview) URL.revokeObjectURL(pendingLogoPreview);
    setPendingLogoFile(file);
    setPendingLogoPreview(URL.createObjectURL(file));
  };

  const clearPickedLogo = () => {
    setPendingLogoFile(null);
    if (pendingLogoPreview) URL.revokeObjectURL(pendingLogoPreview);
    setPendingLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadLogoFor = async (serviceId: number, file: File): Promise<AdminServiceDto | null> => {
    setUploadingLogo(true);
    try {
      const updated = await authorizedRequest((token) => adminUploadServiceLogo(serviceId, file, token));
      return updated;
    } catch (err) {
      setError(formatAdminApiError(err, t));
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const submit = async () => {
    if (submitting) return; // guard double-click
    if (!name.trim() || !categoryId) { setError(t("catalogFieldName")); return; }
    setSubmitting(true);
    setError(null);
    try {
      let saved: AdminServiceDto;
      if (current) {
        const payload: UpdateServicePayload = {
          categoryId: Number(categoryId),
          name: name.trim(),
          slug: slug.trim() || undefined,
          providerType,
          isActive,
        };
        saved = await authorizedRequest((token) => adminUpdateService(current.id, payload, token));
      } else {
        const payload: CreateServicePayload = {
          categoryId: Number(categoryId),
          name: name.trim(),
          slug: slug.trim() || undefined,
          providerType,
          isActive,
        };
        saved = await authorizedRequest((token) => adminCreateService(payload, token));
      }

      // If the admin picked a logo file while the service had no id yet,
      // upload it right after the create response lands so the new service
      // appears with its logo in one round-trip from the admin's POV.
      if (pendingLogoFile && saved && typeof saved.id === "number") {
        const withLogo = await uploadLogoFor(saved.id, pendingLogoFile);
        if (withLogo) saved = withLogo;
      }

      setCurrent(saved);
      clearPickedLogo();
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  // Direct-upload path for already-saved services: pick a file in edit mode
  // and it uploads immediately (matches the admin-news editor's "replace"
  // flow). Create mode still routes through submit().
  const replaceLogoNow = async (file: File) => {
    const validationError = validateLogo(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!current) {
      pickLogo(file);
      return;
    }
    const updated = await uploadLogoFor(current.id, file);
    if (updated) {
      setCurrent(updated);
      onSaved(updated);
      clearPickedLogo();
    }
  };

  const previewUrl = pendingLogoPreview || current?.logoUrl || null;

  return (
    <Modal open={open} onClose={onClose} title={current ? t("catalogEdit") : t("catalogCreateService")}>
      <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
        <Select
          label={t("catalogPickCategory")}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
        />
        <Input label={t("catalogFieldName")} value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Slug" hint={t("catalogFieldSlug")} value={slug} onChange={(e) => setSlug(e.target.value)} />
        <Select
          label={t("catalogFieldProviderType")}
          value={providerType}
          onChange={(e) => setProviderType(e.target.value)}
          options={PROVIDER_TYPES.map((p) => ({ value: p, label: p }))}
        />
        <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--eco-text)" }}>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          {t("catalogActive")}
        </label>

        {/* Logo block — visible in both create and edit modes. */}
        <div className="flex flex-col gap-2">
          <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("catalogFieldLogo")}</span>
          <div className="flex items-center gap-3">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt=""
                width={64}
                height={64}
                loading="lazy"
                decoding="async"
                className="w-16 h-16 rounded-xl shrink-0"
                style={{
                  objectFit: "contain",
                  background: "var(--eco-surface)",
                  padding: 6,
                  border: "1px solid var(--eco-border)",
                }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}
              >
                <ImageIcon size={18} style={{ color: "var(--eco-text-tertiary)" }} />
              </div>
            )}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_LOGO_TYPES.join(",")}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (current) void replaceLogoNow(file);
                  else pickLogo(file);
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  loading={uploadingLogo}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={13} />
                  {previewUrl ? t("catalogLogoReplace") : t("catalogLogoUpload")}
                </Button>
                {pendingLogoFile && (
                  <Button variant="ghost" size="sm" onClick={clearPickedLogo}>
                    <X size={13} /> {t("cancel")}
                  </Button>
                )}
              </div>
              <span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
                {current ? t("catalogLogoHint") : t("catalogLogoAtCreateHint")}
              </span>
            </div>
          </div>
        </div>

        {error && <div className="text-[13px]" style={{ color: "var(--eco-negative)" }}>{error}</div>}
        <Button variant="primary" loading={submitting} onClick={() => void submit()}>
          {t("save")}
        </Button>
      </div>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────
// Tariffs
// ────────────────────────────────────────────────────────────

function TariffsSection() {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();
  const [services, setServices] = useState<AdminServiceDto[]>([]);
  const [serviceId, setServiceId] = useState<string>("");
  const [items, setItems] = useState<AdminTariffDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminTariffDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<AdminTariffDto | null>(null);
  const { flash, show } = useFlash();

  useEffect(() => {
    let cancelled = false;
    void authorizedRequest((token) => adminGetServices(token))
      .then((data) => {
        if (cancelled) return;
        setServices(data);
        if (!serviceId && data.length > 0) setServiceId(String(data[0].id));
      })
      .catch((err) => { if (!cancelled) setError(formatAdminApiError(err, t)); });
    return () => { cancelled = true; };
  }, [authorizedRequest, t]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    if (!serviceId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await authorizedRequest((token) => adminGetTariffs(Number(serviceId), token));
      setItems(data);
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, serviceId, t]);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await authorizedRequest((token) => adminDeleteTariff(deleting.id, token));
      clearServicesCache();
      show("success", t("actionCompletedAndLogged"));
      setDeleting(null);
      void load();
    } catch (err) {
      show("error", formatAdminApiError(err, t));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <FlashBanner flash={flash} />
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="w-full sm:w-72">
          <Select
            label={t("catalogPickService")}
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            options={services.map((s) => ({ value: String(s.id), label: `${s.name} — ${s.categoryName}` }))}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading || !serviceId}>
            <RefreshCw size={13} /> {t("retry")}
          </Button>
          <Button variant="primary" size="sm" onClick={() => setCreating(true)} disabled={!serviceId}>
            <Plus size={13} /> {t("catalogCreateTariff")}
          </Button>
        </div>
      </div>

      {error && <Card><span className="text-[13px]" style={{ color: "var(--eco-negative)" }}>{error}</span></Card>}

      {loading ? (
        <Card><span className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("loading")}</span></Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-[13px]">
              <thead>
                <tr style={{ background: "var(--eco-surface)" }}>
                  <th className="text-left px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>ID</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>{t("catalogFieldName")}</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>{t("catalogFieldPeriodType")}</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>{t("catalogFieldMaxMembers")}</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>{t("catalogFieldBasePrice")}</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>{t("catalogFieldCurrency")}</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>{tx(language, "Статус", "Мәртебесі", "Status")}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((tariff) => (
                  <tr key={tariff.id} style={{ borderTop: "1px solid var(--eco-border)" }}>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>T-{tariff.id}</td>
                    <td className="px-4 py-3" style={{ color: "var(--eco-text)" }}>{tariff.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-secondary)" }}>{tariff.periodType}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-secondary)" }}>{tariff.maxMembers}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-secondary)" }}>{Number(tariff.basePriceTotal).toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--eco-text-secondary)" }}>{tariff.currency}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={tariff.isActive ? "success" : "default"}>
                        {tariff.isActive ? t("catalogActive") : t("catalogInactive")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(tariff)}><Pencil size={12} /> {t("catalogEdit")}</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(tariff)} disabled={!tariff.isActive}><Trash2 size={12} /> {t("catalogDelete")}</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
                    {tx(language, "Тарифов пока нет", "Әзірге тарифтер жоқ", "No tariffs yet")}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <TariffFormModal
        open={creating || !!editing}
        serviceId={serviceId ? Number(serviceId) : null}
        existing={editing}
        onClose={() => { setEditing(null); setCreating(false); }}
        onSaved={() => { void load(); clearServicesCache(); show("success", t("actionCompletedAndLogged")); }}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title={t("catalogConfirmDelete")}>
        <div className="flex flex-col gap-4">
          <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            {tx(language, "Тариф будет деактивирован.", "Тариф өшіріледі.", "The tariff will be deactivated.")}
          </p>
          {deleting && <div className="p-3 rounded-lg text-[12px]" style={{ background: "var(--eco-surface)" }}>T-{deleting.id} — {deleting.name}</div>}
          <Button variant="destructive" onClick={() => void handleDelete()}>{t("catalogDelete")}</Button>
        </div>
      </Modal>
    </div>
  );
}

function TariffFormModal({
  open, serviceId, existing, onClose, onSaved,
}: {
  open: boolean;
  serviceId: number | null;
  existing: AdminTariffDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const { authorizedRequest } = useAuth();
  const [name, setName] = useState("");
  const [periodType, setPeriodType] = useState(PERIOD_TYPES[0]);
  const [maxMembers, setMaxMembers] = useState("2");
  const [basePriceTotal, setBasePriceTotal] = useState("0");
  const [currency, setCurrency] = useState("KZT");
  const [connectionType, setConnectionType] = useState("");
  const [operatorRules, setOperatorRules] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(existing?.name ?? "");
    setPeriodType(existing?.periodType ?? PERIOD_TYPES[0]);
    setMaxMembers(String(existing?.maxMembers ?? 2));
    setBasePriceTotal(String(existing?.basePriceTotal ?? 0));
    setCurrency(existing?.currency ?? "KZT");
    setConnectionType(existing?.connectionType ?? "");
    setOperatorRules(existing?.operatorRules ?? "");
    setFeatures(existing?.features ?? []);
    setIsActive(existing?.isActive ?? true);
    setError(null);
  }, [open, existing]);

  const updateFeature = (index: number, value: string) => {
    setFeatures((prev) => prev.map((f, i) => (i === index ? value : f)));
  };
  const addFeature = () => setFeatures((prev) => [...prev, ""]);
  const removeFeature = (index: number) => setFeatures((prev) => prev.filter((_, i) => i !== index));

  const submit = async () => {
    const members = Number(maxMembers);
    const price = Number(basePriceTotal);
    if (!name.trim()) { setError(t("catalogFieldName")); return; }
    if (members < 2) { setError("max_members >= 2"); return; }
    if (price <= 0) { setError("base_price_total > 0"); return; }
    setSubmitting(true);
    setError(null);
    const cleanedFeatures = features.map((f) => f.trim()).filter(Boolean);
    try {
      if (existing) {
        const payload: UpdateTariffPayload = {
          name: name.trim(),
          periodType,
          maxMembers: members,
          basePriceTotal: price,
          currency,
          connectionType: connectionType.trim() || null,
          operatorRules: operatorRules.trim() || null,
          features: cleanedFeatures,
          isActive,
        };
        await authorizedRequest((token) => adminUpdateTariff(existing.id, payload, token));
      } else {
        if (!serviceId) return;
        const payload: CreateTariffPayload = {
          name: name.trim(),
          periodType,
          maxMembers: members,
          basePriceTotal: price,
          currency,
          connectionType: connectionType.trim() || null,
          operatorRules: operatorRules.trim() || null,
          features: cleanedFeatures,
        };
        await authorizedRequest((token) => adminCreateTariff(serviceId, payload, token));
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={existing ? t("catalogEdit") : t("catalogCreateTariff")}>
      <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
        <Input label={t("catalogFieldName")} value={name} onChange={(e) => setName(e.target.value)} />
        <Select
          label={t("catalogFieldPeriodType")}
          value={periodType}
          onChange={(e) => setPeriodType(e.target.value)}
          options={PERIOD_TYPES.map((p) => ({ value: p, label: p }))}
        />
        <Input label={t("catalogFieldMaxMembers")} type="number" value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} />
        <Input label={t("catalogFieldBasePrice")} type="number" value={basePriceTotal} onChange={(e) => setBasePriceTotal(e.target.value)} />
        <Input label={t("catalogFieldCurrency")} value={currency} onChange={(e) => setCurrency(e.target.value)} />
        <Input label={t("catalogFieldConnectionType")} value={connectionType} onChange={(e) => setConnectionType(e.target.value)} />
        <div className="flex flex-col gap-1.5">
          <label className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t("catalogFieldOperatorRules")}</label>
          <textarea
            rows={3}
            value={operatorRules}
            onChange={(e) => setOperatorRules(e.target.value)}
            className="px-3 py-2 rounded-lg outline-none text-[14px]"
            style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t("catalogFieldFeatures")}</label>
          <div className="flex flex-col gap-2">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={f}
                  onChange={(e) => updateFeature(i, e.target.value)}
                  placeholder={t("catalogFeaturePlaceholder")}
                  className="flex-1 px-3 py-2 rounded-lg outline-none text-[13px]"
                  style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
                />
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="p-1.5 rounded cursor-pointer"
                  style={{ background: "transparent", border: "1px solid var(--eco-border)", color: "var(--eco-text-tertiary)" }}
                  aria-label={t("catalogDelete")}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={addFeature} className="self-start">
              <Plus size={13} /> {t("catalogFeatureAdd")}
            </Button>
          </div>
        </div>
        {existing && (
          <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--eco-text)" }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            {t("catalogActiveToggle")}
          </label>
        )}
        {error && <div className="text-[13px]" style={{ color: "var(--eco-negative)" }}>{error}</div>}
        <Button variant="primary" loading={submitting} onClick={() => void submit()}>{t("catalogEdit")}</Button>
      </div>
    </Modal>
  );
}
