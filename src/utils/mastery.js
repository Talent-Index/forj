import { CREDENTIAL_SCORE_SECTIONS, QUIZ_SECTION_ORDER, quizLengthFor } from "./quizConfig.js";

/**
 * Mastery is knowledge signal (accuracy), separate from XP activity.
 */
export function masteryForSection(sectionScores, sectionId) {
  const score = sectionScores?.[sectionId];
  if (!score || !Number.isFinite(Number(score.total)) || Number(score.total) <= 0) {
    return { sectionId, percent: 0, attempted: false, correct: 0, total: 0 };
  }
  const correct = Number(score.correct) || 0;
  const total = Number(score.total) || 0;
  return {
    sectionId,
    percent: Math.round((correct / total) * 100),
    attempted: true,
    correct,
    total,
  };
}

export function buildMasteryMap(sectionScores = {}) {
  return QUIZ_SECTION_ORDER.map((id) => masteryForSection(sectionScores, id));
}

export function overallMastery(sectionScores = {}) {
  const rows = CREDENTIAL_SCORE_SECTIONS.map((id) => masteryForSection(sectionScores, id)).filter(
    (row) => row.attempted
  );
  if (!rows.length) return 0;
  return Math.round(rows.reduce((sum, row) => sum + row.percent, 0) / rows.length);
}

export function topicMasteryFromLog(answerLog = [], bankById = {}) {
  const buckets = {};
  for (const entry of answerLog) {
    const bank = bankById[entry.id];
    const topic = bank?.topic || bank?.skill || "general";
    if (!buckets[topic]) buckets[topic] = { correct: 0, total: 0 };
    buckets[topic].total += 1;
    if (entry.correct) buckets[topic].correct += 1;
  }
  return Object.entries(buckets).map(([topic, stats]) => ({
    topic,
    percent: Math.round((stats.correct / stats.total) * 100),
    ...stats,
  }));
}

export function expectedQuizTotal(sectionId) {
  return quizLengthFor(sectionId);
}
