import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button, Card } from "../ds-primitives";
import { useAuth } from "../../../lib/auth/AuthContext";
import { authApi } from "../../../lib/api/auth";
import { ApiError } from "../../../lib/api/client";

const RESEND_COOLDOWN_S = 60;

export function VerifyPhonePage() {
  const { user, refreshMe } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!user) return <Navigate to="/login" replace />;
  if (user.phoneVerified) return <Navigate to="/" replace />;
  if (!user.phone) return <Navigate to="/register" replace />;

  const phone = user.phone;
  const masked = phone.replace(/(\+7\d{2})\d{6}(\d{2})/, "$1******$2");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (code.length !== 6 || submitting) return;
    setSubmitting(true);
    try {
      await authApi.verifyPhone({ phone, code });
      toast.success("Phone verified");
      await refreshMe();
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Verification failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await authApi.requestPhoneCode({ phone });
      toast.success("Code resent");
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to resend";
      toast.error(msg);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>Verify your phone</h1>
          <p className="text-[13px] mt-2" style={{ color: "var(--eco-text-secondary)" }}>
            We sent a 6-digit code to <strong>{masked}</strong>
          </p>
        </div>
        <form onSubmit={onSubmit}>
          <Card className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label style={{ color: "var(--eco-text)", fontSize: 14 }}>Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                autoFocus
                className="w-full px-3 py-3 rounded-lg outline-none text-center"
                style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)", fontSize: 22, letterSpacing: 4 }}
                required
              />
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting || code.length !== 6}>
              {submitting ? "..." : "Verify"}
            </Button>
            <button
              type="button"
              onClick={onResend}
              disabled={cooldown > 0 || resending}
              className="text-[13px]"
              style={{
                color: cooldown > 0 ? "var(--eco-text-tertiary)" : "var(--eco-primary)",
                cursor: cooldown > 0 ? "not-allowed" : "pointer",
                background: "none",
                border: "none",
              }}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending..." : "Resend code"}
            </button>
          </Card>
        </form>
      </div>
    </div>
  );
}
