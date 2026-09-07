import { TOTAL_PIECES } from "../../data/questions";
import { PUZZLE_MILESTONES } from "../../utils/achievementCatalog";
import { Card, ProgressBar, Button } from "../ui/primitives";
import { Doodle } from "../doodles";

export function PuzzleProgress({
  puzzleCount = 0,
  onPuzzle,
  complete = false,
}) {
  const total = TOTAL_PIECES;
  const percent = Math.round((puzzleCount / total) * 100);
  const next = PUZZLE_MILESTONES.find((row) => puzzleCount < row.count);

  return (
    <Card className="puzzle-progress-card">
      <div className="streak-card-head">
        <Doodle type="puzzle" size={22} variant={complete ? "accent" : "muted"} />
        <div>
          <p className="kicker">Puzzle progress</p>
          <p className="stat-value">{puzzleCount} / {total}</p>
        </div>
      </div>
      <ProgressBar label={`${puzzleCount} of ${total} pieces`} value={percent} />
      <p className="meta-line">
        {complete
          ? "Puzzle complete — the path certificate is ready to name."
          : next
            ? `Next milestone: ${next.label} (${next.count} / ${total})`
            : "Keep seating pieces with quiz points and fragments."}
      </p>
      {onPuzzle ? (
        <Button variant="secondary" onClick={onPuzzle}>
          Open puzzle
        </Button>
      ) : null}
    </Card>
  );
}

export function PuzzleMilestoneList({ puzzleCount = 0 }) {
  return (
    <ul className="puzzle-milestone-list">
      {PUZZLE_MILESTONES.map((row) => {
        const earned = puzzleCount >= row.count;
        return (
          <li key={row.id} className={earned ? "is-earned" : ""}>
            <span className={earned ? "result-mark-ok" : "meta-line"}>{earned ? "✓" : "·"}</span>
            <span>{row.label}</span>
            <span className="meta-line">{row.count} / {TOTAL_PIECES}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default PuzzleProgress;
