import { PIECE_COST, TOTAL_PIECES, sections } from "../data/questions.js";
import { quizLengthFor } from "./quiz.js";
import { FORGE_LEVEL_META, FRAGMENTS_PER_PIECE } from "./quizConfig.js";
import { CREDENTIAL_STATES } from "./credentialStatus.js";

export const FUJI_CHAIN_ID = 43113;
export const FUJI_FAUCET_URL = "https://core.app/tools/testnet-faucet/";

export const INTRODUCTION = {
  title: "Forjora",
  tagline: "Learn Avalanche. Forge your skills. Earn your credential.",
  body: [
    "Forjora is a guided Avalanche learning quest.",
    "Create an account, learn on the path, take knowledge checks, earn XP and puzzle fragments, unlock pieces, then mint a soulbound on-chain record of your claimed scores when you connect a wallet.",
    "Learning does not require a wallet. Fuji test AVAX is only needed if you mint.",
  ].join(" "),
};

export const LEARNING_PROGRESSION = [
  {
    step: 1,
    title: "Learn",
    body: "Work through lessons and challenges on your track. Knowledge checks appear after a short stretch of learning — not on a fixed lesson count.",
  },
  {
    step: 2,
    title: "Quiz",
    body: "Foundation, Builder, Advanced, and Mastery assessments grow longer as difficulty rises. Hints are optional. Retries replace that section’s score; they do not farm XP or fragments.",
  },
  {
    step: 3,
    title: "Earn XP and fragments",
    body: "First completions award XP and puzzle fragments by difficulty. Perfect scores can grant a bonus fragment. Five fragments convert into one puzzle piece.",
  },
  {
    step: 4,
    title: "Unlock puzzle pieces",
    body: `Seat pieces with quiz points (${PIECE_COST} each; Easy 3, Medium 5, Hard 8) and with fragment conversion. Completing a track’s pieces forges that track’s certificate.`,
  },
  {
    step: 5,
    title: "Mint a credential",
    body: "When you are ready, mint a soulbound NFT on Avalanche Fuji that stores your claimed scores and puzzle mask.",
  },
];

export const PATH_COPY = {
  easy: {
    kicker: FORGE_LEVEL_META.easy.forgeLabel,
    title: FORGE_LEVEL_META.easy.title,
  },
  medium: {
    kicker: FORGE_LEVEL_META.medium.forgeLabel,
    title: FORGE_LEVEL_META.medium.title,
  },
  hard: {
    kicker: FORGE_LEVEL_META.hard.forgeLabel,
    title: FORGE_LEVEL_META.hard.title,
  },
  master: {
    kicker: FORGE_LEVEL_META.master.forgeLabel,
    title: FORGE_LEVEL_META.master.title,
  },
};

/** Visual forge labels; quiz IDs remain easy / medium / hard / master. */
export const FORGE_LEVEL_LABELS = Object.freeze({
  easy: FORGE_LEVEL_META.easy.forgeLabel,
  medium: FORGE_LEVEL_META.medium.forgeLabel,
  hard: FORGE_LEVEL_META.hard.forgeLabel,
  master: FORGE_LEVEL_META.master.forgeLabel,
});

export const DIFFICULTY_LEVELS = sections.map((section) => ({
  id: section.id,
  name: section.name,
  forgeLabel: FORGE_LEVEL_LABELS[section.id] || section.name,
  icon: section.icon,
  pointsPerQuestion: section.pointsPerQuestion,
  timePerQuestion: section.timePerQuestion,
  questionsPerQuiz: quizLengthFor(section.id),
  maxPoints: section.pointsPerQuestion * quizLengthFor(section.id),
  description: section.description || FORGE_LEVEL_META[section.id]?.blurb || "",
}));

export const POINTS_EXPLAINER = {
  title: "Points",
  body: "Points measure your current best Easy / Medium / Hard score for seating certificate pieces, not a lifetime stack. Longer quizzes still cap seating credit at five counted correct answers per difficulty (Fuji credential scale). Retry a section to replace that section's points.",
  byDifficulty: DIFFICULTY_LEVELS.filter((level) => level.id !== "master").map((level) => ({
    id: level.id,
    label: `${FORGE_LEVEL_LABELS[level.id] || level.name}: ${level.pointsPerQuestion} pts per counted correct answer (up to ${level.pointsPerQuestion * 5} seating pts)`,
  })),
};

