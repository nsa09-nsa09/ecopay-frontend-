import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Card, Badge, Button } from "../ds-primitives";
import { useI18n, type Language } from "../i18n-provider";
import {
  CheckCircle2, XCircle, Clock, Shield, ArrowRight, CreditCard,
  Lock, RefreshCw, AlertTriangle, ChevronRight, MessageSquare,
  ArrowLeft, FileText, Phone, Mail, MapPin, ExternalLink, Timer, Send
} from "lucide-react";

// ─── Localized text helper ───
type L = Language;
const tx = (l: L, ru: string, kz: string, en: string) =>
  l === "ru" ? ru : l === "kz" ? kz : en;

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
        <span className="flex items-center gap-1.5"><Mail size={11} /> support@ecosplit.kz</span>
        <span className="flex items-center gap-1.5"><MapPin size={11} /> {tx(lang, "Алматы, Казахстан", "Алматы, Қазақстан", "Almaty, Kazakhstan")}</span>
      </div>
      <div className="text-[11px] mt-3" style={{ color: "var(--eco-text-tertiary)" }}>
        {tx(lang, "© 2026 EcoSplit · ТОО «Apex Digital»", "© 2026 EcoSplit · «Apex Digital» ЖШС", "© 2026 EcoSplit · Apex Digital LLP")}
      </div>
    </div>
  );
}

// ─── Payment status chip ───
type PaymentStatus = "PENDING" | "HOLD" | "ACTIVE" | "REFUNDED" | "PAYOUT_SENT";
const paymentStatusVariant: Record<PaymentStatus, "warning" | "info" | "success" | "danger" | "default"> = {
  PENDING: "warning", HOLD: "info", ACTIVE: "success", REFUNDED: "danger", PAYOUT_SENT: "success",
};
const paymentStatusLabel = (s: PaymentStatus, l: L): string => {
  const map: Record<PaymentStatus, [string, string, string]> = {
    PENDING: ["Ожидает оплаты", "Төлем күтілуде", "Pending Payment"],
    HOLD: ["Средства удержаны", "Қаражат ұсталды", "Funds on Hold"],
    ACTIVE: ["Активно", "Белсенді", "Active"],
    REFUNDED: ["Возврат", "Қайтарым", "Refunded"],
    PAYOUT_SENT: ["Выплата отправлена", "Төлем жіберілді", "Payout Sent"],
  };
  return tx(l, ...map[s]);
};

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
      {/* Card logos */}
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

