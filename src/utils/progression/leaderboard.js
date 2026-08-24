import { getLevel, getXP } from "./xp.js";
import { getPathProgress } from "./paths.js";
import { replayEvents } from "./replay.js";
import { createMemoryStorage } from "../progress.js";
import { validateRecipientName } from "../recipient.js";

export const LEADERBOARD_STORAGE_KEY = "skillforge.leaderboard.v1";
export const LEADERBOARD_AUTHORITY = Object.freeze({
  eventLog: "event-log",
  localPreview: "local-preview",
});
export const LEADERBOARD_DISCLAIMER =
  "Standing comes from an append-only log of first-time learning events. Learners cannot write XP or rank. This is not on-chain and not an issuer-attested score.";
export const LEADERBOARD_PREFERENCE_KEYS = Object.freeze([
  "schemaVersion",
  "userId",
  "optIn",
  "displayName",
  "hideWallet",
  "createdAt",
  "updatedAt",
]);

function defaultStorage() {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    // ignore
  }
  return createMemoryStorage();
}

export function startOfUtcWeek(now = Date.now()) {
  const date = new Date(now);
  const day = date.getUTCDay();
  const mondayOffset = (day + 6) % 7;
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - mondayOffset);
}

function xpSince(state, start) {
  return (state?.xpHistory || [])
    .filter((entry) => Number(entry.timestamp) >= start)
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
}

function lastEventTime(state) {
  const events = state?.events || [];
  if (!events.length) return 0;
  return Math.max(...events.map((event) => Number(event.timestamp) || 0));
}

export function applyLeaderboardPreference(current = {}, patch = {}, extras = {}) {
  const hideWallet = patch.hideWallet != null
    ? Boolean(patch.hideWallet)
    : current.hideWallet !== false;
  const optIn = patch.optIn != null ? Boolean(patch.optIn) : Boolean(current.optIn);
  const rawName = patch.displayName != null
    ? patch.displayName
    : (extras.displayName || current.displayName || "");
  if (optIn) {
    const recipient = validateRecipientName(rawName);
    if (!recipient.ok) return { ok: false, error: recipient.error || "Enter a name to appear on the board." };
    return {
      ok: true,
      preference: { optIn: true, displayName: recipient.name, hideWallet },
    };
  }
  const trimmed = typeof rawName === "string" ? rawName.trim() : "";
  return {
    ok: true,
    preference: { optIn: false, displayName: trimmed.slice(0, 48), hideWallet },
  };
}

export function snapshotFromProgression(state, extras = {}) {
  const path = getPathProgress(state);
  const unlocked = Object.values(state?.achievements || {});
  const firstAchievementAt = unlocked.length
    ? Math.min(...unlocked.map((item) => Number(item.unlockedAt) || Infinity))
    : null;
  return {
    learnerId: state.learnerId,
    displayName: state.leaderboard?.displayName || extras.displayName || "Learner",
    hideWallet: state.leaderboard?.hideWallet !== false,
    optIn: Boolean(state.leaderboard?.optIn),
    xp: getXP(state),
    weeklyXp: extras.weeklyXp ?? xpSince(state, startOfUtcWeek(extras.now)),
    level: getLevel(state.xp),
    achievementCount: Object.keys(state?.achievements || {}).length,
    completionPercent: path.percent,
    completedTracks: { ...(state?.completedTracks || {}) },
    firstAchievementAt: Number.isFinite(firstAchievementAt) ? firstAchievementAt : null,
    lastActivityAt: extras.lastActivityAt || lastEventTime(state),
    updatedAt: extras.updatedAt || Date.now(),
    authority: extras.authority || LEADERBOARD_AUTHORITY.eventLog,
  };
}

export function compareLearners(a, b) {
  if ((b.xp || 0) !== (a.xp || 0)) return (b.xp || 0) - (a.xp || 0);
  if ((b.completionPercent || 0) !== (a.completionPercent || 0)) return (b.completionPercent || 0) - (a.completionPercent || 0);
  if ((b.achievementCount || 0) !== (a.achievementCount || 0)) return (b.achievementCount || 0) - (a.achievementCount || 0);
  const aTime = a.firstAchievementAt == null ? Number.POSITIVE_INFINITY : a.firstAchievementAt;
  const bTime = b.firstAchievementAt == null ? Number.POSITIVE_INFINITY : b.firstAchievementAt;
  return aTime - bTime;
}

export function rankLearners(entries, { window = "global", trackId, now = Date.now() } = {}) {
  let list = (entries || []).filter((row) => row && row.optIn && row.learnerId);
  if (window === "weekly") {
    const start = startOfUtcWeek(now);
    list = list
      .filter((row) => (row.lastActivityAt || 0) >= start)
      .map((row) => ({ ...row, sortXp: row.weeklyXp ?? 0 }));
  } else if (window === "track" && trackId) {
    list = list
      .filter((row) => row.completedTracks?.[trackId])
      .map((row) => ({ ...row, sortXp: row.xp }));
  } else {
    list = list.map((row) => ({ ...row, sortXp: row.xp }));
  }
  list.sort((a, b) => {
    if ((b.sortXp || 0) !== (a.sortXp || 0)) return (b.sortXp || 0) - (a.sortXp || 0);
    return compareLearners(a, b);
  });
  return list.map((row, index) => ({ ...row, rank: index + 1 }));
}

export function groupEventsByUser(events) {
  const map = new Map();
  for (const event of events || []) {
    const uid = event.userId || event.learnerId;
    if (!uid) continue;
    if (!map.has(uid)) map.set(uid, []);
    map.get(uid).push(event);
  }
  return map;
}

export function buildLiveLeaderboard(preferences, events, extras = {}) {
  const grouped = groupEventsByUser(events);
  const snapshots = (preferences || [])
    .filter((row) => row && row.optIn && (row.userId || row.learnerId || row.id))
    .map((row) => {
      const userId = row.userId || row.learnerId || row.id;
      const state = replayEvents(userId, grouped.get(userId) || [], extras);
      return snapshotFromProgression({
        ...state,
        leaderboard: {
          optIn: true,
          displayName: row.displayName || extras.displayName || "Learner",
          hideWallet: row.hideWallet !== false,
        },
      }, {
        displayName: row.displayName,
        authority: LEADERBOARD_AUTHORITY.eventLog,
        now: extras.now,
      });
    });
  return rankLearners(snapshots, extras);
}

export function readLeaderboard(storage = defaultStorage()) {
  try {
    const raw = storage.getItem(LEADERBOARD_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((row) => row && row.learnerId) : [];
  } catch {
    return [];
  }
}

export function writeLeaderboard(entries, storage = defaultStorage()) {
  try {
    storage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

export function upsertLeaderboardEntry(snapshot, storage = defaultStorage()) {
  const list = readLeaderboard(storage).filter((row) => row.learnerId !== snapshot.learnerId);
  if (!snapshot?.optIn || !snapshot.learnerId) {
    writeLeaderboard(list, storage);
    return list;
  }
  const next = [...list, snapshot];
  writeLeaderboard(next, storage);
  return next;
}

export function removeLeaderboardEntry(learnerId, storage = defaultStorage()) {
  const next = readLeaderboard(storage).filter((row) => row.learnerId !== learnerId);
  writeLeaderboard(next, storage);
  return next;
}
