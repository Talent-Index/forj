/**
 * Central doodle motion timing (ms) and easing.
 * Signature motion language: DRAW · FORGE · VERIFY
 */

export const doodleTiming = Object.freeze({
  quick: 300,
  standard: 700,
  draw: 1000,
  dramatic: 1800,
  forge: 2200,
  verify: 1600,
  stagger: 140,
  hover: 420,
});

export const doodleEasing = Object.freeze({
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  inOut: "cubic-bezier(0.45, 0, 0.55, 1)",
  linear: "linear",
});

/** Named animation presets → CSS class suffixes + default duration */
export const DOODLE_ANIMATIONS = Object.freeze({
  draw: { className: "is-draw", duration: doodleTiming.draw },
  write: { className: "is-write", duration: doodleTiming.draw },
  underline: { className: "is-underline", duration: doodleTiming.standard },
  wiggle: { className: "is-wiggle", duration: doodleTiming.quick },
  tap: { className: "is-tap", duration: doodleTiming.standard },
  bounce: { className: "is-bounce", duration: doodleTiming.quick },
  assemble: { className: "is-assemble", duration: doodleTiming.dramatic },
  connect: { className: "is-connect", duration: doodleTiming.verify },
  stamp: { className: "is-stamp", duration: doodleTiming.standard },
  spark: { className: "is-spark", duration: doodleTiming.standard },
  pulse: { className: "is-pulse", duration: doodleTiming.standard },
  reveal: { className: "is-reveal", duration: doodleTiming.draw },
  forge: { className: "is-forge", duration: doodleTiming.forge },
  open: { className: "is-open", duration: doodleTiming.standard },
  slide: { className: "is-slide", duration: doodleTiming.standard },
});

export const DOODLE_TRIGGERS = Object.freeze([
  "viewport",
  "hover",
  "click",
  "success",
  "achievement",
  "levelUp",
  "completion",
  "loading",
  "manual",
  "immediate",
]);

/** Multi-stage sequences for signature patterns */
export const DOODLE_STAGES = Object.freeze({
  forge: ["tap", "spark", "draw"],
  verify: ["connect", "draw", "stamp"],
  learnBook: ["draw", "open", "write"],
  learnPencil: ["slide", "underline"],
  quizCorrect: ["draw", "spark"],
  quizWrong: ["wiggle"],
  achievement: ["draw", "reveal", "stamp"],
  levelUp: ["forge", "draw", "spark"],
  puzzleSnap: ["draw", "assemble"],
  credential: ["connect", "draw", "stamp"],
});

export function resolveAnimation(name) {
  return DOODLE_ANIMATIONS[name] || DOODLE_ANIMATIONS.draw;
}

export function resolveStages(animation, stages) {
  if (Array.isArray(stages) && stages.length) return stages;
  if (DOODLE_STAGES[animation]) return DOODLE_STAGES[animation];
  return [animation || "draw"];
}
