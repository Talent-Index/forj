import assert from "node:assert/strict";
import { applySectionResult, recomputeTotalPoints } from "../src/utils/progress.js";

const first = applySectionResult({}, {
  sectionId: "easy",
  correct: 4,
  total: 5,
  pointsEarned: 12,
});

assert.equal(first.totalPoints, 12);

const retryWorse = applySectionResult(first.sectionScores, {
  sectionId: "easy",
  correct: 2,
  total: 5,
  pointsEarned: 6,
});

assert.equal(retryWorse.totalPoints, 6, "retry should replace, not stack, section points");

const withMedium = applySectionResult(retryWorse.sectionScores, {
  sectionId: "medium",
  correct: 3,
  total: 5,
  pointsEarned: 15,
});

assert.equal(withMedium.totalPoints, 21);
assert.equal(recomputeTotalPoints(withMedium.sectionScores), 21);

console.log("retry math smoke test passed");
