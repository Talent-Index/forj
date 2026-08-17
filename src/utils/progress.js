import { getSectionById } from "../data/questions.js";
import { QUESTIONS_PER_QUIZ } from "./quiz.js";

export const SCORE_SECTIONS = ["easy", "medium", "hard"];

function toNonNegativeInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export function emptySectionScores() {
  return {};
}

export function normalizeSectionResult(result) {
  const sectionId = result?.sectionId;
  if (!SCORE_SECTIONS.includes(sectionId)) return null;

  const section = getSectionById(sectionId);
  if (!section) return null;

  const total = QUESTIONS_PER_QUIZ;
  const correct = Math.min(toNonNegativeInt(result.correct), total);
  return {
    sectionId,
    correct,
    total,
    pointsEarned: correct * section.pointsPerQuestion,
    wrong: Math.min(toNonNegativeInt(result.wrong), total),
  };
}

export function recomputeTotalPoints(sectionScores) {
  return SCORE_SECTIONS.reduce((sum, sectionId) => {
    const score = sectionScores?.[sectionId];
    return sum + toNonNegativeInt(score?.pointsEarned);
  }, 0);
}

export function applySectionResult(sectionScores, result) {
  const current = sectionScores && typeof sectionScores === "object" ? sectionScores : {};
  const normalized = normalizeSectionResult(result);
  if (!normalized) {
    return {
      sectionScores: { ...current },
      totalPoints: recomputeTotalPoints(current),
    };
  }

  const nextScores = {
    ...current,
    [normalized.sectionId]: {
      correct: normalized.correct,
      total: normalized.total,
      pointsEarned: normalized.pointsEarned,
    },
  };

  return {
    sectionScores: nextScores,
    totalPoints: recomputeTotalPoints(nextScores),
  };
}

export function applyAttemptHistory(attempts) {
  return (attempts || []).reduce(
    (state, result) => applySectionResult(state.sectionScores, result),
    { sectionScores: emptySectionScores(), totalPoints: 0 }
  );
}

export function progressStorageKey(address) {
  return `skillforge_progress_${address.toLowerCase()}`;
}

export function loadProgress(address) {
  if (!address) return null;
  try {
    const raw = localStorage.getItem(progressStorageKey(address));
    if (!raw) return null;
    const saved = JSON.parse(raw);
    const sectionScores = saved.sectionScores && typeof saved.sectionScores === "object"
      ? saved.sectionScores
      : {};
    return {
      ...saved,
      sectionScores,
      totalPoints: recomputeTotalPoints(sectionScores),
    };
  } catch {
    return null;
  }
}

export function saveProgress(address, progress) {
  if (!address) return;
  try {
    localStorage.setItem(progressStorageKey(address), JSON.stringify(progress));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function clearProgress(address) {
  if (!address) return;
  try {
    localStorage.removeItem(progressStorageKey(address));
  } catch {
    // Ignore storage failures.
  }
}
