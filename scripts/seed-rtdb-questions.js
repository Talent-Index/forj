/**
 * Seed / bootstrap helper for Wave B RTDB question bank.
 * Prefer Ops UI "Import bundled bank" when signed in as an operator.
 *
 * Optional Admin SDK path (functions deps):
 *   GOOGLE_APPLICATION_CREDENTIALS=... node scripts/seed-rtdb-questions.js
 *   OPS_UID=<firebase-auth-uid> node scripts/seed-rtdb-questions.js
 *
 * Without credentials, prints a JSON summary of the bundled bank for manual import.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { sections } from "../src/data/questions.js";
import { QUESTION_STATUSES } from "../src/utils/backend/schema.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "functions/package.json"));

function buildBank(status = QUESTION_STATUSES.published) {
  const questions = {};
  const published = { easy: {}, medium: {}, hard: {}, master: {} };
  let count = 0;
  for (const section of sections) {
    for (const q of section.questions || []) {
      if (!q?.id) continue;
      const record = {
        id: q.id,
        sectionId: section.id,
        topic: q.topic || "general",
        question: q.question,
        options: q.options || [],
        answer: q.answer,
        explanation: q.explanation || "",
        reference: q.reference || null,
        funFact: q.funFact || null,
        status,
        updatedAt: Date.now(),
        updatedBy: "seed-script",
      };
      questions[q.id] = record;
      if (!published[section.id]) published[section.id] = {};
      published[section.id][q.id] = record;
      count += 1;
    }
  }
  return { questions, published, count };
}

async function seedWithAdmin(payload) {
  const admin = require("firebase-admin");
  if (!admin.apps.length) {
    admin.initializeApp({
      databaseURL:
        process.env.VITE_FIREBASE_DATABASE_URL
        || process.env.FIREBASE_DATABASE_URL
        || "https://skillforge-1-default-rtdb.firebaseio.com",
    });
  }
  const db = admin.database();
  const updates = {};
  for (const [id, record] of Object.entries(payload.questions)) {
    updates[`questions/${id}`] = record;
  }
  for (const [sectionId, map] of Object.entries(payload.published)) {
    for (const [id, record] of Object.entries(map)) {
      updates[`banks/published/${sectionId}/${id}`] = record;
    }
  }
  const opsUid = String(process.env.OPS_UID || "").trim();
  if (opsUid) {
    updates[`ops/operators/${opsUid}`] = true;
  }
  await db.ref().update(updates);
  return { count: payload.count, opsUid: opsUid || null };
}

async function main() {
  const payload = buildBank(QUESTION_STATUSES.published);
  const outPath = join(root, "scripts/seed-rtdb-questions.out.json");
  writeFileSync(outPath, JSON.stringify({
    count: payload.count,
    questionIds: Object.keys(payload.questions).slice(0, 20),
    note: "Full payload omitted from stdout; use Admin seed or Ops import.",
  }, null, 2));

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG) {
    try {
      const result = await seedWithAdmin(payload);
      console.log(
        `seeded ${result.count} questions to RTDB`
        + (result.opsUid ? `; operator ${result.opsUid}` : "")
      );
      return;
    } catch (error) {
      console.error("Admin seed failed:", error.message || error);
      process.exitCode = 1;
      return;
    }
  }

  console.log(
    `Bundled bank has ${payload.count} questions. `
    + `Wrote summary to ${outPath}. `
    + "Sign in as an operator and use Ops → Import + publish all, "
    + "or set GOOGLE_APPLICATION_CREDENTIALS (+ optional OPS_UID) to seed via Admin SDK."
  );
}

main();
