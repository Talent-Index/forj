import { PIECE_COST, PUZZLE_SIZE, TOTAL_PIECES } from "../data/questions";
import { availablePoints, redeemPiece } from "../utils/puzzle";
import { playCorrectSound } from "../utils/sounds";
import { EMPTY_STATES, ERROR_STATES, PUZZLE_EXPLAINER } from "../utils/onboarding";
import EmptyState from "./EmptyState";
import { useState } from "react";

function PuzzleBoard({ totalPoints, spentPoints, acquiredPieces, onAcquirePiece, onContinue, onBack, userImage }) {
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState(null);
  const available = availablePoints(totalPoints, acquiredPieces);
  const spent = spentPoints ?? acquiredPieces.length * PIECE_COST;
  const complete = acquiredPieces.length === TOTAL_PIECES;

  function handleAcquire(index) {
    setSelected(index);
    const result = redeemPiece({ totalPoints, acquiredPieces }, index);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage(null);
    playCorrectSound();
    onAcquirePiece(index);
  }

  return (
    <div className="card puzzle-board">
      <button className="btn btn-secondary" onClick={onBack}>Back</button>
      <div className="puzzle-layout">
        <div>
          <p className="kicker">Reward</p>
          <h2>4 × 4 certificate puzzle</h2>
          <p>{PUZZLE_EXPLAINER.body}</p>
          {available < PIECE_COST && acquiredPieces.length === 0 && (
            <EmptyState
              title={EMPTY_STATES.noPoints.title}
              body={EMPTY_STATES.noPoints.body}
              actionLabel="Back to quizzes"
              onAction={onBack}
            />
          )}
          {message && (
            <EmptyState variant="error" title={ERROR_STATES.puzzle.title} body={`${message} ${ERROR_STATES.puzzle.body}`} />
          )}
          <div className="puzzle-grid" style={{ gridTemplateColumns: `repeat(${PUZZLE_SIZE}, 1fr)` }}>
            {Array.from({ length: TOTAL_PIECES }, (_, i) => {
              const acquired = acquiredPieces.includes(i);
              const canAfford = available >= PIECE_COST;
              const state = acquired ? "acquired" : canAfford ? "affordable" : "locked";
              return (
                <button
                  key={i}
                  className={`puzzle-piece ${state} ${selected === i ? "selected" : ""} ${complete ? "complete" : ""}`}
                  onClick={() => handleAcquire(i)}
                  disabled={acquired || !canAfford}
                  aria-label={acquired ? `Piece ${i + 1} unlocked` : `Piece ${i + 1} locked`}
                >
                  {acquired && userImage ? (
                    <div
                      className="piece-image"
                      style={{
                        backgroundImage: `url(${userImage})`,
                        backgroundSize: `${PUZZLE_SIZE * 100}% ${PUZZLE_SIZE * 100}%`,
                        backgroundPosition: `${((i % PUZZLE_SIZE) / (PUZZLE_SIZE - 1)) * 100}% ${((Math.floor(i / PUZZLE_SIZE)) / (PUZZLE_SIZE - 1)) * 100}%`,
                      }}
                    />
                  ) : (
                    <span>{acquired ? "✓" : ""}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <aside className="card">
          <p className="kicker">Your points</p>
          <p className="stat-value">{available}</p>
          <p className="meta-line">Pieces unlocked {acquiredPieces.length} / {TOTAL_PIECES}</p>
          <p className="meta-line">Next piece {PIECE_COST} points</p>
          <p className="meta-line">Spent {spent}</p>
          <button className="btn btn-primary" onClick={onContinue} disabled={acquiredPieces.length === 0}>
            View certificate
          </button>
        </aside>
      </div>
    </div>
  );
}

export default PuzzleBoard;
