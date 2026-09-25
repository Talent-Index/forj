/**
 * Wave B Realtime Database paths and helpers.
 * Learner progress stays on Firestore; RTDB holds analytics + question ops.
 */

export const RTDB_PATHS = Object.freeze({
  operators: "ops/operators",
  questions: "questions",
  publishedBanks: "banks/published",
  analytics: "analytics",
});

export function operatorPath(uid) {
  return `${RTDB_PATHS.operators}/${uid}`;
}

export function questionPath(questionId) {
  return `${RTDB_PATHS.questions}/${questionId}`;
}

export function publishedSectionPath(sectionId) {
  return `${RTDB_PATHS.publishedBanks}/${sectionId}`;
}

export function publishedQuestionPath(sectionId, questionId) {
  return `${RTDB_PATHS.publishedBanks}/${sectionId}/${questionId}`;
}

/** Map progress event types to analytics event types. */
export const PROGRESS_TO_ANALYTICS = Object.freeze({
  QUIZ_STARTED: "quiz_started",
  QUIZ_COMPLETED: "quiz_completed",
  LESSON_COMPLETED: "lesson_completed",
  MODULE_COMPLETED: "module_completed",
  TRACK_COMPLETED: "track_completed",
  PATH_COMPLETED: "path_completed",
  PUZZLE_PIECE_UNLOCKED: "puzzle_piece_unlocked",
  PUZZLE_COMPLETED: "puzzle_completed",
  CREDENTIAL_CLAIMED: "credential_claimed",
  CREDENTIAL_ATTESTED: "credential_attested",
});

export function analyticsTypeForProgress(type) {
  return PROGRESS_TO_ANALYTICS[type] || null;
}
