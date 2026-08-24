import { WalletModal } from "../wallet/WalletControls";
import ProfileMenu from "../auth/ProfileMenu";

const LOGGED_OUT_LINKS = [
  { id: "learn", label: "Learn" },
  { id: "credentials", label: "Credentials" },
  { id: "lookup", label: "Lookup" },
  { id: "about", label: "About" },
];

const LOGGED_IN_LINKS = [
  { id: "learn", label: "Learn" },
  { id: "progress", label: "Progress" },
  { id: "leaderboard", label: "Board" },
  { id: "credentials", label: "Credentials" },
];

function BrandMark() {
  return (
    <span className="brand">
      <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.5 21 12 12 21.5 3 12 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 7.5 16.5 12 12 16.5 7.5 12 Z" fill="currentColor" />
      </svg>
      SkillForge
    </span>
  );
}

function ZoomToggle({ zoom = 100, onCycleZoom }) {
  return (
    <button
      className="btn btn-ghost btn-icon zoom-toggle"
      onClick={onCycleZoom}
      aria-label={`Browser-style page zoom ${zoom} percent. Click to cycle 100, 125, 150, 175.`}
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
      <span className="zoom-label">{zoom}%</span>
    </button>
  );
}

function ThemeToggle({ theme, onToggleTheme }) {
  const isDark = theme === "dark";
  return (
    <button
      className="btn btn-ghost btn-icon theme-toggle"
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
          <BrandMark />
        </button>
        <nav className="nav-links" aria-label="Primary">
          {links.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${page === item.id ? "is-active" : ""}`}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="nav-actions">
          <ZoomToggle zoom={zoom} onCycleZoom={onCycleZoom} />
          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
          {!isAuthenticated ? (
            <>
              <button className="btn btn-ghost" onClick={() => onOpenAuth("signin")}>
                Sign In
              </button>
              <button className="btn btn-solid" onClick={() => onOpenAuth("signup")}>
                Start Learning
              </button>
            </>
          ) : (
            <>
              {!wallet.address ? (
                <button className="btn btn-ghost" onClick={walletModal.openModal}>
                  Connect Wallet
                </button>
              ) : null}
              <ProfileMenu
                account={account}
                wallet={wallet}
                onUpdateAvatar={profile?.onUpdateAvatar}
                onChangePassword={profile?.onChangePassword}
                onSetPassword={profile?.onSetPassword}
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
export { LOGGED_OUT_LINKS, LOGGED_IN_LINKS, BrandMark, ThemeToggle, ZoomToggle };
