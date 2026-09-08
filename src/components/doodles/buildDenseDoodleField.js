import { DOODLE_TYPES } from "./doodleCatalog.js";

/** Stable string → 32-bit seed */
function hashSeed(input) {
  let h = 2166136261;
  const s = String(input);
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const THEME_TYPES = Object.freeze({
  landing: DOODLE_TYPES,
  learn: [
    "book", "pencil", "notes", "code", "lightbulb", "quiz", "question", "cap",
    "arrow", "arrowDown", "pointer", "underline", "spark", "blocks", "blueprint",
    "gear", "tools", "hammer", "puzzle", "star", "circle", "divider",
  ],
  progress: [
    "hammer", "anvil", "fire", "spark", "trophy", "medal", "star", "badge",
    "gear", "arrow", "blocks", "diamond", "check", "puzzle", "tools", "mountain",
  ],
  credentials: [
    "certificate", "seal", "stamp", "signature", "idcard", "shield", "blockchain",
    "nodes", "chain", "wallet", "contract", "check", "diamond", "badge", "spark",
  ],
  leaderboard: [
    "trophy", "medal", "star", "badge", "arrow", "check", "spark", "mountain",
    "fire", "diamond", "cap", "shield",
  ],
  about: DOODLE_TYPES,
  lookup: [
    "certificate", "seal", "blockchain", "nodes", "chain", "check", "shield",
    "idcard", "question", "spark", "diamond",
  ],
  settings: [
    "gear", "tools", "wallet", "idcard", "pencil", "notes", "shield", "spark", "circle",
  ],
  puzzle: [
    "puzzle", "hammer", "anvil", "fire", "diamond", "blocks", "gear", "spark",
    "check", "certificate", "tools", "arrow",
  ],
  quiz: [
    "quiz", "question", "lightbulb", "pencil", "notes", "check", "spark", "star",
    "book", "code", "circle", "arrow",
  ],
  default: DOODLE_TYPES,
});

const ANIMATIONS = Object.freeze([
  "draw", "spark", "stamp", "tap", "assemble", "connect", "write", "wiggle", "slide", "open", "underline",
]);

const SIZES = Object.freeze([12, 14, 16, 18, 20, 22, 24, 26, 28]);

/**
 * Build a deterministic dense doodle scatter (100+ by default).
 * Curated items (if any) keep priority slots; the rest fill a soft grid with jitter.
 */
export function buildDenseDoodleField({
  seed = "forjora",
  count = 112,
  theme = "default",
  curated = [],
  animateCount = 18,
} = {}) {
  const types = THEME_TYPES[theme] || THEME_TYPES.default;
  const rnd = mulberry32(hashSeed(`${seed}:${theme}:${count}`));
  const target = Math.max(1, Math.floor(count));
  const items = curated.map((item, index) => ({
    ...item,
    decorative: item.decorative !== undefined ? item.decorative : index >= 20,
    variant: item.variant || "muted",
    animation: item.animation || "draw",
    animate: item.animate ?? index < animateCount,
  }));

  const cols = 12;
  const rows = Math.ceil(target / cols);
  let filled = items.length;
  let cell = 0;
  let guard = 0;

  while (filled < target && guard < target * 8) {
    guard += 1;
    const col = cell % cols;
    const row = Math.floor(cell / cols) % rows;
    cell += 1;

    const jitterX = (rnd() - 0.5) * (100 / cols) * 0.85;
    const jitterY = (rnd() - 0.5) * (100 / rows) * 0.85;
    const left = Math.min(94, Math.max(1, (col + 0.5) * (100 / cols) + jitterX));
    const top = Math.min(94, Math.max(1, (row + 0.5) * (100 / rows) + jitterY));

    const dx = left - 50;
    const dy = top - 42;
    if (dx * dx + dy * dy < 220 && rnd() > 0.35) continue;

    const type = types[Math.floor(rnd() * types.length)];
    const size = SIZES[Math.floor(rnd() * SIZES.length)];
    const rotate = Math.round((rnd() - 0.5) * 36);
    const accent = rnd() > 0.88;
    const animate = filled < animateCount;
    const mobileKeep = filled % 4 === 0;

    items.push({
      type,
      top: `${top.toFixed(2)}%`,
      left: `${left.toFixed(2)}%`,
      size,
      rotate,
      variant: accent ? "accent" : "muted",
      accent,
      decorative: !mobileKeep,
      animation: ANIMATIONS[Math.floor(rnd() * ANIMATIONS.length)],
      animate,
      delay: animate ? Math.round(rnd() * 900) : 0,
      strokeWidth: size <= 14 ? 1.4 : 1.6,
    });
    filled += 1;
  }

  return items.slice(0, target);
}

export const PAGE_DOODLE_THEME = Object.freeze({
  landing: "landing",
  learn: "learn",
  progress: "progress",
  credentials: "credentials",
  leaderboard: "leaderboard",
  about: "about",
  lookup: "lookup",
  settings: "settings",
  "not-found": "default",
  privacy: "default",
  terms: "default",
});

export default buildDenseDoodleField;
