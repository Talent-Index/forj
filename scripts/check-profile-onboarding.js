import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createMemoryStorage } from "../src/utils/progress.js";
import {
  AUTH_PROVIDERS,
  createAuthStore,
  onboardingStage,
} from "../src/utils/auth.js";
import {
  AUTH_FLOW_BUTTONS,
  LEARNER_PROFILE_REQUIRED_KEYS,
  applyProfileCompletion,
  applySignupIdentity,
  applyWalletPromptDismissed,
  learnerProfileFields,
  mergeHydratedProfile,
  normalizeLearningGoal,
  pickLearnerProfilePatch,
} from "../src/utils/profileOnboarding.js";
import { LEGAL_PAGES, legalPageFromPath } from "../src/utils/legal.js";
import { withTimeout } from "../src/utils/backend/timeout.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSrc(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function assertIncludes(source, snippet, label) {
  assert.ok(source.includes(snippet), `${label} should include ${JSON.stringify(snippet)}`);
}

const landing = readSrc("src/components/Landing.jsx");
const authModal = readSrc("src/components/auth/AuthModal.jsx");
const app = readSrc("src/App.jsx");
const useAuth = readSrc("src/hooks/useAuth.js");
const learner = readSrc("src/utils/backend/learner.js");

assertIncludes(landing, AUTH_FLOW_BUTTONS.landingStart.label, "Landing");
assertIncludes(landing, AUTH_FLOW_BUTTONS.landingSignIn.label, "Landing");
assertIncludes(landing, "{!signedIn &&", "Landing hides Sign in after sign-in");
assertIncludes(landing, AUTH_FLOW_BUTTONS.landingCredentials.label, "Landing");
assertIncludes(landing, "onClick={onStart}", "Landing start");
assertIncludes(landing, "onClick={onSignIn}", "Landing sign in");
assertIncludes(landing, "onClick={onExploreCredentials}", "Landing credentials");

assertIncludes(authModal, AUTH_FLOW_BUTTONS.google.label, "Auth modal");
assertIncludes(authModal, AUTH_FLOW_BUTTONS.createAccount.label, "Auth modal");
assertIncludes(authModal, AUTH_FLOW_BUTTONS.forgot.label, "Auth modal");
assertIncludes(authModal, AUTH_FLOW_BUTTONS.sendReset.label, "Auth modal");
assertIncludes(authModal, AUTH_FLOW_BUTTONS.backToSignIn.label, "Auth modal");
assertIncludes(authModal, AUTH_FLOW_BUTTONS.updatePassword.label, "Auth modal");
assertIncludes(authModal, AUTH_FLOW_BUTTONS.verified.label, "Auth modal");
assertIncludes(authModal, AUTH_FLOW_BUTTONS.resend.label, "Auth modal");
assertIncludes(authModal, AUTH_FLOW_BUTTONS.confirmName.label, "Profile setup");
assertIncludes(authModal, "Terms of Service", "Signup terms");
assertIncludes(authModal, "Privacy Policy", "Signup privacy");
assertIncludes(authModal, "type=\"submit\"", "Profile Continue is a submit button");
assertIncludes(authModal, "onContinue({ name: recipient.name, learningGoal: goal })", "Continue payload");
assertIncludes(authModal, "disabled={busy}", "Auth buttons disable while saving");

assertIncludes(app, "onContinue={handleProfileContinue}", "App wires name Continue");
assertIncludes(app, "busy={onboardBusy}", "App passes busy to onboarding");
assertIncludes(app, "auth.completeProfile(input)", "Continue calls completeProfile");
assertIncludes(app, "LegalPage", "App has Privacy and Terms pages");
assertIncludes(app, "goLearnHome()", "Signed-in learners leave landing");
assertIncludes(app, 'onStart={() => (isAuthenticated ? goLearnHome() : openAuth("signup"))}', "Start Learning opens signup");
assertIncludes(app, 'onSignIn={() => openAuth("signin")}', "Landing Sign in opens signin");

assert.equal(legalPageFromPath("/privacy"), "privacy");
assert.equal(legalPageFromPath("/terms"), "terms");
assert.ok(LEGAL_PAGES.privacy.sections.length >= 3);
assert.ok(LEGAL_PAGES.terms.sections.length >= 3);

assertIncludes(useAuth, "applyProfileCompletion", "Firebase auth uses local profile completion");
assertIncludes(useAuth, "setAccount(next.account)", "Continue updates local account immediately");
assertIncludes(useAuth, "void persistProfilePatch", "Cloud writes do not block Continue");
assertIncludes(learner, "setDoc(profileRef, patchFields, { merge: true })", "Profile save upserts");
assertIncludes(learner, "fullLearnerProfile", "Missing profiles are created, not patched");

const incomplete = {
  id: "uid-1",
  email: "dana@example.com",
  name: "",
  emailVerified: true,
  profileComplete: false,
  walletPromptSeen: false,
  walletAddress: null,
  avatarUrl: "",
  learningGoal: "",
};
assert.equal(onboardingStage(incomplete), "profile");

const named = applyProfileCompletion(incomplete, {
  name: "Dana Learner",
  learningGoal: "avalanche",
});
assert.equal(named.ok, true);
assert.equal(named.account.profileComplete, true);
assert.equal(named.account.name, "Dana Learner");
assert.equal(named.account.learningGoal, "avalanche");
assert.equal(onboardingStage(named.account), "ready");

