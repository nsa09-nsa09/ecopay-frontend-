import { useState } from "react";
import { Link } from "react-router";
import { Button, Input, Card } from "../ds-primitives";
import { Mail, ArrowLeft } from "lucide-react";
import { useI18n } from "../i18n-provider";

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);

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
          <Button variant="secondary" size="md" onClick={() => setSent(false)}>
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
        <Card className="flex flex-col gap-4">
          <Input label={t("email")} type="email" placeholder={t("yourEmail")} />
          <Button variant="primary" size="lg" className="w-full" onClick={() => setSent(true)}>
            {t("sendResetLink")}
          </Button>
        </Card>
        <div className="text-center mt-4">
          <Link to="/login" className="text-[13px] inline-flex items-center gap-1" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
            <ArrowLeft size={14} /> {t("backToSignIn")}
          </Link>
        </div>
      </div>
    </div>
  );
}