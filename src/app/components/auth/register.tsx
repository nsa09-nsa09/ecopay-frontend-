import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button, Input, Card } from '../ds-primitives';
import { Checkbox } from '../ui/checkbox';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { useI18n, type Language } from '../i18n-provider';
import { useAuth } from './auth-provider';
import { VerifyPhoneStep } from './verify-phone-step';
import {
  ApiError,
  getLegalDocumentRequest,
  normalizePhone,
  type LegalDocumentDto,
} from '../../lib/api';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

// Pick the localized body/title for a legal document, falling back to Russian
// (canonical) then to any non-empty variant so the box never shows blank text.
function pickLocalized(
  doc: LegalDocumentDto | null,
  field: 'title' | 'body',
  language: Language,
): string {
  if (!doc) return '';
  const primary = doc[`${field}_${language}` as keyof LegalDocumentDto] as
    string | null | undefined;
  if (primary && primary.trim()) return primary;
  const ru = doc[`${field}_ru` as keyof LegalDocumentDto] as string | null | undefined;
  if (ru && ru.trim()) return ru;
  const kz = doc[`${field}_kz` as keyof LegalDocumentDto] as string | null | undefined;
  if (kz && kz.trim()) return kz;
  const en = doc[`${field}_en` as keyof LegalDocumentDto] as string | null | undefined;
  return (en ?? '') as string;
}

