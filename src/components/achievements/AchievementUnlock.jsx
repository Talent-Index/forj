import { AnimatedDoodle, DoodleText } from "../doodles";
import { Button } from "../ui/primitives";
import { enrichAchievement } from "../../utils/achievementCatalog";

/**
 * Restrained unlock reveal — uses existing doodle / feedback language.
 */
export function AchievementUnlock({
  achievement,
  xp = 0,
  fragments = 0,
  onView,
  onDismiss,
}) {
  if (!achievement) return null;
  const item = enrichAchievement(achievement);

  return (
    <div className="card achievement-unlock" role="status">
      <p className="kicker">
        <DoodleText trigger="immediate" mark="underline">Achievement unlocked</DoodleText>
      </p>
      <div className="achievement-unlock-hero" aria-hidden="true">
        <AnimatedDoodle
          type={item.doodle || "badge"}
          animation="achievement"
          stages={["draw", "reveal", "stamp"]}
          trigger="immediate"
          size={40}
          variant="accent"
        />
      </div>
      <h2>{item.displayName || item.name}</h2>
      {item.skillLabel ? <p className="meta-line">{item.skillLabel}</p> : null}
      <p className="meta-line">
        {xp > 0 ? `+${xp} XP` : null}
        {xp > 0 && fragments > 0 ? " · " : null}
        {fragments > 0 ? `+${fragments} puzzle fragments` : null}
      </p>
      <div className="quiz-nav quiz-nav-end">
        {onDismiss ? <Button variant="secondary" onClick={onDismiss}>Dismiss</Button> : null}
        {onView ? <Button onClick={onView}>View achievement</Button> : null}
      </div>
    </div>
  );
}

export default AchievementUnlock;
