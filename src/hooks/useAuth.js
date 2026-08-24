import { useCallback, useEffect, useMemo, useState } from "react";
import { createAuthStore, onboardingStage } from "../utils/auth";
import { createMemoryStorage } from "../utils/progress";

function storage() {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    // Ignore blocked storage.
  }
  return createMemoryStorage();
}

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function googleClientId() {
  try {
    return import.meta.env?.VITE_GOOGLE_CLIENT_ID || "";
  } catch {
    return "";
  }
}

let gisPromise = null;

function loadGoogleIdentity() {
  if (typeof window === "undefined") return Promise.reject(new Error("Google sign-in needs a browser."));
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-google-identity]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", () => reject(new Error("Google sign-in failed to load.")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.dataset.googleIdentity = "true";
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Google sign-in failed to load."));
    document.head.appendChild(script);
  });
  return gisPromise;
}

export function useAuth() {
  const store = useMemo(() => createAuthStore(storage()), []);
  const [account, setAccount] = useState(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    setAccount(store.currentAccount());
    setRestoring(false);
  }, [store]);

  const refresh = useCallback((result) => {
    if (result && result.ok === false) return result;
    const next = result?.account !== undefined ? result.account : store.currentAccount();
    setAccount(next);
    return result ? { ...result, account: next } : { ok: true, account: next };
  }, [store]);

  const registerWithEmail = useCallback((input) => store.registerWithEmail(input).then(refresh), [refresh, store]);
  const signInWithEmail = useCallback((input) => store.signInWithEmail(input).then(refresh), [refresh, store]);
  const signInWithGoogle = useCallback((input) => refresh(store.signInWithGoogle(input)), [refresh, store]);
  const verifyEmail = useCallback((token) => refresh(store.verifyEmail(token)), [refresh, store]);
  const resendVerification = useCallback((email) => refresh(store.resendVerification(email)), [refresh, store]);
  const requestPasswordReset = useCallback((email) => store.requestPasswordReset(email), [store]);
  const resetPassword = useCallback((input) => store.resetPassword(input), [store]);
  const changePassword = useCallback(
    (input) => store.changePassword(account?.id, input).then(refresh),
    [account?.id, refresh, store]
  );
  const setPassword = useCallback(
    (input) => store.setPassword(account?.id, input).then(refresh),
    [account?.id, refresh, store]
  );
  const completeProfile = useCallback(
    (input) => refresh(store.completeProfile(account?.id, input)),
    [account?.id, refresh, store]
  );
  const updateProfile = useCallback(
    (input) => refresh(store.updateProfile(account?.id, input)),
    [account?.id, refresh, store]
  );
  const updateAvatar = useCallback(
    (avatarUrl) => refresh(store.updateAvatar(account?.id, avatarUrl)),
    [account?.id, refresh, store]
  );
  const dismissWalletPrompt = useCallback(
    () => refresh(store.dismissWalletPrompt(account?.id)),
    [account?.id, refresh, store]
  );
  const linkWallet = useCallback(
    (address) => refresh(store.linkWallet(account?.id, address)),
    [account?.id, refresh, store]
  );
  const unlinkWallet = useCallback(
    () => refresh(store.unlinkWallet(account?.id)),
    [account?.id, refresh, store]
  );
  const changeEmail = useCallback(
    (email) => refresh(store.changeEmail(account?.id, email)),
    [account?.id, refresh, store]
  );
  const signOut = useCallback(() => refresh(store.signOut()), [refresh, store]);

  const continueWithGoogle = useCallback(async (fallbackIdentity) => {
    const clientId = googleClientId();
    if (!clientId) {
      if (fallbackIdentity?.email) return signInWithGoogle(fallbackIdentity);
      return { ok: false, error: "google-fallback", clientIdMissing: true };
    }
    const google = await loadGoogleIdentity();
    return new Promise((resolve) => {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          const payload = decodeJwtPayload(response.credential);
          if (!payload?.email) {
            resolve({ ok: false, error: "Google did not return an email." });
            return;
          }
          resolve(signInWithGoogle({
            email: payload.email,
            name: payload.name || "",
            googleId: payload.sub || "",
            avatarUrl: payload.picture || "",
          }));
        },
      });
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          resolve({ ok: false, error: "google-fallback", clientIdMissing: false });
        }
      });
    });
  }, [signInWithGoogle]);

  return {
    account,
    restoring,
    stage: onboardingStage(account),
    isAuthenticated: Boolean(account?.emailVerified),
    googleConfigured: Boolean(googleClientId()),
    registerWithEmail,
    signInWithEmail,
    signInWithGoogle,
    continueWithGoogle,
    verifyEmail,
    resendVerification,
    requestPasswordReset,
    resetPassword,
    changePassword,
    setPassword,
    completeProfile,
    updateProfile,
    updateAvatar,
    dismissWalletPrompt,
    linkWallet,
    unlinkWallet,
    changeEmail,
    signOut,
    linkWallet: linkWallet,
    verifyEmail: verifyEmail,
    completeProfile: completeProfile,
    dismissWalletPrompt: dismissWalletPrompt,
    signOut: signOut,
  };
}
