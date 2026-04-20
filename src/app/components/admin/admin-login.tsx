import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Input } from "../ds-primitives";
import { Shield, Lock, Eye, EyeOff } from "lucide-react";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"admin" | "support">("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twofa, setTwofa] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = () => {
    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--eco-bg)" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-[32px] tracking-tight mb-1" style={{ color: "var(--eco-text)", fontWeight: 700 }}>
            <span style={{ color: "var(--eco-primary)" }}>Eco</span>Split Portal
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
        <div
          className="rounded-xl p-6 flex flex-col gap-4"
          style={{ background: "var(--eco-surface-raised)", border: "1px solid var(--eco-border)" }}
        >
          <Input
            label="Email"
            type="email"
            placeholder="admin@ecosplit.kz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label style={{ color: "var(--eco-text)", fontSize: 14 }}>Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-lg outline-none"
                style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)", fontSize: 14 }}
              />
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                onClick={() => setShowPass(!showPass)}
                style={{ background: "transparent", border: "none" }}
              >
                {showPass ? <EyeOff size={15} style={{ color: "var(--eco-text-tertiary)" }} /> : <Eye size={15} style={{ color: "var(--eco-text-tertiary)" }} />}
              </button>
            </div>
          </div>

          <Input
            label="2FA Code"
            placeholder="6-digit code"
            value={twofa}
            onChange={(e) => setTwofa(e.target.value)}
            hint="Enter code from your authenticator app"
          />

          <Button variant="primary" size="lg" className="w-full mt-2" onClick={handleLogin}>
            <Lock size={15} /> Sign In to Portal
          </Button>
        </div>

        {/* Demo credentials - Figma only */}
        <div
          className="mt-6 rounded-xl p-4 flex flex-col gap-2"
          style={{ background: "var(--eco-warning-100)", border: "2px dashed var(--eco-warning)" }}
        >
          <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--eco-warning)" }}>
            <Shield size={14} />
            Demo Credentials
          </div>
          <div className="text-[13px] flex flex-col gap-1" style={{ color: "var(--eco-text)" }}>
            <div>
              <span style={{ color: "var(--eco-text-secondary)" }}>Login: </span>
              <span style={{ fontFamily: "monospace" }}>admin@ecosplit.kz</span>
            </div>
            <div>
              <span style={{ color: "var(--eco-text-secondary)" }}>Password: </span>
              <span style={{ fontFamily: "monospace" }}>Admin1234!</span>
            </div>
          </div>
          <div className="text-[11px] mt-1" style={{ color: "var(--eco-text-tertiary)" }}>
            Visible for Figma only — remove before production.
          </div>
        </div>

        <div className="text-center mt-6 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
          © 2026 EcoSplit · Almaty, Kazakhstan
        </div>
      </div>
    </div>
  );
}
