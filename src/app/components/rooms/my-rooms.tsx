import { useState } from "react";
import { Link } from "react-router";
import { Card, Button, Tabs, RoomStatusBadge, MemberStatusBadge, Badge, EmptyState, Select } from "../ds-primitives";
import { Plus, Users, Clock, ArrowRight, Calendar, Filter, ChevronDown, ChevronUp } from "lucide-react";

// ─── Mock Data ───
const joinedRooms = [
  { id: "r1", name: "Beeline Family 4", operator: "Beeline", status: "PENDING", myStatus: "PENDING", startDate: "2026-04-15", seats: 4, filled: 3, perMember: 5000 },
  { id: "r2", name: "Activ Family 5", operator: "Activ", status: "ACTIVE", myStatus: "ACTIVE", startDate: "2026-03-01", seats: 5, filled: 5, perMember: 3200 },
  { id: "r4", name: "Tele2 Duo", operator: "Tele2", status: "COMPLETED", myStatus: "ACTIVE", startDate: "2025-12-01", seats: 2, filled: 2, perMember: 4500 },
  { id: "r5", name: "Kcell Group 3", operator: "Kcell", status: "BLOCKED", myStatus: "BLOCKED", startDate: "2026-02-01", seats: 3, filled: 2, perMember: 3800 },
];

const createdRooms = [
  { id: "r3", name: "Beeline Family 4", operator: "Beeline", status: "OPEN", startDate: "2026-04-15", seats: 4, filled: 3, applicants: 1, perMember: 5000 },
  { id: "r6", name: "Altel Family 6", operator: "Altel", status: "IN_VERIFICATION", startDate: "2026-04-20", seats: 6, filled: 1, applicants: 3, perMember: 2800 },
  { id: "r7", name: "Activ Duo", operator: "Activ", status: "ACTIVE", startDate: "2026-03-10", seats: 2, filled: 2, applicants: 0, perMember: 6000 },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "IN_VERIFICATION", label: "In Verification" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "BLOCKED", label: "Blocked" },
];

const OPERATOR_OPTIONS = [
  { value: "ALL", label: "All operators" },
  { value: "Beeline", label: "Beeline" },
  { value: "Activ", label: "Activ" },
  { value: "Altel", label: "Altel" },
  { value: "Tele2", label: "Tele2" },
  { value: "Kcell", label: "Kcell" },
];

export function MyRoomsPage() {
  const [tab, setTab] = useState("Joined");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [operatorFilter, setOperatorFilter] = useState("ALL");

  const filteredJoined = joinedRooms.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (operatorFilter !== "ALL" && r.operator !== operatorFilter) return false;
    return true;
  });

  const filteredCreated = createdRooms.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (operatorFilter !== "ALL" && r.operator !== operatorFilter) return false;
    return true;
  });

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-[26px]" style={{ color: "var(--eco-text)" }}>My Rooms</h1>
        <Link to="/rooms/create" style={{ textDecoration: "none" }}>
          <Button variant="primary" size="sm"><Plus size={14} /> Create Room</Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs tabs={["Joined", "Created"]} active={tab} onChange={setTab} />

      {/* Filter toggle */}
      <div className="mt-4 mb-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] cursor-pointer transition-colors"
          style={{ color: "var(--eco-text-secondary)", background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}
        >
          <Filter size={14} />
          Filters
          {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Status" options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
            <Select label="Operator" options={OPERATOR_OPTIONS} value={operatorFilter} onChange={(e) => setOperatorFilter(e.target.value)} />
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setStatusFilter("ALL"); setOperatorFilter("ALL"); }}
              >
                Clear filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Content */}
      <div className="mt-4">
        {tab === "Joined" && (
          <div className="flex flex-col gap-3">
            {filteredJoined.length === 0 ? (
              <EmptyState title="No Rooms Found" description="No rooms match your filters. Try adjusting or browse the catalog to join a room." />
            ) : (
              filteredJoined.map((r) => (
                <Link key={r.id} to={`/rooms/member/${r.id}`} style={{ textDecoration: "none" }}>
                  <Card className="flex flex-col gap-3 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>{r.name}</div>
                          <div className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{r.operator}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MemberStatusBadge status={r.myStatus} />
                        <RoomStatusBadge status={r.status} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} /> {r.startDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users size={13} /> {r.filled}/{r.seats} seats
                      </span>
                      <span style={{ color: "var(--eco-primary)" }}>
                        ₸{r.perMember.toLocaleString()}/mo
                      </span>
                    </div>

                    {/* Seat fill bar */}
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 rounded-full flex-1" style={{ background: "var(--eco-neutral-200)" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${(r.filled / r.seats) * 100}%`, background: "var(--eco-primary)" }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <span className="text-[13px] flex items-center gap-1" style={{ color: "var(--eco-primary)" }}>
                        View details <ArrowRight size={14} />
                      </span>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}

        {tab === "Created" && (
          <div className="flex flex-col gap-3">
            {filteredCreated.length === 0 ? (
              <EmptyState title="No Rooms Found" description="No rooms match your filters. Create a room to start sharing a plan." />
            ) : (
              filteredCreated.map((r) => (
                <Link key={r.id} to={`/rooms/owner/${r.id}`} style={{ textDecoration: "none" }}>
                  <Card className="flex flex-col gap-3 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>{r.name}</div>
                        <div className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{r.operator}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <RoomStatusBadge status={r.status} />
                        {r.applicants > 0 && (
                          <Badge variant="warning">{r.applicants} pending</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} /> {r.startDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users size={13} /> {r.filled}/{r.seats} seats
                      </span>
                      <span style={{ color: "var(--eco-primary)" }}>
                        ₸{r.perMember.toLocaleString()}/mo per member
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-1.5 rounded-full flex-1" style={{ background: "var(--eco-neutral-200)" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${(r.filled / r.seats) * 100}%`, background: "var(--eco-primary)" }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <span className="text-[13px] flex items-center gap-1" style={{ color: "var(--eco-primary)" }}>
                        Manage <ArrowRight size={14} />
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
