import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Card, Button, Input } from "../ds-primitives";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { ApiError, resendVerificationEmailRequest, verifyEmailRequest } from "../../lib/api";

type VerifyState =
  | { kind: "loading" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }
  | { kind: "missing" };

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<VerifyState>(token ? { kind: "loading" } : { kind: "missing" });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    verifyEmailRequest(token)
      .then((msg) => {
        if (cancelled) return;
        setState({ kind: "success", message: typeof msg === "string" && msg ? msg : "Email verified successfully." });
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof ApiError ? err.message : "Unable to verify this link.";
        setState({ kind: "error", message: msg });
      });
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="max-w-[520px] mx-auto px-6 py-16">
      <Card className="flex flex-col items-center text-center gap-4 py-10">
        {state.kind === "loading" && (
          <>
            <Loader2 size={32} className="animate-spin" style={{ color: "var(--eco-primary)" }} />
            <h1 className="text-[20px]" style={{ color: "var(--eco-text)" }}>Verifying your email…</h1>
          </>
        )}

        {state.kind === "success" && (
          <>
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--eco-success-100)" }}>
              <CheckCircle2 size={28} style={{ color: "var(--eco-positive)" }} />
            </div>
            <h1 className="text-[22px]" style={{ color: "var(--eco-text)" }}>Email verified</h1>
            <p className="text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>{state.message}</p>
            <Link to="/login" style={{ textDecoration: "none" }}>
              <Button variant="primary">Go to sign in</Button>
            </Link>
          </>
        )}

        {state.kind === "error" && (
          <>
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--eco-danger-100)" }}>
              <XCircle size={28} style={{ color: "var(--eco-negative)" }} />
            </div>
            <h1 className="text-[22px]" style={{ color: "var(--eco-text)" }}>Verification failed</h1>
            <p className="text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>{state.message}</p>
            <ResendForm />
            <Link to="/login" style={{ textDecoration: "none" }}>
              <Button variant="ghost">Back to sign in</Button>
            </Link>
          </>
        )}

        {state.kind === "missing" && (
          <>
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--eco-warning-100)" }}>
              <Mail size={28} style={{ color: "var(--eco-warning-500)" }} />
            </div>
            <h1 className="text-[22px]" style={{ color: "var(--eco-text)" }}>Verification link required</h1>
            <p className="text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>
              This page expects a <code>token</code> parameter. Use the link in your verification email, or request a new one below.
            </p>
            <ResendForm />
            <Link to="/login" style={{ textDecoration: "none" }}>
              <Button variant="ghost">Back to sign in</Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}

function ResendForm() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email.trim()) return;
    setSending(true);
    setMessage(null);
    setError(null);
    try {
      await resendVerificationEmailRequest(email.trim());
      setMessage("If that account exists, a new verification email has been sent.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to resend verification email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 mt-2">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
      />
      <Button variant="secondary" loading={sending} disabled={!email.trim()} onClick={handleResend}>
        Resend verification email
      </Button>
      {message && <p className="text-[12px]" style={{ color: "var(--eco-positive)" }}>{message}</p>}
      {error && <p className="text-[12px]" style={{ color: "var(--eco-negative)" }}>{error}</p>}
    </div>
  );
}
