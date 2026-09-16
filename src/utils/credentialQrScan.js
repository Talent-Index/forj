import jsQR from "jsqr";

export function browserSupportsCameraScan() {
  return (
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof document !== "undefined" &&
    typeof document.createElement === "function"
  );
}

export function browserSupportsNativeQrDetect() {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

/**
 * Start a camera QR scan.
 * Prefer BarcodeDetector; fall back to jsQR for Firefox and other browsers.
 * Returns a stop() function.
 */
export async function startCredentialQrScan({
  video,
  onDetect,
  onError,
  intervalMs = 450,
}) {
  if (!browserSupportsCameraScan()) {
    onError?.("This device has no camera API. Paste a credential URL or enter a credential ID.");
    return () => {};
  }

  let stream = null;
  let timer = null;
  let cancelled = false;
  let detector = null;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  function stop() {
    cancelled = true;
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
    stream?.getTracks?.().forEach((track) => track.stop());
    stream = null;
    if (video) video.srcObject = null;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
  } catch {
    onError?.("Camera access was blocked. Paste a credential URL or enter a credential ID instead.");
    return () => {};
  }

  if (cancelled) {
    stream.getTracks().forEach((track) => track.stop());
    return () => {};
  }

  if (video) {
    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      /* autoplay quirks; frames may still arrive */
    }
  }

  if (browserSupportsNativeQrDetect()) {
    try {
      detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    } catch {
      detector = null;
    }
  }

  async function tick() {
    if (cancelled || !video || video.readyState < 2) return;

    if (detector) {
      try {
        const codes = await detector.detect(video);
        const raw = codes?.[0]?.rawValue || "";
        if (raw) {
          stop();
          onDetect?.(raw);
          return;
        }
      } catch {
        /* keep scanning / fall through to jsQR */
      }
    }

    if (!ctx) return;
    const width = video.videoWidth || 0;
    const height = video.videoHeight || 0;
    if (!width || !height) return;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(video, 0, 0, width, height);
    const image = ctx.getImageData(0, 0, width, height);
    const code = jsQR(image.data, image.width, image.height, {
      inversionAttempts: "dontInvert",
    });
    if (code?.data) {
      stop();
      onDetect?.(code.data);
    }
  }

  timer = window.setInterval(() => {
    tick().catch(() => {});
  }, intervalMs);

  return stop;
}
