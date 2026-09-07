import { TOTAL_PIECES } from "../data/questions.js";
import { normalizePieces } from "./puzzle.js";
import { quizLengthFor } from "./quizConfig.js";
import {
  enrichAchievement,
  skillLadderEntries,
  streakRegistryEntries,
  LEARNING_CERTIFICATES,
  learningCredentialId,
  formatIssuedMonth,
} from "./achievementCatalog.js";

function isPerfectSection(scores, sectionId) {
  const row = scores?.[sectionId];
  if (!row) return false;
  const total = Number(row.total) || quizLengthFor(sectionId);
  return Number(row.correct) >= total && total > 0;
}

export const ACHIEVEMENTS = [
  {
    id: "first",
    icon: "check",
    name: "First Steps",
    desc: "Complete your first Avalanche quiz",
    check: (data) => Object.keys(data.sectionScores).length >= 1,
  },
  {
    id: "easy_master",
    icon: "learn",
    name: "Foundation Explorer",
    desc: "Perfect a Foundation assessment",
    check: (data) => isPerfectSection(data.sectionScores, "easy"),
  },
  {
    id: "medium_master",
    icon: "progress",
    name: "Builder",
    desc: "Perfect a Builder assessment",
    check: (data) => isPerfectSection(data.sectionScores, "medium"),
  },
  {
    id: "hard_master",
    icon: "flame",
    name: "Advanced Practitioner",
    desc: "Perfect an Advanced assessment",
    check: (data) => isPerfectSection(data.sectionScores, "hard"),
  },
  {
    id: "master_master",
    icon: "badge",
    name: "Mastermind",
    desc: "Perfect a Mastery assessment",
    check: (data) => isPerfectSection(data.sectionScores, "master"),
  },
  {
    id: "first_piece",
    icon: "puzzle",
    name: "First Piece",
    desc: "Collect your first puzzle piece",
    check: (data) => data.acquiredPieces.length >= 1,
  },
  {
    id: "puzzle_starter",
    icon: "puzzle",
    name: "Piece Collector",
    desc: "Acquire at least 4 puzzle pieces",
    check: (data) => data.acquiredPieces.length >= 4,
  },
  {
    id: "puzzle_builder",
    icon: "puzzle",
    name: "Puzzle Builder",
    desc: "Acquire at least 8 puzzle pieces",
    check: (data) => data.acquiredPieces.length >= 8,
  },
  {
    id: "near_completion",
    icon: "puzzle",
    name: "Near Completion",
    desc: "Acquire at least 12 puzzle pieces",
    check: (data) => data.acquiredPieces.length >= 12,
  },
  {
    id: "full_puzzle",
    icon: "badge",
    name: "Puzzle Master",
    desc: "Acquire all 16 puzzle pieces",
    check: (data) => data.acquiredPieces.length >= TOTAL_PIECES,
  },
  {
    id: "persistent",
    icon: "path",
    name: "Persistent Learner",
    desc: "Complete at least 3 quiz attempts",
    check: (data) => data.attempts.length >= 3,
  },
  {
    id: "credential",
    icon: "wallet",
    name: "On-chain Record",
    desc: "Mint a soulbound credential on Fuji",
    check: (data) => Boolean(data.hasCredential),
  },
  {
    id: "cert_fundamentals",
    icon: "learn",
    name: "Fundamentals Certificate",
    desc: "Seat all Easy pieces",
    check: (data) => [0, 1, 2].every((index) => data.acquiredPieces.includes(index)),
  },
  {
    id: "cert_architecture",
    icon: "progress",
    name: "Architecture Certificate",
    desc: "Seat all Medium pieces",
    check: (data) => [3, 4, 5, 6, 7].every((index) => data.acquiredPieces.includes(index)),
  },
  {
    id: "cert_developer",
    icon: "badge",
    name: "Developer Certificate",
    desc: "Seat all Hard pieces",
    check: (data) => [8, 9, 10, 11, 12, 13, 14, 15].every((index) => data.acquiredPieces.includes(index)),
  },
  {
    id: "track_l1s",
    icon: "path",
    name: "L1 Builder",
    desc: "Complete the Avalanche L1s track",
    check: (data) => Boolean(data.completedTracks.l1s),
  },
  {
    id: "track_cchain",
    icon: "wallet",
    name: "C-Chain Builder",
    desc: "Complete the C-Chain track",
    check: (data) => Boolean(data.completedTracks["c-chain"]),
  },
  {
    id: "track_icm",
    icon: "board",
    name: "ICM Builder",
    desc: "Complete the ICM track",
    check: (data) => Boolean(data.completedTracks.icm),
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
    completedTracks: input.completedTracks && typeof input.completedTracks === "object"
      ? input.completedTracks
      : {},
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
    description: "Score a perfect result on any difficulty",
    category: "quiz",
    hidden: false,
    badge: "perfect",
    reward: { xp: 20 },
    requirement: { type: "perfectQuiz" },
  },
  {
    id: "easy_complete",
    name: "Foundation Completion",
    description: "Finish a Foundation assessment",
    category: "quiz",
    hidden: false,
    badge: "easy",
    reward: { xp: 10 },
    requirement: { type: "quizCompleted", quizId: "easy" },
  },
  {
    id: "easy_master",
    name: "Foundation Explorer",
    description: "Perfect a Foundation assessment",
    category: "quiz",
    hidden: false,
    badge: "easy-master",
    reward: { xp: 15 },
    requirement: { type: "perfectSection", sectionId: "easy" },
  },
  {
    id: "medium_complete",
    name: "Builder Completion",
    description: "Finish a Builder assessment",
    category: "quiz",
    hidden: false,
    badge: "medium",
    reward: { xp: 10 },
    requirement: { type: "quizCompleted", quizId: "medium" },
  },
  {
    id: "medium_master",
    name: "Builder",
    description: "Perfect a Builder assessment",
    category: "quiz",
    hidden: false,
    badge: "medium-master",
    reward: { xp: 15 },
    requirement: { type: "perfectSection", sectionId: "medium" },
  },
  {
    id: "hard_complete",
    name: "Advanced Completion",
    description: "Finish an Advanced assessment",
    category: "quiz",
    hidden: false,
    badge: "hard",
    reward: { xp: 15 },
    requirement: { type: "quizCompleted", quizId: "hard" },
  },
  {
    id: "hard_master",
    name: "Advanced Practitioner",
    description: "Perfect an Advanced assessment",
    category: "quiz",
    hidden: false,
    badge: "hard-master",
    reward: { xp: 20 },
    requirement: { type: "perfectSection", sectionId: "hard" },
  },
  {
    id: "master_complete",
    name: "Mastery Completion",
    description: "Finish a Mastery assessment",
    category: "quiz",
    hidden: false,
    badge: "master",
    reward: { xp: 20 },
    requirement: { type: "quizCompleted", quizId: "master" },
  },
  {
    id: "master_master",
    name: "Mastermind",
    description: "Perfect a Mastery assessment",
    category: "quiz",
    hidden: false,
    badge: "master-master",
    reward: { xp: 30 },
    requirement: { type: "perfectSection", sectionId: "master" },
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
    id: "architecture_builder",
    name: "Architecture Builder",
    description: "Complete the Avalanche Architecture track",
    category: "track",
    hidden: false,
    badge: "architecture",
    reward: { xp: 20 },
    requirement: { type: "trackComplete", trackId: "architecture" },
  },
  {
    id: "l1_builder",
    name: "L1 Builder",
    description: "Complete the Avalanche L1s track",
    category: "track",
    hidden: false,
    badge: "l1s",
    reward: { xp: 20 },
    requirement: { type: "trackComplete", trackId: "l1s" },
  },
  {
    id: "cchain_builder",
    name: "C-Chain Builder",
    description: "Complete the C-Chain track",
    category: "track",
    hidden: false,
    badge: "c-chain",
    reward: { xp: 20 },
    requirement: { type: "trackComplete", trackId: "c-chain" },
  },
  {
    id: "icm_builder",
    name: "ICM Builder",
    description: "Complete the ICM track",
    category: "track",
    hidden: false,
    badge: "icm",
    reward: { xp: 20 },
    requirement: { type: "trackComplete", trackId: "icm" },
  },
  {
    id: "developer_builder",
    name: "Developer Capstone",
    description: "Complete the Avalanche Developer Track",
    category: "track",
    hidden: false,
    badge: "developer",
    reward: { xp: 25 },
    requirement: { type: "trackComplete", trackId: "developer" },
  },
  {
    id: "first_piece",
    name: "First Piece",
    description: "Collect your first puzzle piece",
    category: "puzzle",
    hidden: false,
    badge: "first-piece",
    reward: { xp: 8 },
    requirement: { type: "puzzleCount", min: 1 },
  },
  {
    id: "puzzle_starter",
    name: "Piece Collector",
    description: "Unlock at least 4 puzzle pieces",
    category: "puzzle",
    hidden: false,
    badge: "puzzle-start",
    reward: { xp: 10 },
    requirement: { type: "puzzleCount", min: 4 },
  },
  {
    id: "puzzle_builder",
    name: "Puzzle Builder",
    description: "Unlock at least 8 puzzle pieces",
    category: "puzzle",
    hidden: false,
    badge: "puzzle-builder",
    reward: { xp: 15 },
    requirement: { type: "puzzleCount", min: 8 },
  },
  {
    id: "near_completion",
    name: "Near Completion",
    description: "Unlock at least 12 puzzle pieces",
    category: "puzzle",
    hidden: false,
    badge: "near-completion",
    reward: { xp: 20 },
    requirement: { type: "puzzleCount", min: 12 },
  },
  {
    id: "full_puzzle",
    name: "Puzzle Master",
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
  {
    id: "halfway_hero",
    name: "Halfway Hero",
    description: "Collect 8 of 16 puzzle pieces",
    category: "puzzle",
    hidden: false,
    badge: "halfway",
    reward: { xp: 12 },
    requirement: { type: "puzzleCount", min: 8 },
  },
  {
    id: "sharp_mind",
    name: "Sharp Mind",
    description: "Perfect Foundation and Builder assessments",
    category: "quiz",
    hidden: false,
    badge: "sharp",
    reward: { xp: 25 },
    requirement: {
      type: "allOf",
      all: [
        { type: "perfectSection", sectionId: "easy" },
        { type: "perfectSection", sectionId: "medium" },
      ],
    },
  },
  {
    id: "unshaken",
    name: "Unshaken",
    description: "Finish an Advanced assessment",
    category: "quiz",
    hidden: false,
    badge: "unshaken",
    reward: { xp: 20 },
    requirement: { type: "quizCompleted", quizId: "hard" },
  },
  {
    id: "quiz_master",
    name: "Quiz Master",
    description: "Complete Foundation, Builder, and Advanced assessments",
    category: "quiz",
    hidden: false,
    badge: "quiz-master",
    reward: { xp: 30 },
    requirement: {
      type: "allOf",
      all: [
        { type: "quizCompleted", quizId: "easy" },
        { type: "quizCompleted", quizId: "medium" },
        { type: "quizCompleted", quizId: "hard" },
      ],
    },
  },
];

const EXISTING_IDS = new Set(ACHIEVEMENT_REGISTRY.map((item) => item.id));
for (const entry of streakRegistryEntries()) {
  if (!EXISTING_IDS.has(entry.id)) {
    ACHIEVEMENT_REGISTRY.push(entry);
    EXISTING_IDS.add(entry.id);
  } else {
    const index = ACHIEVEMENT_REGISTRY.findIndex((item) => item.id === entry.id);
    if (index >= 0) {
      ACHIEVEMENT_REGISTRY[index] = {
        ...ACHIEVEMENT_REGISTRY[index],
        ...entry,
        reward: entry.reward,
        requirement: entry.requirement,
        name: entry.name,
        description: entry.description,
        hidden: entry.hidden,
      };
    }
  }
}
for (const entry of skillLadderEntries()) {
  if (!EXISTING_IDS.has(entry.id)) {
    ACHIEVEMENT_REGISTRY.push(entry);
    EXISTING_IDS.add(entry.id);
  }
}

export function requirementMet(requirement, ctx) {
  if (!requirement || !ctx) return false;
  const quizzes = ctx.completedQuizzes || {};
  const scores = safeScores(ctx.sectionScores);
  switch (requirement.type) {
    case "quizCount":
      return Object.keys(quizzes).length >= (requirement.min || 1);
    case "perfectQuiz":
      return Object.values(quizzes).some((row) => row?.perfect) ||
        Object.entries(scores).some(([id, row]) => {
          const total = Number(row?.total) || quizLengthFor(id);
          return Number(row?.correct) >= total && total > 0;
        });
    case "quizCompleted":
      return Boolean(quizzes[requirement.quizId] || scores[requirement.quizId]);
    case "perfectSection": {
      const row = scores[requirement.sectionId];
      const total = Number(row?.total) || quizLengthFor(requirement.sectionId);
      return (row && Number(row.correct) >= total && total > 0) ||
        Boolean(quizzes[requirement.sectionId]?.perfect);
    }
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
    case "allOf":
      return (requirement.all || []).every((part) => requirementMet(part, ctx));
    case "anyOf":
      return (requirement.any || []).some((part) => requirementMet(part, ctx));
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
      const row = scores[requirement.sectionId];
      const total = Number(row?.total) || quizLengthFor(requirement.sectionId);
      const correct = Number(row?.correct) || 0;
      return { current: Math.min(correct, total), target: total };
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
    return enrichAchievement({
      ...item,
      earned,
      unlockedAt: unlocked[item.id]?.unlockedAt || null,
      progress: requirementProgress(item.requirement, ctx),
    });
  });
}

export function evaluateLearningCertificates(ctx = {}, options = {}) {
  return LEARNING_CERTIFICATES.map((cert) => {
    const earned = requirementMet(cert.requirement, ctx);
    return {
      ...cert,
      earned,
      issuedLabel: earned ? formatIssuedMonth(options.now) : null,
      credentialId: earned
        ? learningCredentialId(cert.level, options.learnerKey || options.recipientName || "LOCAL")
        : null,
    };
  });
}

export function highestSkillTiers(achievements = []) {
  const best = {};
  for (const item of achievements) {
    if (!item.earned || !item.skillId || !item.tier) continue;
    if (!best[item.skillId] || item.tier > best[item.skillId].tier) {
      best[item.skillId] = item;
    }
  }
  return Object.values(best).sort((a, b) => a.displayName.localeCompare(b.displayName));
}
