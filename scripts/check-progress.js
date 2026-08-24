import assert from "node:assert/strict";
import {
  PROGRESS_VIEWS,
  STORAGE_VERSION,
  createMemoryStorage,
  createProgressStore,
  emptyProgress,
  legacyProgressStorageKey,
  normalizeAddress,
  progressStorageKey,
  sanitizeProgress,
} from "../src/utils/progress.js";

const WALLET_A = `0x${"a".repeat(40)}`;
const WALLET_B = `0x${"b".repeat(40)}`;
const WALLET_A_CHECKSUM = `0x${"A".repeat(40)}`;

function snapshot(overrides = {}) {
  return {
    version: STORAGE_VERSION,
    view: PROGRESS_VIEWS.PUZZLE,
    activeSection: null,
    sectionScores: {
      easy: { correct: 4, total: 5, pointsEarned: 12 },
    },
    completedSections: ["easy"],
    attempts: [{ sectionId: "easy", correct: 4, total: 5, pointsEarned: 12 }],
    acquiredPieces: [0, 3],
    spentPoints: 10,
    totalPoints: 12,
    ...overrides,
  };
}

const storage = createMemoryStorage();
const store = createProgressStore(storage);

assert.equal(normalizeAddress(WALLET_A_CHECKSUM), WALLET_A);
assert.equal(normalizeAddress("not-an-address"), null);
assert.equal(progressStorageKey("nope"), null);
assert.equal(store.save("nope", snapshot()), false);

assert.equal(store.save(WALLET_A, snapshot({ recipientName: "Alex Mwangi" })), true);
assert.equal(store.save(WALLET_B, snapshot({
  sectionScores: { medium: { correct: 5, total: 5, pointsEarned: 25 } },
  completedSections: ["medium"],
  acquiredPieces: [1],
  totalPoints: 25,
  recipientName: "Sam O'neil",
})), true);

const loadedA = store.load(WALLET_A);
const loadedB = store.load(WALLET_B);
assert.equal(loadedA.sectionScores.easy.correct, 4);
assert.equal(loadedA.completedSections.includes("easy"), true);
assert.equal(loadedA.totalPoints, 12);
assert.deepEqual(loadedA.acquiredPieces, [0, 3]);
assert.equal(loadedA.spentPoints, 10);
assert.equal(loadedA.recipientName, "Alex Mwangi");
assert.equal(loadedA.sectionScores.medium, undefined);
assert.equal(loadedB.sectionScores.medium.correct, 5);
assert.equal(loadedB.totalPoints, 25);
assert.equal(loadedB.recipientName, "Sam O'neil");
assert.notDeepEqual(loadedA.sectionScores, loadedB.sectionScores);

const restoredAfterRefresh = createProgressStore(storage).load(WALLET_A_CHECKSUM);
assert.equal(restoredAfterRefresh.totalPoints, 12);
assert.equal(restoredAfterRefresh.view, PROGRESS_VIEWS.PUZZLE);

store.clear(WALLET_A);
assert.deepEqual(store.load(WALLET_A).sectionScores, {});
assert.equal(store.load(WALLET_A).recipientName, "");
assert.equal(store.load(WALLET_B).totalPoints, 25);
assert.equal(store.load(WALLET_B).recipientName, "Sam O'neil");

const malformedStore = createProgressStore(storage);
storage.setItem(progressStorageKey(WALLET_A), "{not json");
assert.deepEqual(malformedStore.load(WALLET_A), emptyProgress());

storage.setItem(progressStorageKey(WALLET_A), JSON.stringify({
  view: "warp-zone",
  activeSection: "legendary",
  sectionScores: { easy: { correct: 99, pointsEarned: 999 }, bonus: { pointsEarned: 50 } },
  completedSections: ["easy", "easy", "nope"],
  acquiredPieces: [0, 0, 99, "3"],
  attempts: [null, { sectionId: "easy", correct: 2 }],
}));
const sanitized = malformedStore.load(WALLET_A);
assert.equal(sanitized.version, STORAGE_VERSION);
assert.equal(sanitized.view, PROGRESS_VIEWS.SECTIONS);
assert.equal(sanitized.activeSection, null);
assert.equal(sanitized.sectionScores.easy.correct, 5);
assert.equal(sanitized.sectionScores.easy.pointsEarned, 15);
assert.equal(sanitized.sectionScores.bonus, undefined);
assert.deepEqual(sanitized.completedSections, ["easy"]);
assert.deepEqual(sanitized.acquiredPieces, [0, 3]);
assert.equal(sanitized.spentPoints, 10);
assert.equal(sanitized.totalPoints, 15);

const quizWithoutSection = sanitizeProgress({ view: "quiz", activeSection: null });
assert.equal(quizWithoutSection.view, PROGRESS_VIEWS.SECTIONS);

storage.setItem(legacyProgressStorageKey(WALLET_B), JSON.stringify(snapshot({
  sectionScores: { hard: { correct: 1, total: 5, pointsEarned: 8 } },
  completedSections: ["hard"],
})));
storage.removeItem(progressStorageKey(WALLET_B));
const migrated = createProgressStore(storage).load(WALLET_B);
assert.equal(migrated.sectionScores.hard.pointsEarned, 8);
assert.equal(storage.getItem(progressStorageKey(WALLET_B)) != null, true);

const ACCOUNT_ID = `acc_${"c".repeat(24)}`;
assert.equal(progressStorageKey(ACCOUNT_ID), `skillforge.progress.v${STORAGE_VERSION}.account.${ACCOUNT_ID}`);
assert.equal(store.save(ACCOUNT_ID, snapshot({ recipientName: "Dana Learner" })), true);
assert.equal(store.load(ACCOUNT_ID).recipientName, "Dana Learner");
assert.equal(store.load(WALLET_B).sectionScores.hard.pointsEarned, 8);
assert.equal(store.load(ACCOUNT_ID).sectionScores.easy.correct, 4);

console.log("progress storage tests passed");
