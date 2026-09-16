/** Cover page zoom up to 175% on 3× displays for the 96px profile photo. */
export const AVATAR_SIZE = 512;
const AVATAR_TYPE = "image/jpeg";
const AVATAR_QUALITY = 0.86;
const AVATAR_QUALITY_MIN = 0.7;
/** Keep encoded data URLs under MAX_AVATAR_BYTES in auth (string length). */
const AVATAR_DATA_URL_BUDGET = 320_000;
/** Never allocate a working canvas larger than this edge (avoids OOM on phone photos). */
const AVATAR_WORK_MAX = 1024;

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
    const crop = Math.min(image.width, image.height);
    if (crop < 48) {
      return { ok: false, error: "Choose a larger photo (at least 48×48)." };
    }
    const sx = (image.width - crop) / 2;
    const sy = (image.height - crop) / 2;
    // Never upscale a small source — that only softens it under page zoom.
    const target = Math.min(AVATAR_SIZE, crop);

    let drawFrom = image;
    let drawSx = sx;
    let drawSy = sy;
    let drawSw = crop;
    let drawSh = crop;

    // Optional mid-size pass when the crop is huge (keeps quality without a full-res canvas).
    if (crop > AVATAR_WORK_MAX && target < AVATAR_WORK_MAX) {
      const mid = document.createElement("canvas");
      mid.width = AVATAR_WORK_MAX;
      mid.height = AVATAR_WORK_MAX;
      const midCtx = mid.getContext("2d");
      if (!midCtx) return { ok: false, error: "Could not process that image." };
      configureSmoothing(midCtx);
      midCtx.drawImage(image, sx, sy, crop, crop, 0, 0, AVATAR_WORK_MAX, AVATAR_WORK_MAX);
      drawFrom = mid;
      drawSx = 0;
      drawSy = 0;
      drawSw = AVATAR_WORK_MAX;
      drawSh = AVATAR_WORK_MAX;
    }

    const canvas = document.createElement("canvas");
    canvas.width = target;
    canvas.height = target;
    const context = canvas.getContext("2d");
    if (!context) return { ok: false, error: "Could not process that image." };
    configureSmoothing(context);
    context.drawImage(drawFrom, drawSx, drawSy, drawSw, drawSh, 0, 0, target, target);

    let quality = AVATAR_QUALITY;
    let avatarUrl = canvas.toDataURL(AVATAR_TYPE, quality);
    while (avatarUrl.length > AVATAR_DATA_URL_BUDGET && quality > AVATAR_QUALITY_MIN) {
      quality = Math.max(AVATAR_QUALITY_MIN, Number((quality - 0.05).toFixed(2)));
      avatarUrl = canvas.toDataURL(AVATAR_TYPE, quality);
    }
    if (avatarUrl.length > AVATAR_DATA_URL_BUDGET) {
      // Last resort: shrink edge and re-encode.
      const shrink = Math.max(256, Math.floor(target * 0.75));
      if (shrink < target) {
        const smaller = document.createElement("canvas");
        smaller.width = shrink;
        smaller.height = shrink;
        const sctx = smaller.getContext("2d");
        if (sctx) {
          configureSmoothing(sctx);
          sctx.drawImage(canvas, 0, 0, target, target, 0, 0, shrink, shrink);
          quality = AVATAR_QUALITY_MIN;
          avatarUrl = smaller.toDataURL(AVATAR_TYPE, quality);
        }
      }
    }
    if (avatarUrl.length > AVATAR_DATA_URL_BUDGET) {
      return { ok: false, error: "That photo is still too large after resize. Try a simpler image." };
    }
    return { ok: true, avatarUrl };
  } catch {
    return { ok: false, error: "Could not read that image." };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function configureSmoothing(context) {
  context.imageSmoothingEnabled = true;
  if ("imageSmoothingQuality" in context) {
    context.imageSmoothingQuality = "high";
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
