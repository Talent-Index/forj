import { MAX_POINTS, TOTAL_PIECES, getSectionById } from "../data/questions.js";
import { QUESTIONS_PER_QUIZ } from "./quiz.js";
import { SCORE_SECTIONS, normalizeAddress } from "./progress.js";
import { FUJI_CHAIN_ID } from "./wallet.js";

/** Off-chain canonical record version. Live Fuji storage is CredentialData (schema 1). */
export const CREDENTIAL_SCHEMA_VERSION = 1;
export const CREDENTIAL_EIP712_VERSION = "1";
export const CREDENTIAL_STANDARD = "SkillForgeCredential";

export const CREDENTIAL_TYPE = {
  SELF_CLAIMED: "self-claimed",
  ISSUER_ATTESTED: "issuer-attested",
};

export const VERIFICATION_STATUS = {
  CLAIMED: "claimed",
  ATTESTED: "attested",
};

export const ISSUER_KIND = {
  SELF: "self",
  CONTRACT_OWNER: "contract-owner",
};

/** Fields required on every v1 credential record. */
export const CREDENTIAL_RECORD_FIELDS = [
  "schemaVersion",
  "credentialId",
  "walletAddress",
  "score",
  "difficulty",
  "completion",
  "credentialType",
  "verificationStatus",
  "issuer",
  "metadataUri",
  "contractAddress",
  "chainId",
  "version",
];

function toBigInt(value) {
  try {
    if (typeof value === "bigint") return value;
    if (value == null || value === "") return 0n;
    return BigInt(value);
  } catch {
    return 0n;
  }
}

function toCount(value, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), max);
}

export function puzzlePieceCount(mask) {
  let bits = toBigInt(mask);
  let count = 0;
  while (bits > 0n) {
    count += Number(bits & 1n);
    bits >>= 1n;
  }
  return Math.min(count, TOTAL_PIECES);
}

export function describeMetadataUri(uri) {
  if (!uri || typeof uri !== "string") return "";
  if (uri.startsWith("data:application/json")) return "On-chain ERC-721 JSON (data URI)";
  if (uri.startsWith("ipfs://") || uri.startsWith("https://")) return uri;
  return uri.length > 64 ? `${uri.slice(0, 42)}…` : uri;
}

function difficultyEntry(sectionId, correct) {
  const section = getSectionById(sectionId);
  const safeCorrect = toCount(correct, QUESTIONS_PER_QUIZ);
  return {
    id: sectionId,
    name: section?.name || sectionId,
    correct: safeCorrect,
    total: QUESTIONS_PER_QUIZ,
    complete: safeCorrect === QUESTIONS_PER_QUIZ,
    points: safeCorrect * (section?.pointsPerQuestion || 0),
  };
}

export function isCredentialRecord(value) {
  if (!value || typeof value !== "object") return false;
  return CREDENTIAL_RECORD_FIELDS.every((field) => Object.hasOwn(value, field));
}

/**
 * Canonical SkillForge credential record (schema v1).
 * Composes on-chain CredentialData with deployment context.
 */
export function buildCredentialRecord({
  tokenId,
  walletAddress = "",
  totalPoints = 0,
  puzzleMask = 0,
  easyCorrect = 0,
  mediumCorrect = 0,
  hardCorrect = 0,
  image = "",
  mintedAt = 0,
  attested = false,
  contractAddress = "",
  chainId = FUJI_CHAIN_ID,
  metadataUri = "",
  issuerAddress = "",
  explorerUrl = "",
} = {}) {
  const id = toBigInt(tokenId);
  if (id === 0n) return null;

  const easy = difficultyEntry("easy", easyCorrect);
  const medium = difficultyEntry("medium", mediumCorrect);
  const hard = difficultyEntry("hard", hardCorrect);
  const quizCorrect = easy.correct + medium.correct + hard.correct;
  const quizTotal = SCORE_SECTIONS.length * QUESTIONS_PER_QUIZ;
  const pieces = puzzlePieceCount(puzzleMask);
  const learner = normalizeAddress(walletAddress) || "";
  const issuer = normalizeAddress(issuerAddress) || "";
  const isAttested = Boolean(attested);
  const credentialId = id.toString();
  const points = Number(typeof totalPoints === "bigint" ? totalPoints.toString() : totalPoints) || 0;
  const minted = Number(typeof mintedAt === "bigint" ? mintedAt.toString() : mintedAt) || 0;
  const chain = Number(chainId) || FUJI_CHAIN_ID;
  const imageUri = image == null ? "" : String(image);

  const record = {
    schemaVersion: CREDENTIAL_SCHEMA_VERSION,
    credentialId,
    walletAddress: learner,
    score: {
      totalPoints: points,
      maxPoints: MAX_POINTS,
      easyCorrect: easy.correct,
      mediumCorrect: medium.correct,
      hardCorrect: hard.correct,
    },
    difficulty: {
      easy,
      medium,
      hard,
    },
    completion: {
      quizCorrect,
      quizTotal,
      quizComplete: quizCorrect === quizTotal,
      puzzleMask: toBigInt(puzzleMask).toString(),
      puzzlePieces: pieces,
      puzzleTotal: TOTAL_PIECES,
      puzzleComplete: pieces >= TOTAL_PIECES,
      mintedAt: minted,
    },
    credentialType: isAttested ? CREDENTIAL_TYPE.ISSUER_ATTESTED : CREDENTIAL_TYPE.SELF_CLAIMED,
    verificationStatus: isAttested ? VERIFICATION_STATUS.ATTESTED : VERIFICATION_STATUS.CLAIMED,
    issuer: isAttested
      ? { kind: ISSUER_KIND.CONTRACT_OWNER, address: issuer }
      : { kind: ISSUER_KIND.SELF, address: learner },
    metadataUri: metadataUri == null ? "" : String(metadataUri),
    contractAddress: normalizeAddress(contractAddress) || (typeof contractAddress === "string" ? contractAddress : ""),
    chainId: chain,
    version: {
      schema: CREDENTIAL_SCHEMA_VERSION,
      eip712: CREDENTIAL_EIP712_VERSION,
      standard: CREDENTIAL_STANDARD,
    },
    imageUri,
    explorerUrl: explorerUrl || "",
    tokenId: credentialId,
    totalPoints: points,
    puzzleMask: toBigInt(puzzleMask).toString(),
    easyCorrect: easy.correct,
    mediumCorrect: medium.correct,
    hardCorrect: hard.correct,
    mintedAt: minted,
    attested: isAttested,
    image: imageUri,
  };

  return record;
}
