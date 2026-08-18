import { QUESTIONS_PER_QUIZ } from "../../utils/quiz";
import { TOTAL_PIECES } from "../../data/questions";
import { EMPTY_STATES, PATH_COPY } from "../../utils/onboarding";
import { Button, Card, ProgressBar } from "../ui/primitives";
import EmptyState from "../EmptyState";
import Achievements from "../Achievements";

function shortAddr(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function ProgressPage({
  address,
  sectionScores,
  completedSections,
  totalPoints,
  acquiredPieces,
  attempts,
  onContinue,
  onLearn,
}) {
  const rows = ["easy", "medium", "hard"].map((id) => {
    const score = sectionScores[id];
    const pct = score ? Math.round((score.correct / QUESTIONS_PER_QUIZ) * 100) : 0;
    return { id, pct, score };
  });
  const next = rows.find((row) => row.pct < 100) || rows[0];

  return (
    <div className="page">
      <header className="page-header">
        <p className="kicker">Progress</p>
        <h1>Welcome back</h1>
        <p className="meta-line">{shortAddr(address)}</p>
      </header>

      <div className="stat-row">
        <Card className="stat-compact">
          <p className="kicker">Points</p>
          <p className="stat-value">{totalPoints}</p>
        </Card>
        <Card className="stat-compact">
          <p className="kicker">Puzzle</p>
          <p className="stat-value">{acquiredPieces.length}/{TOTAL_PIECES}</p>
        </Card>
        <Card className="stat-compact">
          <p className="kicker">Attempts</p>
          <p className="stat-value">{attempts.length}</p>
        </Card>
      </div>

      <Card>
        <h2>Learning progress</h2>
        {completedSections.length === 0 ? (
          <EmptyState
            title={EMPTY_STATES.noQuizzes.title}
            body={EMPTY_STATES.noQuizzes.body}
            actionLabel="Start learning"
            onAction={onLearn}
          />
        ) : (
          rows.map((row) => (
            <ProgressBar
              key={row.id}
              label={`${PATH_COPY[row.id].kicker} · ${PATH_COPY[row.id].title}`}
              value={row.pct}
            />
          ))
        )}
      </Card>

      <Card className="path-continue">
        <div>
          <p className="kicker">Current learning path</p>
          <h3>{PATH_COPY[next.id].title}</h3>
        </div>
        <Button onClick={() => onContinue(next.id)}>Continue</Button>
      </Card>

      <Achievements
        sectionScores={sectionScores}
        acquiredPieces={acquiredPieces}
        attempts={attempts}
      />
    </div>
  );
}

export default ProgressPage;
