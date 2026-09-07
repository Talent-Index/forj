/**
 * Controlled randomness for knowledge checks after learning activities.
 */
import { QUIZ_TRIGGER } from "./quizConfig.js";

export function rollQuizThreshold(random = Math.random) {
  const min = QUIZ_TRIGGER.minActivities;
  const max = QUIZ_TRIGGER.maxActivities;
  const span = Math.max(0, max - min);
  return min + Math.floor(Math.min(0.999999, Math.max(0, random())) * (span + 1));
}

/**
 * Record a lesson / exercise / challenge completion.
 * Returns updated cadence fields; when due, pendingKnowledgeCheck is true.
 */
export function recordLearningActivity(state = {}, random = Math.random) {
  const threshold = state.quizThreshold > 0 ? state.quizThreshold : rollQuizThreshold(random);
  const count = (Number(state.activitiesSinceQuiz) || 0) + 1;
  if (count >= threshold) {
    return {
      activitiesSinceQuiz: 0,
      quizThreshold: rollQuizThreshold(random),
      pendingKnowledgeCheck: true,
    };
  }
  return {
    activitiesSinceQuiz: count,
    quizThreshold: threshold,
    pendingKnowledgeCheck: Boolean(state.pendingKnowledgeCheck),
  };
}

export function clearPendingKnowledgeCheck() {
  return {
    pendingKnowledgeCheck: false,
  };
}

export function acknowledgeQuizStarted(_previous = {}, random = Math.random) {
  void _previous;
  return {
    activitiesSinceQuiz: 0,
    quizThreshold: rollQuizThreshold(random),
    pendingKnowledgeCheck: false,
  };
}
