import Navbar, { LOGGED_IN_LINKS, LOGGED_OUT_LINKS } from "./Navbar";
import Footer from "./Footer";
import MobileNav from "./MobileNav";

function AppShell({
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
  children,
}) {
  return (
    <div className={`shell ${isAuthenticated ? "shell-auth" : ""} ${page === "landing" ? "shell-landing" : ""}`}>
      <Navbar
        page={page}
        onNavigate={onNavigate}
        isAuthenticated={isAuthenticated}
        account={account}
        wallet={wallet}
        theme={theme}
        onToggleTheme={onToggleTheme}
        zoom={zoom}
        onCycleZoom={onCycleZoom}
        walletModal={walletModal}
        onOpenAuth={onOpenAuth}
      />
      <main className={`shell-main ${page === "landing" ? "is-landing" : ""}`}>{children}</main>
      <Footer onNavigate={onNavigate} />
      <MobileNav
        page={page}
        onNavigate={onNavigate}
        isAuthenticated={isAuthenticated}
        loggedInLinks={LOGGED_IN_LINKS}
        loggedOutLinks={LOGGED_OUT_LINKS}
      />
    </div>
  );
}

export default AppShell;
