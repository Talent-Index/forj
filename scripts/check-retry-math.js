import assert from "node:assert/strict";
import { getSectionById } from "../src/data/questions.js";
import { QUESTIONS_PER_QUIZ } from "../src/utils/quiz.js";
import {
  SCORE_SECTIONS,
  applyAttemptHistory,
  applySectionResult,
  normalizeSectionResult,
  recomputeTotalPoints,
} from "../src/utils/progress.js";

function result(sectionId, correct) {
  const section = getSectionById(sectionId);
  return {
    sectionId,
    correct,
    total: QUESTIONS_PER_QUIZ,
    pointsEarned: correct * section.pointsPerQuestion,
    wrong: QUESTIONS_PER_QUIZ - correct,
  };
}

function assertInvariant(state, message) {
  assert.equal(
    state.totalPoints,
    recomputeTotalPoints(state.sectionScores),
    message || "total points must equal the sum of current section scores"
  );
}

assert.deepEqual(SCORE_SECTIONS, ["easy", "medium", "hard"]);

const first = applySectionResult({}, result("easy", 4));
assert.equal(first.sectionScores.easy.pointsEarned, 12);
assert.equal(first.totalPoints, 12);
assertInvariant(first, "first attempt");

const successfulRetry = applySectionResult(first.sectionScores, result("easy", 5));
assert.equal(successfulRetry.sectionScores.easy.correct, 5);
assert.equal(successfulRetry.sectionScores.easy.pointsEarned, 15);
assert.equal(successfulRetry.totalPoints, 15);
assert.notEqual(successfulRetry.totalPoints, 12 + 15, "successful retry must not stack");
assertInvariant(successfulRetry, "successful retry");

const lowerRetry = applySectionResult(successfulRetry.sectionScores, result("easy", 2));
assert.equal(lowerRetry.sectionScores.easy.pointsEarned, 6);
assert.equal(lowerRetry.totalPoints, 6);
assertInvariant(lowerRetry, "lower-scoring retry");

const perfect = applySectionResult(lowerRetry.sectionScores, result("easy", 5));
const perfectAgain = applySectionResult(perfect.sectionScores, result("easy", 5));
assert.equal(perfect.totalPoints, 15);
assert.equal(perfectAgain.totalPoints, 15);
assert.equal(perfectAgain.sectionScores.easy.pointsEarned, 15);
assertInvariant(perfectAgain, "perfect-score retry");

let multi = applySectionResult({}, result("easy", 3));
multi = applySectionResult(multi.sectionScores, result("medium", 4));
multi = applySectionResult(multi.sectionScores, result("hard", 1));
assert.equal(multi.totalPoints, 9 + 20 + 8);
assertInvariant(multi, "three sections first pass");

multi = applySectionResult(multi.sectionScores, result("medium", 2));
multi = applySectionResult(multi.sectionScores, result("easy", 5));
multi = applySectionResult(multi.sectionScores, result("medium", 5));
multi = applySectionResult(multi.sectionScores, result("hard", 0));
assert.equal(multi.sectionScores.easy.pointsEarned, 15);
assert.equal(multi.sectionScores.medium.pointsEarned, 25);
assert.equal(multi.sectionScores.hard.pointsEarned, 0);
assert.equal(multi.totalPoints, 40);
assertInvariant(multi, "multiple retries across sections");

const ignored = applySectionResult(multi.sectionScores, {
  sectionId: "bonus",
  correct: 5,
  total: 5,
  pointsEarned: 999,
});
assert.equal(ignored.totalPoints, multi.totalPoints);
assert.equal(ignored.sectionScores.bonus, undefined);

const stackedAttempts = [
  result("easy", 4),
  result("easy", 5),
  result("easy", 2),
];
const fromHistory = applyAttemptHistory(stackedAttempts);
assert.equal(fromHistory.totalPoints, 6);
assert.equal(fromHistory.sectionScores.easy.correct, 2);
assert.notEqual(fromHistory.totalPoints, 12 + 15 + 6, "history reduce must keep latest score only");

const inflated = applySectionResult({}, {
  sectionId: "easy",
  correct: 2,
  total: 5,
  pointsEarned: 999,
});
assert.equal(inflated.sectionScores.easy.pointsEarned, 6);
assert.equal(inflated.totalPoints, 6);

assert.equal(normalizeSectionResult({ sectionId: "unknown", correct: 5 }), null);

console.log("retry scoring regression tests passed");
