import { SCHEMA_VERSION } from "./backend/schema.js";
import { validateRecipientName } from "./recipient.js";

const LEARNING_GOAL_IDS = ["avalanche", "web3", "credentials", "development"];

export const LEARNER_PROFILE_PATCH_KEYS = Object.freeze([
  "name",
  "learningGoal",
  "profileComplete",
  "walletPromptSeen",
  "walletAddress",
  "avatarUrl",
  "migratedFrom",
  "migratedAt",
]);

export const LEARNER_PROFILE_REQUIRED_KEYS = Object.freeze([
  "schemaVersion",
  "userId",
  "name",
  "learningGoal",
  "profileComplete",
  "walletPromptSeen",
  "walletAddress",
  "avatarUrl",
]);

export const AUTH_FLOW_BUTTONS = Object.freeze({
  landingStart: { label: "Start Learning →" },
  landingSignIn: { label: "Sign in" },
  landingCredentials: { label: "Explore Credentials →" },
  google: { label: "Continue with Google" },
  createAccount: { label: "Create account" },
  signIn: { label: "Sign in" },
  forgot: { label: "Forgot password?" },
  sendReset: { label: "Send reset link" },
  backToSignIn: { label: "Back to sign in" },
  updatePassword: { label: "Update password" },
  verified: { label: "I have verified my email" },
  resend: { label: "Resend email" },
  confirmName: { label: "Continue" },
  connectWallet: { label: "Connect wallet" },
  skipWallet: { label: "Continue without wallet" },
});

export function normalizeLearningGoal(value) {
  return LEARNING_GOAL_IDS.includes(value) ? value : "";
}

export function pickLearnerProfilePatch(patch = {}) {
  const fields = {};
  for (const key of LEARNER_PROFILE_PATCH_KEYS) {
    if (patch[key] !== undefined) fields[key] = patch[key];
  }
  return fields;
}

export function learnerProfileFields(user, existing = {}, patch = {}) {
  const uid = user?.uid || user?.id || "";
  return {
    schemaVersion: SCHEMA_VERSION,
    userId: uid,
    name: String(patch.name ?? existing.name ?? user?.displayName ?? "").slice(0, 80),
    learningGoal: normalizeLearningGoal(patch.learningGoal ?? existing.learningGoal ?? ""),
    profileComplete: Boolean(patch.profileComplete ?? existing.profileComplete),
    walletPromptSeen: Boolean(patch.walletPromptSeen ?? existing.walletPromptSeen),
    walletAddress: patch.walletAddress !== undefined ? patch.walletAddress : (existing.walletAddress ?? null),
    avatarUrl: String(patch.avatarUrl ?? existing.avatarUrl ?? user?.photoURL ?? ""),
    migratedFrom: patch.migratedFrom !== undefined ? patch.migratedFrom : (existing.migratedFrom ?? null),
    migratedAt: patch.migratedAt !== undefined ? patch.migratedAt : (existing.migratedAt ?? null),
  };
}

export function applyProfileCompletion(account, { name, learningGoal = "", avatarUrl } = {}) {
  if (!account) return { ok: false, error: "Sign in to continue." };
  const recipient = validateRecipientName(name);
  if (!recipient.ok) return { ok: false, error: recipient.error };
  return {
    ok: true,
    account: {
      ...account,
      name: recipient.name,
      learningGoal: normalizeLearningGoal(learningGoal),
      profileComplete: true,
      walletPromptSeen: true,
      avatarUrl: avatarUrl == null ? account.avatarUrl || "" : avatarUrl,
    },
  };
}

export function applySignupIdentity(account, name) {
  if (!account) return { ok: false, complete: false, error: "Sign in to continue." };
  const recipient = validateRecipientName(name || account.name);
  if (!recipient.ok) {
    return { ok: true, complete: false, account, error: recipient.error };
  }
  return {
    ...applyProfileCompletion(account, {
      name: recipient.name,
      learningGoal: account.learningGoal,
      avatarUrl: account.avatarUrl,
    }),
    complete: true,
  };
}

export function applyWalletPromptDismissed(account) {
  if (!account) return { ok: false, error: "Sign in to continue." };
  return {
    ok: true,
    account: {
      ...account,
      walletPromptSeen: true,
    },
  };
}

export function mergeHydratedProfile(previous, incoming) {
  if (!incoming) return null;
  if (!previous || previous.id !== incoming.id) return incoming;
  return {
    ...incoming,
    name: incoming.name || previous.name,
    learningGoal: incoming.learningGoal || previous.learningGoal,
    profileComplete: Boolean(incoming.profileComplete || previous.profileComplete),
    walletPromptSeen: Boolean(incoming.walletPromptSeen || previous.walletPromptSeen),
    avatarUrl: incoming.avatarUrl || previous.avatarUrl,
    walletAddress: incoming.walletAddress || previous.walletAddress,
  };
}
