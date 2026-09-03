import { replayEvents } from "./replay.js";
import { getLevel, getXP } from "./xp.js";
import { getPathProgress } from "./paths.js";
import { validateRecipientName } from "../recipient.js";
import { sanitizePlainText } from "../frontendSecurity.js";

export const LEADERBOARD_AUTHORITY = Object.freeze({
  eventLog: "event-log",
  localPreview: "local-preview",
});
export const LEADERBOARD_DISCLAIMER =
  "Standing comes from an append-only log of first-time learning events that signed-in learners publish under security rules. Learners cannot write XP totals or rank fields, but this board is not a tamper-proof exam, not on-chain, and not issuer-attested. Treat it as community ranking, not proof of skill.";
export const LEADERBOARD_PREFERENCE_KEYS = Object.freeze([
  "schemaVersion",
  "userId",
  "optIn",
  "displayName",
  "hideWallet",
  "createdAt",
  "updatedAt",
]);

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

export const LEADERBOARD_FALLBACK_NAME = "Learner";
const BOARD_NAME_RE = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.'’-]*$/u;

export function normalizeBoardName(value) {
  const recipient = validateRecipientName(value);
  if (recipient.ok) return recipient.name;
  const trimmed = sanitizePlainText(String(value || ""), 48);
  if (trimmed.length >= 2 && BOARD_NAME_RE.test(trimmed)) return trimmed;
  const compact = trimmed.replace(/[^\p{L}\p{M}\p{N}\s.'’-]/gu, "").replace(/\s+/g, " ").trim();
  if (compact.length >= 2 && BOARD_NAME_RE.test(compact)) return compact;
  return LEADERBOARD_FALLBACK_NAME;
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
    return {
      ok: true,
      preference: { optIn: true, displayName: normalizeBoardName(rawName), hideWallet },
    };
  }
  const trimmed = sanitizePlainText(rawName, 48);
  return {
    ok: true,
    preference: { optIn: false, displayName: trimmed, hideWallet },
  };
}

export function joinLeaderboardByDefault(existingPreference, displayName) {
  const boardName = normalizeBoardName(displayName);
  if (existingPreference) {
    const currentName = typeof existingPreference.displayName === "string"
      ? existingPreference.displayName
      : "";
    const shouldRename = Boolean(existingPreference.optIn)
      && boardName !== currentName
      && boardName !== LEADERBOARD_FALLBACK_NAME;
    if (shouldRename) {
      return {
        ok: true,
        applied: true,
        preference: {
          optIn: true,
          displayName: boardName,
          hideWallet: existingPreference.hideWallet !== false,
        },
      };
    }
    return { ok: true, applied: false, preference: existingPreference };
  }
  const applied = applyLeaderboardPreference({}, { optIn: true, displayName: boardName });
  if (!applied.ok) return { ...applied, applied: false };
  return { ok: true, applied: true, preference: applied.preference };
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

/** Verified accounts are on the board unless they hid. Missing boardVisible means visible. */
export function mergeAccountRoster(roster = [], preferences = []) {
  const prefs = new Map();
  for (const row of preferences || []) {
    const userId = row.userId || row.learnerId || row.id;
    if (!userId) continue;
    prefs.set(userId, row);
  }
  const seen = new Set();
  const merged = [];
  for (const member of roster || []) {
    const userId = member.userId || member.id;
    if (!userId) continue;
    seen.add(userId);
    const pref = prefs.get(userId);
    if (pref && pref.optIn === false) continue;
    if (member.boardVisible === false) continue;
    merged.push({
      userId,
      optIn: true,
      displayName: normalizeBoardName(pref?.displayName || member.displayName || member.name || ""),
      hideWallet: pref?.hideWallet !== false && member.hideWallet !== false,
    });
  }
  for (const [userId, pref] of prefs) {
    if (seen.has(userId) || pref.optIn === false) continue;
    merged.push({
      userId,
      optIn: true,
      displayName: normalizeBoardName(pref.displayName || ""),
      hideWallet: pref.hideWallet !== false,
    });
  }
  return merged;
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
