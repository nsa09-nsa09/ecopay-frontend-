import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card, Badge, Button, Input, Modal } from "../ds-primitives";
import { Shield, UserRound, Mail, Star, Phone, CheckCircle2, Copy, Trash2, Search as SearchIcon } from "lucide-react";
import { useAuth } from "../auth/auth-provider";
import { useI18n, type Language } from "../i18n-provider";
import { ApiError, deleteMyAccount, requestPhoneCodeRequest, resendVerificationEmailRequest, verifyPhoneRequest } from "../../lib/api";
import { MyServiceReviewCard } from "./my-service-review";

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === "ru" ? ru : l === "kz" ? kz : en;

export function ProfilePage() {
  const { user, isAuthenticated, isReady, updateProfile, authorizedRequest, logout } = useAuth();
  const { language, t } = useI18n();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(user?.displayName ?? "");
    setAvatar(user?.avatar ?? "");
  }, [user]);

  if (!isReady) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <Card>{tx(language, "Загрузка профиля...", "Профиль жүктелуде...", "Loading profile...")}</Card>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <Card className="flex flex-col gap-4 items-start">
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>
            {tx(language, "Профиль", "Профиль", "Profile")}
          </h1>
          <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            {tx(language, "Войдите, чтобы управлять аккаунтом EcoPay.", "EcoPay тіркелгісін басқару үшін кіріңіз.", "Sign in to manage your EcoPay account.")}
          </p>
          <Link to="/login" style={{ textDecoration: "none" }}>
            <Button>{tx(language, "Войти", "Кіру", "Sign in")}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const initials = user.displayName
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setFieldErrors({});
    setSaving(true);

    try {
      await updateProfile({
        displayName,
        avatar: avatar.trim() || null,
      });
      setMessage(tx(language, "Профиль обновлён.", "Профиль жаңартылды.", "Profile updated."));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.errors);
      } else {
        setError(tx(language, "Не удалось обновить профиль.", "Профильді жаңарту мүмкін болмады.", "Unable to update the profile right now."));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <h1 className="text-[24px] mb-6" style={{ color: "var(--eco-text)" }}>
        {tx(language, "Профиль", "Профиль", "Profile")}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-[20px]" style={{ background: "var(--eco-surface)", color: "var(--eco-text-secondary)" }}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <div className="text-[16px]" style={{ color: "var(--eco-text)" }}>{user.displayName}</div>
              <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{user.email}</div>
            </div>
            <div className="flex items-center gap-1" style={{ color: "var(--eco-warning)" }}>
              <Star size={16} fill="currentColor" />
              <span className="text-[16px]">{user.reputation ?? 0}</span>
              <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                {tx(language, "репутация", "репутация", "reputation")}
              </span>
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-[13px]">
              <span style={{ color: "var(--eco-text-secondary)" }}>{tx(language, "Роль", "Рөл", "Role")}</span>
              <Badge>{user.role}</Badge>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span style={{ color: "var(--eco-text-secondary)" }}>{tx(language, "Статус", "Мәртебесі", "Status")}</span>
              <Badge variant={user.status === "ACTIVE" ? "success" : "default"}>{user.status}</Badge>
            </div>
            <div className="flex items-center gap-1.5 px-1 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              <Shield size={13} /> {tx(
                language,
                "Сбросы пароля приходят в локальный MailDev в Docker.",
                "Құпия сөзді қалпына келтіру хаттары Docker ішіндегі MailDev-ке келеді.",
                "Password resets are sent through the local MailDev inbox in Docker.",
              )}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <h3 className="text-[16px]" style={{ color: "var(--eco-text)" }}>
                {tx(language, "Данные аккаунта", "Тіркелгі деректері", "Account Details")}
              </h3>
              <Input
                label={tx(language, "Отображаемое имя", "Көрсетілетін ат", "Display name")}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                error={fieldErrors.displayName}
              />
              <Input
                label={tx(language, "URL аватара", "Аватар URL", "Avatar URL")}
                value={avatar}
                onChange={(event) => setAvatar(event.target.value)}
                error={fieldErrors.avatar}
                hint={tx(language, "Опционально — публичный URL картинки", "Міндетті емес — суреттің ашық URL", "Optional public image URL")}
              />
              {error && (
                <p className="text-[12px]" style={{ color: "var(--eco-negative)" }}>
                  {error}
                </p>
              )}
              {message && (
                <p className="text-[12px]" style={{ color: "var(--eco-positive)" }}>
                  {message}
                </p>
              )}
              <Button type="submit" loading={saving}>
                {tx(language, "Сохранить изменения", "Өзгерістерді сақтау", "Save changes")}
              </Button>
            </form>
          </Card>

          <PhoneVerificationCard />

          <EmailVerificationCard email={user.email} />

          {user.publicId && <PublicLinkCard publicId={user.publicId} />}

          <FindUserCard />

          <MyServiceReviewCard />

          <Card className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-[16px]" style={{ color: "var(--eco-text)" }}>
              <Trash2 size={16} /> {t("deleteAccount")}
            </h3>
            <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{t("deleteAccountWarning")}</p>
            <Button variant="destructive" size="sm" className="self-start" onClick={() => setDeleteOpen(true)}>
              {t("deleteAccount")}
            </Button>
          </Card>

          <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t("deleteAccountTitle")}>
            <div className="flex flex-col gap-4">
              <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{t("deleteAccountWarning")}</p>
              {deleteError && <p className="text-[12px]" style={{ color: "var(--eco-negative)" }}>{deleteError}</p>}
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setDeleteOpen(false)}>
                  {tx(language, "Отмена", "Бас тарту", "Cancel")}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  loading={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    setDeleteError(null);
                    try {
                      await authorizedRequest((token) => deleteMyAccount(token));
                      try { await logout(); } catch { /* ignore */ }
                      navigate("/", { replace: true });
                    } catch (err) {
                      setDeleteError(err instanceof ApiError ? err.message : t("deleteAccountFailed"));
                    } finally {
                      setDeleting(false);
                    }
                  }}
                >
                  {t("deleteAccountConfirm")}
                </Button>
              </div>
            </div>
          </Modal>

          <Card className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg p-4" style={{ background: "var(--eco-surface)" }}>
              <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                <UserRound size={14} /> {tx(language, "Отображаемое имя", "Көрсетілетін ат", "Display name")}
              </div>
              <div className="mt-2 text-[15px]" style={{ color: "var(--eco-text)" }}>{user.displayName}</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: "var(--eco-surface)" }}>
              <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                <Mail size={14} /> Email
              </div>
              <div className="mt-2 text-[15px]" style={{ color: "var(--eco-text)" }}>{user.email}</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: "var(--eco-surface)" }}>
              <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                <Star size={14} /> {tx(language, "Репутация", "Репутация", "Reputation")}
              </div>
              <div className="mt-2 text-[15px]" style={{ color: "var(--eco-text)" }}>{user.reputation ?? 0}</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PhoneVerificationCard() {
  const { user, authorizedRequest, refreshUser } = useAuth();
  const { language } = useI18n();

  const [phone, setPhone] = useState(user?.phone ?? "+7");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setPhone(user?.phone ?? "+7");
  }, [user?.phone]);

  const verified = Boolean(user?.phoneVerified);
  const phoneChanged = verified && phone !== (user?.phone ?? "");

  const handleRequestCode = async () => {
    setMessage(null);
    setError(null);
    setFieldErrors({});
    setSending(true);

    try {
      await authorizedRequest((token) => requestPhoneCodeRequest(phone, token));
      setCodeSent(true);
      setMessage(tx(
        language,
        "Мы отправили 6-значный код на ваш телефон. Введите его ниже.",
        "Біз 6 таңбалы кодты телефоныңызға жібердік. Оны төменде енгізіңіз.",
        "We sent a 6-digit code to your phone. Enter it below.",
      ));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.errors);
      } else {
        setError(tx(language, "Не удалось отправить код.", "Кодты жіберу мүмкін болмады.", "Unable to send a code right now."));
      }
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setFieldErrors({});
    setVerifying(true);

    try {
      await authorizedRequest((token) => verifyPhoneRequest(phone, code, token));
      await refreshUser();
      setCode("");
      setCodeSent(false);
      setMessage(tx(language, "Номер телефона подтверждён.", "Телефон нөмірі расталды.", "Phone number verified."));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.errors);
      } else {
        setError(tx(language, "Не удалось проверить код.", "Кодты тексеру мүмкін болмады.", "Unable to verify the code right now."));
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[16px]" style={{ color: "var(--eco-text)" }}>
          <Phone size={16} /> {tx(language, "Номер телефона", "Телефон нөмірі", "Phone number")}
        </h3>
        {verified && !phoneChanged ? (
          <Badge variant="success">{tx(language, "Подтверждён", "Расталған", "Verified")}</Badge>
        ) : (
          <Badge>{tx(language, "Не подтверждён", "Расталмаған", "Not verified")}</Badge>
        )}
      </div>

      {verified && !phoneChanged && (
        <p className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--eco-positive)" }}>
          <CheckCircle2 size={14} /> {user?.phone} {tx(language, "подтверждён.", "расталған.", "is verified.")}
        </p>
      )}

      <Input
        label={tx(language, "Телефон", "Телефон", "Phone")}
        value={phone}
        onChange={(event) => {
          setPhone(event.target.value);
          setCodeSent(false);
        }}
        error={fieldErrors.phone}
        hint={tx(language, "Формат: +7XXXXXXXXXX", "Формат: +7XXXXXXXXXX", "Format: +7XXXXXXXXXX")}
        placeholder="+77001234567"
      />

      {!codeSent ? (
        <Button onClick={handleRequestCode} loading={sending} disabled={verified && !phoneChanged}>
          {phoneChanged
            ? tx(language, "Отправить код на новый номер", "Жаңа нөмірге код жіберу", "Send code to new number")
            : tx(language, "Отправить код подтверждения", "Растау кодын жіберу", "Send verification code")}
        </Button>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={handleVerify}>
          <Input
            label={tx(language, "Код подтверждения", "Растау коды", "Verification code")}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            error={fieldErrors.code}
            hint={tx(language, "6 цифр из SMS", "SMS-тен 6 цифр", "6-digit code from the SMS")}
            inputMode="numeric"
            placeholder="123456"
          />
          <div className="flex gap-2">
            <Button type="submit" loading={verifying}>
              {tx(language, "Подтвердить", "Растау", "Verify")}
            </Button>
            <Button type="button" variant="ghost" onClick={handleRequestCode} loading={sending}>
              {tx(language, "Отправить код ещё раз", "Кодты қайта жіберу", "Resend code")}
            </Button>
          </div>
        </form>
      )}

      {error && (
        <p className="text-[12px]" style={{ color: "var(--eco-negative)" }}>{error}</p>
      )}
      {message && (
        <p className="text-[12px]" style={{ color: "var(--eco-positive)" }}>{message}</p>
      )}
    </Card>
  );
}

