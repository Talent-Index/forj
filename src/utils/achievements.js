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

export function evaluateAchievements({
  sectionScores = {},
  acquiredPieces = [],
  attempts = [],
  hasCredential = false,
} = {}) {
  const data = {
    sectionScores: safeScores(sectionScores),
    acquiredPieces: normalizePieces(acquiredPieces),
    attempts: Array.isArray(attempts) ? attempts : [],
    hasCredential: Boolean(hasCredential),
  };
  return ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    earned: Boolean(achievement.check(data)),
  }));
}
