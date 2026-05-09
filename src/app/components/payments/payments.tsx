import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, type Location } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Badge, Button, SkeletonCard } from "../ds-primitives";
import { GapBanner } from "../../../lib/ui/GapBanner";
import { useI18n, type Language } from "../i18n-provider";
import {
  CheckCircle2, XCircle, Shield, ArrowRight, CreditCard,
  Lock, RefreshCw, MessageSquare,
  ArrowLeft, Phone, Mail, MapPin, Timer, Loader2,
} from "lucide-react";
import { paymentsApi } from "../../../lib/api/payments";
import { roomsApi } from "../../../lib/api/rooms";
import type { PaymentIntentResponse, RoomResponse } from "../../../lib/api/types";

// ─── Localized text helper ───
type L = Language;
const tx = (l: L, ru: string, kz: string, en: string) =>
  l === "ru" ? ru : l === "kz" ? kz : en;

// ─── Flow state passed via react-router location.state ───
interface PaymentFlowState {
  roomMemberId?: string;
  roomId?: string;
  intentId?: string;
  amount?: number;
  currency?: string;
}

function useFlowState(): PaymentFlowState {
  const location = useLocation() as Location<PaymentFlowState | null>;
  return (location.state ?? {}) as PaymentFlowState;
}

// ─── Payment footer (used on payment screens only) ───
function PaymentFooter({ lang }: { lang: L }) {
  const links = [
    { label: tx(lang, "Публичная оферта", "Жария оферта", "Public Offer"), href: "/terms" },
    { label: tx(lang, "Реквизиты", "Деректемелер", "Company Details"), href: "/about" },
    { label: tx(lang, "Политика конфиденциальности", "Құпиялылық саясаты", "Privacy Policy"), href: "/privacy" },
    { label: tx(lang, "Порядок оплаты", "Төлем тәртібі", "Payment Procedure"), href: "/terms" },
  ];
  return (
    <div className="mt-12 pt-6 border-t" style={{ borderColor: "var(--eco-border)" }}>
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
        {links.map((l) => (
          <Link key={l.label} to={l.href} className="text-[12px]" style={{ color: "var(--eco-text-tertiary)", textDecoration: "none" }}>
            {l.label}
          </Link>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
        <span className="flex items-center gap-1.5"><Phone size={11} /> +7 (727) 000-00-00</span>
        <span className="flex items-center gap-1.5"><Mail size={11} /> support@ecopay.kz</span>
        <span className="flex items-center gap-1.5"><MapPin size={11} /> {tx(lang, "Алматы, Казахстан", "Алматы, Қазақстан", "Almaty, Kazakhstan")}</span>
      </div>
      <div className="text-[11px] mt-3" style={{ color: "var(--eco-text-tertiary)" }}>
        {tx(lang, "© 2026 EcoPay · ТОО «Apex Digital»", "© 2026 EcoPay · «Apex Digital» ЖШС", "© 2026 EcoPay · Apex Digital LLP")}
      </div>
    </div>
  );
}

// ─── Stepper ───
function Stepper({ steps, current, lang }: { steps: [string, string, string][]; current: number; lang: L }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((step, i) => {
        const label = tx(lang, step[0], step[1], step[2]);
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[12px]"
                style={{
                  background: done ? "var(--eco-positive)" : active ? "var(--eco-primary)" : "var(--eco-neutral-100)",
                  color: done || active ? "white" : "var(--eco-text-tertiary)",
                }}
              >
                {done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className="text-[12px] hidden sm:inline" style={{ color: active ? "var(--eco-text)" : "var(--eco-text-tertiary)" }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px mx-3" style={{ background: done ? "var(--eco-positive)" : "var(--eco-border)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Trust block ───
function TrustBlock({ lang }: { lang: L }) {
  return (
    <div className="flex flex-col gap-3 mt-4">
      <div className="flex items-center gap-4">
        <div className="px-3 py-1.5 rounded" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
          <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>VISA</span>
        </div>
        <div className="px-3 py-1.5 rounded" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
          <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>Mastercard</span>
        </div>
        <div className="px-3 py-1.5 rounded" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
          <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>Freedom Pay</span>
        </div>
      </div>
      <div className="flex items-start gap-1.5 text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
        <Lock size={11} className="mt-0.5 shrink-0" />
        {tx(lang,
          "Безопасная обработка платежей. Повторные платежи защищены от двойного списания.",
          "Қауіпсіз төлем өңдеу. Қайта төлемдер қос есептен шығарудан қорғалған.",
          "Secure payment processing. Retry-safe payments (no double charge)."
        )}
      </div>
    </div>
  );
}

function MissingFlowState({ lang }: { lang: L }): ReactNode {
  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Card className="flex flex-col items-center text-center gap-4 py-10">
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--eco-warning-100)" }}>
          <RefreshCw size={20} style={{ color: "var(--eco-warning)" }} />
        </div>
        <div className="text-[16px]" style={{ color: "var(--eco-text)" }}>
          {tx(lang,
            "Сессия оплаты не найдена",
            "Төлем сессиясы табылмады",
            "Payment session not found"
          )}
        </div>
        <div className="text-[13px] max-w-sm" style={{ color: "var(--eco-text-secondary)" }}>
          {tx(lang,
            "Откройте комнату из списка «Мои комнаты» и нажмите «Оплатить».",
            "«Менің бөлмелерім» тізімінен бөлмені ашып, «Төлеу» басыңыз.",
            "Open the room from My Rooms and tap “Pay” to start a new checkout."
          )}
        </div>
        <Link to="/rooms" style={{ textDecoration: "none" }}>
          <Button variant="primary" size="md">
            {tx(lang, "Мои комнаты", "Менің бөлмелерім", "My Rooms")}
          </Button>
        </Link>
      </Card>
    </div>
  );
}

function priceBreakdown(room: RoomResponse) {
  const share = room.pricePerMember;
  const fee = Math.round(share * 0.08);
  const total = share + fee;
  return { share, fee, total };
}

function currencySign(currency?: string): string {
  if (!currency || currency === "KZT") return "₸";
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  return currency + " ";
}

// ─── 1) Room Details with Pricing Box ───
export function PaymentRoomDetailsPage() {
  const { language } = useI18n();
  const l = language as L;
  const { roomId, roomMemberId } = useFlowState();

  const roomQ = useQuery({
    queryKey: ["rooms", roomId],
    queryFn: () => roomsApi.get(roomId!),
    enabled: !!roomId,
  });

  if (!roomId || !roomMemberId) return <MissingFlowState lang={l} />;

  if (roomQ.isLoading) {
    return (
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
        <SkeletonCard />
      </div>
    );
  }

  if (roomQ.isError || !roomQ.data) {
    return (
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
        <Card className="flex flex-col items-center text-center gap-4 py-10">
          <XCircle size={28} style={{ color: "var(--eco-negative)" }} />
          <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>
            {tx(l, "Не удалось загрузить комнату", "Бөлмені жүктеу мүмкін емес", "Couldn't load room")}
          </div>
          <Button variant="secondary" size="md" onClick={() => roomQ.refetch()}>
            {tx(l, "Повторить", "Қайталау", "Retry")}
          </Button>
        </Card>
      </div>
    );
  }

  const room = roomQ.data;
  const { share, fee, total } = priceBreakdown(room);
  const sign = currencySign(room.currency);

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Link to="/rooms" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-text-tertiary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> {tx(l, "Назад к комнатам", "Бөлмелерге оралу", "Back to rooms")}
      </Link>

      <h1 className="text-[24px] mb-2" style={{ color: "var(--eco-text)" }}>{room.name}</h1>
      <div className="text-[13px] mb-6" style={{ color: "var(--eco-text-tertiary)" }}>
        {[room.operator, room.serviceName, `${room.filled}/${room.seats} ${tx(l, "мест", "орын", "seats")}`].filter(Boolean).join(" · ")}
      </div>

      <Card className="flex flex-col gap-4 mb-6">
        <h3 className="text-[16px]" style={{ color: "var(--eco-text)" }}>{tx(l, "Стоимость участия", "Қатысу құны", "Participation Cost")}</h3>

        <div className="flex flex-col gap-2">
          {[
            { label: tx(l, "Доля участника", "Қатысушы үлесі", "Participant share"), value: `${sign}${share.toLocaleString()}` },
            { label: tx(l, "Комиссия платформы (8%)", "Платформа комиссиясы (8%)", "Platform fee (8%)"), value: `${sign}${fee.toLocaleString()}` },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between text-[14px]">
              <span style={{ color: "var(--eco-text-secondary)" }}>{row.label}</span>
              <span style={{ color: "var(--eco-text)" }}>{row.value}</span>
            </div>
          ))}
          <div className="border-t pt-2 mt-1 flex items-center justify-between" style={{ borderColor: "var(--eco-border)" }}>
            <span className="text-[15px]" style={{ color: "var(--eco-text)" }}>{tx(l, "Итого к оплате", "Төлем жиыны", "Total to pay now")}</span>
            <span className="text-[18px]" style={{ color: "var(--eco-primary)" }}>{sign}{total.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "var(--eco-surface)" }}>
          <Shield size={13} className="mt-0.5 shrink-0" style={{ color: "var(--eco-text-tertiary)" }} />
          <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
            {tx(l,
              "Средства могут быть удержаны до подтверждения доступа владельцем.",
              "Қаражат иесі қолжетімділікті растағанша ұсталуы мүмкін.",
              "Funds may be held until access is confirmed by the room owner."
            )}
          </span>
        </div>
      </Card>

      <Link
        to="/payment/checkout"
        state={{ roomMemberId, roomId, amount: total, currency: room.currency }}
        style={{ textDecoration: "none" }}
      >
        <Button variant="primary" size="lg" className="w-full">
          {tx(l, "Перейти к оплате", "Төлемге өту", "Proceed to Payment")} <ArrowRight size={15} />
        </Button>
      </Link>

      <PaymentFooter lang={l} />
    </div>
  );
}

// ─── 2) Join / Checkout ───
export function PaymentCheckoutPage() {
  const { language } = useI18n();
  const l = language as L;
  const navigate = useNavigate();
  const flow = useFlowState();
  const [selectedMethod, setSelectedMethod] = useState("freedom");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { roomMemberId, roomId, amount, currency } = flow;

  const [saveCard, setSaveCard] = useState(false);

  const payMutation = useMutation({
    mutationFn: () =>
      paymentsApi.createIntent(roomMemberId!, {
        idempotencyKey: `${roomMemberId}-${Date.now()}`,
        saveCard,
      }),
    onSuccess: (intent: PaymentIntentResponse) => {
      if (intent.requiresRedirect && intent.paymentUrl) {
        window.location.href = intent.paymentUrl;
        return;
      }
      // Saved-card charge — synchronous result; or already failed
      navigate(intent.status === "SUCCESS" ? "/payment/confirmation" : "/payment/pending", {
        state: {
          ...flow,
          intentId: intent.id,
          amount: intent.amount,
          currency: intent.currency,
        },
      });
    },
    onError: (err: unknown) => {
      const m =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ??
        (err as { message?: string })?.message ??
        "Payment failed. Please try again.";
      setErrorMsg(m);
    },
  });

  if (!roomId || !roomMemberId || amount == null) return <MissingFlowState lang={l} />;

  const sign = currencySign(currency);
  const methods = [
    { id: "freedom", label: "Freedom Pay", desc: tx(l, "Банковская карта", "Банк картасы", "Bank card"), icon: CreditCard },
    { id: "visa", label: tx(l, "Сохранённая карта", "Сақталған карта", "Saved card"), desc: "Visa ****", icon: CreditCard },
  ];

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Link
        to="/payment/room"
        state={flow}
        className="inline-flex items-center gap-1 text-[13px] mb-6"
        style={{ color: "var(--eco-text-tertiary)", textDecoration: "none" }}
      >
        <ArrowLeft size={14} /> {tx(l, "Назад", "Артқа", "Back")}
      </Link>

      <h1 className="text-[24px] mb-6" style={{ color: "var(--eco-text)" }}>{tx(l, "Оплата", "Төлем", "Checkout")}</h1>

      <Stepper
        steps={[
          ["Детали", "Мәліметтер", "Details"],
          ["Оплата", "Төлем", "Payment"],
          ["Подтверждение", "Растау", "Confirmation"],
        ]}
        current={1}
        lang={l}
      />

      <Card className="flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{tx(l, "К оплате", "Төлем сомасы", "Amount due")}</span>
          <span className="text-[15px]" style={{ color: "var(--eco-primary)" }}>{sign}{amount.toLocaleString()}</span>
        </div>
        <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
          {tx(l, "Ваша доля + комиссия", "Сіздің үлесіңіз + комиссия", "Your share + platform fee")}
        </div>
      </Card>

      <h3 className="text-[15px] mb-3" style={{ color: "var(--eco-text)" }}>{tx(l, "Способ оплаты", "Төлем тәсілі", "Payment Method")}</h3>
      <div className="flex flex-col gap-2 mb-6">
        {methods.map((m) => {
          const Icon = m.icon;
          const active = selectedMethod === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedMethod(m.id)}
              className="flex items-center gap-3 p-4 rounded-xl cursor-pointer text-left transition-all"
              style={{
                background: active ? "var(--eco-brand-50)" : "var(--eco-surface-raised)",
                border: `2px solid ${active ? "var(--eco-primary)" : "var(--eco-border)"}`,
              }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--eco-surface)" }}>
                <Icon size={18} style={{ color: active ? "var(--eco-primary)" : "var(--eco-text-tertiary)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{m.label}</div>
                <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{m.desc}</div>
              </div>
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: active ? "var(--eco-primary)" : "var(--eco-border)" }}>
                {active && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--eco-primary)" }} />}
              </div>
            </button>
          );
        })}
      </div>

      {selectedMethod === "freedom" && (
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>Freedom Pay</span>
            <Badge variant="info">{tx(l, "Платёжный шлюз", "Төлем шлюзі", "Payment Gateway")}</Badge>
          </div>
          <div className="p-6 rounded-lg text-center" style={{ background: "var(--eco-surface)", border: "1px dashed var(--eco-border)" }}>
            <CreditCard size={24} className="mx-auto mb-2" style={{ color: "var(--eco-text-tertiary)" }} />
            <div className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
              {tx(l,
                "Форма Freedom Pay откроется при нажатии «Оплатить»",
                "Freedom Pay формасы «Төлеу» басқанда ашылады",
                "Freedom Pay form will open on 'Pay securely' click"
              )}
            </div>
          </div>
        </Card>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg flex items-start gap-2 text-[13px]" style={{ background: "var(--eco-danger-100)", color: "var(--eco-danger-500)" }}>
          <XCircle size={14} className="mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        loading={payMutation.isPending}
        disabled={payMutation.isPending}
        onClick={() => {
          setErrorMsg(null);
          payMutation.mutate();
        }}
      >
        <Lock size={15} /> {tx(l, "Оплатить безопасно", "Қауіпсіз төлеу", "Pay securely")} — {sign}{amount.toLocaleString()}
      </Button>

      <TrustBlock lang={l} />

      <PaymentFooter lang={l} />
    </div>
  );
}

// ─── 3) Payment Confirmation ───
export function PaymentConfirmationPage() {
  const { language } = useI18n();
  const l = language as L;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const flow = useFlowState();
  const intentId = flow.intentId;
  const [hasFired, setHasFired] = useState(false);

  const confirmMutation = useMutation({
    mutationFn: () =>
      paymentsApi.confirmSuccess(intentId!, { externalTransactionId: undefined }),
    onSuccess: (intent: PaymentIntentResponse) => {
      if (flow.roomId) {
        qc.invalidateQueries({ queryKey: ["rooms", flow.roomId] });
        qc.invalidateQueries({ queryKey: ["rooms", flow.roomId, "membership", "me"] });
      }
      if (intent.status === "FAILED") {
        navigate("/rooms/payment-failed", { replace: true });
      } else if (intent.status === "PENDING") {
        navigate("/payment/pending", { state: { ...flow, intentId: intent.id }, replace: true });
      }
    },
  });

  useEffect(() => {
    if (!intentId || hasFired) return;
    setHasFired(true);
    confirmMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intentId]);

  if (!intentId) return <MissingFlowState lang={l} />;

  const status = confirmMutation.data?.status;
  const isPending = confirmMutation.isPending || (!confirmMutation.data && !confirmMutation.isError);
  const isSuccess = status === "SUCCESS";
  const isFailed = confirmMutation.isError || status === "FAILED";
  const sign = currencySign(confirmMutation.data?.currency ?? flow.currency);
  const amount = confirmMutation.data?.amount ?? flow.amount;

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Stepper
        steps={[
          ["Детали", "Мәліметтер", "Details"],
          ["Оплата", "Төлем", "Payment"],
          ["Подтверждение", "Растау", "Confirmation"],
        ]}
        current={2}
        lang={l}
      />

      <Card className="flex flex-col items-center text-center gap-5 py-10">
        {isPending && (
          <>
            <Loader2 size={32} className="animate-spin" style={{ color: "var(--eco-primary)" }} />
            <div className="text-[16px]" style={{ color: "var(--eco-text)" }}>
              {tx(l, "Подтверждаем платёж...", "Төлем расталуда...", "Confirming your payment...")}
            </div>
          </>
        )}

        {isSuccess && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--eco-success-100)" }}>
              <CheckCircle2 size={32} style={{ color: "var(--eco-positive)" }} />
            </div>
            <div>
              <h2 className="text-[22px]" style={{ color: "var(--eco-text)" }}>
                {tx(l, "Оплата прошла успешно", "Төлем сәтті өтті", "Payment Successful")}
              </h2>
              <p className="text-[14px] mt-2 max-w-sm mx-auto" style={{ color: "var(--eco-text-secondary)" }}>
                {tx(l,
                  `Ваш платёж ${amount ? `на сумму ${sign}${amount.toLocaleString()}` : ""} принят. Средства будут удержаны до подтверждения доступа.`,
                  `Төлеміңіз ${amount ? `${sign}${amount.toLocaleString()} сомасына` : ""} қабылданды. Қолжетімділік расталғанша қаражат ұсталады.`,
                  `Your payment ${amount ? `of ${sign}${amount.toLocaleString()}` : ""} has been received. Funds will be held until access is confirmed.`
                )}
              </p>
            </div>
            <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              Ref: {intentId}
            </div>
            <Link
              to={flow.roomId ? `/rooms/member/${flow.roomId}` : "/rooms"}
              state={flow}
              style={{ textDecoration: "none" }}
            >
              <Button variant="primary" size="lg">
                {tx(l, "Перейти к комнате", "Бөлмеге өту", "Go to Room")} <ArrowRight size={14} />
              </Button>
            </Link>
          </>
        )}

        {isFailed && !isPending && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--eco-danger-100)" }}>
              <XCircle size={32} style={{ color: "var(--eco-negative)" }} />
            </div>
            <div>
              <h2 className="text-[22px]" style={{ color: "var(--eco-text)" }}>
                {tx(l, "Оплата не прошла", "Төлем өтпеді", "Payment Failed")}
              </h2>
              <p className="text-[14px] mt-2 max-w-sm mx-auto" style={{ color: "var(--eco-text-secondary)" }}>
                {tx(l,
                  "Произошла ошибка при обработке платежа. Вы можете безопасно повторить попытку — двойного списания не будет.",
                  "Төлемді өңдеу кезінде қате орын алды. Қайта әрекет жасау қауіпсіз — қос есептен шығару болмайды.",
                  "An error occurred processing your payment. You can safely retry — idempotent processing ensures no double charge."
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/payment/checkout" state={flow} style={{ textDecoration: "none" }}>
                <Button variant="primary" size="lg">
                  <RefreshCw size={14} /> {tx(l, "Повторить оплату", "Төлемді қайталау", "Retry Payment")}
                </Button>
              </Link>
              <Link to="/support/new" style={{ textDecoration: "none" }}>
                <Button variant="secondary" size="lg">
                  {tx(l, "Поддержка", "Қолдау", "Support")}
                </Button>
              </Link>
            </div>
          </>
        )}
      </Card>

      <PaymentFooter lang={l} />
    </div>
  );
}

