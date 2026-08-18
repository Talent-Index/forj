import { getSectionById } from "../data/questions.js";
import { QUESTIONS_PER_QUIZ } from "./quiz.js";
import { spentPointsFor, normalizePieces } from "./puzzle.js";
import { validateRecipientName } from "./recipient.js";

export const STORAGE_VERSION = 1;
export const SCORE_SECTIONS = ["easy", "medium", "hard"];
export const PROGRESS_VIEWS = {
  SECTIONS: "sections",
  QUIZ: "quiz",
  PUZZLE: "puzzle",
  CERTIFICATE: "certificate",
};

const VIEW_VALUES = new Set(Object.values(PROGRESS_VIEWS));
const MAX_ATTEMPTS = 40;

function toNonNegativeInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export function normalizeAddress(address) {
  if (typeof address !== "string") return null;
  const value = address.trim().toLowerCase();
  return /^0x[a-f0-9]{40}$/.test(value) ? value : null;
}

export function progressStorageKey(address, version = STORAGE_VERSION) {
  const normalized = normalizeAddress(address);
  if (!normalized) return null;
  return `skillforge.progress.v${version}.${normalized}`;
}

export function legacyProgressStorageKey(address) {
  const normalized = normalizeAddress(address);
  if (!normalized) return null;
  return `skillforge_progress_${normalized}`;
}

export function emptyProgress() {
  return {
    version: STORAGE_VERSION,
    view: PROGRESS_VIEWS.SECTIONS,
    activeSection: null,
    totalPoints: 0,
    spentPoints: 0,
    acquiredPieces: [],
    sectionScores: {},
    completedSections: [],
    attempts: [],
    recipientName: "",
  };
}

export function emptySectionScores() {
  return {};
}

export function normalizeSectionResult(result) {
  const sectionId = result?.sectionId;
  if (!SCORE_SECTIONS.includes(sectionId)) return null;

  const section = getSectionById(sectionId);
  if (!section) return null;

  const total = QUESTIONS_PER_QUIZ;
  const correct = Math.min(toNonNegativeInt(result.correct), total);
  return {
    sectionId,
    correct,
    total,
    pointsEarned: correct * section.pointsPerQuestion,
    wrong: Math.min(toNonNegativeInt(result.wrong), total),
  };
}

export function recomputeTotalPoints(sectionScores) {
  return SCORE_SECTIONS.reduce((sum, sectionId) => {
    const score = sectionScores?.[sectionId];
    return sum + toNonNegativeInt(score?.pointsEarned);
  }, 0);
}

function sanitizeSectionScores(rawScores) {
  const sectionScores = {};
  if (!rawScores || typeof rawScores !== "object" || Array.isArray(rawScores)) {
    return sectionScores;
  }
  for (const sectionId of SCORE_SECTIONS) {
    if (!rawScores[sectionId]) continue;
    const normalized = normalizeSectionResult({
      sectionId,
      ...rawScores[sectionId],
    });
    if (!normalized) continue;
    sectionScores[sectionId] = {
      correct: normalized.correct,
      total: normalized.total,
      pointsEarned: normalized.pointsEarned,
    };
  }
  return sectionScores;
}

function sanitizeCompletedSections(value, sectionScores) {
  const fromValue = Array.isArray(value) ? value : [];
  const merged = [...fromValue, ...Object.keys(sectionScores || {})];
  const seen = new Set();
  const completed = [];
  for (const sectionId of merged) {
    if (!SCORE_SECTIONS.includes(sectionId) || seen.has(sectionId)) continue;
    seen.add(sectionId);
    completed.push(sectionId);
  }
  return completed;
}

function sanitizeAttempts(value) {
  if (!Array.isArray(value)) return [];
  const attempts = [];
  for (const item of value) {
    const normalized = normalizeSectionResult(item);
    if (!normalized) continue;
    attempts.push(normalized);
    if (attempts.length >= MAX_ATTEMPTS) break;
  }
  return attempts;
}

