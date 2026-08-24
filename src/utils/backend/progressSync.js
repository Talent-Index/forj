import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { emptyProgress, sanitizeProgress } from "../progress";
import { applyProgressEvent, emptyProgression, EVENT_TYPES } from "../progression";
import {
  CLIENT_EVENT_TYPES,
  COLLECTIONS,
  SCHEMA_VERSION,
  isClientEventType,
  progressEventDocId,
} from "./schema";

function eventPayload(userId, event) {
  return {
    schemaVersion: SCHEMA_VERSION,
    userId,
    type: event.type,
    sourceId: String(event.sourceId ?? ""),
    eventKey: `${event.type}:${String(event.sourceId ?? "")}`,
    metadata: event.metadata && typeof event.metadata === "object" ? event.metadata : {},
    clientTimestamp: Number(event.timestamp) || Date.now(),
    createdAt: serverTimestamp(),
  };
}

export async function writeProgressEvent(userId, event) {
  if (!userId || !event?.type || !isClientEventType(event.type)) return { ok: false, duplicate: false };
  const id = progressEventDocId(userId, event.type, event.sourceId);
  const ref = doc(db, COLLECTIONS.progressEvents, id);
  const existing = await getDoc(ref);
  if (existing.exists()) return { ok: true, duplicate: true };
  await setDoc(ref, eventPayload(userId, event));
  return { ok: true, duplicate: false };
}

export async function readProgressEvents(userId) {
  const snap = await getDocs(query(
    collection(db, COLLECTIONS.progressEvents),
    where("userId", "==", userId)
  ));
  return snap.docs
    .map((item) => item.data())
    .sort((a, b) => Number(a.clientTimestamp || 0) - Number(b.clientTimestamp || 0));
}

export async function writeQuizProgress(userId, snapshot) {
  const safe = sanitizeProgress(snapshot);
  await setDoc(doc(db, COLLECTIONS.quizProgress, userId), {
    schemaVersion: SCHEMA_VERSION,
    userId,
    view: safe.view,
    activeSection: safe.activeSection,
    totalPoints: safe.totalPoints,
    spentPoints: safe.spentPoints,
    acquiredPieces: safe.acquiredPieces,
    sectionScores: safe.sectionScores,
    completedSections: safe.completedSections,
    attempts: safe.attempts.slice(-40),
    recipientName: safe.recipientName || "",
    updatedAt: serverTimestamp(),
  });
  return true;
}

export async function readQuizProgress(userId) {
  const snap = await getDoc(doc(db, COLLECTIONS.quizProgress, userId));
  if (!snap.exists()) return emptyProgress();
  return sanitizeProgress(snap.data());
}

export function replayEvents(userId, events, extras = {}) {
  let state = emptyProgression(userId);
  for (const raw of events) {
    if (!CLIENT_EVENT_TYPES.includes(raw.type) && !EVENT_TYPES[raw.type]) continue;
    state = applyProgressEvent(state, {
      type: raw.type,
      sourceId: raw.sourceId,
      learnerId: userId,
      timestamp: raw.clientTimestamp,
      metadata: raw.metadata,
    }, extras).state;
  }
  return state;
}

export async function writeAnalyticsEvent(userId, type, payload = {}) {
  await setDoc(doc(collection(db, COLLECTIONS.analyticsEvents)), {
    schemaVersion: SCHEMA_VERSION,
    userId,
    type,
    payload,
    createdAt: serverTimestamp(),
  });
}
