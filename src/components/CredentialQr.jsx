import { useEffect, useState } from "react";
import QRCode from "qrcode";

function CredentialQr({ url, label = "QR code for this credential URL" }) {
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!url) {
      setSvg("");
      setFailed(false);
      return undefined;
    }
    QRCode.toString(url, {
      type: "svg",
      margin: 1,
      width: 160,
      errorCorrectionLevel: "M",
      color: { dark: "#1a1916", light: "#fffefb" },
    })
      .then((markup) => {
        if (!cancelled) {
          setSvg(markup);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSvg("");
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!url || failed) return null;
  if (!svg) return <p className="meta-line">Preparing QR code…</p>;
  return (
    <div
      className="credential-qr"
      role="img"
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export default CredentialQr;
