import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_POINTS, TOTAL_PIECES } from "../src/data/questions.js";
import { mapOnChainCredential } from "../src/utils/credential.js";
import {
  CREDENTIAL_EIP712_VERSION,
  CREDENTIAL_RECORD_FIELDS,
  CREDENTIAL_SCHEMA_VERSION,
  CREDENTIAL_STANDARD,
  CREDENTIAL_TYPE,
  ISSUER_KIND,
  OPTIONAL_FIELDS,
  REQUIRED_FIELDS,
  VERIFICATION_STATUS,
  buildCredentialRecord,
  canTransitionVerification,
  credentialIdsAreUnique,
  currentCredentialIdByWallet,
  describeMetadataUri,
  isAddress,
  isChainId,
  isCredentialId,
  isCredentialRecord,
  isUnixSeconds,
  puzzlePieceCount,
  toIsoTimestamp,
  validateCredentialRecord,
} from "../src/utils/credentialModel.js";
import { FUJI_CHAIN_ID } from "../src/utils/wallet.js";

const WALLET = `0x${"a".repeat(40)}`;
const OWNER = `0x${"b".repeat(40)}`;
const CONTRACT = "0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df";

assert.equal(CREDENTIAL_SCHEMA_VERSION, 1);
assert.equal(CREDENTIAL_EIP712_VERSION, "1");
assert.equal(CREDENTIAL_STANDARD, "SkillForgeCredential");
assert.deepEqual(CREDENTIAL_RECORD_FIELDS, [
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
]);

const doc = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../docs/CREDENTIAL.md"),
  "utf8"
);
assert.match(doc, /Schema version:\*\* `1`/);
assert.match(doc, /credentialId/);
assert.match(doc, /walletAddress/);
assert.match(doc, /score/);
assert.match(doc, /difficulty/);
assert.match(doc, /completion/);
assert.match(doc, /credentialType/);
assert.match(doc, /verificationStatus/);
assert.match(doc, /issuer/);
assert.match(doc, /metadataUri/);
assert.match(doc, /contractAddress/);
assert.match(doc, /chainId/);
assert.match(doc, /version/);
assert.match(doc, /CREDENTIAL_SCHEMA_VERSION/);

assert.equal(puzzlePieceCount(0), 0);
assert.equal(puzzlePieceCount(1n), 1);
assert.equal(puzzlePieceCount(3n), 2);
assert.equal(puzzlePieceCount(0xffff), 16);
assert.equal(puzzlePieceCount("15"), 4);
assert.equal(describeMetadataUri("data:application/json;base64,abc"), "On-chain ERC-721 JSON (data URI)");

assert.equal(buildCredentialRecord({ tokenId: 0 }), null);
assert.equal(buildCredentialRecord({ tokenId: 0n }), null);

const claimed = buildCredentialRecord({
  tokenId: 7n,
  walletAddress: WALLET,
  totalPoints: 80n,
  puzzleMask: 15n,
  easyCorrect: 5,
  mediumCorrect: 4,
  hardCorrect: 3,
  image: "ipfs://art",
  mintedAt: 1_700_000_000n,
  attested: false,
  contractAddress: CONTRACT,
  chainId: FUJI_CHAIN_ID,
  metadataUri: "data:application/json;base64,e30=",
});

assert.equal(isCredentialRecord(claimed), true);
for (const field of CREDENTIAL_RECORD_FIELDS) {
  assert.equal(Object.hasOwn(claimed, field), true, `missing ${field}`);
}

