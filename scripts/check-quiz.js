import assert from "node:assert/strict";
import { getSectionById, sections } from "../src/data/questions.js";
import {
  QUESTIONS_PER_QUIZ,
  getQuestionBankStatus,
  getValidQuestions,
  isValidQuestion,
  selectQuizQuestions,
  shuffle,
} from "../src/utils/quiz.js";

function q(id, extra = {}) {
  return {
    id,
    question: `Question ${id}?`,
    options: ["A", "B", "C", "D"],
    answer: "A",
    ...extra,
  };
}

function sequenceRandom(values) {
  let index = 0;
  return () => {
    if (index >= values.length) throw new Error("mocked random exhausted");
    const value = values[index];
    index += 1;
    return value;
  };
}

function assertQuiz(result, sectionId) {
  assert.equal(result.ok, true, result.error);
  assert.equal(result.questions.length, QUESTIONS_PER_QUIZ);
  const ids = result.questions.map((question) => question.id);
  assert.equal(new Set(ids).size, QUESTIONS_PER_QUIZ, "duplicate question in quiz");
  for (const question of result.questions) {
    assert.equal(question.sectionId, sectionId);
    assert.equal(isValidQuestion(question), true);
  }
}

const tinySection = {
  id: "easy",
  name: "Easy",
  questions: [q("e1"), q("e2"), q("e3"), q("e4")],
};
const shortBank = getQuestionBankStatus(tinySection);
assert.equal(shortBank.ok, false);
assert.equal(shortBank.size, 4);
assert.equal(selectQuizQuestions(tinySection).ok, false);
assert.deepEqual(selectQuizQuestions(tinySection).questions, []);

const invalidHeavy = {
  id: "easy",
  name: "Easy",
  questions: [
    q("e1"),
    { id: "bad-answer", question: "Bad?", options: ["A", "B"], answer: "Z" },
    q("e1"),
    q("e2"),
    q("e3"),
    q("e4"),
    { question: "", options: ["A", "B"], answer: "A" },
  ],
};
assert.deepEqual(getValidQuestions(invalidHeavy.questions).map((item) => item.id), ["e1", "e2", "e3", "e4"]);
assert.equal(selectQuizQuestions(invalidHeavy).ok, false);

const eight = {
  id: "easy",
  name: "Easy",
  questions: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8"].map((id) => q(id)),
};

const reversed = selectQuizQuestions(eight, { random: () => 0 });
assertQuiz(reversed, "easy");
assert.deepEqual(reversed.questions.map((item) => item.id), ["e2", "e3", "e4", "e5", "e6"]);

const identity = selectQuizQuestions(eight, { random: () => 0.999 });
assertQuiz(identity, "easy");
assert.deepEqual(identity.questions.map((item) => item.id), ["e1", "e2", "e3", "e4", "e5"]);

const shuffled = shuffle(["a", "b", "c"], sequenceRandom([0.9, 0]));
assert.deepEqual(shuffled, ["b", "a", "c"]);

assert.throws(() => selectQuizQuestions(eight, { random: () => 1 }), /\[0, 1\)/);
assert.equal(selectQuizQuestions(null).ok, false);

for (const sectionId of ["easy", "medium", "hard"]) {
  const section = getSectionById(sectionId);
  const bank = getQuestionBankStatus(section);
  assert.equal(bank.ok, true, `${sectionId} bank too small`);
  assert.ok(bank.size >= QUESTIONS_PER_QUIZ, `${sectionId} needs at least ${QUESTIONS_PER_QUIZ} questions`);

  const first = selectQuizQuestions(section, { random: () => 0 });
  const second = selectQuizQuestions(section, { random: () => 0.999 });
  assertQuiz(first, sectionId);
  assertQuiz(second, sectionId);

  const allowed = new Set(section.questions.map((question) => question.id));
  for (const question of [...first.questions, ...second.questions]) {
    assert.ok(allowed.has(question.id), `${question.id} leaked out of ${sectionId}`);
  }
}

assert.deepEqual(sections.map((section) => section.id), ["easy", "medium", "hard"]);
console.log("quiz selection tests passed");
