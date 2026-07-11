import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Button, Input, Card } from "../ds-primitives";
import { useI18n } from "../i18n-provider";
import { formatDateTime } from "../../lib/datetime";
import { useAuth } from "./auth-provider";
import { consumePersistedBanEvent } from "./auth-provider";
import { Ban } from "lucide-react";
import { ApiError } from "../../lib/api";

interface BanInfo {
  reason: string | null;
  bannedAt: string | null;
}

function parseBanFromQuery(search: string): BanInfo | null {
  const params = new URLSearchParams(search);
  if (params.get("banned") !== "1") return null;
  return {
    reason: params.get("reason"),
    bannedAt: params.get("bannedAt"),
  };
}

function parseBanFromApiError(err: ApiError): BanInfo | null {
  // Backend sends { code: "ACCOUNT_BANNED", message, errors: { reason, bannedAt } } or
  // a similar shape. We accept either errors.* or a JSON-encoded errors map.
  const code = (err.errors as Record<string, string>)?.code;
  // Use the raw server detail (not the sanitized .message) because the
  // ACCOUNT_BANNED marker is a backend code string, not user-facing text.
  const messageHasCode = /ACCOUNT[_ ]BANNED/i.test(err.serverMessage ?? "");
  if (code !== "ACCOUNT_BANNED" && !messageHasCode) return null;
  const reason = err.errors?.reason ?? null;
  const bannedAt = err.errors?.bannedAt ?? null;
  return { reason, bannedAt };
}

export function LoginPage() {
  const { t, language } = useI18n();
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTarget = new URLSearchParams(location.search).get("redirect") || "/profile";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);

  useEffect(() => {
    // Order of precedence: query params (just-arrived realtime redirect),
    // then sessionStorage (deep-link survival), then nothing.
    const fromQuery = parseBanFromQuery(location.search);
    if (fromQuery) {
      setBanInfo(fromQuery);
      return;
    }
    const persisted = consumePersistedBanEvent();
    if (persisted) setBanInfo(persisted);
  }, [location.search]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setBanInfo(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate(redirectTarget);
    } catch (err) {
      if (err instanceof ApiError) {
        const ban = parseBanFromApiError(err);
        if (ban) {
          setBanInfo(ban);
        } else {
          setError(err.message);
          setFieldErrors(err.errors);
        }
      } else {
        setError(t("unableToSignIn"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[26px]" style={{ color: "var(--eco-text)", fontWeight: 700 }}>{t("signIn")}</h1>
          <p className="text-[13px] mt-2" style={{ color: "var(--eco-text-secondary)" }}>
            {t("welcomeBack")}
          </p>
        </div>
        {banInfo && (
          <Card className="mb-4 flex flex-col gap-3" >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--eco-danger-100)" }}
              >
                <Ban size={15} style={{ color: "var(--eco-danger-500)" }} />
              </div>
              <h2 className="text-[16px]" style={{ color: "var(--eco-text)" }}>
                {t("bannedHeadline")}
              </h2>
            </div>
            <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
              {t("bannedDescription")}
            </p>
            {banInfo.reason && (
              <div className="text-[13px]">
                <span style={{ color: "var(--eco-text-tertiary)" }}>{t("bannedReasonLabel")}: </span>
                <span style={{ color: "var(--eco-text)" }}>{banInfo.reason}</span>
              </div>
            )}
            {banInfo.bannedAt && (
              <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                {t("bannedAtLabel")}: {formatDateTime(banInfo.bannedAt, language)}
              </div>
            )}
          </Card>
        )}
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
