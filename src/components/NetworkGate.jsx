import { networkLabel } from "../utils/wallet";
import { ERROR_STATES, FUJI_EXPLAINER } from "../utils/onboarding";
import EmptyState from "./EmptyState";

function NetworkGate({ chainId, switching, error, onSwitch }) {
  return (
    <div className="card network-gate">
      <EmptyState
        variant="error"
        icon="🌐"
        title={ERROR_STATES.network.title}
        body={`${ERROR_STATES.network.body} Your wallet is on ${networkLabel(chainId)}. ${FUJI_EXPLAINER.body}`}
      />
      {error && <div className="wallet-error">{error}</div>}
      <button className="btn-primary" onClick={onSwitch} disabled={switching}>
        {switching ? "Switching..." : "Switch to Avalanche Fuji"}
      </button>
      <p className="wallet-hint">
        If the request is rejected, open your wallet and select Avalanche Fuji Testnet, then return here.
        Minting later also needs free test AVAX from the{" "}
        <a href={FUJI_EXPLAINER.faucetUrl} target="_blank" rel="noreferrer">Fuji faucet</a>.
      </p>
    </div>
  );
}

export default NetworkGate;
