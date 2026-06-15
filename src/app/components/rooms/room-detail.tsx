import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Card, Badge, Button, RoomStatusBadge, Modal, Input, Stepper, Select } from "../ds-primitives";
import { ArrowLeft, Users, Calendar, Shield, AlertTriangle, Check, Star } from "lucide-react";
import { ApiError, getRoom, getRooms, joinRoomRequest, type RoomResponseDto, type RoomSummaryDto } from "../../lib/api";
import { useAuth } from "../auth/auth-provider";
import { useI18n, type Language } from "../i18n-provider";
import { formatDate as formatAlmatyDate } from "../../lib/datetime";
import { LeaveReviewModal } from "../reputation/leave-review-modal";

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === "ru" ? ru : l === "kz" ? kz : en;

const moneyFormatter = new Intl.NumberFormat("ru-RU");

function formatMoney(value: number | null | undefined) {
  return `₸${moneyFormatter.format(Number(value ?? 0))}`;
}

function formatDate(value: string | undefined, l: Language) {
  if (!value) return tx(l, "—", "—", "TBD");
  return formatAlmatyDate(value, l);
}

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { language } = useI18n();
  const roomId = Number(id);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, authorizedRequest, user } = useAuth();

  const [room, setRoom] = useState<RoomResponseDto | null>(null);
  const [summary, setSummary] = useState<RoomSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [joinOpen, setJoinOpen] = useState(false);
  const [joinStep, setJoinStep] = useState(0);
  const [consent, setConsent] = useState(false);
  const [joinDone, setJoinDone] = useState(false);
  const [identifierType, setIdentifierType] = useState("PHONE");
  const [identifierValue, setIdentifierValue] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadRoom() {
      if (!roomId) {
        setLoadError(tx(language, "Комната не найдена.", "Бөлме табылмады.", "Room not found."));
        setLoading(false);
        return;
      }

      try {
        const [roomResponse, roomListResponse] = await Promise.all([
          getRoom(roomId),
          getRooms({ size: 100 }),
        ]);

        if (!isCancelled) {
          setRoom(roomResponse);
          setSummary(roomListResponse.items.find((item) => item.id === roomId) ?? null);
        }
      } catch {
        if (!isCancelled) {
          setLoadError(tx(language, "Не удалось загрузить комнату.", "Бөлмені жүктеу мүмкін болмады.", "Unable to load this room right now."));
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadRoom();

    return () => {
      isCancelled = true;
    };
  }, [roomId, language]);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <Card>{tx(language, "Загрузка деталей комнаты...", "Бөлме деректері жүктелуде...", "Loading room details...")}</Card>
      </div>
    );
  }

  if (loadError || !room) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <Card>{loadError ?? tx(language, "Комната не найдена.", "Бөлме табылмады.", "Room not found.")}</Card>
      </div>
    );
  }

  const requiresIdentifier = room.roomType === "TELECOM";
  const ownerName = summary?.ownerDisplayName ?? `User #${room.ownerUserId}`;
  const totalDue = Number(room.pricePerMember ?? 0);
  const ctaLabel = isAuthenticated
    ? tx(language, "Присоединиться", "Қосылу", "Join Room")
    : tx(language, "Войдите, чтобы присоединиться", "Қосылу үшін кіріңіз", "Sign in to join");

  const openJoinFlow = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    setJoinOpen(true);
    setJoinStep(0);
    setJoinDone(false);
    setJoinError(null);
  };

  const handleJoin = async () => {
    if (!room) {
      return;
    }

    setJoinError(null);

    if (!consent) {
      setJoinError(tx(language, "Нужно подтвердить согласие.", "Келісім қажет.", "Consent must be accepted."));
      return;
    }

    if (requiresIdentifier && !identifierValue.trim()) {
      setJoinError(tx(language, "Идентификатор обязателен для телеком-комнат.", "Телеком-бөлмелер үшін идентификатор міндетті.", "Identifier is required for telecom rooms."));
      return;
    }

    setSubmitting(true);

    try {
      await authorizedRequest((accessToken) =>
        joinRoomRequest(
          room.id,
          {
            consentAccepted: consent,
            identifierType: requiresIdentifier ? identifierType : undefined,
            identifierValue: requiresIdentifier ? identifierValue.trim() : undefined,
          },
          accessToken,
        ),
      );
      setJoinDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setJoinError(err.message);
      } else {
        setJoinError(tx(language, "Не удалось отправить заявку.", "Өтінімді жіберу мүмкін болмады.", "Unable to submit the room request right now."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      <Link
        to={room.serviceId ? `/operator/${room.serviceId}` : "/"}
        className="inline-flex items-center gap-1 text-[13px] mb-6"
        style={{ color: "var(--eco-primary)", textDecoration: "none" }}
      >
        <ArrowLeft size={14} /> {room.providerName}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-[22px] sm:text-[24px] break-words" style={{ color: "var(--eco-text)" }}>{room.title}</h1>
              <RoomStatusBadge status={room.status} />
            </div>
            <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
              {room.providerName} · {room.connectionType}
            </p>
          </div>

          <Card className="flex flex-col gap-4">
            <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>
              {tx(language, "Параметры тарифа", "Тариф параметрлері", "Plan Summary")}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: tx(language, "Стоимость тарифа", "Тариф құны", "Total plan cost"), value: `${formatMoney(room.priceTotal)}${tx(language, "/период", "/кезең", "/period")}` },
                { label: tx(language, "Участники", "Қатысушылар", "Members"), value: `${room.maxMembers}`, icon: Users },
                { label: tx(language, "Ваша доля", "Сіздің үлесіңіз", "Your share"), value: `${formatMoney(room.pricePerMember)}${tx(language, "/период", "/кезең", "/period")}`, highlight: true },
                { label: tx(language, "Дата старта", "Басталу күні", "Start date"), value: formatDate(room.startDate, language), icon: Calendar },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-[12px] mb-1" style={{ color: "var(--eco-text-tertiary)" }}>{item.label}</div>
                  <div className="text-[15px]" style={{ color: item.highlight ? "var(--eco-primary)" : "var(--eco-text)" }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>
              {tx(language, "Расчёт стоимости", "Құнның есебі", "Price Breakdown")}
            </h3>
            {[
              { label: tx(language, "Стоимость тарифа", "Тариф құны", "Plan cost"), value: formatMoney(room.priceTotal) },
              { label: tx(language, `Делится на ${room.maxMembers} участников`, `${room.maxMembers} қатысушыға бөлінеді`, `Split between ${room.maxMembers} members`), value: `÷${room.maxMembers}` },
              { label: tx(language, "Ваша доля", "Сіздің үлесіңіз", "Your share"), value: formatMoney(room.pricePerMember), bold: true },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-[13px]">
                <span style={{ color: "var(--eco-text-secondary)" }}>{row.label}</span>
                <span style={{ color: row.bold ? "var(--eco-text)" : "var(--eco-text-secondary)" }}>{row.value}</span>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between text-[14px]" style={{ borderColor: "var(--eco-border)" }}>
              <span style={{ color: "var(--eco-text)" }}>
                {tx(language, "К оплате при вступлении", "Қосылу кезінде төлеу", "Due on join")}
              </span>
              <span style={{ color: "var(--eco-primary)" }}>{formatMoney(totalDue)}</span>
            </div>
          </Card>

          {(room.description || room.cancellationPolicy) && (
            <Card className="flex items-start gap-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--eco-warning)" }} />
              <div className="flex flex-col gap-2">
                {room.description && (
                  <div className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
                    {room.description}
                  </div>
                )}
                {room.cancellationPolicy && (
                  <div className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
                    {room.cancellationPolicy}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>
              {tx(language, "Владелец комнаты", "Бөлме иесі", "Room Owner")}
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--eco-surface)" }}>
                <span className="text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>
                  {ownerName.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{ownerName}</div>
                <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                  {tx(language, "Верификация", "Растау", "Verification")}: {room.verificationMode}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--eco-positive)" }}>
              <Shield size={13} /> {tx(language, "Данные хранятся зашифрованными.", "Деректер шифрланған түрде сақталады.", "Data is stored encrypted in the backend.")}
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="text-[20px]" style={{ color: "var(--eco-primary)" }}>
              {formatMoney(totalDue)}
              <span className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
                {tx(language, "/период", "/кезең", "/period")}
              </span>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={openJoinFlow}
              disabled={room.status !== "OPEN"}
            >
              {ctaLabel}
            </Button>
            <p className="text-[11px] text-center" style={{ color: "var(--eco-text-tertiary)" }}>
              {requiresIdentifier
                ? tx(
                    language,
                    "Идентификатор раскрывается владельцу только после оплаты.",
                    "Идентификатор иесіне төлемнен кейін ғана ашылады.",
                    "Your identifier is only shared after you confirm the join request.",
                  )
                : tx(
                    language,
                    "Заявку на вступление можно отправить с этой страницы.",
                    "Қосылу өтінімін осы беттен жіберуге болады.",
                    "You can submit a join request from this page.",
                  )}
            </p>
          </Card>

          {room.status === "COMPLETED" && isAuthenticated && user && user.id !== room.ownerUserId && (
            <Card className="flex flex-col gap-3">
              <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>
                {tx(language, "Поделитесь впечатлениями", "Әсеріңізбен бөлісіңіз", "Share your feedback")}
              </h3>
              <p className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
                {tx(
                  language,
                  `Комната завершена. Оставьте отзыв о ${ownerName}.`,
                  `Бөлме аяқталды. ${ownerName} туралы пікір қалдырыңыз.`,
                  `This room is completed. Leave a review for ${ownerName}.`,
                )}
              </p>
              <Button variant="secondary" size="md" onClick={() => setReviewOpen(true)}>
                <Star size={14} /> {tx(language, "Оставить отзыв", "Пікір қалдыру", "Leave a review")}
              </Button>
            </Card>
          )}
        </div>
      </div>

      <LeaveReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        recipientId={room.ownerUserId}
        roomId={room.id}
        recipientName={ownerName}
      />

      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title={tx(language, "Присоединиться к комнате", "Бөлмеге қосылу", "Join Room")}>
        {!joinDone ? (
          <div className="flex flex-col gap-5">
            <Stepper
              steps={[
                requiresIdentifier
                  ? tx(language, "Идентификатор", "Идентификатор", "Identifier")
                  : tx(language, "Согласие", "Келісім", "Consent"),
                tx(language, "Отправка", "Жіберу", "Submit"),
              ]}
              current={joinStep}
            />

            {joinStep === 0 && (
              <div className="flex flex-col gap-4">
                {user && !user.phoneVerified && (
                  <div className="p-3 rounded-lg text-[12px] flex items-start gap-2" style={{ background: "var(--eco-warning-100)", color: "var(--eco-text-secondary)" }}>
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--eco-warning)" }} />
                    <span>
                      {tx(language, "Подтвердите номер телефона перед вступлением.", "Қосылмас бұрын телефон нөміріңізді растаңыз.", "Verify your phone number before joining a room.")}{" "}
                      <Link to="/profile" style={{ color: "var(--eco-primary)" }}>
                        {tx(language, "Перейти в профиль", "Профильге өту", "Go to profile")}
                      </Link>
                      .
                    </span>
                  </div>
                )}
                {requiresIdentifier && (
                  <>
                    <Select
                      label={tx(language, "Тип идентификатора", "Идентификатор түрі", "Identifier type")}
                      value={identifierType}
                      onChange={(event) => setIdentifierType(event.target.value)}
                      options={[
                        { value: "PHONE", label: tx(language, "Телефон", "Телефон", "Phone") },
                        { value: "ACCOUNT", label: tx(language, "ID лицевого счёта", "Жеке шот ID", "Account ID") },
                        { value: "SIM", label: "SIM" },
                        { value: "ESIM", label: "eSIM" },
                      ]}
                    />
                    <Input
                      label={tx(language, "Идентификатор", "Идентификатор", "Telecom Identifier")}
                      placeholder={tx(language, "Номер телефона или ID договора", "Телефон нөмірі немесе келісімшарт ID", "Phone number or contract ID")}
                      value={identifierValue}
                      onChange={(event) => setIdentifierValue(event.target.value)}
                    />
                  </>
                )}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" className="mt-0.5" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
                  <span className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
                    {tx(
                      language,
                      "Я согласен передать владельцу необходимые данные согласно правилам комнаты.",
                      "Бөлме ережелеріне сәйкес иесіне қажетті деректерді беруге келісемін.",
                      "I consent to sharing the required room data with the owner according to the room rules.",
                    )}
                  </span>
                </label>
                {joinError && (
                  <p className="text-[12px]" style={{ color: "var(--eco-negative)" }}>
                    {joinError}
                  </p>
                )}
                <Button
                  variant="primary"
                  className="w-full"
                  disabled={
                    !consent ||
                    (requiresIdentifier && !identifierValue.trim()) ||
                    (!!user && !user.phoneVerified)
                  }
                  onClick={() => setJoinStep(1)}
                >
                  {tx(language, "Продолжить", "Жалғастыру", "Continue")}
                </Button>
              </div>
            )}

            {joinStep === 1 && (
              <div className="flex flex-col gap-4">
                <Card className="flex flex-col gap-2">
                  <div className="flex justify-between text-[13px]">
                    <span style={{ color: "var(--eco-text-secondary)" }}>{tx(language, "Комната", "Бөлме", "Room")}</span>
                    <span style={{ color: "var(--eco-text)" }}>{room.title}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span style={{ color: "var(--eco-text-secondary)" }}>{tx(language, "Провайдер", "Провайдер", "Provider")}</span>
                    <span style={{ color: "var(--eco-text)" }}>{room.providerName}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-[14px]" style={{ borderColor: "var(--eco-border)" }}>
                    <span style={{ color: "var(--eco-text)" }}>{tx(language, "Стоимость вступления", "Қосылу құны", "Join cost")}</span>
                    <span style={{ color: "var(--eco-primary)" }}>{formatMoney(totalDue)}</span>
                  </div>
                </Card>
                {joinError && (
                  <p className="text-[12px]" style={{ color: "var(--eco-negative)" }}>
                    {joinError}
                  </p>
                )}
                <Button variant="primary" className="w-full" onClick={handleJoin} loading={submitting}>
                  {tx(language, "Отправить заявку", "Өтінімді жіберу", "Submit request")}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-4 gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--eco-success-100)" }}>
              <Check size={20} style={{ color: "var(--eco-positive)" }} />
            </div>
            <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>
              {tx(language, "Заявка отправлена", "Өтінім жіберілді", "Application Submitted")}
            </div>
            <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
              {tx(language, "Ваше членство сейчас", "Сіздің мүшелігіңіз қазір", "Your membership is now")}{" "}
              <Badge variant="info">APPLIED</Badge>.{" "}
              {tx(
                language,
                "Завершите оплату, чтобы закрепить место.",
                "Орын сақтау үшін төлемді аяқтаңыз.",
                "Next, complete payment to reserve your seat.",
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="primary" onClick={() => navigate(`/rooms/member/${room.id}`)}>
                {tx(language, "К оплате", "Төлемге өту", "Continue to payment")}
              </Button>
              <Button variant="secondary" onClick={() => setJoinOpen(false)}>
                {tx(language, "Закрыть", "Жабу", "Close")}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
