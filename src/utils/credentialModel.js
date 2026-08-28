import { MAX_POINTS, TOTAL_PIECES, getSectionById } from "../data/questions.js";
import { QUESTIONS_PER_QUIZ } from "./quiz.js";
import { SCORE_SECTIONS, normalizeAddress } from "./progress.js";
import { FUJI_CHAIN_ID, parseChainId } from "./wallet.js";

/** Off-chain canonical record version. Live Fuji storage is CredentialData (schema 1). */
export const CREDENTIAL_SCHEMA_VERSION = 1;
export const CREDENTIAL_EIP712_VERSION = "1";
export const CREDENTIAL_STANDARD = "SkillForgeCredential";

export const CREDENTIAL_TYPE = {
  SELF_CLAIMED: "self-claimed",
  ISSUER_ATTESTED: "issuer-attested",
};

export const VERIFICATION_STATUS = {
  NONE: "none",
  CLAIMED: "claimed",
  ATTESTED: "attested",
};

export const ISSUER_KIND = {
  SELF: "self",
  CONTRACT_OWNER: "contract-owner",
};

export const SCORE_MAX_PER_DIFFICULTY = QUESTIONS_PER_QUIZ;
export const PUZZLE_MASK_MAX = 0xffff;
export const MIN_UNIX_SECONDS = 0;
export const MAX_UNIX_SECONDS = 4_102_444_800;

/** Always present on a v1 record object. */
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

/** Must be populated with a valid value. */
export const REQUIRED_FIELDS = [
  "schemaVersion",
  "credentialId",
  "score",
  "difficulty",
  "completion",
  "credentialType",
  "verificationStatus",
  "issuer",
  "chainId",
  "version",
];

/** Present, but empty string is allowed until chain context is loaded. */
export const OPTIONAL_FIELDS = [
  "walletAddress",
  "contractAddress",
  "metadataUri",
  "imageUri",
  "explorerUrl",
];

const ADDRESS_RE = /^0x[a-f0-9]{40}$/;
const CREDENTIAL_ID_RE = /^[1-9][0-9]{0,77}$/;
const EIP712_VERSION_RE = /^[0-9]+$/;

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

function isInteger(value) {
  return typeof value === "number" && Number.isInteger(value);
}

export function isAddress(value) {
  return typeof value === "string" && ADDRESS_RE.test(value);
}

export function isCredentialId(value) {
  return typeof value === "string" && CREDENTIAL_ID_RE.test(value);
}

export function isChainId(value) {
  const n = parseChainId(value);
  return Number.isInteger(n) && n > 0 && n <= 0xffffffff;
}

export function isUnixSeconds(value) {
  return isInteger(value) && value >= MIN_UNIX_SECONDS && value <= MAX_UNIX_SECONDS;
}

export function isSchemaVersion(value) {
  return isInteger(value) && value >= 1;
}

export function toUnixSeconds(value) {
  if (typeof value === "bigint") {
    const asNumber = Number(value);
    return Number.isSafeInteger(asNumber) ? asNumber : 0;
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > MAX_UNIX_SECONDS && n <= MAX_UNIX_SECONDS * 1000) return Math.floor(n / 1000);
  return Math.floor(n);
}

export function toIsoTimestamp(unixSeconds) {
  if (!isUnixSeconds(unixSeconds) || unixSeconds === 0) return "";
  return new Date(unixSeconds * 1000).toISOString();
}

export function puzzlePieceCount(mask) {
  let bits = toBigInt(mask);
  if (bits > BigInt(PUZZLE_MASK_MAX)) bits &= BigInt(PUZZLE_MASK_MAX);
  let count = 0;
  while (bits > 0n) {
    count += Number(bits & 1n);
    bits >>= 1n;
  }
  return count;
}

export function describeMetadataUri(uri) {
  if (!uri || typeof uri !== "string") return "";
  if (uri.startsWith("data:application/json")) return "On-chain ERC-721 JSON (data URI)";
  if (uri.startsWith("ipfs://") || uri.startsWith("https://")) return uri;
  return uri.length > 64 ? `${uri.slice(0, 42)}…` : uri;
}

function difficultyEntry(sectionId, correct) {
  const section = getSectionById(sectionId);
  const safeCorrect = toCount(correct, SCORE_MAX_PER_DIFFICULTY);
  return {
    id: sectionId,
    name: section?.name || sectionId,
    correct: safeCorrect,
    total: SCORE_MAX_PER_DIFFICULTY,
    complete: safeCorrect === SCORE_MAX_PER_DIFFICULTY,
    points: safeCorrect * (section?.pointsPerQuestion || 0),
  };
}

