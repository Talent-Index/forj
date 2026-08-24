export {
  EVENT_TYPES,
  UNIQUE_EVENT_TYPES,
  LEARNING_ACTIVITY_TYPES,
  createProgressEvent,
  eventDedupeKey,
} from "./events.js";

export {
  XP_CONFIG,
  XP_REWARDS,
  xpRequiredForLevel,
  getLevel,
  getXP,
  getXPForNextLevel,
  getLevelProgress,
  xpAmountFor,
  getXPHistory,
  awardXP as grantXpRecord,
} from "./xp.js";

export {
  STREAK_TIMEZONE,
  STREAK_MILESTONES,
  utcDateKey,
  addUtcDays,
  emptyStreak,
  recordLearningActivity,
  getCurrentStreak,
  getLongestStreak,
  hasLearnedToday,
  getWeeklyActivity,
  pendingStreakMilestones,
} from "./streaks.js";

export {
  getCatalog,
  getPath,
  getTrack,
  getModule,
  getLesson,
  modulesForTrack,
  lessonsForModule,
  quizModuleForSection,
  isTrackUnlocked,
  isModuleUnlocked,
  isLessonUnlocked,
  isLessonComplete,
  isModuleComplete,
  isTrackComplete,
  isPathComplete,
  getModuleProgress,
  getTrackProgress,
  getPathProgress,
  getNextLearningItem,
  lessonsCompletedForQuizMigration,
} from "./paths.js";

export {
  PROGRESSION_VERSION,
  emptyProgression,
  sanitizeProgression,
  applyProgressEvent,
  awardXP,
  migrateFromQuizProgress,
  summarizeProgression,
  buildAchievementContext,
} from "./engine.js";

export {
  progressionStorageKey,
  createProgressionStore,
  loadProgression,
  saveProgression,
  clearProgression,
} from "./store.js";

export {
  LEADERBOARD_STORAGE_KEY,
  LEADERBOARD_AUTHORITY,
  LEADERBOARD_DISCLAIMER,
  snapshotFromProgression,
  compareLearners,
  rankLearners,
  readLeaderboard,
  upsertLeaderboardEntry,
  removeLeaderboardEntry,
  startOfUtcWeek,
} from "./leaderboard.js";
