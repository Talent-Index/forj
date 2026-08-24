import { WalletModal } from "../wallet/WalletControls";
import { shortAddress } from "../../utils/learnerStats";

const LOGGED_OUT_LINKS = [
  { id: "learn", label: "Learn" },
  { id: "credentials", label: "Credentials" },
  { id: "about", label: "About" },
];

const LOGGED_IN_LINKS = [
  { id: "learn", label: "Learn" },
  { id: "progress", label: "Progress" },
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

function Navbar({
  page,
  onNavigate,
  isAuthenticated,
  account,
  wallet,
  theme,
  onToggleTheme,
  walletModal,
  onOpenAuth,
}) {
  const links = isAuthenticated ? LOGGED_IN_LINKS : LOGGED_OUT_LINKS;
  const identity = wallet.address
    ? shortAddress(wallet.address)
    : account?.name || account?.email || "Profile";

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
          <button
            className="btn btn-ghost"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            Design
          </button>
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
              <button className="nav-identity" onClick={() => onNavigate("settings")}>
                {identity}
              </button>
              {!wallet.address ? (
                <button className="btn btn-ghost" onClick={walletModal.openModal}>
                  Connect Wallet
                </button>
              ) : null}
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
        onConnect={(id) => wallet.connect(id)}
      />
    </header>
  );
}

export default Navbar;
export { LOGGED_OUT_LINKS, LOGGED_IN_LINKS, BrandMark };
