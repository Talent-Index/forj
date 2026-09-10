#!/usr/bin/env node
/**
 * Copy the progression replay dependency tree into functions/vendor
 * so Cloud Functions can share XP semantics without packaging the Vite app.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const entry = path.join(root, "src/utils/progression/replay.js");
const vendorRoot = path.join(root, "functions/vendor");

const seen = new Set();

function resolveImport(fromFile, spec) {
  let next = path.resolve(path.dirname(fromFile), spec);
  if (fs.existsSync(next) && fs.statSync(next).isFile()) return next;
  if (fs.existsSync(`${next}.js`)) return `${next}.js`;
  if (fs.existsSync(path.join(next, "index.js"))) return path.join(next, "index.js");
  return null;
}

function walk(file) {
  const abs = path.resolve(file);
  if (seen.has(abs) || !abs.startsWith(root) || abs.includes("node_modules")) return;
  if (!fs.existsSync(abs)) return;
  seen.add(abs);
  const text = fs.readFileSync(abs, "utf8");
  for (const match of text.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
    const resolved = resolveImport(abs, match[1]);
    if (resolved) walk(resolved);
  }
}

walk(entry);

fs.rmSync(vendorRoot, { recursive: true, force: true });
fs.mkdirSync(vendorRoot, { recursive: true });

for (const abs of seen) {
  const rel = path.relative(root, abs);
  const dest = path.join(vendorRoot, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(abs, dest);
}

console.log(`synced ${seen.size} files into functions/vendor`);
