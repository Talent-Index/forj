import { PRODUCT_NAME } from "../../utils/brand";
import { Button } from "../ui/primitives";
import { Doodle } from "../doodles";

/**
 * Formal learning certificate — off-chain path evidence, not Fuji mint.
 */
export function CertificateViewer({
  certificate,
  recipientName = "Learner",
  onVerify,
  compact = false,
}) {
  if (!certificate) return null;
  const earned = Boolean(certificate.earned);

  return (
    <article
      className={`certificate-artifact learning-certificate ${compact ? "is-compact" : ""} ${earned ? "is-earned" : "is-locked"}`}
    >
      <p className="certificate-brand">{PRODUCT_NAME}</p>
      <div className="certificate-divider" aria-hidden="true" />
      <h2 className="certificate-title">
        <span className="certificate-title-line">Certificate</span>
        <span className="certificate-title-of">of</span>
        <span className="certificate-title-line">Achievement</span>
      </h2>
      <p className="certificate-awarded">This certifies that</p>
      <p className="certificate-recipient">{recipientName || "Learner"}</p>
      <p className="certificate-path">
        has successfully demonstrated
        <br />
        <strong>{certificate.title}</strong>
      </p>
      <section className="learning-cert-skills">
        <p className="kicker">Skills demonstrated</p>
        <ul>
          {(certificate.skills || []).map((skill) => (
            <li key={skill}>
              <span className={earned ? "result-mark-ok" : "meta-line"}>{earned ? "✓" : "·"}</span>
              {skill}
            </li>
          ))}
        </ul>
      </section>
      <p className="certificate-score-line">
        Achievement level · {certificate.level}
      </p>
      {earned ? (
        <dl className="certificate-meta">
          <div><dt>Issued</dt><dd>{certificate.issuedLabel || "—"}</dd></div>
          <div><dt>Credential ID</dt><dd>{certificate.credentialId || "—"}</dd></div>
          <div><dt>Status</dt><dd>Learning record · not on-chain</dd></div>
        </dl>
      ) : (
        <p className="certificate-trust-body">
          Complete the required lessons, assessments, and challenges to earn this certificate.
        </p>
      )}
      {earned && onVerify ? (
        <div className="certificate-actions">
          <Button variant="secondary" onClick={onVerify}>View achievement</Button>
        </div>
      ) : null}
      <p className="note">
        A Forjora learning certificate is path evidence. It is not a Fuji soulbound mint and not issuer-attested.
      </p>
    </article>
  );
}

export function CertificateCard({ certificate, onOpen }) {
  const earned = Boolean(certificate?.earned);
  return (
    <button
      type="button"
      className={`card track-cert-card learning-cert-card ${earned ? "is-achieved" : "is-locked"}`}
      onClick={() => onOpen?.(certificate)}
    >
      <div className="track-cert-head">
        <span className="track-cert-icon" aria-hidden="true">
          <Doodle type="certificate" size={18} variant={earned ? "accent" : "muted"} />
        </span>
        <p className="kicker">{earned ? "Achieved" : "In progress"}</p>
      </div>
      <h3>{certificate.title}</h3>
      <p className="meta-line">{certificate.level}</p>
      <p className="meta-line">{(certificate.skills || []).slice(0, 3).join(" · ")}</p>
    </button>
  );
}

export default CertificateViewer;
