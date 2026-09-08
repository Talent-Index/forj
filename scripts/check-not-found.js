import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pageFromPathname } from "../src/utils/routes.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

assert.equal(pageFromPathname("/"), "landing");
assert.equal(pageFromPathname("/privacy"), "privacy");
assert.equal(pageFromPathname("/terms"), "terms");
assert.equal(pageFromPathname("/credential"), "lookup");
assert.equal(pageFromPathname("/credential/1"), "lookup");
assert.equal(pageFromPathname("/credential/nope"), "lookup");
assert.equal(pageFromPathname("/", "?token=1"), "lookup");
assert.equal(pageFromPathname("/about"), "not-found");
assert.equal(pageFromPathname("/missing-page"), "not-found");
assert.equal(pageFromPathname("/foo/bar"), "not-found");

const page = readFileSync(join(root, "src/components/pages/NotFoundPage.jsx"), "utf8");
assert.match(page, /Path not forged/);
assert.match(page, /Back home/);
assert.match(page, /Look up a credential/);

const app = readFileSync(join(root, "src/App.jsx"), "utf8");
assert.match(app, /NotFoundPage/);
assert.match(app, /pageFromPathname/);
assert.match(app, /"not-found"/);

assert.ok(existsSync(join(root, "public/404.html")));
assert.match(readFileSync(join(root, "public/404.html"), "utf8"), /Path not forged/);

console.log("404 route tests passed");
