import assert from "node:assert/strict";
import { MAX_POINTS, TOTAL_PIECES } from "../src/data/questions.js";
import { evaluateAchievements } from "../src/utils/achievements.js";
import { mapOnChainCredential } from "../src/utils/credential.js";
import {
  computeLearnerDashboard,
  sectionCompletion,
  shortAddress,
  walletExplorerUrl,
} from "../src/utils/learnerStats.js";
import { EMPTY_STATES } from "../src/utils/onboarding.js";
import {
  applySectionResult,
  createMemoryStorage,
  createProgressStore,
  emptyProgress,
  progressStorageKey,
  recomputeTotalPoints,
} from "../src/utils/progress.js";
import { QUESTIONS_PER_QUIZ } from "../src/utils/quiz.js";

const WALLET_A = `0x${"a".repeat(40)}`;
const WALLET_B = `0x${"b".repeat(40)}`;
const WALLET_A_CHECKSUM = `0x${"A".repeat(40)}`;
const CONTRACT = "0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df";

function dashboardFrom(store, address) {
  return computeLearnerDashboard(store.load(address));
}

function assertFiniteDashboard(stats) {
  assert.equal(Number.isFinite(stats.overallPercent), true);
  assert.equal(Number.isFinite(stats.quizPercent), true);
  assert.equal(Number.isFinite(stats.puzzlePercent), true);
  assert.equal(Number.isFinite(stats.totalPoints), true);
  assert.equal(Number.isFinite(stats.accuracy), true);
  assert.equal(stats.difficulties.length, 3);
  assert.equal(stats.puzzleTotal, TOTAL_PIECES);
}

// Wallet display is truncated and rejects junk.
assert.equal(shortAddress(""), "");
assert.equal(shortAddress("not-an-address"), "");
assert.equal(shortAddress("<script>alert(1)</script>"), "");
assert.equal(shortAddress("0xabc"), "");
assert.equal(shortAddress(WALLET_A), "0xaaaa...aaaa");
assert.equal(shortAddress(WALLET_A_CHECKSUM), "0xaaaa...aaaa");
assert.equal(walletExplorerUrl(WALLET_A), `https://testnet.snowtrace.io/address/${WALLET_A}`);
assert.equal(walletExplorerUrl("javascript:alert(1)"), "");
assert.equal(shortAddress(WALLET_A).includes(WALLET_A), false);

const easy = sectionCompletion({ easy: { correct: 5, pointsEarned: 15 } }, "easy");
assert.equal(easy.percent, 100);
assert.equal(easy.complete, true);

assert.equal(sectionCompletion({ easy: { correct: 0, pointsEarned: 0 } }, "easy").percent, 0);
assert.equal(sectionCompletion({ easy: { correct: 1, pointsEarned: 3 } }, "easy").percent, 20);
assert.equal(sectionCompletion({ medium: { correct: 2, pointsEarned: 10 } }, "medium").percent, 40);
assert.equal(sectionCompletion({ medium: { correct: 3, pointsEarned: 15 } }, "medium").percent, 60);
assert.equal(sectionCompletion({ hard: { correct: 4, pointsEarned: 32 } }, "hard").percent, 80);
assert.equal(sectionCompletion({}, "hard").percent, 0);

const fresh = computeLearnerDashboard();
assert.equal(fresh.isNewLearner, true);
assert.equal(fresh.overallPercent, 0);
assert.equal(fresh.quizCorrect, 0);
assert.equal(fresh.totalPoints, 0);
assert.equal(fresh.puzzleCount, 0);
assert.equal(EMPTY_STATES.noAttempts.title.length > 0, true);
assert.match(EMPTY_STATES.noAttempts.body, /dashboard|quiz|wallet/i);

const mixed = computeLearnerDashboard({
  sectionScores: {
    easy: { correct: 5, total: 5, pointsEarned: 15 },
    medium: { correct: 2, total: 5, pointsEarned: 10 },
  },
  attempts: [
    { sectionId: "easy", correct: 5, total: 5 },
    { sectionId: "medium", correct: 2, total: 5 },
    { sectionId: "easy", correct: 4, total: 5 },
  ],
  acquiredPieces: [0, 1, 2, 3],
  totalPoints: 25,
  spentPoints: 20,
});

assert.equal(mixed.isNewLearner, false);
assert.equal(mixed.difficulties[0].percent, 100);
assert.equal(mixed.difficulties[1].percent, 40);
assert.equal(mixed.difficulties[2].percent, 0);
assert.equal(mixed.quizCorrect, 7);
assert.equal(mixed.quizPercent, 47);
assert.equal(mixed.puzzleCount, 4);
assert.equal(mixed.puzzlePercent, 25);
assert.equal(mixed.overallPercent, Math.round((100 + 40 + 0 + 25) / 4));
assert.equal(mixed.totalPoints, recomputeTotalPoints(mixed.difficulties.reduce((scores, row) => {
  if (row.attempted) {
    scores[row.id] = { correct: row.correct, total: row.total, pointsEarned: row.pointsEarned };
  }
  return scores;
}, {})));
assert.equal(mixed.totalPoints, 25);
assert.equal(mixed.maxPoints, MAX_POINTS);
assert.equal(mixed.spentPoints, 20);
assert.equal(mixed.remainingPoints, 5);

