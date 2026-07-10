// Simplified brand marks for well-known services. Rendered as inline SVG so the
// catalog works offline and stays crisp at any size. Unknown services fall back
// to a colored monogram tile derived from the service name.

type LogoRenderer = (size: number) => React.ReactNode;

function tile(size: number, bg: string, children: React.ReactNode) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="12" fill={bg} />
      {children}
    </svg>
  );
}

const netflix: LogoRenderer = (s) =>
  tile(s, "#141414", (
    <g>
      <rect x="16" y="10" width="5.5" height="28" fill="#B1060F" />
      <rect x="26.5" y="10" width="5.5" height="28" fill="#B1060F" />
      <path d="M16 10h5.5L32 38h-5.5L16 10z" fill="#E50914" />
    </g>
  ));

const spotify: LogoRenderer = (s) =>
  tile(s, "#1DB954", (
    <g stroke="#121212" strokeWidth="3" strokeLinecap="round" fill="none">
      <path d="M14 19c7-2.4 14-1.8 20 1.6" />
      <path d="M15.5 25.5c5.8-1.9 11.4-1.4 16.4 1.4" />
      <path d="M17 31.5c4.6-1.4 9-1 13 1.1" />
    </g>
  ));

const youtube: LogoRenderer = (s) =>
  tile(s, "#FF0000", (
    <path d="M20 16.5v15l13-7.5-13-7.5z" fill="#FFFFFF" />
  ));

const disney: LogoRenderer = (s) =>
  tile(s, "#0E2A6E", (
    <g fill="#FFFFFF">
      <text x="13" y="31" fontSize="19" fontWeight="700" fontFamily="Georgia, serif">D</text>
      <path d="M29 24h8M33 20v8" stroke="#9EE7FF" strokeWidth="2.6" strokeLinecap="round" />
    </g>
  ));

