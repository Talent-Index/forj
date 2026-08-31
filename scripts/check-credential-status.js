import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CREDENTIAL_TYPE,
  VERIFICATION_STATUS,
  buildCredentialRecord,
  canTransitionVerification,
  currentCredentialIdByWallet,
  validateCredentialRecord,
} from "../src/utils/credentialModel.js";
import {
  ATTESTATION_VALUE,
  DESCRIPTION,
  buildCredentialMetadata,
  validateCredentialMetadata,
} from "../src/utils/credentialMetadata.js";
import { mapOnChainCredential } from "../src/utils/credential.js";
import { TRUST_COPY } from "../src/utils/certificateView.js";
import { CREDENTIAL_EXPLAINER } from "../src/utils/onboarding.js";
import {
  createMemoryStorage,
  createProgressStore,
} from "../src/utils/progress.js";
import {
  CREDENTIAL_STATES,
  EXPLORER_LINK_LABEL,
  LEARNER_MINT_STATUS,
  credentialStatusId,
  hasAmbiguousTrustLanguage,
  resolveCredentialStatus,
} from "../src/utils/credentialStatus.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const WALLET_A = `0x${"a".repeat(40)}`;
const WALLET_B = `0x${"b".repeat(40)}`;
const OWNER = `0x${"c".repeat(40)}`;
const CONTRACT = "0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df";

assert.equal(LEARNER_MINT_STATUS, "claimed");
assert.equal(CREDENTIAL_STATES[LEARNER_MINT_STATUS].inLearnerUi, true);
assert.equal(CREDENTIAL_STATES.attested.inLearnerUi, false);
assert.equal(CREDENTIAL_STATES.claimed.mintFunction, "mintCredential");
assert.equal(CREDENTIAL_STATES.attested.mintFunction, "mintCredentialWithAuthorization");
assert.equal(CREDENTIAL_STATES.claimed.credentialType, CREDENTIAL_TYPE.SELF_CLAIMED);
assert.equal(CREDENTIAL_STATES.attested.credentialType, CREDENTIAL_TYPE.ISSUER_ATTESTED);
assert.equal(CREDENTIAL_STATES.claimed.verificationStatus, VERIFICATION_STATUS.CLAIMED);
assert.equal(CREDENTIAL_STATES.attested.verificationStatus, VERIFICATION_STATUS.ATTESTED);
assert.equal(CREDENTIAL_STATES.claimed.metadataDescription, DESCRIPTION.claimed);
assert.equal(CREDENTIAL_STATES.attested.metadataDescription, DESCRIPTION.attested);
assert.equal(CREDENTIAL_STATES.claimed.metadataTrait, ATTESTATION_VALUE.claimed);
assert.equal(CREDENTIAL_STATES.attested.metadataTrait, ATTESTATION_VALUE.attested);

// A learner cannot promote their own claimed credential to attested.
assert.equal(canTransitionVerification("claimed", "attested", { sameCredentialId: true }), false);
const claimedRecord = buildCredentialRecord({
  tokenId: 1,
  walletAddress: WALLET_A,
  totalPoints: 80,
  puzzleMask: 0xffff,
  easyCorrect: 5,
  mediumCorrect: 5,
  hardCorrect: 5,
});
assert.equal(claimedRecord.verificationStatus, "claimed");
assert.equal(claimedRecord.attested, false);
assert.equal(validateCredentialRecord({ ...claimedRecord, attested: true }).ok, false);
assert.equal(
  validateCredentialRecord({
    ...claimedRecord,
    verificationStatus: VERIFICATION_STATUS.ATTESTED,
  }).ok,
  false
);
assert.equal(
  validateCredentialRecord({
    ...claimedRecord,
    credentialType: CREDENTIAL_TYPE.ISSUER_ATTESTED,
  }).ok,
  false
);
assert.equal(
  canTransitionVerification(claimedRecord.verificationStatus, "attested", {
    sameCredentialId: true,
  }),
  false
);

