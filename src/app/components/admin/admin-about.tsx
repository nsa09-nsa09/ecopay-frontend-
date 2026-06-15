import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "./admin-layout";
import { useI18n } from "../i18n-provider";
import { formatDateTime } from "../../lib/datetime";
import { useAuth } from "../auth/auth-provider";
import { Button, Card, Input } from "../ds-primitives";
import { FlashBanner, formatAdminApiError, useFlash } from "./admin-action-ui";
import { RefreshCw, Save } from "lucide-react";
import {
  adminGetSiteAbout,
  adminUpdateSiteAbout,
  type SiteAboutContent,
} from "../../lib/api";

type FormState = {
  companyName: string;
  title: string;
  mission: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
};

const EMPTY: FormState = {
  companyName: "",
  title: "",
  mission: "",
  description: "",
  contactEmail: "",
  contactPhone: "",
};

function toForm(content: SiteAboutContent): FormState {
  return {
    companyName: content.companyName ?? "",
    title: content.title ?? "",
    mission: content.mission ?? "",
    description: content.description ?? "",
    contactEmail: content.contactEmail ?? "",
    contactPhone: content.contactPhone ?? "",
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

  useEffect(() => { void load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await authorizedRequest((token) =>
        adminUpdateSiteAbout({
          companyName: form.companyName.trim(),
          title: form.title.trim(),
          mission: form.mission.trim() || null,
          description: form.description.trim() || null,
          contactEmail: form.contactEmail.trim() || null,
          contactPhone: form.contactPhone.trim() || null,
        }, token),
      );
      setForm(toForm(updated));
      setUpdatedAt(updated.updatedAt);
      show("success", t("actionCompletedAndLogged"));
    } catch (err) {
      show("error", formatAdminApiError(err, t));
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const canSave = form.companyName.trim().length > 0 && form.title.trim().length > 0 && !saving;

  return (
    <AdminLayout>
      <div className="max-w-[860px]">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{t("adminAboutTitle")}</h1>
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading || saving}>
            <RefreshCw size={13} /> {t("retry")}
          </Button>
        </div>

        <FlashBanner flash={flash} />

        {error && (
          <Card>
            <span className="text-[13px]" style={{ color: "var(--eco-negative)" }}>{error}</span>
          </Card>
        )}

        {loading ? (
          <Card>
            <span className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("loading")}</span>
          </Card>
        ) : (
          <Card>
            <div className="flex flex-col gap-4">
              <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                {t("adminAboutHint")}
              </p>

              <FormRow label={t("adminAboutCompanyName")}>
                <Input value={form.companyName} onChange={(e) => set("companyName")(e.target.value)} />
              </FormRow>

              <FormRow label={t("adminAboutPageTitle")}>
                <Input value={form.title} onChange={(e) => set("title")(e.target.value)} />
              </FormRow>

              <FormRow label={t("adminAboutMission")}>
                <textarea
                  value={form.mission}
                  onChange={(e) => set("mission")(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg text-[14px]"
                  style={{
                    background: "var(--eco-bg)",
                    color: "var(--eco-text)",
                    border: "1px solid var(--eco-border)",
                    resize: "vertical",
                  }}
                />
              </FormRow>

              <FormRow label={t("adminAboutDescription")}>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description")(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg text-[14px]"
                  style={{
                    background: "var(--eco-bg)",
                    color: "var(--eco-text)",
                    border: "1px solid var(--eco-border)",
                    resize: "vertical",
                  }}
                />
              </FormRow>

              <FormRow label={t("adminAboutContactEmail")}>
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => set("contactEmail")(e.target.value)}
                  placeholder="support@ecopay.kz"
                />
              </FormRow>

              <FormRow label={t("adminAboutContactPhone")}>
                <Input
                  value={form.contactPhone}
                  onChange={(e) => set("contactPhone")(e.target.value)}
                  placeholder="+7 ..."
                />
              </FormRow>

              <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
                <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                  {updatedAt
                    ? `${t("adminAboutLastUpdated")}: ${formatDateTime(updatedAt, language)}`
                    : ""}
                </span>
                <Button variant="primary" onClick={() => void handleSave()} disabled={!canSave} loading={saving}>
                  <Save size={13} /> {t("save")}
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
      <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{label}</span>
      {children}
    </label>
  );
}
