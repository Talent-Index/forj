import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DESCRIPTION, ATTESTATION_VALUE } from "../src/utils/credentialMetadata.js";
import { LEGAL_PAGES } from "../src/utils/legal.js";
import {
  DEFAULT_C_CHAIN_RPC,
  DEFAULT_FUJI_RPC,
  parseCChainRpcUrl,
  parseFujiRpcUrl,
} from "../src/utils/frontendSecurity.js";
import {
  C_CHAIN_ID,
  PRODUCTION_GATE,
  mainnetIssuanceAllowed,
  productionGateSummary,
} from "../src/utils/productionGate.js";
import { FUJI_CHAIN_ID } from "../src/utils/wallet.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const gateDoc = readFileSync(join(root, "audit/PRODUCTION-GATE.md"), "utf8");
const deploy = readFileSync(join(root, "scripts/deploy.js"), "utf8");
const certificate = readFileSync(join(root, "src/components/Certificate.jsx"), "utf8");
const metadataDoc = readFileSync(join(root, "docs/METADATA.md"), "utf8");
const credentialDoc = readFileSync(join(root, "docs/CREDENTIAL.md"), "utf8");
const schema = JSON.parse(readFileSync(join(root, "metadata/schema/v1.json"), "utf8"));
const claimedExample = JSON.parse(readFileSync(join(root, "metadata/examples/self-claimed.json"), "utf8"));
const attestedExample = JSON.parse(readFileSync(join(root, "metadata/examples/issuer-attested.json"), "utf8"));

const summary = productionGateSummary();
assert.equal(PRODUCTION_GATE.freezeId, "v1");
assert.equal(PRODUCTION_GATE.mainnetIssuance, false);
process.env.CONFIRM_MAINNET = "yes";
assert.equal(mainnetIssuanceAllowed(), false);
assert.equal(summary.mainnetIssuanceAllowed, false);
assert.deepEqual(summary.blocked.sort(), [
  "deploymentWallet",
  "independentReview",
  "issuerInfrastructure",
  "monitoring",
].sort());
assert.equal(PRODUCTION_GATE.items.productionMetadata.ready, true);
assert.equal(PRODUCTION_GATE.items.productionRpc.ready, true);
assert.equal(PRODUCTION_GATE.items.incidentResponse.ready, true);
assert.equal(PRODUCTION_GATE.items.userDisclosures.ready, true);
assert.equal(PRODUCTION_GATE.items.mainnetConfiguration.ready, true);
assert.equal(PRODUCTION_GATE.items.independentReview.ready, false);

assert.match(gateDoc, /fail-closed/);
assert.match(gateDoc, /C-Chain issuance is \*\*closed\*\*/);
assert.match(gateDoc, /no audit report/);
assert.match(gateDoc, /no pause/);

assert.match(deploy, /refuseClosedCChainIssuance/);
assert.match(deploy, /mainnetIssuanceAllowed/);
assert.match(deploy, /C-Chain issuance is closed/);
assert.match(deploy, /CONFIRM_MAINNET/);
assert.ok(
  deploy.indexOf("refuseClosedCChainIssuance(requestedNetworkName())")
    < deploy.indexOf("hre.network.create()"),
  "C-Chain deploy must be refused before a production RPC connection"
);
assert.ok(
  deploy.indexOf("mainnetIssuanceAllowed") < deploy.indexOf("CONFIRM_MAINNET"),
  "env confirmation must not run before the closed production gate"
);
assert.equal(C_CHAIN_ID, 43114);
assert.equal(FUJI_CHAIN_ID, 43113);

assert.match(certificate, /FUJI_CHAIN_ID/);
assert.doesNotMatch(certificate, /43114/);
assert.match(certificate, /prepareClaimedMint/);

assert.equal(DESCRIPTION.claimed.includes("Self-claimed"), true);
assert.equal(DESCRIPTION.attested.includes("Issuer-attested"), true);
assert.equal(/verif(?:y|ied|ication)/i.test(DESCRIPTION.claimed), false);
assert.equal(ATTESTATION_VALUE.claimed, "Self claimed");
assert.equal(ATTESTATION_VALUE.attested, "Issuer attested");
assert.deepEqual(schema.properties.description.enum, [DESCRIPTION.claimed, DESCRIPTION.attested]);
assert.equal(claimedExample.description, DESCRIPTION.claimed);
assert.equal(attestedExample.description, DESCRIPTION.attested);
assert.match(metadataDoc, /Schema v1 certificate copy is \*\*final\*\*/);

const privacy = LEGAL_PAGES.privacy.sections.map((s) => s.body).join(" ");
const terms = LEGAL_PAGES.terms.sections.map((s) => s.body).join(" ");
assert.match(privacy, /C-Chain/);
assert.match(privacy, /claimed score/);
assert.match(privacy, /Fuji/);
assert.match(terms, /does not currently offer credential issuance on Avalanche C-Chain/);
assert.match(terms, /no pause switch/);
assert.match(terms, /claimed score/);
assert.equal(LEGAL_PAGES.privacy.updated, "3 September 2026");
assert.equal(LEGAL_PAGES.terms.updated, "28 August 2026");

assert.match(credentialDoc, /does \*\*not\*\* issue this credential on Avalanche C-Chain today/);
assert.match(credentialDoc, /production gate for C-Chain remains closed/);

assert.equal(parseFujiRpcUrl(DEFAULT_C_CHAIN_RPC), parseFujiRpcUrl(DEFAULT_FUJI_RPC));
assert.equal(parseCChainRpcUrl("https://api.avax-test.network/ext/bc/C/rpc"), parseCChainRpcUrl(DEFAULT_C_CHAIN_RPC));
assert.match(parseCChainRpcUrl(""), /api\.avax\.network/);

const hardhat = readFileSync(join(root, "hardhat.config.js"), "utf8");
assert.match(hardhat, /AVALANCHE_RPC_URL/);
assert.match(hardhat, /avax-test/);

const statusDoc = readFileSync(join(root, "docs/STATUS.md"), "utf8");
const roadmapDoc = readFileSync(join(root, "docs/ROADMAP.md"), "utf8");
const pack = readFileSync(join(root, "audit/PACK.md"), "utf8");
assert.match(statusDoc, /production readiness gate is \*\*closed\*\*/);
assert.match(statusDoc, /does not issue credentials on Avalanche C-Chain today/);
assert.match(roadmapDoc, /readiness gate is \*\*closed\*\*/);
assert.match(roadmapDoc, /An env flag cannot open issuance/);
assert.match(pack, /fail-closed production gate/);

const envExample = readFileSync(join(root, ".env.example"), "utf8");
assert.match(envExample, /^AVALANCHE_RPC_URL=/m);
assert.doesNotMatch(envExample, /VITE_AVALANCHE/);

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
assert.match(pkg.scripts.verify, /test:production-gate/);
assert.equal(pkg.scripts["deploy:mainnet"].includes("avalanche"), true);

console.log("production readiness gate is closed; disclosures and metadata checks passed");
