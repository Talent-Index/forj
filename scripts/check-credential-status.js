import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CREDENTIAL_TYPE, VERIFICATION_STATUS } from "../src/utils/credentialModel.js";
import { ATTESTATION_VALUE, DESCRIPTION } from "../src/utils/credentialMetadata.js";
import { TRUST_COPY } from "../src/utils/certificateView.js";
import { CREDENTIAL_EXPLAINER } from "../src/utils/onboarding.js";
import {
  CREDENTIAL_STATES,
  EXPLORER_LINK_LABEL,
  LEARNER_MINT_STATUS,
  credentialStatusId,
  hasAmbiguousTrustLanguage,
  resolveCredentialStatus,
} from "../src/utils/credentialStatus.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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

assert.equal(credentialStatusId(undefined), "claimed");
assert.equal(credentialStatusId(null), "claimed");
assert.equal(credentialStatusId(""), "claimed");
assert.equal(credentialStatusId("claimed"), "claimed");
assert.equal(credentialStatusId("verified"), "claimed");
assert.equal(credentialStatusId("issuer-verified"), "claimed");
assert.equal(credentialStatusId({ verificationStatus: "verified" }), "claimed");
assert.equal(credentialStatusId(false), "claimed");
assert.equal(credentialStatusId("attested"), "attested");
assert.equal(credentialStatusId("issuer-attested"), "attested");
assert.equal(credentialStatusId("Issuer attested"), "attested");
assert.equal(credentialStatusId({ attested: true }), "attested");
assert.equal(credentialStatusId({ verificationStatus: "attested" }), "attested");
assert.equal(credentialStatusId({ credentialType: "issuer-attested" }), "attested");
assert.equal(resolveCredentialStatus("verified").label, "Self-claimed");
assert.equal(resolveCredentialStatus("attested").label, "Issuer-attested");

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
}

assert.equal(hasAmbiguousTrustLanguage(TRUST_COPY.claimed.title), false);
assert.equal(hasAmbiguousTrustLanguage(TRUST_COPY.claimed.body), false);
assert.equal(hasAmbiguousTrustLanguage(TRUST_COPY.attested.body), false);
assert.equal(TRUST_COPY.claimed.title, CREDENTIAL_STATES.claimed.label);
assert.equal(TRUST_COPY.attested.title, CREDENTIAL_STATES.attested.label);
assert.equal(hasAmbiguousTrustLanguage(CREDENTIAL_EXPLAINER.body), false);
assert.equal(CREDENTIAL_EXPLAINER.claimed, CREDENTIAL_STATES.claimed.summary);
assert.equal(CREDENTIAL_EXPLAINER.attested, CREDENTIAL_STATES.attested.summary);

const uiFiles = [
  "src/components/Landing.jsx",
  "src/components/Certificate.jsx",
  "src/components/CertificateArtifact.jsx",
  "src/components/CredentialRecord.jsx",
  "src/components/pages/AboutPage.jsx",
  "src/components/pages/ProgressPage.jsx",
];
for (const relative of uiFiles) {
  const source = readFileSync(join(root, relative), "utf8");
  assert.equal(source.includes("Verify on Snowtrace"), false, relative);
  assert.doesNotMatch(source, /verifiable on-chain/i);
  assert.doesNotMatch(source, /independently verified/i);
}

const docs = readFileSync(join(root, "docs/CREDENTIAL.md"), "utf8");
assert.match(docs, /Claimed vs attested/);
assert.match(docs, /fail closed/);
assert.match(docs, /View on Snowtrace/);

console.log("credential status honesty tests passed");
