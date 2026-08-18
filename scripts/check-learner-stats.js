import assert from "node:assert/strict";
import { MAX_POINTS, TOTAL_PIECES } from "../src/data/questions.js";
import { computeLearnerDashboard, sectionCompletion, shortAddress } from "../src/utils/learnerStats.js";

assert.equal(shortAddress(""), "");
assert.equal(shortAddress("0xabc"), "0xabc");
assert.equal(
  shortAddress("0x1234567890abcdef1234567890abcdef12345678"),
  "0x1234...5678"
);

const fresh = computeLearnerDashboard();
assert.equal(fresh.isNewLearner, true);
assert.equal(fresh.overallPercent, 0);
assert.equal(fresh.quizCorrect, 0);
assert.equal(fresh.quizTotal, 15);
assert.equal(fresh.puzzleCount, 0);
assert.equal(fresh.puzzleTotal, TOTAL_PIECES);
assert.equal(fresh.totalPoints, 0);
assert.equal(fresh.remainingPoints, 0);
assert.equal(fresh.spentPoints, 0);
assert.equal(fresh.attemptCount, 0);
assert.equal(fresh.accuracy, 0);
assert.deepEqual(fresh.attemptsBySection, { easy: 0, medium: 0, hard: 0 });
assert.equal(fresh.difficulties.every((row) => !row.attempted && row.percent === 0), true);

const easy = sectionCompletion({ easy: { correct: 5, pointsEarned: 15 } }, "easy");
assert.equal(easy.complete, true);
assert.equal(easy.percent, 100);
assert.equal(easy.pointsEarned, 15);

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
assert.equal(mixed.puzzlePercent, 25);
assert.equal(mixed.overallPercent, Math.round((100 + 40 + 0 + 25) / 4));
assert.equal(mixed.overallPercent, 41);
assert.equal(mixed.totalPoints, 25);
assert.equal(mixed.maxPoints, MAX_POINTS);
assert.equal(mixed.spentPoints, 20);
assert.equal(mixed.remainingPoints, 5);
assert.equal(mixed.attemptCount, 3);
assert.equal(mixed.attemptsBySection.easy, 2);
assert.equal(mixed.attemptsBySection.medium, 1);
assert.equal(mixed.attemptsBySection.hard, 0);
assert.equal(mixed.accuracy, 73);

console.log("learner dashboard stats tests passed");