// ─── 4) Payment Pending / Hold Status ───
export function PaymentPendingPage() {
  const { language } = useI18n();
  const l = language as L;
  const flow = useFlowState();
  const intentId = flow.intentId;
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Poll the payment intent every 3s while it's still PENDING.
  const intentQuery = useQuery({
    queryKey: ["payment", "intent", intentId],
    queryFn: () => paymentsApi.getIntent(intentId!),
    enabled: Boolean(intentId),
    refetchInterval: (q) => {
      const status = (q.state.data as PaymentIntentResponse | undefined)?.status;
      return status === "PENDING" || status === undefined ? 3000 : false;
    },
  });

  useEffect(() => {
    const status = intentQuery.data?.status;
    if (!status) return;
    if (status === "SUCCESS") {
      if (flow.roomId) {
        qc.invalidateQueries({ queryKey: ["rooms", flow.roomId, "membership", "me"] });
      }
      navigate("/payment/confirmation", { state: { ...flow, intentId }, replace: true });
    } else if (status === "FAILED") {
      navigate("/rooms/payment-failed", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intentQuery.data?.status]);

  if (!intentId) return <MissingFlowState lang={l} />;

  const timeline = [
    { label: tx(l, "Оплата принята", "Төлем қабылданды", "Payment Successful"), done: true, time: "" },
    { label: tx(l, "Ожидание предоставления доступа", "Қолжетімділік күтілуде", "Waiting for owner access grant"), done: false, active: true, time: tx(l, "SLA: 48ч", "SLA: 48с", "SLA: 48h") },
    { label: tx(l, "Подтверждение получения доступа", "Қолжетімділікті растау", "Confirm access received"), done: false, time: "" },
    { label: tx(l, "Активация", "Белсендіру", "Activation"), done: false, time: "" },
  ];

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Link to="/rooms" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-text-tertiary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> {tx(l, "Мои комнаты", "Менің бөлмелерім", "My Rooms")}
      </Link>

      <div className="flex items-center gap-2 mb-6">
        <Badge variant="info">{tx(l, "Средства удержаны", "Қаражат ұсталды", "Funds on Hold")}</Badge>
        <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{intentId}</span>
      </div>

      <Card className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--eco-warning-100)" }}>
          <Timer size={20} style={{ color: "var(--eco-warning-500)" }} />
        </div>
        <div className="flex-1">
          <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>
            {tx(l, "Время ожидания доступа", "Қолжетімділік күту уақыты", "Access Grant SLA Timer")}
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>
            {tx(l, "Окно 48 часов с момента оплаты", "Төлемнен бастап 48 сағат терезесі", "48-hour window from payment")}
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-0 mb-6">
        <h3 className="text-[15px] mb-4" style={{ color: "var(--eco-text)" }}>{tx(l, "Статус процесса", "Процесс мәртебесі", "Process Status")}</h3>
        {timeline.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className="w-3 h-3 rounded-full shrink-0 mt-1"
                style={{
                  background: step.done ? "var(--eco-positive)" : step.active ? "var(--eco-primary)" : "var(--eco-neutral-100)",
                  border: step.active ? "2px solid var(--eco-primary)" : "none",
                }}
              />
              {i < timeline.length - 1 && (
                <div className="w-px flex-1 my-1" style={{ background: step.done ? "var(--eco-positive)" : "var(--eco-border)", minHeight: 32 }} />
              )}
            </div>
            <div className="pb-4">
              <div className="text-[13px]" style={{ color: step.done || step.active ? "var(--eco-text)" : "var(--eco-text-tertiary)" }}>{step.label}</div>
              {step.time && <div className="text-[11px] mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{step.time}</div>}
            </div>
          </div>
        ))}
      </Card>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Button
          variant="primary"
          size="md"
          className="flex-1"
          loading={intentQuery.isFetching}
          disabled={intentQuery.isFetching}
          onClick={() => intentQuery.refetch()}
        >
          <RefreshCw size={14} /> {tx(l, "Проверить статус", "Мәртебені тексеру", "Check Status")}
        </Button>
        <Link to="/support/new" style={{ textDecoration: "none" }}>
          <Button variant="secondary" size="md" className="w-full">
            <MessageSquare size={14} /> {tx(l, "Создать обращение", "Қолдау сұрауын жасау", "Create Support Ticket")}
          </Button>
        </Link>
      </div>

      <PaymentFooter lang={l} />
    </div>
  );
}

