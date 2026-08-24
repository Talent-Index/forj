export const EVENT_TYPES = Object.freeze({
  QUIZ_STARTED: "QUIZ_STARTED",
  QUIZ_COMPLETED: "QUIZ_COMPLETED",
  LESSON_COMPLETED: "LESSON_COMPLETED",
  MODULE_COMPLETED: "MODULE_COMPLETED",
  TRACK_COMPLETED: "TRACK_COMPLETED",
  PATH_COMPLETED: "PATH_COMPLETED",
  LEARNING_ACTIVITY: "LEARNING_ACTIVITY",
  ACHIEVEMENT_UNLOCKED: "ACHIEVEMENT_UNLOCKED",
  STREAK_MILESTONE: "STREAK_MILESTONE",
  PUZZLE_PIECE_UNLOCKED: "PUZZLE_PIECE_UNLOCKED",
  PUZZLE_COMPLETED: "PUZZLE_COMPLETED",
  CREDENTIAL_CLAIMED: "CREDENTIAL_CLAIMED",
  CREDENTIAL_ATTESTED: "CREDENTIAL_ATTESTED",
});

export const UNIQUE_EVENT_TYPES = new Set([
  EVENT_TYPES.QUIZ_STARTED,
  EVENT_TYPES.QUIZ_COMPLETED,
  EVENT_TYPES.LESSON_COMPLETED,
  EVENT_TYPES.MODULE_COMPLETED,
  EVENT_TYPES.TRACK_COMPLETED,
  EVENT_TYPES.PATH_COMPLETED,
  EVENT_TYPES.LEARNING_ACTIVITY,
  EVENT_TYPES.ACHIEVEMENT_UNLOCKED,
  EVENT_TYPES.STREAK_MILESTONE,
  EVENT_TYPES.PUZZLE_PIECE_UNLOCKED,
  EVENT_TYPES.PUZZLE_COMPLETED,
  EVENT_TYPES.CREDENTIAL_CLAIMED,
  EVENT_TYPES.CREDENTIAL_ATTESTED,
]);

export const LEARNING_ACTIVITY_TYPES = new Set([
  EVENT_TYPES.QUIZ_COMPLETED,
  EVENT_TYPES.LESSON_COMPLETED,
  EVENT_TYPES.MODULE_COMPLETED,
]);

export function eventDedupeKey(type, sourceId) {
  return `${type}:${String(sourceId ?? "")}`;
}

export function createProgressEvent({
  type,
  learnerId = null,
  sourceId = "",
  timestamp,
  metadata,
  id,
} = {}) {
  if (!type || !EVENT_TYPES[type]) {
    return null;
  }
  const ts = Number(timestamp);
  const source = sourceId == null ? "" : String(sourceId);
  return {
    id: id || eventDedupeKey(type, source),
    type,
    learnerId: learnerId || null,
    sourceId: source,
    timestamp: Number.isFinite(ts) ? ts : Date.now(),
    metadata: metadata && typeof metadata === "object" && !Array.isArray(metadata) ? { ...metadata } : {},
  };
}
