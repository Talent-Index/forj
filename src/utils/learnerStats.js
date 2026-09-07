import { TOTAL_PIECES, MAX_POINTS, getSectionById } from "../data/questions.js";
import { quizLengthFor } from "./quiz.js";
import { CREDENTIAL_SCORE_MAX, CREDENTIAL_SCORE_SECTIONS } from "./quizConfig.js";
import { QUIZ_SECTIONS, SCORE_SECTIONS, sanitizeProgress, normalizeAddress } from "./progress.js";
import { overallMastery, buildMasteryMap } from "./mastery.js";
import { fragmentProgress } from "./fragments.js";

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
  const expected = quizLengthFor(sectionId);
  const credentialDefault = CREDENTIAL_SCORE_SECTIONS.includes(sectionId)
    ? CREDENTIAL_SCORE_MAX
    : expected;
  if (!score) {
    return {
      id: sectionId,
      name: section?.name || sectionId,
      correct: 0,
      total: credentialDefault,
      pointsEarned: 0,
      maxPoints: (section?.pointsPerQuestion || 0) * credentialDefault,
      percent: 0,
      attempted: false,
      complete: false,
    };
  }
  const reported = Number(score.total);
  const total =
    Number.isFinite(reported) && reported > 0
      ? Math.min(reported, expected)
      : credentialDefault;
  const correct = Math.min(Number(score.correct) || 0, total);
  const pointsEarned = Number(score.pointsEarned) || 0;
  const seatingCap = sectionId === "master" ? total : Math.min(total, CREDENTIAL_SCORE_MAX);
  const maxPoints = (section?.pointsPerQuestion || 0) * seatingCap;
  return {
    id: sectionId,
    name: section?.name || sectionId,
    correct,
    total,
    pointsEarned,
    maxPoints,
    percent: Math.round((correct / Math.max(1, total)) * 100),
    attempted: true,
    complete: correct === total,
  };
}

export function computeLearnerDashboard(raw = {}) {
  const progress = sanitizeProgress(raw);
  const difficulties = SCORE_SECTIONS.map((id) => sectionCompletion(progress.sectionScores, id));
  const quizCorrect = difficulties.reduce((sum, row) => sum + row.correct, 0);
  const quizTotal = difficulties.reduce((sum, row) => sum + row.total, 0);
  const quizPercent = quizTotal ? Math.round((quizCorrect / quizTotal) * 100) : 0;
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
      acc.asked += Number(attempt?.total) || quizLengthFor(attempt?.sectionId);
      const id = attempt?.sectionId;
      if (QUIZ_SECTIONS.includes(id)) acc.bySection[id] = (acc.bySection[id] || 0) + 1;
      return acc;
    },
    { correct: 0, asked: 0, bySection: { easy: 0, medium: 0, hard: 0, master: 0 } }
  );
  const accuracy = attemptTotals.asked
    ? Math.round((attemptTotals.correct / attemptTotals.asked) * 100)
    : 0;
  const fragments = fragmentProgress(progress.puzzleFragments);

  return {
    overallPercent,
    quizCorrect,
    quizTotal,
    quizPercent,
    difficulties,
    mastery: buildMasteryMap(progress.sectionScores),
    masteryOverall: overallMastery(progress.sectionScores),
    totalPoints: progress.totalPoints,
    maxPoints: MAX_POINTS,
    remainingPoints: Math.max(0, progress.totalPoints - progress.spentPoints),
    spentPoints: progress.spentPoints,
    puzzleCount,
    puzzleTotal: TOTAL_PIECES,
    puzzlePercent,
    puzzleComplete: puzzleCount >= TOTAL_PIECES,
    fragments,
    attemptCount: attemptRows.length,
    attemptsBySection: attemptTotals.bySection,
    accuracy,
    isNewLearner:
      attemptRows.length === 0 &&
      puzzleCount === 0 &&
      difficulties.every((row) => !row.attempted),
  };
}
