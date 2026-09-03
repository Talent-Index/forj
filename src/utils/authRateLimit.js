/**
 * Client-side auth throttling. This is a UX / abuse-friction control, not a
 * substitute for Firebase Auth quotas or App Check enforcement.
 */

export const AUTH_RATE_LIMITS = Object.freeze({
  signin: { maxFailures: 5, lockMs: 60_000 },
  signup: { maxAttempts: 4, windowMs: 10 * 60_000 },
  reset: { maxAttempts: 3, windowMs: 15 * 60_000 },
});

const STORAGE_KEY = "forjora.auth.rate.v1";

function memoryFallback() {
  if (!globalThis.__forjoraAuthRate) {
    globalThis.__forjoraAuthRate = {};
  }
  return globalThis.__forjoraAuthRate;
}

function readState() {
  try {
    if (typeof sessionStorage !== "undefined") {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      }
    }
  } catch {
    // Private mode or blocked storage.
  }
  return memoryFallback();
}

function writeState(state) {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return;
    }
  } catch {
    // Fall through to memory.
  }
  Object.assign(memoryFallback(), state);
}

function waitMessage(ms) {
  const seconds = Math.max(1, Math.ceil(ms / 1000));
  return `Too many attempts. Try again in ${seconds} second${seconds === 1 ? "" : "s"}.`;
}

export function checkAuthRateLimit(action, now = Date.now()) {
  const limits = AUTH_RATE_LIMITS[action];
  if (!limits) return "";
  const state = readState();
  const row = state[action] || {};

  if (action === "signin") {
    if (row.lockedUntil && now < row.lockedUntil) {
      return waitMessage(row.lockedUntil - now);
    }
    return "";
  }

  const startedAt = Number(row.startedAt) || 0;
  const count = Number(row.count) || 0;
  if (startedAt && now - startedAt < limits.windowMs && count >= limits.maxAttempts) {
    return waitMessage(limits.windowMs - (now - startedAt));
  }
  return "";
}

export function recordAuthOutcome(action, ok, now = Date.now()) {
  const limits = AUTH_RATE_LIMITS[action];
  if (!limits) return;
  const state = { ...readState() };
  const row = { ...(state[action] || {}) };

  if (action === "signin") {
    if (ok) {
      state[action] = { failures: 0, lockedUntil: 0 };
    } else {
      const failures = (Number(row.failures) || 0) + 1;
      state[action] = {
        failures,
        lockedUntil: failures >= limits.maxFailures ? now + limits.lockMs : 0,
      };
    }
    writeState(state);
    return;
  }

  const startedAt = Number(row.startedAt) || 0;
  const inWindow = startedAt && now - startedAt < limits.windowMs;
  state[action] = {
    startedAt: inWindow ? startedAt : now,
    count: (inWindow ? Number(row.count) || 0 : 0) + 1,
  };
  writeState(state);
}
