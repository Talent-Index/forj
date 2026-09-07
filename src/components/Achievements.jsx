import { evaluateAchievements } from "../utils/achievements";
import { AnimatedDoodle, Doodle, DoodleText } from "./doodles";

const ACHIEVEMENT_DOODLE = {
  first: "spark",
  perfect_score: "star",
  easy_complete: "fire",
  easy_master: "fire",
  medium_complete: "blocks",
  medium_master: "blocks",
  hard_complete: "hammer",
  hard_master: "hammer",
  avalanche_explorer: "book",
  architecture_builder: "blueprint",
  l1_builder: "mountain",
  cchain_builder: "contract",
  icm_builder: "nodes",
  developer_builder: "badge",
  puzzle_starter: "puzzle",
  full_puzzle: "diamond",
  persistent: "pencil",
  streak_7: "fire",
  streak_30: "fire",
  credential: "certificate",
  track_complete: "check",
  path_complete: "trophy",
  cert_fundamentals: "book",
  cert_architecture: "blueprint",
  cert_developer: "badge",
  track_l1s: "mountain",
  track_cchain: "contract",
  track_icm: "nodes",
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
                {achievement.earned ? (
                  <AnimatedDoodle
                    type={doodleType}
                    animation="achievement"
                    stages={["draw", "reveal", "stamp"]}
                    trigger="viewport"
                    size={22}
                    variant="accent"
                  />
                ) : (
                  <Doodle type={doodleType} size={22} variant="muted" />
                )}
              </span>
              <span className="ach-name">{achievement.name}</span>
              <span className="meta-line">{achievement.desc}</span>
              <span className="ach-status">
                {achievement.earned ? (
                  <>
                    <AnimatedDoodle type="check" animation="draw" trigger="viewport" size={12} variant="accent" />
                    <DoodleText trigger="viewport" mark="underline">Achieved</DoodleText>
                  </>
                ) : (
                  "Locked"
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Achievements;
