import { networkLabel } from "../utils/wallet";

function NetworkGate({ chainId, switching, error, onSwitch }) {
  return (
    <div className="card network-gate">
      <h2>Switch to Avalanche Fuji</h2>
      <p>
        SkillForge only runs on Avalanche Fuji (chain ID 43113). Your wallet is currently on{" "}
        <strong>{networkLabel(chainId)}</strong>.
      </p>
      {error && <div className="wallet-error">{error}</div>}
      <button className="btn-primary" onClick={onSwitch} disabled={switching}>
        {switching ? "Switching..." : "Switch to Avalanche Fuji"}
      </button>
      <p className="wallet-hint">
        If the request is rejected, open your wallet and select Avalanche Fuji Testnet, then return here.
      </p>
    </div>
  );
}

export default NetworkGate;
