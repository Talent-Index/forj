import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  applyLeaderboardPreference,
  buildLiveLeaderboard,
  buildStandingLeaderboard,
  mergeAccountRoster,
} from "../progression/leaderboard";
import { COLLECTIONS, SCHEMA_VERSION } from "./schema";
import { FIRESTORE_TIMEOUT_MS, withTimeout } from "./timeout";

function stamp() {
  return serverTimestamp();
}

function preferencePayload(userId, preference) {
  const hideWallet = preference.hideWallet !== false;
  const payload = {
    schemaVersion: SCHEMA_VERSION,
    userId,
    optIn: Boolean(preference.optIn),
    displayName: preference.displayName || "",
    hideWallet,
    publicSlug: preference.optIn ? (preference.publicSlug || "") : "",
    updatedAt: stamp(),
  };
  if (!hideWallet && preference.walletHint) {
    payload.walletHint = preference.walletHint;
  } else if (hideWallet) {
    payload.walletHint = "";
  }
  return payload;
}

export async function readLeaderboardPreference(userId) {
  if (!userId) return null;
  const snap = await withTimeout(getDoc(doc(db, COLLECTIONS.leaderboardPreferences, userId)), FIRESTORE_TIMEOUT_MS);
  if (!snap.exists()) return null;
  const data = snap.data() || {};
  return {
    optIn: Boolean(data.optIn),
    displayName: typeof data.displayName === "string" ? data.displayName : "",
    hideWallet: data.hideWallet !== false,
    publicSlug: typeof data.publicSlug === "string" ? data.publicSlug : "",
    walletHint: typeof data.walletHint === "string" ? data.walletHint : "",
  };
}

export async function writeLeaderboardPreference(userId, patch, extras = {}) {
  if (!userId) return { ok: false, error: "Sign in to continue." };
  const applied = applyLeaderboardPreference({}, patch, { ...extras, userId });
  if (!applied.ok) return applied;
  const ref = doc(db, COLLECTIONS.leaderboardPreferences, userId);
  let createdAt = stamp();
  try {
    const snap = await withTimeout(getDoc(ref), FIRESTORE_TIMEOUT_MS);
    if (snap.exists() && snap.data()?.createdAt) createdAt = snap.data().createdAt;
  } catch {
    // Create a new preference document.
  }
  const payload = preferencePayload(userId, applied.preference);
  payload.createdAt = createdAt;
  await withTimeout(setDoc(ref, payload), FIRESTORE_TIMEOUT_MS);
  await withTimeout(setDoc(doc(db, COLLECTIONS.users, userId), {
    displayName: applied.preference.displayName,
    boardVisible: applied.preference.optIn,
    updatedAt: stamp(),
  }, { merge: true }), FIRESTORE_TIMEOUT_MS).catch(() => {});
  return { ok: true, preference: applied.preference };
}

function optedInPreferenceQuery() {
  return query(
    collection(db, COLLECTIONS.leaderboardPreferences),
    where("optIn", "==", true)
  );
}

function optedInEventQuery() {
  return query(
    collection(db, COLLECTIONS.progressEvents),
    where("optIn", "==", true)
  );
}

function optedInStandingQuery() {
  return query(
    collection(db, COLLECTIONS.leaderboardStanding),
    where("optIn", "==", true)
  );
}

function emptySnap() {
  return { docs: [] };
}

function rowsFromEventFallback(prefSnap, eventSnap) {
  const preferences = prefSnap.docs.map((item) => ({
    id: item.id,
    userId: item.data()?.userId || item.id,
    ...item.data(),
  }));
  const events = eventSnap.docs.map((item) => item.data());
  return buildLiveLeaderboard(mergeAccountRoster([], preferences), events);
}

function rowsFromStanding(standingSnap) {
  const rows = standingSnap.docs.map((item) => ({
    id: item.id,
    userId: item.data()?.userId || item.id,
    ...item.data(),
  }));
  return buildStandingLeaderboard(rows);
}

export async function fetchLiveLeaderboard() {
  const standingSnap = await withTimeout(
    getDocs(optedInStandingQuery()),
    FIRESTORE_TIMEOUT_MS
  ).catch(() => emptySnap());
  if (standingSnap.docs.length > 0) {
    return rowsFromStanding(standingSnap);
  }
  const [prefSnap, eventSnap] = await Promise.all([
    withTimeout(getDocs(optedInPreferenceQuery()), FIRESTORE_TIMEOUT_MS),
    withTimeout(getDocs(optedInEventQuery()), FIRESTORE_TIMEOUT_MS),
  ]);
  return rowsFromEventFallback(prefSnap, eventSnap);
}