export function RegisterPage() {
  const { t, language } = useI18n();
  const { register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTarget = new URLSearchParams(location.search).get('redirect') || '/profile';

  // Once registration succeeds without an auto-verified session, we switch to
  // the SMS-code confirmation step and stop rendering the sign-up form.
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  // Registration is phone-based: email is optional and added later in the
  // profile (needed only for password recovery / email notifications).
  const [phone, setPhone] = useState('');
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState<LegalDocumentDto | null>(null);
  const [privacy, setPrivacy] = useState<LegalDocumentDto | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Load both documents once. If either fetch fails we leave the box empty —
  // the user can still see the fallback labels and the check is server-enforced.
  useEffect(() => {
    let cancelled = false;
    void getLegalDocumentRequest('terms')
      .then((data) => {
        if (!cancelled) setTerms(data);
      })
      .catch(() => {
        /* checkbox stays required either way */
      });
    void getLegalDocumentRequest('privacy')
      .then((data) => {
        if (!cancelled) setPrivacy(data);
      })
      .catch(() => {
        /* fallthrough */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rules = [
    { label: t('pwMin8'), ok: pw.length >= 8 },
    { label: t('pwUppercase'), ok: /[A-Z]/.test(pw) },
    { label: t('pwOneNumber'), ok: /\d/.test(pw) },
  ];

  const termsBody = pickLocalized(terms, 'body', language);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (pw !== confirm) {
      setFieldErrors({ confirmPassword: t('passwordsDoNotMatch') });
      return;
    }

    if (!accepted) {
      setError(t('mustAcceptTerms'));
      return;
    }

    const normalizedPhone = normalizePhone(phone);
    if (!/^\+7\d{10}$/.test(normalizedPhone)) {
      setFieldErrors({
        phone: tx(
          language,
          'Введите номер в формате +7XXXXXXXXXX',
          '+7XXXXXXXXXX форматында нөмір енгізіңіз',
          'Enter the number in +7XXXXXXXXXX format',
        ),
      });
      return;
    }

    setLoading(true);

    try {
      const result = await register(
        displayName,
        { phone: normalizedPhone },
        pw,
        true,
        terms?.version,
        privacy?.version,
      );
      if (result.kind === 'session') {
        navigate(redirectTarget);
      } else {
        // SMS confirmation required — advance to the code-entry step.
        setPendingPhone(result.identifier);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.errors);
      } else {
        setError(t('unableToCreateAccount'));
      }
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = accepted && !loading;

  // Second stage: the account exists but is unverified. Show the SMS-code form
  // and hand off to the profile once the code checks out.
  if (pendingPhone) {
    return (
      <VerifyPhoneStep
        phone={pendingPhone}
        onVerified={() => navigate(redirectTarget)}
        onBack={() => setPendingPhone(null)}
      />
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[24px]" style={{ color: 'var(--eco-text)' }}>
            {t('createAccount')}
          </h1>
          <p className="text-[13px] mt-2" style={{ color: 'var(--eco-text-secondary)' }}>
            {t('joinEcoSplit')}
          </p>
        </div>
        <Card>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              label={t('displayName')}
              placeholder={t('exampleName')}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              error={fieldErrors.displayName}
            />
            <Input
              label={tx(language, 'Телефон', 'Телефон', 'Phone')}
              type="tel"
              placeholder="+7 700 123 45 67"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              error={fieldErrors.phone}
              hint={tx(
                language,
                'Пришлём SMS с кодом подтверждения. Email можно добавить позже в профиле.',
                'Растау коды бар SMS жібереміз. Email-ді кейін профильде қосуға болады.',
                'We will text you a confirmation code. You can add an email later in your profile.',
              )}
            />
            <div className="flex flex-col gap-1.5">
              <label style={{ color: 'var(--eco-text)', fontSize: 14 }}>{t('password')}</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={pw}
                  onChange={(event) => setPw(event.target.value)}
                  placeholder={t('pwMin8')}
                  className="w-full px-3 py-2 pr-10 rounded-lg outline-none"
                  style={{
                    background: 'var(--eco-surface)',
                    border: `1px solid ${fieldErrors.password ? 'var(--eco-negative)' : 'var(--eco-border)'}`,
                    color: 'var(--eco-text)',
                    fontSize: 14,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {show ? (
                    <EyeOff size={16} style={{ color: 'var(--eco-text-tertiary)' }} />
                  ) : (
                    <Eye size={16} style={{ color: 'var(--eco-text-tertiary)' }} />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <span style={{ color: 'var(--eco-negative)', fontSize: 12 }}>
                  {fieldErrors.password}
                </span>
              )}
              <div className="flex flex-col gap-1 mt-1">
                {rules.map((rule) => (
                  <div
                    key={rule.label}
                    className="flex items-center gap-1.5 text-[12px]"
                    style={{ color: rule.ok ? 'var(--eco-positive)' : 'var(--eco-text-tertiary)' }}
                  >
                    {rule.ok ? <Check size={12} /> : <X size={12} />}
                    {rule.label}
                  </div>
                ))}
              </div>
            </div>
            <Input
              label={t('confirmPassword')}
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              error={fieldErrors.confirmPassword}
            />

            {/* Scrollable Terms preview + required acceptance checkbox. The
                text is rendered as plain (whitespace-pre-line) so paragraphs
                keep the newlines the backend stored. */}
            <div className="flex flex-col gap-2">
              <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {t('termsScrollHint')}
              </span>
              <div
                className="rounded-lg text-[12px] leading-relaxed whitespace-pre-line px-3 py-2"
                style={{
                  background: 'var(--eco-surface)',
                  border: '1px solid var(--eco-border)',
                  color: 'var(--eco-text-secondary)',
                  maxHeight: 220,
                  overflowY: 'auto',
                }}
              >
                {termsBody || t('loading')}
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <span className="mt-0.5">
                  <Checkbox
                    checked={accepted}
                    onCheckedChange={(v) => setAccepted(v === true)}
                    aria-label={t('agreeCheckboxLabel')}
                  />
                </span>
                <span
                  className="text-[12px] leading-snug"
                  style={{ color: 'var(--eco-text-secondary)' }}
                >
                  {t('agreeCheckboxLabel')}{' '}
                  <Link to="/terms" style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}>
                    {t('agreeTermsLink')}
                  </Link>{' '}
                  <span>&amp;</span>{' '}
                  <Link
                    to="/privacy"
                    style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
                  >
                    {t('agreePrivacyLink')}
                  </Link>
                </span>
              </label>
            </div>

            {error && (
              <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                {error}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              loading={loading}
              disabled={!canSubmit}
            >
              {t('createAccount')}
            </Button>
          </form>
        </Card>
        <p className="text-center text-[13px] mt-4" style={{ color: 'var(--eco-text-secondary)' }}>
          {t('alreadyHaveAccount')}{' '}
          <Link to="/login" style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}>
            {t('signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
