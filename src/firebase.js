import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

function env(name, fallback) {
  try {
    const value = import.meta.env?.[name];
    if (typeof value === "string" && value.trim()) return value.trim();
  } catch {
    // Node scripts and tests do not have Vite env.
  }
  return fallback;
}

export const firebaseConfig = {
  apiKey: env("VITE_FIREBASE_API_KEY", "AIzaSyCnrQaiXUOCMlKfku9Y5ko2wslk0bWXnSc"),
  authDomain: env("VITE_FIREBASE_AUTH_DOMAIN", "skillforge-1.firebaseapp.com"),
  projectId: env("VITE_FIREBASE_PROJECT_ID", "skillforge-1"),
  storageBucket: env("VITE_FIREBASE_STORAGE_BUCKET", "skillforge-1.firebasestorage.app"),
  messagingSenderId: env("VITE_FIREBASE_MESSAGING_SENDER_ID", "1026391141211"),
  appId: env("VITE_FIREBASE_APP_ID", "1:1026391141211:web:cae23963b037c2a7b7887e"),
  measurementId: env("VITE_FIREBASE_MEASUREMENT_ID", "G-D1FWZ1R65N"),
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
function firestoreDb() {
  try {
    return initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    return getFirestore(app);
  }
}
export const db = firestoreDb();
export const storage = getStorage(app);

export const analyticsReady =
  typeof window === "undefined"
    ? Promise.resolve(null)
    : isSupported().then((supported) => (supported ? getAnalytics(app) : null));
