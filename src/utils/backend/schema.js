/**
 * Forjora backend collections (#35–#42).
 * Client may write only learner-owned profile, quiz cache, primitive events,
 * leaderboard opt-in, analytics (no PII), and a first-time wallet link.
 * XP totals, achievements, credentials, questions, rank fields, and issuer records
 * are not client-writable. Standing is replayed from the event log — that log is
 * still learner-published under rules, not a trusted exam ledger.
 */
import { LESSON_EVENT_SOURCE_IDS } from "../../data/learning.js";

export const SCHEMA_VERSION = 1;

export { LESSON_EVENT_SOURCE_IDS };

export const COLLECTIONS = Object.freeze({
  users: "users",
  learnerProfiles: "learnerProfiles",
  wallets: "wallets",
  walletEvents: "walletEvents",
  quizProgress: "quizProgress",
  progressEvents: "progressEvents",
  leaderboardPreferences: "leaderboardPreferences",
  xpTransactions: "xpTransactions",
  achievements: "achievements",
  streaks: "streaks",
  learningTracks: "learningTracks",
  learningPaths: "learningPaths",
  questions: "questions",
  questionKeys: "questionKeys",
  questionVersions: "questionVersions",
  analyticsEvents: "analyticsEvents",
  issuers: "issuers",
  issuerMembers: "issuerMembers",
  credentialTemplates: "credentialTemplates",
  credentials: "credentials",
  credentialVersions: "credentialVersions",
  credentialEvents: "credentialEvents",
  auditLogs: "auditLogs",
  roles: "roles",
});

export const CLIENT_EVENT_TYPES = Object.freeze([
  "QUIZ_STARTED",
  "QUIZ_COMPLETED",
  "LESSON_COMPLETED",
  "PUZZLE_PIECE_UNLOCKED",
  "CREDENTIAL_CLAIMED",
]);

export const ANALYTICS_EVENT_TYPES = Object.freeze([
  "quiz_started",
  "quiz_completed",
  "lesson_completed",
  "module_completed",
  "track_completed",
  "path_completed",
  "xp_earned",
  "achievement_unlocked",
  "streak_milestone",
  "puzzle_piece_unlocked",
  "puzzle_completed",
  "credential_claimed",
  "credential_attested",
]);

export const WALLET_STATUSES = Object.freeze({
  active: "active",
  released: "released",
});

export const ISSUER_ROLES = Object.freeze([
  "OWNER",
  "ADMIN",
  "ISSUER",
  "REVIEWER",
  "VIEWER",
]);

export const CREDENTIAL_LIFECYCLE = Object.freeze({
  issued: "ISSUED",
  active: "ACTIVE",
  superseded: "SUPERSEDED",
  revoked: "REVOKED",
});

export const QUESTION_STATUSES = Object.freeze({
  draft: "DRAFT",
  review: "REVIEW",
  published: "PUBLISHED",
  archived: "ARCHIVED",
});

export function isClientEventType(type) {
  return CLIENT_EVENT_TYPES.includes(type);
}

export function isAllowedProgressEventSource(type, sourceId) {
  const source = sanitizeProgressEventSourceId(sourceId);
  if (!source) return false;
  if (type === "QUIZ_STARTED" || type === "QUIZ_COMPLETED") {
    return source === "easy" || source === "medium" || source === "hard";
  }
  if (type === "LESSON_COMPLETED") {
    return LESSON_EVENT_SOURCE_IDS.includes(source);
  }
  if (type === "PUZZLE_PIECE_UNLOCKED") {
    return /^piece-([0-9]|1[0-5])$/.test(source);
  }
  if (type === "CREDENTIAL_CLAIMED") {
    return source === "credential";
  }
  return false;
}

export function sanitizeProgressEventSourceId(sourceId) {
  return String(sourceId ?? "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

const BLOCKED_PAYLOAD_KEYS = new Set([
  "email",
  "name",
  "wallet",
  "password",
  "token",
  "secret",
  "phone",
  "ssn",
]);
const MAX_METADATA_KEYS = 12;
const MAX_METADATA_STRING = 120;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Drop PII keys and nested objects before a client write. */
export function sanitizeClientPayload(raw, maxKeys = MAX_METADATA_KEYS) {
  if (!isPlainObject(raw)) return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    if (Object.keys(out).length >= maxKeys) break;
    const name = String(key);
    if (!name || name.length > 40) continue;
    if (BLOCKED_PAYLOAD_KEYS.has(name.toLowerCase())) continue;
    if (typeof value === "boolean") {
      out[name] = value;
    } else if (typeof value === "number" && Number.isFinite(value)) {
      out[name] = value;
    } else if (typeof value === "string") {
      out[name] = value.slice(0, MAX_METADATA_STRING);
    }
  }
  return out;
}

export function isAllowedAnalyticsType(type) {
  return ANALYTICS_EVENT_TYPES.includes(type);
}

export function progressEventDocId(userId, type, sourceId) {
  const source = sanitizeProgressEventSourceId(sourceId);
  return `${userId}_${type}_${source}`.slice(0, 700);
}

export function walletDocId(address) {
  if (typeof address !== "string") return null;
  const value = address.trim().toLowerCase();
  return /^0x[a-f0-9]{40}$/.test(value) ? value : null;
}
