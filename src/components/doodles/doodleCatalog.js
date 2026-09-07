/**
 * Hand-drawn doodle path catalog for Forjora.
 * Paths use a 64×64 viewBox; stroke is applied by <Doodle />.
 */

export const DOODLE_VIEWBOX = "0 0 64 64";

/** @typedef {{ paths?: string[], circles?: Array<[number,number,number]>, lines?: Array<[number,number,number,number]>, polylines?: string[] }} DoodleGlyph */

/** @type {Record<string, DoodleGlyph>} */
export const DOODLE_CATALOG = {
  book: {
    paths: [
      "M10 14c6 0 14 2 18 6v34c-4-3-12-5-18-5V14z",
      "M54 14c-6 0-14 2-18 6v34c4-3 12-5 18-5V14z",
      "M28 20c2 1 4 1 8 0",
    ],
  },
  pencil: {
    paths: [
      "M14 46 L42 18 L48 24 L20 52 L12 54 Z",
      "M38 22 L44 28",
    ],
    lines: [[16, 48, 22, 50]],
  },
  lightbulb: {
    paths: [
      "M32 10c-9 0-16 7-16 16 0 6 3 10 7 13v6h18v-6c4-3 7-7 7-13 0-9-7-16-16-16z",
      "M26 51h12",
      "M28 56h8",
    ],
  },
  question: {
    paths: [
      "M24 22c0-6 4-10 9-10s8 3 8 8c0 5-4 7-7 9-2 1-3 3-3 6",
    ],
    circles: [[32, 48, 1.8]],
  },
  notes: {
    paths: [
      "M16 12h32v40H16z",
      "M22 22h20",
      "M22 30h18",
      "M22 38h14",
    ],
  },
  code: {
    paths: [
      "M22 18 L12 32 L22 46",
      "M42 18 L52 32 L42 46",
      "M36 16 L28 48",
    ],
  },
  cap: {
    paths: [
      "M8 28 L32 16 L56 28 L32 40 Z",
      "M16 32v10c6 4 26 4 32 0V32",
      "M56 28v12",
    ],
  },
  hammer: {
    paths: [
      "M18 14h22l2 10H16z",
      "M28 24v28",
      "M24 52h8",
    ],
    lines: [[16, 18, 12, 22], [42, 18, 46, 22]],
  },
  anvil: {
    paths: [
      "M12 28h40l-4 8H16z",
      "M22 36h20v10H22z",
      "M18 46h28v4H18z",
    ],
  },
  gear: {
    paths: [
      "M32 14v6M32 44v6M14 32h6M44 32h6M20 20l4 4M40 40l4 4M44 20l-4 4M24 40l-4 4",
    ],
    circles: [[32, 32, 10], [32, 32, 3]],
  },
  blueprint: {
    paths: [
      "M14 12h36v40H14z",
      "M20 22h12v16H20z",
      "M36 22h8",
      "M36 30h10",
      "M36 38h6",
    ],
  },
  blocks: {
    paths: [
      "M14 34h16v16H14z",
      "M34 34h16v16H34z",
      "M24 14h16v16H24z",
    ],
  },
  tools: {
    paths: [
      "M18 14c8 0 12 8 8 14L14 40l-4-4 12-12c-2-4 0-10 6-10z",
      "M40 20l10 10-6 6-4-4 2-4-6-2z",
    ],
  },
  wallet: {
    paths: [
      "M12 20h40v28H12z",
      "M40 30h10v8H40z",
    ],
    circles: [[46, 34, 1.5]],
  },
  blockchain: {
    paths: [
      "M18 18h12v12H18z",
      "M34 18h12v12H34z",
      "M26 34h12v12H26z",
    ],
    lines: [[30, 24, 34, 24], [30, 30, 32, 34], [40, 30, 36, 34]],
  },
  nodes: {
    circles: [[16, 20, 4], [48, 18, 4], [32, 44, 5], [18, 46, 3]],
    lines: [[20, 22, 44, 20], [18, 24, 30, 40], [46, 22, 35, 40], [20, 46, 27, 46]],
  },
  contract: {
    paths: [
      "M18 10h22l8 8v36H18z",
      "M40 10v8h8",
      "M24 28h16",
      "M24 36h12",
      "M24 44h14",
    ],
  },
  chain: {
    paths: [
      "M18 28c0-6 4-10 10-10h6",
      "M30 38c0 6 4 10 10 10h2",
      "M28 24c4-2 8 0 10 4",
      "M26 36c2 4 6 6 10 4",
    ],
  },
  shield: {
    paths: [
      "M32 10 L50 18v14c0 12-10 20-18 24-8-4-18-12-18-24V18z",
      "M32 22v18",
      "M24 32h16",
    ],
  },
  trophy: {
    paths: [
      "M20 16h24v10c0 8-6 14-12 14s-12-6-12-14V16z",
      "M20 20c-6 2-8 8-4 12",
      "M44 20c6 2 8 8 4 12",
      "M28 40h8v6h-8z",
      "M22 46h20v4H22z",
    ],
  },
  medal: {
    paths: [
      "M24 10l8 8 8-8",
      "M32 18v6",
    ],
    circles: [[32, 38, 12], [32, 38, 6]],
  },
  star: {
    paths: [
      "M32 10l4 12h12l-10 8 4 12-10-7-10 7 4-12-10-8h12z",
    ],
  },
  check: {
    paths: [
      "M14 34 L26 46 L52 18",
    ],
  },
  badge: {
    paths: [
      "M32 8l6 10 12 2-8 9 2 12-12-6-12 6 2-12-8-9 12-2z",
    ],
  },
  diamond: {
    paths: [
      "M32 8 L52 28 L32 56 L12 28 Z",
      "M12 28h40",
      "M22 28 L32 8 L42 28",
    ],
  },
  certificate: {
    paths: [
      "M14 8h36v40H14z",
      "M22 20h20",
      "M22 28h16",
      "M22 36h12",
      "M40 40c4 0 8 3 8 7v5l-4-2-4 2v-5c0-4 0-7 0-7z",
    ],
  },
  seal: {
    circles: [[32, 32, 18], [32, 32, 12]],
    paths: [
      "M24 32l6 6 12-14",
    ],
  },
  signature: {
    paths: [
      "M12 40c6-10 10-4 14-8s6-2 10 2 8 4 14-2",
      "M14 48h36",
    ],
  },
  idcard: {
    paths: [
      "M10 18h44v28H10z",
      "M18 26h12v12H18z",
      "M36 26h12",
      "M36 34h10",
    ],
  },
  stamp: {
    paths: [
      "M20 14h24v10H20z",
      "M24 24h16v8c0 4-16 4-16 0V24z",
      "M18 40h28v8H18z",
    ],
  },
  arrow: {
    paths: [
      "M12 32h36",
      "M38 20l12 12-12 12",
    ],
  },
  arrowDown: {
    paths: [
      "M32 12v36",
      "M20 36l12 12 12-12",
    ],
  },
  underline: {
    paths: [
      "M10 40c12 6 30 6 44-2",
    ],
  },
  circle: {
    circles: [[32, 32, 18]],
  },
  pointer: {
    paths: [
      "M22 12 L22 44 L30 36 L36 52 L42 50 L36 34 L48 34 Z",
    ],
  },
  divider: {
    paths: [
      "M8 32c8-4 16 4 24 0s16 4 24 0",
    ],
  },
  fire: {
    paths: [
      "M32 10c2 10-8 12-8 22 0 8 6 14 14 14s12-6 12-14c0-8-6-12-10-18-2 6-6 8-8-4z",
    ],
  },
  spark: {
    paths: [
      "M32 8v12M32 44v12M8 32h12M44 32h12M16 16l8 8M40 40l8 8M48 16l-8 8M24 40l-8 8",
    ],
  },
  puzzle: {
    paths: [
      "M14 14h16c0 4 4 6 6 6s6-2 6-6h8v16c-4 0-6 4-6 6s2 6 6 6v8H34c0-4-4-6-6-6s-6 2-6 6H14V36c4 0 6-4 6-6s-2-6-6-6V14z",
    ],
  },
  mountain: {
    paths: [
      "M8 48 L24 20 L34 34 L42 18 L56 48 Z",
      "M24 20l4 8",
    ],
  },
  quiz: {
    paths: [
      "M14 12h36v40H14z",
      "M22 24h20",
      "M22 34h16",
      "M22 44h10",
    ],
    circles: [[44, 44, 2]],
  },
};

export const DOODLE_TYPES = Object.freeze(Object.keys(DOODLE_CATALOG));

export function getDoodleGlyph(type) {
  return DOODLE_CATALOG[type] || DOODLE_CATALOG.circle;
}
