import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LESSON_EVENT_SOURCE_IDS } from "../src/data/learning.js";
import {
  isAllowedProgressEventSource,
} from "../src/utils/backend/schema.js";
import { PUBLIC_ENV_KEYS } from "../src/utils/frontendSecurity.js";
import { LEADERBOARD_DISCLAIMER } from "../src/utils/progression/leaderboard.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const firestoreRules = readFileSync(join(root, "firestore.rules"), "utf8");
const storageRules = readFileSync(join(root, "storage.rules"), "utf8");
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
const secretsAudit = readFileSync(join(root, "audit/SECRETS-AUDIT.md"), "utf8");
const threatModel = readFileSync(join(root, "audit/THREAT-MODEL.md"), "utf8");
const appCheck = readFileSync(join(root, "src/utils/appCheck.js"), "utf8");
const main = readFileSync(join(root, "src/main.jsx"), "utf8");
const envExample = readFileSync(join(root, ".env.example"), "utf8");
const progressionDoc = readFileSync(join(root, "docs/PROGRESSION.md"), "utf8");

assert.match(firestoreRules, /request\.auth\.token\.email_verified\s*==\s*true/);
assert.match(storageRules, /request\.auth\.token\.email_verified\s*==\s*true/);
assert.match(storageRules, /isVerifiedUser/);
assert.match(storageRules, /image\/jpeg/);
assert.match(storageRules, /image\/png/);
assert.match(storageRules, /image\/webp/);
assert.doesNotMatch(storageRules, /image\/\.\*/);

assert.ok(LESSON_EVENT_SOURCE_IDS.length >= 18, "expected shipped lesson ids");
for (const lessonId of LESSON_EVENT_SOURCE_IDS) {
  assert.match(
    firestoreRules,
    new RegExp(`'${lessonId}'`),
    `firestore.rules must allowlist LESSON_COMPLETED source ${lessonId}`
  );
  assert.equal(isAllowedProgressEventSource("LESSON_COMPLETED", lessonId), true);
}
assert.equal(isAllowedProgressEventSource("LESSON_COMPLETED", "farm-extra-lesson"), false);
assert.equal(isAllowedProgressEventSource("QUIZ_COMPLETED", "easy"), true);
assert.equal(isAllowedProgressEventSource("PUZZLE_PIECE_UNLOCKED", "piece-16"), false);
assert.match(firestoreRules, /validSectionScore\(data\.sectionScores\.easy\)/);
assert.match(firestoreRules, /acquiredPieces\.hasOnly/);
assert.match(firestoreRules, /!\('email' in data\.metadata\)/);
assert.match(firestoreRules, /resource\.data\.userId == request\.auth\.uid/);
assert.match(firestoreRules, /allow list: if isAuthenticated\(\) && resource.data.optIn == true/);
assert.match(firestoreRules, /allow get: if isAuthenticated\(\) && \(isOwner\(userId\) \|\| resource.data.optIn == true\)/);
assert.doesNotMatch(firestoreRules, /status == 'released'/);
assert.match(LEADERBOARD_DISCLAIMER, /not a tamper-proof exam/i);
assert.match(progressionDoc, /community ranking/i);

assert.equal(PUBLIC_ENV_KEYS.includes("VITE_FIREBASE_APPCHECK_SITE_KEY"), true);
assert.match(appCheck, /initializeAppCheck/);
assert.match(appCheck, /ReCaptchaV3Provider/);
assert.match(main, /initFirebaseAppCheck/);
assert.match(envExample, /VITE_FIREBASE_APPCHECK_SITE_KEY/);

const headerBlock = vercel.headers?.[0]?.headers || [];
const byKey = Object.fromEntries(headerBlock.map((row) => [row.key, row.value]));
assert.match(byKey["Content-Security-Policy"] || "", /default-src 'self'/);
assert.match(byKey["Content-Security-Policy"] || "", /frame-ancestors 'none'/);
assert.match(byKey["Content-Security-Policy"] || "", /www\.recaptcha\.net/);
assert.equal(byKey["X-Content-Type-Options"], "nosniff");
assert.equal(byKey["X-Frame-Options"], "DENY");
assert.equal(byKey["Cross-Origin-Opener-Policy"], "same-origin-allow-popups");
assert.equal(byKey["X-Permitted-Cross-Domain-Policies"], "none");
assert.match(byKey["Strict-Transport-Security"] || "", /max-age=/);
assert.match(byKey["Referrer-Policy"] || "", /strict-origin/);
assert.match(byKey["Permissions-Policy"] || "", /camera=\(\)/);

assert.match(secretsAudit, /None found/);
assert.match(secretsAudit, /\.env/);
assert.match(threatModel, /THREAT-MODEL|email_verified|App Check/i);

console.log("firebase security hardening checks passed");
