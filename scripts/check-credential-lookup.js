import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCredentialRecord } from "../src/utils/credentialModel.js";
import {
  VERIFICATION_FIELDS,
  VERIFICATION_LABELS,
  buildCredentialVerificationView,
  evaluateCredentialVerification,
  lookupQueryString,
  lookupShareUrl,
  parseCredentialLocation,
  parseLookupQuery,
  publicCredentialPath,
} from "../src/utils/credentialLookup.js";
import { EXPLORER_LINK_LABEL, hasAmbiguousTrustLanguage } from "../src/utils/credentialStatus.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const WALLET = `0x${"a".repeat(40)}`;
const OWNER = `0x${"b".repeat(40)}`;
const CONTRACT = "0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df";

assert.deepEqual(VERIFICATION_FIELDS, [
  "title",
  "holderWallet",
  "score",
  "difficulty",
  "status",
  "issuer",
  "network",
  "contractAddress",
  "tokenId",
  "transactionHash",
  "explorerUrl",
  "metadataUrl",
]);
assert.deepEqual(Object.keys(VERIFICATION_LABELS), VERIFICATION_FIELDS);
assert.deepEqual(Object.values(VERIFICATION_LABELS), [
  "Credential title",
  "Holder wallet",
  "Score",
  "Difficulty",
  "Credential status",
  "Issuer",
  "Network",
  "Contract address",
  "Token ID",
  "Transaction hash",
  "Explorer link",
  "Metadata link",
]);

assert.deepEqual(parseLookupQuery("?token=7&wallet=0xAAAAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"), {
  tokenId: "7",
  wallet: WALLET,
});
assert.deepEqual(parseLookupQuery("token=0"), { tokenId: "", wallet: "" });
assert.equal(lookupQueryString({ tokenId: "7", wallet: WALLET }), `?token=7&wallet=${WALLET}`);
assert.equal(publicCredentialPath({ tokenId: "3" }), "/credential/3");
assert.equal(publicCredentialPath({ wallet: WALLET }), `/credential?wallet=${WALLET}`);
assert.equal(publicCredentialPath({ tokenId: "3", wallet: WALLET }), `/credential/3?wallet=${WALLET}`);
assert.equal(lookupShareUrl({ tokenId: "3" }, "https://skillforge.example"), "https://skillforge.example/credential/3");
assert.equal(
  lookupShareUrl({ tokenId: "3", wallet: WALLET }, "https://skillforge.example"),
  `https://skillforge.example/credential/3?wallet=${WALLET}`
);

assert.deepEqual(parseCredentialLocation("/credential/4", ""), {
  isPublicRoute: true,
  tokenId: "4",
  wallet: "",
  invalidPathId: false,
});
assert.deepEqual(parseCredentialLocation("/credential/nope", ""), {
  isPublicRoute: true,
  tokenId: "",
  wallet: "",
  invalidPathId: true,
});
assert.deepEqual(parseCredentialLocation("/", "?token=9"), {
  isPublicRoute: true,
  tokenId: "9",
  wallet: "",
  invalidPathId: false,
});
assert.equal(parseCredentialLocation("/about", "").isPublicRoute, false);

const claimed = buildCredentialRecord({
  tokenId: 7,
  walletAddress: WALLET,
  totalPoints: 80,
  puzzleMask: 0xffff,
  easyCorrect: 5,
  mediumCorrect: 5,
  hardCorrect: 5,
  contractAddress: CONTRACT,
  metadataUri: "data:application/json;base64,e30=",
  explorerUrl: `https://testnet.snowtrace.io/token/${CONTRACT}?a=7`,
});
const claimedView = buildCredentialVerificationView(claimed, {
  transactionHash: `0x${"c".repeat(64)}`,
});

