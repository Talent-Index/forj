import { FRAGMENTS_PER_PIECE, fragmentRewardFor } from "./quizConfig.js";
import { TOTAL_PIECES } from "../data/questions.js";
import { normalizePieces, spentPointsFor } from "./puzzle.js";

export function normalizeFragments(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export function fragmentProgress(fragments) {
  const total = normalizeFragments(fragments);
  const piecesFromFragments = Math.floor(total / FRAGMENTS_PER_PIECE);
  const towardNext = total % FRAGMENTS_PER_PIECE;
  return {
    fragments: total,
    piecesFromFragments,
    towardNext,
    neededForNext: FRAGMENTS_PER_PIECE,
    percentToNext: Math.round((towardNext / FRAGMENTS_PER_PIECE) * 100),
  };
}

/**
 * Award fragments for a quiz result. First completion pays full; retries pay none.
 */
export function awardQuizFragments(state, result = {}) {
  const sectionId = result.sectionId;
  const firstCompletion = !state?.fragmentKeys?.[sectionId];
  const perfect = Number(result.correct) >= Number(result.total) && Number(result.total) > 0;
  const awarded = fragmentRewardFor(sectionId, { perfect, firstCompletion });
  const current = normalizeFragments(state?.puzzleFragments);
  if (awarded <= 0) {
    return {
      state: {
        puzzleFragments: current,
        fragmentKeys: { ...(state?.fragmentKeys || {}) },
        fragmentPieceCredits: state?.fragmentPieceCredits || 0,
      },
      awarded: 0,
      firstCompletion,
      perfect,
    };
  }
  return {
    state: {
      puzzleFragments: current + awarded,
      fragmentKeys: {
        ...(state?.fragmentKeys || {}),
        [sectionId]: true,
      },
      fragmentPieceCredits: state?.fragmentPieceCredits || 0,
    },
    awarded,
    firstCompletion,
    perfect,
  };
}

export function canConvertFragments(fragments, count = 1) {
  return normalizeFragments(fragments) >= FRAGMENTS_PER_PIECE * count;
}

/**
 * Spend fragments for piece credits (does not seat a piece by itself).
 */
export function spendFragmentsForPiece(state, count = 1) {
  const need = FRAGMENTS_PER_PIECE * Math.max(1, Math.floor(count));
  const current = normalizeFragments(state?.puzzleFragments);
  if (current < need) {
    return { ok: false, error: `Need ${need} fragments for a piece (${current} on hand).`, state };
  }
  return {
    ok: true,
    error: null,
    state: {
      ...state,
      puzzleFragments: current - need,
      fragmentPieceCredits: (state?.fragmentPieceCredits || 0) + Math.floor(count),
    },
  };
}

/**
 * Convert as many fragment bundles as possible into seated puzzle pieces.
 * Fragment seating does not spend quiz points (points seating remains separate).
 */
export function convertFragmentsToPieces(state) {
  let current = {
    puzzleFragments: normalizeFragments(state?.puzzleFragments),
    fragmentKeys: { ...(state?.fragmentKeys || {}) },
    fragmentPieceCredits: state?.fragmentPieceCredits || 0,
    acquiredPieces: normalizePieces(state?.acquiredPieces),
  };
  const unlocked = [];
  while (canConvertFragments(current.puzzleFragments)) {
    const spent = spendFragmentsForPiece(current, 1);
    if (!spent.ok) break;
    const acquired = normalizePieces(spent.state.acquiredPieces ?? current.acquiredPieces);
    let nextIndex = -1;
    for (let i = 0; i < TOTAL_PIECES; i += 1) {
      if (!acquired.includes(i)) {
        nextIndex = i;
        break;
      }
    }
    if (nextIndex < 0) {
      current = { ...spent.state, acquiredPieces: acquired };
      break;
    }
    const nextPieces = [...acquired, nextIndex];
    current = {
      ...spent.state,
      acquiredPieces: nextPieces,
      fragmentPieceCredits: Math.max(0, (spent.state.fragmentPieceCredits || 1) - 1),
    };
    unlocked.push(nextIndex);
  }
  return {
    state: {
      ...current,
      spentPoints: spentPointsFor(current.acquiredPieces),
    },
    unlocked,
  };
}
