import { PUZZLE_SIZE, TOTAL_PIECES } from "../data/questions.js";

export const JIGSAW_CELL = 100;
export const JIGSAW_TAB = 18;
export const JIGSAW_PAD = 22;
export const JIGSAW_BOARD = PUZZLE_SIZE * JIGSAW_CELL;
export const JIGSAW_VIEW = JIGSAW_BOARD + JIGSAW_PAD * 2;

function tabSign(row, col, edge) {
  if (edge === "right" && col >= PUZZLE_SIZE - 1) return 0;
  if (edge === "bottom" && row >= PUZZLE_SIZE - 1) return 0;
  const n = row * 7 + col * 13 + (edge === "right" ? 3 : 11);
  return n % 2 === 0 ? 1 : -1;
}

export function pieceEdgeSign(row, col, edge) {
  if (edge === "left") {
    if (col === 0) return 0;
    return -tabSign(row, col - 1, "right");
  }
  if (edge === "top") {
    if (row === 0) return 0;
    return -tabSign(row - 1, col, "bottom");
  }
  return tabSign(row, col, edge);
}

function edge(x0, y0, x1, y1, nx, ny, sign, wobble) {
  if (sign === 0) return `L ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const tab = JIGSAW_TAB + wobble;
  const a = 0.36;
  const b = 0.64;
  const n0x = x0 + dx * a;
  const n0y = y0 + dy * a;
  const n1x = x0 + dx * b;
  const n1y = y0 + dy * b;
  const mx = (x0 + x1) / 2 + nx * sign * tab;
  const my = (y0 + y1) / 2 + ny * sign * tab;
  const c1x = n0x + nx * sign * tab * 0.35;
  const c1y = n0y + ny * sign * tab * 0.35;
  const c2x = n1x + nx * sign * tab * 0.35;
  const c2y = n1y + ny * sign * tab * 0.35;
  return [
    `L ${n0x.toFixed(2)} ${n0y.toFixed(2)}`,
    `C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`,
    `C ${mx.toFixed(2)} ${my.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${n1x.toFixed(2)} ${n1y.toFixed(2)}`,
    `L ${x1.toFixed(2)} ${y1.toFixed(2)}`,
  ].join(" ");
}

export function jigsawPath(index) {
  const row = Math.floor(index / PUZZLE_SIZE);
  const col = index % PUZZLE_SIZE;
  const x = col * JIGSAW_CELL;
  const y = row * JIGSAW_CELL;
  const wobble = ((row * 5 + col) % 3) - 1;
  const top = pieceEdgeSign(row, col, "top");
  const right = pieceEdgeSign(row, col, "right");
  const bottom = pieceEdgeSign(row, col, "bottom");
  const left = pieceEdgeSign(row, col, "left");
  return [
    `M ${x} ${y}`,
    edge(x, y, x + JIGSAW_CELL, y, 0, -1, top, wobble),
    edge(x + JIGSAW_CELL, y, x + JIGSAW_CELL, y + JIGSAW_CELL, 1, 0, right, wobble),
    edge(x + JIGSAW_CELL, y + JIGSAW_CELL, x, y + JIGSAW_CELL, 0, 1, bottom, wobble),
    edge(x, y + JIGSAW_CELL, x, y, -1, 0, left, wobble),
    "Z",
  ].join(" ");
}

export function pieceId(index) {
  const row = Math.floor(index / PUZZLE_SIZE);
  const col = index % PUZZLE_SIZE;
  return `piece-r${row}-c${col}`;
}

export function jigsawPieces() {
  return Array.from({ length: TOTAL_PIECES }, (_, index) => {
    const row = Math.floor(index / PUZZLE_SIZE);
    const col = index % PUZZLE_SIZE;
    return {
      id: pieceId(index),
      index,
      row,
      col,
      cost: 5,
      d: jigsawPath(index),
      cx: col * JIGSAW_CELL + JIGSAW_CELL / 2,
      cy: row * JIGSAW_CELL + JIGSAW_CELL / 2,
    };
  });
}

export function pieceState({ acquired, canAfford, complete, selected }) {
  if (acquired && complete) return "completed";
  if (acquired) return "unlocked";
  if (selected) return "selected";
  if (canAfford) return "available";
  return "locked";
}
