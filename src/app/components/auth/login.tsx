import { Link } from "react-router";
import { Button, Input, Card } from "../ds-primitives";
import { useI18n } from "../i18n-provider";

export function LoginPage() {
  const { t } = useI18n();
  
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{t("signIn")}</h1>
          <p className="text-[13px] mt-2" style={{ color: "var(--eco-text-secondary)" }}>
            {t("welcomeBack")}
          </p>
        </div>
        <Card className="flex flex-col gap-4">
          <Input label={t("email")} type="email" placeholder={t("yourEmail")} />
          <Input label={t("password")} type="password" placeholder={t("enterPassword")} />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{t("rememberMe")}</span>
            </label>
            <Link to="/forgot-password" className="text-[13px]" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
              {t("forgotPassword")}
            </Link>
          </div>
          <Button variant="primary" size="lg" className="w-full">{t("signIn")}</Button>
        </Card>
        <p className="text-center text-[13px] mt-4" style={{ color: "var(--eco-text-secondary)" }}>
          {t("dontHaveAccount")}{" "}
          <Link to="/register" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>{t("createAccount")}</Link>
        </p>
      </div>
    </div>
  );
}