import { sections } from "../data/questions";
import { QUESTIONS_PER_QUIZ, getQuestionBankStatus } from "../utils/quiz";
import { EMPTY_STATES, POINTS_EXPLAINER } from "../utils/onboarding";
import EmptyState from "./EmptyState";

function SectionSelect({ sectionScores, totalPoints, onSelectSection, onGoToPuzzle, completedSections }) {
  const hasStarted = completedSections.length > 0;

  return (
    <div className="card section-select">
      <h2 className="section-select-title">🏔️ Avalanche Learning Paths</h2>
      <p className="section-select-desc">
        Master Avalanche through Easy, Medium, and Hard quizzes — each attempt draws {QUESTIONS_PER_QUIZ} unique questions from that difficulty only.
        Earn points and redeem them for puzzle pieces on your certificate!
      </p>
      <p className="section-select-desc">{POINTS_EXPLAINER.body}</p>

      <div className="points-banner">
        <span>💰 Total Points: <strong>{totalPoints}</strong></span>
      </div>

      {!hasStarted && (
        <EmptyState
          icon="📚"
          title={EMPTY_STATES.noQuizzes.title}
          body={EMPTY_STATES.noQuizzes.body}
          actionLabel="Start Easy quiz"
          onAction={() => onSelectSection("easy")}
        />
      )}

      <div className="sections-grid">
        {sections.map((section) => {
          const score = sectionScores[section.id];
          const done = completedSections.includes(section.id);
          const bank = getQuestionBankStatus(section, QUESTIONS_PER_QUIZ);
          return (
            <button
              key={section.id}
              className={`section-card section-${section.id} ${done ? "completed" : ""}`}
              onClick={() => bank.ok && onSelectSection(section.id)}
              disabled={!bank.ok}
            >
              <span className="section-icon">{section.icon}</span>
              <span className="section-name">{section.name}</span>
              <span className="section-meta">
                {QUESTIONS_PER_QUIZ} unique · pool {bank.size} · {section.pointsPerQuestion} pts each
              </span>
              <span className="section-desc">{section.description}</span>
              {!bank.ok && <span className="section-score">{bank.error}</span>}
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

      <button className="btn-primary puzzle-cta" onClick={onGoToPuzzle}>
        {totalPoints > 0 ? "🧩 Redeem Points for Puzzle Pieces" : "🧩 See how puzzle pieces work"}
      </button>
    </div>
  );
}

export default SectionSelect;
