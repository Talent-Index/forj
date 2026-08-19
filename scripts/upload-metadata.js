#!/usr/bin/env node
/**
 * Optional pin of packed artwork (and metadata template) via Pinata.
 * Does not run a pin in CI. Never logs the JWT.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const jwt = String(process.env.PINATA_JWT || "").trim();
const packedDir = join(dirname(fileURLToPath(import.meta.url)), "../metadata/packed");
const packedImage = join(packedDir, "forge-certificate.jpg");
const packedJson = join(packedDir, "credential-template.json");

if (!jwt) {
  console.log("PINATA_JWT is not set. Pack locally with npm run metadata:pack, then pin the JPG.");
  console.log("After pinning: VITE_CREDENTIAL_IMAGE_URI=ipfs://<cid>");
  process.exit(0);
}

if (!existsSync(packedImage)) {
  console.error("Packed artwork missing. Run npm run metadata:pack first.");
  process.exit(1);
}

async function pinFile(bytes, filename, mime) {
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mime }), filename);
  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Pinata upload failed for ${filename}: ${res.status} ${await res.text()}`);
  }
  const body = await res.json();
  if (!body.IpfsHash) {
    throw new Error(`Pinata response missing IpfsHash for ${filename}.`);
  }
  return body.IpfsHash;
}

try {
  const imageCid = await pinFile(
    readFileSync(packedImage),
    "forge-certificate.jpg",
    "image/jpeg"
  );
  console.log(`Pinned artwork: ipfs://${imageCid}`);
  console.log(`Set VITE_CREDENTIAL_IMAGE_URI=ipfs://${imageCid} and restart the app.`);

  if (existsSync(packedJson)) {
    const jsonCid = await pinFile(
      readFileSync(packedJson),
      "credential-template.json",
      "application/json"
    );
    console.log(`Pinned metadata template: ipfs://${jsonCid}`);
    console.log("Explorers still read on-chain tokenURI; this pin is a durable copy.");
  }
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
