import {
  collection,
  doc,
  getDoc,
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

const LIVE_UNSUB_DELAY_MS = 500;
let liveBoard = null;

function startLiveBoard() {
  const prefQuery = query(
    collection(db, COLLECTIONS.leaderboardPreferences),
    where("optIn", "==", true)
  );
  const eventQuery = query(
    collection(db, COLLECTIONS.progressEvents),
    where("optIn", "==", true)
  );

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
  }, fail);

  const unsubEvents = onSnapshot(eventQuery, (snap) => {
    events = snap.docs.map((item) => item.data());
    eventReady = true;
    emit();
  }, fail);

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