assert.equal(claimed.schemaVersion, 1);
assert.equal(claimed.credentialId, "7");
assert.equal(claimed.walletAddress, WALLET);
assert.equal(claimed.score.totalPoints, 80);
assert.equal(claimed.score.maxPoints, MAX_POINTS);
assert.equal(claimed.score.easyCorrect, 5);
assert.equal(claimed.difficulty.easy.complete, true);
assert.equal(claimed.difficulty.medium.complete, false);
assert.equal(claimed.difficulty.medium.points, 20);
assert.equal(claimed.difficulty.hard.points, 24);
assert.equal(claimed.completion.quizCorrect, 12);
assert.equal(claimed.completion.quizTotal, 15);
assert.equal(claimed.completion.puzzlePieces, 4);
assert.equal(claimed.completion.puzzleTotal, TOTAL_PIECES);
assert.equal(claimed.completion.puzzleMask, "15");
assert.equal(claimed.completion.mintedAt, 1_700_000_000);
assert.equal(claimed.credentialType, CREDENTIAL_TYPE.SELF_CLAIMED);
assert.equal(claimed.verificationStatus, VERIFICATION_STATUS.CLAIMED);
assert.equal(claimed.issuer.kind, ISSUER_KIND.SELF);
assert.equal(claimed.issuer.address, WALLET);
assert.equal(claimed.metadataUri.startsWith("data:application/json"), true);
assert.equal(claimed.contractAddress, CONTRACT.toLowerCase());
assert.equal(claimed.chainId, 43113);
assert.deepEqual(claimed.version, {
  schema: 1,
  eip712: "1",
  standard: "SkillForgeCredential",
});

const attested = buildCredentialRecord({
  tokenId: 2,
  walletAddress: WALLET,
  totalPoints: 15,
  puzzleMask: 1,
  easyCorrect: 5,
  attested: true,
  issuerAddress: OWNER,
  contractAddress: CONTRACT,
  chainId: 43113,
});
assert.equal(attested.credentialType, CREDENTIAL_TYPE.ISSUER_ATTESTED);
assert.equal(attested.verificationStatus, VERIFICATION_STATUS.ATTESTED);
assert.equal(attested.issuer.kind, ISSUER_KIND.CONTRACT_OWNER);
assert.equal(attested.issuer.address, OWNER);
assert.equal(attested.difficulty.easy.complete, true);
assert.equal(attested.difficulty.medium.complete, false);

const fromChain = mapOnChainCredential(
  7n,
  [80n, 15n, 5, 4, 3, "ipfs://art", 1_700_000_000n, false],
  CONTRACT,
  "https://testnet.snowtrace.io/token/",
  {
    walletAddress: WALLET,
    metadataUri: "ipfs://meta",
    chainId: 43113,
  }
);
assert.equal(isCredentialRecord(fromChain), true);
assert.equal(fromChain.walletAddress, WALLET);
assert.equal(fromChain.metadataUri, "ipfs://meta");
assert.equal(fromChain.credentialType, "self-claimed");

const clamped = buildCredentialRecord({
  tokenId: 1,
  easyCorrect: 99,
  mediumCorrect: -2,
  hardCorrect: "3",
  puzzleMask: 0x1ffff,
  totalPoints: 12,
});
assert.equal(clamped.difficulty.easy.correct, 5);
assert.equal(clamped.difficulty.medium.correct, 0);
assert.equal(clamped.difficulty.hard.correct, 3);
assert.equal(clamped.completion.puzzlePieces, 16);

assert.equal(isCredentialRecord(null), false);
assert.equal(isCredentialRecord({ tokenId: "1" }), false);

assert.deepEqual(REQUIRED_FIELDS.includes("credentialId"), true);
assert.equal(OPTIONAL_FIELDS.includes("walletAddress"), true);
assert.equal(OPTIONAL_FIELDS.includes("metadataUri"), true);
assert.equal(REQUIRED_FIELDS.includes("walletAddress"), false);

assert.equal(isAddress(WALLET), true);
assert.equal(isAddress(WALLET.toUpperCase()), false);
assert.equal(isAddress("0xabc"), false);
assert.equal(isAddress("javascript:alert(1)"), false);
assert.equal(isCredentialId("1"), true);
assert.equal(isCredentialId("0"), false);
assert.equal(isCredentialId("01"), false);
assert.equal(isCredentialId("-1"), false);
assert.equal(isChainId(43113), true);
assert.equal(isChainId("0xa869"), true);
assert.equal(isChainId(0), false);
assert.equal(isChainId(43113.5), false);
assert.equal(isChainId("fuji"), false);
assert.equal(isUnixSeconds(1_700_000_000), true);
assert.equal(isUnixSeconds(1_700_000_000_000), false);
assert.equal(toIsoTimestamp(1_700_000_000), "2023-11-14T22:13:20.000Z");
assert.equal(claimed.completion.mintedAtIso, "2023-11-14T22:13:20.000Z");

assert.equal(validateCredentialRecord(claimed, { requireWallet: true, requireContract: true }).ok, true);

