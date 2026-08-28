import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PUBLIC_ENV_KEYS } from "../src/utils/frontendSecurity.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const firestoreRules = readFileSync(join(root, "firestore.rules"), "utf8");
const storageRules = readFileSync(join(root, "storage.rules"), "utf8");
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
const secretsAudit = readFileSync(join(root, "audit/SECRETS-AUDIT.md"), "utf8");
const threatModel = readFileSync(join(root, "audit/THREAT-MODEL.md"), "utf8");
const appCheck = readFileSync(join(root, "src/utils/appCheck.js"), "utf8");
const main = readFileSync(join(root, "src/main.jsx"), "utf8");
const envExample = readFileSync(join(root, ".env.example"), "utf8");

assert.match(firestoreRules, /request\.auth\.token\.email_verified\s*==\s*true/);
assert.match(storageRules, /request\.auth\.token\.email_verified\s*==\s*true/);
assert.match(storageRules, /isVerifiedUser/);

assert.equal(PUBLIC_ENV_KEYS.includes("VITE_FIREBASE_APPCHECK_SITE_KEY"), true);
assert.match(appCheck, /initializeAppCheck/);
assert.match(appCheck, /ReCaptchaV3Provider/);
assert.match(main, /initFirebaseAppCheck/);
assert.match(envExample, /VITE_FIREBASE_APPCHECK_SITE_KEY/);

const headerBlock = vercel.headers?.[0]?.headers || [];
const byKey = Object.fromEntries(headerBlock.map((row) => [row.key, row.value]));
assert.match(byKey["Content-Security-Policy"] || "", /default-src 'self'/);
assert.match(byKey["Content-Security-Policy"] || "", /frame-ancestors 'none'/);
assert.equal(byKey["X-Content-Type-Options"], "nosniff");
assert.equal(byKey["X-Frame-Options"], "DENY");
assert.match(byKey["Strict-Transport-Security"] || "", /max-age=/);
assert.match(byKey["Referrer-Policy"] || "", /strict-origin/);
assert.match(byKey["Permissions-Policy"] || "", /camera=\(\)/);

assert.match(secretsAudit, /None found/);
assert.match(secretsAudit, /\.env/);
assert.match(threatModel, /THREAT-MODEL|email_verified|App Check/i);

console.log("firebase security hardening checks passed");