const yandexPlus: LogoRenderer = (s) => (
  <svg width={s} height={s} viewBox="0 0 48 48" aria-hidden="true">
    <defs>
      <linearGradient id="ecoYaPlus" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FF5C4D" />
        <stop offset="0.55" stopColor="#EB469F" />
        <stop offset="1" stopColor="#8341EF" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#ecoYaPlus)" />
    <path d="M24 13v22M13 24h22" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

const microsoft: LogoRenderer = (s) =>
  tile(s, "#FFFFFF", (
    <g>
      <rect width="48" height="48" rx="12" fill="#F3F3F3" />
      <rect x="12" y="12" width="11" height="11" fill="#F25022" />
      <rect x="25" y="12" width="11" height="11" fill="#7FBA00" />
      <rect x="12" y="25" width="11" height="11" fill="#00A4EF" />
      <rect x="25" y="25" width="11" height="11" fill="#FFB900" />
    </g>
  ));

const hboMax: LogoRenderer = (s) =>
  tile(s, "#001C43", (
    <text x="24" y="29" fontSize="13" fontWeight="800" fontFamily="Arial, sans-serif" fill="#FFFFFF" textAnchor="middle">MAX</text>
  ));

const appleMusic: LogoRenderer = (s) => (
  <svg width={s} height={s} viewBox="0 0 48 48" aria-hidden="true">
    <defs>
      <linearGradient id="ecoAppleMusic" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FB5C74" />
        <stop offset="1" stopColor="#FA233B" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#ecoAppleMusic)" />
    <path
      d="M32 12l-12 3v14.5a5 5 0 1 0 2.5 4.3V19.6l7-1.8v9.2a5 5 0 1 0 2.5 4.3V12z"
      fill="#FFFFFF"
    />
  </svg>
);

const primeVideo: LogoRenderer = (s) =>
  tile(s, "#1A2530", (
    <g>
      <text x="24" y="25" fontSize="11" fontWeight="700" fontFamily="Arial, sans-serif" fill="#FFFFFF" textAnchor="middle">prime</text>
      <path d="M14 30c6 4.5 14 4.5 20 0" stroke="#00A8E1" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </g>
  ));

const telegram: LogoRenderer = (s) =>
  tile(s, "#29A9EB", (
    <path d="M12 24l24-9-5 22-7.5-5.5L19 36l.5-7L12 24z" fill="#FFFFFF" />
  ));

const beeline: LogoRenderer = (s) =>
  tile(s, "#FFC800", (
    <g fill="none" stroke="#1A1A1A" strokeWidth="3.4">
      <circle cx="24" cy="24" r="12" />
      <path d="M14 19h20M14 29h20" />
    </g>
  ));

const activ: LogoRenderer = (s) =>
  tile(s, "#FF6A13", (
    <text x="24" y="29" fontSize="13" fontWeight="800" fontFamily="Arial, sans-serif" fill="#FFFFFF" textAnchor="middle">activ</text>
  ));

const tele2: LogoRenderer = (s) =>
  tile(s, "#1F2229", (
    <text x="24" y="30" fontSize="16" fontWeight="800" fontFamily="Arial, sans-serif" fill="#FFFFFF" textAnchor="middle">2</text>
  ));

const kcell: LogoRenderer = (s) =>
  tile(s, "#6F2C91", (
    <text x="24" y="30" fontSize="16" fontWeight="800" fontFamily="Arial, sans-serif" fill="#FFFFFF" textAnchor="middle">K</text>
  ));

const canva: LogoRenderer = (s) => (
  <svg width={s} height={s} viewBox="0 0 48 48" aria-hidden="true">
    <defs>
      <linearGradient id="ecoCanva" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#00C4CC" />
        <stop offset="1" stopColor="#7D2AE8" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#ecoCanva)" />
    <text x="24" y="31" fontSize="18" fontWeight="700" fontFamily="Georgia, serif" fill="#FFFFFF" textAnchor="middle">C</text>
  </svg>
);

const ivi: LogoRenderer = (s) =>
  tile(s, "#EA003D", (
    <text x="24" y="29" fontSize="14" fontWeight="800" fontFamily="Arial, sans-serif" fill="#FFFFFF" textAnchor="middle">ivi</text>
  ));

const megogo: LogoRenderer = (s) =>
  tile(s, "#0F0F1E", (
    <g>
      <circle cx="24" cy="24" r="10" fill="#FF5500" />
      <path d="M21 19.5v9l8-4.5-8-4.5z" fill="#FFFFFF" />
    </g>
  ));

const duolingo: LogoRenderer = (s) =>
  tile(s, "#58CC02", (
    <g fill="#FFFFFF">
      <circle cx="18.5" cy="22" r="4.5" />
      <circle cx="29.5" cy="22" r="4.5" />
      <circle cx="18.5" cy="22" r="1.8" fill="#4B4B4B" />
      <circle cx="29.5" cy="22" r="1.8" fill="#4B4B4B" />
      <path d="M21 31c2 1.6 4 1.6 6 0" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ));

const chatgpt: LogoRenderer = (s) =>
  tile(s, "#0FA47F", (
    <g fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinejoin="round">
      <path d="M24 14l8.7 5v10L24 34l-8.7-5V19L24 14z" />
      <path d="M24 19.5l4.3 2.5v5L24 29.5l-4.3-2.5v-5l4.3-2.5z" />
    </g>
  ));

const yandexMusic: LogoRenderer = (s) =>
  tile(s, "#FFCC00", (
    <path d="M20 14.5v14.8a4.6 4.6 0 1 0 2.6 4.2V21l8.4 2.2v-5.4L20 14.5z" fill="#1A1A1A" />
  ));

// Order matters: more specific keys first (e.g. "яндекс музыка" before "яндекс").
const logoMatchers: Array<{ keys: string[]; render: LogoRenderer }> = [
  { keys: ["netflix", "нетфликс"], render: netflix },
  { keys: ["spotify", "спотифай"], render: spotify },
  { keys: ["youtube", "ютуб"], render: youtube },
  { keys: ["disney", "дисней"], render: disney },
  { keys: ["yandex music", "яндекс музыка"], render: yandexMusic },
  { keys: ["яндекс", "yandex", "плюс мульти", "kinopoisk", "кинопоиск"], render: yandexPlus },
  { keys: ["microsoft", "office", "офис", "365"], render: microsoft },
  { keys: ["hbo", "max"], render: hboMax },
  { keys: ["apple", "эпл"], render: appleMusic },
  { keys: ["amazon", "prime", "прайм"], render: primeVideo },
  { keys: ["telegram", "телеграм"], render: telegram },
  { keys: ["beeline", "билайн"], render: beeline },
  { keys: ["activ", "актив"], render: activ },
  { keys: ["tele2", "теле2"], render: tele2 },
  { keys: ["kcell", "кселл"], render: kcell },
  { keys: ["altel", "алтел"], render: tele2 },
  { keys: ["canva", "канва"], render: canva },
  { keys: ["ivi", "иви"], render: ivi },
  { keys: ["megogo", "мегого"], render: megogo },
  { keys: ["duolingo", "дуолинго"], render: duolingo },
  { keys: ["chatgpt", "gpt", "openai"], render: chatgpt },
];

const monogramPalette = [
  ["#FF8C42", "#FFE6D4"],
  ["#7C5CFF", "#EBE5FF"],
  ["#0FA47F", "#DBF6EE"],
  ["#2B7DE9", "#DFEEFF"],
  ["#E8467C", "#FFE3EE"],
  ["#E5A100", "#FFF3D1"],
];

function Monogram({ name, size }: { name: string; size: number }) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const [fg, bg] = monogramPalette[Math.abs(hash) % monogramPalette.length];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="12" fill={bg} />
      <text x="24" y="31" fontSize="19" fontWeight="700" fontFamily="var(--font-display)" fill={fg} textAnchor="middle">
        {(name.charAt(0) || "?").toUpperCase()}
      </text>
    </svg>
  );
}

export function hasBrandLogo(name: string | undefined | null): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  return logoMatchers.some((m) => m.keys.some((k) => n.includes(k)));
}

export function ServiceLogo({ name, size = 48, className }: { name: string; size?: number; className?: string }) {
  const normalized = (name ?? "").toLowerCase();
  const match = logoMatchers.find((m) => m.keys.some((k) => normalized.includes(k)));
  return (
    <span className={className} style={{ display: "inline-flex", width: size, height: size }}>
      {match ? match.render(size) : <Monogram name={name ?? "?"} size={size} />}
    </span>
  );
}
