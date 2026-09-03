import { sections } from "../data/questions";
import { QUESTIONS_PER_QUIZ, getQuestionBankStatus } from "../utils/quiz";
import { PATH_COPY } from "../utils/onboarding";
import { Button } from "./ui/primitives";

function SectionSelect({ sectionScores, totalPoints, onSelectSection, onGoToPuzzle, completedSections }) {
  return (
    <section className="section-block">
      <h2>Assessments</h2>
      <p className="meta-line">Retries replace that section’s points · {totalPoints} pts</p>
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
      <Button variant="secondary" onClick={onGoToPuzzle}>Puzzle</Button>
    </section>
  );
}

export default SectionSelect;