// ─── 1) Room Details with Pricing Box ───
export function PaymentRoomDetailsPage() {
  const { language } = useI18n();
  const l = language as L;

  const room = {
    name: "Beeline Family 4",
    operator: "Beeline",
    plan: "Комфорт 5000",
    totalPrice: 19999,
    seats: 4,
    filled: 3,
  };
  const share = Math.round(room.totalPrice / room.seats);
  const fee = Math.round(share * 0.08);
  const total = share + fee;

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Link to="/rooms" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-text-tertiary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> {tx(l, "Назад к комнатам", "Бөлмелерге оралу", "Back to rooms")}
      </Link>

      <h1 className="text-[24px] mb-2" style={{ color: "var(--eco-text)" }}>{room.name}</h1>
      <div className="text-[13px] mb-6" style={{ color: "var(--eco-text-tertiary)" }}>{room.operator} · {room.plan} · {room.filled}/{room.seats} {tx(l, "мест", "орын", "seats")}</div>

      {/* Status chips showcase */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["PENDING", "HOLD", "ACTIVE", "REFUNDED", "PAYOUT_SENT"] as PaymentStatus[]).map((s) => (
          <Badge key={s} variant={paymentStatusVariant[s]}>{paymentStatusLabel(s, l)}</Badge>
        ))}
      </div>

      {/* Pricing breakdown */}
      <Card className="flex flex-col gap-4 mb-6">
        <h3 className="text-[16px]" style={{ color: "var(--eco-text)" }}>{tx(l, "Стоимость участия", "Қатысу құны", "Participation Cost")}</h3>

        <div className="flex flex-col gap-2">
          {[
            { label: tx(l, "Доля участника", "Қатысушы үлесі", "Participant share"), value: `₸${share.toLocaleString()}` },
            { label: tx(l, "Комиссия платформы (8%)", "Платформа комиссиясы (8%)", "Platform fee (8%)"), value: `₸${fee.toLocaleString()}` },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between text-[14px]">
              <span style={{ color: "var(--eco-text-secondary)" }}>{row.label}</span>
              <span style={{ color: "var(--eco-text)" }}>{row.value}</span>
            </div>
          ))}
          <div className="border-t pt-2 mt-1 flex items-center justify-between" style={{ borderColor: "var(--eco-border)" }}>
            <span className="text-[15px]" style={{ color: "var(--eco-text)" }}>{tx(l, "Итого к оплате", "Төлем жиыны", "Total to pay now")}</span>
            <span className="text-[18px]" style={{ color: "var(--eco-primary)" }}>₸{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Escrow note */}
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

      <Link to="/payment/checkout" style={{ textDecoration: "none" }}>
        <Button variant="primary" size="lg" className="w-full">
          {tx(l, "Перейти к оплате", "Төлемге өту", "Proceed to Payment")} <ArrowRight size={15} />
        </Button>
      </Link>

      {/* Security note */}
      <div className="flex items-start gap-1.5 mt-4 text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
        <Shield size={11} className="mt-0.5 shrink-0" />
        {tx(l,
          "Действия ограничены по частоте. Проверки на мошенничество могут потребовать дополнительной верификации.",
          "Әрекеттер жиілікпен шектелген. Алаяқтық тексерулері қосымша верификация талап етуі мүмкін.",
          "Rate-limited actions. Fraud checks may require additional review."
        )}
      </div>

      <PaymentFooter lang={l} />
    </div>
  );
}

// ─── 2) Join / Checkout ───
export function PaymentCheckoutPage() {
  const { language } = useI18n();
  const l = language as L;
  const [selectedMethod, setSelectedMethod] = useState("freedom");

  const total = 5400;

  const methods = [
    { id: "freedom", label: "Freedom Pay", desc: tx(l, "Банковская карта", "Банк картасы", "Bank card"), icon: CreditCard },
    { id: "visa", label: "Visa ****4821", desc: tx(l, "Сохранённая карта", "Сақталған карта", "Saved card"), icon: CreditCard },
  ];

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Link to="/payment/room" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-text-tertiary)", textDecoration: "none" }}>
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

      {/* Order summary */}
      <Card className="flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>Beeline Family 4</span>
          <span className="text-[15px]" style={{ color: "var(--eco-primary)" }}>₸{total.toLocaleString()}</span>
        </div>
        <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
          {tx(l, "Ваша доля + комиссия", "Сіздің үлесіңіз + комиссия", "Your share + platform fee")}
        </div>
      </Card>

      {/* Payment methods */}
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

      {/* Freedom Pay placeholder */}
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

      <Button variant="primary" size="lg" className="w-full">
        <Lock size={15} /> {tx(l, "Оплатить безопасно", "Қауіпсіз төлеу", "Pay securely")} — ₸{total.toLocaleString()}
      </Button>

      <TrustBlock lang={l} />

      {/* Security note */}
      <div className="flex items-start gap-1.5 mt-4 text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
        <Shield size={11} className="mt-0.5 shrink-0" />
        {tx(l,
          "Действия ограничены по частоте. Проверки на мошенничество могут потребовать верификации.",
          "Әрекеттер жиілікпен шектелген. Алаяқтық тексерулері верификация талап етуі мүмкін.",
          "Rate-limited actions. Fraud checks may require review."
        )}
      </div>

      <PaymentFooter lang={l} />
    </div>
  );
}

