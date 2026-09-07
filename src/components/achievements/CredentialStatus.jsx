import CredentialStatusBadge from "../CredentialStatusBadge";
import { Button } from "../ui/primitives";
import { CREDENTIAL_STATES } from "../../utils/credentialStatus";

/**
 * Verification strip using existing Forjora credential status language.
 */
export function CredentialStatus({
  verificationStatus = "claimed",
  credentialId = "",
  issuedLabel = "",
  onVerify,
  learningRecord = false,
}) {
  const trust = learningRecord
    ? {
        ...CREDENTIAL_STATES.claimed,
        label: "Learning record",
        body: "Off-chain Forjora path certificate — not a Fuji mint.",
      }
    : CREDENTIAL_STATES[verificationStatus] || CREDENTIAL_STATES.claimed;

  return (
    <aside className="card credential-status-panel">
      <p className="kicker">Verification</p>
      <CredentialStatusBadge status={trust.id} />
      <dl className="certificate-meta">
        {credentialId ? (
          <div><dt>Credential ID</dt><dd>{credentialId}</dd></div>
        ) : null}
        {issuedLabel ? (
          <div><dt>Issued</dt><dd>{issuedLabel}</dd></div>
        ) : null}
        <div><dt>Status</dt><dd>{trust.label}</dd></div>
      </dl>
      <p className="meta-line">{trust.body || trust.summary}</p>
      {onVerify ? (
        <Button variant="secondary" onClick={onVerify}>Verify credential</Button>
      ) : null}
    </aside>
  );
}

export default CredentialStatus;
