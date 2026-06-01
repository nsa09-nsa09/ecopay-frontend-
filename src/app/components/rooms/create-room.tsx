import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card, Button, Input, Select, Stepper } from "../ds-primitives";
import { ArrowLeft, Lock, Check, Shield } from "lucide-react";
import {
  ApiError,
  createRoomRequest,
  getServices,
  getTariffs,
  type RoomResponseDto,
  type ServiceDto,
  type TariffPlanDto,
} from "../../lib/api";
import { useAuth } from "../auth/auth-provider";

const stepLabels = ["Operator & Plan", "Room Settings", "Access Method", "Review"];

const CONNECTION_OPTIONS = [
  { value: "ESIM", label: "eSIM activation" },
  { value: "SIM", label: "Physical SIM card" },
  { value: "ACCOUNT_LINK", label: "Operator account invite" },
  { value: "OTHER", label: "Other" },
];

const PERIOD_OPTIONS = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "OTHER", label: "Other" },
];

function defaultStartDate() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  d.setMinutes(0, 0, 0);
  // format as yyyy-MM-ddTHH:mm for datetime-local input
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CreateRoomPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isReady, authorizedRequest } = useAuth();

  const [step, setStep] = useState(0);

  const [services, setServices] = useState<ServiceDto[]>([]);
  const [tariffs, setTariffs] = useState<TariffPlanDto[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [serviceId, setServiceId] = useState<string>("");
  const [tariffPlanId, setTariffPlanId] = useState<string>("");
  const [roomType, setRoomType] = useState("TELECOM");
  const [title, setTitle] = useState("");
  const [seats, setSeats] = useState("4");
  const [priceModel, setPriceModel] = useState("total");
  const [totalPrice, setTotalPrice] = useState("19999");
  const [perMemberPrice, setPerMemberPrice] = useState("5000");
  const [periodType, setPeriodType] = useState("MONTHLY");
  const [startDate, setStartDate] = useState(defaultStartDate());
  const [connectionType, setConnectionType] = useState("ESIM");
  const [restrictions, setRestrictions] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [published, setPublished] = useState<RoomResponseDto | null>(null);

  // Redirect to login if needed.
  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate("/login?redirect=/rooms/create");
    }
  }, [isReady, isAuthenticated, navigate]);

  // Load services once.
  useEffect(() => {
    let cancelled = false;
    getServices()
      .then((list) => {
        if (cancelled) return;
        setServices(list);
        if (list.length > 0) {
          setServiceId(String(list[0].id));
        }
      })
      .catch(() => {
        if (!cancelled) setCatalogError("Unable to load the service catalog right now.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedService = useMemo(
    () => services.find((s) => String(s.id) === serviceId) ?? null,
    [services, serviceId],
  );

  // Load tariffs whenever the selected service changes.
  useEffect(() => {
    if (!serviceId) {
      setTariffs([]);
      setTariffPlanId("");
      return;
    }
    let cancelled = false;
    getTariffs(Number(serviceId))
      .then((list) => {
        if (cancelled) return;
        setTariffs(list);
        setTariffPlanId("");
      })
      .catch(() => {
        if (!cancelled) setTariffs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  const selectedTariff = useMemo(
    () => tariffs.find((t) => String(t.id) === tariffPlanId) ?? null,
    [tariffs, tariffPlanId],
  );

  // Prefill room fields from a chosen tariff plan.
  const applyTariff = (id: string) => {
    setTariffPlanId(id);
    const tariff = tariffs.find((t) => String(t.id) === id);
    if (tariff) {
      setSeats(String(tariff.maxMembers));
      setTotalPrice(String(tariff.basePriceTotal));
      if (tariff.maxMembers > 0) {
        setPerMemberPrice(String(Math.round(Number(tariff.basePriceTotal) / tariff.maxMembers)));
      }
      if (tariff.connectionType) {
        setConnectionType(tariff.connectionType);
      }
      if (tariff.periodType) {
        setPeriodType(tariff.periodType);
      }
      if (!title) {
        setTitle(`${selectedService?.name ?? ""} ${tariff.name}`.trim());
      }
    }
  };

  const seatCount = Math.max(parseInt(seats || "0", 10) || 0, 0);
  const perMemberDerived =
    priceModel === "total" && seatCount > 0
      ? Math.round((parseInt(totalPrice || "0", 10) || 0) / seatCount)
      : parseInt(perMemberPrice || "0", 10) || 0;

  const isTelecom = roomType === "TELECOM";

  const handlePublish = async () => {
    setSubmitError(null);

    if (!serviceId) {
      setSubmitError("Please select a service.");
      setStep(0);
      return;
    }
    if (!title.trim()) {
      setSubmitError("Please enter a room title.");
      setStep(1);
      return;
    }
    if (seatCount < 2) {
      setSubmitError("A room needs at least 2 seats.");
      setStep(1);
      return;
    }
    if (isTelecom && !confirmed) {
      setSubmitError("You must confirm operator terms for a telecom room.");
      setStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const room = await authorizedRequest((token) =>
        createRoomRequest(
          {
            categoryId: selectedService?.categoryId ?? null,
            serviceId: Number(serviceId),
            tariffPlanId: tariffPlanId ? Number(tariffPlanId) : null,
            roomType,
            title: title.trim(),
            maxMembers: seatCount,
            priceTotal: priceModel === "total" ? Number(totalPrice) : null,
            pricePerMember: priceModel === "per_member" ? Number(perMemberPrice) : null,
            currency: "KZT",
            periodType,
            startDate: startDate.length === 16 ? `${startDate}:00` : startDate,
            providerName: selectedService?.name ?? null,
            tariffNameSnapshot: selectedTariff?.name ?? null,
            connectionType: isTelecom ? connectionType : null,
            operatorRestrictions: restrictions.trim() || null,
            operatorTermsConfirmed: isTelecom ? confirmed : null,
          },
          token,
        ),
      );
      setPublished(room);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Unable to publish the room right now. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (published) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "var(--eco-success-100)" }}>
          <Check size={24} style={{ color: "var(--eco-positive)" }} />
        </div>
        <h1 className="text-[24px] mb-2" style={{ color: "var(--eco-text)" }}>Room Published</h1>
        <p className="text-[13px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
          Your room "{published.title}" is now visible in the catalog. Members can apply to join.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to={`/rooms/owner/${published.id}`} style={{ textDecoration: "none" }}><Button variant="secondary">Manage Room</Button></Link>
          <Link to={`/room/${published.id}`} style={{ textDecoration: "none" }}><Button variant="primary">View in Catalog</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <Link to="/rooms" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> My Rooms
      </Link>

      <h1 className="text-[26px] mb-6" style={{ color: "var(--eco-text)" }}>Create Room</h1>

      {catalogError && (
        <div className="p-4 rounded-lg mb-6 text-[13px]" style={{ background: "var(--eco-danger-100, #fde8e8)", color: "var(--eco-negative)" }}>
          {catalogError}
        </div>
      )}

      {/* Critical info banner */}
      <div className="p-4 rounded-lg flex items-start gap-3 mb-6" style={{ background: "var(--eco-warning-100)" }}>
        <Lock size={16} className="mt-0.5 shrink-0" style={{ color: "var(--eco-warning)" }} />
        <div>
          <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>Critical fields lock after start date</div>
          <div className="text-[13px] mt-0.5" style={{ color: "var(--eco-text-secondary)" }}>
            Operator, plan, seats, and price cannot be changed once the start date has passed. Editing requires cancelling and re-creating the room.
          </div>
        </div>
      </div>

      {/* Verification mode chip */}
      <div className="flex items-center gap-2 mb-6">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px]"
          style={{ background: "var(--eco-surface)", color: "var(--eco-text-secondary)", border: "1px solid var(--eco-border)" }}
        >
          <Shield size={13} style={{ color: "var(--eco-primary)" }} />
          Verification mode: Risk-based (default)
        </div>
        <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>Set by backend</div>
      </div>

      <Stepper steps={stepLabels} current={step} />

      <div className="mt-8">
        {/* Step 0: Operator & Plan */}
        {step === 0 && (
          <Card className="flex flex-col gap-4">
            <Select
              label="Room Type"
              options={[
                { value: "TELECOM", label: "Telecom (SIM / eSIM / operator plan)" },
                { value: "DIGITAL", label: "Digital subscription" },
              ]}
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
            />
            <Select
              label="Operator / Provider"
              options={
                services.length > 0
                  ? services.map((s) => ({ value: String(s.id), label: s.name }))
                  : [{ value: "", label: "Loading services..." }]
              }
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            />
            <Select
              label="Plan (optional)"
              options={[
                { value: "", label: tariffs.length > 0 ? "No plan — custom pricing" : "No plans available" },
                ...tariffs.map((t) => ({
                  value: String(t.id),
                  label: `${t.name} — ₸${Number(t.basePriceTotal).toLocaleString()} / ${t.periodType.toLowerCase()}`,
                })),
              ]}
              value={tariffPlanId}
              onChange={(e) => applyTariff(e.target.value)}
            />
            <div className="text-[12px] p-3 rounded-lg" style={{ background: "var(--eco-brand-50)", color: "var(--eco-text-secondary)" }}>
              Tip: Selecting a plan prefills seats and price from the operator's catalog. You can still adjust them.
            </div>
            <Button variant="primary" className="w-full" disabled={!serviceId} onClick={() => setStep(1)}>Continue</Button>
          </Card>
        )}

        {/* Step 1: Room Settings */}
        {step === 1 && (
          <Card className="flex flex-col gap-4">
            <Input
              label="Room Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Beeline Family 4"
            />
            <Input
              label="Number of Seats"
              type="number"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              hint="Minimum 2 members including you"
            />
            <Select
              label="Price Model"
              options={[
                { value: "total", label: "Total plan cost (split equally)" },
                { value: "per_member", label: "Fixed price per member" },
              ]}
              value={priceModel}
              onChange={(e) => setPriceModel(e.target.value)}
            />
            {priceModel === "total" ? (
              <Input
                label="Total Price (₸)"
                type="number"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                hint={seatCount > 0 ? `≈ ₸${perMemberDerived.toLocaleString()} per member` : undefined}
              />
            ) : (
              <Input
                label="Price per Member (₸)"
                type="number"
                value={perMemberPrice}
                onChange={(e) => setPerMemberPrice(e.target.value)}
              />
            )}
            <Select
              label="Billing Period"
              options={PERIOD_OPTIONS}
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
            />
            <Input
              label="Start Date"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              hint="Must be in the future"
            />
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
              <Button variant="primary" className="flex-1" onClick={() => setStep(2)}>Continue</Button>
            </div>
          </Card>
        )}

        {/* Step 2: Access Method */}
        {step === 2 && (
          <Card className="flex flex-col gap-4">
            {isTelecom ? (
              <>
                <Select
                  label="Access Method"
                  options={CONNECTION_OPTIONS}
                  value={connectionType}
                  onChange={(e) => setConnectionType(e.target.value)}
                />
                <Input
                  label="Operator Restrictions (optional)"
                  value={restrictions}
                  onChange={(e) => setRestrictions(e.target.value)}
                  placeholder="e.g. KZ numbers only"
                />
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" className="mt-0.5" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                  <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                    I confirm that this operator supports family/group plans and I am the account holder or authorized to share.
                  </span>
                </label>
              </>
            ) : (
              <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                Digital subscriptions are shared via an account invite once members join and pay. No telecom identifier required.
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={isTelecom && !confirmed}
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <Card className="flex flex-col gap-4">
            <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>Review & Publish</h3>
            {[
              { label: "Room type", value: isTelecom ? "Telecom" : "Digital" },
              { label: "Operator", value: selectedService?.name ?? "—" },
              { label: "Plan", value: selectedTariff?.name ?? "Custom" },
              { label: "Title", value: title || "—" },
              { label: "Seats", value: String(seatCount) },
              { label: "Per member", value: `₸${perMemberDerived.toLocaleString()}/${periodType.toLowerCase()}` },
              { label: "Start date", value: startDate.replace("T", " ") },
              ...(isTelecom
                ? [{ label: "Access", value: CONNECTION_OPTIONS.find((o) => o.value === connectionType)?.label ?? connectionType }]
                : []),
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-[13px]">
                <span style={{ color: "var(--eco-text-secondary)" }}>{row.label}</span>
                <span style={{ color: "var(--eco-text)" }}>{row.value}</span>
              </div>
            ))}
            {submitError && (
              <p className="text-[12px]" style={{ color: "var(--eco-negative)" }}>{submitError}</p>
            )}
            <div className="border-t pt-3" style={{ borderColor: "var(--eco-border)" }} />
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button variant="primary" className="flex-1" loading={submitting} onClick={handlePublish}>Publish Room</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
