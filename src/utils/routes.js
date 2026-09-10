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

  const profileMatch = path.match(/^\/u\/([^/]+)$/i);
  if (profileMatch) {
    return "public-profile";
  }

  return "not-found";
}

export function publicProfileSlugFromPath(pathname = "/") {
  const path = String(pathname || "/").replace(/\/+$/, "") || "/";
  const match = path.match(/^\/u\/([^/]+)$/i);
  if (!match) return "";
  try {
    return decodeURIComponent(match[1]).trim().toLowerCase();
  } catch {
    return String(match[1] || "").trim().toLowerCase();
  }
}

export function publicProfilePath(slug) {
  const clean = String(slug || "").trim().toLowerCase();
  return clean ? `/u/${encodeURIComponent(clean)}` : "/";
}
