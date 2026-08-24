import { useEffect, useRef, useState } from "react";
import { initialsFromName, readAvatarFile } from "../../utils/avatar";
import { MIN_PASSWORD_LENGTH } from "../../utils/auth";
import { WALLET_LABELS } from "../../utils/wallet";
import { Button } from "../ui/primitives";

export function AvatarFace({ account, className = "" }) {
  if (account?.avatarUrl) {
    return <img className={`avatar-image ${className}`.trim()} src={account.avatarUrl} alt="" />;
  }
  return (
    <span className={`avatar-fallback ${className}`.trim()} aria-hidden="true">
      {initialsFromName(account?.name, account?.email)}
    </span>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="profile-icon" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5.2 19.2c.8-3.2 3.4-5 6.8-5s6 1.8 6.8 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProfileMenu({
  account,
  wallet,
  onUpdateAvatar,
  onChangePassword,
  onSetPassword,
  onReconnectWallet,
  onConnectWallet,
  onDisconnectWallet,
  onOpenPreferences,
  onSignOut,
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  async function handleAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    const parsed = await readAvatarFile(file);
    if (!parsed.ok) {
      setBusy(false);
      setError(parsed.error);
      return;
    }
    const result = await onUpdateAvatar(parsed.avatarUrl);
    setBusy(false);
    if (!result?.ok) {
      setError(result?.error || "Could not save that photo.");
      return;
    }
    setMessage("Profile photo updated.");
  }

  async function handlePassword(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = account?.hasPassword
      ? await onChangePassword({ currentPassword, password, confirmPassword })
      : await onSetPassword({ password, confirmPassword });
    setBusy(false);
    if (!result?.ok) {
      setError(result?.error || "Could not update password.");
      return;
    }
    setCurrentPassword("");
    setPassword("");
    setConfirmPassword("");
    setMessage(account?.hasPassword ? "Password updated." : "Password created. You can sign in with email now.");
  }

  const lastWalletName = wallet.lastWalletId ? WALLET_LABELS[wallet.lastWalletId] : "";
  const canReconnect = Boolean(!wallet.address && wallet.lastWalletId && wallet.available?.[wallet.lastWalletId]);

  return (
    <div className="profile-menu" ref={rootRef}>
      <button
        type="button"
        className="btn btn-ghost btn-icon profile-trigger"
        aria-label="Open profile"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen((current) => !current);
          setError("");
          setMessage("");
        }}
      >
        {account?.avatarUrl ? <AvatarFace account={account} className="profile-trigger-avatar" /> : <UserIcon />}
      </button>
      {open && (
        <div className="profile-popover" role="dialog" aria-label="Profile">
          <div className="profile-popover-head">
            <AvatarFace account={account} className="profile-popover-avatar" />
            <div>
              <strong>{account?.name || "Learner"}</strong>
              <p className="meta-line">{account?.email}</p>
              <p className="meta-line">
                {account?.provider === "google" ? "Google" : "Email"}
                {account?.hasPassword ? " · password set" : ""}
              </p>
            </div>
          </div>

          <label className="profile-upload">
            <span>Upload photo</span>
            <input type="file" accept="image/*" onChange={handleAvatar} disabled={busy} />
          </label>
          {account?.avatarUrl ? (
            <button type="button" className="text-link" onClick={() => onUpdateAvatar("")}>
              Remove photo
            </button>
          ) : null}

          <form className="profile-password" onSubmit={handlePassword}>
            <h3>{account?.hasPassword ? "Change password" : "Create a password"}</h3>
            {account?.hasPassword ? (
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Current password"
              />
            ) : (
              <p className="note">Add a password if you also want to sign in with email.</p>
            )}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder={`New password (${MIN_PASSWORD_LENGTH}+ characters)`}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Confirm password"
            />
            <Button type="submit" variant="secondary" disabled={busy}>
              {account?.hasPassword ? "Update password" : "Create password"}
            </Button>
          </form>

          <div className="profile-wallet">
            <h3>Wallet</h3>
            <p className="meta-line">
              {wallet.address
                ? `${wallet.walletName || "Wallet"} · ${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`
                : "Not connected"}
            </p>
            {wallet.address ? (
              <Button variant="ghost" onClick={onDisconnectWallet}>Disconnect</Button>
            ) : canReconnect ? (
              <Button onClick={onReconnectWallet}>Reconnect {lastWalletName}</Button>
            ) : (
              <Button onClick={onConnectWallet}>Connect wallet</Button>
            )}
          </div>

          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-info" role="status">{message}</p>}

          <div className="profile-popover-actions">
            <button type="button" className="text-link" onClick={() => { setOpen(false); onOpenPreferences(); }}>
              Preferences
            </button>
            <Button variant="ghost" onClick={onSignOut}>Sign out</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
