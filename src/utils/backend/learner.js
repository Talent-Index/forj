import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { normalizeAddress } from "../progress";
import { COLLECTIONS, SCHEMA_VERSION, WALLET_STATUSES, walletDocId } from "./schema";

function stamp() {
  return serverTimestamp();
}

export function profileFromDoc(user, data = {}) {
  const provider = user.providerData?.some((item) => item.providerId === "google.com")
    ? "google"
    : "email";
  return {
    id: user.uid,
    email: user.email || "",
    name: data.name || user.displayName || "",
    provider,
    emailVerified: Boolean(user.emailVerified),
    googleId: user.providerData?.find((item) => item.providerId === "google.com")?.uid || "",
    learningGoal: data.learningGoal || "",
    profileComplete: Boolean(data.profileComplete),
    walletPromptSeen: Boolean(data.walletPromptSeen),
    walletAddress: data.walletAddress || null,
    avatarUrl: data.avatarUrl || user.photoURL || "",
    hasPassword: user.providerData?.some((item) => item.providerId === "password") || false,
    createdAt: data.createdAt || null,
    migratedAt: data.migratedAt || null,
    migratedFrom: data.migratedFrom || null,
  };
}

export async function ensureLearnerDocuments(user) {
  const userRef = doc(db, COLLECTIONS.users, user.uid);
  const profileRef = doc(db, COLLECTIONS.learnerProfiles, user.uid);
  const [userSnap, profileSnap] = await Promise.all([getDoc(userRef), getDoc(profileRef)]);
  const writes = [];
  if (!userSnap.exists()) {
    writes.push(setDoc(userRef, {
      schemaVersion: SCHEMA_VERSION,
      userId: user.uid,
      provider: user.providerData?.some((item) => item.providerId === "google.com") ? "google" : "email",
      createdAt: stamp(),
      updatedAt: stamp(),
    }));
  }
  if (!profileSnap.exists()) {
    writes.push(setDoc(profileRef, {
      schemaVersion: SCHEMA_VERSION,
      userId: user.uid,
      name: (user.displayName || "").slice(0, 80),
      learningGoal: "",
      profileComplete: false,
      walletPromptSeen: false,
      walletAddress: null,
      avatarUrl: user.photoURL || "",
      migratedFrom: null,
      migratedAt: null,
      createdAt: stamp(),
      updatedAt: stamp(),
    }));
  }
  await Promise.all(writes);
  const fresh = profileSnap.exists() ? profileSnap : await getDoc(profileRef);
  return profileFromDoc(user, fresh.data() || {});
}

export async function readLearnerProfile(user) {
  const profileRef = doc(db, COLLECTIONS.learnerProfiles, user.uid);
  const snap = await getDoc(profileRef);
  return profileFromDoc(user, snap.exists() ? snap.data() : {});
}

export async function patchLearnerProfile(userId, patch) {
  const profileRef = doc(db, COLLECTIONS.learnerProfiles, userId);
  await updateDoc(profileRef, { ...patch, updatedAt: stamp() });
}

export async function markMigrated(userId, migratedFrom) {
  await patchLearnerProfile(userId, {
    migratedFrom: migratedFrom || "localStorage",
    migratedAt: Timestamp.now(),
  });
}

export async function linkWalletRecord(userId, address) {
  const walletId = walletDocId(address) || normalizeAddress(address);
  if (!walletId) return { ok: false, error: "Connect a valid wallet address." };
  const walletRef = doc(db, COLLECTIONS.wallets, walletId);
  const existing = await getDoc(walletRef);
  if (existing.exists()) {
    const owner = existing.data()?.userId;
    const status = existing.data()?.status;
    if (owner && owner !== userId && status === WALLET_STATUSES.active) {
      return { ok: false, error: "This wallet is already linked to another SkillForge account." };
    }
    if (owner === userId) {
      await patchLearnerProfile(userId, { walletAddress: walletId, walletPromptSeen: true });
      return { ok: true, walletAddress: walletId };
    }
  }
  await setDoc(walletRef, {
    schemaVersion: SCHEMA_VERSION,
    userId,
    address: walletId,
    status: WALLET_STATUSES.active,
    linkedAt: stamp(),
    updatedAt: stamp(),
  });
  await setDoc(doc(collection(db, COLLECTIONS.walletEvents)), {
    schemaVersion: SCHEMA_VERSION,
    userId,
    address: walletId,
    action: "linked",
    createdAt: stamp(),
  });
  await patchLearnerProfile(userId, { walletAddress: walletId, walletPromptSeen: true });
  return { ok: true, walletAddress: walletId };
}

export async function unlinkWalletRecord(userId, address) {
  const walletId = walletDocId(address) || normalizeAddress(address);
  if (walletId) {
    const walletRef = doc(db, COLLECTIONS.wallets, walletId);
    const existing = await getDoc(walletRef);
    if (existing.exists() && existing.data()?.userId === userId) {
      await updateDoc(walletRef, {
        status: WALLET_STATUSES.released,
        updatedAt: stamp(),
      });
      await setDoc(doc(collection(db, COLLECTIONS.walletEvents)), {
        schemaVersion: SCHEMA_VERSION,
        userId,
        address: walletId,
        action: "released",
        createdAt: stamp(),
      });
    }
  }
  await patchLearnerProfile(userId, { walletAddress: null });
  return { ok: true };
}

export async function findActiveWallet(address) {
  const walletId = walletDocId(address);
  if (!walletId) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.wallets, walletId));
  return snap.exists() ? snap.data() : null;
}

export async function listWalletEvents(userId) {
  const snap = await getDocs(query(
    collection(db, COLLECTIONS.walletEvents),
    where("userId", "==", userId)
  ));
  return snap.docs.map((item) => item.data());
}
