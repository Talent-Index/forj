import { sections } from "../data/questions";

function SectionSelect({ sectionScores, totalPoints, onSelectSection, onGoToPuzzle, completedSections }) {
  return (
    <div className="card section-select">
      <h2 className="section-select-title">🏔️ Avalanche Learning Paths</h2>
      <p className="section-select-desc">
        Master Avalanche through Easy, Medium, and Hard quizzes — each attempt shows 5 random questions from a larger pool.
        Earn points and redeem them for puzzle pieces on your certificate!
      </p>

      <div className="points-banner">
        <span>💰 Total Points: <strong>{totalPoints}</strong></span>
      </div>

      <div className="sections-grid">
        {sections.map((section) => {
          const score = sectionScores[section.id];
          const done = completedSections.includes(section.id);
          return (
            <button
              key={section.id}
              className={`section-card section-${section.id} ${done ? "completed" : ""}`}
              onClick={() => onSelectSection(section.id)}
            >
              <span className="section-icon">{section.icon}</span>
              <span className="section-name">{section.name}</span>
              <span className="section-meta">5 random · pool {section.questions.length} · {section.pointsPerQuestion} pts each</span>
              <span className="section-desc">{section.description}</span>
              {score !== undefined && (
                <span className="section-score">
                  Last: {score.correct}/{score.total} · +{score.pointsEarned} pts
                </span>
              )}
              {done && <span className="section-badge">✅ Completed</span>}
            </button>
          );
        })}
      </div>

      {totalPoints > 0 && (
        <button className="btn-primary puzzle-cta" onClick={onGoToPuzzle}>
          🧩 Redeem Points for Puzzle Pieces
        </button>
      )}
    </div>
  );
}

export default SectionSelect;
