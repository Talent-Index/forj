import { shortAddress } from "../utils/learnerStats";
import { describeMetadataUri } from "../utils/credentialModel";
import { EXPLORER_LINK_LABEL, resolveCredentialStatus } from "../utils/credentialStatus";
import { PRODUCT_NAME } from "../utils/brand";
import { isCredentialShareUrl, isSameOriginAssetPath, safeExternalHref, safeMediaSrc } from "../utils/frontendSecurity";
import CredentialStatusBadge from "./CredentialStatusBadge";

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
  verificationUrl = "",
  compact = false,
}) {
  const trust = resolveCredentialStatus(verificationStatus);
  const shareHref = isSameOriginAssetPath(verificationUrl) || isCredentialShareUrl(verificationUrl)
    ? verificationUrl
    : "";

  return (
    <article className={`certificate-artifact status-${trust.id} ${compact ? "is-compact" : ""}`}>
      <p className="certificate-brand">{PRODUCT_NAME}</p>
      <div className="certificate-divider" aria-hidden="true" />
      <h2 className="certificate-title">
        <span className="certificate-title-line">Certificate</span>
        <span className="certificate-title-of">of</span>
        <span className="certificate-title-line">Achievement</span>
      </h2>
      <p className="certificate-awarded">Awarded to</p>
      <p className="certificate-recipient">{recipientName || "Recipient"}</p>
      <div className="certificate-art-frame">
        {safeMediaSrc(artwork) ? (
          <img src={safeMediaSrc(artwork)} alt="Blacksmith in a forge presenting a crafted diamond" />
        ) : (
          <div className="certificate-art-fallback" aria-hidden="true" />
        )}
      </div>
      <p className="certificate-path">Avalanche Fundamentals</p>
      <p className="certificate-score-line">
        Score · {scorePercent}%
        <span>Difficulty · {difficulty}</span>
      </p>
      <p className="certificate-trust">
        <CredentialStatusBadge status={trust} />
      </p>
      <p className="certificate-trust-body">{trust.body}</p>
      {!compact && (
        <dl className="certificate-meta">
          <div><dt>Certificate ID</dt><dd>{credentialId}</dd></div>
          <div><dt>Network</dt><dd>Avalanche Fuji · {chainId || 43113}</dd></div>
          <div><dt>Status</dt><dd>{trust.label}</dd></div>
          <div><dt>Wallet</dt><dd>{shortAddress(walletAddress) || "—"}</dd></div>
          <div><dt>Contract</dt><dd>{shortAddress(contractAddress) || "—"}</dd></div>
          <div><dt>Version</dt><dd>Schema v{schemaVersion || 1}</dd></div>
          {metadataUri ? <div><dt>Metadata</dt><dd>{describeMetadataUri(metadataUri)}</dd></div> : null}
        </dl>
      )}
      {shareHref && (
        <p className="certificate-verify-url">
          <a href={shareHref}>{shareHref}</a>
        </p>
      )}
      {safeExternalHref(explorerUrl) && (
        <p className="certificate-explorer">
          <a href={safeExternalHref(explorerUrl)} target="_blank" rel="noopener noreferrer">{EXPLORER_LINK_LABEL}</a>
        </p>
      )}
    </article>
  );
}

export default CertificateArtifact;
