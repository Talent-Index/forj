import { get, push, ref, set } from "firebase/database";
import { rtdb } from "../../firebase.js";
import {
  isAllowedAnalyticsType,
  sanitizeClientPayload,
  SCHEMA_VERSION,
} from "../backend/schema.js";
import { RTDB_PATHS, analyticsTypeForProgress } from "./paths.js";

/**
 * Append an analytics event to Realtime Database (no PII keys).
 * Does not award XP — progression stays on Firestore / local events.
 */
export async function writeAnalyticsEvent(userId, type, payload = {}) {
  if (!userId || !isAllowedAnalyticsType(type)) return { ok: false };
  try {
    const eventRef = push(ref(rtdb, RTDB_PATHS.analytics));
    await set(eventRef, {
      schemaVersion: SCHEMA_VERSION,
      userId,
      type,
      payload: sanitizeClientPayload(payload),
      createdAt: Date.now(),
    });
    return { ok: true, id: eventRef.key };
  } catch {
    return { ok: false };
  }
}

/** Fire-and-forget analytics from a progress event (best effort). */
export function emitAnalyticsFromProgress(userId, event) {
  if (!userId || !event?.type) return;
  const type = analyticsTypeForProgress(event.type);
  if (!type) return;
  writeAnalyticsEvent(userId, type, {
    sourceId: event.sourceId || "",
    ...(event.metadata && typeof event.metadata === "object" ? event.metadata : {}),
  }).catch(() => {});
}

export async function listRecentAnalytics(limit = 200) {
  const snap = await get(ref(rtdb, RTDB_PATHS.analytics));
  if (!snap.exists()) return [];
  const rows = [];
  snap.forEach((child) => {
    rows.push({ id: child.key, ...child.val() });
  });
  rows.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
  return rows.slice(0, limit);
}

export function summarizeAnalyticsFunnel(events = []) {
  const byType = {};
  const bySection = {};
  for (const event of events) {
    const type = event.type || "unknown";
    byType[type] = (byType[type] || 0) + 1;
    const section = event.payload?.difficulty || event.payload?.sourceId || "";
    if (section && ["easy", "medium", "hard", "master"].includes(String(section))) {
      bySection[section] = (bySection[section] || 0) + 1;
    }
  }
  return { byType, bySection, total: events.length };
}
