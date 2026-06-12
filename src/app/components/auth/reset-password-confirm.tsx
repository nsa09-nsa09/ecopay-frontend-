import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button, Card, Input } from "../ds-primitives";
import { useAuth } from "./auth-provider";
import { ApiError } from "../../lib/api";
import { useI18n, type Language } from "../i18n-provider";

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === "ru" ? ru : l === "kz" ? kz : en;

export function ResetPasswordConfirmPage() {
  const { confirmPasswordReset } = useAuth();
  const { language } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!token) {
      setError(tx(language, "Токен сброса отсутствует или недействителен.", "Қалпына келтіру токені жоқ немесе жарамсыз.", "Reset token is missing or invalid."));
      return;
    }

    if (password.length < 8) {
      setFieldErrors({ newPassword: tx(language, "Минимум 8 символов", "Кем дегенде 8 таңба", "Password must be at least 8 characters") });
      return;
    }

    if (password !== confirm) {
      setFieldErrors({ confirmPassword: tx(language, "Пароли не совпадают", "Құпия сөздер сәйкес келмейді", "Passwords do not match") });
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(token, password);
      setDone(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.errors);
      } else {
        setError(tx(language, "Не удалось сбросить пароль.", "Құпия сөзді қалпына келтіру мүмкін болмады.", "Unable to reset the password right now."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>
            {tx(language, "Создайте новый пароль", "Жаңа құпия сөз жасаңыз", "Create a new password")}
          </h1>
          <p className="text-[13px] mt-2" style={{ color: "var(--eco-text-secondary)" }}>
            {tx(
              language,
              "Используйте надёжный пароль не короче 8 символов.",
              "Кемінде 8 таңбадан тұратын күшті құпия сөзді пайдаланыңыз.",
              "Use a strong password with at least 8 characters.",
            )}
          </p>
        </div>
        <Card>
          {done ? (
            <div className="flex flex-col gap-3 text-center">
              <p className="text-[14px]" style={{ color: "var(--eco-text)" }}>
                {tx(language, "Пароль успешно обновлён.", "Құпия сөз сәтті жаңартылды.", "Password updated successfully.")}
              </p>
              <p className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
                {tx(language, "Перенаправляем на вход...", "Кіруге бағытталудамыз...", "Redirecting to sign in...")}
              </p>
            </div>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <Input
                label={tx(language, "Новый пароль", "Жаңа құпия сөз", "New password")}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={fieldErrors.newPassword}
              />
              <Input
                label={tx(language, "Подтвердите пароль", "Құпия сөзді растаңыз", "Confirm password")}
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                error={fieldErrors.confirmPassword}
              />
              {error && (
                <p className="text-[12px]" style={{ color: "var(--eco-negative)" }}>
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full" loading={loading}>
                {tx(language, "Сохранить пароль", "Құпия сөзді сақтау", "Save password")}
              </Button>
            </form>
          )}
        </Card>
        <div className="text-center mt-4">
          <Link to="/login" className="text-[13px] inline-flex items-center gap-1" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
            <ArrowLeft size={14} /> {tx(language, "Назад ко входу", "Кіруге оралу", "Back to sign in")}
          </Link>
        </div>
      </div>
    </div>
  );
}