function resolveChainId(chainId) {
  if (chainId == null || chainId === "") return FUJI_CHAIN_ID;
  return isChainId(chainId) ? parseChainId(chainId) : 0;
}

function pushError(errors, field, message) {
  errors.push({ field, message });
}

export function expectedTypePair(attested) {
  if (attested) {
    return {
      credentialType: CREDENTIAL_TYPE.ISSUER_ATTESTED,
      verificationStatus: VERIFICATION_STATUS.ATTESTED,
      issuerKind: ISSUER_KIND.CONTRACT_OWNER,
    };
  }
  return {
    credentialType: CREDENTIAL_TYPE.SELF_CLAIMED,
    verificationStatus: VERIFICATION_STATUS.CLAIMED,
    issuerKind: ISSUER_KIND.SELF,
  };
}

/**
 * Same tokenId cannot change verification status. Remint (new id) may move
 * claimed ↔ attested. v1 has no revoke path.
 */
export function canTransitionVerification(from, to, { sameCredentialId = false } = {}) {
  const states = new Set(Object.values(VERIFICATION_STATUS));
  if (!states.has(from) || !states.has(to)) return false;
  if (from === to) return true;
  if (sameCredentialId) return false;
  if (from === VERIFICATION_STATUS.NONE) {
    return to === VERIFICATION_STATUS.CLAIMED || to === VERIFICATION_STATUS.ATTESTED;
  }
  if (to === VERIFICATION_STATUS.NONE) return false;
  return (
    (from === VERIFICATION_STATUS.CLAIMED || from === VERIFICATION_STATUS.ATTESTED) &&
    (to === VERIFICATION_STATUS.CLAIMED || to === VERIFICATION_STATUS.ATTESTED)
  );
}

export function credentialIdsAreUnique(records) {
  const ids = (Array.isArray(records) ? records : [])
    .map((item) => item?.credentialId)
    .filter(Boolean);
  return new Set(ids).size === ids.length;
}

export function currentCredentialIdByWallet(records) {
  const current = new Map();
  for (const record of Array.isArray(records) ? records : []) {
    if (!record?.walletAddress || !isCredentialId(record.credentialId)) continue;
    const prev = current.get(record.walletAddress);
    if (!prev || BigInt(record.credentialId) > BigInt(prev)) {
      current.set(record.walletAddress, record.credentialId);
    }
  }
  return current;
}

