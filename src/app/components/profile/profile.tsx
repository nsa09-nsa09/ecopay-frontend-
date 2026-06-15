import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card, Badge, Button, Input, Modal, Skeleton } from "../ds-primitives";
import { Shield, UserRound, Mail, Star, Phone, CheckCircle2, Copy, Trash2, Upload, Search as SearchIcon, Home, CheckCheck, Wallet, PiggyBank, CalendarClock, MessageSquare, AlertTriangle, RefreshCw, TrendingUp, BarChart3 } from "lucide-react";
import { useAuth } from "../auth/auth-provider";
import { useI18n, type Language } from "../i18n-provider";
import { formatDate, formatDateTime } from "../../lib/datetime";
import {
  ApiError,
  deleteMyAccount,
  deleteMyAvatar,
  getMyDashboardRequest,
  requestPhoneCodeRequest,
  resendVerificationEmailRequest,
  uploadMyAvatar,
  verifyPhoneRequest,
  type MemberDashboardDto,
} from "../../lib/api";
import { MyServiceReviewCard } from "./my-service-review";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === "ru" ? ru : l === "kz" ? kz : en;

export function ProfilePage() {
  const { user, isAuthenticated, isReady, updateProfile, authorizedRequest, logout } = useAuth();
  const { language, t } = useI18n();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(user?.displayName ?? "");
  }, [user]);

  if (!isReady) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <Card>{tx(language, "Загрузка профиля...", "Профиль жүктелуде...", "Loading profile...")}</Card>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
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
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-[22px] sm:text-[24px] mb-6" style={{ color: "var(--eco-text)" }}>
        {tx(language, "Профиль", "Профиль", "Profile")}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col items-center text-center gap-4">
            <AvatarUploader />
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
            {user.publicId && (
              <Link to={`/u/${user.publicId}`} className="text-[12px]" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
                {t("viewMyPublicProfile")}
              </Link>
            )}
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

          <MemberDashboardCard />

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

