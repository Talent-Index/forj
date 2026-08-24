import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LEARNING_CATALOG } from "../data/learning.js";
import { progressOwnerId, createMemoryStorage } from "../utils/progress.js";
import { evaluateAchievementRegistry } from "../utils/achievements.js";
import {
  EVENT_TYPES,
  applyProgressEvent,
  createProgressionStore,
  summarizeProgression,
  getPathProgress,
  getNextLearningItem,
  getCurrentStreak,
  getLongestStreak,
  getLevelProgress,
  getXPHistory,
  applyLeaderboardPreference,
  joinLeaderboardByDefault,
} from "../utils/progression/index.js";
import { isClientEventType } from "../utils/backend/schema.js";
import { writeProgressEvent, setProgressEventsOptIn } from "../utils/backend/progressSync.js";
import { readLeaderboardPreference, writeLeaderboardPreference } from "../utils/backend/leaderboardSync.js";

function browserStorage() {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    // ignore
  }
  return createMemoryStorage();
}

export function useProgression(learnerId, quizSnapshot, { ready = false, displayName = "" } = {}) {
  const store = useMemo(() => createProgressionStore(browserStorage()), []);
  const stateRef = useRef(null);
  const migratedFor = useRef(null);
  const [state, setState] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const id = progressOwnerId(learnerId);
    if (!id || !ready) {
      stateRef.current = null;
      setState(null);
      setHydrated(false);
      migratedFor.current = null;
      return;
    }
    const loaded = store.loadMigrated(id, quizSnapshot || {});
    stateRef.current = loaded;
    setState(loaded);
    setHydrated(true);
    migratedFor.current = id;
    readLeaderboardPreference(id)
      .then(async (pref) => {
        if (migratedFor.current !== id || !stateRef.current) return;
        const joined = joinLeaderboardByDefault(
          pref,
          displayName || stateRef.current.leaderboard?.displayName
        );
        if (!joined.ok) return;
        if (!joined.applied) {
          const next = {
            ...stateRef.current,
            leaderboard: { ...stateRef.current.leaderboard, ...joined.preference },
          };
          stateRef.current = next;
          setState(next);
          store.save(id, next);
          return;
        }
        await writeLeaderboardPreference(id, joined.preference).catch(() => {});
        await setProgressEventsOptIn(id, true).catch(() => {});
        const next = {
          ...stateRef.current,
          leaderboard: { ...stateRef.current.leaderboard, ...joined.preference },
        };
        stateRef.current = next;
        setState(next);
        store.save(id, next);
      })
      .catch(() => {});
    // Hydrate once per learner. Migration is idempotent if called again from dispatch.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- quizSnapshot is read once on account switch
  }, [displayName, learnerId, ready, store]);

  const persist = useCallback((next) => {
    const id = progressOwnerId(learnerId);
    if (!id) return;
    store.save(id, next);
  }, [learnerId, store]);

  const dispatch = useCallback((event, extras = {}) => {
    const current = stateRef.current;
    if (!current) {
      return { state: current, feedback: [], applied: false, duplicate: false };
    }
    const result = applyProgressEvent(current, {
      ...event,
      learnerId: current.learnerId,
      timestamp: event.timestamp ?? Date.now(),
    }, extras);
    stateRef.current = result.state;
    setState(result.state);
    setFeedback(result.feedback);
    persist(result.state);
    if (result.applied && isClientEventType(event.type)) {
      writeProgressEvent(current.learnerId, {
        ...event,
        learnerId: current.learnerId,
        timestamp: event.timestamp ?? Date.now(),
        optIn: Boolean(result.state.leaderboard?.optIn),
      }).catch(() => {});
    }
    return result;
  }, [persist]);

  const completeLesson = useCallback((lessonId) => dispatch({
    type: EVENT_TYPES.LESSON_COMPLETED,
    sourceId: lessonId,
  }), [dispatch]);

  const completeQuiz = useCallback((result) => dispatch({
    type: EVENT_TYPES.QUIZ_COMPLETED,
    sourceId: result.sectionId,
    metadata: {
      difficulty: result.sectionId,
      correct: result.correct,
      total: result.total,
      perfect: result.correct === result.total,
    },
  }, {
    sectionScores: quizSnapshot?.sectionScores,
    attemptCount: quizSnapshot?.attempts?.length || 0,
  }), [dispatch, quizSnapshot]);

  const startQuiz = useCallback((sectionId) => dispatch({
    type: EVENT_TYPES.QUIZ_STARTED,
    sourceId: sectionId,
  }), [dispatch]);

  const unlockPiece = useCallback((index) => dispatch({
    type: EVENT_TYPES.PUZZLE_PIECE_UNLOCKED,
    sourceId: `piece-${index}`,
    metadata: { index },
  }), [dispatch]);

  const claimCredential = useCallback(() => dispatch({
    type: EVENT_TYPES.CREDENTIAL_CLAIMED,
    sourceId: "credential",
  }, { hasCredential: true }), [dispatch]);

  const setLeaderboardPreference = useCallback(async (patch) => {
    const current = stateRef.current;
    if (!current) return { ok: false, error: "Sign in to continue." };
    const applied = applyLeaderboardPreference(current.leaderboard, patch, {
      displayName: patch.displayName || current.leaderboard?.displayName,
    });
    if (!applied.ok) return applied;
    const id = progressOwnerId(learnerId);
    try {
      if (applied.preference.optIn) {
        const written = await writeLeaderboardPreference(id, applied.preference);
        if (!written.ok) return written;
        await setProgressEventsOptIn(id, true);
      } else {
        await setProgressEventsOptIn(id, false);
        const written = await writeLeaderboardPreference(id, applied.preference);
        if (!written.ok) return written;
      }
    } catch (error) {
      return { ok: false, error: error.message || "Could not update the live board." };
    }
    const next = {
      ...current,
      leaderboard: { ...current.leaderboard, ...applied.preference },
    };
    stateRef.current = next;
    setState(next);
    persist(next);
    return { ok: true, preference: applied.preference };
  }, [learnerId, persist]);

  const clear = useCallback(() => {
    const id = progressOwnerId(learnerId);
    if (id) store.clear(id);
    stateRef.current = null;
    setState(null);
    setFeedback([]);
  }, [learnerId, store]);

  const summary = state ? summarizeProgression(state) : null;
  const path = state ? getPathProgress(state, LEARNING_CATALOG.defaultPathId) : null;
  const nextItem = state ? getNextLearningItem(state, LEARNING_CATALOG.defaultPathId) : null;
  const achievements = state
    ? evaluateAchievementRegistry({
      completedQuizzes: state.completedQuizzes,
      sectionScores: quizSnapshot?.sectionScores,
      puzzleCount: Object.keys(state.puzzle.pieces || {}).length,
      puzzleComplete: Boolean(state.puzzle.completedAt),
      attemptCount: quizSnapshot?.attempts?.length || 0,
      hasCredential: Boolean(state.credential.claimed),
      currentStreak: getCurrentStreak(state),
      longestStreak: getLongestStreak(state),
      completedTracks: state.completedTracks,
      completedPaths: state.completedPaths,
    }, state.achievements)
    : [];

  return {
    state,
    hydrated,
    feedback,
    clearFeedback: () => setFeedback([]),
    dispatch,
    completeLesson,
    completeQuiz,
    startQuiz,
    unlockPiece,
    claimCredential,
    setLeaderboardPreference,
    clear,
    summary,
    path,
    nextItem,
    achievements,
    level: state ? getLevelProgress(state) : null,
    xpHistory: state ? getXPHistory(state) : [],
    streakCurrent: state ? getCurrentStreak(state) : 0,
    streakLongest: state ? getLongestStreak(state) : 0,
  };
}
