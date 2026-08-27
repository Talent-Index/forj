import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { QUESTIONS_PER_QUIZ } from "../src/utils/quiz.js";
import { TOTAL_PIECES } from "../src/data/questions.js";
import { ERROR_STATES } from "../src/utils/onboarding.js";
import { LEARNER_MINT_STATUS, CREDENTIAL_STATES } from "../src/utils/credentialStatus.js";
import { formatWalletError, WALLET_IDS } from "../src/utils/wallet.js";
import { mapAuthError } from "../src/utils/backend/authErrors.js";
import { canTransitionVerification, VERIFICATION_STATUS } from "../src/utils/credentialModel.js";
import { mainnetIssuanceAllowed } from "../src/utils/productionGate.js";
import {
  LAUNCH_CHECKLIST,
  LAUNCH_DECISION,
  LAUNCH_ENVIRONMENT,
  LAUNCH_STAGES,
  launchApproved,
  launchValidationSummary,
} from "../src/utils/launchValidation.js";
import { prepareClaimedMint } from "../src/utils/contract.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const launchDoc = readFileSync(join(root, "audit/LAUNCH-VALIDATION.md"), "utf8");
const gateDoc = readFileSync(join(root, "audit/PRODUCTION-GATE.md"), "utf8");
const pack = readFileSync(join(root, "audit/PACK.md"), "utf8");
const statusDoc = readFileSync(join(root, "docs/STATUS.md"), "utf8");
const roadmapDoc = readFileSync(join(root, "docs/ROADMAP.md"), "utf8");
const credentialDoc = readFileSync(join(root, "docs/CREDENTIAL.md"), "utf8");
const certificate = readFileSync(join(root, "src/components/Certificate.jsx"), "utf8");
const artifact = readFileSync(join(root, "src/components/CertificateArtifact.jsx"), "utf8");
const lookupPage = readFileSync(join(root, "src/components/pages/CredentialLookupPage.jsx"), "utf8");
const useWallet = readFileSync(join(root, "src/hooks/useWallet.js"), "utf8");
const css = readFileSync(join(root, "src/index.css"), "utf8");
const rules = readFileSync(join(root, "firestore.rules"), "utf8");
const sol = readFileSync(join(root, "contracts/SkillForgeCredential.sol"), "utf8");
const adversarial = readFileSync(join(root, "test/SkillForgeAdversarial.js"), "utf8");
const srcBlob = [
  readFileSync(join(root, "src/App.jsx"), "utf8"),
  certificate,
  lookupPage,
  readFileSync(join(root, "src/components/pages/AboutPage.jsx"), "utf8"),
].join("\n");

const summary = launchValidationSummary();
assert.equal(LAUNCH_ENVIRONMENT, "fuji");
assert.equal(LAUNCH_DECISION.approved, false);
assert.equal(LAUNCH_DECISION.verdict, "NOT APPROVED FOR LAUNCH");
assert.equal(launchApproved(), false);
assert.equal(summary.launchApproved, false);
assert.equal(mainnetIssuanceAllowed(), false);

const stageIds = Object.keys(LAUNCH_STAGES).sort();
assert.deepEqual(stageIds, [
  "criticalTests",
  "endToEndFlow",
  "mainnetContract",
  "productionConfig",
  "securityCheck",
].sort());
for (const stage of Object.values(LAUNCH_STAGES)) {
  assert.equal(stage.ready, false, `${stage.id} must stay closed`);
}
assert.deepEqual(summary.blockedStages.sort(), stageIds);

assert.equal(LAUNCH_CHECKLIST.wallet.automated, true);
assert.equal(LAUNCH_CHECKLIST.easyQuiz.automated, true);
assert.equal(LAUNCH_CHECKLIST.mediumQuiz.automated, true);
assert.equal(LAUNCH_CHECKLIST.hardQuiz.automated, true);
assert.equal(LAUNCH_CHECKLIST.quizRetry.automated, true);
assert.equal(LAUNCH_CHECKLIST.puzzleRedemption.automated, true);
assert.equal(LAUNCH_CHECKLIST.completePuzzle.automated, true);
assert.equal(LAUNCH_CHECKLIST.claimCredential.automated, true);
assert.equal(LAUNCH_CHECKLIST.credentialVerification.automated, true);
assert.equal(LAUNCH_CHECKLIST.issuerAttestedMint.automated, true);
assert.equal(LAUNCH_CHECKLIST.issuerAttestedMint.issuerUi, false);
assert.equal(LAUNCH_CHECKLIST.failureScenarios.automated, true);
assert.equal(LAUNCH_CHECKLIST.persistence.automated, true);
assert.equal(LAUNCH_CHECKLIST.mobileTesting.automated, false);
assert.equal(LAUNCH_CHECKLIST.desktopTesting.automated, false);
assert.equal(LAUNCH_CHECKLIST.productionEnvironment.automated, false);
for (const section of Object.values(LAUNCH_CHECKLIST)) {
  assert.equal(section.liveDevice, false, `${section.id} live device must not be signed off`);
}

