import { PIECE_COST, TOTAL_PIECES, sections } from "../data/questions.js";
import { QUESTIONS_PER_QUIZ } from "./quiz.js";
import { normalizeAddress } from "./progress.js";
import { CREDENTIAL_STATES } from "./credentialStatus.js";

export const FUJI_CHAIN_ID = 43113;
export const FUJI_FAUCET_URL = "https://core.app/tools/testnet-faucet/";
export const ONBOARDING_STORAGE_VERSION = 1;

export const INTRODUCTION = {
  title: "SkillForge",
  tagline: "Learn Avalanche. Earn points. Mint a credential.",
  body: [
    "SkillForge is a guided Avalanche learning quest on Fuji testnet.",
    "You take short quizzes, earn points, unlock puzzle pieces, then mint a soulbound on-chain record of your claimed scores.",
    "Nothing here spends real AVAX. You only need a wallet and free Fuji test AVAX if you mint.",
  ].join(" "),
};

export const LEARNING_PROGRESSION = [
  {
    step: 1,
    title: "Learn",
    body: "Pick Easy, Medium, or Hard. Each session is five unique questions from that difficulty only.",
  },
  {
    step: 2,
    title: "Quiz",
    body: "Answer under a timer. Hints are optional. Retries replace your previous score for that section — they do not stack extra points.",
  },
  {
    step: 3,
    title: "Earn points",
    body: "Correct answers award points by difficulty. Your total is the sum of your current Easy, Medium, and Hard scores.",
  },
  {
    step: 4,
    title: "Unlock puzzle pieces",
    body: `Spend ${PIECE_COST} points per piece on a 16-piece interlocking jigsaw. Completing it forges the SkillForge certificate.`,
  },
  {
    step: 5,
    title: "Mint a credential",
    body: "When you are ready, mint a soulbound NFT on Avalanche Fuji that stores your claimed scores and puzzle mask.",
  },
];

export const PATH_COPY = {
  easy: { kicker: "Easy", title: "Avalanche Fundamentals" },
  medium: { kicker: "Medium", title: "Ecosystem & Architecture" },
  hard: { kicker: "Hard", title: "Advanced Avalanche Concepts" },
};

export const DIFFICULTY_LEVELS = sections.map((section) => ({
  id: section.id,
  name: section.name,
  icon: section.icon,
  pointsPerQuestion: section.pointsPerQuestion,
  timePerQuestion: section.timePerQuestion,
  questionsPerQuiz: QUESTIONS_PER_QUIZ,
  maxPoints: section.pointsPerQuestion * QUESTIONS_PER_QUIZ,
  description: section.description,
}));

export const POINTS_EXPLAINER = {
  title: "Points",
  body: "Points measure your current best score per difficulty, not a lifetime stack. Retry a section to replace that section's points. Spend leftover points on puzzle pieces; spent points are deducted from what you can still redeem.",
  byDifficulty: DIFFICULTY_LEVELS.map((level) => ({
    id: level.id,
    label: `${level.name}: ${level.pointsPerQuestion} pts per correct answer (up to ${level.maxPoints} pts)`,
  })),
};

export const PUZZLE_EXPLAINER = {
  title: "Puzzle pieces",
  body: `The certificate is a 16-piece interlocking jigsaw. Each piece costs ${PIECE_COST} points. You cannot buy the same piece twice or go below zero remaining points.`,
  pieceCost: PIECE_COST,
  totalPieces: TOTAL_PIECES,
};

export const CREDENTIAL_EXPLAINER = {
  title: "Credentials",
  body: "Minting writes your claimed quiz scores and puzzle progress to a soulbound NFT on Avalanche Fuji. It cannot be transferred. The app mints a self-claimed record — anyone can mint their own scores. An issuer-attested mint exists on-chain for later privileged issuance. This is not a proctored exam credential.",
  claimed: CREDENTIAL_STATES.claimed.summary,
  attested: CREDENTIAL_STATES.attested.summary,
};

export const FUJI_EXPLAINER = {
  title: "Avalanche Fuji testnet",
  body: `SkillForge runs only on Avalanche Fuji (chain ID ${FUJI_CHAIN_ID}). Fuji is a test network. Test AVAX has no market value and is used only for gas when you mint. Switch your wallet to Fuji before quizzes, puzzle redemption, or minting.`,
  chainId: FUJI_CHAIN_ID,
  faucetUrl: FUJI_FAUCET_URL,
  faucetHint: "Need test AVAX for minting? Use the official Fuji faucet, then return here.",
};

