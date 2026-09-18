import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PUBLIC_ENV_KEYS, sanitizeClientPayload } from "../src/utils/frontendSecurity.js";
import { isAllowedAnalyticsType, QUESTION_STATUSES } from "../src/utils/backend/schema.js";
import {
  mergeQuestionsById,
  mergeSectionWithPublished,
} from "../src/utils/rtdb/questionBank.js";
import { analyticsTypeForProgress } from "../src/utils/rtdb/paths.js";
import { summarizeAnalyticsFunnel } from "../src/utils/rtdb/analytics.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const databaseRules = readFileSync(join(root, "database.rules.json"), "utf8");
const firebaseJson = JSON.parse(readFileSync(join(root, "firebase.json"), "utf8"));
const firebaseJs = readFileSync(join(root, "src/firebase.js"), "utf8");
const envExample = readFileSync(join(root, ".env.example"), "utf8");

assert.equal(PUBLIC_ENV_KEYS.includes("VITE_FIREBASE_DATABASE_URL"), true);
assert.match(envExample, /VITE_FIREBASE_DATABASE_URL/);
assert.match(firebaseJs, /getDatabase/);
assert.match(firebaseJs, /databaseURL/);
assert.equal(Boolean(firebaseJson.database?.rules), true);
assert.match(databaseRules, /ops\/operators|ops.*operators/);
assert.match(databaseRules, /banks\/published|published/);
assert.match(databaseRules, /analytics/);

assert.equal(analyticsTypeForProgress("QUIZ_COMPLETED"), "quiz_completed");
assert.equal(analyticsTypeForProgress("LESSON_COMPLETED"), "lesson_completed");
assert.equal(isAllowedAnalyticsType("quiz_completed"), true);
assert.equal(isAllowedAnalyticsType("not_a_type"), false);

const blocked = sanitizeClientPayload({ email: "a@b.c", correct: 3, difficulty: "easy" });
assert.equal(blocked.email, undefined);
assert.equal(blocked.correct, 3);

const merged = mergeQuestionsById(
  [{ id: "a", question: "static" }],
  [{ id: "a", question: "rtdb" }, { id: "b", question: "new" }]
);
assert.equal(merged.find((q) => q.id === "a").question, "rtdb");
assert.equal(merged.length, 2);

const section = mergeSectionWithPublished(
  { id: "easy", questions: [{ id: "e1", question: "old" }] },
  [{ id: "e1", question: "new" }]
);
assert.equal(section.questions[0].question, "new");
assert.ok(Object.values(QUESTION_STATUSES).includes("PUBLISHED"));

const funnel = summarizeAnalyticsFunnel([
  { type: "quiz_completed", payload: { difficulty: "easy" } },
  { type: "quiz_completed", payload: { difficulty: "medium" } },
  { type: "lesson_completed", payload: {} },
]);
assert.equal(funnel.total, 3);
assert.equal(funnel.byType.quiz_completed, 2);
assert.equal(funnel.bySection.easy, 1);

console.log("rtdb wave-b checks passed");