function sanitizeView(view, activeSection) {
  const nextView = VIEW_VALUES.has(view) ? view : PROGRESS_VIEWS.SECTIONS;
  const nextSection = SCORE_SECTIONS.includes(activeSection) ? activeSection : null;
  if (nextView === PROGRESS_VIEWS.QUIZ && !nextSection) {
    return { view: PROGRESS_VIEWS.SECTIONS, activeSection: null };
  }
  return { view: nextView, activeSection: nextSection };
}

export function sanitizeProgress(raw) {
  try {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return emptyProgress();
    }
    const sectionScores = sanitizeSectionScores(raw.sectionScores);
    const acquiredPieces = normalizePieces(raw.acquiredPieces);
    const { view, activeSection } = sanitizeView(raw.view, raw.activeSection);
    const recipient = validateRecipientName(raw.recipientName);
    return {
      version: STORAGE_VERSION,
      view,
      activeSection,
      sectionScores,
      completedSections: sanitizeCompletedSections(raw.completedSections, sectionScores),
      attempts: sanitizeAttempts(raw.attempts),
      acquiredPieces,
      spentPoints: spentPointsFor(acquiredPieces),
      totalPoints: recomputeTotalPoints(sectionScores),
      recipientName: recipient.ok ? recipient.name : "",
    };
  } catch {
    return emptyProgress();
  }
}

export function applySectionResult(sectionScores, result) {
  const current = sectionScores && typeof sectionScores === "object" ? sectionScores : {};
  const normalized = normalizeSectionResult(result);
  if (!normalized) {
    return {
      sectionScores: { ...current },
      totalPoints: recomputeTotalPoints(current),
    };
  }

  const nextScores = {
    ...current,
    [normalized.sectionId]: {
      correct: normalized.correct,
      total: normalized.total,
      pointsEarned: normalized.pointsEarned,
    },
  };

  return {
    sectionScores: nextScores,
    totalPoints: recomputeTotalPoints(nextScores),
  };
}

export function applyAttemptHistory(attempts) {
  return (attempts || []).reduce(
    (state, result) => applySectionResult(state.sectionScores, result),
    { sectionScores: emptySectionScores(), totalPoints: 0 }
  );
}

function readRaw(storage, address) {
  const currentKey = progressStorageKey(address);
  const legacyKey = legacyProgressStorageKey(address);
  if (!currentKey) return null;
  try {
    const current = storage.getItem(currentKey);
    if (typeof current === "string" && current.length > 0) return { raw: current, key: currentKey };
    if (legacyKey) {
      const legacy = storage.getItem(legacyKey);
      if (typeof legacy === "string" && legacy.length > 0) return { raw: legacy, key: legacyKey };
    }
  } catch {
    return null;
  }
  return null;
}

function parseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function createMemoryStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

function defaultStorage() {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    // Private mode or blocked storage.
  }
  return createMemoryStorage();
}

export function createProgressStore(storage = defaultStorage()) {
  return {
    load(address) {
      const normalized = normalizeAddress(address);
      if (!normalized) return emptyProgress();
      const record = readRaw(storage, normalized);
      if (!record) return emptyProgress();
      const parsed = parseJson(record.raw);
      const progress = sanitizeProgress(parsed);
      const currentKey = progressStorageKey(normalized);
      if (currentKey && record.key !== currentKey) {
        try {
          storage.setItem(currentKey, JSON.stringify(progress));
          storage.removeItem(record.key);
        } catch {
          // Keep serving the sanitized snapshot even if migration cannot persist.
        }
      }
      return progress;
    },
    save(address, progress) {
      const key = progressStorageKey(address);
      if (!key) return false;
      try {
        storage.setItem(key, JSON.stringify(sanitizeProgress(progress)));
        return true;
      } catch {
        return false;
      }
    },
    clear(address) {
      const key = progressStorageKey(address);
      const legacyKey = legacyProgressStorageKey(address);
      if (!key) return false;
      try {
        storage.removeItem(key);
        if (legacyKey) storage.removeItem(legacyKey);
        return true;
      } catch {
        return false;
      }
    },
  };
}

const defaultStore = createProgressStore();

export function loadProgress(address) {
  return defaultStore.load(address);
}

export function saveProgress(address, progress) {
  return defaultStore.save(address, progress);
}

export function clearProgress(address) {
  return defaultStore.clear(address);
}