const certificateSource = readFileSync(join(root, "src/components/Certificate.jsx"), "utf8");
assert.match(certificateSource, /prepareClaimedMint/);
assert.match(certificateSource, /value: prepared\.value/);
assert.doesNotMatch(certificateSource, /mintCredentialWithAuthorization/);
assert.match(certificateSource, /Claim Forjora claimed credential on Fuji/);
assert.match(certificateSource, /ExistingCertificate/);
assert.match(readFileSync(join(root, "src/components/ExistingCertificate.jsx"), "utf8"), /Your Fuji certificate/);
const contractSource = readFileSync(join(root, "src/utils/contract.js"), "utf8");
assert.match(contractSource, /functionName: "mintCredential"/);
assert.doesNotMatch(
  contractSource.slice(contractSource.indexOf("export function buildMintData")),
  /mintCredentialWithAuthorization/
);

// UI terminology consistently reflects credential type.
assert.equal(CREDENTIAL_STATES.claimed.label, "Forjora claimed");
assert.equal(CREDENTIAL_STATES.attested.label, "Forjora issuer-attested");
assert.equal(TRUST_COPY.claimed.title, "Forjora claimed");
assert.equal(TRUST_COPY.attested.title, "Forjora issuer-attested");
assert.equal(CREDENTIAL_EXPLAINER.claimed, CREDENTIAL_STATES.claimed.summary);
assert.equal(CREDENTIAL_EXPLAINER.attested, CREDENTIAL_STATES.attested.summary);
assert.equal(EXPLORER_LINK_LABEL, "View on Snowtrace");
assert.equal(hasAmbiguousTrustLanguage(EXPLORER_LINK_LABEL), false);

for (const state of Object.values(CREDENTIAL_STATES)) {
  for (const field of ["label", "title", "summary", "body"]) {
    assert.equal(
      hasAmbiguousTrustLanguage(state[field]),
      false,
      `${state.id}.${field} must not use verified/certified language`
    );
  }
  assert.match(state.label, state.id === "claimed" ? /Forjora claimed/ : /Forjora issuer-attested/);
}

assert.equal(hasAmbiguousTrustLanguage(TRUST_COPY.claimed.body), false);
assert.equal(hasAmbiguousTrustLanguage(TRUST_COPY.attested.body), false);
assert.equal(hasAmbiguousTrustLanguage(CREDENTIAL_EXPLAINER.body), false);

