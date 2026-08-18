import assert from "node:assert/strict";
import { getSectionById, sections } from "../src/data/questions.js";
import {
  POST_SUBMIT_KEYS,
  QUESTIONS_PER_QUIZ,
  findQuestionById,
  getAnswerFeedback,
  getQuestionBankStatus,
  getValidQuestions,
  hintRevealsAnswer,
  isLearnerQuestion,
  isValidQuestion,
  isValidReference,
  selectQuizQuestions,
  shuffle,
  toLearnerQuestion,
} from "../src/utils/quiz.js";

const TEST_REFERENCE = {
  title: "Avalanche Primary Network",
  url: "https://build.avax.network/docs/primary-network",
};

function q(id, extra = {}) {
  return {
    id,
    question: `Question ${id}?`,
    options: ["A", "B", "C", "D"],
    answer: "A",
    explanation: "A is correct because this test explanation is long enough to teach.",
    reference: TEST_REFERENCE,
    hint: "Think about the first letter.",
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

function assertNoSpoilers(question) {
  for (const key of POST_SUBMIT_KEYS) {
    assert.equal(question[key], undefined, `${question.id || question.question} leaked ${key} before submit`);
  }
}

function assertQuiz(result, sectionId) {
  assert.equal(result.ok, true, result.error);
  assert.equal(result.questions.length, QUESTIONS_PER_QUIZ);
  const ids = result.questions.map((question) => question.id);
  assert.equal(new Set(ids).size, QUESTIONS_PER_QUIZ, "duplicate question in quiz");
  for (const question of result.questions) {
    assert.equal(question.sectionId, sectionId);
    assert.equal(isLearnerQuestion(question), true);
    assert.equal(isValidQuestion(question), false);
    assertNoSpoilers(question);
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

assert.equal(isValidQuestion(q("spoiler", { hint: "The answer is A because A is first." })), true);
assert.equal(
  isValidQuestion(q("spoiler-long", {
    answer: "Correct choice",
    options: ["Correct choice", "B", "C", "D"],
    hint: "Pick correct choice every time.",
  })),
  false
);
assert.equal(hintRevealsAnswer(q("ok-hint")), false);

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

const sample = q("score-me");
const learner = toLearnerQuestion(sample, "easy");
assert.equal(isLearnerQuestion(learner), true);
assertNoSpoilers(learner);
assert.equal(getAnswerFeedback(learner, "A"), null);

const correct = getAnswerFeedback(sample, "A");
assert.equal(correct.isCorrect, true);
assert.equal(correct.timedOut, false);
assert.match(correct.explanation, /test explanation/i);
assert.equal(isValidReference(correct.reference), true);

const wrong = getAnswerFeedback(sample, "B");
assert.equal(wrong.isCorrect, false);
assert.equal(wrong.answer, "A");
assert.equal(wrong.selected, "B");

const timedOut = getAnswerFeedback(sample, null);
assert.equal(timedOut.isCorrect, false);
assert.equal(timedOut.timedOut, true);

for (const sectionId of ["easy", "medium", "hard"]) {
  const section = getSectionById(sectionId);
  const bank = getQuestionBankStatus(section);
  assert.equal(bank.ok, true, `${sectionId} bank too small`);
  assert.ok(bank.size >= QUESTIONS_PER_QUIZ, `${sectionId} needs at least ${QUESTIONS_PER_QUIZ} questions`);
  assert.equal(section.questions.length, bank.size, `${sectionId} has questions missing explanations or references`);

  for (const question of section.questions) {
    assert.equal(isValidQuestion(question), true, `${question.id} is not a complete teachable question`);
    assert.equal(hintRevealsAnswer(question), false, `${question.id} hint reveals the answer`);
    assert.ok(question.explanation.length >= 24, `${question.id} needs a fuller explanation`);
    assert.equal(isValidReference(question.reference), true, `${question.id} needs an official Avalanche reference`);
  }

  const first = selectQuizQuestions(section, { random: () => 0 });
  const second = selectQuizQuestions(section, { random: () => 0.999 });
  assertQuiz(first, sectionId);
  assertQuiz(second, sectionId);

  const allowed = new Set(section.questions.map((question) => question.id));
  for (const question of [...first.questions, ...second.questions]) {
    assert.ok(allowed.has(question.id), `${question.id} leaked out of ${sectionId}`);
    const source = findQuestionById(section, question.id);
    const feedback = getAnswerFeedback(source, question.options[1]);
    assert.ok(feedback, `${question.id} has no post-submit feedback`);
    assert.equal(feedback.explanation, source.explanation.trim());
    assert.equal(feedback.reference.url, source.reference.url);
  }
}

assert.deepEqual(sections.map((section) => section.id), ["easy", "medium", "hard"]);
console.log("quiz selection tests passed");