export async function fetchPublicProfileBySlug(slug) {
  const normalized = String(slug || "").trim().toLowerCase();
  if (!normalized) return null;
  const standingQuery = query(
    collection(db, COLLECTIONS.leaderboardStanding),
    where("publicSlug", "==", normalized),
    where("optIn", "==", true)
  );
  const standingSnap = await withTimeout(getDocs(standingQuery), FIRESTORE_TIMEOUT_MS).catch(() => emptySnap());
  if (standingSnap.docs.length > 0) {
    const row = { id: standingSnap.docs[0].id, ...standingSnap.docs[0].data() };
    return buildStandingLeaderboard([row])[0] || null;
  }
  const prefQuery = query(
    collection(db, COLLECTIONS.leaderboardPreferences),
    where("publicSlug", "==", normalized),
    where("optIn", "==", true)
  );
  const prefSnap = await withTimeout(getDocs(prefQuery), FIRESTORE_TIMEOUT_MS).catch(() => emptySnap());
  if (!prefSnap.docs.length) return null;
  const pref = { id: prefSnap.docs[0].id, userId: prefSnap.docs[0].id, ...prefSnap.docs[0].data() };
  const eventQuery = query(
    collection(db, COLLECTIONS.progressEvents),
    where("userId", "==", pref.userId || pref.id),
    where("optIn", "==", true)
  );
  const eventSnap = await withTimeout(getDocs(eventQuery), FIRESTORE_TIMEOUT_MS).catch(() => emptySnap());
  const rows = buildLiveLeaderboard([pref], eventSnap.docs.map((item) => item.data()));
  return rows[0] || null;
}

const LIVE_UNSUB_DELAY_MS = 500;
let liveBoard = null;

function startLiveBoard() {
  const prefQuery = optedInPreferenceQuery();
  const eventQuery = optedInEventQuery();
  const standingQuery = optedInStandingQuery();

  const listeners = new Map();
  let preferences = [];
  let events = [];
  let standing = [];
  let standingReady = false;
  let prefReady = false;
  let eventReady = false;
  let lastRows = null;
  let pendingUnsub = null;

  function emit() {
    if (!standingReady) return;
    if (standing.length > 0) {
      lastRows = buildStandingLeaderboard(standing);
      for (const { onChange } of listeners.values()) onChange(lastRows);
      return;
    }
    if (!prefReady || !eventReady) return;
    lastRows = buildLiveLeaderboard(mergeAccountRoster([], preferences), events);
    for (const { onChange } of listeners.values()) onChange(lastRows);
  }

  function fail(err) {
    for (const { onError } of listeners.values()) onError?.(err);
  }

  const unsubStanding = onSnapshot(standingQuery, (snap) => {
    standing = snap.docs.map((item) => ({
      id: item.id,
      userId: item.data()?.userId || item.id,
      ...item.data(),
    }));
    standingReady = true;
    emit();
  }, () => {
    standing = [];
    standingReady = true;
    emit();
  });

  const unsubPrefs = onSnapshot(prefQuery, (snap) => {
    preferences = snap.docs.map((item) => ({
      id: item.id,
      userId: item.data()?.userId || item.id,
      ...item.data(),
    }));
    prefReady = true;
    emit();
  }, (err) => {
    if (!prefReady && standing.length === 0) fail(err);
  });

  const unsubEvents = onSnapshot(eventQuery, (snap) => {
    events = snap.docs.map((item) => item.data());
    eventReady = true;
    emit();
  }, (err) => {
    if (!eventReady && standing.length === 0) fail(err);
  });

  getDocs(standingQuery).then((snap) => {
    if (standingReady) return;
    standing = snap.docs.map((item) => ({
      id: item.id,
      userId: item.data()?.userId || item.id,
      ...item.data(),
    }));
    standingReady = true;
    emit();
  }).catch(() => {
    if (standingReady) return;
    standing = [];
    standingReady = true;
    emit();
  });

  Promise.all([
    getDocs(prefQuery),
    getDocs(eventQuery),
  ]).then(([prefSnap, eventSnap]) => {
    if (prefReady && eventReady) return;
    preferences = prefSnap.docs.map((item) => ({
      id: item.id,
      userId: item.data()?.userId || item.id,
      ...item.data(),
    }));
    events = eventSnap.docs.map((item) => item.data());
    prefReady = true;
    eventReady = true;
    emit();
  }).catch((err) => {
    if ((!prefReady || !eventReady) && standing.length === 0) fail(err);
  });

  return {
    listeners,
    get lastRows() {
      return lastRows;
    },
    clearPending() {
      if (pendingUnsub) {
        clearTimeout(pendingUnsub);
        pendingUnsub = null;
      }
    },
    scheduleStop() {
      this.clearPending();
      pendingUnsub = setTimeout(() => {
        if (listeners.size > 0) return;
        unsubStanding();
        unsubPrefs();
        unsubEvents();
        if (liveBoard === this) liveBoard = null;
      }, LIVE_UNSUB_DELAY_MS);
    },
  };
}

export function listenLiveLeaderboard(onChange, onError) {
  if (!liveBoard) liveBoard = startLiveBoard();
  liveBoard.clearPending();
  const id = Symbol("live-board");
  liveBoard.listeners.set(id, { onChange, onError });
  if (liveBoard.lastRows) onChange(liveBoard.lastRows);
  return () => {
    if (!liveBoard) return;
    liveBoard.listeners.delete(id);
    if (liveBoard.listeners.size === 0) liveBoard.scheduleStop();
  };
}
