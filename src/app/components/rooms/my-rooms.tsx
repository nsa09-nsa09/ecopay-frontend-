import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Card, Button, Tabs, RoomStatusBadge, MemberStatusBadge, EmptyState, Select } from "../ds-primitives";
import { Plus, Users, ArrowRight, Calendar, Filter, ChevronDown, ChevronUp } from "lucide-react";
import {
  getJoinedRooms,
  getMyRooms,
  type JoinedRoomDto,
  type RoomSummaryDto,
} from "../../lib/api";
import { useAuth } from "../auth/auth-provider";
import { Card, Button, Tabs, RoomStatusBadge, MemberStatusBadge, Badge, EmptyState, Select } from "../ds-primitives";
import { Plus, Users, Clock, ArrowRight, Calendar, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { useI18n } from "../i18n-provider";

const moneyFormatter = new Intl.NumberFormat("ru-RU");

function formatMoney(value: number | null | undefined) {
  return `₸${moneyFormatter.format(Number(value ?? 0))}`;
}

function formatDate(value: string | undefined) {
  return value ? new Date(value).toLocaleDateString() : "TBD";
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "IN_VERIFICATION", label: "In Verification" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "BLOCKED", label: "Blocked" },
];

export function MyRoomsPage() {
  const { isAuthenticated, isReady, authorizedRequest } = useAuth();

  const [tab, setTab] = useState("Joined");
const STATUS_VALUES = ["ALL", "OPEN", "IN_VERIFICATION", "ACTIVE", "COMPLETED", "BLOCKED"];
const OPERATOR_VALUES = ["ALL", "Beeline", "Activ", "Altel", "Tele2", "Kcell"];

export function MyRoomsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"joined" | "created">("joined");

  const STATUS_OPTIONS = STATUS_VALUES.map((value) => ({
    value,
    label: value === "ALL" ? t("allStatuses") : t(`roomStatus.${value}`),
  }));
  const OPERATOR_OPTIONS = OPERATOR_VALUES.map((value) => ({
    value,
    label: value === "ALL" ? t("allOperators") : value,
  }));
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [operatorFilter, setOperatorFilter] = useState("ALL");

  const [joined, setJoined] = useState<JoinedRoomDto[]>([]);
  const [created, setCreated] = useState<RoomSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      authorizedRequest((token) => getJoinedRooms(token)),
      authorizedRequest((token) => getMyRooms(token, { size: 100 })),
    ])
      .then(([joinedRooms, ownedRooms]) => {
        if (cancelled) return;
        setJoined(joinedRooms);
        setCreated(ownedRooms.items);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load your rooms right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isReady, isAuthenticated, authorizedRequest]);

  const operatorOptions = useMemo(() => {
    const names = new Set<string>();
    joined.forEach((r) => r.serviceName && names.add(r.serviceName));
    created.forEach((r) => r.serviceName && names.add(r.serviceName));
    return [{ value: "ALL", label: "All operators" }, ...[...names].sort().map((n) => ({ value: n, label: n }))];
  }, [joined, created]);

  const filteredJoined = joined.filter((r) => {
    if (statusFilter !== "ALL" && r.roomStatus !== statusFilter) return false;
    if (operatorFilter !== "ALL" && r.serviceName !== operatorFilter) return false;
    return true;
  });

  const filteredCreated = created.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (operatorFilter !== "ALL" && r.serviceName !== operatorFilter) return false;
    return true;
  });

  if (isReady && !isAuthenticated) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <EmptyState
          title="Sign in to see your rooms"
          description="Log in to view rooms you've joined or created."
        />
        <div className="flex justify-center mt-4">
          <Link to="/login?redirect=/rooms" style={{ textDecoration: "none" }}>
            <Button variant="primary">Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-[26px]" style={{ color: "var(--eco-text)" }}>{t("myRooms")}</h1>
        <Link to="/rooms/create" style={{ textDecoration: "none" }}>
          <Button variant="primary" size="sm"><Plus size={14} /> {t("createRoom")}</Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[t("tabJoined"), t("tabCreated")]}
        active={tab === "joined" ? t("tabJoined") : t("tabCreated")}
        onChange={(label) => setTab(label === t("tabJoined") ? "joined" : "created")}
      />

      {/* Filter toggle */}
      <div className="mt-4 mb-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] cursor-pointer transition-colors"
          style={{ color: "var(--eco-text-secondary)", background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}
        >
          <Filter size={14} />
          {t("filters")}
          {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Status" options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
            <Select label="Operator" options={operatorOptions} value={operatorFilter} onChange={(e) => setOperatorFilter(e.target.value)} />
            <Select label={t("status")} options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
            <Select label={t("operator")} options={OPERATOR_OPTIONS} value={operatorFilter} onChange={(e) => setOperatorFilter(e.target.value)} />
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setStatusFilter("ALL"); setOperatorFilter("ALL"); }}
              >
                {t("clearFilters")}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Card className="mb-4"><span style={{ color: "var(--eco-negative)" }}>{error}</span></Card>
      )}

      {/* Content */}
      <div className="mt-4">
        {loading ? (
          <Card>Loading your rooms...</Card>
        ) : tab === "Joined" ? (
          <div className="flex flex-col gap-3">
            {filteredJoined.length === 0 ? (
              <EmptyState title="No Rooms Found" description="You haven't joined any rooms yet. Browse the catalog to join a room." />
        {tab === "joined" && (
          <div className="flex flex-col gap-3">
            {filteredJoined.length === 0 ? (
              <EmptyState title={t("noRoomsFound")} description={t("noRoomsJoinedDesc")} />
            ) : (
              filteredJoined.map((r) => (
                <Link key={r.memberId} to={`/rooms/member/${r.roomId}`} style={{ textDecoration: "none" }}>
                  <Card className="flex flex-col gap-3 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>{r.title}</div>
                        <div className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{r.serviceName}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MemberStatusBadge status={r.memberStatus} />
                        <RoomStatusBadge status={r.roomStatus} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} /> {formatDate(r.startDate)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users size={13} /> {r.maxMembers} seats
                      </span>
                      <span style={{ color: "var(--eco-primary)" }}>
                        {formatMoney(r.pricePerMember)}/period
                        <Users size={13} /> {r.filled}/{r.seats} {t("seatsLower")}
                      </span>
                      <span style={{ color: "var(--eco-primary)" }}>
                        ₸{r.perMember.toLocaleString()}{t("perMonthShort")}
                      </span>
                    </div>

                    <div className="flex items-center justify-end">
                      <span className="text-[13px] flex items-center gap-1" style={{ color: "var(--eco-primary)" }}>
                        {t("viewDetailsAction")} <ArrowRight size={14} />
                      </span>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredCreated.length === 0 ? (
              <EmptyState title="No Rooms Found" description="You haven't created any rooms yet. Create a room to start sharing a plan." />
        )}

        {tab === "created" && (
          <div className="flex flex-col gap-3">
            {filteredCreated.length === 0 ? (
              <EmptyState title={t("noRoomsFound")} description={t("noRoomsCreatedDesc")} />
            ) : (
              filteredCreated.map((r) => (
                <Link key={r.id} to={`/rooms/owner/${r.id}`} style={{ textDecoration: "none" }}>
                  <Card className="flex flex-col gap-3 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>{r.title}</div>
                        <div className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{r.serviceName}</div>
                        <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>{r.name}</div>
                        <div className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{r.operator}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <RoomStatusBadge status={r.status} />
                        {r.applicants > 0 && (
                          <Badge variant="warning">{t("pendingCount", { count: r.applicants })}</Badge>
                        )}
                      </div>
                      <RoomStatusBadge status={r.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} /> {formatDate(r.startDate)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users size={13} /> {r.maxMembers} seats
                      </span>
                      <span style={{ color: "var(--eco-primary)" }}>
                        {formatMoney(r.pricePerMember)}/period per member
                        <Users size={13} /> {r.filled}/{r.seats} {t("seatsLower")}
                      </span>
                      <span style={{ color: "var(--eco-primary)" }}>
                        ₸{r.perMember.toLocaleString()}{t("perMemberMonth")}
                      </span>
                    </div>

                    <div className="flex items-center justify-end">
                      <span className="text-[13px] flex items-center gap-1" style={{ color: "var(--eco-primary)" }}>
                        {t("manage")} <ArrowRight size={14} />
                      </span>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
