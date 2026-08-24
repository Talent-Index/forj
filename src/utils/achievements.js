import { TOTAL_PIECES } from "../data/questions.js";
import { normalizePieces } from "./puzzle.js";

export const ACHIEVEMENTS = [
  {
    id: "first",
    icon: "🎉",
    name: "First Steps",
    desc: "Complete your first Avalanche quiz",
    check: (data) => Object.keys(data.sectionScores).length >= 1,
  },
  {
    id: "easy_master",
    icon: "🟢",
    name: "Easy Master",
    desc: "Score 5/5 on Easy mode",
    check: (data) => data.sectionScores.easy?.correct === 5,
  },
  {
    id: "medium_master",
    icon: "🟡",
    name: "Subnet Scholar",
    desc: "Score 5/5 on Medium mode",
    check: (data) => data.sectionScores.medium?.correct === 5,
  },
  {
    id: "hard_master",
    icon: "🔴",
    name: "Avalanche Expert",
    desc: "Score 5/5 on Hard mode",
    check: (data) => data.sectionScores.hard?.correct === 5,
  },
  {
    id: "puzzle_starter",
    icon: "🧩",
    name: "Puzzle Starter",
    desc: "Acquire at least 4 puzzle pieces",
    check: (data) => data.acquiredPieces.length >= 4,
  },
  {
    id: "full_puzzle",
    icon: "💎",
    name: "Complete Puzzle",
    desc: "Acquire all 16 puzzle pieces",
    check: (data) => data.acquiredPieces.length >= TOTAL_PIECES,
  },
  {
    id: "persistent",
    icon: "💾",
    name: "Persistent Learner",
    desc: "Complete at least 3 quiz attempts",
    check: (data) => data.attempts.length >= 3,
  },
  {
    id: "credential",
    icon: "📜",
    name: "On-chain Record",
    desc: "Mint a soulbound credential on Fuji",
    check: (data) => Boolean(data.hasCredential),
  },
];

function safeScores(sectionScores) {
  if (!sectionScores || typeof sectionScores !== "object" || Array.isArray(sectionScores)) {
    return {};
  }
  return sectionScores;
}

export function evaluateAchievements(raw = {}) {
  const input = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const data = {
    sectionScores: safeScores(input.sectionScores),
    acquiredPieces: normalizePieces(input.acquiredPieces),
    attempts: Array.isArray(input.attempts) ? input.attempts : [],
    hasCredential: Boolean(input.hasCredential),
  };
  return ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    earned: Boolean(achievement.check(data)),
  }));
}

export const ACHIEVEMENT_REGISTRY = [
  {
    id: "first",
    name: "First Steps",
    description: "Complete your first Avalanche quiz",
    category: "quiz",
    hidden: false,
    badge: "first",
    reward: { xp: 15 },
    requirement: { type: "quizCount", min: 1 },
  },
  {
    id: "perfect_score",
    name: "Perfect Score",
    description: "Score 5/5 on any difficulty",
    category: "quiz",
    hidden: false,
    badge: "perfect",
    reward: { xp: 20 },
    requirement: { type: "perfectQuiz" },
  },
  {
    id: "easy_complete",
    name: "Easy Completion",
    description: "Finish the Easy quiz",
    category: "quiz",
    hidden: false,
    badge: "easy",
    reward: { xp: 10 },
    requirement: { type: "quizCompleted", quizId: "easy" },
  },
  {
    id: "easy_master",
    name: "Easy Master",
    description: "Score 5/5 on Easy mode",
    category: "quiz",
    hidden: false,
    badge: "easy-master",
    reward: { xp: 15 },
    requirement: { type: "perfectSection", sectionId: "easy" },
  },
  {
    id: "medium_complete",
    name: "Medium Completion",
    description: "Finish the Medium quiz",
    category: "quiz",
    hidden: false,
    badge: "medium",
    reward: { xp: 10 },
    requirement: { type: "quizCompleted", quizId: "medium" },
  },
  {
    id: "medium_master",
    name: "Subnet Scholar",
    description: "Score 5/5 on Medium mode",
    category: "quiz",
    hidden: false,
    badge: "medium-master",
    reward: { xp: 15 },
    requirement: { type: "perfectSection", sectionId: "medium" },
  },
  {
    id: "hard_complete",
    name: "Hard Completion",
    description: "Finish the Hard quiz",
    category: "quiz",
    hidden: false,
    badge: "hard",
    reward: { xp: 15 },
    requirement: { type: "quizCompleted", quizId: "hard" },
  },
  {
    id: "hard_master",
    name: "Avalanche Expert",
    description: "Score 5/5 on Hard mode",
    category: "quiz",
    hidden: false,
    badge: "hard-master",
    reward: { xp: 20 },
    requirement: { type: "perfectSection", sectionId: "hard" },
  },
  {
    id: "avalanche_explorer",
    name: "Avalanche Explorer",
    description: "Complete the Avalanche Fundamentals track",
    category: "track",
    hidden: false,
    badge: "explorer",
    reward: { xp: 25 },
    requirement: { type: "trackComplete", trackId: "fundamentals" },
  },
  {
    id: "puzzle_starter",
    name: "Puzzle Starter",
    description: "Unlock at least 4 puzzle pieces",
    category: "puzzle",
    hidden: false,
    badge: "puzzle-start",
    reward: { xp: 10 },
    requirement: { type: "puzzleCount", min: 4 },
  },
  {
    id: "full_puzzle",
    name: "Complete Puzzle",
    description: "Unlock all 16 certificate pieces",
    category: "puzzle",
    hidden: false,
    badge: "puzzle",
    reward: { xp: 25 },
    requirement: { type: "puzzleComplete" },
  },
  {
    id: "persistent",
    name: "Persistent Learner",
    description: "Complete at least 3 quiz attempts",
    category: "quiz",
    hidden: false,
    badge: "persistent",
    reward: { xp: 10 },
    requirement: { type: "attemptCount", min: 3 },
  },
  {
    id: "streak_7",
    name: "Seven-Day Streak",
    description: "Learn on seven consecutive UTC days",
    category: "streak",
    hidden: false,
    badge: "streak",
    reward: { xp: 20 },
    requirement: { type: "streak", min: 7 },
  },
  {
    id: "streak_30",
    name: "Month at the Forge",
    description: "Learn on thirty consecutive UTC days",
    category: "streak",
    hidden: true,
    badge: "streak-30",
    reward: { xp: 40 },
    requirement: { type: "streak", min: 30 },
  },
  {
    id: "credential",
    name: "On-chain Record",
    description: "Claim a soulbound credential on Fuji",
    category: "credential",
    hidden: false,
    badge: "credential",
    reward: { xp: 20 },
    requirement: { type: "credential" },
  },
  {
    id: "track_complete",
    name: "Track Complete",
    description: "Finish any Avalanche learning track",
    category: "track",
    hidden: false,
    badge: "track",
    reward: { xp: 20 },
    requirement: { type: "anyTrack" },
  },
  {
    id: "path_complete",
    name: "Path Complete",
    description: "Finish the Avalanche Developer Path",
    category: "path",
    hidden: false,
    badge: "path",
    reward: { xp: 40 },
    requirement: { type: "pathComplete" },
  },
];

