/** Stable artwork URI for on-chain token metadata. IPFS or HTTPS only. */
import { isStableMediaUri } from "./credentialMetadata";

function configuredImageUri() {
  try {
    return String(import.meta.env?.VITE_CREDENTIAL_IMAGE_URI || "").trim();
  } catch {
    return "";
  }
}

export const CREDENTIAL_IMAGE_URI = configuredImageUri();

/**
 * Local Vite asset paths are not usable by explorers.
 * Only a validated ipfs:// or https:// URI is written on-chain.
 */
export function resolveCredentialImageUri(localAssetUrl = "") {
  const configured = configuredImageUri();
  if (isStableMediaUri(configured)) return configured;
  if (isStableMediaUri(localAssetUrl)) return localAssetUrl;
  return "";
}
