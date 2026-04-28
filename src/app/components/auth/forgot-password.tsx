import { FormEvent, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button, Input, Card } from "../ds-primitives";
import { Mail, ArrowLeft } from "lucide-react";
import { useI18n } from "../i18n-provider";
import { authApi } from "../../../lib/api/auth";
import { ApiError } from "../../../lib/api/client";

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      await authApi.requestReset({ email });
      setSent(true);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not send reset link";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "var(--eco-success-100)" }}
          >
            <Mail size={24} style={{ color: "var(--eco-positive)" }} />
          </div>
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{t("checkYourEmail")}</h1>
          <p className="text-[13px] mt-2 mb-6" style={{ color: "var(--eco-text-secondary)" }}>
            {t("resetLinkSent")}
          </p>
          <Button variant="secondary" size="md" onClick={() => send()} disabled={submitting}>
            {t("resendEmail")}
          </Button>
          <div className="mt-4">
            <Link to="/login" className="text-[13px] inline-flex items-center gap-1" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
              <ArrowLeft size={14} /> {t("backToSignIn")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{t("resetPassword")}</h1>
          <p className="text-[13px] mt-2" style={{ color: "var(--eco-text-secondary)" }}>
            {t("enterEmailForReset")}
          </p>
        </div>
        <form onSubmit={send}>
          <Card className="flex flex-col gap-4">
            <Input
              label={t("email")}
              type="email"
              placeholder={t("yourEmail")}
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "..." : t("sendResetLink")}
            </Button>
          </Card>
        </form>
        <div className="text-center mt-4">
          <Link to="/login" className="text-[13px] inline-flex items-center gap-1" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
            <ArrowLeft size={14} /> {t("backToSignIn")}
          </Link>
        </div>
      </div>
    </div>
  );
}
