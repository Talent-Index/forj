import { FRAGMENTS_PER_PIECE, fragmentRewardFor } from "./quizConfig.js";

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
