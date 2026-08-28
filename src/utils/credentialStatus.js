import { CREDENTIAL_TYPE, VERIFICATION_STATUS } from "./credentialModel.js";
import { ATTESTATION_VALUE, DESCRIPTION } from "./credentialMetadata.js";
import { ATTESTED_LABEL, CLAIMED_LABEL } from "./brand.js";

/**
 * Learner-facing honesty labels. Claimed scores are never called verified.
 * Unknown or missing status falls back to claimed (fail closed).
 */
export const LEARNER_MINT_STATUS = "claimed";
export const EXPLORER_LINK_LABEL = "View on Snowtrace";

const AMBIGUOUS_TRUST = /\bverif(?:y|ied|ication|iable)\b|\bcertified\b|\baccredited\b/i;

export const CREDENTIAL_STATES = {
  claimed: {
    id: "claimed",
    credentialType: CREDENTIAL_TYPE.SELF_CLAIMED,
    verificationStatus: VERIFICATION_STATUS.CLAIMED,
    label: CLAIMED_LABEL,
    title: "Forjora claimed score record",
    summary: "Forjora claimed: you submit your scores from this app.",
    body: "This credential records a score the learner submitted. Anyone can mint their own scores. It is not an issuer-attested assessment.",
    remintNote:
      "Minting from this app writes a self-claimed record and replaces any existing token for this wallet, including an issuer-attested one.",
    metadataDescription: DESCRIPTION.claimed,
    metadataTrait: ATTESTATION_VALUE.claimed,
    mintFunction: "mintCredential",
    inLearnerUi: true,
  },
  attested: {
    id: "attested",
    credentialType: CREDENTIAL_TYPE.ISSUER_ATTESTED,
    verificationStatus: VERIFICATION_STATUS.ATTESTED,
    label: ATTESTED_LABEL,
    title: "Forjora issuer-attested credential",
    summary:
      "Forjora issuer-attested: requires an owner EIP-712 signature. Not used in the learner mint UI.",
    body: "This credential was authorized by the Forjora issuer with an EIP-712 signature. It is not a Forjora claimed quiz mint.",
    remintNote: "",
    metadataDescription: DESCRIPTION.attested,
    metadataTrait: ATTESTATION_VALUE.attested,
    mintFunction: "mintCredentialWithAuthorization",
    inLearnerUi: false,
  },
};

export function hasAmbiguousTrustLanguage(text) {
  return typeof text === "string" && AMBIGUOUS_TRUST.test(text);
}

export function isAttestedInput(value) {
  if (value === true) return true;
  if (typeof value === "string") {
    const key = value.trim().toLowerCase();
    return (
      key === "attested" ||
      key === "issuer-attested" ||
      key === "issuer attested"
    );
  }
  if (value && typeof value === "object") {
    if (value.attested === true) return true;
    if (value.verificationStatus === VERIFICATION_STATUS.ATTESTED) return true;
    if (value.credentialType === CREDENTIAL_TYPE.ISSUER_ATTESTED) return true;
    if (value.id === "attested") return true;
  }
  return false;
}

export function resolveCredentialStatus(value) {
  return isAttestedInput(value) ? CREDENTIAL_STATES.attested : CREDENTIAL_STATES.claimed;
}

export function credentialStatusId(value) {
  return resolveCredentialStatus(value).id;
}
