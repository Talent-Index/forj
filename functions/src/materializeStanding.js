import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { replayEvents } from "../vendor/src/utils/progression/replay.js";
import { getLevel, getXP } from "../vendor/src/utils/progression/xp.js";
import { getPathProgress } from "../vendor/src/utils/progression/paths.js";

const COLLECTIONS = Object.freeze({
  progressEvents: "progressEvents",
  leaderboardPreferences: "leaderboardPreferences",
  leaderboardStanding: "leaderboardStanding",
  xpTransactions: "xpTransactions",
});

const AUTHORITY = "xp-ledger";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

function startOfUtcWeek(now = Date.now()) {
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

function sanitizeXpKey(key) {
  return String(key || "").replace(/[^a-zA-Z0-9._:-]/g, "_").slice(0, 160);
}

export async function materializeUserStanding(userId) {
  if (!userId) return { ok: false, reason: "missing-user" };

  const prefSnap = await db.collection(COLLECTIONS.leaderboardPreferences).doc(userId).get();
  const pref = prefSnap.exists ? prefSnap.data() || {} : {};
  const optIn = Boolean(pref.optIn);
  const standingRef = db.collection(COLLECTIONS.leaderboardStanding).doc(userId);

  if (!optIn) {
    await standingRef.set({
      schemaVersion: 1,
      userId,
      optIn: false,
      updatedAt: Date.now(),
      authority: AUTHORITY,
    }, { merge: true });
    return { ok: true, optIn: false };
  }

  const eventSnap = await db.collection(COLLECTIONS.progressEvents)
    .where("userId", "==", userId)
    .get();
  const events = eventSnap.docs.map((doc) => doc.data());
  const state = replayEvents(userId, events);
  const path = getPathProgress(state);
  const unlocked = Object.values(state.achievements || {});
  const firstAchievementAt = unlocked.length
    ? Math.min(...unlocked.map((item) => Number(item.unlockedAt) || Infinity))
    : null;
  const now = Date.now();
  const hideWallet = pref.hideWallet !== false;
  const standing = {
    schemaVersion: 1,
    userId,
    optIn: true,
    displayName: typeof pref.displayName === "string" ? pref.displayName : "Learner",
    publicSlug: typeof pref.publicSlug === "string" ? pref.publicSlug : "",
    hideWallet,
    walletHint: hideWallet ? "" : (typeof pref.walletHint === "string" ? pref.walletHint : ""),
    xp: getXP(state),
    weeklyXp: xpSince(state, startOfUtcWeek(now)),
    level: getLevel(state.xp),
    achievementCount: Object.keys(state.achievements || {}).length,
    completionPercent: path.percent,
    completedTracks: { ...(state.completedTracks || {}) },
    firstAchievementAt: Number.isFinite(firstAchievementAt) ? firstAchievementAt : null,
    lastActivityAt: lastEventTime(state),
    updatedAt: now,
    authority: AUTHORITY,
  };

  const batch = db.batch();
  batch.set(standingRef, standing, { merge: true });

  for (const entry of state.xpHistory || []) {
    const xpKey = `XP:${entry.type}:${String(entry.sourceId ?? "")}`;
    const txId = `${userId}_${sanitizeXpKey(xpKey)}`;
    const txRef = db.collection(COLLECTIONS.xpTransactions).doc(txId);
    batch.set(txRef, {
      schemaVersion: 1,
      userId,
      xpKey,
      type: entry.type,
      sourceId: String(entry.sourceId ?? ""),
      amount: Number(entry.amount) || 0,
      timestamp: Number(entry.timestamp) || now,
      createdAt: FieldValue.serverTimestamp(),
      authority: AUTHORITY,
    }, { merge: true });
  }

  await batch.commit();
  return { ok: true, optIn: true, xp: standing.xp };
}

function userIdFromProgressChange(change) {
  return change?.after?.data()?.userId
    || change?.before?.data()?.userId
    || "";
}

export const onProgressEventWrite = onDocumentWritten(
  `${COLLECTIONS.progressEvents}/{eventId}`,
  async (event) => {
    const userId = userIdFromProgressChange(event.data);
    if (!userId) return null;
    return materializeUserStanding(userId);
  }
);

export const onLeaderboardPreferenceWrite = onDocumentWritten(
  `${COLLECTIONS.leaderboardPreferences}/{userId}`,
  async (event) => {
    const userId = event.params.userId
      || event.data?.after?.data()?.userId
      || event.data?.before?.data()?.userId
      || "";
    if (!userId) return null;
    return materializeUserStanding(userId);
  }
);
