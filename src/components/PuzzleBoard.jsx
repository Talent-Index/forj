import { PIECE_COST, PUZZLE_SIZE, PUZZLE_LABELS, TOTAL_PIECES } from "../data/questions";
import { availablePoints, redeemPiece } from "../utils/puzzle";
import { playCorrectSound } from "../utils/sounds";
import { useState } from "react";

function PuzzleBoard({ totalPoints, spentPoints, acquiredPieces, onAcquirePiece, onContinue, onBack, userImage }) {
  const [message, setMessage] = useState(null);
  const available = availablePoints(totalPoints, acquiredPieces);
  const spent = spentPoints ?? acquiredPieces.length * PIECE_COST;

  function handleAcquire(index) {
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
      <button className="btn-back" onClick={onBack}>← Back</button>
      <h2 className="puzzle-title">Avalanche Puzzle</h2>
      <p className="puzzle-desc">
        Redeem quiz points for puzzle pieces. Each piece costs {PIECE_COST} points and can be unlocked only once.
      </p>

      <div className="puzzle-stats">
        <span>Remaining: <strong>{available}</strong></span>
        <span>Unlocked: <strong>{acquiredPieces.length}/{TOTAL_PIECES}</strong></span>
        <span>Spent: <strong>{spent}</strong></span>
      </div>

      {message && <p className="puzzle-error">{message}</p>}
      {available < PIECE_COST && acquiredPieces.length < TOTAL_PIECES && (
        <p className="puzzle-hint">
          Need {PIECE_COST} points to unlock another piece. Earn more from a quiz, then return here.
        </p>
      )}

      <div className="puzzle-grid" style={{ gridTemplateColumns: `repeat(${PUZZLE_SIZE}, 1fr)` }}>
        {Array.from({ length: TOTAL_PIECES }, (_, i) => {
          const acquired = acquiredPieces.includes(i);
          const canAfford = available >= PIECE_COST;
          return (
            <button
              key={i}
              className={`puzzle-piece ${acquired ? "acquired" : "locked"} ${!acquired && canAfford ? "affordable" : ""}`}
              onClick={() => handleAcquire(i)}
              disabled={acquired || !canAfford}
              title={
                acquired
                  ? "Unlocked"
                  : canAfford
                    ? `Unlock for ${PIECE_COST} pts`
                    : `Locked · need ${PIECE_COST} pts`
              }
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
                <span className="piece-icon">{acquired ? PUZZLE_LABELS[i] : "?"}</span>
              )}
              <span className="piece-state">{acquired ? "Unlocked" : `${PIECE_COST} pts`}</span>
            </button>
          );
        })}
      </div>

      <button
        className="btn-primary"
        onClick={onContinue}
        disabled={acquiredPieces.length === 0}
      >
        View Certificate
      </button>
    </div>
  );
}

export default PuzzleBoard;
