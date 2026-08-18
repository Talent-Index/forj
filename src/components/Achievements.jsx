import { evaluateAchievements } from "../utils/achievements";

function Achievements(props) {
  const evaluated = evaluateAchievements(props);
  const earnedCount = evaluated.filter((achievement) => achievement.earned).length;

  return (
    <div className="card">
      <h3 className="achievements-title">Achievements</h3>
      <p className="achievements-summary">
        {earnedCount}/{evaluated.length} unlocked from your saved progress
      </p>
      <div className="achievements-grid">
        {evaluated.map((achievement) => (
          <div
            key={achievement.id}
            className={`achievement-item ${achievement.earned ? "earned" : "locked"}`}
            title={achievement.desc}
          >
            <span className="ach-name">{achievement.name}</span>
            <span className="meta-line">{achievement.desc}</span>
            <span className="ach-status">{achievement.earned ? "Unlocked" : "Locked"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Achievements;