// Overall and difficulty % use current section scores, not stacked retries.
const retried = computeLearnerDashboard({
  sectionScores: { easy: { correct: 3, total: 5, pointsEarned: 9 } },
  attempts: [
    { sectionId: "easy", correct: 5, total: 5 },
    { sectionId: "easy", correct: 3, total: 5 },
  ],
});
assert.equal(retried.difficulties[0].percent, 60);
assert.equal(retried.quizCorrect, 3);
assert.equal(retried.overallPercent, Math.round((60 + 0 + 0 + 0) / 4));
assert.equal(retried.attemptCount, 2);
assert.equal(retried.accuracy, 80);
assert.equal(retried.attemptsBySection.easy, 2);

// Total points follow current rewards, not a stale totalPoints field.
const stalePoints = computeLearnerDashboard({
  sectionScores: {
    easy: { correct: 4, pointsEarned: 999 },
    hard: { correct: 1, pointsEarned: 8 },
  },
  totalPoints: 9999,
});
assert.equal(stalePoints.totalPoints, 4 * 3 + 1 * 8);
assert.equal(stalePoints.totalPoints, 20);
assert.equal(stalePoints.difficulties[0].pointsEarned, 12);
assert.equal(stalePoints.difficulties[2].pointsEarned, 8);

// Puzzle completion uses unique in-range pieces only.
const messyPieces = computeLearnerDashboard({
  acquiredPieces: [0, 0, 99, "3", -1, 15],
  sectionScores: { easy: { correct: 5, pointsEarned: 15 } },
  totalPoints: 15,
});
assert.deepEqual(messyPieces.puzzleCount, 3);
assert.equal(messyPieces.puzzlePercent, Math.round((3 / TOTAL_PIECES) * 100));
assert.equal(messyPieces.spentPoints, 15);

// Learning statistics come from attempt history.
assert.equal(mixed.attemptCount, 3);
assert.equal(mixed.attemptsBySection.easy, 2);
assert.equal(mixed.attemptsBySection.medium, 1);
assert.equal(mixed.attemptsBySection.hard, 0);
assert.equal(mixed.accuracy, Math.round((11 / 15) * 100));
assert.equal(mixed.quizPercent, Math.round((7 / 15) * 100));
assert.notEqual(mixed.accuracy, mixed.quizPercent);

// Earned credentials map from on-chain tuples.
const credential = mapOnChainCredential(
  7n,
  [80n, 15n, 5, 4, 3, "ipfs://art", 1_700_000_000n, false],
  CONTRACT
);
assert.equal(credential.tokenId, "7");
assert.equal(credential.credentialId, "7");
assert.equal(credential.totalPoints, 80);
assert.equal(credential.score.totalPoints, 80);
assert.equal(credential.schemaVersion, 1);
assert.equal(credential.easyCorrect, 5);
assert.equal(credential.mediumCorrect, 4);
assert.equal(credential.hardCorrect, 3);
assert.equal(credential.attested, false);
assert.equal(credential.explorerUrl.includes(CONTRACT), true);
assert.equal(credential.explorerUrl.includes("7"), true);
assert.equal(mapOnChainCredential(0n, [80n, 0n, 0, 0, 0, "", 0n, false], CONTRACT), null);
assert.equal(mapOnChainCredential("bad", [80n], CONTRACT), null);

const attested = mapOnChainCredential(1n, {
  totalPoints: 40n,
  puzzleMask: 1n,
  easyCorrect: 5,
  mediumCorrect: 0,
  hardCorrect: 0,
  image: "",
  mintedAt: 1,
  attested: true,
}, CONTRACT);
assert.equal(attested.attested, true);
assert.equal(attested.easyCorrect, 5);

// Achievements reflect actual learner activity.
const locked = evaluateAchievements(emptyProgress());
assert.equal(locked.every((item) => item.earned === false), true);
assert.equal(locked.length, 8);

const unlocked = evaluateAchievements({
  sectionScores: {
    easy: { correct: 5, total: 5, pointsEarned: 15 },
    medium: { correct: 5, total: 5, pointsEarned: 25 },
    hard: { correct: 5, total: 5, pointsEarned: 40 },
  },
  acquiredPieces: Array.from({ length: TOTAL_PIECES }, (_, index) => index),
  attempts: [
    { sectionId: "easy", correct: 5, total: 5 },
    { sectionId: "medium", correct: 5, total: 5 },
    { sectionId: "hard", correct: 5, total: 5 },
  ],
  hasCredential: true,
});
assert.equal(unlocked.every((item) => item.earned), true);

const noFakePuzzle = evaluateAchievements({
  sectionScores: {},
  acquiredPieces: [0, 0, 0, 0],
  attempts: null,
  hasCredential: false,
});
assert.equal(noFakePuzzle.find((item) => item.id === "puzzle_starter").earned, false);
assert.equal(noFakePuzzle.find((item) => item.id === "first").earned, false);

