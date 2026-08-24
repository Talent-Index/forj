/**
 * SkillForge backend collections (#35–#42).
 * Client may write only learner-owned profile, quiz cache, primitive events,
 * analytics (no PII), and a first-time wallet link.
 * XP, achievements, credentials, questions, and issuer records are not client-writable.
 */
export const SCHEMA_VERSION = 1;

export const COLLECTIONS = Object.freeze({
  users: "users",
  learnerProfiles: "learnerProfiles",
  wallets: "wallets",
  walletEvents: "walletEvents",
  quizProgress: "quizProgress",
  progressEvents: "progressEvents",
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

export function progressEventDocId(userId, type, sourceId) {
  const source = String(sourceId ?? "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return `${userId}_${type}_${source}`.slice(0, 700);
}

export function walletDocId(address) {
  if (typeof address !== "string") return null;
  const value = address.trim().toLowerCase();
  return /^0x[a-f0-9]{40}$/.test(value) ? value : null;
}
