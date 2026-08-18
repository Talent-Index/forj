import { QUESTIONS_PER_QUIZ } from "../utils/quiz";
import { SCORE_SECTIONS } from "../utils/progress";
import { shortAddress } from "../utils/learnerStats";
import { describeMetadataUri } from "../utils/credentialModel";

export const TRUST_COPY = {
  claimed: {
    title: "Claimed",
    body: "This credential records a score claimed by the recipient. It is not an independently proctored assessment.",
  },
  attested: {
    title: "Issuer attested",
    body: "This credential was authorized by a recognized SkillForge issuer.",
  },
};

export function quizPercent(sectionScores = {}) {
  const correct = SCORE_SECTIONS.reduce(
    (sum, id) => sum + (Number(sectionScores[id]?.correct) || 0),
    0
  );
  return Math.round((correct / (SCORE_SECTIONS.length * QUESTIONS_PER_QUIZ)) * 100);
}

export function highestDifficulty(sectionScores = {}) {
  if (sectionScores.hard?.correct === QUESTIONS_PER_QUIZ) return "Hard";
  if (sectionScores.medium?.correct === QUESTIONS_PER_QUIZ) return "Medium";
  if (sectionScores.easy?.correct === QUESTIONS_PER_QUIZ) return "Easy";
  return "In progress";
}

export function certificateId(address, maskHex) {
  if (!address) return "SF-LOCAL";
  return `SF-${address.slice(2, 8).toUpperCase()}-${String(maskHex || "0").toUpperCase()}`;
}

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
