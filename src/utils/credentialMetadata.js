export const METADATA_SCHEMA_VERSION = 1;
export const METADATA_STANDARD = "SkillForgeCredential";
export const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

export const TOKEN_NAME_PREFIX = "SkillForge Avalanche Credential #";
export const DESCRIPTION = {
  claimed: "Self-claimed SkillForge score record on Avalanche.",
  attested: "Issuer-attested SkillForge credential on Avalanche.",
};

export const ATTRIBUTE = {
  TOTAL_POINTS: "Total Points",
  PUZZLE_PIECES: "Puzzle Pieces",
  EASY: "Easy Correct",
  MEDIUM: "Medium Correct",
  HARD: "Hard Correct",
  ATTESTATION: "Attestation",
};

export const ATTESTATION_VALUE = {
  claimed: "Self claimed",
  attested: "Issuer attested",
};

export const REQUIRED_METADATA_FIELDS = ["name", "description", "attributes"];
export const REQUIRED_TRAITS = [
  ATTRIBUTE.TOTAL_POINTS,
  ATTRIBUTE.PUZZLE_PIECES,
  ATTRIBUTE.EASY,
  ATTRIBUTE.MEDIUM,
  ATTRIBUTE.HARD,
  ATTRIBUTE.ATTESTATION,
];

const UNSTABLE_HOSTS = new Set([
  "images.unsplash.com",
  "source.unsplash.com",
  "picsum.photos",
  "placekitten.com",
  "via.placeholder.com",
]);
const CID_V0 = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
const CID_V1 = /^baf[a-z2-7]{20,}$/;
const DATA_JSON_BASE64 = "data:application/json;base64,";

