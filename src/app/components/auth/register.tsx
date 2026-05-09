import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button, Input, Card } from "../ds-primitives";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { useI18n } from "../i18n-provider";
import { useAuth } from "../../../lib/auth/AuthContext";
import { ApiError } from "../../../lib/api/client";

const PHONE_RE = /^\+7\d{10}$/;

export function RegisterPage() {
  const { t } = useI18n();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [show, setShow] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+7");
  const [pw, setPw] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const rules = [
    { label: "Min 8 characters", ok: pw.length >= 8 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(pw) },
    { label: "One number", ok: /\d/.test(pw) },
  ];
  const allOk = rules.every((r) => r.ok);
  const phoneOk = PHONE_RE.test(phone);
  const canSubmit = allOk && phoneOk && displayName.trim().length > 0 && email.trim().length > 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password: pw,
        displayName: displayName.trim(),
        phone,
      });
      toast.success("Code sent to your phone");
      navigate("/verify-phone", { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Registration failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{t("createAccount")}</h1>
          <p className="text-[13px] mt-2" style={{ color: "var(--eco-text-secondary)" }}>
            {t("joinEcoPay")}
          </p>
        </div>
        <form onSubmit={onSubmit}>
          <Card className="flex flex-col gap-4">
            <Input
              label={t("displayName")}
              placeholder={t("exampleName")}
              value={displayName}
              onChange={(e: any) => setDisplayName(e.target.value)}
              required
            />
            <Input
              label={t("email")}
              type="email"
              placeholder={t("yourEmail")}
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label style={{ color: "var(--eco-text)", fontSize: 14 }}>Phone (KZ)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d+]/g, "");
                  setPhone(v.startsWith("+7") ? v.slice(0, 12) : "+7" + v.replace(/^\+?/, "").slice(0, 10));
                }}
                placeholder="+77001234567"
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)", fontSize: 14 }}
                required
              />
              {!phoneOk && phone.length > 2 && (
                <span className="text-[12px]" style={{ color: "var(--eco-warning)" }}>Format: +7 followed by 10 digits</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label style={{ color: "var(--eco-text)", fontSize: 14 }}>{t("password")}</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 pr-10 rounded-lg outline-none"
                  style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)", fontSize: 14 }}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {show ? <EyeOff size={16} style={{ color: "var(--eco-text-tertiary)" }} /> : <Eye size={16} style={{ color: "var(--eco-text-tertiary)" }} />}
                </button>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                {rules.map((r) => (
                  <div key={r.label} className="flex items-center gap-1.5 text-[12px]" style={{ color: r.ok ? "var(--eco-positive)" : "var(--eco-text-tertiary)" }}>
                    {r.ok ? <Check size={12} /> : <X size={12} />}
                    {r.label}
                  </div>
                ))}
              </div>
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" disabled={submitting || !canSubmit}>
              {submitting ? "..." : t("createAccount")}
            </Button>
          </Card>
        </form>
        <p className="text-center text-[13px] mt-4" style={{ color: "var(--eco-text-secondary)" }}>
          {t("alreadyHaveAccount")}{" "}
          <Link to="/login" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>{t("signIn")}</Link>
        </p>
      </div>
    </div>
  );
}
