import assert from "node:assert/strict";
import {
  CLIENT_EVENT_TYPES,
  COLLECTIONS,
  CREDENTIAL_LIFECYCLE,
  ISSUER_ROLES,
  QUESTION_STATUSES,
  isClientEventType,
  progressEventDocId,
  walletDocId,
} from "../src/utils/backend/schema.js";
import { mapAuthError } from "../src/utils/backend/authErrors.js";
import { normalizeFirebaseUid, progressOwnerId, progressStorageKey } from "../src/utils/progress.js";

assert.equal(COLLECTIONS.learnerProfiles, "learnerProfiles");
assert.equal(COLLECTIONS.questionKeys, "questionKeys");
assert.equal(COLLECTIONS.issuers, "issuers");
assert.equal(isClientEventType("QUIZ_COMPLETED"), true);
assert.equal(isClientEventType("CREDENTIAL_ATTESTED"), false);
assert.equal(CLIENT_EVENT_TYPES.includes("CREDENTIAL_CLAIMED"), true);
assert.equal(walletDocId("0x" + "A".repeat(40)), "0x" + "a".repeat(40));
assert.equal(walletDocId("not-a-wallet"), null);
assert.ok(progressEventDocId("uid1", "QUIZ_COMPLETED", "easy").startsWith("uid1_QUIZ_COMPLETED_easy"));
assert.deepEqual(ISSUER_ROLES, ["OWNER", "ADMIN", "ISSUER", "REVIEWER", "VIEWER"]);
assert.equal(CREDENTIAL_LIFECYCLE.revoked, "REVOKED");
assert.equal(QUESTION_STATUSES.published, "PUBLISHED");

const firebaseUid = "AbCdEF1234567890xyzUVWXYZabc";
assert.equal(normalizeFirebaseUid(firebaseUid), firebaseUid);
assert.equal(progressOwnerId(firebaseUid), firebaseUid);
assert.equal(
  progressStorageKey(firebaseUid),
  `skillforge.progress.v1.account.${firebaseUid}`
);
assert.equal(progressOwnerId("0x" + "a".repeat(40)), "0x" + "a".repeat(40));
assert.equal(progressOwnerId("acc_" + "c".repeat(24)), "acc_" + "c".repeat(24));

assert.equal(mapAuthError({ code: "auth/email-already-in-use" }).includes("already exists"), true);
assert.equal(mapAuthError({ code: "auth/wrong-password" }).includes("incorrect"), true);

console.log("backend schema tests passed");
