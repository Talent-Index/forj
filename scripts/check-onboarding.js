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
  EMPTY_STATES,
  ERROR_STATES,
  requiredOnboardingTopics,
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

for (const key of ["restoring", "noQuizzes", "noPoints", "noPieces", "noCredential", "noLookup", "noAttempts"]) {
  assert.ok(EMPTY_STATES[key].title);
  assert.ok(EMPTY_STATES[key].body);
}

for (const key of ["wallet", "network", "quiz", "puzzle", "mint"]) {
  assert.ok(ERROR_STATES[key].title);
  assert.ok(ERROR_STATES[key].body);
}

console.log("onboarding copy tests passed");
