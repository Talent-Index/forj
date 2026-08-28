/** Fail-closed public launch decision. Not a claim that Forjora is approved to launch. */

import { mainnetIssuanceAllowed } from "./productionGate.js";

export const LAUNCH_ENVIRONMENT = "fuji";
export const LAUNCH_FREEZE_ID = "v1";

function freezeSection(section) {
  return Object.freeze(section);
}

/**
 * Automated = CI covers the learner-loop semantics.
 * Live device / production / issuer UI remain blocked for public launch.
 */
export const LAUNCH_CHECKLIST = Object.freeze({
  wallet: freezeSection({
    id: "wallet",
    label: "Wallet connection",
    automated: true,
    liveDevice: false,
    evidence: "MetaMask and Core are the allowed wallets. Fuji switch, rejected connect, restore, disconnect, and account change are implemented. Live extension sessions are not signed off here.",
  }),
  easyQuiz: freezeSection({
    id: "easyQuiz",
    label: "Easy quiz",
    automated: true,
    liveDevice: false,
    evidence: "Five unique shuffled questions, scoring, explanations, and completion state are covered in quiz and progress checks.",
  }),
  mediumQuiz: freezeSection({
    id: "mediumQuiz",
    label: "Medium quiz",
    automated: true,
    liveDevice: false,
    evidence: "Same quiz engine as Easy, with Medium points and achievement triggers in progression checks.",
  }),
  hardQuiz: freezeSection({
    id: "hardQuiz",
    label: "Hard quiz",
    automated: true,
    liveDevice: false,
    evidence: "Same quiz engine as Easy, with Hard points and achievement triggers in progression checks.",
  }),
  quizRetry: freezeSection({
    id: "quizRetry",
    label: "Quiz retry",
    automated: true,
    liveDevice: false,
    evidence: "Retry replaces section points, does not stack XP, and does not duplicate achievements or UTC streak days.",
  }),
  puzzleRedemption: freezeSection({
    id: "puzzleRedemption",
    label: "Puzzle redemption",
    automated: true,
    liveDevice: false,
    evidence: "4×4 interlocking pieces, duplicate and insufficient-points rejection, non-negative remainder, persisted unlocks.",
  }),
  completePuzzle: freezeSection({
    id: "completePuzzle",
    label: "Complete puzzle",
    automated: true,
    liveDevice: false,
    evidence: "Sixteen unique jigsaw paths, recipient-name validation, certificate preview copy. Live reveal animation is not a device sign-off.",
  }),
  claimCredential: freezeSection({
    id: "claimCredential",
    label: "Claim credential",
    automated: true,
    liveDevice: false,
    evidence: "Learner mint is claimed-only via prepareClaimedMint on Fuji. Rejected and failed txs surface mint errors. Live wallet confirmations are not signed off here.",
  }),
  credentialVerification: freezeSection({
    id: "credentialVerification",
    label: "Credential verification",
    automated: true,
    liveDevice: false,
    evidence: "Public lookup by ID or wallet is independent of the dashboard. Invalid IDs fail closed to claimed. Revocation is not shipped.",
  }),
  issuerAttestedMint: freezeSection({
    id: "issuerAttestedMint",
    label: "Issuer-attested mint",
    automated: true,
    liveDevice: false,
    issuerUi: false,
    evidence: "Contract adversarial tests reject invalid issuer authorizations. There is no issuer dashboard in the learner app.",
  }),
  failureScenarios: freezeSection({
    id: "failureScenarios",
    label: "Failure scenarios",
    automated: true,
    liveDevice: false,
    evidence: "Mapped wallet, quiz, auth, mint, and puzzle errors. Progress sanitizes and isolates by account. Live RPC/Firebase outages are not a production walkthrough.",
  }),
  mobileTesting: freezeSection({
    id: "mobileTesting",
    label: "Mobile testing",
    automated: false,
    liveDevice: false,
    evidence: "Mobile wallet deep links and a compact layout exist. Supported mobile browsers are not signed off in this pack.",
  }),
  desktopTesting: freezeSection({
    id: "desktopTesting",
    label: "Desktop testing",
    automated: false,
    liveDevice: false,
    evidence: "Desktop layout exists. Chrome, Firefox, Edge, and Safari sessions are not signed off in this pack.",
  }),
  persistence: freezeSection({
    id: "persistence",
    label: "Persistence testing",
    automated: true,
    liveDevice: false,
    evidence: "Progress is keyed by learner account; wallets do not carry another learner’s XP. Cross-device Firebase persistence is not a production walkthrough.",
  }),
  productionEnvironment: freezeSection({
    id: "productionEnvironment",
    label: "Production environment",
    automated: false,
    liveDevice: false,
    evidence: "Secret names are kept off VITE_. Fuji is the live credential network. C-Chain issuance, production issuer config, and monitoring are not shipped.",
  }),
});

export const LAUNCH_STAGES = Object.freeze({
  criticalTests: Object.freeze({
    id: "criticalTests",
    label: "All critical tests pass",
    ready: false,
    detail: "CI covers the Fuji learner loop. Live wallets, mobile and desktop browsers, and issuer UI are not signed off.",
  }),
  securityCheck: Object.freeze({
    id: "securityCheck",
    label: "Security check pass",
    ready: false,
    detail: "Adversarial contract tests and frontend checks exist. Freeze v1 is not independently audited.",
  }),
  productionConfig: Object.freeze({
    id: "productionConfig",
    label: "Production config pass",
    ready: false,
    detail: "The shipped environment is Avalanche Fuji. Production Firebase, C-Chain RPC, issuer config, and monitoring are not verified for public launch.",
  }),
  mainnetContract: Object.freeze({
    id: "mainnetContract",
    label: "Mainnet contract verified",
    ready: false,
    detail: "There is no Avalanche C-Chain credential contract. The production readiness gate is closed.",
  }),
  endToEndFlow: Object.freeze({
    id: "endToEndFlow",
    label: "End-to-end flow pass",
    ready: false,
    detail: "Claimed mint and public lookup are the learner path. Issuer-attested mint has no learner UI. A production walkthrough is not signed off.",
  }),
});

export const LAUNCH_DECISION = Object.freeze({
  approved: false,
  freezeId: LAUNCH_FREEZE_ID,
  environment: LAUNCH_ENVIRONMENT,
  verdict: "NOT APPROVED FOR LAUNCH",
});

export function launchApproved() {
  if (LAUNCH_DECISION.approved !== true) return false;
  if (!mainnetIssuanceAllowed()) return false;
  return Object.values(LAUNCH_STAGES).every((stage) => stage.ready === true);
}

export function launchValidationSummary() {
  const sections = Object.values(LAUNCH_CHECKLIST);
  const stages = Object.values(LAUNCH_STAGES);
  return {
    freezeId: LAUNCH_DECISION.freezeId,
    environment: LAUNCH_DECISION.environment,
    launchApproved: launchApproved(),
    verdict: LAUNCH_DECISION.verdict,
    automated: sections.filter((section) => section.automated).map((section) => section.id),
    blockedLive: sections.filter((section) => !section.liveDevice).map((section) => section.id),
    blockedStages: stages.filter((stage) => !stage.ready).map((stage) => stage.id),
  };
}
