import { useState } from "react";
import { PIECE_COST, TOTAL_PIECES, MAX_POINTS } from "../data/questions";
import { availablePoints, redeemPiece } from "../utils/puzzle";
import { playCorrectSound } from "../utils/sounds";
import { EMPTY_STATES, ERROR_STATES, PUZZLE_EXPLAINER } from "../utils/onboarding";
import EmptyState from "./EmptyState";
import JigsawBoard from "./JigsawBoard";
import { Button } from "./ui/primitives";

function PuzzleBoard({
  totalPoints,
  spentPoints,
  acquiredPieces,
  onAcquirePiece,
  onContinue,
  onBack,
  userImage,
}) {
  const [lastUnlocked, setLastUnlocked] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [message, setMessage] = useState(null);
  const available = availablePoints(totalPoints, acquiredPieces);
  const spent = spentPoints ?? acquiredPieces.length * PIECE_COST;
  const complete = acquiredPieces.length === TOTAL_PIECES;
  const canAfford = available >= PIECE_COST;
  const forgeCost = TOTAL_PIECES * PIECE_COST;

  function handleAcquire(index) {
    if (selectedIndex !== index) {
      setSelectedIndex(index);
      setMessage(null);
      return;
    }
    const result = redeemPiece({ totalPoints, acquiredPieces }, index);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage(null);
    setSelectedIndex(null);
    setLastUnlocked(index);
    playCorrectSound();
    onAcquirePiece(index);
  }

  return (
    <div className="page puzzle-board">
      <header className="page-header">
        <p className="kicker">The forge</p>
        <h1>{complete ? "Certificate assembled" : "Certificate in progress"}</h1>
        <p className="lede">
          {complete
            ? "The jigsaw has settled. Reveal the forged certificate and enter the recipient name."
            : "Spend points to seat interlocking pieces. Each piece forges more of the Forjora certificate."}
        </p>
      </header>

      <section className="section-block forge-progress">
        <p className="kicker">Forging the credential</p>
        <p className="stat-value">{acquiredPieces.length} / {TOTAL_PIECES} pieces</p>
        <p className="meta-line">
          {spent} / {forgeCost} points seated · {available} remaining of {totalPoints} earned
        </p>
        <p className="meta-line">{PUZZLE_EXPLAINER.body}</p>
      </section>

      {available < PIECE_COST && acquiredPieces.length === 0 && (
        <EmptyState
          title={EMPTY_STATES.noPoints.title}
          body={EMPTY_STATES.noPoints.body}
          actionLabel="Back to quizzes"
          onAction={onBack}
        />
      )}
      {message && (
        <EmptyState
          variant="error"
          title={ERROR_STATES.puzzle.title}
          body={`${message} ${ERROR_STATES.puzzle.body}`}
        />
      )}
      {complete && (
        <p className="forge-complete-banner" role="status">Last piece unlocked. The certificate is ready to reveal.</p>
      )}

      <div className="puzzle-layout">
        <JigsawBoard
          artwork={userImage}
          acquiredPieces={acquiredPieces}
          canAfford={canAfford && !complete}
          complete={complete}
          interactive={!complete}
          lastUnlocked={lastUnlocked}
          selectedIndex={selectedIndex}
          onSelect={handleAcquire}
        />
        <aside className="card">
          <p className="kicker">Materials</p>
          <p className="stat-value">{available}</p>
          <p className="meta-line">Points still available</p>
          <p className="meta-line">Each piece costs {PIECE_COST}. Max quiz score is {MAX_POINTS}.</p>
          <div className="quiz-nav quiz-nav-end">
            <Button variant="secondary" onClick={onBack}>Back</Button>
            <Button onClick={onContinue} disabled={acquiredPieces.length === 0}>
              {complete ? "Reveal certificate" : "View certificate"}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default PuzzleBoard;
