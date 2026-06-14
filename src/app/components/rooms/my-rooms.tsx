import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Card,
  Button,
  Tabs,
  RoomStatusBadge,
  MemberStatusBadge,
  EmptyState,
  Select,
} from "../ds-primitives";
import { Plus, Users, ArrowRight, Calendar, Filter, ChevronDown, ChevronUp } from "lucide-react";
import {
  getJoinedRooms,
  getMyRooms,
  type JoinedRoomDto,
  type RoomSummaryDto,
} from "../../lib/api";
import { useAuth } from "../auth/auth-provider";
import { useI18n } from "../i18n-provider";

const moneyFormatter = new Intl.NumberFormat("ru-RU");

function formatMoney(value: number | null | undefined) {
  return `₸${moneyFormatter.format(Number(value ?? 0))}`;
}

function formatDate(value: string | undefined) {
  return value ? new Date(value).toLocaleDateString() : "TBD";
}

const STATUS_VALUES = ["ALL", "OPEN", "IN_VERIFICATION", "ACTIVE", "COMPLETED", "CANCELLED", "BLOCKED"];
const OPERATOR_VALUES = ["ALL", "Beeline", "Activ", "Altel", "Tele2", "Kcell"];

export function MyRoomsPage() {
  const { t } = useI18n();
  const { isAuthenticated, isReady, authorizedRequest } = useAuth();

  const [tab, setTab] = useState<"joined" | "created">("joined");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [operatorFilter, setOperatorFilter] = useState("ALL");

  const [joined, setJoined] = useState<JoinedRoomDto[]>([]);
  const [created, setCreated] = useState<RoomSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = useMemo(
    () =>
      STATUS_VALUES.map((value) => ({
        value,
        label: value === "ALL" ? t("allStatuses") : t(`roomStatus.${value}`),
      })),
    [t],
  );

  const operatorOptions = useMemo(() => {
    const names = new Set<string>();

    joined.forEach((room) => {
      if (room.serviceName) names.add(room.serviceName);
    });

    created.forEach((room) => {
      if (room.serviceName) names.add(room.serviceName);
    });

    OPERATOR_VALUES.filter((value) => value !== "ALL").forEach((value) => names.add(value));

    return [
      { value: "ALL", label: t("allOperators") },
      ...Array.from(names)
        .sort()
        .map((name) => ({ value: name, label: name })),
    ];
  }, [joined, created, t]);

  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);

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
        if (!cancelled) setError(t("failedToLoadRooms"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isReady, isAuthenticated, authorizedRequest, t]);

  const filteredJoined = useMemo(
    () =>
      joined.filter((room) => {
        if (statusFilter !== "ALL" && room.roomStatus !== statusFilter) return false;
        if (operatorFilter !== "ALL" && room.serviceName !== operatorFilter) return false;
        return true;
      }),
    [joined, statusFilter, operatorFilter],
  );

  const filteredCreated = useMemo(
    () =>
      created.filter((room) => {
        if (statusFilter !== "ALL" && room.status !== statusFilter) return false;
        if (operatorFilter !== "ALL" && room.serviceName !== operatorFilter) return false;
        return true;
      }),
    [created, statusFilter, operatorFilter],
  );

  if (isReady && !isAuthenticated) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <EmptyState title={t("signInToSeeRooms")} description={t("signInToSeeRoomsDesc")} />
        <div className="flex justify-center mt-4">
          <Link to="/login?redirect=/rooms" style={{ textDecoration: "none" }}>
            <Button variant="primary">{t("signIn")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-[22px] sm:text-[26px]" style={{ color: "var(--eco-text)" }}>
          {t("myRooms")}
        </h1>

        <Link to="/rooms/create" className="w-full sm:w-auto" style={{ textDecoration: "none" }}>
          <Button variant="primary" size="sm" className="w-full sm:w-auto">
            <Plus size={14} /> {t("createRoom")}
          </Button>
        </Link>
      </div>

      <Tabs
        tabs={[t("tabJoined"), t("tabCreated")]}
        active={tab === "joined" ? t("tabJoined") : t("tabCreated")}
        onChange={(label) => setTab(label === t("tabJoined") ? "joined" : "created")}
      />

      <div className="mt-4 mb-2">
        <button
          onClick={() => setShowFilters((value) => !value)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] cursor-pointer transition-colors"
          style={{
            color: "var(--eco-text-secondary)",
            background: "var(--eco-surface)",
            border: "1px solid var(--eco-border)",
          }}
        >
          <Filter size={14} />
          {t("filters")}
          {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showFilters && (
        <Card className="mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label={t("status")}
              options={statusOptions}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            />

            <Select
              label={t("operator")}
              options={operatorOptions}
              value={operatorFilter}
              onChange={(event) => setOperatorFilter(event.target.value)}
            />

            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("ALL");
                  setOperatorFilter("ALL");
                }}
              >
                {t("clearFilters")}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Card className="mb-4">
          <span style={{ color: "var(--eco-negative)" }}>{error}</span>
        </Card>
      )}

      <div className="mt-4">
        {loading ? (
          <Card>{t("loadingRooms")}</Card>
        ) : tab === "joined" ? (
          <div className="flex flex-col gap-3">
            {filteredJoined.length === 0 ? (
              <EmptyState title={t("noRoomsFound")} description={t("noRoomsJoinedDesc")} />
            ) : (
              filteredJoined.map((room) => (
                <Link key={room.memberId} to={`/rooms/member/${room.roomId}`} style={{ textDecoration: "none" }}>
                  <Card className="flex flex-col gap-3 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>
                          {room.title}
                        </div>
                        <div className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
                          {room.serviceName}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <MemberStatusBadge status={room.memberStatus} />
                        <RoomStatusBadge status={room.roomStatus} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} /> {formatDate(room.startDate)}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Users size={13} /> {room.maxMembers} {t("seatsLower")}
                      </span>

                      <span style={{ color: "var(--eco-primary)" }}>
                        {formatMoney(room.pricePerMember)}{t("perMonthShort")}
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
              <EmptyState title={t("noRoomsFound")} description={t("noRoomsCreatedDesc")} />
            ) : (
              filteredCreated.map((room) => (
                <Link key={room.id} to={`/rooms/owner/${room.id}`} style={{ textDecoration: "none" }}>
                  <Card className="flex flex-col gap-3 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>
                          {room.title}
                        </div>
                        <div className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
                          {room.serviceName}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <RoomStatusBadge status={room.status} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} /> {formatDate(room.startDate)}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Users size={13} /> {room.maxMembers} {t("seatsLower")}
                      </span>

                      <span style={{ color: "var(--eco-primary)" }}>
                        {formatMoney(room.pricePerMember)}{t("perMemberMonth")}
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