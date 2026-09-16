import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileNav from "./MobileNav";
import { PageDoodles } from "../doodles";

/** Dense atmospheric field for every signed-in (and guest non-landing) page. */
const PAGE_DOODLE_COUNT = 128;
const PAGE_DOODLE_ANIMATE = 14;

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
        {!isLanding ? (
          <PageDoodles
            page={page}
            count={PAGE_DOODLE_COUNT}
            animate
            animateCount={PAGE_DOODLE_ANIMATE}
          />
        ) : null}
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
