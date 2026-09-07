import { AnimatedDoodle, Doodle } from "../doodles";
import { Button, ProgressBar } from "../ui/primitives";
import { TIER_LABELS, TIER_ROMAN } from "../../utils/achievementCatalog";

export function BadgeTier({ tier = 1, max = 5, earned = false }) {
  return (
    <div className="badge-tier-row" aria-label={`Tier ${tier} of ${max}`}>
      {Array.from({ length: max }, (_, index) => {
        const n = index + 1;
        const active = n <= tier && earned;
        return (
          <span
            key={n}
            className={`badge-tier-pip${active ? " is-active" : ""}${n === tier ? " is-current" : ""}`}
          >
            {TIER_ROMAN[n]}
          </span>
        );
      })}
    </div>
  );
}

export function BadgeDetail({ achievement, onClose, onContinue }) {
  if (!achievement) return null;
  const earned = Boolean(achievement.earned);
  const progress = achievement.progress || { current: 0, target: 1 };
  const percent = progress.target
    ? Math.min(100, Math.round((progress.current / progress.target) * 100))
    : earned ? 100 : 0;

  return (
    <article className={`card badge-detail ${earned ? "is-earned" : "is-locked"}`}>
      <p className="kicker">{achievement.familyLabel || "Achievement"}</p>
      <div className="badge-detail-hero">
        {earned ? (
          <AnimatedDoodle
            type={achievement.doodle || "badge"}
            animation="achievement"
            stages={["draw", "reveal", "stamp"]}
            trigger="immediate"
            size={48}
            variant="accent"
          />
        ) : (
          <Doodle type={achievement.doodle || "badge"} size={48} variant="muted" />
        )}
      </div>
      <h2>{achievement.displayName || achievement.name}</h2>
      {achievement.skillLabel ? <p className="lede">{achievement.skillLabel}</p> : null}
      {achievement.tier ? (
        <>
          <p className="kicker">
            Level {TIER_ROMAN[achievement.tier]} — {TIER_LABELS[achievement.tier]}
          </p>
          <BadgeTier tier={achievement.tier} earned={earned} />
        </>
      ) : null}
      <section className="section-block">
        <h3>Description</h3>
        <p>{achievement.description}</p>
      </section>
      <section className="section-block">
        <h3>Requirements</h3>
        <ul className="badge-req-list">
          {(achievement.requirementsCopy || []).map((line) => (
            <li key={line}>
              <span className={earned ? "result-mark-ok" : "meta-line"}>{earned ? "✓" : "·"}</span>
              {line}
            </li>
          ))}
        </ul>
        {!earned && progress.target > 1 ? (
          <ProgressBar
            label={`${progress.current} / ${progress.target}`}
            value={percent}
          />
        ) : null}
      </section>
      {earned && achievement.unlockedAt ? (
        <p className="meta-line">
          Earned {new Date(achievement.unlockedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
        </p>
      ) : (
        <p className="meta-line">{earned ? "Earned" : "Keep learning to unlock"}</p>
      )}
      <div className="quiz-nav quiz-nav-end">
        {onClose ? <Button variant="secondary" onClick={onClose}>Close</Button> : null}
        {onContinue ? <Button onClick={onContinue}>Continue learning</Button> : null}
      </div>
    </article>
  );
}

export default BadgeDetail;