export const PUZZLE_EXPLAINER = {
  title: "Puzzle pieces",
  body: `Quiz points seat that quiz’s certificate pieces (${PIECE_COST} each). Easy 3, Medium 5, Hard 8. Puzzle fragments from quizzes convert at ${FRAGMENTS_PER_PIECE} fragments per piece. You cannot buy the same piece twice.`,
  pieceCost: PIECE_COST,
  totalPieces: TOTAL_PIECES,
};

export const CREDENTIAL_EXPLAINER = {
  title: "Credentials",
  body: "Minting writes your claimed quiz scores and puzzle progress to a soulbound NFT on Avalanche Fuji. It cannot be transferred. The app mints a Forjora claimed record — anyone can mint their own scores. A Forjora issuer-attested mint exists on-chain for later privileged issuance. This is not a proctored exam credential.",
  claimed: CREDENTIAL_STATES.claimed.summary,
  attested: CREDENTIAL_STATES.attested.summary,
};

export const FUJI_EXPLAINER = {
  title: "Avalanche Fuji testnet",
  body: `Forjora runs only on Avalanche Fuji (chain ID ${FUJI_CHAIN_ID}). Fuji is a test network. Test AVAX has no market value and is used only for gas when you mint. Switch your wallet to Fuji before quizzes, puzzle redemption, or minting.`,
  chainId: FUJI_CHAIN_ID,
  faucetUrl: FUJI_FAUCET_URL,
  faucetHint: "Need test AVAX for minting? Use the official Fuji faucet, then return here.",
};

export const WALLET_GUIDANCE = {
  title: "Connect a wallet when you need on-chain features",
  body: "A Forjora account lets you learn immediately. Connect MetaMask or Core Wallet later to save credentials on Avalanche Fuji and send a mint transaction you must approve.",
  steps: [
    "Install MetaMask or Core Wallet if you do not have one.",
    "Click Connect and approve the request in your wallet.",
    "Switch to Avalanche Fuji when asked. Rejecting the switch only blocks minting, not quizzes.",
    "If a request stays pending, open the wallet extension and finish or reject it, then retry.",
  ],
  noWallet: "No injected wallet was found in this browser. Install MetaMask or Core, then refresh.",
};

export const EMPTY_STATES = {
  restoring: {
    title: "Drawing your learning path…",
    body: "Checking for a Forjora account and loading any saved progress.",
    doodle: "pencil",
  },
  noQuizzes: {
    title: "The fire hasn't started yet.",
    body: "Start with Foundation (Easy) to earn your first points and fragments. Progress follows your account.",
    doodle: "fire",
  },
  noBadges: {
    title: "Your badges",
    body: "Your achievements will appear here as you learn, build, and prove your skills.",
    doodle: "badge",
  },
  noStreak: {
    title: "No streak yet",
    body: "Complete a lesson, quiz, or challenge to start a learning streak. Opening Forjora alone does not count.",
    doodle: "fire",
  },
  noCertificates: {
    title: "No learning certificates yet",
    body: "Finish the required tracks and assessments to earn Foundation through Master path certificates.",
    doodle: "certificate",
  },
  noPoints: {
    title: "Nothing to spend yet.",
    body: `Quiz points unlock that quiz’s certificate pieces at ${PIECE_COST} points each. Complete a section, then return here.`,
    doodle: "spark",
  },
  noPieces: {
    title: "Nothing forged yet.",
    body: "Unlock at least one piece to preview it on your certificate artwork.",
    doodle: "puzzle",
  },
  noCredential: {
    title: "Your forge is waiting.",
    body: "Mint when you want a Fuji record of your claimed scores. You can keep learning first.",
    doodle: "certificate",
  },
  noLookup: {
    title: "No credential found",
    body: "That token ID or wallet has no current Forjora credential on Fuji. Burned remints are not kept.",
    doodle: "question",
  },
  noAttempts: {
    title: "The fire hasn't started yet.",
    body: "Your forge fills in after the first quiz for this account.",
    doodle: "fire",
  },
};

export const ERROR_STATES = {
  wallet: {
    title: "Wallet connection failed",
    body: "Check the wallet popup. If you rejected the request, try again. If another request is already pending, finish it in the wallet first.",
  },
  network: {
    title: "Wrong network",
    body: "On-chain minting needs Avalanche Fuji. You can keep taking quizzes and unlocking puzzle pieces in the meantime.",
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
    "emptyStates",
    "errorStates",
  ];
}