export function validateCredentialRecord(record, { requireWallet = false, requireContract = false } = {}) {
  const errors = [];
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return { ok: false, errors: [{ field: ".", message: "Record must be an object." }] };
  }

  for (const field of CREDENTIAL_RECORD_FIELDS) {
    if (!Object.hasOwn(record, field)) {
      pushError(errors, field, "Required field is missing.");
    }
  }

  if (!isSchemaVersion(record.schemaVersion)) {
    pushError(errors, "schemaVersion", "Must be an integer >= 1.");
  }

  if (!isCredentialId(record.credentialId)) {
    pushError(errors, "credentialId", "Must be a decimal token id starting at 1.");
  }

  if (record.walletAddress) {
    if (!isAddress(record.walletAddress)) {
      pushError(errors, "walletAddress", "Must be a lowercase 0x-prefixed 40-hex address.");
    }
  } else if (requireWallet) {
    pushError(errors, "walletAddress", "Wallet address is required.");
  } else if (record.walletAddress !== "" && record.walletAddress != null) {
    pushError(errors, "walletAddress", "Must be a lowercase 0x-prefixed 40-hex address or empty.");
  }

  if (record.contractAddress) {
    if (!isAddress(record.contractAddress)) {
      pushError(errors, "contractAddress", "Must be a lowercase 0x-prefixed 40-hex address.");
    }
  } else if (requireContract) {
    pushError(errors, "contractAddress", "Contract address is required.");
  } else if (record.contractAddress != null && record.contractAddress !== "") {
    pushError(errors, "contractAddress", "Must be a lowercase 0x-prefixed 40-hex address or empty.");
  }

  if (!isChainId(record.chainId)) {
    pushError(errors, "chainId", "Must be a positive 32-bit integer.");
  }

  const score = record.score;
  if (!score || typeof score !== "object") {
    pushError(errors, "score", "Must be an object.");
  } else {
    for (const key of ["easyCorrect", "mediumCorrect", "hardCorrect"]) {
      const n = score[key];
      if (!isInteger(n) || n < 0 || n > SCORE_MAX_PER_DIFFICULTY) {
        pushError(errors, `score.${key}`, `Must be an integer 0–${SCORE_MAX_PER_DIFFICULTY}.`);
      }
    }
    if (!isInteger(score.totalPoints) || score.totalPoints < 1) {
      pushError(errors, "score.totalPoints", "Must be an integer >= 1.");
    }
    if (score.maxPoints !== MAX_POINTS) {
      pushError(errors, "score.maxPoints", `Must equal ${MAX_POINTS}.`);
    }
  }

  const difficulty = record.difficulty;
  if (!difficulty || typeof difficulty !== "object") {
    pushError(errors, "difficulty", "Must be an object.");
  } else {
    for (const id of SCORE_SECTIONS) {
      const row = difficulty[id];
      const scoreKey = `${id}Correct`;
      if (!row || typeof row !== "object") {
        pushError(errors, `difficulty.${id}`, "Missing difficulty entry.");
        continue;
      }
      if (score && row.correct !== score[scoreKey]) {
        pushError(errors, `difficulty.${id}.correct`, "Must match score for that difficulty.");
      }
      if (row.total !== SCORE_MAX_PER_DIFFICULTY) {
        pushError(errors, `difficulty.${id}.total`, `Must be ${SCORE_MAX_PER_DIFFICULTY}.`);
      }
      if (row.complete !== (row.correct === SCORE_MAX_PER_DIFFICULTY)) {
        pushError(errors, `difficulty.${id}.complete`, "Must be true only when correct === 5.");
      }
    }
  }

  const completion = record.completion;
  if (!completion || typeof completion !== "object") {
    pushError(errors, "completion", "Must be an object.");
  } else {
    if (!isUnixSeconds(completion.mintedAt)) {
      pushError(errors, "completion.mintedAt", "Must be Unix seconds (integer 0–4102444800).");
    }
    if (completion.mintedAtIso != null && typeof completion.mintedAtIso !== "string") {
      pushError(errors, "completion.mintedAtIso", "Must be an ISO-8601 string or empty.");
    } else if (
      completion.mintedAt > 0 &&
      completion.mintedAtIso &&
      completion.mintedAtIso !== toIsoTimestamp(completion.mintedAt)
    ) {
      pushError(errors, "completion.mintedAtIso", "Must match completion.mintedAt in UTC.");
    }
    const mask = toBigInt(completion.puzzleMask);
    if (typeof completion.puzzleMask !== "string" || mask < 1n || mask > BigInt(PUZZLE_MASK_MAX)) {
      pushError(errors, "completion.puzzleMask", "Must be a decimal string for a 16-bit mask (1–65535).");
    }
    if (!isInteger(completion.puzzlePieces) || completion.puzzlePieces < 0 || completion.puzzlePieces > TOTAL_PIECES) {
      pushError(errors, "completion.puzzlePieces", `Must be an integer 0–${TOTAL_PIECES}.`);
    }
    if (completion.puzzleTotal !== TOTAL_PIECES) {
      pushError(errors, "completion.puzzleTotal", `Must be ${TOTAL_PIECES}.`);
    }
    if (!isInteger(completion.quizCorrect) || completion.quizCorrect < 0 || completion.quizCorrect > 15) {
      pushError(errors, "completion.quizCorrect", "Must be an integer 0–15.");
    }
    if (typeof completion.puzzleMask === "string" && isInteger(completion.puzzlePieces)) {
      if (completion.puzzlePieces !== puzzlePieceCount(completion.puzzleMask)) {
        pushError(errors, "completion.puzzlePieces", "Must equal the popcount of puzzleMask.");
      }
    }
    if (score && isInteger(completion.quizCorrect)) {
      const summed = (score.easyCorrect || 0) + (score.mediumCorrect || 0) + (score.hardCorrect || 0);
      if (completion.quizCorrect !== summed) {
        pushError(errors, "completion.quizCorrect", "Must equal Easy + Medium + Hard correct.");
      }
    }
  }

  const attested = record.verificationStatus === VERIFICATION_STATUS.ATTESTED;
  if (record.credentialType !== CREDENTIAL_TYPE.SELF_CLAIMED && record.credentialType !== CREDENTIAL_TYPE.ISSUER_ATTESTED) {
    pushError(errors, "credentialType", 'Must be "self-claimed" or "issuer-attested".');
  }
  if (
    record.verificationStatus !== VERIFICATION_STATUS.CLAIMED &&
    record.verificationStatus !== VERIFICATION_STATUS.ATTESTED
  ) {
    pushError(errors, "verificationStatus", 'Must be "claimed" or "attested".');
  }
  if ((record.credentialType === CREDENTIAL_TYPE.ISSUER_ATTESTED) !== attested) {
    pushError(errors, "credentialType", "Must match verificationStatus.");
  }
  if (record.attested != null && Boolean(record.attested) !== attested) {
    pushError(errors, "attested", "Must match verificationStatus.");
  }

  const issuer = record.issuer;
  if (!issuer || typeof issuer !== "object") {
    pushError(errors, "issuer", "Must be an object.");
  } else {
    const kind = attested ? ISSUER_KIND.CONTRACT_OWNER : ISSUER_KIND.SELF;
    if (issuer.kind !== kind) {
      pushError(errors, "issuer.kind", `Must be "${kind}" for this credential type.`);
    }
    if (issuer.address) {
      if (!isAddress(issuer.address)) {
        pushError(errors, "issuer.address", "Must be a lowercase 0x-prefixed 40-hex address or empty.");
      }
    }
    if (!attested && record.walletAddress && issuer.address && issuer.address !== record.walletAddress) {
      pushError(errors, "issuer.address", "Self-claimed issuer must be the learner wallet.");
    }
  }

  if (typeof record.metadataUri !== "string") {
    pushError(errors, "metadataUri", "Must be a string.");
  }

  const version = record.version;
  if (!version || typeof version !== "object") {
    pushError(errors, "version", "Must be an object.");
  } else {
    if (version.schema !== record.schemaVersion || !isSchemaVersion(version.schema)) {
      pushError(errors, "version.schema", "Must match schemaVersion and be an integer >= 1.");
    }
    if (typeof version.eip712 !== "string" || !EIP712_VERSION_RE.test(version.eip712)) {
      pushError(errors, "version.eip712", 'Must be a numeric string such as "1".');
    }
    if (typeof version.standard !== "string" || version.standard.trim() !== CREDENTIAL_STANDARD) {
      pushError(errors, "version.standard", `Must be "${CREDENTIAL_STANDARD}".`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function isCredentialRecord(value) {
  return validateCredentialRecord(value).ok;
}

/**
 * Canonical Forjora credential record (schema v1). On-chain standard remains SkillForgeCredential.
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
  const mask = toBigInt(puzzleMask);
  const boundedMask = mask > BigInt(PUZZLE_MASK_MAX) ? mask & BigInt(PUZZLE_MASK_MAX) : mask;
  const pieces = puzzlePieceCount(boundedMask);
  const learner = normalizeAddress(walletAddress) || "";
  const issuer = normalizeAddress(issuerAddress) || "";
  const isAttested = Boolean(attested);
  const expected = expectedTypePair(isAttested);
  const credentialId = id.toString();
  const points = Number(typeof totalPoints === "bigint" ? totalPoints.toString() : totalPoints);
  const safePoints = Number.isInteger(points) && points > 0 ? points : 0;
  const minted = toUnixSeconds(mintedAt);
  const safeMinted = isUnixSeconds(minted) ? minted : 0;
  const chain = resolveChainId(chainId);
  const imageUri = image == null ? "" : String(image);
  const contract = normalizeAddress(contractAddress) || "";

  return {
    schemaVersion: CREDENTIAL_SCHEMA_VERSION,
    credentialId,
    walletAddress: learner,
    score: {
      totalPoints: safePoints,
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
      puzzleMask: boundedMask.toString(),
      puzzlePieces: pieces,
      puzzleTotal: TOTAL_PIECES,
      puzzleComplete: pieces >= TOTAL_PIECES,
      mintedAt: safeMinted,
      mintedAtIso: toIsoTimestamp(safeMinted),
    },
    credentialType: expected.credentialType,
    verificationStatus: expected.verificationStatus,
    issuer: isAttested
      ? { kind: expected.issuerKind, address: issuer }
      : { kind: expected.issuerKind, address: learner },
    metadataUri: metadataUri == null ? "" : String(metadataUri),
    contractAddress: contract,
    chainId: chain,
    version: {
      schema: CREDENTIAL_SCHEMA_VERSION,
      eip712: CREDENTIAL_EIP712_VERSION,
      standard: CREDENTIAL_STANDARD,
    },
    imageUri,
    explorerUrl: typeof explorerUrl === "string" ? explorerUrl : "",
    tokenId: credentialId,
    totalPoints: safePoints,
    puzzleMask: boundedMask.toString(),
    easyCorrect: easy.correct,
    mediumCorrect: medium.correct,
    hardCorrect: hard.correct,
    mintedAt: safeMinted,
    attested: isAttested,
    image: imageUri,
  };
}
