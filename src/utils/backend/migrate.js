import { AUTH_STORAGE_VERSION } from "../auth";
import { STORAGE_VERSION, isEmptyProgress, loadProgress, saveProgress } from "../progress";
import { loadProgression, saveProgression } from "../progression";
import { EVENT_TYPES } from "../progression/events";
import { markMigrated, readLearnerProfile } from "./learner";
import { readProgressEvents, readQuizProgress, replayEvents, writeProgressEvent, writeQuizProgress } from "./progressSync";

const SESSION_KEY = `skillforge.auth.v${AUTH_STORAGE_VERSION}.session`;
const ACCOUNTS_KEY = `skillforge.auth.v${AUTH_STORAGE_VERSION}.accounts`;

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

function collectLegacyOwnerIds() {
  const ids = new Set();
  const session = readJson(SESSION_KEY, null);
  if (session?.accountId) ids.add(session.accountId);
  const accounts = readJson(ACCOUNTS_KEY, []);
  if (Array.isArray(accounts)) {
    for (const account of accounts) {
      if (account?.id) ids.add(account.id);
      if (account?.walletAddress) ids.add(account.walletAddress);
    }
  }
  try {
    const prefix = `skillforge.progress.v${STORAGE_VERSION}.account.`;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i) || "";
      if (key.startsWith(prefix)) ids.add(key.slice(prefix.length));
    }
  } catch {
    // Private mode.
  }
  return [...ids];
}

function firstLegacyQuiz(ownerIds) {
  for (const id of ownerIds) {
    const snapshot = loadProgress(id);
    if (!isEmptyProgress(snapshot)) return { ownerId: id, snapshot };
  }
  return null;
}

export async function migrateAndHydrate(user, localQuiz) {
  const profile = await readLearnerProfile(user);
  const remoteQuiz = await readQuizProgress(user.uid);
  const remoteEvents = await readProgressEvents(user.uid);
  const legacy = firstLegacyQuiz([...collectLegacyOwnerIds(), user.uid]);

  let quiz = !isEmptyProgress(remoteQuiz) ? remoteQuiz : localQuiz;
  if (isEmptyProgress(quiz) && legacy?.snapshot) {
    quiz = legacy.snapshot;
    saveProgress(user.uid, quiz);
  }

  if (remoteEvents.length === 0 && !profile.migratedAt) {
    if (!isEmptyProgress(quiz)) {
      await writeQuizProgress(user.uid, quiz);
    }
    const localProgression = loadProgression(user.uid);
    const source = localProgression.events?.length
      ? localProgression
      : legacy?.ownerId
        ? loadProgression(legacy.ownerId)
        : localProgression;
    const primitives = (source.events || []).filter((event) => [
      EVENT_TYPES.QUIZ_STARTED,
      EVENT_TYPES.QUIZ_COMPLETED,
      EVENT_TYPES.LESSON_COMPLETED,
      EVENT_TYPES.PUZZLE_PIECE_UNLOCKED,
      EVENT_TYPES.CREDENTIAL_CLAIMED,
    ].includes(event.type));
    for (const event of primitives) {
      await writeProgressEvent(user.uid, { ...event, learnerId: user.uid });
    }
    if (source.events?.length) {
      saveProgression(user.uid, { ...source, learnerId: user.uid });
    }
    await markMigrated(user.uid, legacy?.ownerId || "localStorage");
  } else if (isEmptyProgress(remoteQuiz) && !isEmptyProgress(quiz)) {
    await writeQuizProgress(user.uid, quiz);
  }

  const events = remoteEvents.length ? remoteEvents : await readProgressEvents(user.uid);
  if (events.length) {
    saveProgression(user.uid, replayEvents(user.uid, events, {
      sectionScores: quiz.sectionScores,
      attemptCount: quiz.attempts?.length || 0,
      hasCredential: false,
    }));
  }

  return { quiz, events };
}
