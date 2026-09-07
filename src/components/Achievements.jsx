import { evaluateAchievements } from "../utils/achievements";
import { Doodle } from "./doodles";

const ACHIEVEMENT_DOODLE = {
  first_quiz: "spark",
  perfect_score: "star",
  easy_complete: "fire",
  medium_complete: "blocks",
  hard_complete: "hammer",
  streak_3: "fire",
  streak_7: "fire",
  puzzle_first: "puzzle",
  puzzle_complete: "diamond",
  credential_claimed: "certificate",
  track_fundamentals: "book",
  track_architecture: "blueprint",
  track_l1s: "mountain",
  track_c_chain: "contract",
  track_icm: "nodes",
  track_developer: "badge",
  path_complete: "trophy",
};

function Achievements(props) {
  const evaluated = evaluateAchievements(props);
  const earnedCount = evaluated.filter((achievement) => achievement.earned).length;

  return (
    <div className="card">
      <h3 className="achievements-title">Achievements</h3>
      <p className="achievements-summary">
        {earnedCount}/{evaluated.length} forged
      </p>
      <div className="achievements-grid">
        {evaluated.map((achievement) => {
          const doodleType = ACHIEVEMENT_DOODLE[achievement.id] || "badge";
          return (
            <div
              key={achievement.id}
              className={`achievement-item ${achievement.earned ? "earned is-unlocked" : "locked"}`}
              title={achievement.desc}
            >
              <span className="ach-icon" aria-hidden="true">
                <Doodle
                  type={doodleType}
                  size={22}
                  variant={achievement.earned ? "accent" : "muted"}
                  animated={achievement.earned}
                />
              </span>
              <span className="ach-name">{achievement.name}</span>
              <span className="meta-line">{achievement.desc}</span>
              <span className="ach-status">{achievement.earned ? "Unlocked" : "Locked"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Achievements;
