import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileNav from "./MobileNav";
import { PageDoodles } from "../doodles";

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
  profile,
  children,
}) {
  const isLanding = page === "landing";
  return (
    <div className={`shell ${isAuthenticated ? "shell-auth" : ""} ${isLanding ? "shell-landing" : ""}`}>
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
        profile={profile}
      />
      <main className={`shell-main ${isLanding ? "is-landing" : ""}`}>
        {!isLanding ? <PageDoodles page={page} count={100} animate={false} /> : null}
        {children}
      </main>
      <Footer onNavigate={onNavigate} />
      <MobileNav
        page={page}
        onNavigate={onNavigate}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}

export default AppShell;
