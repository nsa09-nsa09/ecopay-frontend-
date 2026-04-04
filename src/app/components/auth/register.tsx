import { useState } from "react";
import { Link } from "react-router";
import { Button, Input, Card } from "../ds-primitives";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { useI18n } from "../i18n-provider";

export function RegisterPage() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState("");
  const rules = [
    { label: "Min 8 characters", ok: pw.length >= 8 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(pw) },
    { label: "One number", ok: /\d/.test(pw) },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{t("createAccount")}</h1>
          <p className="text-[13px] mt-2" style={{ color: "var(--eco-text-secondary)" }}>
            {t("joinEcoSplit")}
          </p>
        </div>
        <Card className="flex flex-col gap-4">
          <Input label={t("displayName")} placeholder={t("exampleName")} />
          <Input label={t("email")} type="email" placeholder={t("yourEmail")} />
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
          <Button variant="primary" size="lg" className="w-full mt-2">{t("createAccount")}</Button>
        </Card>
        <p className="text-center text-[13px] mt-4" style={{ color: "var(--eco-text-secondary)" }}>
          {t("alreadyHaveAccount")}{" "}
          <Link to="/login" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>{t("signIn")}</Link>
        </p>
      </div>
    </div>
  );
}