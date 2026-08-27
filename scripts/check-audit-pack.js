import assert from "node:assert/strict";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sol = readFileSync(join(root, "contracts/SkillForgeCredential.sol"), "utf8");
const pack = readFileSync(join(root, "audit/PACK.md"), "utf8");
const credentialDoc = readFileSync(join(root, "docs/CREDENTIAL.md"), "utf8");
const authorizationDoc = readFileSync(join(root, "docs/AUTHORIZATION.md"), "utf8");
const example = JSON.parse(readFileSync(join(root, "deployments/fuji.example.json"), "utf8"));

const REQUIREMENTS = [
  { id: "unauthorized-mint", label: "Unauthorized mint", pattern: /unauthorized mint|without a valid owner signature|cannot mint a credential into another wallet/i },
  { id: "forged-signature", label: "Forged signature", pattern: /forged|mutated owner signature|wrong EIP-712 name/i },
  { id: "replayed-signature", label: "Replayed signature", pattern: /replay|second use of the same authorization|rejects reuse/i },
  { id: "wrong-nonce", label: "Wrong nonce", pattern: /wrong nonce|future nonce|already-consumed nonce|nonce in the signature was already consumed/i },
  { id: "wrong-chain", label: "Wrong chain", pattern: /wrong chain|bound to Fuji or mainnet|bound to the wrong chain/i },
  { id: "wrong-contract", label: "Wrong contract", pattern: /wrong contract|different SkillForgeCredential|bound to another contract/i },
  { id: "expired-signature", label: "Expired signature", pattern: /expired|deadline is in the past|deadline of zero/i },
  { id: "unauthorized-issuer", label: "Unauthorized issuer", pattern: /unauthorized issuer|pending owner as attesting|wrong signer|previous owner after the handoff/i },
  { id: "unauthorized-ownership", label: "Unauthorized ownership", pattern: /unauthorized ownership|refuses renounce|two-step ownership|do not hold the issuer role/i },
  { id: "duplicate-credential", label: "Duplicate credential", pattern: /duplicate credential|one current credential per wallet|replaces a learner's previous/i },
];

function collectTests() {
  const dir = join(root, "test");
  const titles = [];
  for (const name of readdirSync(dir).filter((file) => file.endsWith(".js") && file !== "network.js")) {
    const source = readFileSync(join(dir, name), "utf8");
    const matches = source.matchAll(/\bit\("([^"]+)"/g);
    for (const match of matches) {
      titles.push({ file: name, title: match[1] });
    }
  }
  return titles;
}

const tests = collectTests();
const coverage = REQUIREMENTS.map((requirement) => {
  const hits = tests.filter((test) => requirement.pattern.test(test.title));
  return {
    id: requirement.id,
    label: requirement.label,
    covered: hits.length > 0,
    tests: hits,
  };
});

const report = {
  freezeId: "v1",
  generatedAt: new Date().toISOString(),
  mochaTests: tests.length,
  requirements: coverage,
  allCovered: coverage.every((row) => row.covered),
};

writeFileSync(join(root, "audit/coverage-report.json"), `${JSON.stringify(report, null, 2)}\n`);

assert.equal(report.mochaTests >= 40, true, "expected the contract mocha suite");
assert.equal(report.allCovered, true, JSON.stringify(coverage.filter((row) => !row.covered), null, 2));

assert.match(sol, /Freeze v1/);
assert.match(sol, /MAX_POINTS = 80/);
assert.match(sol, /MAX_IMAGE_BYTES = 256/);
assert.match(sol, /MAX_AUTHORIZATION_WINDOW = 7 days/);
assert.match(sol, /EIP712_VERSION = "1"/);
assert.match(sol, /Ownable2Step/);
assert.match(sol, /_mint\(learner, tokenId\)/);

assert.match(pack, /## Frozen contract requirements/);
assert.match(pack, /## Architecture/);
assert.match(pack, /## Threat model/);
assert.match(pack, /## Privileged roles/);
assert.match(pack, /## Mint flows/);
assert.match(pack, /## EIP-712 flow/);
assert.match(pack, /## Test coverage/);
assert.match(pack, /## Findings/);
assert.match(pack, /## Deployment/);
assert.match(pack, /credentialId.*is \*\*not\*\* signed/);
assert.match(pack, /not an audit report/i);
assert.match(pack, /not live on C-Chain/i);
assert.match(pack, /fail-closed production gate/);

assert.match(credentialDoc, /Frozen credential/);
assert.match(credentialDoc, /80 total points/);
assert.match(authorizationDoc, /## Privileged roles/);
assert.match(authorizationDoc, /## Threat model/);

assert.equal(example.freezeId, "v1");
assert.equal(example.eip712Name, "SkillForgeCredential");
assert.equal(example.eip712Version, "1");

const deploy = readFileSync(join(root, "scripts/deploy.js"), "utf8");
assert.match(deploy, /freezeId: "v1"/);
assert.match(deploy, /CONFIRM_MAINNET/);

console.log(`audit freeze pack checks passed (${report.mochaTests} mocha tests, ${coverage.length} requirements covered)`);
