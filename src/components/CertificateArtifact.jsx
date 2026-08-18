import { shortAddress } from "../utils/learnerStats";
import { describeMetadataUri } from "../utils/credentialModel";
import { TRUST_COPY } from "../utils/certificateView";

function CertificateArtifact({
  artwork,
  recipientName,
  scorePercent,
  difficulty,
  credentialId,
  verificationStatus = "claimed",
  walletAddress,
  chainId,
  contractAddress,
  schemaVersion,
  metadataUri,
  explorerUrl,
  compact = false,
}) {
  const trust = verificationStatus === "attested" ? TRUST_COPY.attested : TRUST_COPY.claimed;

  return (
    <article className={`certificate-artifact ${compact ? "is-compact" : ""}`}>
      <p className="certificate-brand">SkillForge</p>
      <h2 className="certificate-title">Certificate of Achievement</h2>
      <div className="certificate-art-frame">
        {artwork ? (
          <img src={artwork} alt="Blacksmith in a forge presenting a crafted diamond" />
        ) : (
          <div className="certificate-art-fallback" aria-hidden="true" />
        )}
      </div>
      <p className="certificate-awarded">Awarded to</p>
      <p className="certificate-recipient">{recipientName || "Recipient"}</p>
      <p className="certificate-path">Avalanche Fundamentals</p>
      <p className="certificate-score-line">
        Score · {scorePercent}%
        <span>Difficulty · {difficulty}</span>
      </p>
      <p className={`certificate-trust status-${verificationStatus === "attested" ? "attested" : "claimed"}`}>
        {trust.title}
      </p>
      <p className="certificate-trust-body">{trust.body}</p>
      {!compact && (
        <dl className="certificate-meta">
          <div><dt>Credential ID</dt><dd>{credentialId}</dd></div>
          <div><dt>Network</dt><dd>Avalanche Fuji · {chainId || 43113}</dd></div>
          <div><dt>Status</dt><dd>{trust.title}</dd></div>
          <div><dt>Wallet</dt><dd>{shortAddress(walletAddress) || "—"}</dd></div>
          <div><dt>Contract</dt><dd>{shortAddress(contractAddress) || "—"}</dd></div>
          <div><dt>Version</dt><dd>Schema v{schemaVersion || 1}</dd></div>
          {metadataUri ? <div><dt>Metadata</dt><dd>{describeMetadataUri(metadataUri)}</dd></div> : null}
        </dl>
      )}
      {explorerUrl && (
        <p className="certificate-verify">
          <a href={explorerUrl} target="_blank" rel="noreferrer">Verify on Snowtrace</a>
        </p>
      )}
    </article>
  );
}

export default CertificateArtifact;
