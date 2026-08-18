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
  VERIFICATION_STATUS,
  buildCredentialRecord,
  describeMetadataUri,
  isCredentialRecord,
  puzzlePieceCount,
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

console.log("credential data model tests passed");
