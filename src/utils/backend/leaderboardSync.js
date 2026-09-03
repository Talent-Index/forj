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
import { applyLeaderboardPreference, buildLiveLeaderboard } from "../progression/leaderboard";
import { COLLECTIONS, SCHEMA_VERSION } from "./schema";
import { FIRESTORE_TIMEOUT_MS, withTimeout } from "./timeout";

function stamp() {
  return serverTimestamp();
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
  };
}

export async function writeLeaderboardPreference(userId, patch, extras = {}) {
  if (!userId) return { ok: false, error: "Sign in to continue." };
  const applied = applyLeaderboardPreference({}, patch, extras);
  if (!applied.ok) return applied;
  const ref = doc(db, COLLECTIONS.leaderboardPreferences, userId);
  let createdAt = stamp();
  try {
    const snap = await withTimeout(getDoc(ref), FIRESTORE_TIMEOUT_MS);
    if (snap.exists() && snap.data()?.createdAt) createdAt = snap.data().createdAt;
  } catch {
    // Create a new preference document.
  }
  await withTimeout(setDoc(ref, {
    schemaVersion: SCHEMA_VERSION,
    userId,
    optIn: applied.preference.optIn,
    displayName: applied.preference.displayName,
    hideWallet: applied.preference.hideWallet,
    createdAt,
    updatedAt: stamp(),
  }), FIRESTORE_TIMEOUT_MS);
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

function rowsFromSnaps(prefSnap, eventSnap) {
  const preferences = prefSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
  const events = eventSnap.docs.map((item) => item.data());
  return buildLiveLeaderboard(preferences, events);
}

export async function fetchLiveLeaderboard() {
  const [prefSnap, eventSnap] = await Promise.all([
    withTimeout(getDocs(optedInPreferenceQuery()), FIRESTORE_TIMEOUT_MS),
    withTimeout(getDocs(optedInEventQuery()), FIRESTORE_TIMEOUT_MS),
  ]);
  return rowsFromSnaps(prefSnap, eventSnap);
}

const LIVE_UNSUB_DELAY_MS = 500;
let liveBoard = null;

function startLiveBoard() {
  const prefQuery = optedInPreferenceQuery();
  const eventQuery = optedInEventQuery();

  const listeners = new Map();
  let preferences = [];
  let events = [];
  let prefReady = false;
  let eventReady = false;
  let lastRows = null;
  let pendingUnsub = null;

  function emit() {
    if (!prefReady || !eventReady) return;
    lastRows = buildLiveLeaderboard(preferences, events);
    for (const { onChange } of listeners.values()) onChange(lastRows);
  }

  function fail(err) {
    for (const { onError } of listeners.values()) onError?.(err);
  }

  const unsubPrefs = onSnapshot(prefQuery, (snap) => {
    preferences = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
    prefReady = true;
    emit();
  }, (err) => {
    if (!prefReady) fail(err);
  });

  const unsubEvents = onSnapshot(eventQuery, (snap) => {
    events = snap.docs.map((item) => item.data());
    eventReady = true;
    emit();
  }, (err) => {
    if (!eventReady) fail(err);
  });

  Promise.all([
    getDocs(prefQuery),
    getDocs(eventQuery),
  ]).then(([prefSnap, eventSnap]) => {
    if (prefReady && eventReady) return;
    preferences = prefSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
    events = eventSnap.docs.map((item) => item.data());
    prefReady = true;
    eventReady = true;
    emit();
  }).catch((err) => {
    if (!prefReady || !eventReady) fail(err);
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
