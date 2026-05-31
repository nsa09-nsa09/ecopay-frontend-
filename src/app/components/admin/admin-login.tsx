import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { Button, Input } from "../ds-primitives";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "../../../lib/auth/AuthContext";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [tab, setTab] = useState<"admin" | "support">("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => login({ email, password }),
    onSuccess: async (user) => {
      if (user.role === "ADMIN" || user.role === "SUPPORT") {
        navigate("/admin/dashboard");
      } else {
        await logout();
        setErrorMsg("This account doesn't have admin/staff access.");
      }
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ??
        (err as { message?: string })?.message ??
        "Login failed. Check your credentials and try again.";
      setErrorMsg(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !password) {
      setErrorMsg("Email and password are required.");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--eco-bg)" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-[32px] tracking-tight mb-1" style={{ color: "var(--eco-text)", fontWeight: 700 }}>
            <span style={{ color: "var(--eco-primary)" }}>Eco</span>Pay Portal
          </div>
          <div className="text-[14px]" style={{ color: "var(--eco-text-tertiary)" }}>
            Administration & Support
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 rounded-lg overflow-hidden" style={{ border: "1px solid var(--eco-border)" }}>
          {(["admin", "support"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-[14px] cursor-pointer transition-colors"
              style={{
                background: tab === t ? "var(--eco-primary)" : "transparent",
                color: tab === t ? "var(--eco-text-on-primary)" : "var(--eco-text-secondary)",
                border: "none",
              }}
            >
              {t === "admin" ? "Admin" : "Support"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-6 flex flex-col gap-4"
          style={{ background: "var(--eco-surface-raised)", border: "1px solid var(--eco-border)" }}
        >
          <Input
            label="Email"
            type="email"
            placeholder="admin@ecopay.kz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <div className="flex flex-col gap-1.5">
            <label style={{ color: "var(--eco-text)", fontSize: 14 }}>Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-3 py-2 pr-10 rounded-lg outline-none"
                style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)", fontSize: 14 }}
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                onClick={() => setShowPass(!showPass)}
                style={{ background: "transparent", border: "none" }}
              >
                {showPass ? <EyeOff size={15} style={{ color: "var(--eco-text-tertiary)" }} /> : <Eye size={15} style={{ color: "var(--eco-text-tertiary)" }} />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div
              className="flex items-start gap-2 px-3 py-2 rounded-lg text-[13px]"
              style={{ background: "var(--eco-danger-100)", color: "var(--eco-danger-500)" }}
            >
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            loading={mutation.isPending}
            disabled={mutation.isPending}
          >
            <Lock size={15} /> Sign In to Portal
          </Button>
        </form>

        <div className="text-center mt-6 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
          © 2026 EcoPay · Almaty, Kazakhstan
        </div>
      </div>
    </div>
  );
}
