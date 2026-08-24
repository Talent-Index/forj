import { progressOwnerId, createMemoryStorage } from "../progress.js";
import {
  PROGRESSION_VERSION,
  emptyProgression,
  sanitizeProgression,
  migrateFromQuizProgress,
} from "./engine.js";

export function progressionStorageKey(ownerId, version = PROGRESSION_VERSION) {
  const id = progressOwnerId(ownerId);
  if (!id) return null;
  if (id.startsWith("acc_")) return `skillforge.progression.v${version}.account.${id}`;
  return `skillforge.progression.v${version}.${id}`;
}

function defaultStorage() {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    // Private mode or blocked storage.
  }
  return createMemoryStorage();
}

function readJson(storage, key) {
  if (!key) return null;
  try {
    const raw = storage.getItem(key);
    if (typeof raw !== "string" || raw.length === 0) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function createProgressionStore(storage = defaultStorage()) {
  return {
    load(ownerId) {
      const key = progressionStorageKey(ownerId);
      const learnerId = progressOwnerId(ownerId);
      if (!key || !learnerId) return emptyProgression(null);
      return sanitizeProgression(readJson(storage, key), learnerId);
    },
    save(ownerId, state) {
      const key = progressionStorageKey(ownerId);
      const learnerId = progressOwnerId(ownerId);
      if (!key || !learnerId) return false;
      try {
        storage.setItem(key, JSON.stringify(sanitizeProgression(state, learnerId)));
        return true;
      } catch {
        return false;
      }
    },
    clear(ownerId) {
      const key = progressionStorageKey(ownerId);
      if (!key) return false;
      try {
        storage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
    loadMigrated(ownerId, quizProgress) {
      const current = this.load(ownerId);
      const migrated = migrateFromQuizProgress({ ...current, learnerId: progressOwnerId(ownerId) }, quizProgress);
      this.save(ownerId, migrated);
      return migrated;
    },
  };
}

const defaultStore = createProgressionStore();

export function loadProgression(ownerId) {
  return defaultStore.load(ownerId);
}

export function saveProgression(ownerId, state) {
  return defaultStore.save(ownerId, state);
}

export function clearProgression(ownerId) {
  return defaultStore.clear(ownerId);
}
