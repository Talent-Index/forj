import assert from "node:assert/strict";
import {
  EVENT_TYPES,
  emptyProgression,
  applyProgressEvent,
  awardXP,
  migrateFromQuizProgress,
  getLevel,
  getXP,
  getXPForNextLevel,
  xpRequiredForLevel,
  getCurrentStreak,
  getLongestStreak,
  hasLearnedToday,
  utcDateKey,
  addUtcDays,
  isLessonUnlocked,
  isModuleUnlocked,
  isTrackUnlocked,
  isPathComplete,
  getPathProgress,
  getNextLearningItem,
  rankLearners,
  compareLearners,
  snapshotFromProgression,
  createProgressionStore,
} from "../src/utils/progression/index.js";
import { LEARNING_CATALOG } from "../src/data/learning.js";
import { pieceState, jigsawPieces, pieceEdgeSign } from "../src/utils/jigsaw.js";
import { PUZZLE_SIZE } from "../src/data/questions.js";
import { redeemPiece } from "../src/utils/puzzle.js";
import { ACHIEVEMENT_REGISTRY, requirementMet } from "../src/utils/achievements.js";
import { createMemoryStorage } from "../src/utils/progress.js";

const LEARNER_A = "acc_aaaaaaaaaaaaaaaaaaaaaaaa";
const LEARNER_B = "acc_bbbbbbbbbbbbbbbbbbbbbbbb";
const DAY = 24 * 60 * 60 * 1000;
const t0 = Date.UTC(2026, 0, 5, 15, 0, 0);

function apply(state, type, sourceId, timestamp = t0, metadata = {}) {
  return applyProgressEvent(state, {
    type,
    learnerId: state.learnerId,
    sourceId,
    timestamp,
    metadata,
  });
}

function completeLessons(state, lessonIds, timestamp = t0) {
  let next = state;
  for (const id of lessonIds) {
    next = apply(next, EVENT_TYPES.LESSON_COMPLETED, id, timestamp).state;
  }
  return next;
}

// --- Path engine ---
let state = emptyProgression(LEARNER_A);
assert.equal(isTrackUnlocked(state, "fundamentals"), true);
assert.equal(isTrackUnlocked(state, "architecture"), false);
assert.equal(isLessonUnlocked(state, "fund-what"), true);
assert.equal(isLessonUnlocked(state, "fund-chains"), false);
assert.equal(isModuleUnlocked(state, "fund-quiz"), false);

state = completeLessons(state, ["fund-what", "fund-chains", "fund-avax"]);
assert.equal(isModuleUnlocked(state, "fund-quiz"), true);
assert.equal(state.completedModules["fund-lessons"] > 0, true);
assert.equal(isTrackUnlocked(state, "architecture"), false);

const quizOnce = apply(state, EVENT_TYPES.QUIZ_COMPLETED, "easy", t0, {
  difficulty: "easy",
  correct: 5,
  total: 5,
  perfect: true,
});
state = quizOnce.state;
assert.equal(state.completedTracks.fundamentals > 0, true);
assert.equal(isTrackUnlocked(state, "architecture"), true);
assert.equal(getNextLearningItem(state).id, "arch-primary");
assert.equal(getPathProgress(state).percent > 0, true);
assert.equal(isPathComplete(state, LEARNING_CATALOG.defaultPathId), false);

// --- XP: first quiz awards, retry does not ---
const xpAfterFirst = getXP(state);
const retry = apply(state, EVENT_TYPES.QUIZ_COMPLETED, "easy", t0 + 1000, {
  difficulty: "easy",
  correct: 1,
  total: 5,
});
assert.equal(retry.duplicate, true);
assert.equal(getXP(retry.state), xpAfterFirst);
assert.equal(retry.state.completedQuizzes.easy.perfect, true);

const direct = awardXP(emptyProgression(LEARNER_A), {
  type: EVENT_TYPES.LESSON_COMPLETED,
  sourceId: "fund-what",
  learnerId: LEARNER_A,
  timestamp: t0,
});
assert.equal(direct.applied, true);
assert.equal(getXP(direct.state) > 0, true);
const directAgain = awardXP(direct.state, {
  type: EVENT_TYPES.LESSON_COMPLETED,
  sourceId: "fund-what",
  learnerId: LEARNER_A,
  timestamp: t0 + 1,
});
assert.equal(directAgain.duplicate, true);
assert.equal(getXP(directAgain.state), getXP(direct.state));

assert.equal(xpRequiredForLevel(1), 0);
assert.equal(getLevel(0), 1);
assert.equal(getLevel(xpRequiredForLevel(2)) >= 2, true);
assert.equal(getXPForNextLevel(0) > 0, true);

// --- Achievements ---
assert.equal(requirementMet({ type: "quizCount", min: 1 }, { completedQuizzes: { easy: {} } }), true);
assert.equal(
  requirementMet({ type: "perfectSection", sectionId: "easy" }, { completedQuizzes: { easy: { perfect: true } } }),
  true
);
assert.ok(state.achievements.first);
assert.ok(state.achievements.easy_master || state.achievements.easy_complete);
assert.ok(ACHIEVEMENT_REGISTRY.length >= 11);

// --- Streaks / timezone ---
let streakState = emptyProgression(LEARNER_A);
streakState = apply(streakState, EVENT_TYPES.LESSON_COMPLETED, "fund-what", t0).state;
assert.equal(hasLearnedToday(streakState, t0), true);
assert.equal(getCurrentStreak(streakState, t0), 1);