export function requirementMet(requirement, ctx) {
  if (!requirement || !ctx) return false;
  const quizzes = ctx.completedQuizzes || {};
  const scores = safeScores(ctx.sectionScores);
  switch (requirement.type) {
    case "quizCount":
      return Object.keys(quizzes).length >= (requirement.min || 1);
    case "perfectQuiz":
      return Object.values(quizzes).some((row) => row?.perfect) ||
        Object.values(scores).some((row) => row?.correct === 5);
    case "quizCompleted":
      return Boolean(quizzes[requirement.quizId] || scores[requirement.quizId]);
    case "perfectSection":
      return scores[requirement.sectionId]?.correct === 5 ||
        Boolean(quizzes[requirement.sectionId]?.perfect);
    case "puzzleCount":
      return (ctx.puzzleCount || 0) >= (requirement.min || 1);
    case "puzzleComplete":
      return Boolean(ctx.puzzleComplete);
    case "attemptCount":
      return (ctx.attemptCount || 0) >= (requirement.min || 1);
    case "credential":
      return Boolean(ctx.hasCredential);
    case "streak":
      return Math.max(ctx.currentStreak || 0, ctx.longestStreak || 0) >= (requirement.min || 1);
    case "trackComplete":
      return Boolean(ctx.completedTracks?.[requirement.trackId]);
    case "anyTrack":
      return Object.keys(ctx.completedTracks || {}).length >= 1;
    case "pathComplete":
      return Object.keys(ctx.completedPaths || {}).length >= 1;
    default:
      return false;
  }
}

export function requirementProgress(requirement, ctx) {
  const quizzes = ctx?.completedQuizzes || {};
  const scores = safeScores(ctx?.sectionScores);
  switch (requirement?.type) {
    case "quizCount":
      return { current: Object.keys(quizzes).length, target: requirement.min || 1 };
    case "puzzleCount":
      return { current: ctx.puzzleCount || 0, target: requirement.min || 1 };
    case "attemptCount":
      return { current: ctx.attemptCount || 0, target: requirement.min || 1 };
    case "streak":
      return { current: Math.max(ctx.currentStreak || 0, ctx.longestStreak || 0), target: requirement.min || 1 };
    case "perfectSection": {
      const correct = scores[requirement.sectionId]?.correct || 0;
      return { current: Math.min(correct, 5), target: 5 };
    }
    default:
      return { current: requirementMet(requirement, ctx) ? 1 : 0, target: 1 };
  }
}

export function achievementsToUnlock(ctx, already = {}) {
  return ACHIEVEMENT_REGISTRY.filter(
    (item) => !already[item.id] && requirementMet(item.requirement, ctx)
  );
}

export function evaluateAchievementRegistry(ctx = {}, unlocked = {}) {
  return ACHIEVEMENT_REGISTRY.map((item) => {
    const earned = Boolean(unlocked[item.id]) || requirementMet(item.requirement, ctx);
    return {
      ...item,
      earned,
      unlockedAt: unlocked[item.id]?.unlockedAt || null,
      progress: requirementProgress(item.requirement, ctx),
    };
  });
}
