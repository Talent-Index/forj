import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileNav from "./MobileNav";

function AppShell({
  page,
  onNavigate,
  isConnected,
  wallet,
  theme,
  onToggleTheme,
  walletModal,
  children,
}) {
  return (
    <div className={`shell ${isConnected ? "shell-auth" : ""}`}>
      <Navbar
        page={page}
        onNavigate={onNavigate}
        isConnected={isConnected}
        wallet={wallet}
        theme={theme}
        onToggleTheme={onToggleTheme}
        walletModal={walletModal}
      />
      <main className="shell-main">{children}</main>
      <Footer />
      <MobileNav page={page} onNavigate={onNavigate} isConnected={isConnected} />
    </div>
  );
}

export default AppShell;
