import { useParams, Link } from "react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Badge, Pill, Button, Input, Select, RoomAvailabilityBadge, EmptyState, Tabs, WaveDivider } from "../ds-primitives";
import { ArrowLeft, Users, Star, Filter } from "lucide-react";
import { catalogApi } from "../../../lib/api/catalog";
import { roomsApi } from "../../../lib/api/rooms";

interface Plan {
  id: string;
  name: string;
  persons: number;
  price: number;
  perPerson: number;
  tags: string[];
}

interface Room {
  id: string;
  plan: string;
  owner: string;
  rating: number;
  seats: number;
  filled: number;
  freeSeats?: number;
  verified?: boolean;
  price: number;
  status: string;
}

const operatorData: Record<string, { name: string; color: string; plans: Plan[]; rooms: Room[] }> = {
  beeline: {
    name: "Beeline",
    color: "#FFB800",
    plans: [
      { id: "b1", name: "Solo", persons: 1, price: 4390, perPerson: 4390, tags: [] },
      { id: "b2", name: "Duo Bundle", persons: 2, price: 15999, perPerson: 8000, tags: ["Bundle includes home internet"] },
      { id: "b4", name: "Family 4", persons: 4, price: 19999, perPerson: 5000, tags: ["Bundle includes home internet"] },
      { id: "b6", name: "Family 6", persons: 6, price: 23999, perPerson: 4000, tags: ["Bundle includes home internet"] },
    ],
    rooms: [
      { id: "r1", plan: "Family 4", owner: "Aidar K.", rating: 4.8, seats: 4, filled: 3, price: 5000, status: "OPEN" },
      { id: "r2", plan: "Duo Bundle", owner: "Dana M.", rating: 4.5, seats: 2, filled: 1, price: 8000, status: "ACTIVE" },
      { id: "r3", plan: "Family 6", owner: "Ruslan T.", rating: 4.9, seats: 6, filled: 4, price: 4000, status: "OPEN" },
    ],
  },
  activ: {
    name: "Activ",
    color: "#9B59B6",
    plans: [
      { id: "a1", name: "Solo", persons: 1, price: 4590, perPerson: 4590, tags: [] },
      { id: "a3", name: "Family 3", persons: 3, price: 9520, perPerson: 3174, tags: [] },
      { id: "a5", name: "Family 5", persons: 5, price: 11020, perPerson: 2204, tags: [] },
      { id: "a7", name: "Family 7", persons: 7, price: 14770, perPerson: 2110, tags: [] },
      { id: "a8", name: "Family 8", persons: 8, price: 14690, perPerson: 1836, tags: [] },
      { id: "a11", name: "Family 11", persons: 11, price: 19690, perPerson: 1790, tags: [] },
    ],
    rooms: [
      { id: "r4", plan: "Family 5", owner: "Madina A.", rating: 4.7, seats: 5, filled: 2, price: 2204, status: "OPEN" },
      { id: "r5", plan: "Family 7", owner: "Timur B.", rating: 4.3, seats: 7, filled: 7, price: 2110, status: "ACTIVE" },
    ],
  },
  altel: {
    name: "Altel",
    color: "#E74C3C",
    plans: [
      { id: "al1", name: "Solo", persons: 1, price: 3990, perPerson: 3990, tags: [] },
      { id: "al2", name: "Duo", persons: 2, price: 7990, perPerson: 3995, tags: [] },
      { id: "al4", name: "Family 4", persons: 4, price: 13990, perPerson: 3498, tags: [] },
    ],
    rooms: [
      { id: "r6", plan: "Family 4", owner: "Asel N.", rating: 5.0, seats: 4, filled: 1, price: 3498, status: "OPEN" },
    ],
  },
  tele2: {
    name: "Tele2",
    color: "#1A1A2E",
    plans: [
      { id: "t1", name: "Solo", persons: 1, price: 5790, perPerson: 5790, tags: ["Promo price first month"] },
      { id: "t3", name: "Family 3", persons: 3, price: 13490, perPerson: 4497, tags: [] },
      { id: "t4", name: "Family 4 Bundle", persons: 4, price: 15490, perPerson: 3873, tags: ["Bundle includes home internet"] },
    ],
    rooms: [
      { id: "r7", plan: "Family 4 Bundle", owner: "Yerlan K.", rating: 4.6, seats: 4, filled: 2, price: 3873, status: "OPEN" },
    ],
  },
  kcell: {
    name: "Kcell",
    color: "#00A651",
    plans: [],
    rooms: [],
  },
};

