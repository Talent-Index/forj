import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ATTESTED_LABEL, CLAIMED_LABEL, LEGACY_CONTRACT_ID, PRODUCT_NAME } from "../src/utils/brand.js";
import { EIP712_NAME } from "../src/utils/eip712Authorization.js";
import { INTRODUCTION } from "../src/utils/onboarding.js";
import { CREDENTIAL_STATES } from "../src/utils/credentialStatus.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function walkJs(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkJs(full));
    else if (/\.(js|jsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

assert.equal(PRODUCT_NAME, "Forjora");
assert.equal(INTRODUCTION.title, "Forjora");
assert.equal(CLAIMED_LABEL, "Forjora claimed");
assert.equal(ATTESTED_LABEL, "Forjora issuer-attested");
assert.equal(CREDENTIAL_STATES.claimed.label, CLAIMED_LABEL);
assert.equal(CREDENTIAL_STATES.attested.label, ATTESTED_LABEL);
assert.equal(EIP712_NAME, LEGACY_CONTRACT_ID);
assert.equal(EIP712_NAME, "SkillForgeCredential");

const components = walkJs(join(root, "src/components")).map((file) => ({
  file,
  source: readFileSync(file, "utf8"),
}));
for (const { file, source } of components) {
  assert.doesNotMatch(
    source,
    /SkillForge|skillforge|Skill Forge/,
    `${file} must not show SkillForge branding`
  );
}

const html = readFileSync(join(root, "index.html"), "utf8");
assert.match(html, /Forjora — Learn\. Forge\. Prove\./);
assert.match(html, /og:title/);
assert.match(html, /twitter:title/);
assert.match(html, /og:image" content="\/og-image\.jpg"/);
assert.match(html, /twitter:image" content="\/og-image\.jpg"/);
assert.match(html, /summary_large_image/);
assert.match(html, /apple-touch-icon\.png/);
assert.doesNotMatch(html, /og:image" content="[^"]*\.svg"/);
assert.match(html, /site.webmanifest/);

const ogImage = readFileSync(join(root, "public/og-image.jpg"));
assert.equal(ogImage[0], 0xff);
assert.equal(ogImage[1], 0xd8);
assert.ok(ogImage.length > 50_000, "og-image.jpg should be a real raster card, not a stub");
assert.ok(readFileSync(join(root, "public/apple-touch-icon.png")).length > 500);

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
assert.equal(pkg.name, "forjora");
assert.match(pkg.description, /claimed and issuer-attested/);
assert.match(pkg.scripts.verify, /test:brand/);

const manifest = JSON.parse(readFileSync(join(root, "public/site.webmanifest"), "utf8"));
assert.equal(manifest.name, "Forjora");
assert.equal(manifest.short_name, "Forjora");
assert.match(JSON.stringify(manifest.icons), /favicon\.svg|forjora-mark\.svg/);

const mark = readFileSync(join(root, "src/components/brand/ForjoraMark.jsx"), "utf8");
assert.match(mark, /brand-mark-accent/);
assert.match(mark, /BrandMark/);
assert.match(html, /favicon\.svg/);
assert.match(readFileSync(join(root, "public/forjora-mark.svg"), "utf8"), /#c4a35a/);
assert.match(readFileSync(join(root, "public/favicon.svg"), "utf8"), /#c4a35a/);

console.log("Forjora brand checks passed; SkillForgeCredential remains the on-chain name");