// Wallet-specific load, switch, and refresh.
const storage = createMemoryStorage();
const store = createProgressStore(storage);
const snapshotA = {
  sectionScores: { easy: { correct: 4, total: 5, pointsEarned: 12 } },
  attempts: [{ sectionId: "easy", correct: 4, total: 5 }],
  acquiredPieces: [0, 3],
  totalPoints: 12,
};
const snapshotB = {
  sectionScores: { medium: { correct: 5, total: 5, pointsEarned: 25 } },
  attempts: [{ sectionId: "medium", correct: 5, total: 5 }],
  acquiredPieces: [1],
  totalPoints: 25,
};

assert.equal(store.save(WALLET_A, snapshotA), true);
assert.equal(store.save(WALLET_B, snapshotB), true);

const dashA = dashboardFrom(store, WALLET_A);
const dashB = dashboardFrom(store, WALLET_B);
assert.equal(dashA.difficulties[0].correct, 4);
assert.equal(dashA.totalPoints, 12);
assert.equal(dashA.puzzleCount, 2);
assert.equal(dashB.difficulties[1].correct, 5);
assert.equal(dashB.totalPoints, 25);
assert.equal(dashB.puzzleCount, 1);
assert.notEqual(dashA.overallPercent, dashB.overallPercent);
assert.equal(dashA.attemptsBySection.easy, 1);
assert.equal(dashB.attemptsBySection.medium, 1);

// Switching wallets loads B, not A. progressReady is false until hydrate matches.
let hydratedAddress = WALLET_A;
let currentAddress = WALLET_B;
assert.equal(Boolean(currentAddress && hydratedAddress === currentAddress), false);
const switched = dashboardFrom(store, currentAddress);
hydratedAddress = currentAddress;
assert.equal(switched.totalPoints, 25);
assert.equal(switched.difficulties[0].attempted, false);
assert.equal(Boolean(currentAddress && hydratedAddress === currentAddress), true);

const restored = dashboardFrom(createProgressStore(storage), WALLET_A_CHECKSUM);
assert.equal(restored.totalPoints, 12);
assert.equal(restored.puzzleCount, 2);
assert.equal(restored.difficulties[0].percent, 80);

// Live retry-replace then persist then reload.
let liveScores = {};
liveScores = applySectionResult(liveScores, { sectionId: "easy", correct: 5, total: QUESTIONS_PER_QUIZ }).sectionScores;
liveScores = applySectionResult(liveScores, { sectionId: "easy", correct: 2, total: QUESTIONS_PER_QUIZ }).sectionScores;
store.save(WALLET_A, {
  sectionScores: liveScores,
  attempts: [
    { sectionId: "easy", correct: 5, total: 5 },
    { sectionId: "easy", correct: 2, total: 5 },
  ],
  acquiredPieces: [2],
});
const afterReload = dashboardFrom(store, WALLET_A);
assert.equal(afterReload.difficulties[0].correct, 2);
assert.equal(afterReload.totalPoints, 6);
assert.equal(afterReload.attemptCount, 2);
assert.equal(afterReload.accuracy, 70);

// Missing or malformed progress does not crash the dashboard.
const malformedPayloads = [
  undefined,
  null,
  {},
  { sectionScores: null, attempts: "nope", acquiredPieces: { 0: 1 } },
  { sectionScores: [], attempts: [null, 12], acquiredPieces: "pieces" },
  { sectionScores: { easy: { correct: 99, pointsEarned: 999 }, bonus: { pointsEarned: 50 } } },
];
for (const payload of malformedPayloads) {
  assert.doesNotThrow(() => computeLearnerDashboard(payload));
  assert.doesNotThrow(() => evaluateAchievements(payload));
  assertFiniteDashboard(computeLearnerDashboard(payload));
}

const malformedStore = createProgressStore(storage);
storage.setItem(progressStorageKey(WALLET_A), "{not json");
const recovered = dashboardFrom(malformedStore, WALLET_A);
assert.equal(recovered.isNewLearner, true);
assert.deepEqual(recovered, computeLearnerDashboard(emptyProgress()));

storage.setItem(progressStorageKey(WALLET_A), JSON.stringify({
  view: "warp-zone",
  sectionScores: { easy: { correct: 99, pointsEarned: 999 } },
  acquiredPieces: [0, 0, 99, "3"],
  attempts: [null, { sectionId: "easy", correct: 2 }],
  totalPoints: "nope",
}));
const sanitizedDash = dashboardFrom(malformedStore, WALLET_A);
assert.equal(sanitizedDash.difficulties[0].correct, 5);
assert.equal(sanitizedDash.difficulties[0].percent, 100);
assert.equal(sanitizedDash.totalPoints, 15);
assert.equal(sanitizedDash.puzzleCount, 2);
assert.equal(sanitizedDash.attemptCount, 1);
assert.doesNotThrow(() => evaluateAchievements(sanitizedDash));

console.log("learner dashboard verification passed");
