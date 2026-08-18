import { networkLabel } from "../utils/wallet";
import { ERROR_STATES, FUJI_EXPLAINER } from "../utils/onboarding";
import EmptyState from "./EmptyState";

function NetworkGate({ chainId, switching, error, onSwitch }) {
  return (
    <div className="card network-gate">
      <EmptyState
        variant="error"
        title="Wrong network"
        body={`${ERROR_STATES.network.body} Current network: ${networkLabel(chainId)}. ${FUJI_EXPLAINER.body}`}
        actionLabel={switching ? "Switching…" : "Switch network"}
        onAction={onSwitch}
      />
      {error && <p className="note">{error}</p>}
      <p className="note">
        Need test AVAX?{" "}
        <a href={FUJI_EXPLAINER.faucetUrl} target="_blank" rel="noreferrer">Fuji faucet</a>
      </p>
    </div>
  );
}

export default NetworkGate;
