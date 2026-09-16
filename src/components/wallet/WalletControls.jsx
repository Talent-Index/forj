import { WALLET_IDS, WALLET_LABELS, walletDeepLink, walletInstallUrl } from "../../utils/wallet";
import { ERROR_STATES, WALLET_GUIDANCE } from "../../utils/onboarding";
import { Button, Modal } from "../ui/primitives";
import EmptyState from "../EmptyState";

function WalletOption({ id, installed, connecting, isMobile, onConnect }) {
  const label = WALLET_LABELS[id];
  if (!installed && isMobile) {
    return (
      <Button className="btn-block" variant="secondary" onClick={() => onConnect(id)} disabled={connecting}>
        {connecting ? "Opening…" : `Open ${label}`}
      </Button>
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
  info,
  available,
  isMobile,
  lastWalletId,
  onConnect,
}) {
  const noWallet = !available?.any && !isMobile;
  const needsInApp = Boolean(isMobile && !available?.any);
  const lastLabel = lastWalletId ? WALLET_LABELS[lastWalletId] : "";
  const canReconnect = Boolean(lastWalletId);
  const guidanceBody = isMobile ? WALLET_GUIDANCE.mobileBody : WALLET_GUIDANCE.body;
  const steps = isMobile ? WALLET_GUIDANCE.mobileSteps : WALLET_GUIDANCE.steps;

  return (
    <Modal open={open} title="Connect wallet" onClose={onClose}>
      <p className="modal-copy">{guidanceBody}</p>
      {needsInApp ? (
        <EmptyState
          title="Open Forjora in your wallet"
          body={WALLET_GUIDANCE.mobileNoWallet}
        />
      ) : null}
      {canReconnect ? (
        <div className="wallet-reconnect">
          <p>Previously connected: {lastLabel}</p>
          <Button className="btn-block" onClick={() => onConnect(lastWalletId)} disabled={connecting}>
            {connecting
              ? (available?.[lastWalletId] ? "Reconnecting…" : "Opening…")
              : available?.[lastWalletId]
                ? `Reconnect ${lastLabel}`
                : isMobile
                  ? `Open ${lastLabel}`
                  : `Reconnect ${lastLabel}`}
          </Button>
        </div>
      ) : null}
      {info && !error ? (
        <EmptyState title="Continue in your wallet app" body={info} />
      ) : null}
      {error ? (
        <EmptyState
          variant="error"
          title={ERROR_STATES.wallet.title}
          body={`${error} ${ERROR_STATES.wallet.body}`}
        />
      ) : null}
      {noWallet ? (
        <EmptyState title="No wallet detected" body={WALLET_GUIDANCE.noWallet} />
      ) : null}
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
      {isMobile && available?.any ? (
        <Button
          className="btn-block"
          variant="ghost"
          disabled={connecting}
          onClick={() => onConnect(lastWalletId || WALLET_IDS.metamask)}
        >
          Retry connect
        </Button>
      ) : null}
      <ol className="wallet-steps">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="meta-line">Network · Avalanche Fuji Testnet</p>
      {isMobile ? (
        <p className="meta-line">
          Deep links:{" "}
          <a href={typeof window === "undefined" ? walletInstallUrl(WALLET_IDS.metamask) : walletDeepLink(WALLET_IDS.metamask, window.location.href)}>
            MetaMask
          </a>
          {" · "}
          <a href={typeof window === "undefined" ? walletInstallUrl(WALLET_IDS.core) : walletDeepLink(WALLET_IDS.core, window.location.href)}>
            Core
          </a>
        </p>
      ) : null}
    </Modal>
  );
}
