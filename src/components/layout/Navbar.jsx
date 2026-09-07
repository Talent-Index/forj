import { useEffect, useState } from "react";
import { BrandMark } from "../brand/ForjoraMark";
import { WalletModal } from "../wallet/WalletControls";
import ProfileMenu from "../auth/ProfileMenu";
import { Icon } from "../ui/Icon";
import { Doodle } from "../doodles";

const LOGGED_OUT_LINKS = [
  { id: "learn", label: "Learn", icon: "learn" },
  { id: "credentials", label: "Credentials", icon: "badge" },
  { id: "about", label: "About", icon: "about" },
];

const LOGGED_IN_LINKS = [
  { id: "learn", label: "Learn", icon: "learn" },
  { id: "progress", label: "Progress", icon: "progress" },
  { id: "leaderboard", label: "Board", icon: "board" },
  { id: "credentials", label: "Credentials", icon: "badge" },
];

function ConnectedNotice({ address }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!address) {
      setVisible(false);
      return undefined;
    }
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2400);
    return () => clearTimeout(timer);
  }, [address]);

  if (!visible || !address) return null;
  return (
    <p className="wallet-connected-toast" role="status">Connected</p>
  );
}

function ZoomToggle({ zoom = 100, onCycleZoom }) {
  return (
    <button
      type="button"
      className="nav-tool zoom-toggle nav-extra"
      onClick={onCycleZoom}
      aria-label={`Zoom ${zoom} percent. Click to cycle.`}
      title={`Zoom ${zoom}%`}
    >
      <svg viewBox="0 0 24 24" className="zoom-icon" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M15 15.2 20 20.2M10.5 8v5M8 10.5h5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <span className="visually-hidden">{zoom}%</span>
    </button>
  );
}

function ThemeToggle({ theme, onToggleTheme }) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className="nav-tool theme-toggle"
      onClick={onToggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" className="theme-icon" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M12 3.2v2.1M12 18.7v2.1M4.6 12H2.5M21.5 12h-2.1M6.1 6.1l1.5 1.5M16.4 16.4l1.5 1.5M6.1 17.9l1.5-1.5M16.4 7.6l1.5-1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="theme-icon" aria-hidden="true">
          <path
            d="M15.2 4.4a7.4 7.4 0 1 0 4.4 4.4 5.8 5.8 0 0 1-4.4-4.4Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

function Navbar({
  page,
  onNavigate,
  isAuthenticated,
  account,
  wallet,
  theme,
  onToggleTheme,
  zoom,
  onCycleZoom,
  walletModal,
  onOpenAuth,
  profile,
}) {
  const links = isAuthenticated ? LOGGED_IN_LINKS : LOGGED_OUT_LINKS;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <button
          className="wordmark"
          onClick={() => onNavigate(isAuthenticated ? "learn" : "landing")}
        >
          <BrandMark showDiamond />
        </button>
        <nav className="nav-links" aria-label="Primary">
          {links.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-link nav-link-icon ${page === item.id ? "is-active" : ""}`}
              onClick={() => onNavigate(item.id)}
              aria-label={item.label}
              title={item.label}
            >
              <Icon name={item.icon} size={18} />
              <span className="visually-hidden">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="nav-actions">
          <div className="nav-tools" role="group" aria-label="Display">
            <ZoomToggle zoom={zoom} onCycleZoom={onCycleZoom} />
            <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
          </div>
          {!isAuthenticated ? (
            <div className="nav-auth">
              <button
                type="button"
                className="nav-tool nav-extra"
                onClick={() => onOpenAuth("signin")}
                aria-label="Sign in"
                title="Sign in"
              >
                <Icon name="profile" size={18} />
                <span className="visually-hidden">Sign in</span>
              </button>
              <button
                type="button"
                className="nav-cta nav-cta-icon"
                onClick={() => onOpenAuth("signup")}
                aria-label="Start"
                title="Start"
              >
                <Doodle type="door" size={18} variant="accent" />
                <span className="visually-hidden">Start</span>
              </button>
            </div>
          ) : (
            <>
              <ConnectedNotice address={wallet.address} />
              {!wallet.address ? (
                <button
                  type="button"
                  className="nav-tool nav-extra"
                  onClick={walletModal.openModal}
                  aria-label="Connect wallet"
                  title="Connect wallet"
                >
                  <Icon name="wallet" size={18} />
                  <span className="visually-hidden">Connect</span>
                </button>
              ) : null}
              <ProfileMenu
                account={account}
                wallet={wallet}
                onReconnectWallet={() => wallet.connect(wallet.lastWalletId)}
                onConnectWallet={walletModal.openModal}
                onDisconnectWallet={profile?.onDisconnectWallet}
                onOpenPreferences={profile?.onOpenPreferences}
                onSignOut={profile?.onSignOut}
              />
            </>
          )}
        </div>
      </div>
      <WalletModal
        open={walletModal.open}
        onClose={walletModal.closeModal}
        connecting={wallet.connecting}
        error={wallet.error}
        available={wallet.available}
        isMobile={wallet.isMobile}
        lastWalletId={wallet.lastWalletId}
        onConnect={(id) => wallet.connect(id)}
      />
    </header>
  );
}

export default Navbar;
export { BrandMark } from "../brand/ForjoraMark";
export { LOGGED_OUT_LINKS, LOGGED_IN_LINKS, ThemeToggle, ZoomToggle };
