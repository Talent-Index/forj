const THEME_KEY = "skillforge.theme.v1";
const MOTION_KEY = "skillforge.motion.v1";

function readStored(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export function applyDocumentTheme(theme, reducedMotion) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.reducedMotion = reducedMotion ? "true" : "false";
}

export function getInitialTheme() {
  const stored = readStored(THEME_KEY, "");
  if (stored === "light" || stored === "dark") return stored;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function getInitialReducedMotion() {
  const stored = readStored(MOTION_KEY, "");
  if (stored === "true") return true;
  if (stored === "false") return false;
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return false;
}

export function persistTheme(theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore quota */
  }
}

export function persistReducedMotion(value) {
  try {
    window.localStorage.setItem(MOTION_KEY, value ? "true" : "false");
  } catch {
    /* ignore quota */
  }
}
