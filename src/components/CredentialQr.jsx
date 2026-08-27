import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { isCredentialShareUrl } from "../utils/frontendSecurity";

function CredentialQr({ url, label = "QR code for this credential URL" }) {
  const [dataUrl, setDataUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const safeUrl = isCredentialShareUrl(url, origin) ? url : "";

  useEffect(() => {
    let cancelled = false;
    if (!safeUrl) {
      setDataUrl("");
      setFailed(false);
      return undefined;
    }
    QRCode.toDataURL(safeUrl, {
      margin: 1,
      width: 160,
      errorCorrectionLevel: "M",
      color: { dark: "#1a1916", light: "#fffefb" },
    })
      .then((markup) => {
        if (!cancelled) {
          setDataUrl(markup);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl("");
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [safeUrl]);

  if (!safeUrl || failed) return null;
  if (!dataUrl) return <p className="meta-line">Preparing QR code…</p>;
  return (
    <img
      className="credential-qr"
      src={dataUrl}
      width={160}
      height={160}
      alt={label}
    />
  );
}

export default CredentialQr;
