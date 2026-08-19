import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ATTESTATION_VALUE,
  DESCRIPTION,
  TOKEN_NAME_PREFIX,
  buildCredentialMetadata,
  decodeTokenUri,
  encodeTokenUri,
  ipfsToHttps,
  isMetadataUri,
  isStableMediaUri,
  retrieveMetadata,
  validateCredentialMetadata,
} from "../src/utils/credentialMetadata.js";
import { resolveCredentialImageUri } from "../src/utils/ipfs.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(readFileSync(join(root, "metadata/schema/v1.json"), "utf8"));
const claimedExample = JSON.parse(readFileSync(join(root, "metadata/examples/self-claimed.json"), "utf8"));
const attestedExample = JSON.parse(readFileSync(join(root, "metadata/examples/issuer-attested.json"), "utf8"));
const artwork = readFileSync(join(root, "src/assets/forge-certificate.jpg"));
const docs = readFileSync(join(root, "docs/METADATA.md"), "utf8");

assert.equal(schema.title.includes("SkillForge"), true);
assert.deepEqual(schema.required, ["name", "description", "attributes"]);
assert.ok(artwork.length > 1000);

assert.equal(validateCredentialMetadata(claimedExample).ok, true);
assert.equal(validateCredentialMetadata(attestedExample).ok, true);
assert.equal(claimedExample.description, DESCRIPTION.claimed);
assert.equal(attestedExample.description, DESCRIPTION.attested);

const built = buildCredentialMetadata({
  tokenId: 7,
  attested: false,
  totalPoints: 80,
  puzzlePieces: 4,
  easyCorrect: 5,
  mediumCorrect: 4,
  hardCorrect: 3,
  image: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
});
assert.equal(built.name, `${TOKEN_NAME_PREFIX}7`);
assert.equal(validateCredentialMetadata(built).ok, true);

const tokenUri = encodeTokenUri(built);
assert.equal(isMetadataUri(tokenUri), true);
const decoded = decodeTokenUri(tokenUri);
assert.deepEqual(decoded, built);
const retrieved = retrieveMetadata(tokenUri);
assert.equal(retrieved.ok, true);
assert.equal(retrieved.source, "data");
assert.equal(retrieved.metadata.name, built.name);
assert.equal(validateCredentialMetadata(retrieved.metadata).ok, true);

const attestedBuilt = buildCredentialMetadata({
  tokenId: 2,
  attested: true,
  totalPoints: 15,
  puzzlePieces: 1,
  easyCorrect: 5,
});
assert.equal(attestedBuilt.description, DESCRIPTION.attested);
assert.equal(
  attestedBuilt.attributes.find((row) => row.trait_type === "Attestation").value,
  ATTESTATION_VALUE.attested
);
assert.equal("image" in attestedBuilt, false);

assert.equal(isStableMediaUri("ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"), true);
assert.equal(isStableMediaUri("ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"), true);
assert.equal(isStableMediaUri("https://example.com/forge-certificate.jpg"), true);
assert.equal(isStableMediaUri("http://example.com/x.jpg"), false);
assert.equal(isStableMediaUri("ipfs://bafy-artwork"), false);
assert.equal(isStableMediaUri('ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"'), false);
assert.equal(isStableMediaUri("javascript:alert(1)"), false);
assert.equal(isStableMediaUri("https://images.unsplash.com/photo-1639762681485-074b7f938ba0"), false);
assert.equal(isMetadataUri("data:application/json;base64,e30="), true);
assert.equal(isMetadataUri(""), false);

const httpsRetrieval = retrieveMetadata("ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi");
assert.equal(httpsRetrieval.ok, true);
assert.equal(httpsRetrieval.source, "ipfs");
assert.equal(
  ipfsToHttps("ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"),
  "https://ipfs.io/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
);

const localViteAsset = resolveCredentialImageUri("/src/assets/forge-certificate.jpg");
assert.equal(localViteAsset, "");
assert.equal(resolveCredentialImageUri("https://example.com/forge.jpg"), "https://example.com/forge.jpg");

assert.equal(validateCredentialMetadata({ name: "Nope" }).ok, false);
assert.equal(
  validateCredentialMetadata({
    ...built,
    image: "ipfs://not-a-cid",
  }).ok,
  false
);

assert.match(docs, /VITE_CREDENTIAL_IMAGE_URI/);
assert.match(docs, /ipfs:\/\//);
assert.match(docs, /forge-certificate\.jpg/);
assert.match(docs, /tokenURI/);
assert.match(docs, /Pinata|web3\.storage|IPFS/);

const pack = spawnSync(process.execPath, [join(root, "scripts/pack-metadata.js")], {
  encoding: "utf8",
  cwd: root,
});
assert.equal(pack.status, 0, pack.stderr || pack.stdout);
assert.match(pack.stdout, /Packed artwork/);
assert.match(pack.stdout, /credential-template\.json/);

const packedTemplate = JSON.parse(
  readFileSync(join(root, "metadata/packed/credential-template.json"), "utf8")
);
assert.equal(validateCredentialMetadata(packedTemplate).ok, true);

const upload = spawnSync(process.execPath, [join(root, "scripts/upload-metadata.js")], {
  encoding: "utf8",
  cwd: root,
  env: { ...process.env, PINATA_JWT: "" },
});
assert.equal(upload.status, 0, upload.stderr || upload.stdout);
assert.match(upload.stdout, /PINATA_JWT is not set/);

console.log("credential metadata tests passed");
