import { PIECE_COST, PUZZLE_SIZE, PUZZLE_LABELS, TOTAL_PIECES } from "../data/questions";
import { playCorrectSound } from "../utils/sounds";

function PuzzleBoard({ totalPoints, spentPoints, acquiredPieces, onAcquirePiece, onContinue, onBack, userImage }) {
  const available = Math.max(0, totalPoints - spentPoints);

  function handleAcquire(index) {
    if (acquiredPieces.includes(index)) return;
    if (available < PIECE_COST) return;
    playCorrectSound();
    onAcquirePiece(index);
  }

  return (
    <div className="card puzzle-board">
      <button className="btn-back" onClick={onBack}>← Back</button>
      <h2 className="puzzle-title">🧩 Avalanche Puzzle</h2>
      <p className="puzzle-desc">
        Redeem your quiz points for puzzle pieces. Each piece costs {PIECE_COST} points.
        Your completed puzzle appears on your certificate!
      </p>

      <div className="puzzle-stats">
        <span>💰 Available: <strong>{available}</strong></span>
        <span>🧩 Acquired: <strong>{acquiredPieces.length}/{TOTAL_PIECES}</strong></span>
        <span>📉 Spent: <strong>{spentPoints}</strong></span>
      </div>

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
              title={acquired ? "Acquired!" : `Cost: ${PIECE_COST} pts`}
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
              {!acquired && <span className="piece-cost">{PIECE_COST}pts</span>}
            </button>
          );
        })}
      </div>

      <button
        className="btn-primary"
        onClick={onContinue}
        disabled={acquiredPieces.length === 0}
      >
        🏆 View Certificate
      </button>
    </div>
  );
}

export default PuzzleBoard;