// ─── 3) Payment Confirmation Modal ───
export function PaymentConfirmationPage() {
  const { language } = useI18n();
  const l = language as L;
  const [state, setState] = useState<"success" | "failed">("success");

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

      {/* Toggle for demo */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setState("success")}
          className="px-3 py-1 rounded-lg cursor-pointer text-[12px]"
          style={{ background: state === "success" ? "var(--eco-success-100)" : "var(--eco-surface)", color: state === "success" ? "var(--eco-success-500)" : "var(--eco-text-tertiary)", border: "1px solid var(--eco-border)" }}
        >
          {tx(l, "Успех", "Сәттілік", "Success")}
        </button>
        <button
          onClick={() => setState("failed")}
          className="px-3 py-1 rounded-lg cursor-pointer text-[12px]"
          style={{ background: state === "failed" ? "var(--eco-danger-100)" : "var(--eco-surface)", color: state === "failed" ? "var(--eco-danger-500)" : "var(--eco-text-tertiary)", border: "1px solid var(--eco-border)" }}
        >
          {tx(l, "Ошибка", "Қате", "Failed")}
        </button>
      </div>

      {/* Modal card */}
      <Card className="flex flex-col items-center text-center gap-5 py-10">
        {state === "success" ? (
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
                  "Ваш платёж в размере ₸5,400 принят. Средства будут удержаны до подтверждения доступа.",
                  "₸5,400 төлеміңіз қабылданды. Қолжетімділік расталғанша қаражат ұсталады.",
                  "Your payment of ₸5,400 has been received. Funds will be held until access is confirmed."
                )}
              </p>
            </div>
            <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              {tx(l, "Ref:", "Ref:", "Ref:")} PAY-2026-04-03-001
            </div>
            <Link to="/payment/pending" style={{ textDecoration: "none" }}>
              <Button variant="primary" size="lg">
                {tx(l, "Перейти к статусу", "Мәртебеге өту", "Go to Room Status")} <ArrowRight size={14} />
              </Button>
            </Link>
          </>
        ) : (
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
            <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              {tx(l, "Код ошибки:", "Қате коды:", "Error code:")} ERR_GW_TIMEOUT
            </div>
            <div className="flex gap-3">
              <Link to="/payment/checkout" style={{ textDecoration: "none" }}>
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

  const timeline = [
    { label: tx(l, "Оплата принята", "Төлем қабылданды", "Payment Successful"), done: true, time: "03 Apr 09:15" },
    { label: tx(l, "Ожидание предоставления доступа", "Қолжетімділік күтілуде", "Waiting for owner access grant"), done: false, active: true, time: tx(l, "SLA: 48ч", "SLA: 48с", "SLA: 48h") },
    { label: tx(l, "Подтверждение получения доступа", "Қолжетімділікті растау", "Confirm access received"), done: false, time: "" },
    { label: tx(l, "Активация", "Белсендіру", "Activation"), done: false, time: "" },
  ];

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Link to="/rooms" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-text-tertiary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> {tx(l, "Мои комнаты", "Менің бөлмелерім", "My Rooms")}
      </Link>

      <h1 className="text-[24px] mb-2" style={{ color: "var(--eco-text)" }}>Beeline Family 4</h1>
      <div className="flex items-center gap-2 mb-6">
        <Badge variant="info">{paymentStatusLabel("HOLD", l)}</Badge>
        <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>PAY-2026-04-03-001</span>
      </div>

      {/* SLA Timer */}
      <Card className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--eco-warning-100)" }}>
          <Timer size={20} style={{ color: "var(--eco-warning-500)" }} />
        </div>
        <div className="flex-1">
          <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>
            {tx(l, "Время ожидания доступа", "Қолжетімділік күту уақыты", "Access Grant SLA Timer")}
          </div>
          <div className="text-[22px] mt-0.5" style={{ color: "var(--eco-warning-500)", fontFamily: "monospace" }}>38:45:12</div>
          <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
            {tx(l, "Осталось из 48 часов", "48 сағаттан қалды", "Remaining of 48 hours")}
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="flex flex-col gap-0 mb-6">
        <h3 className="text-[15px] mb-4" style={{ color: "var(--eco-text)" }}>{tx(l, "Статус процесса", "Процесс мәртебесі", "Process Status")}</h3>
        {timeline.map((step, i) => (
          <div key={i} className="flex gap-3">
            {/* Vertical line + dot */}
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
              {step.active && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--eco-primary)" }} />
                  <span className="text-[11px]" style={{ color: "var(--eco-primary)" }}>{tx(l, "В процессе", "Орындалуда", "In progress")}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </Card>

      <Link to="/support/new" style={{ textDecoration: "none" }}>
        <Button variant="secondary" size="md" className="w-full">
          <MessageSquare size={14} /> {tx(l, "Создать обращение в поддержку", "Қолдау сұрауын жасау", "Create Support Ticket")}
        </Button>
      </Link>

      <div className="flex items-start gap-1.5 mt-4 text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
        <Shield size={11} className="mt-0.5 shrink-0" />
        {tx(l,
          "Если доступ не предоставлен в течение SLA, вы можете запросить возврат.",
          "SLA ішінде қолжетімділік берілмесе, қайтаруды сұрай аласыз.",
          "If access is not granted within SLA, you may request a refund."
        )}
      </div>

      <PaymentFooter lang={l} />
    </div>
  );
}

// ─── 5) Refund Status ───
export function RefundStatusPage() {
  const { language } = useI18n();
  const l = language as L;

  const refund = {
    id: "RF-201",
    amount: 5400,
    room: "Beeline Family 4",
    created: "2026-04-03",
  };

  const steps = [
    { label: tx(l, "Запрошен", "Сұралды", "Requested"), done: true, time: "Apr 3, 09:30" },
    { label: tx(l, "На рассмотрении", "Қарастырылуда", "In Review"), done: true, time: "Apr 3, 10:00" },
    { label: tx(l, "Одобрен", "Мақұлданды", "Approved"), done: false, active: true, time: tx(l, "Ожидание", "Күтілуде", "Pending") },
    { label: tx(l, "Отправлен", "Жіберілді", "Sent"), done: false, time: "" },
  ];

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Link to="/rooms" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-text-tertiary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> {tx(l, "Мои комнаты", "Менің бөлмелерім", "My Rooms")}
      </Link>

      <h1 className="text-[24px] mb-2" style={{ color: "var(--eco-text)" }}>{tx(l, "Статус возврата", "Қайтару мәртебесі", "Refund Status")}</h1>

      <Card className="flex flex-col gap-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: tx(l, "Номер возврата", "Қайтару нөмірі", "Reference ID"), value: refund.id },
            { label: tx(l, "Сумма", "Сома", "Amount"), value: `₸${refund.amount.toLocaleString()}` },
            { label: tx(l, "Комната", "Бөлме", "Room"), value: refund.room },
            { label: tx(l, "Дата запроса", "Сұрау күні", "Request Date"), value: refund.created },
          ].map((row) => (
            <div key={row.label}>
              <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{row.label}</div>
              <div className="text-[14px] mt-0.5" style={{ color: "var(--eco-text)" }}>{row.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Refund timeline */}
      <Card className="flex flex-col gap-0 mb-6">
        <h3 className="text-[15px] mb-4" style={{ color: "var(--eco-text)" }}>{tx(l, "Ход возврата", "Қайтару барысы", "Refund Progress")}</h3>
        {steps.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className="w-3 h-3 rounded-full shrink-0 mt-1"
                style={{
                  background: step.done ? "var(--eco-positive)" : step.active ? "var(--eco-primary)" : "var(--eco-neutral-100)",
                }}
              />
              {i < steps.length - 1 && (
                <div className="w-px flex-1 my-1" style={{ background: step.done ? "var(--eco-positive)" : "var(--eco-border)", minHeight: 32 }} />
              )}
            </div>
            <div className="pb-4">
              <div className="text-[13px]" style={{ color: step.done || step.active ? "var(--eco-text)" : "var(--eco-text-tertiary)" }}>{step.label}</div>
              {step.time && <div className="text-[11px] mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{step.time}</div>}
              {step.active && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--eco-primary)" }} />
                  <span className="text-[11px]" style={{ color: "var(--eco-primary)" }}>{tx(l, "Обрабатывается", "Өңделуде", "Processing")}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </Card>

      {/* Safe copy */}
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

// ─── 6) Owner Payout Status ───
export function OwnerPayoutPage() {
  const { language } = useI18n();
  const l = language as L;

  const payout = {
    id: "PO-101",
    amount: 14999,
    room: "Beeline Family 4",
    seats: 3,
    period: tx(l, "Апрель 2026", "Сәуір 2026", "April 2026"),
  };

  const steps = [
    { label: tx(l, "Оплаты участников собраны", "Қатысушы төлемдері жиналды", "Member payments collected"), done: true, time: "Apr 1" },
    { label: tx(l, "Окно споров (7 дней)", "Дау терезесі (7 күн)", "Dispute window (7 days)"), done: true, time: "Apr 1–7" },
    { label: tx(l, "Выплата обрабатывается", "Төлем өңделуде", "Payout processing"), done: false, active: true, time: tx(l, "Ожидание", "Күтілуде", "Pending") },
    { label: tx(l, "Выплата отправлена", "Төлем жіберілді", "Payout Sent"), done: false, time: "" },
  ];

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Link to="/rooms" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-text-tertiary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> {tx(l, "Мои комнаты", "Менің бөлмелерім", "My Rooms")}
      </Link>

      <h1 className="text-[24px] mb-2" style={{ color: "var(--eco-text)" }}>{tx(l, "Статус выплаты", "Төлем мәртебесі", "Payout Status")}</h1>
      <div className="flex items-center gap-2 mb-6">
        <Badge variant="warning">{tx(l, "Ожидает выплаты", "Төлем күтілуде", "Payout Pending")}</Badge>
      </div>

      <Card className="flex flex-col gap-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: tx(l, "Номер выплаты", "Төлем нөмірі", "Payout ID"), value: payout.id },
            { label: tx(l, "Сумма", "Сома", "Amount"), value: `₸${payout.amount.toLocaleString()}` },
            { label: tx(l, "Комната", "Бөлме", "Room"), value: payout.room },
            { label: tx(l, "Период", "Кезең", "Period"), value: payout.period },
          ].map((row) => (
            <div key={row.label}>
              <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{row.label}</div>
              <div className="text-[14px] mt-0.5" style={{ color: "var(--eco-text)" }}>{row.value}</div>
            </div>
          ))}
        </div>
        <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
          {tx(l, "Участников оплатило:", "Төлеген қатысушылар:", "Members paid:")} {payout.seats}/{payout.seats}
        </div>
      </Card>

      {/* Timeline */}
      <Card className="flex flex-col gap-0 mb-6">
        <h3 className="text-[15px] mb-4" style={{ color: "var(--eco-text)" }}>{tx(l, "Ход выплаты", "Төлем барысы", "Payout Progress")}</h3>
        {steps.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className="w-3 h-3 rounded-full shrink-0 mt-1"
                style={{
                  background: step.done ? "var(--eco-positive)" : step.active ? "var(--eco-primary)" : "var(--eco-neutral-100)",
                }}
              />
              {i < steps.length - 1 && (
                <div className="w-px flex-1 my-1" style={{ background: step.done ? "var(--eco-positive)" : "var(--eco-border)", minHeight: 32 }} />
              )}
            </div>
            <div className="pb-4">
              <div className="text-[13px]" style={{ color: step.done || step.active ? "var(--eco-text)" : "var(--eco-text-tertiary)" }}>{step.label}</div>
              {step.time && <div className="text-[11px] mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{step.time}</div>}
              {step.active && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--eco-primary)" }} />
                  <span className="text-[11px]" style={{ color: "var(--eco-primary)" }}>{tx(l, "Обрабатывается", "Өңделуде", "Processing")}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </Card>

      {/* Policy note */}
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

      <div className="flex items-start gap-1.5 mt-2 text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
        <Shield size={11} className="mt-0.5 shrink-0" />
        {tx(l,
          "Действия ограничены по частоте. Проверки на мошенничество могут потребовать дополнительной верификации.",
          "Әрекеттер жиілікпен шектелген. Алаяқтық тексерулері қосымша верификация талап етуі мүмкін.",
          "Rate-limited actions. Fraud checks may require additional review."
        )}
      </div>

      <PaymentFooter lang={l} />
    </div>
  );
}