for (const field of VERIFICATION_FIELDS) {
  assert.equal(field in claimedView, true, `missing ${field}`);
  assert.notEqual(claimedView[field], undefined);
}
assert.equal(claimedView.title, "SkillForge Avalanche Credential #7");
assert.equal(claimedView.holderWallet, WALLET);
assert.equal(claimedView.score, 80);
assert.equal(claimedView.scoreLabel, "80 pts");
assert.equal(claimedView.difficulty, "Hard");
assert.match(claimedView.difficultyDetail, /Easy 5\/5/);
assert.equal(claimedView.status, "Self-claimed");
assert.equal(claimedView.statusId, "claimed");
assert.match(claimedView.issuer, /Learner/);
assert.equal(claimedView.network, "Avalanche Fuji");
assert.equal(claimedView.chainId, 43113);
assert.equal(claimedView.contractAddress, CONTRACT.toLowerCase());
assert.equal(claimedView.tokenId, "7");
assert.equal(claimedView.transactionHash.startsWith("0x"), true);
assert.match(claimedView.explorerUrl, /token/);
assert.equal(claimedView.explorerLabel, EXPLORER_LINK_LABEL);
assert.equal(claimedView.metadataUrl.startsWith("data:application/json"), true);
assert.equal(hasAmbiguousTrustLanguage(claimedView.status), false);
assert.equal(hasAmbiguousTrustLanguage(claimedView.statusBody), false);
assert.equal(claimedView.verification.onChain, true);
assert.equal(claimedView.verification.ownership, "on-chain");
assert.equal(claimedView.verification.statusId, "claimed");
assert.match(claimedView.verification.summary, /On-chain record/);
assert.equal(hasAmbiguousTrustLanguage(claimedView.verification.summary), false);
assert.equal(claimedView.metadata.name, claimedView.title);

const missing = evaluateCredentialVerification(null);
assert.equal(missing.found, false);
assert.equal(missing.onChain, false);
assert.equal(missing.statusLabel, "Not found");
assert.equal(evaluateCredentialVerification(claimed, { wallet: WALLET }).ownership, "match");
assert.equal(evaluateCredentialVerification(claimed, { wallet: OWNER }).ownership, "mismatch");

const attested = buildCredentialRecord({
  tokenId: 2,
  walletAddress: WALLET,
  totalPoints: 15,
  puzzleMask: 1,
  easyCorrect: 5,
  attested: true,
  issuerAddress: OWNER,
  contractAddress: CONTRACT,
});
const attestedView = buildCredentialVerificationView(attested);
assert.equal(attestedView.status, "Issuer-attested");
assert.match(attestedView.issuer, /Contract owner/);
assert.equal(attestedView.transactionHash, "");
assert.equal(attestedView.difficulty, "Easy");

const page = readFileSync(join(root, "src/components/pages/CredentialLookupPage.jsx"), "utf8");
assert.match(page, /Credential lookup/);
assert.match(page, /Credential verification/);
assert.match(page, /Public credential verification/);
assert.match(page, /Verification state/);
assert.match(page, /Shareable URL/);
assert.match(page, /CredentialQr/);
assert.match(page, /not-found/);
assert.match(page, /owner-mismatch/);
assert.match(page, /EMPTY_STATES\.noLookup/);
assert.doesNotMatch(page, /Verify on Snowtrace/);
assert.doesNotMatch(page, /verifiable on-chain/i);
assert.match(page, /does not make a self-claimed score issuer-attested/);

const app = readFileSync(join(root, "src/App.jsx"), "utf8");
assert.match(app, /parseCredentialLocation/);
assert.match(app, /publicCredentialPath/);
assert.match(app, /\/credential/);

const qr = readFileSync(join(root, "src/components/CredentialQr.jsx"), "utf8");
assert.match(qr, /qrcode/);
assert.match(qr, /QR code/);

const details = readFileSync(join(root, "src/components/CredentialDetails.jsx"), "utf8");
assert.match(details, /VERIFICATION_LABELS/);
assert.match(details, /VERIFICATION_FIELDS/);
assert.match(details, /Credential verification/);
for (const field of VERIFICATION_FIELDS) {
  assert.match(details, new RegExp(`case "${field}"`));
}

console.log("credential lookup tests passed");