function hasUnsafeChars(uri) {
  return /["\\\s]/.test(uri) || Array.from(uri).some((ch) => ch.charCodeAt(0) < 32);
}

export function parseIpfsCid(uri) {
  if (typeof uri !== "string" || !uri.startsWith("ipfs://")) return null;
  const cid = uri.slice("ipfs://".length).split("/")[0];
  if (CID_V0.test(cid) || CID_V1.test(cid)) return cid;
  return null;
}

export function isStableMediaUri(uri) {
  if (typeof uri !== "string" || !uri || hasUnsafeChars(uri)) return false;
  if (parseIpfsCid(uri)) return true;
  try {
    const url = new URL(uri);
    if (url.protocol !== "https:") return false;
    if (!url.hostname.includes(".")) return false;
    if (url.username || url.password) return false;
    if (UNSTABLE_HOSTS.has(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export function isMetadataUri(uri) {
  if (typeof uri !== "string" || !uri) return false;
  if (uri.startsWith(DATA_JSON_BASE64) && uri.length > DATA_JSON_BASE64.length) return true;
  return isStableMediaUri(uri);
}

export function ipfsToHttps(uri, gateway = IPFS_GATEWAY) {
  const cid = parseIpfsCid(uri);
  if (!cid) return "";
  const rest = uri.slice("ipfs://".length + cid.length);
  return `${gateway}${cid}${rest}`;
}

export function retrievalUrl(uri) {
  if (!uri || typeof uri !== "string") return "";
  if (uri.startsWith(DATA_JSON_BASE64)) return uri;
  if (uri.startsWith("ipfs://")) return ipfsToHttps(uri);
  if (isStableMediaUri(uri)) return uri;
  return "";
}

function decodeBase64(value) {
  if (typeof Buffer !== "undefined") return Buffer.from(value, "base64").toString("utf8");
  return atob(value);
}

function encodeBase64(value) {
  if (typeof Buffer !== "undefined") return Buffer.from(value, "utf8").toString("base64");
  return btoa(value);
}

export function decodeTokenUri(uri) {
  if (typeof uri !== "string" || !uri.startsWith(DATA_JSON_BASE64)) return null;
  try {
    return JSON.parse(decodeBase64(uri.slice(DATA_JSON_BASE64.length)));
  } catch {
    return null;
  }
}

export function encodeTokenUri(metadata) {
  return `${DATA_JSON_BASE64}${encodeBase64(JSON.stringify(metadata))}`;
}

function trait(type, value) {
  return { trait_type: type, value };
}

export function buildCredentialMetadata({
  tokenId,
  attested = false,
  totalPoints,
  puzzlePieces,
  easyCorrect = 0,
  mediumCorrect = 0,
  hardCorrect = 0,
  image = "",
  externalUrl = "",
} = {}) {
  const id = String(tokenId ?? "");
  const status = attested ? "attested" : "claimed";
  const metadata = {
    name: `${TOKEN_NAME_PREFIX}${id}`,
    description: DESCRIPTION[status],
    attributes: [
      trait(ATTRIBUTE.TOTAL_POINTS, Number(totalPoints) || 0),
      trait(ATTRIBUTE.PUZZLE_PIECES, Number(puzzlePieces) || 0),
      trait(ATTRIBUTE.EASY, Number(easyCorrect) || 0),
      trait(ATTRIBUTE.MEDIUM, Number(mediumCorrect) || 0),
      trait(ATTRIBUTE.HARD, Number(hardCorrect) || 0),
      trait(ATTRIBUTE.ATTESTATION, ATTESTATION_VALUE[status]),
    ],
  };
  if (image) metadata.image = image;
  if (externalUrl) metadata.external_url = externalUrl;
  return metadata;
}

function attrValue(metadata, type) {
  const row = (metadata.attributes || []).find((item) => item?.trait_type === type);
  return row?.value;
}

export function validateCredentialMetadata(metadata) {
  const errors = [];
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return { ok: false, errors: [{ field: ".", message: "Metadata must be an object." }] };
  }
  for (const field of REQUIRED_METADATA_FIELDS) {
    if (!(field in metadata)) errors.push({ field, message: "Required field is missing." });
  }
  if (typeof metadata.name !== "string" || !metadata.name.startsWith(TOKEN_NAME_PREFIX)) {
    errors.push({ field: "name", message: `Must start with "${TOKEN_NAME_PREFIX}".` });
  }
  if (metadata.description !== DESCRIPTION.claimed && metadata.description !== DESCRIPTION.attested) {
    errors.push({ field: "description", message: "Must be the claimed or attested SkillForge description." });
  }
  if (metadata.image != null && metadata.image !== "" && !isStableMediaUri(metadata.image)) {
    errors.push({ field: "image", message: "Must be ipfs:// CID or https:// with no quotes." });
  }
  if (metadata.external_url != null && metadata.external_url !== "" && !isStableMediaUri(metadata.external_url)) {
    errors.push({ field: "external_url", message: "Must be a stable HTTPS URL." });
  }
  if (!Array.isArray(metadata.attributes)) {
    errors.push({ field: "attributes", message: "Must be an array." });
  } else {
    for (const type of REQUIRED_TRAITS) {
      if (!metadata.attributes.some((item) => item?.trait_type === type)) {
        errors.push({ field: "attributes", message: `Missing trait "${type}".` });
      }
    }
    const attestation = attrValue(metadata, ATTRIBUTE.ATTESTATION);
    if (attestation !== ATTESTATION_VALUE.claimed && attestation !== ATTESTATION_VALUE.attested) {
      errors.push({ field: "attributes.Attestation", message: "Must be Self claimed or Issuer attested." });
    }
    const attested = attestation === ATTESTATION_VALUE.attested;
    if (attested && metadata.description !== DESCRIPTION.attested) {
      errors.push({ field: "description", message: "Attested traits must use the attested description." });
    }
    if (!attested && metadata.description === DESCRIPTION.attested) {
      errors.push({ field: "description", message: "Claimed traits must use the claimed description." });
    }
  }
  return { ok: errors.length === 0, errors };
}

export function retrieveMetadata(uri) {
  const decoded = decodeTokenUri(uri);
  if (decoded) return { ok: true, source: "data", metadata: decoded, retrievalUrl: uri };
  const url = retrievalUrl(uri);
  if (!url) return { ok: false, source: "", metadata: null, retrievalUrl: "", error: "Unsupported metadata URI." };
  return { ok: true, source: uri.startsWith("ipfs://") ? "ipfs" : "https", metadata: null, retrievalUrl: url };
}
