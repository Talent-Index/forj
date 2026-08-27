import { PIECE_COST } from "../data/questions";
import {
  JIGSAW_BOARD,
  JIGSAW_PAD,
  JIGSAW_VIEW,
  jigsawPieces,
  pieceState,
} from "../utils/jigsaw";
import { safeMediaSrc } from "../utils/frontendSecurity";

const PIECES = jigsawPieces();

function JigsawBoard({
  artwork,
  acquiredPieces = [],
  canAfford = false,
  complete = false,
  interactive = false,
  lastUnlocked = null,
  selectedIndex = null,
  showLabels = true,
  onSelect,
}) {
  return (
    <svg
      className={`jigsaw-board ${complete ? "jigsaw-board-complete" : ""}`}
      viewBox={`${-JIGSAW_PAD} ${-JIGSAW_PAD} ${JIGSAW_VIEW} ${JIGSAW_VIEW}`}
      role="group"
      aria-label="SkillForge certificate jigsaw"
    >
      <defs>
        {PIECES.map((piece) => (
          <clipPath key={piece.index} id={`jigsaw-clip-${piece.index}`}>
            <path d={piece.d} />
          </clipPath>
        ))}
      </defs>
      {PIECES.map((piece) => {
        const acquired = acquiredPieces.includes(piece.index);
        const selected = selectedIndex === piece.index;
        const state = pieceState({ acquired, canAfford, complete, selected });
        const clickable = interactive && !acquired && canAfford;
        return (
          <g
            key={piece.index}
            className={`jigsaw-piece is-${state} ${lastUnlocked === piece.index ? "is-enter" : ""}`}
            role={clickable ? "button" : "img"}
            tabIndex={clickable ? 0 : undefined}
            aria-label={
              acquired
                ? `Piece ${piece.index + 1} unlocked`
                : selected
                  ? `Selected piece ${piece.index + 1}. Click again to unlock for ${PIECE_COST} points`
                  : canAfford
                    ? `Select piece ${piece.index + 1} to unlock for ${PIECE_COST} points`
                    : `Piece ${piece.index + 1} locked, needs ${PIECE_COST} points`
            }
            onClick={clickable ? () => onSelect?.(piece.index) : undefined}
            onKeyDown={
              clickable
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect?.(piece.index);
                    }
                  }
                : undefined
            }
          >
            {acquired && safeMediaSrc(artwork) ? (
              <g clipPath={`url(#jigsaw-clip-${piece.index})`}>
                <image
                  href={safeMediaSrc(artwork)}
                  x="0"
                  y="0"
                  width={JIGSAW_BOARD}
                  height={JIGSAW_BOARD}
                  preserveAspectRatio="xMidYMid slice"
                />
              </g>
            ) : (
              <path className="jigsaw-fill" d={piece.d} />
            )}
            <path className="jigsaw-stroke" d={piece.d} />
            {!acquired && showLabels && (
              <g className="jigsaw-label" transform={`translate(${piece.cx} ${piece.cy})`}>
                <text textAnchor="middle" dy="-4">{state === "selected" ? "Selected" : state === "available" ? "Unlock" : "Locked"}</text>
                <text textAnchor="middle" dy="14">{PIECE_COST} pts</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default JigsawBoard;
