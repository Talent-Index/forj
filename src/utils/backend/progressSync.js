import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { emptyProgress, sanitizeProgress } from "../progress";
import { replayEvents } from "../progression/replay";
import {
  COLLECTIONS,
  SCHEMA_VERSION,
  isClientEventType,
  progressEventDocId,
  sanitizeProgressEventSourceId,
} from "./schema";
import { FIRESTORE_TIMEOUT_MS, withTimeout } from "./timeout";

function eventPayload(userId, event) {
  const sourceId = sanitizeProgressEventSourceId(event.sourceId);
  return {
    schemaVersion: SCHEMA_VERSION,
    userId,
    type: event.type,
    sourceId,
    eventKey: `${event.type}:${sourceId}`,
    metadata: event.metadata && typeof event.metadata === "object" ? event.metadata : {},
    clientTimestamp: Number(event.timestamp) || Date.now(),
    optIn: Boolean(event.optIn),
    createdAt: serverTimestamp(),
  };
}

export async function writeProgressEvent(userId, event) {
  if (!userId || !event?.type || !isClientEventType(event.type)) return { ok: false, duplicate: false };
  const sourceId = sanitizeProgressEventSourceId(event.sourceId);
  const id = progressEventDocId(userId, event.type, sourceId);
  const ref = doc(db, COLLECTIONS.progressEvents, id);
  const existing = await withTimeout(getDoc(ref), FIRESTORE_TIMEOUT_MS);
  if (existing.exists()) return { ok: true, duplicate: true };
  await withTimeout(setDoc(ref, eventPayload(userId, { ...event, sourceId })), FIRESTORE_TIMEOUT_MS);
  return { ok: true, duplicate: false };
}

export async function readProgressEvents(userId) {
  const snap = await withTimeout(getDocs(query(
    collection(db, COLLECTIONS.progressEvents),
    where("userId", "==", userId)
  )), FIRESTORE_TIMEOUT_MS);
  return snap.docs
    .map((item) => item.data())
    .sort((a, b) => Number(a.clientTimestamp || 0) - Number(b.clientTimestamp || 0));
}

export async function setProgressEventsOptIn(userId, optIn) {
  const snap = await withTimeout(getDocs(query(
    collection(db, COLLECTIONS.progressEvents),
    where("userId", "==", userId)
  )), FIRESTORE_TIMEOUT_MS);
  const flag = Boolean(optIn);
  const refs = snap.docs.filter((item) => item.data()?.optIn !== flag).map((item) => item.ref);
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db);
    for (const ref of refs.slice(i, i + 400)) {
      batch.update(ref, { optIn: flag });
    }
    await withTimeout(batch.commit(), FIRESTORE_TIMEOUT_MS);
  }
  return { ok: true, updated: refs.length };
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

export { replayEvents };

export async function writeAnalyticsEvent(userId, type, payload = {}) {
  await setDoc(doc(collection(db, COLLECTIONS.analyticsEvents)), {
    schemaVersion: SCHEMA_VERSION,
    userId,
    type,
    payload,
    createdAt: serverTimestamp(),
  });
}
