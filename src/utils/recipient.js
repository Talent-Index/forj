export const RECIPIENT_MIN = 2;
export const RECIPIENT_MAX = 48;

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u;

export function normalizeRecipientName(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

export function validateRecipientName(value) {
  const name = normalizeRecipientName(value);
  if (!name) {
    return { ok: false, name: "", error: "Enter the recipient name." };
  }
  if (name.length < RECIPIENT_MIN) {
    return { ok: false, name, error: `Use at least ${RECIPIENT_MIN} characters.` };
  }
  if (name.length > RECIPIENT_MAX) {
    return {
      ok: false,
      name: name.slice(0, RECIPIENT_MAX),
      error: `Keep the name under ${RECIPIENT_MAX} characters.`,
    };
  }
  if (/https?:\/\//i.test(name) || /[<>]/.test(name) || /[\u0000-\u001f]/.test(name)) {
    return { ok: false, name: "", error: "Use a person’s name, not a URL or markup." };
  }
  if (!NAME_RE.test(name)) {
    return { ok: false, name, error: "Use letters, spaces, hyphens, or apostrophes." };
  }
  return { ok: true, name, error: "" };
}
