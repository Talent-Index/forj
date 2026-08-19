#!/usr/bin/env node
/**
 * Optional pin of packed artwork via Pinata (PINATA_JWT).
 * Does not run in CI. Never logs the JWT.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const jwt = String(process.env.PINATA_JWT || "").trim();
const packed = join(dirname(fileURLToPath(import.meta.url)), "../metadata/packed/forge-certificate.jpg");

if (!jwt) {
  console.log("PINATA_JWT is not set. Pack locally with npm run metadata:pack, then pin the JPG.");
  console.log("After pinning: VITE_CREDENTIAL_IMAGE_URI=ipfs://<cid>");
  process.exit(0);
}

const bytes = readFileSync(packed);
const form = new FormData();
form.append("file", new Blob([bytes], { type: "image/jpeg" }), "forge-certificate.jpg");

const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
  method: "POST",
  headers: { Authorization: `Bearer ${jwt}` },
  body: form,
});

if (!res.ok) {
  console.error("Pinata upload failed:", res.status, await res.text());
  process.exit(1);
}

const body = await res.json();
const cid = body.IpfsHash;
if (!cid) {
  console.error("Pinata response missing IpfsHash.");
  process.exit(1);
}

console.log(`Pinned artwork: ipfs://${cid}`);
console.log(`Set VITE_CREDENTIAL_IMAGE_URI=ipfs://${cid} and restart the app.`);
