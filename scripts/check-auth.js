import assert from "node:assert/strict";
import { createMemoryStorage } from "../src/utils/progress.js";
import {
  AUTH_PROVIDERS,
  createAuthStore,
  emailPasswordFormIssue,
  onboardingStage,
} from "../src/utils/auth.js";

assert.equal(emailPasswordFormIssue({ email: "", password: "x", mode: "signin" }), "Enter a valid email address.");
assert.equal(emailPasswordFormIssue({ email: "a@b.co", password: "", mode: "signin" }), "Enter your password.");
assert.equal(emailPasswordFormIssue({
  name: "Dana",
  email: "a@b.co",
  password: "forge-skill-1",
  confirmPassword: "forge-skill-1",
  mode: "signup",
}), "");
assert.match(emailPasswordFormIssue({
  name: "",
  email: "a@b.co",
  password: "forge-skill-1",
  confirmPassword: "forge-skill-1",
  mode: "signup",
}), /name/i);

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
assert.equal(registered.account.hasPassword, true);
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
assert.equal(onboardingStage(verified.account), "ready");
assert.equal(verified.account.profileComplete, true);

const profile = auth.completeProfile(verified.account.id, {
  name: "Dana Learner",
  learningGoal: "avalanche",
});
assert.equal(profile.ok, true);
assert.equal(onboardingStage(profile.account), "ready");

const changed = await auth.changePassword(profile.account.id, {
  currentPassword: "forge-skill-1",
  password: "forge-skill-2",
  confirmPassword: "forge-skill-2",
});
assert.equal(changed.ok, true);

auth.signOut();
assert.equal(auth.currentAccount(), null);

const wrong = await auth.signInWithEmail({
  email: "dana@example.com",
  password: "forge-skill-1",
});
assert.equal(wrong.ok, false);

const signedIn = await auth.signInWithEmail({
  email: "dana@example.com",
  password: "forge-skill-2",
});
assert.equal(signedIn.ok, true);
assert.equal(signedIn.account.email, "dana@example.com");

const photo = auth.updateAvatar(signedIn.account.id, "data:image/jpeg;base64,aaaa");
assert.equal(photo.ok, true);
assert.equal(photo.account.avatarUrl.startsWith("data:image/jpeg"), true);

const google = auth.signInWithGoogle({
  email: "forge@gmail.com",
  name: "Forge Google",
  googleId: "google-sub-1",
  avatarUrl: "https://example.com/photo.jpg",
});
assert.equal(google.ok, true);
assert.equal(google.account.provider, AUTH_PROVIDERS.google);
assert.equal(google.account.emailVerified, true);
assert.equal(google.account.hasPassword, false);
assert.equal(google.account.avatarUrl, "https://example.com/photo.jpg");
assert.equal(onboardingStage(google.account), "ready");

const googleProfile = auth.completeProfile(google.account.id, { name: "Forge Google" });
assert.equal(googleProfile.ok, true);
assert.equal(onboardingStage(googleProfile.account), "ready");

const createdPassword = await auth.setPassword(googleProfile.account.id, {
  password: "google-pass-1",
  confirmPassword: "google-pass-1",
});
assert.equal(createdPassword.ok, true);
assert.equal(createdPassword.account.hasPassword, true);

auth.signOut();
const googleEmailSignIn = await auth.signInWithEmail({
  email: "forge@gmail.com",
  password: "google-pass-1",
});
assert.equal(googleEmailSignIn.ok, true);

const linked = auth.linkWallet(googleEmailSignIn.account.id, `0x${"a".repeat(40)}`);
assert.equal(linked.ok, true);
assert.equal(linked.account.walletAddress, `0x${"a".repeat(40)}`);
assert.equal(onboardingStage(linked.account), "ready");

console.log("auth account tests passed");
