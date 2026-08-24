export const XP_CONFIG = Object.freeze({
  version: 1,
  base: 100,
  growth: 1.35,
  maxLevel: 99,
});

export const XP_REWARDS = Object.freeze({
  QUIZ_COMPLETED: Object.freeze({
    easy: 50,
    medium: 80,
    hard: 120,
    default: 50,
  }),
  QUIZ_PERFECT: 25,
  LESSON_COMPLETED: 20,
  MODULE_COMPLETED: 40,
  TRACK_COMPLETED: 100,
  PATH_COMPLETED: 200,
  PUZZLE_PIECE_UNLOCKED: 8,
  PUZZLE_COMPLETED: 80,
  ACHIEVEMENT_UNLOCKED: 15,
  STREAK_MILESTONE: 30,
  CREDENTIAL_CLAIMED: 50,
  CREDENTIAL_ATTESTED: 75,
  QUIZ_STARTED: 0,
  LEARNING_ACTIVITY: 0,
});

function toXp(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export function xpRequiredForLevel(level, config = XP_CONFIG) {
  const n = Math.floor(Number(level) || 0);
  if (n <= 1) return 0;
  let total = 0;
  for (let i = 1; i < n; i += 1) {
    total += Math.floor(config.base * i ** config.growth);
  }
  return total;
}

export function getLevel(xp, config = XP_CONFIG) {
  const total = toXp(typeof xp === "object" ? xp?.xp : xp);
  let level = 1;
  while (level < config.maxLevel && xpRequiredForLevel(level + 1, config) <= total) {
    level += 1;
  }
  return level;
}

export function getXP(stateOrXp) {
  if (stateOrXp && typeof stateOrXp === "object" && !Array.isArray(stateOrXp)) {
    return toXp(stateOrXp.xp);
  }
  return toXp(stateOrXp);
}

export function getXPForNextLevel(xp, config = XP_CONFIG) {
  const total = getXP(xp);
  const level = getLevel(total, config);
  if (level >= config.maxLevel) return 0;
  return Math.max(0, xpRequiredForLevel(level + 1, config) - total);
}

export function getLevelProgress(xp, config = XP_CONFIG) {
  const total = getXP(xp);
  const level = getLevel(total, config);
  const floor = xpRequiredForLevel(level, config);
  const next = level >= config.maxLevel ? floor : xpRequiredForLevel(level + 1, config);
  const span = Math.max(1, next - floor);
  const into = Math.max(0, total - floor);
  return {
    level,
    xp: total,
    xpForNextLevel: getXPForNextLevel(total, config),
    xpIntoLevel: into,
    xpLevelSpan: span,
    percent: level >= config.maxLevel ? 100 : Math.min(100, Math.round((into / span) * 100)),
  };
}

export function xpAmountFor(type, metadata = {}) {
  if (type === "QUIZ_COMPLETED") {
    const difficulty = metadata.difficulty || metadata.sectionId;
    const table = XP_REWARDS.QUIZ_COMPLETED;
    return table[difficulty] ?? table.default;
  }
  if (type === "ACHIEVEMENT_UNLOCKED" && Number.isFinite(Number(metadata.xp))) {
    return Math.max(0, Math.floor(Number(metadata.xp)));
  }
  const listed = XP_REWARDS[type];
  if (typeof listed === "number") return listed;
  if (Number.isFinite(Number(metadata.amount))) return Math.max(0, Math.floor(Number(metadata.amount)));
  return 0;
}

export function getXPHistory(state) {
  return Array.isArray(state?.xpHistory) ? state.xpHistory.slice() : [];
}

export function awardXP(state, { type, sourceId, amount, timestamp, metadata } = {}) {
  const key = `XP:${type}:${String(sourceId ?? "")}`;
  const current = state && typeof state === "object" ? state : { xp: 0, xpKeys: {}, xpHistory: [] };
  if (current.xpKeys?.[key]) {
    return { state: current, awarded: 0, duplicate: true };
  }
  const value = toXp(amount);
  if (value <= 0) {
    return { state: current, awarded: 0, duplicate: false };
  }
  const entry = {
    type,
    sourceId: String(sourceId ?? ""),
    amount: value,
    timestamp: Number.isFinite(Number(timestamp)) ? Number(timestamp) : Date.now(),
    metadata: metadata && typeof metadata === "object" ? metadata : {},
  };
  return {
    state: {
      ...current,
      xp: toXp(current.xp) + value,
      xpKeys: { ...(current.xpKeys || {}), [key]: true },
      xpHistory: [...(current.xpHistory || []), entry],
    },
    awarded: value,
    duplicate: false,
  };
}
