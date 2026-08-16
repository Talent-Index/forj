export function recomputeTotalPoints(sectionScores) {
  return Object.values(sectionScores).reduce(
    (sum, score) => sum + (score?.pointsEarned ?? 0),
    0
  );
}

export function applySectionResult(sectionScores, result) {
  const nextScores = {
    ...sectionScores,
    [result.sectionId]: {
      correct: result.correct,
      total: result.total,
      pointsEarned: result.pointsEarned,
    },
  };

  return {
    sectionScores: nextScores,
    totalPoints: recomputeTotalPoints(nextScores),
  };
}

export function progressStorageKey(address) {
  return `skillforge_progress_${address.toLowerCase()}`;
}

export function loadProgress(address) {
  if (!address) return null;
  try {
    const raw = localStorage.getItem(progressStorageKey(address));
    if (!raw) return null;
    return JSON.parse(raw);
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
