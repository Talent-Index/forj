import { getAddress, isAddress, zeroAddress } from "viem";
import { MAX_POINTS } from "../data/questions.js";
import { isStableMediaUri } from "./credentialMetadata.js";
import { SCORE_MAX_PER_DIFFICULTY, PUZZLE_MASK_MAX } from "./credentialModel.js";
import { normalizeAddress } from "./progress.js";

export const PUBLIC_ENV_KEYS = Object.freeze([
  "VITE_CREDENTIAL_CONTRACT",
  "VITE_CREDENTIAL_IMAGE_URI",
  "VITE_FUJI_RPC_URL",
  "VITE_CREDENTIAL_DEPLOY_BLOCK",
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_FIREBASE_MEASUREMENT_ID",
  "VITE_FIREBASE_APPCHECK_SITE_KEY",
  "VITE_GOOGLE_CLIENT_ID",
]);

export const DEFAULT_FUJI_RPC = "https://avalanche-fuji-c-chain.publicnode.com";
export const DEFAULT_C_CHAIN_RPC = "https://api.avax.network/ext/bc/C/rpc";
export const SNOWTRACE_ORIGIN = "https://testnet.snowtrace.io";
export const IPFS_GATEWAY_ORIGIN = "https://ipfs.io";

const EXTERNAL_HREF_HOSTS = new Set([
  "testnet.snowtrace.io",
  "ipfs.io",
  "build.avax.network",
  "www.avax.network",
  "avax.network",
  "core.app",
  "www.core.app",
]);

const SECRET_NAME = /^(VITE_)?(PRIVATE_KEY|PINATA_JWT|MNEMONIC|SECRET|AWS_SECRET)/i;
const PRIVATE_HOST = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/i;
const C_CHAIN_RPC_HOSTS = new Set(["api.avax.network"]);
const FUJI_RPC_HOSTS = new Set([
  "api.avax-test.network",
  "avalanche-fuji-c-chain.publicnode.com",
]);
const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;
const JPEG_AVATAR_RE = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/;
const PNG_AVATAR_RE = /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/;
const WEBP_AVATAR_RE = /^data:image\/webp;base64,[A-Za-z0-9+/]+=*$/;

export function isSecretEnvName(name) {
  return SECRET_NAME.test(String(name || ""));
}

export function readPublicEnv(name) {
  if (typeof name !== "string" || !name.startsWith("VITE_") || isSecretEnvName(name)) {
    return "";
  }
  if (!PUBLIC_ENV_KEYS.includes(name)) return "";
  try {
    const value = import.meta.env?.[name];
    return typeof value === "string" ? value.trim() : "";
  } catch {
    return "";
  }
}

export function parseContractAddress(raw) {
  if (typeof raw !== "string") return "";
  const value = raw.trim();
  if (!value || !isAddress(value, { strict: false })) return "";
  try {
    const checksummed = getAddress(value);
    if (checksummed === zeroAddress) return "";
    return checksummed;
  } catch {
    return "";
  }
}

function normalizeHttpsRpc(candidate) {
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:") return "";
    if (url.username || url.password) return "";
    if (!url.hostname.includes(".")) return "";
    if (PRIVATE_HOST.test(url.hostname)) return "";
    const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
    return `${url.protocol}//${url.host}${path}${url.search}`;
  } catch {
    return "";
  }
}

function hostnameOf(urlString) {
  try {
    return new URL(urlString).hostname;
  } catch {
    return "";
  }
}

export function parseFujiRpcUrl(raw, fallback = DEFAULT_FUJI_RPC) {
  for (const candidate of [String(raw || "").trim(), fallback, DEFAULT_FUJI_RPC]) {
    if (!candidate) continue;
    const normalized = normalizeHttpsRpc(candidate);
    if (!normalized) continue;
    if (C_CHAIN_RPC_HOSTS.has(hostnameOf(normalized))) continue;
    return normalized;
  }
  return DEFAULT_FUJI_RPC;
}

export function parseCChainRpcUrl(raw, fallback = DEFAULT_C_CHAIN_RPC) {
  for (const candidate of [String(raw || "").trim(), fallback, DEFAULT_C_CHAIN_RPC]) {
    if (!candidate) continue;
    const normalized = normalizeHttpsRpc(candidate);
    if (!normalized) continue;
    const host = hostnameOf(normalized);
    if (FUJI_RPC_HOSTS.has(host) || host.includes("fuji")) continue;
    return normalized;
  }
  return DEFAULT_C_CHAIN_RPC;
}

