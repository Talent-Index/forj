import { TOTAL_PIECES, MAX_POINTS, getSectionById } from "../data/questions.js";
import { QUESTIONS_PER_QUIZ } from "./quiz.js";
import { SCORE_SECTIONS, sanitizeProgress, normalizeAddress } from "./progress.js";

export function shortAddress(address) {
  const normalized = normalizeAddress(address);
  if (!normalized) return "";
  return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
}

export function walletExplorerUrl(address) {
  const normalized = normalizeAddress(address);
  if (!normalized) return "";
  return `https://testnet.snowtrace.io/address/${normalized}`;
}

export function sectionCompletion(sectionScores, sectionId) {
  const section = getSectionById(sectionId);
  const score = sectionScores?.[sectionId];
  const correct = Number(score?.correct) || 0;
  const total = QUESTIONS_PER_QUIZ;
  const pointsEarned = Number(score?.pointsEarned) || 0;
  const maxPoints = (section?.pointsPerQuestion || 0) * total;
  const attempted = Boolean(score);
  return {
    id: sectionId,
    name: section?.name || sectionId,
    correct: Math.min(correct, total),
    total,
    pointsEarned,
    maxPoints,
    percent: Math.round((Math.min(correct, total) / total) * 100),
    attempted,
    complete: attempted && correct === total,
  };
}

export function computeLearnerDashboard(raw = {}) {
  const progress = sanitizeProgress(raw);
  const difficulties = SCORE_SECTIONS.map((id) => sectionCompletion(progress.sectionScores, id));
  const quizCorrect = difficulties.reduce((sum, row) => sum + row.correct, 0);
  const quizTotal = SCORE_SECTIONS.length * QUESTIONS_PER_QUIZ;
  const quizPercent = Math.round((quizCorrect / quizTotal) * 100);
  const puzzleCount = progress.acquiredPieces.length;
  const puzzlePercent = Math.round((puzzleCount / TOTAL_PIECES) * 100);
  const overallPercent = Math.round(
    (difficulties.reduce((sum, row) => sum + row.percent, 0) + puzzlePercent) /
      (difficulties.length + 1)
  );

  const attemptRows = progress.attempts;
  const attemptTotals = attemptRows.reduce(
    (acc, attempt) => {
      acc.correct += Number(attempt?.correct) || 0;
      acc.asked += Number(attempt?.total) || QUESTIONS_PER_QUIZ;
      const id = attempt?.sectionId;
      if (SCORE_SECTIONS.includes(id)) acc.bySection[id] += 1;
      return acc;
    },
    { correct: 0, asked: 0, bySection: { easy: 0, medium: 0, hard: 0 } }
  );
  const accuracy = attemptTotals.asked
    ? Math.round((attemptTotals.correct / attemptTotals.asked) * 100)
    : 0;

  return {
    overallPercent,
    quizCorrect,
    quizTotal,
    quizPercent,
    difficulties,
    totalPoints: progress.totalPoints,
    maxPoints: MAX_POINTS,
    remainingPoints: Math.max(0, progress.totalPoints - progress.spentPoints),
    spentPoints: progress.spentPoints,
    puzzleCount,
    puzzleTotal: TOTAL_PIECES,
    puzzlePercent,
    puzzleComplete: puzzleCount >= TOTAL_PIECES,
    attemptCount: attemptRows.length,
    attemptsBySection: attemptTotals.bySection,
    accuracy,
    isNewLearner:
      attemptRows.length === 0 &&
      puzzleCount === 0 &&
      difficulties.every((row) => !row.attempted),
  };
}
