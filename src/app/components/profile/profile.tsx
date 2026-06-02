import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Card, Badge, Button, Input } from "../ds-primitives";
import { Shield, UserRound, Mail, Star } from "lucide-react";
import { useAuth } from "../auth/auth-provider";
import { ApiError } from "../../lib/api";

export function ProfilePage() {
  const { user, isAuthenticated, isReady, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(user?.displayName ?? "");
    setAvatar(user?.avatar ?? "");
  }, [user]);

  if (!isReady) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <Card>Loading profile...</Card>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <Card className="flex flex-col gap-4 items-start">
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>Profile</h1>
          <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            Sign in to manage your EcoPay account.
          </p>
          <Link to="/login" style={{ textDecoration: "none" }}>
            <Button>Sign in</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const initials = user.displayName
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setFieldErrors({});
    setSaving(true);

    try {
      await updateProfile({
        displayName,
        avatar: avatar.trim() || null,
      });
      setMessage("Profile updated.");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.errors);
      } else {
        setError("Unable to update the profile right now.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <h1 className="text-[24px] mb-6" style={{ color: "var(--eco-text)" }}>Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-[20px]" style={{ background: "var(--eco-surface)", color: "var(--eco-text-secondary)" }}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <div className="text-[16px]" style={{ color: "var(--eco-text)" }}>{user.displayName}</div>
              <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{user.email}</div>
            </div>
            <div className="flex items-center gap-1" style={{ color: "var(--eco-warning)" }}>
              <Star size={16} fill="currentColor" />
              <span className="text-[16px]">{user.reputation ?? 0}</span>
              <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>reputation</span>
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-[13px]">
              <span style={{ color: "var(--eco-text-secondary)" }}>Role</span>
              <Badge>{user.role}</Badge>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span style={{ color: "var(--eco-text-secondary)" }}>Status</span>
              <Badge variant={user.status === "ACTIVE" ? "success" : "default"}>{user.status}</Badge>
            </div>
            <div className="flex items-center gap-1.5 px-1 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              <Shield size={13} /> Password resets are sent through the local MailDev inbox in Docker.
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <h3 className="text-[16px]" style={{ color: "var(--eco-text)" }}>Account Details</h3>
              <Input
                label="Display name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                error={fieldErrors.displayName}
              />
              <Input
                label="Avatar URL"
                value={avatar}
                onChange={(event) => setAvatar(event.target.value)}
                error={fieldErrors.avatar}
                hint="Optional public image URL"
              />
              {error && (
                <p className="text-[12px]" style={{ color: "var(--eco-negative)" }}>
                  {error}
                </p>
              )}
              {message && (
                <p className="text-[12px]" style={{ color: "var(--eco-positive)" }}>
                  {message}
                </p>
              )}
              <Button type="submit" loading={saving}>Save changes</Button>
            </form>
          </Card>

          <Card className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg p-4" style={{ background: "var(--eco-surface)" }}>
              <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                <UserRound size={14} /> Display name
              </div>
              <div className="mt-2 text-[15px]" style={{ color: "var(--eco-text)" }}>{user.displayName}</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: "var(--eco-surface)" }}>
              <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                <Mail size={14} /> Email
              </div>
              <div className="mt-2 text-[15px]" style={{ color: "var(--eco-text)" }}>{user.email}</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: "var(--eco-surface)" }}>
              <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                <Star size={14} /> Reputation
              </div>
              <div className="mt-2 text-[15px]" style={{ color: "var(--eco-text)" }}>{user.reputation ?? 0}</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
