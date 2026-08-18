import { sections } from "../data/questions";
import { QUESTIONS_PER_QUIZ, getQuestionBankStatus } from "../utils/quiz";
import { EMPTY_STATES, PATH_COPY } from "../utils/onboarding";
import EmptyState from "./EmptyState";

function SectionSelect({ sectionScores, totalPoints, onSelectSection, onGoToPuzzle, completedSections }) {
  const hasStarted = completedSections.length > 0;

  return (
    <div className="page">
      <header className="page-header">
        <p className="kicker">Learn</p>
        <h1>Avalanche learning paths</h1>
        <p className="lede">
          Five unique questions per difficulty. Points come from your current Easy, Medium, and Hard scores.
        </p>
      </header>

      <p className="points-banner">Points available · {totalPoints}</p>

      {!hasStarted && (
        <EmptyState
          title={EMPTY_STATES.noQuizzes.title}
          body={EMPTY_STATES.noQuizzes.body}
          actionLabel="Start Easy"
          onAction={() => onSelectSection("easy")}
        />
      )}

      <div className="difficulty-grid">
        {sections.map((section) => {
          const score = sectionScores[section.id];
          const done = completedSections.includes(section.id);
          const bank = getQuestionBankStatus(section, QUESTIONS_PER_QUIZ);
          const copy = PATH_COPY[section.id];
          return (
            <button
              key={section.id}
              className={`card difficulty-card difficulty-card-${section.id} ${done ? "completed" : ""}`}
              onClick={() => bank.ok && onSelectSection(section.id)}
              disabled={!bank.ok}
            >
              <p className="kicker">{copy.kicker}</p>
              <h3>{copy.title}</h3>
              <p>{section.description}</p>
              <p className="meta-line">{QUESTIONS_PER_QUIZ} questions</p>
              {!bank.ok && <span className="section-score">{bank.error}</span>}
              {score !== undefined && (
                <span className="section-score">
                  Last {score.correct}/{score.total} · {score.pointsEarned} pts
                </span>
              )}
              <span className="btn btn-primary">{done ? "Retry" : "Start"}</span>
            </button>
          );
        })}
      </div>

      <button className="btn btn-secondary" onClick={onGoToPuzzle}>
        Open puzzle
      </button>
    </div>
  );
}

export default SectionSelect;
