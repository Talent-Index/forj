import { EVENT_TYPES, eventDedupeKey } from "./progression/events.js";
import { SCORE_SECTIONS, isEmptyProgress, sanitizeProgress } from "./progress.js";

export const WALLET_LINK_PRIMITIVE_TYPES = [
  EVENT_TYPES.QUIZ_STARTED,
  EVENT_TYPES.QUIZ_COMPLETED,
  EVENT_TYPES.LESSON_COMPLETED,
  EVENT_TYPES.PUZZLE_PIECE_UNLOCKED,
  EVENT_TYPES.CREDENTIAL_CLAIMED,
];

function eventTimestamp(event) {
  return Number(event?.timestamp ?? event?.clientTimestamp ?? 0);
}

export function primitiveEvents(events) {
  return (events || []).filter((event) => WALLET_LINK_PRIMITIVE_TYPES.includes(event?.type));
}

/** Non-empty wallet quiz replaces the account snapshot. An empty wallet does not wipe the account. */
export function preferWalletProgress(accountQuiz, walletQuiz) {
  const account = sanitizeProgress(accountQuiz);
  const wallet = sanitizeProgress(walletQuiz);
  if (isEmptyProgress(wallet)) return { quiz: account, usedWallet: false };
  return { quiz: wallet, usedWallet: true };
}

export function preferWalletEvents(accountEvents, walletEvents) {
  const byKey = new Map();
  for (const event of primitiveEvents(accountEvents)) {
    byKey.set(eventDedupeKey(event.type, event.sourceId), event);
  }
  for (const event of primitiveEvents(walletEvents)) {
    byKey.set(eventDedupeKey(event.type, event.sourceId), event);
  }
  return [...byKey.values()].sort((a, b) => eventTimestamp(a) - eventTimestamp(b));
}

export function eventsToWriteFromWallet(accountEvents, walletEvents) {
  const accountKeys = new Set(
    primitiveEvents(accountEvents).map((event) => eventDedupeKey(event.type, event.sourceId))
  );
  const seen = new Set();
  const out = [];
  for (const event of primitiveEvents(walletEvents)) {
    const key = eventDedupeKey(event.type, event.sourceId);
    if (accountKeys.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(event);
  }
  return out;
}

export function primitivesFromQuiz(quiz) {
  const safe = sanitizeProgress(quiz);
  const timestamp = Date.now();
  const events = [];
  for (const sectionId of SCORE_SECTIONS) {
    const score = safe.sectionScores[sectionId];
    if (!score) continue;
    events.push({
      type: EVENT_TYPES.QUIZ_STARTED,
      sourceId: sectionId,
      timestamp,
    });
    events.push({
      type: EVENT_TYPES.QUIZ_COMPLETED,
      sourceId: sectionId,
      timestamp,
      metadata: {
        difficulty: sectionId,
        correct: score.correct,
        total: score.total,
        perfect: score.correct >= score.total,
      },
    });
  }
  for (const index of safe.acquiredPieces) {
    events.push({
      type: EVENT_TYPES.PUZZLE_PIECE_UNLOCKED,
      sourceId: `piece-${index}`,
      timestamp,
      metadata: { index },
    });
  }
  return events;
}
