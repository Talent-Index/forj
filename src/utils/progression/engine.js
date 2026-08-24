import { TOTAL_PIECES } from "../../data/questions.js";
import { LEARNING_CATALOG } from "../../data/learning.js";
import { SCORE_SECTIONS } from "../progress.js";
import { normalizePieces } from "../puzzle.js";
import { ACHIEVEMENT_REGISTRY, achievementsToUnlock } from "../achievements.js";
import {
  EVENT_TYPES,
  UNIQUE_EVENT_TYPES,
  LEARNING_ACTIVITY_TYPES,
  createProgressEvent,
} from "./events.js";
import { awardXP as grantXpEntry, getLevel, getXP, xpAmountFor } from "./xp.js";
import {
  emptyStreak,
  getCurrentStreak,
  getLongestStreak,
  pendingStreakMilestones,
  recordLearningActivity,
  utcDateKey,
} from "./streaks.js";
import {
  getNextLearningItem,
  getPathProgress,
  isModuleComplete,
  isPathComplete,
  isTrackComplete,
  lessonsCompletedForQuizMigration,
} from "./paths.js";

export const PROGRESSION_VERSION = 2;

export function emptyProgression(learnerId = null) {
  return {
    version: PROGRESSION_VERSION,
    learnerId: learnerId || null,
    events: [],
    eventKeys: {},
    xp: 0,
    xpKeys: {},
    xpHistory: [],
    achievements: {},
    streak: emptyStreak(),
    completedLessons: {},
    completedModules: {},
    completedTracks: {},
    completedPaths: {},
    completedQuizzes: {},
    puzzle: { pieces: {}, completedAt: null },
    credential: { claimed: false, attested: false, claimedAt: null, attestedAt: null },
    leaderboard: { optIn: false, displayName: "", hideWallet: true },
    migratedFrom: null,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function sanitizeProgression(raw, learnerId = null) {
  const base = emptyProgression(learnerId);
  if (!isRecord(raw)) return base;
  return {
    ...base,
    version: PROGRESSION_VERSION,
    learnerId: raw.learnerId || learnerId || null,
    events: Array.isArray(raw.events) ? raw.events.filter(isRecord) : [],
    eventKeys: isRecord(raw.eventKeys) ? raw.eventKeys : {},
    xp: Math.max(0, Math.floor(Number(raw.xp) || 0)),
    xpKeys: isRecord(raw.xpKeys) ? raw.xpKeys : {},
    xpHistory: Array.isArray(raw.xpHistory) ? raw.xpHistory.filter(isRecord) : [],
    achievements: isRecord(raw.achievements) ? raw.achievements : {},
    streak: { ...emptyStreak(), ...(isRecord(raw.streak) ? raw.streak : {}) },
    completedLessons: isRecord(raw.completedLessons) ? raw.completedLessons : {},
    completedModules: isRecord(raw.completedModules) ? raw.completedModules : {},
    completedTracks: isRecord(raw.completedTracks) ? raw.completedTracks : {},
    completedPaths: isRecord(raw.completedPaths) ? raw.completedPaths : {},
    completedQuizzes: isRecord(raw.completedQuizzes) ? raw.completedQuizzes : {},
    puzzle: {
      pieces: isRecord(raw.puzzle?.pieces) ? raw.puzzle.pieces : {},
      completedAt: raw.puzzle?.completedAt || null,
    },
    credential: {
      claimed: Boolean(raw.credential?.claimed),
      attested: Boolean(raw.credential?.attested),
      claimedAt: raw.credential?.claimedAt || null,
      attestedAt: raw.credential?.attestedAt || null,
    },
    leaderboard: {
      optIn: Boolean(raw.leaderboard?.optIn),
      displayName: typeof raw.leaderboard?.displayName === "string" ? raw.leaderboard.displayName : "",
      hideWallet: raw.leaderboard?.hideWallet !== false,
    },
    migratedFrom: raw.migratedFrom || null,
  };
}

function rememberEvent(state, event) {
  return {
    ...state,
    eventKeys: { ...state.eventKeys, [event.id]: true },
    events: [...state.events, event],
  };
}

function grantXP(state, type, sourceId, timestamp, metadata, feedback) {
  const before = getLevel(state.xp);
  const granted = grantXpEntry(state, {
    type,
    sourceId,
    amount: xpAmountFor(type, metadata),
    timestamp,
    metadata,
  });
  if (granted.awarded > 0) {
    feedback.push({ kind: "xp", type, sourceId, amount: granted.awarded });
    const after = getLevel(granted.state.xp);
    if (after > before) {
      feedback.push({ kind: "level-up", level: after, previous: before });
    }
  }
  return granted.state;
}

function applyOne(state, event, feedback) {
  if (state.eventKeys[event.id] && UNIQUE_EVENT_TYPES.has(event.type)) {
    return state;
  }
  let next = rememberEvent(state, event);
  const ts = event.timestamp;
  const sourceId = event.sourceId;

  switch (event.type) {
    case EVENT_TYPES.QUIZ_STARTED:
      return next;
    case EVENT_TYPES.QUIZ_COMPLETED: {
      const correct = Math.max(0, Math.floor(Number(event.metadata.correct) || 0));
      const total = Math.max(1, Math.floor(Number(event.metadata.total) || 5));
      const perfect = event.metadata.perfect === true || correct >= total;
      next = {
        ...next,
        completedQuizzes: {
          ...next.completedQuizzes,
          [sourceId]: {
            difficulty: event.metadata.difficulty || sourceId,
            correct,
            total,
            perfect,
            at: ts,
          },
        },
      };
      next = grantXP(next, EVENT_TYPES.QUIZ_COMPLETED, sourceId, ts, {
        difficulty: event.metadata.difficulty || sourceId,
      }, feedback);
      if (perfect) {
        next = grantXP(next, "QUIZ_PERFECT", sourceId, ts, {}, feedback);
      }
      return next;
    }
    case EVENT_TYPES.LESSON_COMPLETED:
      next = {
        ...next,
        completedLessons: { ...next.completedLessons, [sourceId]: ts },
      };
      return grantXP(next, EVENT_TYPES.LESSON_COMPLETED, sourceId, ts, event.metadata, feedback);
    case EVENT_TYPES.MODULE_COMPLETED:
      next = {
        ...next,
        completedModules: { ...next.completedModules, [sourceId]: ts },
      };
      feedback.push({ kind: "unlock", scope: "module", id: sourceId });
      return grantXP(next, EVENT_TYPES.MODULE_COMPLETED, sourceId, ts, event.metadata, feedback);
    case EVENT_TYPES.TRACK_COMPLETED:
      next = {
        ...next,
        completedTracks: { ...next.completedTracks, [sourceId]: ts },
      };
      feedback.push({ kind: "unlock", scope: "track", id: sourceId });
      return grantXP(next, EVENT_TYPES.TRACK_COMPLETED, sourceId, ts, event.metadata, feedback);
    case EVENT_TYPES.PATH_COMPLETED:
      next = {
        ...next,
        completedPaths: { ...next.completedPaths, [sourceId]: ts },
      };
      feedback.push({ kind: "unlock", scope: "path", id: sourceId });
      return grantXP(next, EVENT_TYPES.PATH_COMPLETED, sourceId, ts, event.metadata, feedback);
    case EVENT_TYPES.LEARNING_ACTIVITY: {
      const recorded = recordLearningActivity(next, ts);
      return recorded.state;
    }
    case EVENT_TYPES.ACHIEVEMENT_UNLOCKED: {
      const definition = ACHIEVEMENT_REGISTRY.find((item) => item.id === sourceId);
      next = {
        ...next,
        achievements: {
          ...next.achievements,
          [sourceId]: { id: sourceId, unlockedAt: ts },
        },
      };
      feedback.push({ kind: "achievement", id: sourceId, name: definition?.name || sourceId });
      return grantXP(next, EVENT_TYPES.ACHIEVEMENT_UNLOCKED, sourceId, ts, {
        xp: definition?.reward?.xp,
      }, feedback);
    }
    case EVENT_TYPES.STREAK_MILESTONE:
      next = {
        ...next,
        streak: {
          ...next.streak,
          milestones: { ...(next.streak.milestones || {}), [sourceId]: ts },
        },
      };
      feedback.push({ kind: "streak-milestone", days: Number(sourceId) || 0 });
      return grantXP(next, EVENT_TYPES.STREAK_MILESTONE, sourceId, ts, event.metadata, feedback);
    case EVENT_TYPES.PUZZLE_PIECE_UNLOCKED: {
      const index = Number.isInteger(event.metadata.index)
        ? event.metadata.index
        : Number(String(sourceId).replace("piece-", ""));
      next = {
        ...next,
        puzzle: {
          ...next.puzzle,
          pieces: {
            ...next.puzzle.pieces,
            [sourceId]: { index, unlockedAt: ts },
          },
        },
      };
      return grantXP(next, EVENT_TYPES.PUZZLE_PIECE_UNLOCKED, sourceId, ts, event.metadata, feedback);
    }
    case EVENT_TYPES.PUZZLE_COMPLETED:
      next = {
        ...next,
        puzzle: { ...next.puzzle, completedAt: ts },
      };
      feedback.push({ kind: "puzzle-complete" });
      return grantXP(next, EVENT_TYPES.PUZZLE_COMPLETED, sourceId || "certificate", ts, event.metadata, feedback);
    case EVENT_TYPES.CREDENTIAL_CLAIMED:
      next = {
        ...next,
        credential: { ...next.credential, claimed: true, claimedAt: ts },
      };
      return grantXP(next, EVENT_TYPES.CREDENTIAL_CLAIMED, sourceId || "credential", ts, event.metadata, feedback);
    case EVENT_TYPES.CREDENTIAL_ATTESTED:
      next = {
        ...next,
        credential: { ...next.credential, attested: true, attestedAt: ts },
      };
      return grantXP(next, EVENT_TYPES.CREDENTIAL_ATTESTED, sourceId || "credential", ts, event.metadata, feedback);
    default:
      return next;
  }
}

function applyLearningActivity(state, timestamp, feedback) {
  const day = utcDateKey(timestamp);
  const event = createProgressEvent({
    type: EVENT_TYPES.LEARNING_ACTIVITY,
    learnerId: state.learnerId,
    sourceId: day,
    timestamp,
  });
  if (!event || state.eventKeys[event.id]) return state;
  return applyOne(state, event, feedback);
}

function settleCurriculum(state, timestamp, feedback) {
  let next = state;
  let changed = true;
  let guard = 0;
  while (changed && guard < 24) {
    changed = false;
    guard += 1;
    for (const module of LEARNING_CATALOG.modules) {
      if (next.completedModules[module.id]) continue;
      if (!isModuleComplete(next, module.id)) continue;
      const event = createProgressEvent({
        type: EVENT_TYPES.MODULE_COMPLETED,
        learnerId: next.learnerId,
        sourceId: module.id,
        timestamp,
      });
      if (event && !next.eventKeys[event.id]) {
        next = applyOne(next, event, feedback);
        changed = true;
      }
    }
    for (const track of LEARNING_CATALOG.tracks) {
      if (next.completedTracks[track.id]) continue;
      if (!isTrackComplete(next, track.id)) continue;
      const event = createProgressEvent({
        type: EVENT_TYPES.TRACK_COMPLETED,
        learnerId: next.learnerId,
        sourceId: track.id,
        timestamp,
      });
      if (event && !next.eventKeys[event.id]) {
        next = applyOne(next, event, feedback);
        changed = true;
      }
    }
    for (const path of LEARNING_CATALOG.paths) {
      if (next.completedPaths[path.id]) continue;
      if (!isPathComplete(next, path.id)) continue;
      const event = createProgressEvent({
        type: EVENT_TYPES.PATH_COMPLETED,
        learnerId: next.learnerId,
        sourceId: path.id,
        timestamp,
      });
      if (event && !next.eventKeys[event.id]) {
        next = applyOne(next, event, feedback);
        changed = true;
      }
    }
  }
  return next;
}

function settlePuzzle(state, timestamp, feedback) {
  const count = Object.keys(state.puzzle.pieces || {}).length;
  if (count < TOTAL_PIECES || state.puzzle.completedAt) return state;
  const event = createProgressEvent({
    type: EVENT_TYPES.PUZZLE_COMPLETED,
    learnerId: state.learnerId,
    sourceId: "certificate",
    timestamp,
  });
  if (!event || state.eventKeys[event.id]) return state;
  return applyOne(state, event, feedback);
}

function settleStreaks(state, timestamp, feedback) {
  let next = state;
  for (const mark of pendingStreakMilestones(next)) {
    const event = createProgressEvent({
      type: EVENT_TYPES.STREAK_MILESTONE,
      learnerId: next.learnerId,
      sourceId: String(mark),
      timestamp,
      metadata: { days: mark },
    });
    if (event && !next.eventKeys[event.id]) {
      next = applyOne(next, event, feedback);
    }
  }
  return next;
}

export function buildAchievementContext(state, extras = {}) {
  return {
    completedQuizzes: state.completedQuizzes,
    sectionScores: extras.sectionScores || {},
    puzzleCount: Object.keys(state.puzzle.pieces || {}).length,
    puzzleComplete: Boolean(state.puzzle.completedAt) || extras.puzzleComplete,
    attemptCount: extras.attemptCount || 0,
    hasCredential: Boolean(state.credential.claimed) || Boolean(extras.hasCredential),
    currentStreak: getCurrentStreak(state, extras.now),
    longestStreak: getLongestStreak(state),
    completedTracks: state.completedTracks,
    completedPaths: state.completedPaths,
  };
}

function settleAchievements(state, timestamp, feedback, extras) {
  let next = state;
  const unlocked = achievementsToUnlock(buildAchievementContext(next, extras), next.achievements);
  for (const item of unlocked) {
    const event = createProgressEvent({
      type: EVENT_TYPES.ACHIEVEMENT_UNLOCKED,
      learnerId: next.learnerId,
      sourceId: item.id,
      timestamp,
    });
    if (event && !next.eventKeys[event.id]) {
      next = applyOne(next, event, feedback);
    }
  }
  return next;
}

function settle(state, timestamp, feedback, extras) {
  let next = settleCurriculum(state, timestamp, feedback);
  next = settlePuzzle(next, timestamp, feedback);
  next = settleStreaks(next, timestamp, feedback);
  next = settleAchievements(next, timestamp, feedback, extras);
  return next;
}

export function applyProgressEvent(state, rawEvent, extras = {}) {
  const current = sanitizeProgression(state, rawEvent?.learnerId || state?.learnerId);
  const event = createProgressEvent({
    ...rawEvent,
    learnerId: rawEvent?.learnerId || current.learnerId,
  });
  if (!event) {
    return { state: current, feedback: [], applied: false, duplicate: false };
  }
  const unique = UNIQUE_EVENT_TYPES.has(event.type);
  const already = unique && Boolean(current.eventKeys[event.id]);
  const feedback = [];
  let next = clone(current);

  if (event.type === EVENT_TYPES.QUIZ_COMPLETED) {
    if (!already) {
      next = applyOne(next, event, feedback);
    }
    next = applyLearningActivity(next, event.timestamp, feedback);
    next = settle(next, event.timestamp, feedback, extras);
    return { state: next, feedback, applied: !already, duplicate: already };
  }

  if (already) {
    return { state: current, feedback: [], applied: false, duplicate: true };
  }

  next = applyOne(next, event, feedback);
  if (LEARNING_ACTIVITY_TYPES.has(event.type)) {
    next = applyLearningActivity(next, event.timestamp, feedback);
  }
  next = settle(next, event.timestamp, feedback, extras);
  return { state: next, feedback, applied: true, duplicate: false };
}

export function awardXP(state, input = {}) {
  return applyProgressEvent(state, {
    type: input.type,
    sourceId: input.sourceId,
    learnerId: input.learnerId,
    timestamp: input.timestamp,
    metadata: { ...input.metadata, amount: input.amount, difficulty: input.difficulty },
  });
}

export function migrateFromQuizProgress(state, quizProgress = {}) {
  let next = sanitizeProgression(state);
  const timestamp = Number(quizProgress.migratedAt) || Date.now();
  const scores = isRecord(quizProgress.sectionScores) ? quizProgress.sectionScores : {};
  for (const sectionId of SCORE_SECTIONS) {
    const score = scores[sectionId];
    if (!score) continue;
    const total = Math.max(1, Math.floor(Number(score.total) || 5));
    const correct = Math.max(0, Math.floor(Number(score.correct) || 0));
    next = applyProgressEvent(next, {
      type: EVENT_TYPES.QUIZ_COMPLETED,
      learnerId: next.learnerId,
      sourceId: sectionId,
      timestamp,
      metadata: {
        difficulty: sectionId,
        correct,
        total,
        perfect: correct >= total,
        migrated: true,
      },
    }, {
      sectionScores: scores,
      attemptCount: Array.isArray(quizProgress.attempts) ? quizProgress.attempts.length : 0,
    }).state;
    for (const lessonId of lessonsCompletedForQuizMigration(sectionId)) {
      next = applyProgressEvent(next, {
        type: EVENT_TYPES.LESSON_COMPLETED,
        learnerId: next.learnerId,
        sourceId: lessonId,
        timestamp,
        metadata: { migrated: true },
      }).state;
    }
  }
  for (const index of normalizePieces(quizProgress.acquiredPieces)) {
    next = applyProgressEvent(next, {
      type: EVENT_TYPES.PUZZLE_PIECE_UNLOCKED,
      learnerId: next.learnerId,
      sourceId: `piece-${index}`,
      timestamp,
      metadata: { index, migrated: true },
    }).state;
  }
  if (quizProgress.hasCredential) {
    next = applyProgressEvent(next, {
      type: EVENT_TYPES.CREDENTIAL_CLAIMED,
      learnerId: next.learnerId,
      sourceId: "credential",
      timestamp,
      metadata: { migrated: true },
    }).state;
  }
  return {
    ...next,
    migratedFrom: next.migratedFrom || "quiz-progress-v1",
  };
}

export function summarizeProgression(state, extras = {}) {
  const current = sanitizeProgression(state);
  const path = getPathProgress(current);
  const nextItem = getNextLearningItem(current);
  return {
    learnerId: current.learnerId,
    xp: getXP(current),
    level: getLevel(current.xp),
    streak: getCurrentStreak(current, extras.now),
    longestStreak: getLongestStreak(current),
    achievementCount: Object.keys(current.achievements).length,
    puzzleCount: Object.keys(current.puzzle.pieces || {}).length,
    puzzleTotal: TOTAL_PIECES,
    pathPercent: path.percent,
    pathComplete: path.complete,
    nextItem,
    credentialClaimed: Boolean(current.credential.claimed),
    credentialAttested: Boolean(current.credential.attested),
  };
}
