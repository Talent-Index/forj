import assert from "node:assert/strict";
import { PIECE_COST, TOTAL_PIECES } from "../src/data/questions.js";
import {
  availablePoints,
  redeemPiece,
  spentPointsFor,
} from "../src/utils/puzzle.js";
import {
  createMemoryStorage,
  createProgressStore,
} from "../src/utils/progress.js";

assert.equal(PIECE_COST, 5);
assert.equal(TOTAL_PIECES, 16);

let state = { totalPoints: 12, acquiredPieces: [] };
assert.equal(availablePoints(state.totalPoints, state.acquiredPieces), 12);

const first = redeemPiece(state, 0);
assert.equal(first.ok, true);
assert.deepEqual(first.acquiredPieces, [0]);
assert.equal(first.spentPoints, 5);
assert.equal(first.available, 7);
state = { totalPoints: 12, acquiredPieces: first.acquiredPieces };

const duplicate = redeemPiece(state, 0);
assert.equal(duplicate.ok, false);
assert.deepEqual(duplicate.acquiredPieces, [0]);
assert.equal(duplicate.spentPoints, 5);

const second = redeemPiece(state, 3);
assert.equal(second.ok, true);
assert.deepEqual(second.acquiredPieces, [0, 3]);
assert.equal(second.spentPoints, 10);
state = { totalPoints: 12, acquiredPieces: second.acquiredPieces };

const third = redeemPiece(state, 7);
assert.equal(third.ok, false);
assert.match(third.error, /Need 5 points/);
assert.deepEqual(third.acquiredPieces, [0, 3]);
assert.equal(third.available, 2);
assert.ok(third.available >= 0);

const invalid = redeemPiece(state, -1);
assert.equal(invalid.ok, false);
assert.equal(redeemPiece(state, 99).ok, false);

const broke = redeemPiece({ totalPoints: 0, acquiredPieces: [] }, 1);
assert.equal(broke.ok, false);
assert.equal(broke.spentPoints, 0);

let burst = { totalPoints: 5, acquiredPieces: [] };
const firstBurst = redeemPiece(burst, 1);
burst = { totalPoints: 5, acquiredPieces: firstBurst.acquiredPieces };
const secondBurst = redeemPiece(burst, 2);
assert.equal(firstBurst.ok, true);
assert.equal(secondBurst.ok, false);
assert.deepEqual(secondBurst.acquiredPieces, [1]);

const wallet = `0x${"c".repeat(40)}`;
const storage = createMemoryStorage();
const store = createProgressStore(storage);
store.save(wallet, {
  totalPoints: 12,
  sectionScores: { easy: { correct: 4, total: 5, pointsEarned: 12 } },
  acquiredPieces: second.acquiredPieces,
  view: "puzzle",
});
const restored = store.load(wallet);
assert.deepEqual(restored.acquiredPieces, [0, 3]);
assert.equal(restored.spentPoints, spentPointsFor([0, 3]));
assert.equal(restored.totalPoints, 12);
assert.equal(availablePoints(restored.totalPoints, restored.acquiredPieces), 2);

console.log("puzzle redemption tests passed");
