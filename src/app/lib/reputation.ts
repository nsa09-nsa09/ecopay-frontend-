// Trust-band mapping for the reputation score. The score is a 0..100 integer
// where 100 means 10.0/10. Bands mirror the backend ReputationLevel enum
// (kz.hrms.splitupauth.entity.ReputationLevel).

export type ReputationLevel = 'CRITICAL' | 'LOW' | 'FAIR' | 'GOOD' | 'EXCELLENT';

export interface ReputationBandMeta {
  level: ReputationLevel;
  /** Inclusive lower bound of the 0-100 composite score. */
  minScore: number;
  /** i18n key for the band's display name. */
  labelKey: string;
  /** Accent colour used by badges + progress bar fill. */
  color: string;
}

// Ordered low → high.
export const REPUTATION_BANDS: ReputationBandMeta[] = [
  { level: 'CRITICAL', minScore: 0, labelKey: 'repBandCritical', color: '#ef4444' },
  { level: 'LOW', minScore: 20, labelKey: 'repBandLow', color: '#f97316' },
  { level: 'FAIR', minScore: 40, labelKey: 'repBandFair', color: '#f59e0b' },
  { level: 'GOOD', minScore: 70, labelKey: 'repBandGood', color: '#14b8a6' },
  { level: 'EXCELLENT', minScore: 90, labelKey: 'repBandExcellent', color: '#22c55e' },
];

const BY_LEVEL: Record<ReputationLevel, ReputationBandMeta> = REPUTATION_BANDS.reduce(
  (acc, m) => {
    acc[m.level] = m;
    return acc;
  },
  {} as Record<ReputationLevel, ReputationBandMeta>,
);

function clampScore(score: number | null | undefined): number {
  const s = typeof score === 'number' && Number.isFinite(score) ? score : 0;
  return Math.max(0, Math.min(100, s));
}

export function reputationBandFromScore(score: number | null | undefined): ReputationLevel {
  const s = clampScore(score);
  let result: ReputationLevel = 'CRITICAL';
  for (const meta of REPUTATION_BANDS) {
    if (s >= meta.minScore) result = meta.level;
  }
  return result;
}

/** Resolve a band from an explicit API value, falling back to deriving it from the score. */
export function resolveReputationBand(
  level: string | null | undefined,
  score: number | null | undefined,
): ReputationLevel {
  if (level && level in BY_LEVEL) return level as ReputationLevel;
  return reputationBandFromScore(score);
}

export function reputationBandMeta(level: ReputationLevel): ReputationBandMeta {
  return BY_LEVEL[level];
}

/** 0..100 score → 0.0..10.0 display value with one decimal place. */
export function reputationOutOfTen(score: number | null | undefined): number {
  return Math.round(clampScore(score)) / 10;
}

/** Percentage (0..100) used to fill the reputation progress bar. */
export function reputationFillPercent(score: number | null | undefined): number {
  return clampScore(score);
}
