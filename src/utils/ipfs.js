/** Stable artwork URI for on-chain metadata. Prefer IPFS or a durable HTTPS URL. */
export const CREDENTIAL_IMAGE_URI =
  import.meta.env.VITE_CREDENTIAL_IMAGE_URI ||
  "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80";

/**
 * Prefer a configured remote URI for minting. Local Vite asset paths are not
 * usable by explorers, so fall back to CREDENTIAL_IMAGE_URI.
 */
export function resolveCredentialImageUri(localAssetUrl = "") {
  const configured = (import.meta.env.VITE_CREDENTIAL_IMAGE_URI || "").trim();
  if (configured) return configured;
  if (localAssetUrl && /^https?:\/\//i.test(localAssetUrl)) return localAssetUrl;
  return CREDENTIAL_IMAGE_URI;
}