const sameDay = apply(streakState, EVENT_TYPES.LESSON_COMPLETED, "fund-chains", t0 + 2 * 60 * 60 * 1000);
streakState = sameDay.state;
assert.equal(getCurrentStreak(streakState, t0 + 2 * 60 * 60 * 1000), 1);
assert.equal(streakState.streak.days.length, 1);

streakState = apply(streakState, EVENT_TYPES.LESSON_COMPLETED, "fund-avax", t0 + DAY).state;
assert.equal(getCurrentStreak(streakState, t0 + DAY), 2);
assert.equal(getLongestStreak(streakState), 2);

const skipped = apply(streakState, EVENT_TYPES.LESSON_COMPLETED, "arch-primary", t0 + 3 * DAY);
assert.equal(getCurrentStreak(skipped.state, t0 + 3 * DAY), 1);
assert.equal(getLongestStreak(skipped.state), 2);

assert.equal(utcDateKey(Date.UTC(2026, 0, 1, 23, 30)), "2026-01-01");
assert.equal(utcDateKey(Date.UTC(2026, 0, 2, 0, 30)), "2026-01-02");
assert.equal(addUtcDays("2026-01-01", 1), "2026-01-02");

// --- Puzzle geometry + redemption ---
const pieces = jigsawPieces();
assert.equal(pieces.length, 16);
assert.equal(new Set(pieces.map((piece) => piece.d)).size, 16);
assert.equal(pieceState({ acquired: false, canAfford: false, complete: false }), "locked");
assert.equal(pieceState({ acquired: false, canAfford: true, complete: false }), "available");
assert.equal(pieceState({ acquired: false, canAfford: true, complete: false, selected: true }), "selected");
assert.equal(pieceState({ acquired: true, canAfford: true, complete: false }), "unlocked");
assert.equal(pieceState({ acquired: true, canAfford: true, complete: true }), "completed");

for (let row = 0; row < PUZZLE_SIZE; row += 1) {
  for (let col = 0; col < PUZZLE_SIZE - 1; col += 1) {
    assert.equal(pieceEdgeSign(row, col, "right") + pieceEdgeSign(row, col + 1, "left"), 0);
  }
}

let puzzle = { totalPoints: 10, acquiredPieces: [] };
const firstPiece = redeemPiece(puzzle, 0);
assert.equal(firstPiece.ok, true);
puzzle = { totalPoints: 10, acquiredPieces: firstPiece.acquiredPieces };
assert.equal(redeemPiece(puzzle, 0).ok, false);
assert.equal(redeemPiece(puzzle, 99).ok, false);
assert.equal(redeemPiece({ totalPoints: 0, acquiredPieces: [] }, 1).ok, false);

let puzzleProg = emptyProgression(LEARNER_A);
puzzleProg = apply(puzzleProg, EVENT_TYPES.PUZZLE_PIECE_UNLOCKED, "piece-0", t0, { index: 0 }).state;
const dupPiece = apply(puzzleProg, EVENT_TYPES.PUZZLE_PIECE_UNLOCKED, "piece-0", t0 + 1, { index: 0 });
assert.equal(dupPiece.duplicate, true);
assert.equal(getXP(dupPiece.state), getXP(puzzleProg));

// --- Leaderboard ranking / ties ---
const board = rankLearners([
  { learnerId: "a", optIn: true, xp: 100, completionPercent: 40, achievementCount: 2, firstAchievementAt: 50 },
  { learnerId: "b", optIn: true, xp: 100, completionPercent: 80, achievementCount: 1, firstAchievementAt: 10 },
  { learnerId: "c", optIn: false, xp: 999, completionPercent: 100, achievementCount: 9, firstAchievementAt: 1 },
], { window: "global" });
assert.equal(board[0].learnerId, "b");
assert.equal(board.some((row) => row.learnerId === "c"), false);
assert.equal(compareLearners(
  { xp: 10, completionPercent: 10, achievementCount: 1, firstAchievementAt: 5 },
  { xp: 10, completionPercent: 10, achievementCount: 1, firstAchievementAt: 1 }
) > 0, true);

const snap = snapshotFromProgression(state, { displayName: "Ada" });
assert.equal(snap.authority, "local-preview");
assert.equal(snap.optIn, false);

// --- Account isolation ---
const storage = createMemoryStorage();
const store = createProgressionStore(storage);
store.save(LEARNER_A, state);
store.save(LEARNER_B, emptyProgression(LEARNER_B));
assert.equal(getXP(store.load(LEARNER_A)) > 0, true);
assert.equal(getXP(store.load(LEARNER_B)), 0);
store.clear(LEARNER_A);
assert.equal(getXP(store.load(LEARNER_A)), 0);
assert.equal(getXP(store.load(LEARNER_B)), 0);

// --- Migration does not double-award ---
const migrated = migrateFromQuizProgress(emptyProgression(LEARNER_A), {
  sectionScores: { easy: { correct: 5, total: 5, pointsEarned: 15 } },
  acquiredPieces: [0, 1],
  attempts: [{}, {}],
});
const migratedAgain = migrateFromQuizProgress(migrated, {
  sectionScores: { easy: { correct: 5, total: 5, pointsEarned: 15 } },
  acquiredPieces: [0, 1],
  attempts: [{}, {}],
});
assert.equal(getXP(migratedAgain), getXP(migrated));
assert.equal(migrated.completedQuizzes.easy.perfect, true);

console.log("progression system tests passed");