// ─── 5) Refund Status (no API yet) ───
export function RefundStatusPage() {
  const { language } = useI18n();
  const l = language as L;

  const steps = useMemo(
    () => [
      { label: tx(l, "Запрошен", "Сұралды", "Requested"), done: true, time: "" },
      { label: tx(l, "На рассмотрении", "Қарастырылуда", "In Review"), done: false, active: true, time: tx(l, "Ожидание", "Күтілуде", "Pending") },
      { label: tx(l, "Одобрен", "Мақұлданды", "Approved"), done: false, time: "" },
      { label: tx(l, "Отправлен", "Жіберілді", "Sent"), done: false, time: "" },
    ],
    [l]
  );

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Link to="/rooms" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-text-tertiary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> {tx(l, "Мои комнаты", "Менің бөлмелерім", "My Rooms")}
      </Link>

      <h1 className="text-[24px] mb-2" style={{ color: "var(--eco-text)" }}>{tx(l, "Статус возврата", "Қайтару мәртебесі", "Refund Status")}</h1>

      <Card className="flex flex-col gap-0 mb-6">
        <h3 className="text-[15px] mb-4" style={{ color: "var(--eco-text)" }}>{tx(l, "Ход возврата", "Қайтару барысы", "Refund Progress")}</h3>
        {steps.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className="w-3 h-3 rounded-full shrink-0 mt-1"
                style={{ background: step.done ? "var(--eco-positive)" : step.active ? "var(--eco-primary)" : "var(--eco-neutral-100)" }}
              />
              {i < steps.length - 1 && (
                <div className="w-px flex-1 my-1" style={{ background: step.done ? "var(--eco-positive)" : "var(--eco-border)", minHeight: 32 }} />
              )}
            </div>
            <div className="pb-4">
              <div className="text-[13px]" style={{ color: step.done || step.active ? "var(--eco-text)" : "var(--eco-text-tertiary)" }}>{step.label}</div>
              {step.time && <div className="text-[11px] mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{step.time}</div>}
            </div>
          </div>
        ))}
      </Card>

      <div className="flex items-start gap-2 p-4 rounded-lg mb-4" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
        <Shield size={13} className="mt-0.5 shrink-0" style={{ color: "var(--eco-text-tertiary)" }} />
        <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
          {tx(l,
            "Возврат будет зачислен на исходный способ оплаты в течение 3–10 рабочих дней после одобрения.",
            "Қайтару мақұлданғаннан кейін 3-10 жұмыс күнінде бастапқы төлем тәсіліне аударылады.",
            "Refund will be credited to the original payment method within 3–10 business days after approval."
          )}
        </span>
      </div>

      <Link to="/support/new" style={{ textDecoration: "none" }}>
        <Button variant="secondary" size="md" className="w-full">
          <MessageSquare size={14} /> {tx(l, "Связаться с поддержкой", "Қолдауға хабарласу", "Contact Support")}
        </Button>
      </Link>

      <PaymentFooter lang={l} />
    </div>
  );
}

