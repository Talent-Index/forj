import assert from "node:assert/strict";
import {
  INTRODUCTION,
  LEARNING_PROGRESSION,
  DIFFICULTY_LEVELS,
  POINTS_EXPLAINER,
  PUZZLE_EXPLAINER,
  CREDENTIAL_EXPLAINER,
  FUJI_EXPLAINER,
  WALLET_GUIDANCE,
  FIRST_TIME_FLOW,
  EMPTY_STATES,
  ERROR_STATES,
  requiredOnboardingTopics,
  firstRunStatus,
  onboardingStorageKey,
  isFirstRunGuideDismissed,
  dismissFirstRunGuide,
} from "../src/utils/onboarding.js";

const topics = requiredOnboardingTopics();
assert.deepEqual(topics, [
  "introduction",
  "learningProgression",
  "difficultyLevels",
  "points",
  "puzzlePieces",
  "credentials",
  "fujiTestnet",
  "walletGuidance",
  "firstTimeFlow",
  "emptyStates",
  "errorStates",
]);

assert.match(INTRODUCTION.body, /Fuji|quiz|credential/i);
assert.equal(LEARNING_PROGRESSION.length, 5);
assert.deepEqual(
  LEARNING_PROGRESSION.map((step) => step.title),
  ["Learn", "Quiz", "Earn points", "Unlock puzzle pieces", "Mint a credential"]
);

assert.equal(DIFFICULTY_LEVELS.length, 3);
assert.deepEqual(
  DIFFICULTY_LEVELS.map((level) => level.id),
  ["easy", "medium", "hard"]
);
for (const level of DIFFICULTY_LEVELS) {
  assert.ok(level.pointsPerQuestion > 0);
  assert.equal(level.questionsPerQuiz, 5);
}

assert.match(POINTS_EXPLAINER.body, /replace|stack/i);
assert.equal(PUZZLE_EXPLAINER.pieceCost, 5);
assert.equal(PUZZLE_EXPLAINER.totalPieces, 16);
assert.match(CREDENTIAL_EXPLAINER.body, /soulbound|self-claimed/i);
assert.equal(CREDENTIAL_EXPLAINER.claimed.includes("Self-claimed"), true);
assert.equal(CREDENTIAL_EXPLAINER.attested.includes("Issuer-attested"), true);
assert.equal(/verif(?:y|ied|ication|iable)/i.test(CREDENTIAL_EXPLAINER.body), false);
assert.equal(FUJI_EXPLAINER.chainId, 43113);
assert.match(WALLET_GUIDANCE.body, /MetaMask|Core/);
assert.equal(WALLET_GUIDANCE.steps.length >= 4, true);
assert.deepEqual(
  FIRST_TIME_FLOW.map((step) => step.id),
  ["account", "quiz", "puzzle", "wallet", "mint"]
);

for (const key of ["restoring", "noQuizzes", "noPoints", "noPieces", "noCredential", "noLookup", "noAttempts"]) {
  assert.ok(EMPTY_STATES[key].title);
  assert.ok(EMPTY_STATES[key].body);
}

for (const key of ["wallet", "network", "quiz", "puzzle", "mint"]) {
  assert.ok(ERROR_STATES[key].title);
  assert.ok(ERROR_STATES[key].body);
}

const beforeAccount = firstRunStatus({});
assert.equal(beforeAccount.find((s) => s.id === "account").done, false);
assert.equal(beforeAccount.find((s) => s.id === "wallet").done, false);

const midLoop = firstRunStatus({
  isAuthenticated: true,
  isConnected: false,
  isFuji: false,
  walletSkipped: true,
  completedSections: ["easy"],
  acquiredPieces: [0],
  hasMinted: false,
});
assert.equal(midLoop.find((s) => s.id === "account").done, true);
assert.equal(midLoop.find((s) => s.id === "quiz").done, true);
assert.equal(midLoop.find((s) => s.id === "puzzle").done, true);
assert.equal(midLoop.find((s) => s.id === "wallet").done, true);
assert.equal(midLoop.find((s) => s.id === "mint").done, false);

const address = "0x7c538b83D0295f94C4bBAf8302095d9ED4b2Ad5f";
assert.equal(onboardingStorageKey(address), `skillforge.onboarding.v1.${address.toLowerCase()}`);
const memory = new Map();
const storage = {
  getItem: (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => memory.set(key, String(value)),
};
assert.equal(isFirstRunGuideDismissed(address, storage), false);
assert.equal(dismissFirstRunGuide(address, storage), true);
assert.equal(isFirstRunGuideDismissed(address, storage), true);

console.log("onboarding copy and first-run tests passed");
