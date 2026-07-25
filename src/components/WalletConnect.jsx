function shortenAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function WalletConnect({ address, connecting, error, onConnect, onDisconnect }) {
  if (address) {
    return (
      <div className="wallet-bar connected">
        <span className="wallet-status">🔗 {shortenAddress(address)}</span>
        <span className="wallet-network">Avalanche Fuji</span>
        <button className="btn-wallet-disconnect" onClick={onDisconnect}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="card wallet-connect-card">
      <div className="wallet-icon">👛</div>
      <h2>Connect Your Wallet</h2>
      <p className="wallet-desc">
        Sign up with MetaMask or Core Wallet on Avalanche Fuji to earn verifiable on-chain credentials.
      </p>
      {error && <div className="wallet-error">{error}</div>}
      <button className="btn-primary btn-connect" onClick={onConnect} disabled={connecting}>
        {connecting ? "Connecting..." : "🔗 Connect Wallet"}
      </button>
    </div>
  );
}

export default WalletConnect;
