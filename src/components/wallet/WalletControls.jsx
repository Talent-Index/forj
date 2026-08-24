import {
  WALLET_IDS,
  WALLET_LABELS,
  networkLabel,
  walletDeepLink,
  walletInstallUrl,
} from "../../utils/wallet";
import { ERROR_STATES, WALLET_GUIDANCE } from "../../utils/onboarding";
import { Button, Modal } from "../ui/primitives";
import EmptyState from "../EmptyState";

function shortenAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function WalletOption({ id, installed, connecting, isMobile, onConnect }) {
  const label = WALLET_LABELS[id];
  if (!installed && isMobile) {
    const href = typeof window === "undefined" ? walletInstallUrl(id) : walletDeepLink(id, window.location.href);
    return (
      <a className="btn btn-secondary btn-block" href={href}>
        Open {label}
      </a>
    );
  }
  if (!installed) {
    return (
      <a className="btn btn-secondary btn-block" href={walletInstallUrl(id)} target="_blank" rel="noreferrer">
        Install {label}
      </a>
    );
  }
  return (
    <Button className="btn-block" onClick={() => onConnect(id)} disabled={connecting}>
      {connecting ? "Connecting…" : label}
    </Button>
  );
}

export function WalletModal({
  open,
  onClose,
  connecting,
  error,
  available,
  isMobile,
  lastWalletId,
  onConnect,
}) {
  const noWallet = !available?.any && !isMobile;
  const lastLabel = lastWalletId ? WALLET_LABELS[lastWalletId] : "";
  const canReconnect = Boolean(lastWalletId && available?.[lastWalletId]);
  return (
    <Modal open={open} title="Connect wallet" onClose={onClose}>
      <p className="modal-copy">{WALLET_GUIDANCE.body}</p>
      {canReconnect && (
        <div className="wallet-reconnect">
          <p>Previously connected: {lastLabel}</p>
          <Button className="btn-block" onClick={() => onConnect(lastWalletId)} disabled={connecting}>
            {connecting ? "Reconnecting…" : `Reconnect ${lastLabel}`}
          </Button>
        </div>
      )}
      {error && (
        <EmptyState
          variant="error"
          title={ERROR_STATES.wallet.title}
          body={`${error} ${ERROR_STATES.wallet.body}`}
        />
      )}
      {noWallet && (
        <EmptyState title="No wallet detected" body={WALLET_GUIDANCE.noWallet} />
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
      <p className="meta-line">Network · Avalanche Fuji Testnet</p>
    </Modal>
  );
}

export function WalletButton({
  address,
  connecting,
  switching,
  chainId,
  isFuji,
  walletName,
  onDisconnect,
  onSwitch,
  onOpen,
}) {
  if (!address) {
    return (
      <Button onClick={onOpen} disabled={connecting}>
        {connecting ? "Connecting…" : "Connect wallet"}
      </Button>
    );
  }

  return (
    <div className="wallet-cluster">
      <span className={`network-chip ${isFuji ? "ok" : "bad"}`}>
        {isFuji ? "Fuji" : networkLabel(chainId)}
      </span>
      <span className="wallet-chip" title={address}>
        {walletName ? `${walletName} · ` : ""}
        {shortenAddress(address)}
      </span>
      {!isFuji && (
        <Button variant="secondary" onClick={() => onSwitch?.()?.catch?.(() => {})} disabled={switching}>
          {switching ? "Switching…" : "Switch to Fuji"}
        </Button>
      )}
      <Button variant="ghost" onClick={onDisconnect}>
        Disconnect
      </Button>
    </div>
  );
}
