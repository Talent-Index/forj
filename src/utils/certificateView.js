import { QUESTIONS_PER_QUIZ } from "./quiz.js";
import { SCORE_SECTIONS } from "./progress.js";

export const TRUST_COPY = {
  claimed: {
    title: "Claimed",
    body: "This credential records a score claimed by the recipient. It is not an independently proctored assessment.",
  },
  attested: {
    title: "Issuer attested",
    body: "This credential was authorized by a recognized SkillForge issuer.",
  },
};

export function quizPercent(sectionScores = {}) {
  const correct = SCORE_SECTIONS.reduce(
    (sum, id) => sum + (Number(sectionScores[id]?.correct) || 0),
    0
  );
  return Math.round((correct / (SCORE_SECTIONS.length * QUESTIONS_PER_QUIZ)) * 100);
}

export function highestDifficulty(sectionScores = {}) {
  if (sectionScores.hard?.correct === QUESTIONS_PER_QUIZ) return "Hard";
  if (sectionScores.medium?.correct === QUESTIONS_PER_QUIZ) return "Medium";
  if (sectionScores.easy?.correct === QUESTIONS_PER_QUIZ) return "Easy";
  return "In progress";
}

export function certificateId(address, maskHex) {
  if (!address) return "SF-LOCAL";
  return `SF-${address.slice(2, 8).toUpperCase()}-${String(maskHex || "0").toUpperCase()}`;
}
