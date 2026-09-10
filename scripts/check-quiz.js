import assert from "node:assert/strict";
import { QUESTION_TOPICS, getSectionById, sections } from "../src/data/questions.js";
import {
  POST_SUBMIT_KEYS,
  quizLengthFor,
  canAcceptSubmit,
  findQuestionById,
  getAnswerFeedback,
  getQuestionBankStatus,
  getValidQuestions,
  hintRevealsAnswer,
  isLearnerQuestion,
  isValidQuestion,
  isValidReference,
  quizProgress,
  selectQuizQuestions,
  shuffle,
  summarizeAttempt,
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
    topic: "fundamentals",
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

function assertQuiz(result, sectionId, count = quizLengthFor(sectionId)) {
  assert.equal(result.ok, true, result.error);
  assert.equal(result.questions.length, count);
  const ids = result.questions.map((question) => question.id);
  assert.equal(new Set(ids).size, count, "duplicate question in quiz");
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
const shortBank = getQuestionBankStatus(tinySection, 5);
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
assertQuiz(reversed, "easy", 5);
assert.equal(reversed.questions.length, 5);

const identity = selectQuizQuestions(eight, { random: () => 0.999 });
assertQuiz(identity, "easy", 5);
assert.equal(identity.questions.length, 5);

const avoidSeen = selectQuizQuestions(eight, {
  random: () => 0.5,
  seenIds: ["e1", "e2"],
});
assertQuiz(avoidSeen, "easy", 5);
for (const question of avoidSeen.questions) {
  assert.equal(["e1", "e2"].includes(question.id), false);
}

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

for (const sectionId of ["easy", "medium", "hard", "master"]) {
  const section = getSectionById(sectionId);
  const count = quizLengthFor(sectionId);
  const bank = getQuestionBankStatus(section, count);
  assert.equal(bank.ok, true, `${sectionId} bank too small`);
  assert.ok(bank.size >= 100, `${sectionId} should expose an expanded bank (found ${bank.size})`);
  assert.ok(bank.size >= count, `${sectionId} needs at least ${count} questions`);
  assert.equal(section.questions.length, bank.size, `${sectionId} has questions missing explanations or references`);

  const topics = new Set(section.questions.map((question) => question.topic));
  for (const topic of QUESTION_TOPICS) {
    assert.ok(topics.has(topic), `${sectionId} is missing topic ${topic}`);
  }

  for (const question of section.questions) {
    assert.equal(isValidQuestion(question), true, `${question.id} is not a complete teachable question`);
    assert.ok(QUESTION_TOPICS.includes(question.topic), `${question.id} has unknown topic ${question.topic}`);
    assert.equal(hintRevealsAnswer(question), false, `${question.id} hint reveals the answer`);
    assert.ok(question.explanation.length >= 24, `${question.id} needs a fuller explanation`);
    assert.equal(isValidReference(question.reference), true, `${question.id} needs an official Avalanche reference`);
  }

  const first = selectQuizQuestions(section, { random: () => 0, count });
  const second = selectQuizQuestions(section, { random: () => 0.999, count });
  assertQuiz(first, sectionId, count);
  assertQuiz(second, sectionId, count);

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

assert.deepEqual(sections.map((section) => section.id), ["easy", "medium", "hard", "master"]);

function normalizeText(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const allQuestions = sections.flatMap((section) => section.questions.map((question) => ({ sectionId: section.id, question })));
const ids = allQuestions.map((item) => item.question.id);
assert.equal(new Set(ids).size, ids.length, "duplicate question id across banks");

const prompts = allQuestions.map((item) => normalizeText(item.question.question));
assert.equal(new Set(prompts).size, prompts.length, "duplicate question text across banks");
assert.ok(allQuestions.length >= 800, `expected 800+ questions, found ${allQuestions.length}`);

for (const { sectionId, question } of allQuestions) {
  assert.equal(question.options.length, 4, `${question.id} must have exactly 4 options`);
  const optionKeys = question.options.map(normalizeText);
  assert.equal(new Set(optionKeys).size, 4, `${question.id} has duplicate options`);
  assert.equal(optionKeys.filter((option) => option === normalizeText(question.answer)).length, 1, `${question.id} must have exactly one matching correct option`);
  assert.ok(question.explanation.trim().length >= 80, `${question.id} explanation is too thin`);
  assert.equal(question.reference.url.startsWith("https://"), true, `${question.id} reference must be https`);
  assert.ok(!hintRevealsAnswer(question), `${question.id} hint spoils the answer`);
  assert.ok(QUESTION_TOPICS.includes(question.topic), `${question.id} topic`);
  const prompt = normalizeText(question.question);
  for (const option of optionKeys) {
    assert.ok(option.length > 0, `${question.id} has an empty option`);
  }
  assert.ok(prompt.length >= 12, `${question.id} prompt is too short`);
  void sectionId;
}

const start = quizProgress({ current: 0, answered: false, total: 5 });
assert.equal(start.label, "Question 1 of 5");
assert.equal(start.completed, 0);
assert.equal(start.remaining, 5);
assert.equal(start.percent, 0);

const afterFirst = quizProgress({ current: 0, answered: true, total: 5 });
assert.equal(afterFirst.label, "Question 1 of 5");
assert.equal(afterFirst.completed, 1);
assert.equal(afterFirst.percent, 20);

const lastDone = quizProgress({ current: 4, answered: true, total: 5 });
assert.equal(lastDone.label, "Question 5 of 5");
assert.equal(lastDone.completed, 5);
assert.equal(lastDone.percent, 100);

assert.equal(canAcceptSubmit({ answered: false, locked: false, selected: "A" }), true);
assert.equal(canAcceptSubmit({ answered: false, locked: false, selected: null }), false);
assert.equal(canAcceptSubmit({ answered: false, locked: true, selected: "A" }), false);
assert.equal(canAcceptSubmit({ answered: true, locked: false, selected: "A" }), false);

let locked = false;
function trySubmit(selected) {
  if (!canAcceptSubmit({ answered: false, locked, selected })) return "ignored";
  locked = true;
  return "scored";
}
assert.equal(trySubmit("A"), "scored");
assert.equal(trySubmit("B"), "ignored");

const summary = summarizeAttempt(
  [
    { correct: true, timedOut: false },
    { correct: false, timedOut: false },
    { correct: false, timedOut: true },
    { correct: true, timedOut: false },
    { correct: false, timedOut: false },
  ],
  3,
  5
);
assert.equal(summary.correct, 2);
assert.equal(summary.incorrect, 2);
assert.equal(summary.timedOut, 1);
assert.equal(summary.wrong, 3);
assert.equal(summary.pointsEarned, 6);
assert.equal(summary.percent, 40);

const PLACEHOLDER_OPTION = /^(Option\s*\d+|Incorrect distractor\s*\d+|Unrelated non-Avalanche alternative\s*\d+)$/i;
for (const section of sections) {
  for (const question of section.questions || []) {
    assert.ok(Array.isArray(question.options) && question.options.length >= 4, `${question.id} needs 4 options`);
    assert.equal(new Set(question.options).size, question.options.length, `${question.id} has duplicate options`);
    assert.ok(question.options.includes(question.answer), `${question.id} answer missing from options`);
    for (const option of question.options) {
      assert.equal(
        PLACEHOLDER_OPTION.test(String(option).trim()),
        false,
        `${question.id} still has blank placeholder option: ${option}`
      );
    }
  }
}

console.log("quiz selection tests passed");
