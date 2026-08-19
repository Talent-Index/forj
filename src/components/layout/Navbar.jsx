import { WalletButton, WalletModal } from "../wallet/WalletControls";

const NAV_ITEMS = [
  { id: "learn", label: "Learn" },
  { id: "progress", label: "Progress" },
  { id: "credentials", label: "Credentials" },
  { id: "lookup", label: "Lookup" },
  { id: "about", label: "About" },
];

function Navbar({
  page,
  onNavigate,
  isConnected,
  wallet,
  theme,
  onToggleTheme,
  walletModal,
}) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <button className="wordmark" onClick={() => onNavigate(isConnected ? "learn" : "landing")}>
          SkillForge
        </button>
        <nav className="nav-links" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${page === item.id ? "active" : ""}`}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="nav-actions">
          <button
            className="btn btn-ghost btn-icon"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <WalletButton
            address={wallet.address}
            connecting={wallet.connecting}
            switching={wallet.switching}
            chainId={wallet.chainId}
            isFuji={wallet.isFuji}
            walletName={wallet.walletName}
            onDisconnect={wallet.disconnect}
            onSwitch={() => wallet.switchToFuji().catch(() => {})}
            onOpen={walletModal.openModal}
          />
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
export { NAV_ITEMS };