export function OperatorPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState("Plans");

  // Server-side room filters
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [minFreeSeats, setMinFreeSeats] = useState("0");
  const [accessTypeFilter, setAccessTypeFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const roomFilters = {
    serviceId: id!,
    status: "OPEN" as const,
    size: 50,
    priceMin: priceMin ? Number(priceMin) : undefined,
    priceMax: priceMax ? Number(priceMax) : undefined,
    minFreeSeats: minFreeSeats && minFreeSeats !== "0" ? Number(minFreeSeats) : undefined,
    accessType: accessTypeFilter ? (accessTypeFilter as any) : undefined,
    verifiedOwnerOnly: verifiedOnly || undefined,
  };

  const clearFilters = () => {
    setPriceMin(""); setPriceMax(""); setMinFreeSeats("0"); setAccessTypeFilter(""); setVerifiedOnly(false);
  };
  const hasActiveFilters = Boolean(priceMin || priceMax || (minFreeSeats && minFreeSeats !== "0") || accessTypeFilter || verifiedOnly);

  const serviceQuery = useQuery({
    queryKey: ["catalog", "service", id],
    queryFn: () => catalogApi.service(id!),
    enabled: Boolean(id),
  });
  const tariffsQuery = useQuery({
    queryKey: ["catalog", "tariffs", id],
    queryFn: () => catalogApi.tariffs(id!),
    enabled: Boolean(id),
  });
  const roomsQuery = useQuery({
    queryKey: ["rooms", "byService", id, roomFilters],
    queryFn: () => roomsApi.list(roomFilters),
    enabled: Boolean(id),
  });

  const fallback = operatorData[id || ""] || { name: "—", color: "#888", plans: [], rooms: [] };

  const op = useMemo(() => {
    const tariffs = tariffsQuery.data ?? [];
    const rooms = roomsQuery.data?.items ?? [];
    const name = serviceQuery.data?.name ?? fallback.name;
    return {
      name,
      color: fallback.color,
      plans: tariffs.map<Plan>((t) => ({
        id: t.id,
        name: t.name,
        persons: t.seats,
        price: t.price,
        perPerson: t.seats > 0 ? Math.round(t.price / t.seats) : t.price,
        tags: t.features ?? [],
      })),
      rooms: rooms.map<Room>((r) => ({
        id: String(r.id),
        plan: r.title ?? r.serviceName ?? "—",
        owner: r.ownerDisplayName ?? "—",
        rating: r.ownerRating ?? 0,
        seats: r.maxMembers,
        filled: r.filledSeats ?? 0,
        freeSeats: r.freeSeats ?? Math.max(0, r.maxMembers - (r.filledSeats ?? 0)),
        verified: r.ownerVerified ?? false,
        price: Number(r.pricePerMember),
        status: r.status,
      })),
    };
  }, [serviceQuery.data, tariffsQuery.data, roomsQuery.data, fallback]);

  const isLoading = serviceQuery.isLoading || tariffsQuery.isLoading;
  const noPlans = !isLoading && op.plans.length === 0;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <Link to="/" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> Catalog
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-[18px]"
          style={{ background: op.color + "18", color: op.color }}
        >
          {op.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{op.name}</h1>
          <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            {noPlans ? "No family/group plans available" : `${op.plans.length} plans · ${op.rooms.length} open rooms`}
          </p>
        </div>
      </div>

      {noPlans ? (
        <EmptyState
          title="No Family Plans Available"
          description="Kcell doesn't currently offer family or group plans that can be shared. Room creation is disabled for this operator."
        />
      ) : (
        <>
          <Tabs tabs={["Plans", "Available Rooms"]} active={tab} onChange={setTab} />

          {tab === "Plans" && (
            <div className="mt-6">
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-4 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: "var(--eco-brand-500)" }} /> Bundle includes home internet
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: "var(--eco-warning-500)" }} /> Promo price first month
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--eco-border)" }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--eco-border)" }}>
                      {["Plan", "Persons", "Total / mo", "Per person", "Tags"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[12px]" style={{ color: "var(--eco-text-tertiary)", background: "var(--eco-surface)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {op.plans.map((p) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid var(--eco-border)" }}>
                        <td className="px-4 py-3 text-[13px]" style={{ color: "var(--eco-text)" }}>{p.name}</td>
                        <td className="px-4 py-3 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{p.persons}</td>
                        <td className="px-4 py-3 text-[13px]" style={{ color: "var(--eco-text)" }}>₸{p.price.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[13px]" style={{ color: "var(--eco-primary)" }}>₸{p.perPerson.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {p.tags.map((t) => (
                              <Pill key={t} variant={t.includes("Bundle") ? "info" : "warning"}>{t}</Pill>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "Available Rooms" && (
            <div className="mt-6">
              {/* Filters */}
              <Card className="flex flex-col gap-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                    <Filter size={14} /> Filters
                  </span>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-[12px]" style={{ color: "var(--eco-primary)", background: "none", border: "none", cursor: "pointer" }}>
                      Clear filters
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Input label="Price from (₸)" type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="0" />
                  <Input label="Price to (₸)" type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Any" />
                  <Select
                    label="Free seats"
                    options={[
                      { value: "0", label: "Any" },
                      { value: "1", label: "1+ free" },
                      { value: "2", label: "2+ free" },
                      { value: "3", label: "3+ free" },
                    ]}
                    value={minFreeSeats}
                    onChange={(e) => setMinFreeSeats(e.target.value)}
                  />
                  <Select
                    label="Access type"
                    options={[
                      { value: "", label: "Any" },
                      { value: "FAMILY_PLAN", label: "Family plan" },
                      { value: "SHARED_ACCOUNT", label: "Shared account" },
                      { value: "INVITE_LINK", label: "Invite link" },
                      { value: "EMAIL_INVITE", label: "Email invite" },
                    ]}
                    value={accessTypeFilter}
                    onChange={(e) => setAccessTypeFilter(e.target.value)}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                  <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
                  Verified owners only
                </label>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {op.rooms.map((r) => (
                  <Link key={r.id} to={`/room/${r.id}`} style={{ textDecoration: "none" }}>
                    <Card className="flex flex-col gap-3 hover:shadow-sm transition-shadow cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>{r.plan}</span>
                        <RoomAvailabilityBadge status={r.status} freeSeats={r.freeSeats} />
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span style={{ color: "var(--eco-text-secondary)" }}>
                          <span className="inline-flex items-center gap-1">
                            <Users size={13} /> {r.freeSeats ?? Math.max(0, r.seats - r.filled)} of {r.seats} free
                          </span>
                        </span>
                        <span style={{ color: "var(--eco-primary)" }}>₸{r.price.toLocaleString()}/mo</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "var(--eco-neutral-200)" }}>
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${r.seats ? (r.filled / r.seats) * 100 : 0}%`, background: "var(--eco-primary)" }} />
                      </div>
                      <div className="flex items-center justify-between text-[12px]">
                        <span style={{ color: "var(--eco-text-tertiary)" }}>Owner: {r.owner}</span>
                        <span className="flex items-center gap-0.5" style={{ color: "var(--eco-warning)" }}>
                          <Star size={12} fill="currentColor" /> {r.rating}
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