// Must mirror the backend allowlist/limit (AvatarStorageService + AvatarUploadProperties):
// PNG/JPEG only, 5 MB. WEBP is not accepted server-side.
const ACCEPTED_AVATAR_TYPES = ["image/png", "image/jpeg"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function AvatarUploader() {
  const { user, refreshUser, authorizedRequest } = useAuth();
  const { language, t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (!user) return null;

  const initials = user.displayName
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  const displayAvatar = preview ?? user.avatar ?? null;

  const handleFile = async (file: File) => {
    setError(null);

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setError(tx(language, "Поддерживаются PNG и JPEG.", "PNG және JPEG қолдау көрсетіледі.", "PNG and JPEG are supported."));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError(tx(language, "Файл слишком большой (максимум 5 МБ).", "Файл тым үлкен (максимум 5 МБ).", "File is too large (max 5 MB)."));
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);
    try {
      await authorizedRequest((token) => uploadMyAvatar(file, token));
      await refreshUser();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t("loadFailedTitle"));
      }
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localUrl);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!user.avatar) return;
    setError(null);
    setUploading(true);
    try {
      await authorizedRequest((token) => deleteMyAvatar(token));
      await refreshUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("loadFailedTitle"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-[22px] overflow-hidden"
        style={{ background: "var(--eco-surface)", color: "var(--eco-text-secondary)" }}
      >
        {displayAvatar ? (
          <img src={displayAvatar} alt={user.displayName} className="w-full h-full object-cover" />
        ) : (
          initials || "?"
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_AVATAR_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={13} /> {t("avatarUpload")}
        </Button>
        {user.avatar && !uploading && (
          <Button variant="ghost" size="sm" onClick={() => void handleDelete()}>
            <Trash2 size={13} /> {t("avatarDelete")}
          </Button>
        )}
      </div>
      <span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
        {t("avatarHint")}
      </span>
      {error && <span className="text-[12px]" style={{ color: "var(--eco-negative)" }}>{error}</span>}
    </div>
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
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg outline-none text-[13px]"
          style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)", fontFamily: "monospace" }}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <Button variant="secondary" size="sm" className="shrink-0" onClick={() => void handleCopy()}>
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
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder={tx(language, "ссылка или хэш", "сілтеме немесе хэш", "link or hash")}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg outline-none text-[13px]"
          style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
        />
        <Button variant="primary" size="sm" className="shrink-0" onClick={submit}>{t("publicProfileSearchGo")}</Button>
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

function formatKzt(value: number | string | null | undefined): string {
  if (value == null) return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return `₸${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(num)}`;
}

function formatCount(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("ru-RU").format(value);
}

interface MemberStat {
  key: string;
  value: string;
  icon: typeof Home;
  variant: "info" | "success" | "warning" | "danger";
  hint?: string;
}

function MemberDashboardCard() {
  const { t, language } = useI18n();
  const { authorizedRequest, isAuthenticated } = useAuth();
  const [data, setData] = useState<MemberDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const dto = await authorizedRequest((token) => getMyDashboardRequest(token));
      setData(dto);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("memberDashboardLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const spendChartData = useMemo(() => {
    if (!data || !Array.isArray(data.recentEvents)) return [];
    const points = data.recentEvents
      .filter((event) => event.amountKzt != null)
      .map((event) => ({
        period: formatDate(event.createdAt, language),
        amount:
          typeof event.amountKzt === "string"
            ? Number(event.amountKzt)
            : Number(event.amountKzt ?? 0),
      }));
    // recent events arrive newest-first; reverse so the chart reads left→right.
    return points.reverse();
  }, [data, language]);

  const stats: MemberStat[] = data
    ? [
        { key: "memberStatActiveRooms", value: formatCount(data.joinedRoomsActive), icon: Home, variant: "info" },
        { key: "memberStatCompletedRooms", value: formatCount(data.joinedRoomsCompleted), icon: CheckCheck, variant: "success" },
        { key: "memberStatTotalJoined", value: formatCount(data.totalRoomsJoined), icon: BarChart3, variant: "info" },
        { key: "memberStatMonthlySpend", value: formatKzt(data.monthlySpendKzt), icon: Wallet, variant: "warning" },
        { key: "memberStatTotalSpent", value: formatKzt(data.totalSpentKzt), icon: TrendingUp, variant: "info" },
        { key: "memberStatTotalSaved", value: formatKzt(data.totalSavedKzt), icon: PiggyBank, variant: "success" },
        {
          key: "memberStatNextPayment",
          value: data.nextPaymentDate
            ? `${formatDate(data.nextPaymentDate, language)} · ${formatKzt(data.nextPaymentAmountKzt)}`
            : t("memberNoUpcomingPayment"),
          icon: CalendarClock,
          variant: "warning",
        },
        { key: "memberStatReputation", value: formatCount(typeof data.reputationScore === "string" ? Number(data.reputationScore) : data.reputationScore), icon: Star, variant: "success" },
        { key: "memberStatReviewsReceived", value: formatCount(data.reviewsReceived), icon: MessageSquare, variant: "info" },
        { key: "memberStatDisputes", value: formatCount(data.disputesAsMember), icon: AlertTriangle, variant: "danger" },
      ]
    : [];

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="flex items-center gap-2 text-[16px]" style={{ color: "var(--eco-text)" }}>
          <BarChart3 size={16} /> {t("memberDashboardTitle")}
        </h3>
        <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={13} /> {t("memberDashboardRefresh")}
        </Button>
      </div>

      {loading && !data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={70} />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="text-[13px]" style={{ color: "var(--eco-negative)" }}>{error}</div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.key} className="p-3 rounded-lg flex flex-col gap-2" style={{ background: "var(--eco-surface)" }}>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      background:
                        s.variant === "warning"
                          ? "var(--eco-warning-100)"
                          : s.variant === "danger"
                          ? "var(--eco-danger-100)"
                          : s.variant === "success"
                          ? "var(--eco-success-100)"
                          : "var(--eco-brand-50)",
                    }}
                  >
                    <Icon
                      size={13}
                      style={{
                        color:
                          s.variant === "warning"
                            ? "var(--eco-warning-500)"
                            : s.variant === "danger"
                            ? "var(--eco-danger-500)"
                            : s.variant === "success"
                            ? "var(--eco-positive)"
                            : "var(--eco-brand-600)",
                      }}
                    />
                  </div>
                  <div>
                    <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>{s.value}</div>
                    <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{t(s.key)}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {spendChartData.length > 0 && (
            <div>
              <div className="text-[13px] mb-2" style={{ color: "var(--eco-text-secondary)" }}>
                {t("memberSpendChartTitle")}
              </div>
              <div style={{ width: "100%", height: 180 }}>
                <ResponsiveContainer>
                  <LineChart data={spendChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="var(--eco-border)" strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fill: "var(--eco-text-tertiary)", fontSize: 11 }} />
                    <YAxis tick={{ fill: "var(--eco-text-tertiary)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--eco-bg)",
                        border: "1px solid var(--eco-border)",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "var(--eco-text)",
                      }}
                      formatter={(v: number | string) => formatKzt(v)}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      name={t("memberStatMonthlySpend")}
                      stroke="var(--eco-primary)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div>
            <div className="text-[13px] mb-2" style={{ color: "var(--eco-text-secondary)" }}>
              {t("memberRecentEvents")}
            </div>
            {data.recentEvents.length === 0 ? (
              <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("memberRecentEventsEmpty")}</div>
            ) : (
              <div className="flex flex-col gap-2">
                {data.recentEvents.slice(0, 8).map((event, idx) => (
                  <div
                    key={event.id ?? `${event.createdAt}-${idx}`}
                    className="flex items-start justify-between gap-3 text-[12px] py-2 border-b last:border-b-0"
                    style={{ borderColor: "var(--eco-border)" }}
                  >
                    <div className="min-w-0">
                      <div style={{ color: "var(--eco-text)" }}>
                        {event.eventType}
                        {event.roomTitle ? ` · ${event.roomTitle}` : event.roomId ? ` · #${event.roomId}` : ""}
                      </div>
                      <div style={{ color: "var(--eco-text-tertiary)" }}>{formatDateTime(event.createdAt, language)}</div>
                    </div>
                    {event.amountKzt != null && (
                      <div className="shrink-0" style={{ color: "var(--eco-text)" }}>{formatKzt(event.amountKzt)}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