export const WALLET_GUIDANCE = {
  title: "Connect a wallet",
  body: "Connect MetaMask or Core Wallet so SkillForge can save progress to this browser for your address and, later, send a mint transaction you must approve.",
  steps: [
    "Install MetaMask or Core Wallet if you do not have one.",
    "Click Connect and approve the request in your wallet.",
    "Switch to Avalanche Fuji when asked. Rejecting the switch blocks quizzes and minting.",
    "If a request stays pending, open the wallet extension and finish or reject it, then retry.",
  ],
  noWallet: "No injected wallet was found in this browser. Install MetaMask or Core, then refresh.",
};

export const FIRST_TIME_FLOW = [
  {
    id: "read",
    title: "Read how SkillForge works",
    body: "You are here. Understand quizzes, points, puzzle pieces, credentials, and Fuji before connecting.",
  },
  {
    id: "connect",
    title: "Connect on Fuji",
    body: "Connect MetaMask or Core Wallet and switch to Avalanche Fuji testnet.",
  },
  {
    id: "quiz",
    title: "Start with Easy",
    body: "Take the Easy quiz first. You can retry any section later; the new score replaces the old one.",
  },
  {
    id: "puzzle",
    title: "Redeem a puzzle piece",
    body: `When you have at least ${PIECE_COST} points, open the puzzle and unlock a piece.`,
  },
  {
    id: "mint",
    title: "Mint when you are ready",
    body: "Preview your certificate, then approve a Fuji mint. You can remint later; the new credential replaces the previous one.",
  },
];

export const EMPTY_STATES = {
  restoring: {
    title: "Restoring your session",
    body: "Checking for a connected wallet and loading any saved progress for this address.",
  },
  noQuizzes: {
    title: "No quizzes yet",
    body: "Start with Easy to earn your first points. Progress is saved in this browser for your wallet.",
  },
  noPoints: {
    title: "No points to spend",
    body: `Quiz points unlock puzzle pieces at ${PIECE_COST} points each. Complete a section, then return here.`,
  },
  noPieces: {
    title: "No puzzle pieces yet",
    body: "Unlock at least one piece to preview it on your certificate artwork.",
  },
  noCredential: {
    title: "No on-chain credential yet",
    body: "Mint when you want a Fuji record of your claimed scores. You can keep learning first.",
  },
  noAttempts: {
    title: "No attempts logged",
    body: "Your dashboard fills in after the first quiz for this wallet.",
  },
};

export const ERROR_STATES = {
  wallet: {
    title: "Wallet connection failed",
    body: "Check the wallet popup. If you rejected the request, try again. If another request is already pending, finish it in the wallet first.",
  },
  network: {
    title: "Wrong network",
    body: "SkillForge cannot run quizzes, puzzle redemption, or minting until your wallet is on Avalanche Fuji.",
  },
  quiz: {
    title: "Quiz could not start",
    body: "That difficulty needs enough unique questions. Go back and pick another section, or retry after the question bank is updated.",
  },
  puzzle: {
    title: "Piece could not be unlocked",
    body: "You need enough remaining points, and each piece can be bought only once.",
  },
  mint: {
    title: "Mint failed",
    body: "Confirm you are on Fuji, have test AVAX for gas, and approved the transaction. Then retry.",
  },
};

export function onboardingStorageKey(address, version = ONBOARDING_STORAGE_VERSION) {
  const normalized = normalizeAddress(address);
  if (!normalized) return null;
  return `skillforge.onboarding.v${version}.${normalized}`;
}

export function isFirstRunGuideDismissed(address, storage = globalThis.localStorage) {
  const key = onboardingStorageKey(address);
  if (!key || !storage) return false;
  try {
    return storage.getItem(key) === "dismissed";
  } catch {
    return false;
  }
}

export function dismissFirstRunGuide(address, storage = globalThis.localStorage) {
  const key = onboardingStorageKey(address);
  if (!key || !storage) return false;
  try {
    storage.setItem(key, "dismissed");
    return true;
  } catch {
    return false;
  }
}

export function firstRunStatus({
  isConnected = false,
  isFuji = false,
  completedSections = [],
  acquiredPieces = [],
  hasMinted = false,
} = {}) {
  const completed = new Set(completedSections);
  return FIRST_TIME_FLOW.map((step) => {
    let done = false;
    if (step.id === "read") done = true;
    if (step.id === "connect") done = Boolean(isConnected && isFuji);
    if (step.id === "quiz") done = completed.has("easy") || completed.size > 0;
    if (step.id === "puzzle") done = Array.isArray(acquiredPieces) && acquiredPieces.length > 0;
    if (step.id === "mint") done = Boolean(hasMinted);
    return { ...step, done };
  });
}

export function requiredOnboardingTopics() {
  return [
    "introduction",
    "learningProgression",
    "difficultyLevels",
    "points",
    "puzzlePieces",
    "credentials",
    "fujiTestnet",
    "walletGuidance",
    "firstTimeFlow",
    "emptyStates",
    "errorStates",
  ];
}
