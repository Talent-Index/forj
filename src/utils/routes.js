import { legalPageFromPath } from "./legal.js";
import { parseCredentialLocation } from "./credentialLookup.js";

/**
 * Map the browser pathname to an App page id.
 * Unknown paths become not-found (custom 404).
 */
export function pageFromPathname(pathname = "/", search = "") {
  if (typeof pathname !== "string") pathname = "/";
  const legal = legalPageFromPath(pathname);
  if (legal) return legal;

  const location = parseCredentialLocation(pathname, search);
  if (location.isPublicRoute || location.tokenId || location.wallet) {
    return "lookup";
  }

  const path = String(pathname || "/").replace(/\/+$/, "") || "/";
  if (path === "/") return "landing";
  return "not-found";
}
