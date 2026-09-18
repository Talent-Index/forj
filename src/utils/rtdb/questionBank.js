import { get, ref, remove, set, update } from "firebase/database";
import { rtdb } from "../../firebase.js";
import { QUESTION_STATUSES } from "../backend/schema.js";
import { getValidQuestions } from "../quiz.js";
import { quizLengthFor } from "../quizConfig.js";
import { sections as staticSections } from "../../data/questions.js";
import {
  publishedQuestionPath,
  publishedSectionPath,
  questionPath,
  RTDB_PATHS,
} from "./paths.js";

const publishedCache = new Map();

function asQuestionRecord(raw, fallbackId = "") {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id || fallbackId || "").trim();
  if (!id) return null;
  return {
    id,
    sectionId: String(raw.sectionId || raw.difficulty || "").trim(),
    topic: raw.topic || "general",
    question: String(raw.question || "").trim(),
    options: Array.isArray(raw.options) ? raw.options.map(String) : [],
    answer: String(raw.answer || "").trim(),
    explanation: String(raw.explanation || "").trim(),
    reference: raw.reference && typeof raw.reference === "object"
      ? { title: String(raw.reference.title || ""), url: String(raw.reference.url || "") }
      : raw.reference || null,
    funFact: raw.funFact ? String(raw.funFact) : null,
    status: raw.status || QUESTION_STATUSES.draft,
    updatedAt: Number(raw.updatedAt) || 0,
    updatedBy: raw.updatedBy || "",
  };
}

export function mergeQuestionsById(baseList = [], overlayList = []) {
  const map = new Map();
  for (const q of baseList) {
    if (q?.id) map.set(String(q.id), q);
  }
  for (const q of overlayList) {
    if (q?.id) map.set(String(q.id), q);
  }
  return [...map.values()];
}

export function mergeSectionWithPublished(section, publishedList = []) {
  if (!section) return null;
  return {
    ...section,
    questions: mergeQuestionsById(section.questions || [], publishedList),
  };
}

export async function loadPublishedSection(sectionId) {
  if (!sectionId) return [];
  try {
    const snap = await get(ref(rtdb, publishedSectionPath(sectionId)));
    if (!snap.exists()) {
      publishedCache.set(sectionId, []);
      return [];
    }
    const list = [];
    snap.forEach((child) => {
      const record = asQuestionRecord(child.val(), child.key);
      if (record) list.push(record);
    });
    publishedCache.set(sectionId, list);
    return list;
  } catch {
    return publishedCache.get(sectionId) || [];
  }
}

export async function hydratePublishedBanks(sectionIds = ["easy", "medium", "hard", "master"]) {
  await Promise.all(sectionIds.map((id) => loadPublishedSection(id)));
  return publishedCache;
}

export function getCachedPublished(sectionId) {
  return publishedCache.get(sectionId) || [];
}

/** Static section with any hydrated RTDB published overlay (sync). */
export function getLiveSectionById(sectionId) {
  const base = staticSections.find((s) => s.id === sectionId) || null;
  if (!base) return null;
  return mergeSectionWithPublished(base, getCachedPublished(sectionId));
}

export function describeBankHealth(sectionId) {
  const section = getLiveSectionById(sectionId);
  const needed = quizLengthFor(sectionId);
  const size = getValidQuestions(section?.questions || []).length;
  const topics = new Set(getValidQuestions(section?.questions || []).map((q) => q.topic || "general"));
  return {
    sectionId,
    name: section?.name || sectionId,
    size,
    needed,
    ok: size >= needed,
    topics: [...topics].sort(),
    publishedOverlay: getCachedPublished(sectionId).length,
  };
}

export async function listAllQuestions() {
  const snap = await get(ref(rtdb, RTDB_PATHS.questions));
  if (!snap.exists()) return [];
  const rows = [];
  snap.forEach((child) => {
    const record = asQuestionRecord(child.val(), child.key);
    if (record) rows.push(record);
  });
  rows.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return rows;
}

export async function saveQuestion(question, uid) {
  const record = asQuestionRecord(question, question?.id);
  if (!record?.id || !record.question || record.options.length < 2 || !record.answer) {
    return { ok: false, error: "Question needs id, prompt, options, and answer." };
  }
  if (!Object.values(QUESTION_STATUSES).includes(record.status)) {
    record.status = QUESTION_STATUSES.draft;
  }
  record.updatedAt = Date.now();
  record.updatedBy = uid || "";
  await set(ref(rtdb, questionPath(record.id)), record);
  return { ok: true, question: record };
}

export async function deleteQuestion(questionId) {
  if (!questionId) return { ok: false };
  await remove(ref(rtdb, questionPath(questionId)));
  return { ok: true };
}

/** Copy status=PUBLISHED questions for a section into /banks/published/{sectionId}. */
export async function publishSection(sectionId, uid) {
  if (!sectionId) return { ok: false, error: "Missing section." };
  const all = await listAllQuestions();
  const published = all.filter(
    (q) => q.sectionId === sectionId && q.status === QUESTION_STATUSES.published
  );
  const sectionRef = ref(rtdb, publishedSectionPath(sectionId));
  await set(sectionRef, null);
  const updates = {};
  for (const q of published) {
    const payload = {
      id: q.id,
      sectionId: q.sectionId,
      topic: q.topic,
      question: q.question,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      reference: q.reference,
      funFact: q.funFact,
      status: QUESTION_STATUSES.published,
      updatedAt: Date.now(),
      updatedBy: uid || "",
    };
    updates[`${RTDB_PATHS.publishedBanks}/${sectionId}/${q.id}`] = payload;
  }
  if (Object.keys(updates).length) {
    await update(ref(rtdb), updates);
  }
  await loadPublishedSection(sectionId);
  return { ok: true, count: published.length };
}

/** Import bundled static+generated questions as DRAFT (or PUBLISHED) into /questions. */
export async function importBundledBank({ uid, status = QUESTION_STATUSES.draft } = {}) {
  const updates = {};
  let count = 0;
  for (const section of staticSections) {
    for (const q of section.questions || []) {
      if (!q?.id) continue;
      const record = asQuestionRecord({
        ...q,
        sectionId: section.id,
        status,
        updatedAt: Date.now(),
        updatedBy: uid || "",
      }, q.id);
      if (!record) continue;
      updates[`${RTDB_PATHS.questions}/${record.id}`] = record;
      count += 1;
    }
  }
  if (count) await update(ref(rtdb), updates);
  return { ok: true, count };
}

export { publishedQuestionPath, QUESTION_STATUSES };
