import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildCredentialMetadata,
  isStableMediaUri,
} from "../src/utils/credentialMetadata.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const artworkSrc = join(root, "src/assets/forge-certificate.jpg");
const packedDir = join(root, "metadata/packed");
const imageUri = String(process.env.VITE_CREDENTIAL_IMAGE_URI || "").trim();

mkdirSync(packedDir, { recursive: true });
copyFileSync(artworkSrc, join(packedDir, "forge-certificate.jpg"));

const template = buildCredentialMetadata({
  tokenId: 1,
  attested: false,
  totalPoints: 15,
  puzzlePieces: 1,
  easyCorrect: 5,
  image: isStableMediaUri(imageUri) ? imageUri : "",
});

writeFileSync(join(packedDir, "credential-template.json"), `${JSON.stringify(template, null, 2)}\n`);

console.log("Packed artwork:", join(packedDir, "forge-certificate.jpg"));
console.log("Packed metadata template:", join(packedDir, "credential-template.json"));
if (isStableMediaUri(imageUri)) {
  console.log("Image URI:", imageUri);
} else {
  console.log("No VITE_CREDENTIAL_IMAGE_URI set. Pin forge-certificate.jpg, then set ipfs:// or https://.");
}
