export const QUESTIONS_PER_QUIZ = 5;

export const POST_SUBMIT_KEYS = ["answer", "explanation", "funFact", "reference"];

const OFFICIAL_REFERENCE_HOSTS = new Set([
  "build.avax.network",
  "docs.avax.network",
  "www.avax.network",
  "avax.network",
  "academy.avax.network",
]);

function isNonEmptyString(value, minLength = 1) {
  return typeof value === "string" && value.trim().length >= minLength;
}

export function isValidReference(reference) {
  if (!reference || typeof reference !== "object") return false;
  if (!isNonEmptyString(reference.title)) return false;
  if (!isNonEmptyString(reference.url)) return false;
  try {
    const url = new URL(reference.url);
    return url.protocol === "https:" && OFFICIAL_REFERENCE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function hintRevealsAnswer(question) {
  const hint = typeof question?.hint === "string" ? question.hint.trim().toLowerCase() : "";
  const answer = typeof question?.answer === "string" ? question.answer.trim().toLowerCase() : "";
  if (!hint || answer.length < 6) return false;
  return hint.includes(answer);
}

export function isValidQuestion(question) {
  if (!question || typeof question !== "object") return false;
  if (!isNonEmptyString(question.question)) return false;
  if (!Array.isArray(question.options) || question.options.length < 2) return false;
  if (!question.options.every((option) => isNonEmptyString(option))) return false;
  if (!question.options.includes(question.answer)) return false;
  if (!isNonEmptyString(question.explanation, 24)) return false;
  if (!isValidReference(question.reference)) return false;
  if (hintRevealsAnswer(question)) return false;
  const id = question.id;
  if (id != null && !isNonEmptyString(id)) return false;
  return true;
}

export function isLearnerQuestion(question) {
  if (!question || typeof question !== "object") return false;
  if (!isNonEmptyString(question.question)) return false;
  if (!Array.isArray(question.options) || question.options.length < 2) return false;
  if (!question.options.every((option) => isNonEmptyString(option))) return false;
  if (question.hint != null && typeof question.hint !== "string") return false;
  for (const key of POST_SUBMIT_KEYS) {
    if (question[key] != null) return false;
  }
  return true;
}

export function toLearnerQuestion(question, sectionId) {
  return {
    id: question.id,
    question: question.question,
    options: question.options.slice(),
    hint: typeof question.hint === "string" ? question.hint : "",
    sectionId: sectionId ?? question.sectionId ?? null,
  };
}

export function findQuestionById(section, id) {
  if (!section || id == null) return null;
  return (section.questions || []).find((question) => question.id === id) || null;
}

export function getAnswerFeedback(bankQuestion, selectedOption) {
  if (!isValidQuestion(bankQuestion)) return null;
  const selected = selectedOption ?? null;
  return {
    isCorrect: selected === bankQuestion.answer,
    timedOut: selected == null,
    selected,
    answer: bankQuestion.answer,
    explanation: bankQuestion.explanation.trim(),
    reference: bankQuestion.reference,
    funFact: isNonEmptyString(bankQuestion.funFact) ? bankQuestion.funFact.trim() : null,
  };
}

export function quizProgress({ current = 0, answered = false, total = QUESTIONS_PER_QUIZ } = {}) {
  const safeTotal = Math.max(0, toNonNegativeInt(total));
  const index = Math.max(0, toNonNegativeInt(current));
  const currentNumber = safeTotal === 0 ? 0 : Math.min(index + 1, safeTotal);
  const completed = safeTotal === 0 ? 0 : Math.min(safeTotal, index + (answered ? 1 : 0));
  return {
    currentNumber,
    total: safeTotal,
    completed,
    remaining: Math.max(0, safeTotal - completed),
    percent: safeTotal === 0 ? 0 : (completed / safeTotal) * 100,
    label: `Question ${currentNumber} of ${safeTotal}`,
  };
}

function toNonNegativeInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export function summarizeAttempt(log, pointsPerQuestion, total = QUESTIONS_PER_QUIZ) {
  const entries = Array.isArray(log) ? log : [];
  const correct = entries.filter((item) => item.correct).length;
  const timedOut = entries.filter((item) => item.timedOut).length;
  const incorrect = entries.filter((item) => !item.correct && !item.timedOut).length;
  const perQuestion = toNonNegativeInt(pointsPerQuestion);
  const safeTotal = Math.max(1, toNonNegativeInt(total) || QUESTIONS_PER_QUIZ);
  return {
    correct,
    incorrect,
    timedOut,
    wrong: incorrect + timedOut,
    total: toNonNegativeInt(total) || QUESTIONS_PER_QUIZ,
    pointsEarned: correct * perQuestion,
    percent: Math.round((correct / safeTotal) * 100),
  };
}

export function canAcceptSubmit({ answered = false, locked = false, selected = null } = {}) {
  return !answered && !locked && selected != null;
}

export function getValidQuestions(pool) {
  const seen = new Set();
  const valid = [];
  for (const question of pool || []) {
    if (!isValidQuestion(question)) continue;
    const key = question.id || question.question.trim();
    if (seen.has(key)) continue;
    seen.add(key);
    valid.push(question);
  }
  return valid;
}

export function getQuestionBankStatus(section, count = QUESTIONS_PER_QUIZ) {
  if (!section) {
    return {
      ok: false,
      size: 0,
      needed: count,
      error: "Unknown difficulty. Choose Easy, Medium, or Hard.",
    };
  }
  const size = getValidQuestions(section.questions).length;
  if (size < count) {
    return {
      ok: false,
      size,
      needed: count,
      error: `${section.name} needs at least ${count} unique questions (found ${size}).`,
    };
  }
  return { ok: true, size, needed: count, error: null };
}

function nextUnitInterval(random) {
  const value = random();
  if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value >= 1) {
    throw new Error("random() must return a number in [0, 1)");
  }
  return value;
}

export function shuffle(items, random = Math.random) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextUnitInterval(random) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function selectQuizQuestions(section, options = {}) {
  const count = options.count ?? QUESTIONS_PER_QUIZ;
  const random = options.random ?? Math.random;
  const bank = getQuestionBankStatus(section, count);
  if (!bank.ok) {
    return { ok: false, error: bank.error, questions: [] };
  }

  const selected = shuffle(getValidQuestions(section.questions), random).slice(0, count);
  const ids = selected.map((question) => question.id || question.question);
  if (new Set(ids).size !== count || selected.length !== count) {
    return {
      ok: false,
      error: `Could not build a ${count}-question ${section.name} quiz without duplicates.`,
      questions: [],
    };
  }

  return {
    ok: true,
    error: null,
    questions: selected.map((question) => toLearnerQuestion(question, section.id)),
  };
}
