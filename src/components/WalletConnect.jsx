import {
  WALLET_IDS,
  WALLET_LABELS,
  networkLabel,
  walletDeepLink,
  walletInstallUrl,
} from "../utils/wallet";
import { ERROR_STATES, WALLET_GUIDANCE } from "../utils/onboarding";
import EmptyState from "./EmptyState";

function shortenAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function WalletOption({
  id,
  installed,
  connecting,
  isMobile,
  onConnect,
}) {
  const label = WALLET_LABELS[id];
  if (!installed && isMobile) {
    const href = typeof window === "undefined" ? walletInstallUrl(id) : walletDeepLink(id, window.location.href);
    return (
      <a className="btn-secondary btn-wallet-option" href={href}>
        Open {label}
      </a>
    );
  }
  if (!installed) {
    return (
      <a className="btn-secondary btn-wallet-option" href={walletInstallUrl(id)} target="_blank" rel="noreferrer">
        Install {label}
      </a>
    );
  }
  return (
    <button
      className="btn-primary btn-wallet-option"
      onClick={() => onConnect(id)}
      disabled={connecting}
    >
      {connecting ? "Connecting..." : `Connect ${label}`}
    </button>
  );
}

function WalletConnect({
  address,
  connecting,
  switching,
  error,
  chainId,
  isFuji,
  walletName,
  available,
  isMobile,
  onConnect,
  onDisconnect,
  onSwitch,
  guidance = false,
}) {
  if (address) {
    return (
      <div className="wallet-bar connected">
        <span className="wallet-status">
          {walletName ? `${walletName} · ` : ""}{shortenAddress(address)}
        </span>
        <span className={`wallet-network ${isFuji ? "wallet-network-ok" : "wallet-network-bad"}`}>
          {isFuji ? "Avalanche Fuji" : networkLabel(chainId)}
        </span>
        {!isFuji && (
          <button
            className="btn-wallet-switch"
            onClick={() => onSwitch?.()?.catch?.(() => {})}
            disabled={switching}
          >
            {switching ? "Switching..." : "Switch to Fuji"}
          </button>
        )}
        <button className="btn-wallet-disconnect" onClick={onDisconnect}>
          Disconnect
        </button>
      </div>
    );
  }

  const noWallet = !available?.any && !isMobile;

  return (
    <div className="card wallet-connect-card">
      <div className="wallet-icon">👛</div>
      <h2>Connect Your Wallet</h2>
      <p className="wallet-desc">
        {guidance
          ? WALLET_GUIDANCE.body
          : "Connect MetaMask or Core Wallet, then switch to Avalanche Fuji to use SkillForge."}
      </p>
      {error && (
        <EmptyState
          variant="error"
          icon="⚠️"
          title={ERROR_STATES.wallet.title}
          body={`${error} ${ERROR_STATES.wallet.body}`}
        />
      )}
      {noWallet && (
        <EmptyState
          variant="empty"
          icon="🔌"
          title="No wallet detected"
          body={WALLET_GUIDANCE.noWallet}
        />
      )}
      <div className="wallet-options">
        <WalletOption
          id={WALLET_IDS.metamask}
          installed={Boolean(available?.metamask)}
          connecting={connecting}
          isMobile={isMobile}
          onConnect={onConnect}
        />
        <WalletOption
          id={WALLET_IDS.core}
          installed={Boolean(available?.core)}
          connecting={connecting}
          isMobile={isMobile}
          onConnect={onConnect}
        />
      </div>
    </div>
  );
}

export default WalletConnect;
