import { resolveCredentialStatus } from "../utils/credentialStatus";

function CredentialStatusBadge({ status, className = "" }) {
  const state = resolveCredentialStatus(status);
  return (
    <span
      className={`credential-status credential-status-${state.id} ${className}`.trim()}
      role="status"
    >
      {state.label}
    </span>
  );
}

export default CredentialStatusBadge;
