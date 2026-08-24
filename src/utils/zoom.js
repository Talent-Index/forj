const ZOOM_KEY = "skillforge.zoom.v2";
export const ZOOM_LEVELS = [100, 125, 150, 175];
export const DEFAULT_ZOOM = 100;

function readStoredZoom() {
  if (typeof window === "undefined") return DEFAULT_ZOOM;
  try {
    const raw = Number(window.localStorage.getItem(ZOOM_KEY));
    return ZOOM_LEVELS.includes(raw) ? raw : DEFAULT_ZOOM;
  } catch {
    return DEFAULT_ZOOM;
  }
}

export function getInitialZoom() {
  return readStoredZoom();
}

export function persistZoom(zoom) {
  try {
    window.localStorage.setItem(ZOOM_KEY, String(zoom));
  } catch {
    /* ignore quota */
  }
}

export function applyDocumentZoom(zoom) {
  if (typeof document === "undefined") return;
  const value = ZOOM_LEVELS.includes(zoom) ? zoom : DEFAULT_ZOOM;
  const html = document.documentElement;
  html.dataset.zoom = String(value);
  if (value === 100) {
    html.style.removeProperty("zoom");
    return;
  }
  html.style.zoom = `${value}%`;
}

export function nextZoom(zoom) {
  const index = ZOOM_LEVELS.indexOf(zoom);
  const current = index < 0 ? 0 : index;
  return ZOOM_LEVELS[(current + 1) % ZOOM_LEVELS.length];
}
