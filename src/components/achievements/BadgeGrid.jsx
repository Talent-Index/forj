import { BadgeCard } from "./BadgeCard";
import { groupAchievementsByFamily } from "../../utils/achievementCatalog";

export function BadgeGrid({
  achievements = [],
  selectedId = null,
  onSelect,
  showLocked = true,
  familyFilter = null,
}) {
  const visible = achievements.filter((item) => {
    if (item.hidden && !item.earned) return false;
    if (!showLocked && !item.earned) return false;
    if (familyFilter && item.family !== familyFilter) return false;
    return true;
  });
  const groups = groupAchievementsByFamily(visible);

  if (!visible.length) {
    return null;
  }

  return (
    <div className="badge-grid-wrap">
      {groups.map((group) => (
        <section key={group.id} className="badge-family-block">
          <div className="learn-hub-head">
            <h3 className="achievements-title">{group.label}</h3>
            <p className="meta-line">{group.blurb}</p>
          </div>
          <div className="achievements-grid badge-grid">
            {group.items.map((item) => (
              <BadgeCard
                key={item.id}
                achievement={item}
                selected={selectedId === item.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default BadgeGrid;
