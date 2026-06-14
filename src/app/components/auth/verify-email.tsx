import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Card, Button, Input } from "../ds-primitives";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { ApiError, resendVerificationEmailRequest, verifyEmailRequest } from "../../lib/api";
import { useI18n, type Language } from "../i18n-provider";

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === "ru" ? ru : l === "kz" ? kz : en;

type VerifyState =
  | { kind: "loading" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }
  | { kind: "missing" };

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const { language } = useI18n();
  const token = params.get("token");
  const [state, setState] = useState<VerifyState>(token ? { kind: "loading" } : { kind: "missing" });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    verifyEmailRequest(token)
      .then((msg) => {
        if (cancelled) return;
        const fallback = tx(language, "Email подтверждён.", "Email расталды.", "Email verified successfully.");
        setState({ kind: "success", message: typeof msg === "string" && msg ? msg : fallback });
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof ApiError
          ? err.message
          : tx(language, "Не удалось проверить ссылку.", "Сілтемені тексеру мүмкін болмады.", "Unable to verify this link.");
        setState({ kind: "error", message: msg });
      });
    return () => { cancelled = true; };
  }, [token, language]);

  return (
    <div className="max-w-[520px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Card className="flex flex-col items-center text-center gap-4 py-10">
        {state.kind === "loading" && (
          <>
            <Loader2 size={32} className="animate-spin" style={{ color: "var(--eco-primary)" }} />
            <h1 className="text-[20px]" style={{ color: "var(--eco-text)" }}>
              {tx(language, "Проверяем email…", "Email тексерілуде…", "Verifying your email…")}
            </h1>
          </>
        )}

        {state.kind === "success" && (
          <>
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--eco-success-100)" }}>
              <CheckCircle2 size={28} style={{ color: "var(--eco-positive)" }} />
            </div>
            <h1 className="text-[22px]" style={{ color: "var(--eco-text)" }}>
              {tx(language, "Email подтверждён", "Email расталды", "Email verified")}
            </h1>
            <p className="text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>{state.message}</p>
            <Link to="/login" style={{ textDecoration: "none" }}>
              <Button variant="primary">
                {tx(language, "Перейти ко входу", "Кіруге өту", "Go to sign in")}
              </Button>
            </Link>
          </>
        )}

        {state.kind === "error" && (
          <>
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--eco-danger-100)" }}>
              <XCircle size={28} style={{ color: "var(--eco-negative)" }} />
            </div>
            <h1 className="text-[22px]" style={{ color: "var(--eco-text)" }}>
              {tx(language, "Подтверждение не удалось", "Растау сәтсіз", "Verification failed")}
            </h1>
            <p className="text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>{state.message}</p>
            <ResendForm />
            <Link to="/login" style={{ textDecoration: "none" }}>
              <Button variant="ghost">
                {tx(language, "Назад ко входу", "Кіруге оралу", "Back to sign in")}
              </Button>
            </Link>
          </>
        )}

        {state.kind === "missing" && (
          <>
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--eco-warning-100)" }}>
              <Mail size={28} style={{ color: "var(--eco-warning-500)" }} />
            </div>
            <h1 className="text-[22px]" style={{ color: "var(--eco-text)" }}>
              {tx(language, "Нужна ссылка подтверждения", "Растау сілтемесі қажет", "Verification link required")}
            </h1>
            <p className="text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>
              {tx(
                language,
                "Эта страница ждёт параметр token. Используйте ссылку из письма с подтверждением или запросите новое ниже.",
                "Бұл бетке token параметрі қажет. Растау хатындағы сілтемені пайдаланыңыз немесе төменде жаңасын сұраңыз.",
                "This page expects a token parameter. Use the link in your verification email, or request a new one below.",
              )}
            </p>
            <ResendForm />
            <Link to="/login" style={{ textDecoration: "none" }}>
              <Button variant="ghost">
                {tx(language, "Назад ко входу", "Кіруге оралу", "Back to sign in")}
              </Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}

function ResendForm() {
  const { language } = useI18n();
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
      setMessage(tx(
        language,
        "Если такой аккаунт существует, новое письмо с подтверждением отправлено.",
        "Егер мұндай тіркелгі бар болса, жаңа растау хаты жіберілді.",
        "If that account exists, a new verification email has been sent.",
      ));
    } catch (err) {
      setError(err instanceof ApiError
        ? err.message
        : tx(language, "Не удалось отправить письмо повторно.", "Хатты қайта жіберу мүмкін болмады.", "Unable to resend verification email."));
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
        {tx(language, "Отправить ещё раз", "Қайта жіберу", "Resend verification email")}
      </Button>
      {message && <p className="text-[12px]" style={{ color: "var(--eco-positive)" }}>{message}</p>}
      {error && <p className="text-[12px]" style={{ color: "var(--eco-negative)" }}>{error}</p>}
    </div>
  );
}
