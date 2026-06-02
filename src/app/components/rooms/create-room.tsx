import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, Button, Input, Select, Stepper, Badge } from "../ds-primitives";
import { ArrowLeft, AlertTriangle, Lock, Check, Shield, Info } from "lucide-react";
import { catalogApi } from "../../../lib/api/catalog";
import { roomsApi } from "../../../lib/api/rooms";
import { ApiError } from "../../../lib/api/client";

const stepLabels = ["Operator & Plan", "Room Settings", "Access Method", "Review"];

export function CreateRoomPage() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params] = useSearchParams();

  const servicesQuery = useQuery({
    queryKey: ["catalog", "services"],
    queryFn: () => catalogApi.services(),
  });

  const [serviceId, setServiceId] = useState(params.get("serviceId") ?? "");
  const [tariffId, setTariffId] = useState(params.get("tariffId") ?? "");

  const tariffsQuery = useQuery({
    queryKey: ["catalog", "tariffs", serviceId],
    queryFn: () => catalogApi.tariffs(serviceId),
    enabled: Boolean(serviceId),
  });

  const services = servicesQuery.data ?? [];
  const tariffs = tariffsQuery.data ?? [];
  const selectedTariff = useMemo(
    () => tariffs.find((t) => String(t.id) === tariffId),
    [tariffs, tariffId],
  );
  const selectedService = useMemo(
    () => services.find((s) => String(s.id) === serviceId),
    [services, serviceId],
  );
  // DIGITAL provider → DIGITAL room; OPERATOR/ISP → TELECOM room
  const roomType: "DIGITAL" | "TELECOM" =
    selectedService?.providerType === "DIGITAL" ? "DIGITAL" : "TELECOM";

  const [seats, setSeats] = useState("4");
  const [priceModel, setPriceModel] = useState("total");
  const [totalPrice, setTotalPrice] = useState("19999");
  const [startDate, setStartDate] = useState("");
  const [access, setAccess] = useState("esim");
  const [accessType, setAccessType] = useState<"FAMILY_PLAN" | "SHARED_ACCOUNT" | "INVITE_LINK" | "EMAIL_INVITE">("FAMILY_PLAN");
  const [confirmed, setConfirmed] = useState(false);
  const [published, setPublished] = useState(false);

  // Sync seats/price defaults when tariff selected
  useMemo(() => {
    if (selectedTariff) {
      setSeats(String(selectedTariff.maxMembers));
      if (selectedTariff.basePriceTotal != null) {
        setTotalPrice(String(selectedTariff.basePriceTotal));
      }
    }
  }, [selectedTariff]);

  const accessToConnectionType: Record<string, "ESIM" | "SIM" | "ACCOUNT_LINK"> = {
    esim: "ESIM",
    sim: "SIM",
    account: "ACCOUNT_LINK",
  };

  const createMutation = useMutation({
    mutationFn: () => {
      const seatsNum = Math.max(2, parseInt(seats || "2", 10) || 2);
      const totalNum = parseFloat(totalPrice || "0") || 0;
      const isTelecom = roomType === "TELECOM";
      return roomsApi.create({
        serviceId: Number(serviceId),
        tariffPlanId: tariffId ? Number(tariffId) : undefined,
        categoryId: selectedService?.categoryId,
        roomType,
        title: selectedTariff
          ? `${selectedService?.name ?? ""} ${selectedTariff.name}`.trim()
          : `${selectedService?.name ?? "Room"}`,
        maxMembers: seatsNum,
        priceTotal: totalNum,
        pricePerMember: Math.round((totalNum / seatsNum) * 100) / 100,
        currency: selectedTariff?.currency ?? "KZT",
        periodType: selectedTariff?.periodType ?? "MONTHLY",
        accessType,
        // Backend requires a future start date; default to tomorrow if empty.
        startDate: `${startDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10)}T00:00:00`,
        ...(isTelecom
          ? {
              providerName: selectedService?.name,
              connectionType: accessToConnectionType[access] ?? "OTHER",
              operatorTermsConfirmed: confirmed,
            }
          : {}),
      });
    },
    onSuccess: (room) => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room published");
      setPublished(true);
      // Send to owner detail
      setTimeout(() => navigate(`/rooms/owner/${room.id}`), 600);
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : "Failed to create room";
      toast.error(msg);
    },
  });

  if (published) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "var(--eco-success-100)" }}>
          <Check size={24} style={{ color: "var(--eco-positive)" }} />
        </div>
        <h1 className="text-[24px] mb-2" style={{ color: "var(--eco-text)" }}>Room Published</h1>
        <p className="text-[13px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
          Your room "Beeline Family 4" is now visible in the catalog. Members can apply to join.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/rooms" style={{ textDecoration: "none" }}><Button variant="secondary">My Rooms</Button></Link>
          <Link to="/operator/beeline" style={{ textDecoration: "none" }}><Button variant="primary">View in Catalog</Button></Link>
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
        <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>Read-only</div>
      </div>

      <Stepper steps={stepLabels} current={step} />

      <div className="mt-8">
        {/* Step 0: Operator & Plan */}
        {step === 0 && (
          <Card className="flex flex-col gap-4">
            <Select
              label="Operator / Provider"
              options={[
                { value: "", label: services.length ? "Select operator" : "Loading..." },
                ...services.map((s) => ({ value: String(s.id), label: s.name })),
              ]}
              value={serviceId}
              onChange={(e) => { setServiceId(e.target.value); setTariffId(""); }}
            />
            <Select
              label="Plan Type"
              options={[
                { value: "", label: tariffs.length ? "Select plan" : (serviceId ? "Loading..." : "Pick operator first") },
                ...tariffs.map((t) => ({ value: String(t.id), label: `${t.name} — ₸${(t.basePriceTotal ?? 0).toLocaleString()}/mo (${t.maxMembers} seats)` })),
              ]}
              value={tariffId}
              onChange={(e) => setTariffId(e.target.value)}
            />
            <div className="text-[12px] p-3 rounded-lg" style={{ background: "var(--eco-brand-50)", color: "var(--eco-text-secondary)" }}>
              Tip: Choose the exact plan from your operator. Incorrect plan details may cause verification issues.
            </div>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => setStep(1)}
              disabled={!serviceId || !tariffId}
            >
              Continue
            </Button>
          </Card>
        )}

        {/* Step 1: Room Settings */}
        {step === 1 && (
          <Card className="flex flex-col gap-4">
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
            <Input
              label="Total Monthly Price (₸)"
              type="number"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
            />
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <div className="p-3 rounded-lg flex items-start gap-2 text-[12px]" style={{ background: "var(--eco-warning-100)", color: "var(--eco-text-secondary)" }}>
              <Lock size={14} className="mt-0.5 shrink-0" style={{ color: "var(--eco-warning)" }} />
              Operator, plan, seats, and price are locked after the start date. Editing requires cancelling the room.
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
              <Button variant="primary" className="flex-1" onClick={() => setStep(2)}>Continue</Button>
            </div>
          </Card>
        )}

        {/* Step 2: Access Method */}
        {step === 2 && (
          <Card className="flex flex-col gap-4">
            <Select
              label="How will members get access?"
              options={[
                { value: "FAMILY_PLAN", label: "Family / group plan (add member)" },
                { value: "SHARED_ACCOUNT", label: "Shared account login" },
                { value: "INVITE_LINK", label: "Invite link" },
                { value: "EMAIL_INVITE", label: "Invite by member's email" },
              ]}
              value={accessType}
              onChange={(e) => setAccessType(e.target.value as typeof accessType)}
              hint="How you'll grant access after a member pays"
            />
            {roomType === "TELECOM" && (
              <Select
                label="Connection method"
                options={[
                  { value: "esim", label: "eSIM activation" },
                  { value: "sim", label: "Physical SIM card" },
                  { value: "account", label: "Operator account invite" },
                ]}
                value={access}
                onChange={(e) => setAccess(e.target.value)}
              />
            )}
            {roomType === "TELECOM" && (
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-0.5" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                  I confirm that this operator supports family/group plans and I am the account holder or authorized to share.
                </span>
              </label>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button variant="primary" className="flex-1" disabled={roomType === "TELECOM" && !confirmed} onClick={() => setStep(3)}>Continue</Button>
            </div>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <Card className="flex flex-col gap-4">
            <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>Review & Publish</h3>
            {[
              { label: "Operator", value: "Beeline" },
              { label: "Plan", value: "Family 4 — ₸19,999/mo" },
              { label: "Seats", value: seats },
              { label: "Per member", value: `₸${Math.round(parseInt(totalPrice) / parseInt(seats)).toLocaleString()}/mo` },
              { label: "Start date", value: startDate },
              { label: "Access type", value: { FAMILY_PLAN: "Family / group plan", SHARED_ACCOUNT: "Shared account", INVITE_LINK: "Invite link", EMAIL_INVITE: "Email invite" }[accessType] },
              ...(roomType === "TELECOM" ? [{ label: "Connection", value: access === "esim" ? "eSIM activation" : access === "sim" ? "Physical SIM" : "Account invite" }] : []),
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-[13px]">
                <span style={{ color: "var(--eco-text-secondary)" }}>{row.label}</span>
                <span style={{ color: "var(--eco-text)" }}>{row.value}</span>
              </div>
            ))}
            <div className="border-t pt-3" style={{ borderColor: "var(--eco-border)" }} />
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? "Publishing..." : "Publish Room"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}