// ─── 6) Owner Payout Status (no API yet) ───
export function OwnerPayoutPage() {
  const { language } = useI18n();
  const l = language as L;

  const steps = useMemo(
    () => [
      { label: tx(l, "Оплаты участников собраны", "Қатысушы төлемдері жиналды", "Member payments collected"), done: true, time: "" },
      { label: tx(l, "Окно споров (7 дней)", "Дау терезесі (7 күн)", "Dispute window (7 days)"), done: true, time: "" },
      { label: tx(l, "Выплата обрабатывается", "Төлем өңделуде", "Payout processing"), done: false, active: true, time: tx(l, "Ожидание", "Күтілуде", "Pending") },
      { label: tx(l, "Выплата отправлена", "Төлем жіберілді", "Payout Sent"), done: false, time: "" },
    ],
    [l]
  );

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Link to="/rooms" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-text-tertiary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> {tx(l, "Мои комнаты", "Менің бөлмелерім", "My Rooms")}
      </Link>

      <h1 className="text-[24px] mb-2" style={{ color: "var(--eco-text)" }}>{tx(l, "Статус выплаты", "Төлем мәртебесі", "Payout Status")}</h1>
      <div className="flex items-center gap-2 mb-6">
        <Badge variant="warning">{tx(l, "Ожидает выплаты", "Төлем күтілуде", "Payout Pending")}</Badge>
      </div>

      <Card className="flex flex-col gap-0 mb-6">
        <h3 className="text-[15px] mb-4" style={{ color: "var(--eco-text)" }}>{tx(l, "Ход выплаты", "Төлем барысы", "Payout Progress")}</h3>
        {steps.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className="w-3 h-3 rounded-full shrink-0 mt-1"
                style={{ background: step.done ? "var(--eco-positive)" : step.active ? "var(--eco-primary)" : "var(--eco-neutral-100)" }}
              />
              {i < steps.length - 1 && (
                <div className="w-px flex-1 my-1" style={{ background: step.done ? "var(--eco-positive)" : "var(--eco-border)", minHeight: 32 }} />
              )}
            </div>
            <div className="pb-4">
              <div className="text-[13px]" style={{ color: step.done || step.active ? "var(--eco-text)" : "var(--eco-text-tertiary)" }}>{step.label}</div>
              {step.time && <div className="text-[11px] mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{step.time}</div>}
            </div>
          </div>
        ))}
      </Card>

      <div className="flex items-start gap-2 p-4 rounded-lg mb-4" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
        <Shield size={13} className="mt-0.5 shrink-0" style={{ color: "var(--eco-text-tertiary)" }} />
        <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
          {tx(l,
            "Выплата доступна после прохождения верификации и окна для споров. Это защищает обе стороны.",
            "Төлем верификация мен дау терезесінен кейін қолжетімді. Бұл екі тарапты қорғайды.",
            "Payout available after verification and dispute window. This protects both parties."
          )}
        </span>
      </div>

      <PaymentFooter lang={l} />
    </div>
  );
}
