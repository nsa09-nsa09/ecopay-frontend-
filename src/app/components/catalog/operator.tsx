import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { Card, Pill, Select, RoomStatusBadge, EmptyState, Tabs } from "../ds-primitives";
import { ArrowLeft, Users, Filter, Calendar } from "lucide-react";
import { getRooms, getService, getTariffs, type RoomSummaryDto, type ServiceDto, type TariffPlanDto } from "../../lib/api";

const moneyFormatter = new Intl.NumberFormat("ru-RU");

const operatorColors: Record<string, string> = {
  "beeline-family": "#FFB800",
  "activ-family": "#9B59B6",
  "altel-family": "#E74C3C",
  "tele2-family": "#1A1A2E",
  "kcell-family": "#00A651",
};

function getOperatorColor(service: ServiceDto | null) {
  if (!service) {
    return "var(--eco-primary)";
  }

  return operatorColors[service.slug] ?? "var(--eco-primary)";
}

function formatMoney(value: number | null | undefined) {
  return `₸${moneyFormatter.format(Number(value ?? 0))}`;
}

function formatDate(value: string | undefined) {
  if (!value) {
    return "TBD";
  }

  return new Date(value).toLocaleDateString();
}

export function OperatorPage() {
  const { id } = useParams<{ id: string }>();
  const serviceId = Number(id);

  const [service, setService] = useState<ServiceDto | null>(null);
  const [plans, setPlans] = useState<TariffPlanDto[]>([]);
  const [rooms, setRooms] = useState<RoomSummaryDto[]>([]);
  const [tab, setTab] = useState("Plans");
  const [priceFilter, setPriceFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadOperator() {
      if (!serviceId) {
        setError("Operator not found.");
        setLoading(false);
        return;
      }

      try {
        const [serviceResponse, tariffResponse, roomResponse] = await Promise.all([
          getService(serviceId),
          getTariffs(serviceId),
          getRooms({ status: "OPEN", size: 100 }),
        ]);

        if (!isCancelled) {
          setService(serviceResponse);
          setPlans(tariffResponse);
          setRooms(roomResponse.items.filter((room) => room.serviceId === serviceId));
        }
      } catch {
        if (!isCancelled) {
          setError("Unable to load operator details right now.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadOperator();

    return () => {
      isCancelled = true;
    };
  }, [serviceId]);

  const filteredRooms = rooms.filter((room) => {
    const monthlyPrice = Number(room.pricePerMember ?? 0);

    if (priceFilter === "low") {
      return monthlyPrice < 3000;
    }

    if (priceFilter === "mid") {
      return monthlyPrice >= 3000 && monthlyPrice <= 5000;
    }

    if (priceFilter === "high") {
      return monthlyPrice > 5000;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <Card>Loading operator details...</Card>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
          <ArrowLeft size={14} /> Catalog
        </Link>
        <EmptyState
          title="Operator unavailable"
          description={error ?? "This operator could not be loaded."}
        />
      </div>
    );
  }

  const noPlans = plans.length === 0;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> Catalog
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-[18px]"
          style={{ background: `${getOperatorColor(service)}18`, color: getOperatorColor(service) }}
        >
          {service.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{service.name}</h1>
          <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            {noPlans ? "No family/group plans available" : `${plans.length} plans · ${rooms.length} open rooms`}
          </p>
        </div>
      </div>

      {noPlans ? (
        <EmptyState
          title="No Family Plans Available"
          description={`${service.name} doesn't currently expose any shareable tariffs in the backend catalog.`}
        />
      ) : (
        <>
          <Tabs tabs={["Plans", "Available Rooms"]} active={tab} onChange={setTab} />

          {tab === "Plans" && (
            <div className="mt-6">
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--eco-border)" }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--eco-border)" }}>
                      {["Plan", "Members", "Total / period", "Per member", "Connection"].map((heading) => (
                        <th key={heading} className="px-4 py-3 text-left text-[12px]" style={{ color: "var(--eco-text-tertiary)", background: "var(--eco-surface)" }}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => (
                      <tr key={plan.id} style={{ borderBottom: "1px solid var(--eco-border)" }}>
                        <td className="px-4 py-3 text-[13px]" style={{ color: "var(--eco-text)" }}>{plan.name}</td>
                        <td className="px-4 py-3 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{plan.maxMembers}</td>
                        <td className="px-4 py-3 text-[13px]" style={{ color: "var(--eco-text)" }}>{formatMoney(plan.basePriceTotal)}</td>
                        <td className="px-4 py-3 text-[13px]" style={{ color: "var(--eco-primary)" }}>
                          {formatMoney(Number(plan.basePriceTotal ?? 0) / Math.max(plan.maxMembers ?? 1, 1))}
                        </td>
                        <td className="px-4 py-3">
                          <Pill variant="info">{plan.connectionType}</Pill>
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
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Filter size={14} style={{ color: "var(--eco-text-tertiary)" }} />
                <Select
                  options={[
                    { value: "all", label: "All prices" },
                    { value: "low", label: "Under ₸3,000" },
                    { value: "mid", label: "₸3,000-₸5,000" },
                    { value: "high", label: "Over ₸5,000" },
                  ]}
                  value={priceFilter}
                  onChange={(event) => setPriceFilter(event.target.value)}
                />
              </div>

              {filteredRooms.length === 0 ? (
                <EmptyState
                  title="No matching rooms"
                  description="Try another price filter or create a new room later."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredRooms.map((room) => (
                    <Link key={room.id} to={`/room/${room.id}`} style={{ textDecoration: "none" }}>
                      <Card className="flex flex-col gap-3 hover:shadow-sm transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>{room.title}</span>
                          <RoomStatusBadge status={room.status} />
                        </div>
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="inline-flex items-center gap-1" style={{ color: "var(--eco-text-secondary)" }}>
                            <Users size={13} /> Max {room.maxMembers} members
                          </span>
                          <span style={{ color: "var(--eco-primary)" }}>{formatMoney(room.pricePerMember)}/mo</span>
                        </div>
                        <div className="flex items-center justify-between text-[12px]">
                          <span style={{ color: "var(--eco-text-tertiary)" }}>Owner: {room.ownerDisplayName}</span>
                          <span className="inline-flex items-center gap-1" style={{ color: "var(--eco-text-tertiary)" }}>
                            <Calendar size={12} /> {formatDate(room.startDate)}
                          </span>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
