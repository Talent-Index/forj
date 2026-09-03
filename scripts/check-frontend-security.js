import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { zeroAddress } from "viem";
import {
  DEFAULT_C_CHAIN_RPC,
  DEFAULT_FUJI_RPC,
  PUBLIC_ENV_KEYS,
  isCredentialShareUrl,
  isSecretEnvName,
  isTxHash,
  parseContractAddress,
  parseCChainRpcUrl,
  parseDeployBlock,
  parseFujiRpcUrl,
  readPublicEnv,
  safeAvatarSrc,
  safeExternalHref,
  safeMediaSrc,
  sanitizePlainText,
  validateMintParams,
} from "../src/utils/frontendSecurity.js";
import { buildMintData, CONTRACT_ADDRESS, prepareClaimedMint } from "../src/utils/contract.js";
import { isAllowedWalletId, WALLET_IDS, walletDeepLink } from "../src/utils/wallet.js";
import { normalizeAddress } from "../src/utils/progress.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = join(root, "src");

function walkJs(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkJs(full));
    else if (/\.(js|jsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const srcBlob = walkJs(srcRoot).map((file) => readFileSync(file, "utf8")).join("\n");
const envExample = readFileSync(join(root, ".env.example"), "utf8");
const viteConfig = readFileSync(join(root, "vite.config.js"), "utf8");
const certificate = readFileSync(join(root, "src/components/Certificate.jsx"), "utf8");

assert.match(viteConfig, /envPrefix: "VITE_"/);
assert.ok(viteConfig.length < 2000, "vite.config.js is unexpectedly large");
assert.doesNotMatch(viteConfig, /_0x[0-9a-f]{4}/i);
assert.doesNotMatch(viteConfig, /eval\s*\(/);
assert.doesNotMatch(viteConfig, /child_process|createRequire|spawn\s*\(/);
assert.doesNotMatch(srcBlob, /import\.meta\.env\.(VITE_)?(PRIVATE_KEY|PINATA_JWT)/);
assert.doesNotMatch(envExample, /VITE_PRIVATE_KEY/);
assert.doesNotMatch(envExample, /VITE_PINATA/);
assert.match(envExample, /^PRIVATE_KEY=/m);
assert.match(envExample, /^PINATA_JWT=/m);
assert.match(envExample, /^AVALANCHE_RPC_URL=/m);
assert.doesNotMatch(envExample, /VITE_AVALANCHE/);
assert.match(envExample, /Never prefix this with VITE_/);

assert.equal(isSecretEnvName("PRIVATE_KEY"), true);
assert.equal(isSecretEnvName("VITE_PRIVATE_KEY"), true);
assert.equal(isSecretEnvName("PINATA_JWT"), true);
assert.equal(isSecretEnvName("VITE_CREDENTIAL_CONTRACT"), false);
assert.equal(readPublicEnv("PRIVATE_KEY"), "");
assert.equal(readPublicEnv("VITE_PRIVATE_KEY"), "");
assert.equal(PUBLIC_ENV_KEYS.every((key) => key.startsWith("VITE_")), true);
assert.equal(PUBLIC_ENV_KEYS.includes("VITE_FIREBASE_APPCHECK_SITE_KEY"), true);

const live = "0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df";
assert.equal(parseContractAddress(live).toLowerCase(), live.toLowerCase());
assert.equal(parseContractAddress(zeroAddress), "");
assert.equal(parseContractAddress("not-an-address"), "");
assert.equal(parseContractAddress("0x123"), "");
assert.equal(parseContractAddress(""), "");

const allowedRpc = parseFujiRpcUrl(DEFAULT_FUJI_RPC);
assert.equal(parseFujiRpcUrl(""), allowedRpc);
assert.equal(parseFujiRpcUrl("http://evil.example/rpc"), allowedRpc);
assert.equal(parseFujiRpcUrl("javascript:alert(1)"), allowedRpc);
assert.equal(parseFujiRpcUrl("https://user:pass@evil.example/rpc"), allowedRpc);
assert.equal(parseFujiRpcUrl("https://127.0.0.1/rpc"), allowedRpc);
assert.match(allowedRpc, /^https:\/\/avalanche-fuji-c-chain\.publicnode\.com$/);
assert.equal(parseFujiRpcUrl(DEFAULT_C_CHAIN_RPC), allowedRpc);
assert.equal(parseFujiRpcUrl("https://api.avax.network/ext/bc/C/rpc"), allowedRpc);
assert.match(parseCChainRpcUrl(""), /api\.avax\.network/);
assert.equal(parseCChainRpcUrl("https://api.avax-test.network/ext/bc/C/rpc"), parseCChainRpcUrl(DEFAULT_C_CHAIN_RPC));
assert.equal(parseCChainRpcUrl("https://avalanche-fuji-c-chain.publicnode.com"), parseCChainRpcUrl(DEFAULT_C_CHAIN_RPC));

assert.equal(parseDeployBlock(""), 0n);
assert.equal(parseDeployBlock("12"), 12n);
assert.equal(parseDeployBlock("-1"), 0n);
assert.equal(parseDeployBlock("0x10"), 0n);

assert.equal(isTxHash(`0x${"ab".repeat(32)}`), true);
assert.equal(isTxHash("0x123"), false);
assert.equal(isAllowedWalletId(WALLET_IDS.metamask), true);
assert.equal(isAllowedWalletId("phantom"), false);
assert.equal(normalizeAddress(`0x${"A".repeat(40)}`), `0x${"a".repeat(40)}`);
assert.match(walletDeepLink(WALLET_IDS.metamask, "javascript:alert(1)"), /metamask\.io/);

assert.equal(validateMintParams({
  totalPoints: 15,
  puzzleMask: 1,
  easyCorrect: 5,
  mediumCorrect: 0,
  hardCorrect: 0,
  imageData: "",
}).ok, true);
assert.equal(validateMintParams({
  totalPoints: 81,
  puzzleMask: 1,
  easyCorrect: 5,
  mediumCorrect: 0,
  hardCorrect: 0,
}).ok, false);
assert.throws(() => buildMintData({
  totalPoints: 0,
  puzzleMask: 1,
  easyCorrect: 0,
  mediumCorrect: 0,
  hardCorrect: 0,
}));

const prepared = prepareClaimedMint({
  account: live,
  expectedAccount: live,
  chainId: 43113,
  totalPoints: 15,
  puzzleMask: 1,
  easyCorrect: 5,
  mediumCorrect: 0,
  hardCorrect: 0,
  imageData: "",
});
if (CONTRACT_ADDRESS) {
  assert.equal(prepared.ok, true);
  assert.equal(prepared.value, 0n);
  assert.equal(prepared.to, CONTRACT_ADDRESS);
} else {
  assert.equal(prepared.ok, false);
}

assert.equal(prepareClaimedMint({
  account: live,
  expectedAccount: live,
  chainId: 43114,
  totalPoints: 15,
  puzzleMask: 1,
  easyCorrect: 5,
  mediumCorrect: 0,
  hardCorrect: 0,
}).ok, false);

assert.equal(prepareClaimedMint({
  account: live,
  expectedAccount: live,
  chainId: 1,
  totalPoints: 15,
  puzzleMask: 1,
  easyCorrect: 5,
  mediumCorrect: 0,
  hardCorrect: 0,
}).ok, false);

assert.equal(prepareClaimedMint({
  account: live,
  expectedAccount: `0x${"b".repeat(40)}`,
  chainId: 43113,
  totalPoints: 15,
  puzzleMask: 1,
  easyCorrect: 5,
  mediumCorrect: 0,
  hardCorrect: 0,
}).ok, false);

assert.equal(safeExternalHref("javascript:alert(1)"), "");
assert.equal(safeExternalHref("https://evil.example/phish"), "");
assert.match(safeExternalHref("https://testnet.snowtrace.io/tx/0xabc"), /snowtrace/);
assert.match(safeExternalHref("https://build.avax.network/docs"), /build\.avax/);
assert.match(safeExternalHref("https://core.app/tools/testnet-faucet/"), /core\.app/);
assert.equal(safeMediaSrc("javascript:alert(1)"), "");
assert.equal(safeMediaSrc("/src/assets/forge-certificate.jpg"), "/src/assets/forge-certificate.jpg");
assert.equal(safeAvatarSrc("data:image/svg+xml,<svg></svg>"), "");
assert.equal(safeAvatarSrc("data:image/jpeg;base64,aaaa").startsWith("data:image/jpeg"), true);
assert.equal(isCredentialShareUrl("https://skillforge.example/credential/1"), true);
assert.equal(isCredentialShareUrl("https://skillforge.example/admin"), false);
assert.equal(sanitizePlainText("<Ada>"), "Ada");

assert.doesNotMatch(srcBlob, /dangerouslySetInnerHTML/);
assert.doesNotMatch(srcBlob, /from ["']firebase\/analytics["']/);
assert.doesNotMatch(srcBlob, /\bgetAnalytics\b/);
assert.match(certificate, /prepareClaimedMint/);
assert.match(certificate, /value: prepared\.value/);
assert.doesNotMatch(certificate, /VITE_CREDENTIAL_CONTRACT/);
assert.doesNotMatch(certificate, /npm run deploy/);

const audit = spawnSync("npm", ["audit", "--omit=dev", "--audit-level=high"], {
  encoding: "utf8",
  cwd: root,
});
assert.equal(audit.status, 0, audit.stdout || audit.stderr || "npm audit failed");

console.log("frontend security checks passed");
