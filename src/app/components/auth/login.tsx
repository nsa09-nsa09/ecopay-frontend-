import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button, Input, Card } from "../ds-primitives";
import { useI18n } from "../i18n-provider";
import { useAuth } from "../../../lib/auth/AuthContext";
import { ApiError } from "../../../lib/api/client";

export function LoginPage() {
  const { t } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await login({ email, password });
      toast.success(t("welcomeBack"));
      navigate(redirect, { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Login failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{t("signIn")}</h1>
          <p className="text-[13px] mt-2" style={{ color: "var(--eco-text-secondary)" }}>
            {t("welcomeBack")}
          </p>
        </div>
        <form onSubmit={onSubmit}>
          <Card className="flex flex-col gap-4">
            <Input
              label={t("email")}
              type="email"
              placeholder={t("yourEmail")}
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              required
            />
            <Input
              label={t("password")}
              type="password"
              placeholder={t("enterPassword")}
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              required
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{t("rememberMe")}</span>
              </label>
              <Link to="/forgot-password" className="text-[13px]" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
                {t("forgotPassword")}
              </Link>
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "..." : t("signIn")}
            </Button>
          </Card>
        </form>
        <p className="text-center text-[13px] mt-4" style={{ color: "var(--eco-text-secondary)" }}>
          {t("dontHaveAccount")}{" "}
          <Link to="/register" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>{t("createAccount")}</Link>
        </p>
      </div>
    </div>
  );
}
