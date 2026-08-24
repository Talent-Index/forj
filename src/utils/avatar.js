const AVATAR_SIZE = 192;
const AVATAR_TYPE = "image/jpeg";
const AVATAR_QUALITY = 0.86;

export function initialsFromName(name, email) {
  const source = String(name || email || "?").trim();
  if (!source) return "?";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export async function readAvatarFile(file) {
  if (!file) return { ok: false, error: "Choose an image to upload." };
  if (!String(file.type || "").startsWith("image/")) {
    return { ok: false, error: "Choose a JPG, PNG, or WebP image." };
  }
  if (file.size > 4 * 1024 * 1024) {
    return { ok: false, error: "Keep the image under 4 MB." };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const context = canvas.getContext("2d");
    if (!context) return { ok: false, error: "Could not process that image." };

    const source = Math.min(image.width, image.height);
    const sx = (image.width - source) / 2;
    const sy = (image.height - source) / 2;
    context.drawImage(image, sx, sy, source, source, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
    const avatarUrl = canvas.toDataURL(AVATAR_TYPE, AVATAR_QUALITY);
    return { ok: true, avatarUrl };
  } catch {
    return { ok: false, error: "Could not read that image." };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
