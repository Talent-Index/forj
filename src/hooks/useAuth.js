import { useCallback, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  applyActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";
import {
  MAX_AVATAR_BYTES,
  MIN_PASSWORD_LENGTH,
  isValidEmail,
  normalizeEmail,
  onboardingStage,
  passwordIssue,
} from "../utils/auth";
import { mapAuthError } from "../utils/backend/authErrors";
import {
  ensureLearnerDocuments,
  linkWalletRecord,
  profileFromDoc,
  readLearnerProfile,
  unlinkWalletRecord,
  upsertLearnerProfile,
} from "../utils/backend/learner";
import { AUTH_WRITE_TIMEOUT_MS, FIRESTORE_TIMEOUT_MS, withTimeout } from "../utils/backend/timeout";
import { safeAvatarSrc } from "../utils/frontendSecurity";
import {
  applyProfileCompletion,
  applySignupIdentity,
  mergeHydratedProfile,
} from "../utils/profileOnboarding";
import { validateRecipientName } from "../utils/recipient";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

function actionUrl() {
  try {
    return `${window.location.origin}/`;
  } catch {
    return undefined;
  }
}

async function safeProfile(user) {
  try {
    return await ensureLearnerDocuments(user);
  } catch {
    try {
      return await readLearnerProfile(user);
    } catch {
      return profileFromDoc(user, {});
    }
  }
}

export function useAuth() {
  const [account, setAccount] = useState(null);
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(true);

  const hydrate = useCallback(async (nextUser) => {
    if (!nextUser) {
      setUser(null);
      setAccount(null);
      return null;
    }
    const profile = await safeProfile(nextUser);
    const signedUp = applySignupIdentity(profile, profile.name || nextUser.displayName);
    const nextProfile = signedUp.complete ? signedUp.account : profile;
    if (signedUp.complete && !profile.profileComplete) {
      void upsertLearnerProfile(nextUser, {
        name: nextProfile.name,
        profileComplete: true,
        walletPromptSeen: true,
        avatarUrl: nextProfile.avatarUrl || "",
      }).catch(() => {});
    }
    setUser(nextUser);
    let merged = nextProfile;
    setAccount((previous) => {
      merged = mergeHydratedProfile(previous, nextProfile);
      return merged;
    });
    return merged;
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      await hydrate(nextUser);
      setRestoring(false);
    });
    return () => unsub();
  }, [hydrate]);

  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) return { ok: true, account: null };
    await reload(auth.currentUser);
    const profile = await hydrate(auth.currentUser);
    return { ok: true, account: profile };
  }, [hydrate]);

  const registerWithEmail = useCallback(async ({ name, email, password, confirmPassword }) => {
    const recipient = validateRecipientName(name);
    if (!recipient.ok) return { ok: false, error: recipient.error };
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) return { ok: false, error: "Enter a valid email address." };
    const issue = passwordIssue(password, confirmPassword);
    if (issue) return { ok: false, error: issue };
    try {
      const credential = await createUserWithEmailAndPassword(auth, normalized, password);
      await updateProfile(credential.user, { displayName: recipient.name });
      const profile = await safeProfile(credential.user);
      await upsertLearnerProfile(credential.user, {
        name: recipient.name,
        profileComplete: true,
        walletPromptSeen: true,
      }).catch(() => {});
      await sendEmailVerification(credential.user, { url: actionUrl() });
      const accountState = {
        ...profile,
        name: recipient.name,
        emailVerified: false,
        profileComplete: true,
        walletPromptSeen: true,
      };
      setAccount(accountState);
      return { ok: true, account: accountState };
    } catch (error) {
      return { ok: false, error: mapAuthError(error) };
    }
  }, []);

  const signInWithEmail = useCallback(async ({ email, password }) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
      const profile = await hydrate(credential.user);
      return { ok: true, account: profile };
    } catch (error) {
      return { ok: false, error: mapAuthError(error) };
    }
  }, [hydrate]);

  const continueWithGoogle = useCallback(async () => {
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const profile = await hydrate(credential.user);
      return { ok: true, account: profile };
    } catch (error) {
      return { ok: false, error: mapAuthError(error), code: error.code };
    }
  }, [hydrate]);

  const verifyEmail = useCallback(async (oobCode) => {
    try {
      if (oobCode) await applyActionCode(auth, oobCode);
      else if (auth.currentUser) {
        await reload(auth.currentUser);
        if (!auth.currentUser.emailVerified) {
          return { ok: false, error: "Open the verification link from your email to continue." };
        }
      }
      return refreshUser();
    } catch (error) {
      return { ok: false, error: mapAuthError(error) };
    }
  }, [refreshUser]);

  const resendVerification = useCallback(async () => {
    try {
      if (!auth.currentUser) return { ok: false, error: "Sign in to continue." };
      await sendEmailVerification(auth.currentUser, { url: actionUrl() });
      return { ok: true, account };
    } catch (error) {
      return { ok: false, error: mapAuthError(error) };
    }
  }, [account]);

  const requestPasswordReset = useCallback(async (email) => {
    try {
      await sendPasswordResetEmail(auth, normalizeEmail(email), { url: actionUrl() });
      return { ok: true };
    } catch (error) {
      if (error.code === "auth/user-not-found") return { ok: true };
      return { ok: false, error: mapAuthError(error) };
    }
  }, []);

  const resetPassword = useCallback(async ({ oobCode, password, confirmPassword }) => {
    const issue = passwordIssue(password, confirmPassword);
    if (issue) return { ok: false, error: issue };
    try {
      await confirmPasswordReset(auth, oobCode, password);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: mapAuthError(error) };
    }
  }, []);

  const changePassword = useCallback(async ({ currentPassword, password, confirmPassword }) => {
    const issue = passwordIssue(password, confirmPassword);
    if (issue) return { ok: false, error: issue };
    try {
      if (!auth.currentUser?.email) return { ok: false, error: "Sign in to continue." };
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, password);
      return refreshUser();
    } catch (error) {
      return { ok: false, error: mapAuthError(error) };
    }
  }, [refreshUser]);

  const setPassword = useCallback(async ({ password, confirmPassword }) => {
    const issue = passwordIssue(password, confirmPassword);
    if (issue) return { ok: false, error: issue };
    try {
      await updatePassword(auth.currentUser, password);
      return refreshUser();
    } catch (error) {
      return { ok: false, error: mapAuthError(error) };
    }
  }, [refreshUser]);

  const persistProfilePatch = useCallback(async (patch) => {
    if (!auth.currentUser) return;
    try {
      if (patch.name) {
        await withTimeout(
          updateProfile(auth.currentUser, { displayName: patch.name }),
          AUTH_WRITE_TIMEOUT_MS
        );
      }
      await withTimeout(upsertLearnerProfile(auth.currentUser, patch), FIRESTORE_TIMEOUT_MS);
    } catch {
      // Local account already advanced; cloud write can catch up later.
    }
  }, []);

  const completeProfile = useCallback(async ({ name, learningGoal = "", avatarUrl } = {}) => {
    const base = account || (auth.currentUser ? profileFromDoc(auth.currentUser, {}) : null);
    const next = applyProfileCompletion(base, { name, learningGoal, avatarUrl });
    if (!next.ok) return next;
    setAccount(next.account);
    void persistProfilePatch({
      name: next.account.name,
      learningGoal: next.account.learningGoal,
      profileComplete: true,
      walletPromptSeen: true,
      avatarUrl: next.account.avatarUrl,
    });
    return { ok: true, account: next.account };
  }, [account, persistProfilePatch]);

  const updateLearnerProfile = useCallback(async (patch) => {
    if (!account && !auth.currentUser) return { ok: false, error: "Sign in to continue." };
    let nextAccount = { ...(account || profileFromDoc(auth.currentUser, {})), ...patch };
    if (patch.name != null) {
      const recipient = validateRecipientName(patch.name);
      if (!recipient.ok) return { ok: false, error: recipient.error };
      nextAccount = { ...nextAccount, name: recipient.name };
    }
    setAccount(nextAccount);
    void persistProfilePatch(nextAccount.name ? { ...patch, name: nextAccount.name } : patch);
    return { ok: true, account: nextAccount };
  }, [account, persistProfilePatch]);

  const updateAvatar = useCallback((avatarUrl) => {
    const next = avatarUrl || "";
    if (next && next.length > MAX_AVATAR_BYTES) {
      return Promise.resolve({ ok: false, error: "That image is too large. Try a smaller photo." });
    }
    const safe = next ? safeAvatarSrc(next) : "";
    if (next && !safe) {
      return Promise.resolve({ ok: false, error: "Use a JPEG, PNG, or WebP photo." });
    }
    return updateLearnerProfile({ avatarUrl: safe });
  }, [updateLearnerProfile]);

  const linkWallet = useCallback(async (address) => {
    if (!auth.currentUser) return { ok: false, error: "Sign in to continue." };
    try {
      const result = await linkWalletRecord(auth.currentUser.uid, address);
      if (!result.ok) return result;
      return refreshUser();
    } catch (error) {
      return { ok: false, error: mapAuthError(error) };
    }
  }, [refreshUser]);

  const unlinkWallet = useCallback(async () => {
    if (!auth.currentUser) return { ok: false, error: "Sign in to continue." };
    try {
      await unlinkWalletRecord(auth.currentUser.uid, account?.walletAddress);
      return refreshUser();
    } catch (error) {
      return { ok: false, error: mapAuthError(error) };
    }
  }, [account, refreshUser]);

  const changeEmail = useCallback(async (email) => {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) return { ok: false, error: "Enter a valid email address." };
    try {
      await updateEmail(auth.currentUser, normalized);
      await sendEmailVerification(auth.currentUser, { url: actionUrl() });
      return refreshUser();
    } catch (error) {
      return { ok: false, error: mapAuthError(error) };
    }
  }, [refreshUser]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setAccount(null);
    setUser(null);
    return { ok: true, account: null };
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      if (!auth.currentUser) return { ok: false, error: "Sign in to continue." };
      await deleteUser(auth.currentUser);
      setAccount(null);
      setUser(null);
      return { ok: true, account: null };
    } catch (error) {
      return { ok: false, error: mapAuthError(error) };
    }
  }, []);

  return {
    account,
    user,
    restoring,
    stage: onboardingStage(account),
    isAuthenticated: Boolean(account?.emailVerified),
    googleConfigured: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    registerWithEmail,
    signInWithEmail,
    signInWithGoogle: continueWithGoogle,
    continueWithGoogle,
    verifyEmail,
    resendVerification,
    requestPasswordReset,
    resetPassword,
    changePassword,
    setPassword,
    completeProfile,
    updateProfile: updateLearnerProfile,
    updateAvatar,
    linkWallet,
    unlinkWallet,
    changeEmail,
    signOut,
    deleteAccount,
    refreshUser,
  };
}
