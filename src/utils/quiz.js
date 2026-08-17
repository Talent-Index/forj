export const QUESTIONS_PER_QUIZ = 5;

export function isValidQuestion(question) {
  if (!question || typeof question !== "object") return false;
  if (typeof question.question !== "string" || question.question.trim().length === 0) return false;
  if (!Array.isArray(question.options) || question.options.length < 2) return false;
  if (!question.options.every((option) => typeof option === "string" && option.trim().length > 0)) {
    return false;
  }
  if (!question.options.includes(question.answer)) return false;
  const id = question.id;
  if (id != null && (typeof id !== "string" || id.trim().length === 0)) return false;
  return true;
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
    questions: selected.map((question) => ({
      ...question,
      sectionId: section.id,
    })),
  };
}