function PublicLinkCard({ publicId }: { publicId: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/u/${publicId}` : `/u/${publicId}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — user can still copy manually */
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-[16px]" style={{ color: "var(--eco-text)" }}>
        <UserRound size={16} /> {t("publicProfileLink")}
      </h3>
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 px-3 py-2 rounded-lg outline-none text-[13px]"
          style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)", fontFamily: "monospace" }}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <Button variant="secondary" size="sm" onClick={() => void handleCopy()}>
          <Copy size={13} /> {copied ? t("publicProfileCopied") : t("publicProfileCopy")}
        </Button>
      </div>
      <Link to={`/u/${publicId}`} className="text-[12px]" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
        {t("publicProfile")} →
      </Link>
    </Card>
  );
}

function FindUserCard() {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const submit = () => {
    const raw = query.trim();
    if (!raw) return;
    let hash = raw;
    const match = raw.match(/\/u\/([^/?#\s]+)/);
    if (match) hash = match[1];
    navigate(`/u/${encodeURIComponent(hash)}`);
  };

  return (
    <Card className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-[16px]" style={{ color: "var(--eco-text)" }}>
        <SearchIcon size={16} /> {t("publicProfileSearchTitle")}
      </h3>
      <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{t("publicProfileSearchHint")}</p>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder={tx(language, "ссылка или хэш", "сілтеме немесе хэш", "link or hash")}
          className="flex-1 px-3 py-2 rounded-lg outline-none text-[13px]"
          style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
        />
        <Button variant="primary" size="sm" onClick={submit}>{t("publicProfileSearchGo")}</Button>
      </div>
    </Card>
  );
}

function EmailVerificationCard({ email }: { email: string }) {
  const { language } = useI18n();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setSending(true);
    setMessage(null);
    setError(null);
    try {
      await resendVerificationEmailRequest(email);
      setMessage(tx(
        language,
        "Если адрес не подтверждён, новое письмо отправлено.",
        "Егер email расталмаған болса, жаңа хат жіберілді.",
        "If unverified, a new verification email has been sent.",
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
    <Card className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-[16px]" style={{ color: "var(--eco-text)" }}>
        <Mail size={16} /> {tx(language, "Подтверждение email", "Email растау", "Email verification")}
      </h3>
      <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
        {language === "ru" ? (
          <>Не пришло письмо на <strong>{email}</strong>? Отправьте заново.</>
        ) : language === "kz" ? (
          <>Хат <strong>{email}</strong> мекенжайына келмеді ме? Қайта жіберіңіз.</>
        ) : (
          <>Didn't get the verification email for <strong>{email}</strong>? Resend it.</>
        )}
      </p>
      <Button variant="secondary" loading={sending} onClick={handleResend}>
        {tx(language, "Отправить письмо ещё раз", "Хатты қайта жіберу", "Resend verification email")}
      </Button>
      {message && <p className="text-[12px]" style={{ color: "var(--eco-positive)" }}>{message}</p>}
      {error && <p className="text-[12px]" style={{ color: "var(--eco-negative)" }}>{error}</p>}
    </Card>
  );
}