const uiFiles = [
  "src/components/Landing.jsx",
  "src/components/Certificate.jsx",
  "src/components/CertificateArtifact.jsx",
  "src/components/CredentialRecord.jsx",
  "src/components/CredentialStatusBadge.jsx",
  "src/components/pages/AboutPage.jsx",
  "src/components/pages/ProgressPage.jsx",
  "src/components/pages/CredentialLookupPage.jsx",
  "src/components/CredentialDetails.jsx",
  "src/components/ExistingCertificate.jsx",
];
for (const relative of uiFiles) {
  const source = readFileSync(join(root, relative), "utf8");
  assert.equal(source.includes("Verify on Snowtrace"), false, relative);
  assert.doesNotMatch(source, /verifiable on-chain/i);
  assert.doesNotMatch(source, /independently verified/i);
  assert.doesNotMatch(source, /["'`]Verified["'`]/);
}

assert.match(readFileSync(join(root, "src/components/CredentialStatusBadge.jsx"), "utf8"), /resolveCredentialStatus/);
assert.match(readFileSync(join(root, "src/components/Landing.jsx"), "utf8"), /credential-path-claimed/);
assert.match(readFileSync(join(root, "src/components/Landing.jsx"), "utf8"), /credential-path-attested/);

// Verification status is not inferred incorrectly.
assert.equal(credentialStatusId(undefined), "claimed");
assert.equal(credentialStatusId(null), "claimed");
assert.equal(credentialStatusId(""), "claimed");
assert.equal(credentialStatusId("claimed"), "claimed");
assert.equal(credentialStatusId("verified"), "claimed");
assert.equal(credentialStatusId("issuer-verified"), "claimed");
assert.equal(credentialStatusId({ verificationStatus: "verified" }), "claimed");
assert.equal(credentialStatusId(false), "claimed");
assert.equal(credentialStatusId(80), "claimed");
assert.equal(credentialStatusId({ score: { totalPoints: 80 }, attested: false }), "claimed");
assert.equal(credentialStatusId({ explorerUrl: "https://testnet.snowtrace.io/token/x" }), "claimed");
assert.equal(credentialStatusId({ metadataUri: "data:application/json;base64,e30=" }), "claimed");
assert.equal(credentialStatusId({ credentialType: "self-claimed", attested: false }), "claimed");
assert.equal(resolveCredentialStatus("verified").label, "Forjora claimed");
assert.equal(credentialStatusId("attested"), "attested");
assert.equal(credentialStatusId("issuer-attested"), "attested");
assert.equal(credentialStatusId("Issuer attested"), "attested");
assert.equal(credentialStatusId({ attested: true }), "attested");
assert.equal(credentialStatusId({ verificationStatus: "attested" }), "attested");
assert.equal(credentialStatusId({ credentialType: "issuer-attested" }), "attested");
assert.equal(resolveCredentialStatus("attested").label, "Forjora issuer-attested");

const maxScoreClaimed = mapOnChainCredential(
  9n,
  [80n, 0xffffn, 5, 5, 5, "ipfs://art", 1_700_000_000n, false],
  CONTRACT,
  undefined,
  { walletAddress: WALLET_A }
);
assert.equal(maxScoreClaimed.attested, false);
assert.equal(resolveCredentialStatus(maxScoreClaimed).id, "claimed");
assert.equal(resolveCredentialStatus(maxScoreClaimed).label, "Forjora claimed");

const attestedOnlyFromFlag = mapOnChainCredential(
  10n,
  [15n, 1n, 5, 0, 0, "", 1n, true],
  CONTRACT,
  undefined,
  { walletAddress: WALLET_A, issuerAddress: OWNER }
);
assert.equal(attestedOnlyFromFlag.attested, true);
assert.equal(resolveCredentialStatus(attestedOnlyFromFlag).id, "attested");

// Existing credentials remain understandable.
const claimedExample = JSON.parse(readFileSync(join(root, "metadata/examples/self-claimed.json"), "utf8"));
const attestedExample = JSON.parse(readFileSync(join(root, "metadata/examples/issuer-attested.json"), "utf8"));
assert.equal(validateCredentialMetadata(claimedExample).ok, true);
assert.equal(validateCredentialMetadata(attestedExample).ok, true);
assert.equal(claimedExample.description, DESCRIPTION.claimed);
assert.equal(attestedExample.description, DESCRIPTION.attested);
assert.equal(resolveCredentialStatus({ attested: false }).body, CREDENTIAL_STATES.claimed.body);
assert.equal(resolveCredentialStatus({ attested: true }).body, CREDENTIAL_STATES.attested.body);
assert.equal(validateCredentialRecord(claimedRecord).ok, true);
assert.match(claimedRecord.credentialType, /self-claimed/);
assert.equal(claimedRecord.version.schema, 1);

const historicalClaimed = mapOnChainCredential(1n, {
  totalPoints: 12n,
  puzzleMask: 3n,
  easyCorrect: 4,
  mediumCorrect: 0,
  hardCorrect: 0,
  image: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
  mintedAt: 1_700_000_000n,
  attested: false,
}, CONTRACT, undefined, { walletAddress: WALLET_A, metadataUri: "data:application/json;base64,e30=" });
assert.equal(historicalClaimed.schemaVersion, 1);
assert.equal(historicalClaimed.verificationStatus, "claimed");
assert.equal(resolveCredentialStatus(historicalClaimed).title, "Forjora claimed score record");
assert.equal(validateCredentialRecord(historicalClaimed).ok, true);

const historicalAttested = mapOnChainCredential(2n, {
  totalPoints: 15n,
  puzzleMask: 1n,
  easyCorrect: 5,
  mediumCorrect: 0,
  hardCorrect: 0,
  image: "",
  mintedAt: 1,
  attested: true,
}, CONTRACT, undefined, { walletAddress: WALLET_A, issuerAddress: OWNER });
assert.equal(historicalAttested.verificationStatus, "attested");
assert.equal(resolveCredentialStatus(historicalAttested).title, "Forjora issuer-attested credential");
assert.equal(validateCredentialRecord(historicalAttested).ok, true);

const rebuilt = buildCredentialMetadata({
  tokenId: historicalClaimed.credentialId,
  attested: historicalClaimed.attested,
  totalPoints: historicalClaimed.score.totalPoints,
  puzzlePieces: historicalClaimed.completion.puzzlePieces,
  easyCorrect: historicalClaimed.score.easyCorrect,
});
assert.equal(validateCredentialMetadata(rebuilt).ok, true);
assert.equal(rebuilt.attributes.find((row) => row.trait_type === "Attestation").value, "Self claimed");

const docs = readFileSync(join(root, "docs/CREDENTIAL.md"), "utf8");
assert.match(docs, /Claimed vs attested/);
assert.match(docs, /fail closed/);
assert.match(docs, /View on Snowtrace/);

// Wallet-specific credential data remains intact.
const walletARecord = buildCredentialRecord({
  tokenId: 1,
  walletAddress: WALLET_A,
  totalPoints: 15,
  puzzleMask: 1,
  easyCorrect: 5,
});
const walletBRecord = buildCredentialRecord({
  tokenId: 2,
  walletAddress: WALLET_B,
  totalPoints: 40,
  puzzleMask: 7,
  easyCorrect: 5,
  mediumCorrect: 5,
});
assert.equal(walletARecord.walletAddress, WALLET_A);
assert.equal(walletBRecord.walletAddress, WALLET_B);
assert.notEqual(walletARecord.credentialId, walletBRecord.credentialId);
assert.equal(walletARecord.score.totalPoints, 15);
assert.equal(walletBRecord.score.totalPoints, 40);
assert.equal(currentCredentialIdByWallet([walletARecord, walletBRecord]).get(WALLET_A), "1");
assert.equal(currentCredentialIdByWallet([walletARecord, walletBRecord]).get(WALLET_B), "2");

const mappedA = mapOnChainCredential(
  1n,
  [15n, 1n, 5, 0, 0, "", 10n, false],
  CONTRACT,
  undefined,
  { walletAddress: WALLET_A }
);
const mappedB = mapOnChainCredential(
  2n,
  [40n, 7n, 5, 5, 0, "", 11n, false],
  CONTRACT,
  undefined,
  { walletAddress: WALLET_B }
);
assert.equal(mappedA.walletAddress, WALLET_A);
assert.equal(mappedB.walletAddress, WALLET_B);
assert.equal(mappedA.score.easyCorrect, 5);
assert.equal(mappedB.score.mediumCorrect, 5);
assert.notEqual(mappedA.credentialId, mappedB.credentialId);

const storage = createMemoryStorage();
const store = createProgressStore(storage);
assert.equal(store.save(WALLET_A, {
  recipientName: "Alex Mwangi",
  sectionScores: { easy: { correct: 5, total: 5, pointsEarned: 15 } },
  totalPoints: 15,
  acquiredPieces: [0],
}), true);
assert.equal(store.save(WALLET_B, {
  recipientName: "Sam O'neil",
  sectionScores: { medium: { correct: 4, total: 5, pointsEarned: 20 } },
  totalPoints: 20,
  acquiredPieces: [1, 2],
}), true);
assert.equal(store.load(WALLET_A).recipientName, "Alex Mwangi");
assert.equal(store.load(WALLET_A).totalPoints, 15);
assert.deepEqual(store.load(WALLET_A).acquiredPieces, [0]);
assert.equal(store.load(WALLET_B).recipientName, "Sam O'neil");
assert.equal(store.load(WALLET_B).totalPoints, 20);
assert.deepEqual(store.load(WALLET_B).acquiredPieces, [1, 2]);
store.clear(WALLET_A);
assert.equal(store.load(WALLET_A).recipientName, "");
assert.equal(store.load(WALLET_B).recipientName, "Sam O'neil");
assert.equal(store.load(WALLET_B).totalPoints, 20);

console.log("credential status honesty tests passed");
