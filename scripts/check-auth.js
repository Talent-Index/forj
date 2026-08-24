import assert from "node:assert/strict";
import { createMemoryStorage } from "../src/utils/progress.js";
import {
  AUTH_PROVIDERS,
  createAuthStore,
  onboardingStage,
} from "../src/utils/auth.js";

const storage = createMemoryStorage();
const auth = createAuthStore(storage);

const registered = await auth.registerWithEmail({
  name: "Dana Learner",
  email: "dana@example.com",
  password: "forge-skill-1",
  confirmPassword: "forge-skill-1",
});
assert.equal(registered.ok, true);
assert.equal(registered.account.provider, AUTH_PROVIDERS.email);
assert.equal(registered.account.emailVerified, false);
assert.equal(onboardingStage(registered.account), "verify-email");
assert.ok(registered.verificationToken);

const duplicate = await auth.registerWithEmail({
  name: "Dana Learner",
  email: "dana@example.com",
  password: "forge-skill-1",
  confirmPassword: "forge-skill-1",
});
assert.equal(duplicate.ok, false);

const verified = auth.verifyEmail(registered.verificationToken);
assert.equal(verified.ok, true);
assert.equal(verified.account.emailVerified, true);
assert.equal(onboardingStage(verified.account), "profile");

const profile = auth.completeProfile(verified.account.id, {
  name: "Dana Learner",
  learningGoal: "avalanche",
});
assert.equal(profile.ok, true);
assert.equal(onboardingStage(profile.account), "wallet-optional");

const skipped = auth.dismissWalletPrompt(profile.account.id);
assert.equal(skipped.ok, true);
assert.equal(onboardingStage(skipped.account), "ready");
assert.equal(skipped.account.walletAddress, null);

auth.signOut();
assert.equal(auth.currentAccount(), null);

const signedIn = await auth.signInWithEmail({
  email: "dana@example.com",
  password: "forge-skill-1",
});
assert.equal(signedIn.ok, true);
assert.equal(signedIn.account.email, "dana@example.com");

const google = auth.signInWithGoogle({
  email: "forge@gmail.com",
  name: "Forge Google",
  googleId: "google-sub-1",
});
assert.equal(google.ok, true);
assert.equal(google.account.provider, AUTH_PROVIDERS.google);
assert.equal(google.account.emailVerified, true);
assert.equal(onboardingStage(google.account), "profile");

const googleProfile = auth.completeProfile(google.account.id, { name: "Forge Google" });
assert.equal(googleProfile.ok, true);
assert.equal(onboardingStage(googleProfile.account), "wallet-optional");

const linked = auth.linkWallet(googleProfile.account.id, `0x${"a".repeat(40)}`);
assert.equal(linked.ok, true);
assert.equal(linked.account.walletAddress, `0x${"a".repeat(40)}`);
assert.equal(onboardingStage(linked.account), "ready");

console.log("auth account tests passed");
