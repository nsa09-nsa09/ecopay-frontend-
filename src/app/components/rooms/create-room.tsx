import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Card, Button, Input, Select, Stepper, Badge } from "../ds-primitives";
import { ArrowLeft, AlertTriangle, Lock, Check, Shield, Info } from "lucide-react";
import { catalogApi } from "../../../lib/api/catalog";
import { roomsApi } from "../../../lib/api/rooms";
import { ApiError } from "../../../lib/api/client";

const stepLabels = ["Operator & Plan", "Room Settings", "Access Method", "Review"];
const DRAFT_KEY = "ecopay:create-room-draft";

// Primitive field rules (cross-field rules — seats≤plan max, telecom terms, future
// date — are checked in validate() since they depend on the selected tariff).
const baseSchema = z.object({
  serviceId: z.string().min(1, "Choose a service"),
  tariffId: z.string().min(1, "Choose a plan"),
  seats: z.coerce.number().int("Whole number").min(2, "At least 2 seats"),
  totalPrice: z.coerce.number().positive("Price must be greater than 0"),
  accessType: z.string().min(1, "Choose an access type"),
});

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftRestored, setDraftRestored] = useState(false);

  // Restore a saved draft once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.serviceId) setServiceId(d.serviceId);
      if (d.tariffId) setTariffId(d.tariffId);
      if (d.seats) setSeats(d.seats);
      if (d.totalPrice) setTotalPrice(d.totalPrice);
      if (d.startDate) setStartDate(d.startDate);
      if (d.access) setAccess(d.access);
      if (d.accessType) setAccessType(d.accessType);
      if (typeof d.confirmed === "boolean") setConfirmed(d.confirmed);
      setDraftRestored(true);
    } catch {
      /* ignore malformed draft */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist a draft as the user edits (skip once published).
  useEffect(() => {
    if (published) return;
    const draft = { serviceId, tariffId, seats, totalPrice, startDate, access, accessType, confirmed };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* storage may be unavailable */
    }
  }, [serviceId, tariffId, seats, totalPrice, startDate, access, accessType, confirmed, published]);

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
    setServiceId(""); setTariffId(""); setSeats("4"); setTotalPrice("19999");
    setStartDate(""); setAccess("esim"); setAccessType("FAMILY_PLAN"); setConfirmed(false);
    setErrors({}); setDraftRestored(false); setStep(0);
    toast.success("Draft cleared");
  };

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

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const parsed = baseSchema.safeParse({ serviceId, tariffId, seats, totalPrice, accessType });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!errs[key]) errs[key] = issue.message;
      }
    }
    const seatsNum = Number(seats);
    if (!errs.seats && selectedTariff && Number.isFinite(seatsNum) && seatsNum > selectedTariff.maxMembers) {
      errs.seats = `This plan allows up to ${selectedTariff.maxMembers} seats`;
    }
    if (roomType === "TELECOM" && !confirmed) {
      errs.confirmed = "Confirm operator terms to continue";
    }
    if (startDate) {
      const d = new Date(`${startDate}T00:00:00`);
      if (d.getTime() <= Date.now()) errs.startDate = "Start date must be in the future";
    }
    return errs;
  };

  // Which step a given field lives on, so we can jump back to the first error.
  const fieldStep: Record<string, number> = {
    serviceId: 0, tariffId: 0, seats: 1, totalPrice: 1, startDate: 1, accessType: 2, confirmed: 2,
  };

  const handlePublish = () => {
    const errs = validate();
    setErrors(errs);
    const keys = Object.keys(errs);
    if (keys.length > 0) {
      const firstStep = Math.min(...keys.map((k) => fieldStep[k] ?? 0));
      setStep(firstStep);
      toast.error("Please fix the highlighted fields before publishing");
      return;
    }
    createMutation.mutate();
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
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
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
          Your {selectedService?.name ?? "room"}{selectedTariff ? ` ${selectedTariff.name}` : ""} room is now visible in the catalog. Members can apply to join.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/rooms" style={{ textDecoration: "none" }}><Button variant="secondary">My Rooms</Button></Link>
          {selectedService && <Link to={`/operator/${selectedService.id}`} style={{ textDecoration: "none" }}><Button variant="primary">View in Catalog</Button></Link>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <Link to="/rooms" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> My Rooms
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[26px]" style={{ color: "var(--eco-text)" }}>Create Room</h1>
        <button onClick={clearDraft} className="text-[12px]" style={{ color: "var(--eco-text-tertiary)", background: "none", border: "none", cursor: "pointer" }}>
          Clear draft
        </button>
      </div>

      {draftRestored && (
        <div className="p-3 rounded-lg flex items-center gap-2 mb-4 text-[13px]" style={{ background: "var(--eco-brand-50)", color: "var(--eco-text-secondary)" }}>
          <Info size={14} style={{ color: "var(--eco-primary)" }} /> Restored your saved draft.
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
        <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>Read-only</div>
      </div>

      <Stepper steps={stepLabels} current={step} />

      <div className="mt-8">
        {/* Step 0: Operator & Plan */}
        {step === 0 && (
          <Card className="flex flex-col gap-4">
            <Select
              label="Operator / Provider"
              error={errors.serviceId}
              options={[
                { value: "", label: services.length ? "Select operator" : "Loading..." },
                ...services.map((s) => ({ value: String(s.id), label: s.name })),
              ]}
              value={serviceId}
              onChange={(e) => { setServiceId(e.target.value); setTariffId(""); }}
            />
            <Select
              label="Plan Type"
              error={errors.tariffId}
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
              error={errors.seats}
              hint={selectedTariff ? `Minimum 2, up to ${selectedTariff.maxMembers} for this plan` : "Minimum 2 members including you"}
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
              error={errors.totalPrice}
              hint={seats && Number(seats) > 0 ? `≈ ₸${Math.round((Number(totalPrice) || 0) / Number(seats)).toLocaleString()} per member` : undefined}
            />
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              error={errors.startDate}
              hint="Leave empty to start tomorrow"
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
              error={errors.accessType}
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
              <div className="flex flex-col gap-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" className="mt-0.5" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                  <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                    I confirm that this operator supports family/group plans and I am the account holder or authorized to share.
                  </span>
                </label>
                {errors.confirmed && <span style={{ color: "var(--eco-negative)", fontSize: 12 }}>{errors.confirmed}</span>}
              </div>
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
            <p className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>This is exactly how members will see your room.</p>
            {[
              { label: "Service", value: selectedService?.name ?? "—" },
              { label: "Plan", value: selectedTariff ? `${selectedTariff.name} — ₸${(Number(totalPrice) || 0).toLocaleString()}/mo` : "—" },
              { label: "Seats", value: seats },
              { label: "Per member", value: `₸${(Number(seats) > 0 ? Math.round((Number(totalPrice) || 0) / Number(seats)) : 0).toLocaleString()}/mo` },
              { label: "Start date", value: startDate || "Tomorrow" },
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
                onClick={handlePublish}
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