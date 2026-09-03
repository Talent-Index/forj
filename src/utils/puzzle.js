import { PIECE_COST, TOTAL_PIECES } from "../data/questions.js";
import { TRACK_CERTIFICATES } from "../data/learning.js";

export { PIECE_COST, TOTAL_PIECES };

function toNonNegativeInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export function normalizePieces(pieces) {
  const seen = new Set();
  const next = [];
  if (!Array.isArray(pieces)) return next;
  for (const item of pieces) {
    const index = toNonNegativeInt(item);
    if (index >= TOTAL_PIECES || seen.has(index)) continue;
    seen.add(index);
    next.push(index);
  }
  return next;
}

export function spentPointsFor(acquiredPieces) {
  return normalizePieces(acquiredPieces).length * PIECE_COST;
}

export function availablePoints(totalPoints, acquiredPieces) {
  return Math.max(0, toNonNegativeInt(totalPoints) - spentPointsFor(acquiredPieces));
}

function certificateForPiece(index) {
  return TRACK_CERTIFICATES.find((item) => item.pieceIndexes.includes(index)) || null;
}

function quizEarned(sectionScores, quizId) {
  return Math.max(0, Number(sectionScores?.[quizId]?.pointsEarned) || 0);
}

export function availablePointsForPiece(state, index) {
  const acquiredPieces = normalizePieces(state?.acquiredPieces);
  const certificate = certificateForPiece(index);
  if (certificate?.quizId && state?.sectionScores) {
    const earned = quizEarned(state.sectionScores, certificate.quizId);
    const spent = certificate.pieceIndexes.filter((piece) => acquiredPieces.includes(piece)).length * PIECE_COST;
    return Math.max(0, earned - spent);
  }
  return availablePoints(state?.totalPoints, acquiredPieces);
}

function snapshot(pieces, totalPoints, error = null) {
  const acquiredPieces = normalizePieces(pieces);
  const spentPoints = spentPointsFor(acquiredPieces);
  const total = toNonNegativeInt(totalPoints);
  return {
    ok: error == null,
    error,
    acquiredPieces,
    spentPoints,
    available: Math.max(0, total - spentPoints),
  };
}

export function redeemPiece(state, index) {
  const totalPoints = toNonNegativeInt(state?.totalPoints);
  const acquiredPieces = normalizePieces(state?.acquiredPieces);
  const pieceIndex = Number(index);

  if (!Number.isInteger(pieceIndex) || pieceIndex < 0 || pieceIndex >= TOTAL_PIECES) {
    return snapshot(acquiredPieces, totalPoints, "Invalid puzzle piece.");
  }
  if (acquiredPieces.includes(pieceIndex)) {
    return snapshot(acquiredPieces, totalPoints, "That piece is already unlocked.");
  }
  const available = availablePointsForPiece(state, pieceIndex);
  if (available < PIECE_COST) {
    const certificate = certificateForPiece(pieceIndex);
    const label = certificate?.quizLabel || "this";
    return snapshot(
      acquiredPieces,
      totalPoints,
      `Need ${PIECE_COST} ${label} points to unlock this piece. You have ${available}.`
    );
  }

  const nextPieces = [...acquiredPieces, pieceIndex];
  const nextSpent = spentPointsFor(nextPieces);
  if (nextSpent > totalPoints) {
    return snapshot(acquiredPieces, totalPoints, "Not enough points to unlock that piece.");
  }

  return snapshot(nextPieces, totalPoints);
}
