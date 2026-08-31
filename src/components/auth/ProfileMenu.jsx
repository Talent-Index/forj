import { useEffect, useRef, useState } from "react";
import { WALLET_LABELS } from "../../utils/wallet";
import { shortAddress } from "../../utils/learnerStats";
import { Button } from "../ui/primitives";
import { AvatarFace } from "./AvatarFace";

function signInMethod(account) {
  if (account?.provider === "google" && account?.hasPassword) return "Google · password set";
  if (account?.provider === "google") return "Google";
  return account?.hasPassword ? "Email and password" : "Email";
}

function ProfileMenu({
  account,
  wallet,
  onReconnectWallet,
  onConnectWallet,
  onDisconnectWallet,
  onOpenPreferences,
  onSignOut,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointer(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const lastWalletName = wallet.lastWalletId ? WALLET_LABELS[wallet.lastWalletId] : "";
  const canReconnect = Boolean(!wallet.address && wallet.lastWalletId && wallet.available?.[wallet.lastWalletId]);
  const walletLabel = wallet.address
    ? `${wallet.walletName || "Wallet"} · ${shortAddress(wallet.address)}`
    : "Not connected";

  function closeAnd(action) {
    setOpen(false);
    action?.();
  }

  return (
    <div className="profile-menu" ref={rootRef}>
      <button
        type="button"
        className="btn btn-ghost btn-icon profile-trigger"
        aria-label="Open profile menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="profile-popover"
        onClick={() => setOpen((current) => !current)}
      >
        <AvatarFace account={account} className="profile-trigger-avatar" />
      </button>
      {open && (
        <div id="profile-popover" className="profile-popover" role="dialog" aria-label="Account menu">
          <div className="profile-popover-head">
            <AvatarFace account={account} className="profile-popover-avatar" />
            <div className="profile-popover-identity">
              <strong>{account?.name || "Learner"}</strong>
              <p className="profile-email">{account?.email}</p>
              <p className="meta-line">{signInMethod(account)}</p>
            </div>
          </div>

          <div className="profile-popover-wallet">
            <p className="meta-line">Wallet</p>
            <p className="profile-wallet-status">{walletLabel}</p>
            {wallet.address ? (
              <Button variant="ghost" onClick={onDisconnectWallet}>Disconnect</Button>
            ) : canReconnect ? (
              <Button variant="secondary" onClick={onReconnectWallet}>Reconnect {lastWalletName}</Button>
            ) : (
              <Button variant="secondary" onClick={() => closeAnd(onConnectWallet)}>Connect wallet</Button>
            )}
          </div>

          <div className="profile-popover-nav">
            <button
              type="button"
              className="profile-menu-item"
              onClick={() => closeAnd(onOpenPreferences)}
            >
              Profile and preferences
            </button>
            <button type="button" className="profile-menu-item" onClick={() => closeAnd(onSignOut)}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
export { AvatarFace } from "./AvatarFace";