assert.match(launchDoc, /NOT APPROVED FOR LAUNCH/);
assert.match(launchDoc, /fail-closed/);
assert.match(launchDoc, /not independently audited|no independent audit/);
assert.match(launchDoc, /CLAIMED and ISSUER-ATTESTED stay distinct/);
assert.match(launchDoc, /Revocation is out of scope/);
assert.match(gateDoc, /C-Chain issuance is \*\*closed\*\*/);
assert.match(pack, /not live on C-Chain/i);
assert.match(statusDoc, /not approved\*\* for public launch/i);
assert.match(roadmapDoc, /Launch validation is \*\*not\*\* approval to launch/);
assert.match(credentialDoc, /does \*\*not\*\* issue this credential on Avalanche C-Chain today/);

assert.equal(QUESTIONS_PER_QUIZ, 5);
assert.equal(TOTAL_PIECES, 16);
assert.equal(LEARNER_MINT_STATUS, "claimed");
assert.equal(CREDENTIAL_STATES.claimed.label, "Self-claimed");
assert.equal(CREDENTIAL_STATES.attested.label, "Issuer-attested");
assert.equal(
  canTransitionVerification(VERIFICATION_STATUS.CLAIMED, VERIFICATION_STATUS.ATTESTED, {
    sameCredentialId: true,
  }),
  false
);

for (const key of ["wallet", "network", "quiz", "puzzle", "mint"]) {
  assert.ok(ERROR_STATES[key].title);
  assert.ok(ERROR_STATES[key].body);
  assert.doesNotMatch(ERROR_STATES[key].body, /PRIVATE_KEY|PINATA|mnemonic|0x[a-fA-F0-9]{64}/);
}
assert.match(formatWalletError({ code: 4001 }, "connect"), /rejected/);
assert.match(formatWalletError({ code: 4001 }, "switch"), /Fuji/);
assert.match(mapAuthError({ code: "auth/network-request-failed" }), /Network error/);
assert.doesNotMatch(mapAuthError({ code: "auth/wrong-password" }), /auth\//);

assert.match(useWallet, /accountsChanged/);
assert.match(useWallet, /const disconnect = useCallback/);
assert.match(useWallet, /eth_accounts/);
assert.equal(WALLET_IDS.metamask, "metamask");
assert.equal(WALLET_IDS.core, "core");

assert.match(certificate, /prepareClaimedMint/);
assert.match(certificate, /Claim self-claimed credential on Fuji/);
assert.match(certificate, /setMintError/);
assert.doesNotMatch(certificate, /43114/);
assert.equal(
  prepareClaimedMint({
    account: "0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df",
    expectedAccount: "0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df",
    chainId: 43114,
    totalPoints: 15,
    puzzleMask: 1,
    easyCorrect: 5,
    mediumCorrect: 0,
    hardCorrect: 0,
  }).ok,
  false
);

assert.match(artifact, /Blacksmith in a forge presenting a crafted diamond/);
assert.match(artifact, /Avalanche Fuji/);
const artifactCssStart = css.indexOf(".certificate-artifact {");
assert.ok(artifactCssStart >= 0);
const artifactCss = css.slice(artifactCssStart, artifactCssStart + 900);
assert.doesNotMatch(artifactCss, /linear-gradient|radial-gradient|text-shadow|filter:|box-shadow/);

assert.match(lookupPage, /Looking it up does not make a self-claimed score issuer-attested/);
assert.match(srcBlob, /\/credential/);
assert.doesNotMatch(srcBlob, /IssuerDashboard|issuer dashboard/i);

assert.match(rules, /match \/issuers\/\{id\} \{ allow read, write: if false; /);
assert.match(rules, /match \/xpTransactions\/\{id\} \{ allow read, write: if false; /);
assert.doesNotMatch(sol, /revoke/i);
assert.match(adversarial, /does not mint an attested credential without a valid owner signature/);
assert.match(adversarial, /rejects a signature bound to Fuji or mainnet/);
assert.match(adversarial, /rejects a second use of the same authorization/);

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
assert.match(pkg.scripts.verify, /test:launch-validation/);

console.log("launch validation remains not approved; Fuji learner-loop checks mapped");
