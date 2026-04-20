import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Button, Input, Card } from "../ds-primitives";
import { useI18n } from "../i18n-provider";
import { useAuth } from "./auth-provider";
import { ApiError } from "../../lib/api";

export function LoginPage() {
  const { t } = useI18n();
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTarget = new URLSearchParams(location.search).get("redirect") || "/profile";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      await login(email, password);
      navigate(redirectTarget);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.errors);
      } else {
        setError("Unable to sign in right now.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{t("signIn")}</h1>
          <p className="text-[13px] mt-2" style={{ color: "var(--eco-text-secondary)" }}>
            {t("welcomeBack")}
          </p>
        </div>
        <Card>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              label={t("email")}
              type="email"
              placeholder={t("yourEmail")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={fieldErrors.email}
            />
            <Input
              label={t("password")}
              type="password"
              placeholder={t("enterPassword")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={fieldErrors.password}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{t("rememberMe")}</span>
              </label>
              <Link to="/forgot-password" className="text-[13px]" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
                {t("forgotPassword")}
              </Link>
            </div>
            {error && (
              <p className="text-[12px]" style={{ color: "var(--eco-negative)" }}>
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              {t("signIn")}
            </Button>
          </form>
        </Card>
        <p className="text-center text-[13px] mt-4" style={{ color: "var(--eco-text-secondary)" }}>
          {t("dontHaveAccount")}{" "}
          <Link to="/register" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>{t("createAccount")}</Link>
        </p>
      </div>
    </div>
  );
}
