import assert from "node:assert/strict";
import {
  JIGSAW_BOARD,
  jigsawPath,
  jigsawPieces,
  pieceEdgeSign,
  pieceState,
} from "../src/utils/jigsaw.js";
import { PUZZLE_SIZE, TOTAL_PIECES } from "../src/data/questions.js";
import {
  RECIPIENT_MAX,
  normalizeRecipientName,
  validateRecipientName,
} from "../src/utils/recipient.js";
import { highestDifficulty, quizPercent, sectionScoresFromCredential } from "../src/utils/certificateView.js";
import {
  createMemoryStorage,
  createProgressStore,
} from "../src/utils/progress.js";

assert.equal(jigsawPieces().length, TOTAL_PIECES);
assert.equal(new Set(jigsawPieces().map((piece) => piece.d)).size, TOTAL_PIECES);
assert.equal(JIGSAW_BOARD, PUZZLE_SIZE * 100);

for (let row = 0; row < PUZZLE_SIZE; row += 1) {
  for (let col = 0; col < PUZZLE_SIZE - 1; col += 1) {
    assert.equal(
      pieceEdgeSign(row, col, "right") + pieceEdgeSign(row, col + 1, "left"),
      0
    );
  }
}
for (let col = 0; col < PUZZLE_SIZE; col += 1) {
  for (let row = 0; row < PUZZLE_SIZE - 1; row += 1) {
    assert.equal(
      pieceEdgeSign(row, col, "bottom") + pieceEdgeSign(row + 1, col, "top"),
      0
    );
  }
}
assert.equal(pieceEdgeSign(0, 0, "top"), 0);
assert.equal(pieceEdgeSign(0, 0, "left"), 0);
assert.equal(pieceEdgeSign(3, 3, "right"), 0);
assert.equal(pieceEdgeSign(3, 3, "bottom"), 0);
assert.match(jigsawPath(0), /^M /);
assert.match(jigsawPath(0), /Z$/);

assert.equal(pieceState({ acquired: false, canAfford: false, complete: false }), "locked");
assert.equal(pieceState({ acquired: false, canAfford: true, complete: false }), "available");
assert.equal(pieceState({ acquired: true, canAfford: true, complete: false }), "unlocked");
assert.equal(pieceState({ acquired: true, canAfford: true, complete: true }), "completed");

assert.equal(normalizeRecipientName("  Alex   Mwangi  "), "Alex Mwangi");
assert.equal(validateRecipientName("").ok, false);
assert.equal(validateRecipientName("   ").ok, false);
assert.equal(validateRecipientName("A").ok, false);
assert.equal(validateRecipientName("Alex Mwangi").ok, true);
assert.equal(validateRecipientName("Alex Mwangi").name, "Alex Mwangi");
assert.equal(validateRecipientName("o'neil").name, "o'neil");
assert.equal(validateRecipientName("https://evil.example").ok, false);
assert.equal(validateRecipientName("<script>").ok, false);
assert.equal(validateRecipientName("A".repeat(RECIPIENT_MAX + 1)).ok, false);
assert.equal(quizPercent({ easy: { correct: 5 }, medium: { correct: 4 }, hard: { correct: 3 } }), 80);
assert.equal(highestDifficulty({ easy: { correct: 5 }, hard: { correct: 5 } }), "Hard");
assert.equal(highestDifficulty({ easy: { correct: 5 } }), "Easy");
assert.deepEqual(
  sectionScoresFromCredential({
    difficulty: { easy: { correct: 5 }, medium: { correct: 2 }, hard: { correct: 0 } },
  }),
  { easy: { correct: 5 }, medium: { correct: 2 }, hard: { correct: 0 } }
);
assert.deepEqual(sectionScoresFromCredential(null), {});

const wallet = `0x${"d".repeat(40)}`;
const store = createProgressStore(createMemoryStorage());
store.save(wallet, {
  sectionScores: { easy: { correct: 5, total: 5, pointsEarned: 15 } },
  acquiredPieces: [0, 1],
  recipientName: "  Alex Mwangi  ",
});
const loaded = store.load(wallet);
assert.equal(loaded.recipientName, "Alex Mwangi");
store.save(wallet, { recipientName: "<nope>" });
assert.equal(store.load(wallet).recipientName, "");

console.log("jigsaw certificate tests passed");
