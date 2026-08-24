/**
 * Streak math uses UTC calendar dates so progression is deterministic
 * across machines. Browser-local midnight is not used for unlocks.
 */
export const STREAK_TIMEZONE = "UTC";
export const STREAK_MILESTONES = Object.freeze([3, 7, 14, 30, 100]);

export function utcDateKey(timestamp = Date.now()) {
  const ts = Number(timestamp);
  const date = new Date(Number.isFinite(ts) ? ts : Date.now());
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function addUtcDays(dateKey, delta) {
  if (typeof dateKey !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + Number(delta || 0)));
  return date.toISOString().slice(0, 10);
}

export function emptyStreak() {
  return {
    timezone: STREAK_TIMEZONE,
    current: 0,
    longest: 0,
    lastDate: null,
    days: [],
    milestones: {},
  };
}

function consecutiveEndingAt(days, endDate) {
  if (!endDate || !days.includes(endDate)) return 0;
  let count = 1;
  let cursor = endDate;
  const set = new Set(days);
  while (true) {
    const prev = addUtcDays(cursor, -1);
    if (!set.has(prev)) break;
    count += 1;
    cursor = prev;
  }
  return count;
}

export function recordLearningActivity(state, timestamp = Date.now()) {
  const key = utcDateKey(timestamp);
  const currentState = state && typeof state === "object" ? state : {};
  const streak = { ...emptyStreak(), ...(currentState.streak || {}) };
  const days = Array.isArray(streak.days) ? streak.days.filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)) : [];
  if (!key) {
    return { state: { ...currentState, streak }, recorded: false, duplicateDay: false };
  }
  if (days.includes(key)) {
    return {
      state: { ...currentState, streak: { ...streak, days } },
      recorded: false,
      duplicateDay: true,
    };
  }
  const nextDays = [...days, key].sort();
  const current = consecutiveEndingAt(nextDays, key);
  const longest = Math.max(Number(streak.longest) || 0, current);
  return {
    state: {
      ...currentState,
      streak: {
        ...streak,
        current,
        longest,
        lastDate: key,
        days: nextDays,
      },
    },
    recorded: true,
    duplicateDay: false,
  };
}

export function getCurrentStreak(state, now = Date.now()) {
  const streak = state?.streak;
  if (!streak?.lastDate) return 0;
  const today = utcDateKey(now);
  const yesterday = addUtcDays(today, -1);
  if (streak.lastDate === today || streak.lastDate === yesterday) {
    return Math.max(0, Number(streak.current) || 0);
  }
  return 0;
}

export function getLongestStreak(state) {
  return Math.max(0, Math.floor(Number(state?.streak?.longest) || 0));
}

export function hasLearnedToday(state, now = Date.now()) {
  const today = utcDateKey(now);
  if (!today) return false;
  return state?.streak?.lastDate === today || (state?.streak?.days || []).includes(today);
}

export function getWeeklyActivity(state, now = Date.now()) {
  const today = utcDateKey(now);
  const days = new Set(state?.streak?.days || []);
  if (!today) return [];
  const week = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = addUtcDays(today, -offset);
    week.push({ date, active: days.has(date) });
  }
  return week;
}

export function pendingStreakMilestones(state) {
  const longest = getLongestStreak(state);
  const reached = state?.streak?.milestones && typeof state.streak.milestones === "object"
    ? state.streak.milestones
    : {};
  return STREAK_MILESTONES.filter((mark) => longest >= mark && !reached[String(mark)]);
}
