import { useState } from "react";
import { Card, Badge, Button, Tabs, EmptyState } from "../ds-primitives";
import { Star, Shield, Users, Calendar, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../lib/auth/AuthContext";
import { roomsApi } from "../../../lib/api/rooms";

export function ProfilePage() {
  const [tab, setTab] = useState("Overview");
  const { user } = useAuth();
  const myRoomsQuery = useQuery({
    queryKey: ["rooms", "my"],
    queryFn: () => roomsApi.myMemberships(),
    enabled: Boolean(user),
  });

  const memberships = myRoomsQuery.data ?? [];
  const roomsCreated = memberships.filter((m) => m.myRole === "OWNER").length;
  const roomsJoined = memberships.filter((m) => m.myRole === "MEMBER").length;

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "—";
  const initials = (fullName.match(/[A-ZА-Я]/gi) ?? ["U"]).slice(0, 2).join("").toUpperCase();

  const profile = {
    name: fullName,
    email: user?.email ?? "",
    joined: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—",
    rating: user?.ratingScore ?? 0,
    reputation: Math.round((user?.ratingScore ?? 0) * 20),
    roomsCreated,
    roomsJoined,
    reviewsCount: 0,
  };

  // TODO: подключить, когда появится ReputationController (см. gap-list)
  const reviews: { id: string; from: string; rating: number; text: string; room: string; date: string; eligible: boolean }[] = [];

  const pendingReview = { room: "—", endDate: "—", eligible: false };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <h1 className="text-[24px] mb-6" style={{ color: "var(--eco-text)" }}>Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-[20px]" style={{ background: "var(--eco-surface)", color: "var(--eco-text-secondary)" }}>
              {initials}
            </div>
            <div>
              <div className="text-[16px]" style={{ color: "var(--eco-text)" }}>{profile.name}</div>
              <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>Member since {profile.joined}</div>
            </div>
            <div className="flex items-center gap-1" style={{ color: "var(--eco-warning)" }}>
              <Star size={16} fill="currentColor" />
              <span className="text-[16px]">{profile.rating}</span>
              <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>({profile.reviewsCount} reviews)</span>
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-[13px]">
              <span style={{ color: "var(--eco-text-secondary)" }}>Reputation Score</span>
              <span style={{ color: "var(--eco-positive)" }}>{profile.reputation}/100</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: "var(--eco-neutral-200)" }}>
              <div className="h-2 rounded-full" style={{ width: `${profile.reputation}%`, background: "var(--eco-positive)" }} />
            </div>
            <div className="flex justify-between text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              <span className="flex items-center gap-1"><Users size={12} /> {profile.roomsCreated} created</span>
              <span className="flex items-center gap-1"><Users size={12} /> {profile.roomsJoined} joined</span>
            </div>
          </Card>

          <div className="flex items-center gap-1.5 px-4 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
            <Shield size={13} /> No phone number stored. Privacy-first approach.
          </div>
        </div>

        {/* Main */}
        <div className="lg:col-span-2">
          <Tabs tabs={["Overview", "Reviews"]} active={tab} onChange={setTab} />

          {tab === "Overview" && (
            <div className="mt-6 flex flex-col gap-4">
              <Card className="flex flex-col gap-3">
                <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>Account Details</h3>
                {[
                  { label: "Display Name", value: profile.name },
                  { label: "Email", value: profile.email },
                  { label: "Joined", value: profile.joined },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-[13px]">
                    <span style={{ color: "var(--eco-text-secondary)" }}>{row.label}</span>
                    <span style={{ color: "var(--eco-text)" }}>{row.value}</span>
                  </div>
                ))}
              </Card>

              <Card className="flex flex-col gap-3">
                <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>Activity Summary</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Rooms Created", value: profile.roomsCreated },
                    { label: "Rooms Joined", value: profile.roomsJoined },
                    { label: "Reviews", value: profile.reviewsCount },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-3 rounded-lg" style={{ background: "var(--eco-surface)" }}>
                      <div className="text-[20px]" style={{ color: "var(--eco-text)" }}>{stat.value}</div>
                      <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {tab === "Reviews" && reviews.length === 0 && (
            <div className="mt-6">
              <EmptyState
                title="Reviews module coming soon"
                description="Reputation API on the backend is not yet implemented (see gap-list)."
              />
            </div>
          )}

          {tab === "Reviews" && reviews.length > 0 && (
            <div className="mt-6 flex flex-col gap-4">
              {/* Pending review - disabled */}
              <Card className="opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>{pendingReview.room}</div>
                    <div className="text-[12px] flex items-center gap-1" style={{ color: "var(--eco-text-tertiary)" }}>
                      <Lock size={12} /> Review available after {pendingReview.endDate}
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" disabled>Leave Review</Button>
                </div>
              </Card>

              {/* Existing reviews */}
              {reviews.map((r) => (
                <Card key={r.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>{r.from}</span>
                      <div className="flex items-center gap-0.5" style={{ color: "var(--eco-warning)" }}>
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} size={12} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    <span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{r.date}</span>
                  </div>
                  <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{r.text}</div>
                  <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>Room: {r.room}</div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
