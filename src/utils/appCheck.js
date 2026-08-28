import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { app } from "../firebase.js";
import { readPublicEnv } from "./frontendSecurity.js";

let appCheckInstance = null;

/**
 * Optional Firebase App Check. Initializes only when
 * VITE_FIREBASE_APPCHECK_SITE_KEY is set (reCAPTCHA v3 site key — public).
 * Enforce App Check in the Firebase console after the site key is configured.
 */
export function initFirebaseAppCheck() {
  if (typeof window === "undefined") return null;
  if (appCheckInstance) return appCheckInstance;

  const siteKey = readPublicEnv("VITE_FIREBASE_APPCHECK_SITE_KEY");
  if (!siteKey) return null;

  appCheckInstance = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  return appCheckInstance;
}
