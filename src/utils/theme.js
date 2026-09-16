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

export const THEME_CHROME = Object.freeze({
  light: "#ebe4d6",
  dark: "#121110",
});

export const MOTION_CHOICE = Object.freeze({
  system: "system",
  full: "full",
  reduced: "reduced",
});

export function applyDocumentTheme(theme, reducedMotion, motionChoice = MOTION_CHOICE.system) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.reducedMotion = reducedMotion ? "true" : "false";
  document.documentElement.dataset.motionChoice = motionChoice;
  const chrome = theme === "dark" ? THEME_CHROME.dark : THEME_CHROME.light;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", chrome);
}

export function getInitialTheme() {
  const stored = readStored(THEME_KEY, "");
  if (stored === "light" || stored === "dark") return stored;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function systemPrefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function getInitialMotionChoice() {
  const stored = readStored(MOTION_KEY, "");
  if (stored === "true") return MOTION_CHOICE.reduced;
  if (stored === "false") return MOTION_CHOICE.full;
  return MOTION_CHOICE.system;
}

export function getInitialReducedMotion() {
  const choice = getInitialMotionChoice();
  if (choice === MOTION_CHOICE.reduced) return true;
  if (choice === MOTION_CHOICE.full) return false;
  return systemPrefersReducedMotion();
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
