import { Award } from "lucide-react";
import { useI18n } from "../i18n-provider";
import {
  reputationLevelMeta,
  resolveReputationLevel,
  type ReputationLevel,
} from "../../lib/reputation";

interface ReputationLevelBadgeProps {
  /** Explicit level from the API (e.g. "GOLD"). Optional — derived from score if absent. */
  level?: string | null;
  /** Raw composite score; used to derive the tier when `level` is missing. */
  score?: number | null;
  size?: "sm" | "md";
  /** Hide the text label and render an icon-only chip (useful in dense lists). */
  iconOnly?: boolean;
  className?: string;
}

/**
 * Small tier chip (Newcomer → Platinum) shown next to a user. The label is localized;
 * the accent colour comes from the tier metadata.
 */
export function ReputationLevelBadge({
  level,
  score,
  size = "md",
  iconOnly = false,
  className = "",
}: ReputationLevelBadgeProps) {
  const { t } = useI18n();
  const resolved: ReputationLevel = resolveReputationLevel(level, score);
  const meta = reputationLevelMeta(resolved);
  const label = t(meta.labelKey);

  const iconSize = size === "sm" ? 12 : 14;
  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1";
  const fontSize = size === "sm" ? "11px" : "12px";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${padding} ${className}`}
      style={{ background: `${meta.color}1A`, color: meta.color }}
      title={iconOnly ? label : undefined}
      aria-label={label}
    >
      <Award size={iconSize} style={{ color: meta.color }} />
      {!iconOnly && (
        <span style={{ fontSize, lineHeight: 1, fontWeight: 500 }}>{label}</span>
      )}
    </span>
  );
}
