import { replayEvents } from "./replay.js";
import { getLevel, getXP } from "./xp.js";
import { getPathProgress } from "./paths.js";
import { validateRecipientName } from "../recipient.js";
import { sanitizePlainText } from "../frontendSecurity.js";
import { shortAddress } from "../learnerStats.js";

export const LEADERBOARD_AUTHORITY = Object.freeze({
  eventLog: "event-log",
  localPreview: "local-preview",
  xpLedger: "xp-ledger",
});
export const LEADERBOARD_DISCLAIMER =
  "Standing prefers a server-written XP ledger materialized from first-time learning events under security rules. When that ledger is unavailable, the board falls back to replaying the same event log. Learners cannot write XP totals or rank fields. This board is still not a tamper-proof exam, not on-chain, and not issuer-attested. Treat it as community ranking, not proof of skill.";
export const LEADERBOARD_PREFERENCE_KEYS = Object.freeze([
  "schemaVersion",
  "userId",
  "optIn",
  "displayName",
  "hideWallet",
  "publicSlug",
  "walletHint",
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

export function buildPublicSlug(displayName, userId) {
  const base = normalizeBoardName(displayName)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "learner";
  const suffix = String(userId || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 6);
  return suffix ? `${base}-${suffix}` : base;
}

export function formatWalletHint(address) {
  return shortAddress(address) || "";
}

export function applyLeaderboardPreference(current = {}, patch = {}, extras = {}) {
  const hideWallet = patch.hideWallet != null
    ? Boolean(patch.hideWallet)
    : current.hideWallet !== false;
  const optIn = patch.optIn != null ? Boolean(patch.optIn) : Boolean(current.optIn);
  const rawName = patch.displayName != null
    ? patch.displayName
    : (extras.displayName || current.displayName || "");
  const userId = extras.userId || current.userId || "";
  const walletAddress = patch.walletAddress != null
    ? patch.walletAddress
    : (extras.walletAddress || "");
  const displayName = optIn ? normalizeBoardName(rawName) : sanitizePlainText(rawName, 48);
  const publicSlug = optIn
    ? (patch.publicSlug || current.publicSlug || buildPublicSlug(displayName, userId))
    : "";
  const walletHint = hideWallet
    ? ""
    : (typeof patch.walletHint === "string" && patch.walletHint
      ? patch.walletHint
      : (walletAddress ? formatWalletHint(walletAddress) : (current.walletHint || "")));
  return {
    ok: true,
    preference: {
      optIn,
      displayName,
      hideWallet,
      publicSlug,
      walletHint,
    },
  };
}

export function joinLeaderboardByDefault(existingPreference, displayName, extras = {}) {
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
        preference: applyLeaderboardPreference(existingPreference, {
          optIn: true,
          displayName: boardName,
          hideWallet: existingPreference.hideWallet !== false,
        }, extras).preference,
      };
    }
    return { ok: true, applied: false, preference: existingPreference };
  }
  const applied = applyLeaderboardPreference({}, { optIn: true, displayName: boardName }, extras);
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
    walletHint: extras.walletHint || state.leaderboard?.walletHint || "",
    publicSlug: extras.publicSlug || state.leaderboard?.publicSlug || "",
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

export function snapshotFromStanding(row = {}) {
  const userId = row.userId || row.learnerId || row.id;
  if (!userId || row.optIn === false) return null;
  return {
    learnerId: userId,
    displayName: normalizeBoardName(row.displayName || ""),
    hideWallet: row.hideWallet !== false,
    walletHint: row.hideWallet === false && typeof row.walletHint === "string" ? row.walletHint : "",
    publicSlug: typeof row.publicSlug === "string" ? row.publicSlug : "",
    optIn: true,
    xp: Number(row.xp) || 0,
    weeklyXp: Number(row.weeklyXp) || 0,
    level: Number(row.level) || getLevel(Number(row.xp) || 0),
    achievementCount: Number(row.achievementCount) || 0,
    completionPercent: Number(row.completionPercent) || 0,
    completedTracks: row.completedTracks && typeof row.completedTracks === "object"
      ? { ...row.completedTracks }
      : {},
    firstAchievementAt: row.firstAchievementAt == null ? null : Number(row.firstAchievementAt),
    lastActivityAt: Number(row.lastActivityAt) || 0,
    updatedAt: Number(row.updatedAt) || Date.now(),
    authority: row.authority || LEADERBOARD_AUTHORITY.xpLedger,
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
      publicSlug: pref?.publicSlug || member.publicSlug || "",
      walletHint: (pref?.hideWallet === false || member.hideWallet === false)
        ? (pref?.walletHint || member.walletHint || "")
        : "",
    });
  }
  for (const [userId, pref] of prefs) {
    if (seen.has(userId) || pref.optIn === false) continue;
    merged.push({
      userId,
      optIn: true,
      displayName: normalizeBoardName(pref.displayName || ""),
      hideWallet: pref.hideWallet !== false,
      publicSlug: pref.publicSlug || "",
      walletHint: pref.hideWallet === false ? (pref.walletHint || "") : "",
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
          walletHint: row.walletHint || "",
          publicSlug: row.publicSlug || "",
        },
      }, {
        displayName: row.displayName,
        walletHint: row.hideWallet === false ? (row.walletHint || "") : "",
        publicSlug: row.publicSlug || "",
        authority: LEADERBOARD_AUTHORITY.eventLog,
        now: extras.now,
      });
    });
  return rankLearners(snapshots, extras);
}

export function buildStandingLeaderboard(standingRows = [], extras = {}) {
  const snapshots = (standingRows || [])
    .map((row) => snapshotFromStanding(row))
    .filter(Boolean);
  return rankLearners(snapshots, extras);
}
