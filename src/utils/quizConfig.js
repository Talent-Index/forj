/**
 * Quiz progression config — lengths, forge labels, fragment rewards.
 * Easy/Medium/Hard remain credential score sections; Master is assessment-only.
 */

export const QUIZ_SECTION_ORDER = Object.freeze(["easy", "medium", "hard", "master"]);

/** Sections that seat puzzle pieces and feed the claimed Fuji score snapshot. */
export const CREDENTIAL_SCORE_SECTIONS = Object.freeze(["easy", "medium", "hard"]);

/**
 * Frozen Fuji credential scale: five counted correct answers per difficulty.
 * Live quizzes may be longer; mastery uses full length, seating/mint caps here.
 */
export const CREDENTIAL_SCORE_MAX = 5;

export const QUIZ_LENGTHS = Object.freeze({
  easy: 5,
  medium: 7,
  hard: 10,
  master: 12,
});

/** Default / legacy constant — prefer quizLengthFor(sectionId). */
export const QUESTIONS_PER_QUIZ = QUIZ_LENGTHS.easy;

export const FORGE_LEVEL_META = Object.freeze({
  easy: {
    forgeLabel: "Foundation",
    kicker: "Foundation",
    title: "Avalanche Fundamentals",
    blurb: "Understand the core ideas before you build.",
  },
  medium: {
    forgeLabel: "Builder",
    kicker: "Builder",
    title: "Ecosystem & Architecture",
    blurb: "Apply concepts to practical Avalanche situations.",
  },
  hard: {
    forgeLabel: "Advanced",
    kicker: "Advanced",
    title: "Advanced Avalanche Concepts",
    blurb: "Solve harder problems across architecture and tooling.",
  },
  master: {
    forgeLabel: "Mastery",
    kicker: "Mastery",
    title: "Avalanche Master Assessment",
    blurb: "Demonstrate deep reasoning, security, and systems judgment.",
  },
});

/** Puzzle fragments awarded on first meaningful completion (retries reduced). */
export const FRAGMENT_REWARDS = Object.freeze({
  easy: 1,
  medium: 2,
  hard: 3,
  master: 5,
});

export const FRAGMENTS_PER_PIECE = 5;
export const PERFECT_FRAGMENT_BONUS = 1;
export const RETRY_FRAGMENT_FACTOR = 0;

/** Knowledge-check cadence: after N learning activities (inclusive range). */
export const QUIZ_TRIGGER = Object.freeze({
  minActivities: 2,
  maxActivities: 4,
});

export function quizLengthFor(sectionId) {
  return QUIZ_LENGTHS[sectionId] || QUESTIONS_PER_QUIZ;
}

export function fragmentRewardFor(sectionId, { perfect = false, firstCompletion = true } = {}) {
  if (!firstCompletion) return RETRY_FRAGMENT_FACTOR;
  const base = FRAGMENT_REWARDS[sectionId] ?? 0;
  return base + (perfect ? PERFECT_FRAGMENT_BONUS : 0);
}
