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
  snapshotFromProgression,
  upsertLeaderboardEntry,
  removeLeaderboardEntry,
  readLeaderboard,
  rankLearners,
} from "../utils/progression/index.js";

function browserStorage() {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    // ignore
  }
  return createMemoryStorage();
}

export function useProgression(learnerId, quizSnapshot, { ready = false } = {}) {
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
  }, [learnerId, ready, store]);

  const persist = useCallback((next) => {
    const id = progressOwnerId(learnerId);
    if (!id) return;
    store.save(id, next);
    if (next.leaderboard?.optIn) {
      upsertLeaderboardEntry(snapshotFromProgression(next, { displayName: next.leaderboard.displayName }));
    } else {
      removeLeaderboardEntry(id);
    }
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

  const setLeaderboardPreference = useCallback((patch) => {
    const current = stateRef.current;
    if (!current) return;
    const next = {
      ...current,
      leaderboard: { ...current.leaderboard, ...patch },
    };
    stateRef.current = next;
    setState(next);
    persist(next);
  }, [persist]);

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

  const board = rankLearners(readLeaderboard(), { window: "global" });

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
    leaderboard: board,
  };
}
