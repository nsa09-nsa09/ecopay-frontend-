import { Link } from "react-router";
import { appBrand } from "../config/brand";
import logoUrl from "../assets/ecopay-logo-transparent-256.png";

type BrandLogoProps = {
  to?: string;
  size?: "sm" | "md" | "lg";
  sublabel?: string;
  className?: string;
  textColor?: string;
};

const sizes = {
  sm: { mark: 34, text: "text-[18px]", gap: "gap-2" },
  md: { mark: 46, text: "text-[24px]", gap: "gap-2.5" },
  lg: { mark: 82, text: "text-[32px]", gap: "gap-3" },
};

function BrandMark({ size }: { size: number }) {
  return (
    <img
      src={logoUrl}
      alt=""
      aria-hidden="true"
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}

function BrandLogoContent({
  size = "md",
  sublabel,
  textColor,
}: Omit<BrandLogoProps, "to" | "className">) {
  const config = sizes[size];
  const suffix = appBrand.name.startsWith("Eco") ? appBrand.name.slice(3) : appBrand.name;

  return (
    <span className={`inline-flex items-center ${config.gap}`}>
      <BrandMark size={config.mark} />
      <span className="flex flex-col leading-none">
        <span
          className={`${config.text} tracking-tight`}
          style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
        >
          {appBrand.name.startsWith("Eco") ? (
            <>
              <span style={{ color: "#FF8C42" }}>Eco</span>
              <span style={{ color: textColor ?? "var(--eco-text)" }}>{suffix}</span>
            </>
          ) : (
            <span style={{ color: textColor ?? "var(--eco-text)" }}>{appBrand.name}</span>
          )}
        </span>
        {sublabel && (
          <span className="text-[11px] mt-1" style={{ color: "var(--eco-text-tertiary)", fontWeight: 400 }}>
            {sublabel}
          </span>
        )}
      </span>
    </span>
  );
}

export function BrandLogo({ to, className = "", ...props }: BrandLogoProps) {
  if (to) {
    return (
      <Link to={to} className={className} style={{ color: "var(--eco-text)", textDecoration: "none" }} aria-label={appBrand.name}>
        <BrandLogoContent {...props} />
      </Link>
    );
  }

  return (
    <span className={className} aria-label={appBrand.name}>
      <BrandLogoContent {...props} />
    </span>
  );
}

export { logoUrl as ecopayLogoUrl };