const skippedGoal = applyProfileCompletion(incomplete, { name: "Dana Learner" });
assert.equal(skippedGoal.ok, true);
assert.equal(skippedGoal.account.learningGoal, "");
assert.equal(onboardingStage(skippedGoal.account), "ready");

const unknownGoal = applyProfileCompletion(incomplete, {
  name: "Dana Learner",
  learningGoal: "not-a-goal",
});
assert.equal(unknownGoal.account.learningGoal, "");
assert.equal(normalizeLearningGoal("development"), "development");
assert.equal(normalizeLearningGoal("secret-admin"), "");

const blank = applyProfileCompletion(incomplete, { name: "   " });
assert.equal(blank.ok, false);
assert.match(blank.error, /name/i);
assert.equal(onboardingStage(incomplete), "profile");

const numbered = applyProfileCompletion(incomplete, { name: "Learner 42" });
assert.equal(numbered.ok, false);

const unsigned = applyProfileCompletion(null, { name: "Dana Learner" });
assert.equal(unsigned.ok, false);

const fromSignup = applySignupIdentity(incomplete, "Dana Learner");
assert.equal(fromSignup.complete, true);
assert.equal(onboardingStage(fromSignup.account), "ready");
assert.equal(applySignupIdentity(incomplete, "").complete, false);

const skipped = applyWalletPromptDismissed(named.account);
assert.equal(skipped.ok, true);
assert.equal(skipped.account.walletPromptSeen, true);
assert.equal(onboardingStage(skipped.account), "ready");

const connected = applyWalletPromptDismissed(named.account);
assert.equal(onboardingStage(connected.account), "ready");

const afterFailedRead = mergeHydratedProfile(named.account, {
  ...incomplete,
  name: "",
  profileComplete: false,
  walletPromptSeen: false,
});
assert.equal(afterFailedRead.profileComplete, true);
assert.equal(afterFailedRead.name, "Dana Learner");
assert.equal(onboardingStage(afterFailedRead), "ready");

const afterSkipThenFailedRead = mergeHydratedProfile(skipped.account, {
  ...incomplete,
  id: skipped.account.id,
  profileComplete: false,
  walletPromptSeen: false,
});
assert.equal(afterSkipThenFailedRead.profileComplete, true);
assert.equal(afterSkipThenFailedRead.walletPromptSeen, true);
assert.equal(onboardingStage(afterSkipThenFailedRead), "ready");

assert.equal(mergeHydratedProfile(null, incomplete), incomplete);
assert.equal(mergeHydratedProfile(named.account, { ...incomplete, id: "other" }).profileComplete, false);

const created = learnerProfileFields(
  { uid: "uid-1", displayName: "Dana Learner", photoURL: "" },
  {},
  { name: "Dana Learner", learningGoal: "web3", profileComplete: true }
);
for (const key of LEARNER_PROFILE_REQUIRED_KEYS) {
  assert.ok(key in created, `upsert payload includes ${key}`);
}
assert.equal(created.userId, "uid-1");
assert.equal(created.profileComplete, true);
assert.equal(created.walletPromptSeen, false);
assert.equal(created.walletAddress, null);
assert.equal(created.learningGoal, "web3");

const patch = pickLearnerProfilePatch({
  name: "Dana Learner",
  profileComplete: true,
  extra: "drop-me",
});
assert.deepEqual(Object.keys(patch).sort(), ["name", "profileComplete"]);

const storage = createMemoryStorage();
const auth = createAuthStore(storage);
const registered = await auth.registerWithEmail({
  name: "Dana Learner",
  email: "dana@example.com",
  password: "forge-skill-1",
  confirmPassword: "forge-skill-1",
});
assert.equal(onboardingStage(registered.account), "verify-email");

const verified = auth.verifyEmail(registered.verificationToken);
assert.equal(onboardingStage(verified.account), "ready");

const blocked = auth.completeProfile(verified.account.id, { name: "" });
assert.equal(blocked.ok, false);
assert.equal(onboardingStage(auth.currentAccount()), "ready");

const continued = auth.completeProfile(verified.account.id, {
  name: "Dana Learner",
  learningGoal: "credentials",
});
assert.equal(continued.ok, true);
assert.equal(onboardingStage(continued.account), "ready");
assert.equal(onboardingStage(auth.currentAccount()), "ready");

const google = auth.signInWithGoogle({
  email: "forge@gmail.com",
  name: "Forge Google",
  googleId: "google-sub-buttons",
});
assert.equal(google.account.provider, AUTH_PROVIDERS.google);
assert.equal(onboardingStage(google.account), "ready");
const googleContinued = auth.completeProfile(google.account.id, { name: "Forge Google" });
assert.equal(googleContinued.ok, true);
assert.equal(onboardingStage(googleContinued.account), "ready");
const googleSkipped = auth.dismissWalletPrompt(googleContinued.account.id);
assert.equal(onboardingStage(googleSkipped.account), "ready");

const resolved = await withTimeout(Promise.resolve("ok"), 50);
assert.equal(resolved, "ok");
await assert.rejects(() => withTimeout(new Promise(() => {}), 20), /timed out/i);

console.log("profile onboarding and auth button tests passed");
