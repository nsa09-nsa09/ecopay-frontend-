// Payment system marks for the footer, drawn inline so they render offline
// and match the footer scale (~44px height pills).

function LogoPill({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className="inline-flex items-center justify-center rounded-lg px-3"
      style={{ background: "var(--eco-surface-raised)", border: "1px solid var(--eco-border)", height: 44, minWidth: 68 }}
    >
      {children}
    </span>
  );
}

export function VisaLogo() {
  return (
    <LogoPill label="Visa">
      <svg width="44" height="16" viewBox="0 0 44 16" aria-hidden="true">
        <text x="22" y="13" textAnchor="middle" fontSize="14" fontWeight="800" fontStyle="italic" fontFamily="Arial, sans-serif" fill="#1A1F71">
          VISA
        </text>
      </svg>
    </LogoPill>
  );
}

export function MastercardLogo() {
  return (
    <LogoPill label="Mastercard">
      <svg width="40" height="26" viewBox="0 0 40 26" aria-hidden="true">
        <circle cx="15" cy="13" r="10" fill="#EB001B" />
        <circle cx="25" cy="13" r="10" fill="#F79E1B" fillOpacity="0.9" />
        <path d="M20 5.2a10 10 0 0 1 0 15.6 10 10 0 0 1 0-15.6z" fill="#FF5F00" />
      </svg>
    </LogoPill>
  );
}

export function FreedomPayLogo() {
  return (
    <LogoPill label="Freedom Pay">
      <svg width="76" height="16" viewBox="0 0 76 16" aria-hidden="true">
        <text x="0" y="12.5" fontSize="11" fontWeight="700" fontFamily="Arial, sans-serif" fill="#00B156">
          Freedom
        </text>
        <text x="50" y="12.5" fontSize="11" fontWeight="700" fontFamily="Arial, sans-serif" fill="#1A1A1A">
          Pay
        </text>
      </svg>
    </LogoPill>
  );
}

export function PaymentLogosRow({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center flex-wrap gap-2 ${className}`}>
      <VisaLogo />
      <MastercardLogo />
      <FreedomPayLogo />
    </div>
  );
}
