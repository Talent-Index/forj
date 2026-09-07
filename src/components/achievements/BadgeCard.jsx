import { Doodle } from "../doodles";
import { TIER_ROMAN } from "../../utils/achievementCatalog";

/**
 * Collectible Forjora badge tile — reuses card / border / doodle language.
 * Grid uses static doodles so Progress stays fast; detail views can animate.
 */
export function BadgeCard({
  achievement,
  selected = false,
  onSelect,
  compact = false,
}) {
  const earned = Boolean(achievement?.earned);
  const doodle = achievement?.doodle || "badge";
  const title = achievement?.displayName || achievement?.name || "Badge";
  const tierRoman = achievement?.tierRoman || (achievement?.tier ? TIER_ROMAN[achievement.tier] : null);

  return (
    <button
      type="button"
      className={`badge-card achievement-item ${earned ? "earned is-unlocked" : "locked"}${selected ? " is-selected" : ""}${compact ? " is-compact" : ""}`}
      onClick={() => onSelect?.(achievement)}
      title={achievement?.description || title}
    >
      <span className="badge-card-icon ach-icon" aria-hidden="true">
        <Doodle
          type={doodle}
          size={compact ? 20 : 28}
          variant={earned ? "accent" : "muted"}
        />
      </span>
      <span className="badge-card-name ach-name">{title}</span>
      {achievement?.skillLabel ? (
        <span className="meta-line badge-card-skill">{achievement.skillLabel}</span>
      ) : null}
      {tierRoman ? (
        <span className="badge-card-tier kicker">
          Level {tierRoman}
          {achievement.tierLabel ? ` · ${achievement.tierLabel}` : ""}
        </span>
      ) : achievement?.familyLabel ? (
        <span className="badge-card-tier kicker">{achievement.familyLabel}</span>
      ) : null}
      <span className="ach-status">{earned ? "Earned" : "Locked"}</span>
    </button>
  );
}

export default BadgeCard;