const checksumWallet = buildCredentialRecord({
  tokenId: 3,
  walletAddress: "0x" + "A".repeat(40),
  totalPoints: 3,
  puzzleMask: 1,
  easyCorrect: 1,
  contractAddress: CONTRACT,
});
assert.equal(checksumWallet.walletAddress, WALLET);
assert.equal(checksumWallet.contractAddress, CONTRACT.toLowerCase());

const droppedJunk = buildCredentialRecord({
  tokenId: 4,
  walletAddress: "0xabc",
  contractAddress: "not-a-contract",
  chainId: "nope",
  totalPoints: 3,
  puzzleMask: 1,
});
assert.equal(droppedJunk.walletAddress, "");
assert.equal(droppedJunk.contractAddress, "");
assert.equal(droppedJunk.chainId, 0);
assert.equal(isCredentialRecord(droppedJunk), false);
assert.equal(validateCredentialRecord(droppedJunk, { requireWallet: true }).ok, false);

const millis = buildCredentialRecord({
  tokenId: 5,
  totalPoints: 3,
  puzzleMask: 1,
  mintedAt: 1_700_000_000_000,
});
assert.equal(millis.completion.mintedAt, 1_700_000_000);
assert.equal(millis.completion.mintedAtIso.endsWith("Z"), true);

const overScore = { ...claimed, score: { ...claimed.score, easyCorrect: 6 } };
assert.equal(validateCredentialRecord(overScore).ok, false);

const zeroPoints = { ...claimed, score: { ...claimed.score, totalPoints: 0 } };
assert.equal(validateCredentialRecord(zeroPoints).ok, false);

const mixedType = {
  ...claimed,
  credentialType: CREDENTIAL_TYPE.ISSUER_ATTESTED,
  verificationStatus: VERIFICATION_STATUS.CLAIMED,
};
assert.equal(validateCredentialRecord(mixedType).ok, false);

const badIssuer = {
  ...claimed,
  issuer: { kind: ISSUER_KIND.SELF, address: OWNER },
};
assert.equal(validateCredentialRecord(badIssuer).ok, false);

assert.equal(canTransitionVerification("none", "claimed"), true);
assert.equal(canTransitionVerification("none", "attested"), true);
assert.equal(canTransitionVerification("claimed", "attested", { sameCredentialId: true }), false);
assert.equal(canTransitionVerification("attested", "claimed", { sameCredentialId: true }), false);
assert.equal(canTransitionVerification("claimed", "attested", { sameCredentialId: false }), true);
assert.equal(canTransitionVerification("attested", "claimed", { sameCredentialId: false }), true);
assert.equal(canTransitionVerification("claimed", "none"), false);
assert.equal(canTransitionVerification("attested", "none"), false);
assert.equal(canTransitionVerification("claimed", "claimed", { sameCredentialId: true }), true);

const first = buildCredentialRecord({
  tokenId: 1,
  walletAddress: WALLET,
  totalPoints: 15,
  puzzleMask: 1,
  easyCorrect: 5,
});
const remint = buildCredentialRecord({
  tokenId: 2,
  walletAddress: WALLET,
  totalPoints: 15,
  puzzleMask: 1,
  easyCorrect: 5,
  attested: true,
  issuerAddress: OWNER,
});
assert.equal(credentialIdsAreUnique([first, remint]), true);
assert.equal(credentialIdsAreUnique([first, { ...remint, credentialId: "1" }]), false);
assert.equal(currentCredentialIdByWallet([first, remint]).get(WALLET), "2");
assert.equal(
  canTransitionVerification(first.verificationStatus, remint.verificationStatus, {
    sameCredentialId: first.credentialId === remint.credentialId,
  }),
  true
);

assert.equal(isCredentialRecord(clamped), true);
assert.equal(clamped.version.eip712, "1");
assert.equal(clamped.version.schema, 1);
assert.equal(clamped.schemaVersion, clamped.version.schema);

assert.match(doc, /Required vs optional/);
assert.match(doc, /Score constraints/);
assert.match(doc, /Verification-state transitions/);
assert.match(doc, /Unix \*\*seconds\*\*/);
assert.match(doc, /credentialIdsAreUnique/);

console.log("credential data model tests passed");
