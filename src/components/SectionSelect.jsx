import { sections } from "../data/questions";
import { quizLengthFor, getQuestionBankStatus } from "../utils/quiz";
import { PATH_COPY, FORGE_LEVEL_LABELS } from "../utils/onboarding";
import { FORGE_LEVEL_META } from "../utils/quizConfig";
import { Button } from "./ui/primitives";
import { Doodle } from "./doodles";

const LEVEL_DOODLE = {
  easy: "fire",
  medium: "blocks",
  hard: "hammer",
  master: "diamond",
};

function SectionSelect({ sectionScores, totalPoints, onSelectSection, onGoToPuzzle, completedSections }) {
  return (
    <section className="section-block">
      <p className="meta-line">
        Foundation → Builder → Advanced → Mastery · Retries replace that section’s points · {totalPoints} pts
      </p>
      <div className="difficulty-grid">
        {sections.map((section) => {
          const score = sectionScores[section.id];
          const done = completedSections.includes(section.id);
          const length = quizLengthFor(section.id);
          const bank = getQuestionBankStatus(section, length);
          const copy = PATH_COPY[section.id] || {
            kicker: section.name,
            title: section.name,
          };
          const forgeLabel = FORGE_LEVEL_LABELS[section.id] || copy.kicker;
          const blurb = FORGE_LEVEL_META[section.id]?.blurb || section.description;
          return (
            <button
              key={section.id}
              className={`card difficulty-card difficulty-card-${section.id} ${done ? "completed" : ""}`}
              onClick={() => bank.ok && onSelectSection(section.id)}
              disabled={!bank.ok}
            >
              <p className="kicker difficulty-forge-label">
                <Doodle
                  type={LEVEL_DOODLE[section.id] || "spark"}
                  size={14}
                  variant="accent"
                />
                {forgeLabel}
              </p>
              <h3>{copy.title}</h3>
              <p className="meta-line">{section.name} · {length} questions</p>
              <p className="meta-line">{blurb}</p>
              {!bank.ok && <span className="section-score">{bank.error}</span>}
              {score !== undefined && (
                <span className="section-score">
                  Last {score.correct}/{score.total}
                  {score.pointsEarned ? ` · ${score.pointsEarned} pts` : ""}
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
