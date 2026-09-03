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
import { learnerProfileFields, pickLearnerProfilePatch } from "../profileOnboarding";
import { normalizeAddress } from "../progress";
import { safeAvatarSrc } from "../frontendSecurity";
import { COLLECTIONS, SCHEMA_VERSION, WALLET_STATUSES, walletDocId } from "./schema";
import { FIRESTORE_TIMEOUT_MS, withTimeout } from "./timeout";
import { normalizeBoardName } from "../progression/leaderboard";

function stamp() {
  return serverTimestamp();
}

async function syncUserBoardListing(userId, { displayName, boardVisible } = {}) {
  if (!userId) return;
  const patch = { updatedAt: stamp() };
  if (displayName != null) patch.displayName = normalizeBoardName(displayName);
  if (boardVisible != null) patch.boardVisible = Boolean(boardVisible);
  await withTimeout(
    setDoc(doc(db, COLLECTIONS.users, userId), patch, { merge: true }),
    FIRESTORE_TIMEOUT_MS
  ).catch(() => {});
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
    avatarUrl: safeAvatarSrc(data.avatarUrl || user.photoURL || "") || "",
    hasPassword: user.providerData?.some((item) => item.providerId === "password") || false,
    createdAt: data.createdAt || null,
    migratedAt: data.migratedAt || null,
    migratedFrom: data.migratedFrom || null,
  };
}

function asAuthUser(user) {
  if (user && typeof user === "object") return user;
  return { uid: user, displayName: "", photoURL: "", providerData: [] };
}

function fullLearnerProfile(user, existing, patch) {
  return {
    ...learnerProfileFields(asAuthUser(user), existing, patch),
    createdAt: existing.createdAt ?? stamp(),
    updatedAt: stamp(),
  };
}

export async function ensureLearnerDocuments(user) {
  const userRef = doc(db, COLLECTIONS.users, user.uid);
  const profileRef = doc(db, COLLECTIONS.learnerProfiles, user.uid);
  let userSnap;
  let profileSnap;
  try {
    [userSnap, profileSnap] = await withTimeout(
      Promise.all([getDoc(userRef), getDoc(profileRef)]),
      FIRESTORE_TIMEOUT_MS
    );
  } catch {
    return profileFromDoc(user, {});
  }
  const writes = [];
  const boardName = normalizeBoardName(user.displayName || "");
  if (!userSnap.exists()) {
    writes.push(setDoc(userRef, {
      schemaVersion: SCHEMA_VERSION,
      userId: user.uid,
      provider: user.providerData?.some((item) => item.providerId === "google.com") ? "google" : "email",
      displayName: boardName,
      boardVisible: true,
      createdAt: stamp(),
      updatedAt: stamp(),
    }));
  } else {
    const data = userSnap.data() || {};
    if (!data.displayName) {
      writes.push(setDoc(userRef, {
        displayName: boardName,
        updatedAt: stamp(),
      }, { merge: true }));
    }
  }
  if (!profileSnap.exists()) {
    writes.push(setDoc(profileRef, fullLearnerProfile(user, {}, {})));
  }
  try {
    await withTimeout(Promise.all(writes), FIRESTORE_TIMEOUT_MS);
  } catch {
    return profileFromDoc(user, profileSnap.exists() ? profileSnap.data() : {});
  }
  const fresh = profileSnap.exists() ? profileSnap : await withTimeout(getDoc(profileRef), FIRESTORE_TIMEOUT_MS).catch(() => profileSnap);
  return profileFromDoc(user, fresh?.data?.() || {});
}

export async function readLearnerProfile(user) {
  const profileRef = doc(db, COLLECTIONS.learnerProfiles, user.uid);
  const snap = await withTimeout(getDoc(profileRef), FIRESTORE_TIMEOUT_MS);
  return profileFromDoc(user, snap.exists() ? snap.data() : {});
}

export async function upsertLearnerProfile(user, patch) {
  const authUser = asAuthUser(user);
  const profileRef = doc(db, COLLECTIONS.learnerProfiles, authUser.uid);
  const patchFields = { ...pickLearnerProfilePatch(patch), updatedAt: stamp() };

  let existing;
  try {
    const snap = await withTimeout(getDoc(profileRef), 4000);
    existing = snap.exists() ? snap.data() : null;
  } catch {
    existing = undefined;
  }

  if (existing === null) {
    const data = fullLearnerProfile(authUser, {}, patch);
    await setDoc(profileRef, data);
    await syncUserBoardListing(authUser.uid, { displayName: data.name, boardVisible: true });
    return data;
  }
  if (existing) {
    await setDoc(profileRef, patchFields, { merge: true });
    if (patchFields.name) {
      await syncUserBoardListing(authUser.uid, { displayName: patchFields.name });
    }
    return { ...existing, ...patchFields };
  }
  try {
    const data = fullLearnerProfile(authUser, {}, patch);
    await setDoc(profileRef, data);
    await syncUserBoardListing(authUser.uid, { displayName: data.name, boardVisible: true });
    return data;
  } catch {
    await setDoc(profileRef, patchFields, { merge: true });
    return patchFields;
  }
}

export async function patchLearnerProfile(userId, patch) {
  return upsertLearnerProfile(userId, patch);
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
  const existing = await withTimeout(getDoc(walletRef), FIRESTORE_TIMEOUT_MS);
  if (existing.exists()) {
    const owner = existing.data()?.userId;
    const status = existing.data()?.status;
    if (owner && owner !== userId && status === WALLET_STATUSES.active) {
      return { ok: false, error: "This wallet is already linked to another Forjora account." };
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
    const existing = await withTimeout(getDoc(walletRef), FIRESTORE_TIMEOUT_MS);
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
