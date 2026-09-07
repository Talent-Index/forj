import { CREDENTIAL_SCORE_MAX, CREDENTIAL_SCORE_SECTIONS } from "./quizConfig.js";
import { SCORE_SECTIONS } from "./progress.js";
import { CREDENTIAL_STATES } from "./credentialStatus.js";

export const TRUST_COPY = {
  claimed: {
    title: CREDENTIAL_STATES.claimed.label,
    body: CREDENTIAL_STATES.claimed.body,
  },
  attested: {
    title: CREDENTIAL_STATES.attested.label,
    body: CREDENTIAL_STATES.attested.body,
  },
};

export function quizPercent(sectionScores = {}) {
  const correct = SCORE_SECTIONS.reduce((sum, id) => {
    const row = sectionScores[id];
    const capped = Math.min(Number(row?.correct) || 0, CREDENTIAL_SCORE_MAX);
    return sum + capped;
  }, 0);
  return Math.round((correct / (SCORE_SECTIONS.length * CREDENTIAL_SCORE_MAX)) * 100);
}

export function sectionScoresFromCredential(credential) {
  if (!credential?.difficulty) return {};
  return {
    easy: { correct: Number(credential.difficulty.easy?.correct) || 0 },
    medium: { correct: Number(credential.difficulty.medium?.correct) || 0 },
    hard: { correct: Number(credential.difficulty.hard?.correct) || 0 },
  };
}

export function highestDifficulty(sectionScores = {}) {
  for (const id of [...CREDENTIAL_SCORE_SECTIONS].reverse()) {
    const row = sectionScores[id];
    if (!row) continue;
    const total = Number(row.total) > 0 ? Number(row.total) : CREDENTIAL_SCORE_MAX;
    const need = Math.min(total, CREDENTIAL_SCORE_MAX);
    if (Number(row.correct) >= need) {
      if (id === "hard") return "Hard";
      if (id === "medium") return "Medium";
      return "Easy";
    }
  }
  return "In progress";
}

export function certificateId(address, maskHex) {
  if (!address) return "FJ-LOCAL";
  return `FJ-${address.slice(2, 8).toUpperCase()}-${String(maskHex || "0").toUpperCase()}`;
}
