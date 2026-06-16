// Activity-based reputation tiers. Mirrors the backend ReputationLevel enum and its
// score thresholds (kz.hrms.splitupauth.entity.ReputationLevel) so the UI can derive a
// tier from a raw score when the API doesn't send `reputationLevel` explicitly.

export type ReputationLevel = "NEWCOMER" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export interface ReputationLevelMeta {
  level: ReputationLevel;
  /** Inclusive lower bound of the 0-100 composite score. */
  minScore: number;
  /** i18n key for the tier's display name. */
  labelKey: string;
  /** Badge accent colour. */
  color: string;
}

// Ordered low → high. Keep thresholds in sync with the backend enum.
export const REPUTATION_LEVELS: ReputationLevelMeta[] = [
  { level: "NEWCOMER", minScore: 0, labelKey: "repLevelNewcomer", color: "#94a3b8" },
  { level: "BRONZE", minScore: 20, labelKey: "repLevelBronze", color: "#b45309" },
  { level: "SILVER", minScore: 40, labelKey: "repLevelSilver", color: "#64748b" },
  { level: "GOLD", minScore: 60, labelKey: "repLevelGold", color: "#d97706" },
  { level: "PLATINUM", minScore: 80, labelKey: "repLevelPlatinum", color: "#0ea5e9" },
];

const BY_LEVEL: Record<ReputationLevel, ReputationLevelMeta> = REPUTATION_LEVELS.reduce(
  (acc, m) => {
    acc[m.level] = m;
    return acc;
  },
  {} as Record<ReputationLevel, ReputationLevelMeta>,
);

export function reputationLevelFromScore(score: number | null | undefined): ReputationLevel {
  const s = typeof score === "number" && Number.isFinite(score) ? score : 0;
  let result: ReputationLevel = "NEWCOMER";
  for (const meta of REPUTATION_LEVELS) {
    if (s >= meta.minScore) result = meta.level;
  }
  return result;
}

/** Resolve a level from an explicit API value, falling back to deriving it from the score. */
export function resolveReputationLevel(
  level: string | null | undefined,
  score: number | null | undefined,
): ReputationLevel {
  if (level && level in BY_LEVEL) return level as ReputationLevel;
  return reputationLevelFromScore(score);
}

export function reputationLevelMeta(level: ReputationLevel): ReputationLevelMeta {
  return BY_LEVEL[level];
}

/**
 * Progress toward the next tier. Returns null when already at the top tier.
 * `progress` is 0..1 within the current tier's band.
 */
export function reputationProgress(score: number | null | undefined): {
  next: ReputationLevelMeta;
  pointsToNext: number;
  progress: number;
} | null {
  const s = typeof score === "number" && Number.isFinite(score) ? score : 0;
  const current = reputationLevelFromScore(s);
  const idx = REPUTATION_LEVELS.findIndex((m) => m.level === current);
  const next = REPUTATION_LEVELS[idx + 1];
  if (!next) return null;
  const floor = REPUTATION_LEVELS[idx].minScore;
  const span = next.minScore - floor;
  return {
    next,
    pointsToNext: Math.max(0, next.minScore - s),
    progress: span > 0 ? Math.min(1, Math.max(0, (s - floor) / span)) : 1,
  };
}
