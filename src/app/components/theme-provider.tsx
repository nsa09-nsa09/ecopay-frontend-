import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type ThemeName = "eco-coral" | "eco-blue";

const themes = {
  "eco-coral": {
    // Primitives — EcoPay orange
    "brand-50": "#FFF4EC",
    "brand-100": "#FFE6D4",
    "brand-200": "#FFCDA8",
    "brand-300": "#FFAE75",
    "brand-400": "#FF9A55",
    "brand-500": "#FF8C42",
    "brand-600": "#F0741F",
    "brand-700": "#C55A12",
    "brand-800": "#96430E",
    "brand-900": "#5E2A09",
    "neutral-0": "#FFFFFF",
    "neutral-50": "#F8F8FA",
    "neutral-100": "#F1F1F5",
    "neutral-200": "#E4E4EB",
    "neutral-300": "#CCCCD6",
    "neutral-400": "#9D9DAF",
    "neutral-500": "#6E6E85",
    "neutral-600": "#50506A",
    "neutral-700": "#3A3A52",
    "neutral-800": "#25253B",
    "neutral-900": "#131326",
    "success-500": "#22A06B",
    "success-100": "#DCFFF1",
    "warning-500": "#E5A100",
    "warning-100": "#FFF7E0",
    "danger-500": "#DE350B",
    "danger-100": "#FFEBE5",
    // Semantic
    bg: "#FFFFFF",
    surface: "#F8F8FA",
    "surface-raised": "#FFFFFF",
    text: "#1A1A1A",
    "text-secondary": "#6E6E85",
    "text-tertiary": "#9D9DAF",
    "text-on-primary": "#FFFFFF",
    border: "#E4E4EB",
    "border-strong": "#CCCCD6",
    primary: "#FF8C42",
    "primary-hover": "#F0741F",
    accent: "#FFAE75",
    negative: "#DE350B",
    positive: "#22A06B",
    warning: "#E5A100",
  },
  "eco-blue": {
    "brand-50": "#F0F7FF",
    "brand-100": "#DFEEFF",
    "brand-200": "#B8D9FF",
    "brand-300": "#85BFFF",
    "brand-400": "#4DA3FF",
    "brand-500": "#2B7DE9",
    "brand-600": "#1A65CC",
    "brand-700": "#124DA3",
    "brand-800": "#0D3A7A",
    "brand-900": "#08254D",
    "neutral-0": "#FFFFFF",
    "neutral-50": "#F7F8FA",
    "neutral-100": "#EFF1F5",
    "neutral-200": "#E1E4EB",
    "neutral-300": "#C8CCD6",
    "neutral-400": "#969DAF",
    "neutral-500": "#687085",
    "neutral-600": "#4A526A",
    "neutral-700": "#353B52",
    "neutral-800": "#22283B",
    "neutral-900": "#111626",
    "success-500": "#22A06B",
    "success-100": "#DCFFF1",
    "warning-500": "#E5A100",
    "warning-100": "#FFF7E0",
    "danger-500": "#DE350B",
    "danger-100": "#FFEBE5",
    bg: "#FFFFFF",
    surface: "#F7F8FA",
    "surface-raised": "#FFFFFF",
    text: "#111626",
    "text-secondary": "#687085",
    "text-tertiary": "#969DAF",
    "text-on-primary": "#FFFFFF",
    border: "#E1E4EB",
    "border-strong": "#C8CCD6",
    primary: "#2B7DE9",
    "primary-hover": "#1A65CC",
    accent: "#4DA3FF",
    negative: "#DE350B",
    positive: "#22A06B",
    warning: "#E5A100",
  },
} as const;

type ThemeTokens = (typeof themes)[ThemeName];

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  tokens: ThemeTokens;
  t: (key: string) => string;
}

const ThemeContext = createContext<ThemeContextType>(null!);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>("eco-coral");
  const tokens = themes[theme];
  const t = useCallback((key: string) => (tokens as any)[key] ?? key, [tokens]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, tokens, t }}>
      <div
        style={{
          "--eco-bg": tokens.bg,
          "--eco-surface": tokens.surface,
          "--eco-surface-raised": tokens["surface-raised"],
          "--eco-text": tokens.text,
          "--eco-text-secondary": tokens["text-secondary"],
          "--eco-text-tertiary": tokens["text-tertiary"],
          "--eco-text-on-primary": tokens["text-on-primary"],
          "--eco-border": tokens.border,
          "--eco-border-strong": tokens["border-strong"],
          "--eco-primary": tokens.primary,
          "--eco-primary-hover": tokens["primary-hover"],
          "--eco-accent": tokens.accent,
          "--eco-negative": tokens.negative,
          "--eco-positive": tokens.positive,
          "--eco-warning": tokens.warning,
          "--eco-brand-50": tokens["brand-50"],
          "--eco-brand-100": tokens["brand-100"],
          "--eco-brand-500": tokens["brand-500"],
          "--eco-brand-600": tokens["brand-600"],
          "--eco-brand-700": tokens["brand-700"],
          "--eco-neutral-50": tokens["neutral-50"],
          "--eco-neutral-100": tokens["neutral-100"],
          "--eco-neutral-200": tokens["neutral-200"],
          "--eco-neutral-300": tokens["neutral-300"],
          "--eco-neutral-900": tokens["neutral-900"],
          "--eco-success-100": tokens["success-100"],
          "--eco-success-500": tokens["success-500"],
          "--eco-warning-100": tokens["warning-100"],
          "--eco-warning-500": tokens["warning-500"],
          "--eco-danger-100": tokens["danger-100"],
          "--eco-danger-500": tokens["danger-500"],
        } as React.CSSProperties}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { themes };