export function parseDeployBlock(raw) {
  const value = String(raw || "").trim();
  if (!/^[0-9]{1,20}$/.test(value)) return 0n;
  try {
    const block = BigInt(value);
    if (block > 2n ** 63n) return 0n;
    return block;
  } catch {
    return 0n;
  }
}

export function isTxHash(value) {
  return typeof value === "string" && TX_HASH_RE.test(value);
}

export function isSameOriginAssetPath(value) {
  return typeof value === "string"
    && value.startsWith("/")
    && !value.startsWith("//")
    && !value.includes("\\")
    && !value.includes(":")
    && value.length < 512;
}

export function safeAvatarSrc(url) {
  if (typeof url !== "string" || !url || url.length > 500_000) return "";
  const compact = url.replace(/\s+/g, "");
  if (JPEG_AVATAR_RE.test(compact) || PNG_AVATAR_RE.test(compact) || WEBP_AVATAR_RE.test(compact)) {
    return url;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return "";
    if (parsed.username || parsed.password) return "";
    if (!parsed.hostname.includes(".")) return "";
    if (PRIVATE_HOST.test(parsed.hostname)) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

export function safeMediaSrc(url) {
  if (typeof url !== "string" || !url) return "";
  if (isSameOriginAssetPath(url)) return url;
  const avatar = safeAvatarSrc(url);
  if (avatar) return avatar;
  if (!isStableMediaUri(url)) return "";
  if (url.startsWith("ipfs://")) {
    const cid = url.slice("ipfs://".length).split("/")[0];
    if (!cid) return "";
    return `${IPFS_GATEWAY_ORIGIN}/ipfs/${url.slice("ipfs://".length)}`;
  }
  return url;
}

export function safeExternalHref(value) {
  if (typeof value !== "string" || !value) return "";
  if (isSameOriginAssetPath(value) && (value === "/credential" || value.startsWith("/credential/"))) {
    return value;
  }
  if (value.startsWith("data:application/json;base64,") && value.length > 28) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    if (url.username || url.password) return "";
    if (EXTERNAL_HREF_HOSTS.has(url.hostname)) return url.toString();
    return "";
  } catch {
    return "";
  }
}

export function isCredentialShareUrl(value, origin = "") {
  try {
    const url = new URL(String(value || ""), origin || "https://forjora.invalid");
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (url.username || url.password) return false;
    return url.pathname === "/credential" || url.pathname.startsWith("/credential/");
  } catch {
    return false;
  }
}

export function sanitizePlainText(value, max = 48) {
  if (typeof value !== "string") return "";
  return Array.from(value)
    .filter((ch) => ch.charCodeAt(0) >= 32 && ch !== "<" && ch !== ">")
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function asScoreCount(value) {
  const n = typeof value === "bigint" ? Number(value) : Number(value);
  if (!Number.isInteger(n) || n < 0 || n > SCORE_MAX_PER_DIFFICULTY) return null;
  return n;
}

export function validateMintParams({
  totalPoints,
  puzzleMask,
  easyCorrect,
  mediumCorrect,
  hardCorrect,
  imageData = "",
} = {}) {
  const points = typeof totalPoints === "bigint" ? Number(totalPoints) : Number(totalPoints);
  const mask = typeof puzzleMask === "bigint" ? Number(puzzleMask) : Number(puzzleMask);
  const easy = asScoreCount(easyCorrect);
  const medium = asScoreCount(mediumCorrect);
  const hard = asScoreCount(hardCorrect);
  const image = imageData == null ? "" : String(imageData);

  if (!Number.isInteger(points) || points < 1 || points > MAX_POINTS) {
    return { ok: false, error: "Score is outside the quiz maximum." };
  }
  if (!Number.isInteger(mask) || mask < 1 || mask > PUZZLE_MASK_MAX) {
    return { ok: false, error: "Puzzle completion is invalid." };
  }
  if (easy == null || medium == null || hard == null) {
    return { ok: false, error: "Quiz counts are invalid." };
  }
  if (image && !isStableMediaUri(image)) {
    return { ok: false, error: "Artwork must be a short ipfs:// or https:// URI." };
  }
  return {
    ok: true,
    values: {
      totalPoints: points,
      puzzleMask: mask,
      easyCorrect: easy,
      mediumCorrect: medium,
      hardCorrect: hard,
      imageData: image,
    },
  };
}

export function matchingWalletAccount(account, expectedAccount) {
  const from = normalizeAddress(account);
  const expected = normalizeAddress(expectedAccount);
  if (!from) return "";
  if (expected && from !== expected) return "";
  return from;
}
