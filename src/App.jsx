import { useState, useCallback, useEffect, useRef } from "react";
import { useWallet } from "./hooks/useWallet";
import { useTheme } from "./hooks/useTheme";
import { useZoom } from "./hooks/useZoom";
import { useWalletModal } from "./hooks/useWalletModal";
import { useAuth } from "./hooks/useAuth";
import { useProgression } from "./hooks/useProgression";
import AppShell from "./components/layout/AppShell";
import SectionSelect from "./components/SectionSelect";
import Quiz from "./components/Quiz";
import PuzzleBoard from "./components/PuzzleBoard";
import Certificate from "./components/Certificate";
import Landing from "./components/Landing";
import NetworkGate from "./components/NetworkGate";
import FirstRunGuide from "./components/FirstRunGuide";
import EmptyState from "./components/EmptyState";
import AboutPage from "./components/pages/AboutPage";
import SettingsPage from "./components/pages/SettingsPage";
import ProgressPage from "./components/pages/ProgressPage";
import LearnPage from "./components/pages/LearnPage";
import LeaderboardPage from "./components/pages/LeaderboardPage";
import CredentialLookupPage from "./components/pages/CredentialLookupPage";
import AuthModal, { ProfileSetup, WalletOptional } from "./components/auth/AuthModal";
import forgeCertificate from "./assets/forge-certificate.jpg";
import {
  PROGRESS_VIEWS,
  applySectionResult,
  clearProgress,
  emptyProgress,
  isEmptyProgress,
  loadProgress,
  saveProgress,
} from "./utils/progress";
import { redeemPiece } from "./utils/puzzle";
import {
  EMPTY_STATES,
  dismissFirstRunGuide,
  firstRunStatus,
  isFirstRunGuideDismissed,
} from "./utils/onboarding";
import {
  parseCredentialLocation,
  parseLookupQuery,
  publicCredentialPath,
} from "./utils/credentialLookup";

const VIEWS = PROGRESS_VIEWS;
const PUBLIC_PAGES = new Set(["landing", "about", "lookup"]);

function pageFromLocation() {
  if (typeof window === "undefined") return "landing";
  const location = parseCredentialLocation(window.location.pathname, window.location.search);
  if (location.isPublicRoute || location.tokenId || location.wallet) return "lookup";
  return "landing";
}

function scrollToId(id, reducedMotion) {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
}

function App() {
  const auth = useAuth();
  const wallet = useWallet();
  const theme = useTheme();
  const zoom = useZoom();
  const { closeModal, openModal, open } = useWalletModal();
  const walletModal = { open, openModal, closeModal };
  const [page, setPage] = useState(pageFromLocation);
  const [view, setView] = useState(VIEWS.SECTIONS);
  const [activeSection, setActiveSection] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [spentPoints, setSpentPoints] = useState(0);
  const [acquiredPieces, setAcquiredPieces] = useState([]);
  const [sectionScores, setSectionScores] = useState({});
  const [completedSections, setCompletedSections] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [recipientName, setRecipientName] = useState("");
  const [hydratedOwner, setHydratedOwner] = useState(null);
  const [guideDismissed, setGuideDismissed] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authView, setAuthView] = useState("signup");
  const [onboardError, setOnboardError] = useState("");
  const [locationKey, setLocationKey] = useState(() =>
    typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`
  );
  const reconnectAttempted = useRef(false);
  const userImage = forgeCertificate;
  const account = auth.account;
  const ownerId = account?.id || null;
  const isAuthenticated = Boolean(account?.emailVerified);
  const progressReady = Boolean(ownerId && hydratedOwner === ownerId);
  const stage = auth.stage;
  const progression = useProgression(ownerId, {
    sectionScores,
    acquiredPieces,
    attempts,
  }, { ready: progressReady });

  const applyProgress = useCallback((snapshot) => {
    const next = snapshot || emptyProgress();
    setView(next.view);
    setActiveSection(next.activeSection);
    setTotalPoints(next.totalPoints);
    setSpentPoints(next.spentPoints);
    setAcquiredPieces(next.acquiredPieces);
    setSectionScores(next.sectionScores);
    setCompletedSections(next.completedSections);
    setAttempts(next.attempts);
    setRecipientName(next.recipientName || "");
  }, []);

  useEffect(() => {
    if (!ownerId) {
      setHydratedOwner(null);
      applyProgress(emptyProgress());
      setPage((current) => (PUBLIC_PAGES.has(current) ? current : "landing"));
      return;
    }
    let snapshot = loadProgress(ownerId);
    if (isEmptyProgress(snapshot) && wallet.address) {
      const fromWallet = loadProgress(wallet.address);
      if (!isEmptyProgress(fromWallet)) {
        saveProgress(ownerId, fromWallet);
        snapshot = fromWallet;
      }
    }
    applyProgress(snapshot);
    setHydratedOwner(ownerId);
    setGuideDismissed(isFirstRunGuideDismissed(ownerId));
    if (snapshot.recipientName === "" && account?.name) {
      setRecipientName(account.name);
    }
  }, [account?.name, applyProgress, ownerId, wallet.address]);

  useEffect(() => {
    if (!progressReady) return;
    saveProgress(ownerId, {
      view,
      activeSection,
      totalPoints,
      spentPoints,
      acquiredPieces,
      sectionScores,
      completedSections,
      attempts,
      recipientName,
    });
  }, [
    activeSection,
    acquiredPieces,
    attempts,
    completedSections,
    ownerId,
    progressReady,
    recipientName,
    sectionScores,
    spentPoints,
    totalPoints,
    view,
  ]);

  useEffect(() => {
    if (account && wallet.address && account.walletAddress !== wallet.address) {
      auth.linkWallet(wallet.address);
    }
  }, [account, auth, wallet.address]);

  useEffect(() => {
    if (!isAuthenticated) {
      reconnectAttempted.current = false;
      return;
    }
    if (reconnectAttempted.current || wallet.address || wallet.restoring || wallet.connecting) return;
    const lastId = wallet.lastWalletId;
    if (!lastId || !wallet.available?.[lastId]) return;
    reconnectAttempted.current = true;
    wallet.connect(lastId);
  }, [isAuthenticated, wallet]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get("verifyEmail");
    const resetToken = params.get("reset");
    if (verifyToken) {
      auth.verifyEmail(verifyToken);
      params.delete("verifyEmail");
      window.history.replaceState({}, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
    } else if (resetToken) {
      setAuthView("reset");
      setAuthOpen(true);
    }
    return undefined;
  }, [auth]);

  const startSection = useCallback((id) => {
    setActiveSection(id);
    setView(VIEWS.QUIZ);
    setPage("learn");
  }, []);

  const handleQuizComplete = useCallback((result) => {
    setSectionScores((prev) => {
      const next = applySectionResult(prev, result);
      setTotalPoints(next.totalPoints);
      return next.sectionScores;
    });
    setCompletedSections((prev) =>
      prev.includes(result.sectionId) ? prev : [...prev, result.sectionId]
    );
    setAttempts((prev) => [...prev, result]);
    progression.completeQuiz(result);
  }, []);

  const handleAcquirePiece = useCallback((index) => {
    setAcquiredPieces((prev) => {
      const result = redeemPiece({ totalPoints, acquiredPieces: prev }, index);
      if (!result.ok) return prev;
      setSpentPoints(result.spentPoints);
      return result.acquiredPieces;
    });
  }, [totalPoints]);

  const handleFullReset = useCallback(() => {
    if (ownerId) clearProgress(ownerId);
    applyProgress(emptyProgress());
    setView(VIEWS.SECTIONS);
    setPage("learn");
  }, [applyProgress, ownerId]);

  const goLearnHome = useCallback(() => {
    setView(VIEWS.SECTIONS);
    setActiveSection(null);
    setPage("learn");
  }, []);

  const openLookup = useCallback((tokenId = "", walletAddress = "") => {
    const href = publicCredentialPath({ tokenId, wallet: walletAddress });
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", href);
      setLocationKey(`${window.location.pathname}${window.location.search}`);
    }
    setPage("lookup");
  }, []);

  function openAuth(nextView = "signup") {
    setAuthView(nextView);
    setAuthOpen(true);
  }

  function closeAuth() {
    setAuthOpen(false);
    if (auth.account?.emailVerified && auth.stage === "profile") {
      setPage("learn");
    }
  }

  useEffect(() => {
    function onPop() {
      setLocationKey(`${window.location.pathname}${window.location.search}`);
      const location = parseCredentialLocation(window.location.pathname, window.location.search);
      if (location.isPublicRoute || location.tokenId || location.wallet) setPage("lookup");
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function handleNavigate(nextPage) {
    if (typeof window !== "undefined" && nextPage === "lookup") {
      const href = publicCredentialPath({});
      if (window.location.pathname !== "/credential" || window.location.search) {
        window.history.pushState({}, "", href);
      }
      setLocationKey(`${window.location.pathname}${window.location.search}`);
    } else if (typeof window !== "undefined") {
      const location = parseCredentialLocation(window.location.pathname, window.location.search);
      const query = parseLookupQuery(window.location.search);
      if (location.isPublicRoute || query.tokenId || query.wallet) {
        window.history.pushState({}, "", "/");
        setLocationKey("/");
      }
    }
    if (!isAuthenticated) {
      if (nextPage === "learn") {
        setPage("landing");
        requestAnimationFrame(() => scrollToId("how-it-works", theme.reducedMotion));
        return;
      }
      if (nextPage === "credentials") {
        setPage("landing");
        requestAnimationFrame(() => scrollToId("credential", theme.reducedMotion));
        return;
      }
      if (nextPage === "progress" || nextPage === "settings") {
        openAuth("signin");
        return;
      }
    }
    if (nextPage === "landing") {
      setPage("landing");
      return;
    }
    if (nextPage === "learn") {
      setView(VIEWS.SECTIONS);
      setActiveSection(null);
    }
    setPage(nextPage);
  }

  const restoring = auth.restoring || (isAuthenticated && !progressReady);

  async function handleProfileContinue(input) {
    setOnboardError("");
    const result = await auth.completeProfile(input);
    if (!result.ok) setOnboardError(result.error);
  }

  function renderAppContent() {
    if (page === "about") return <AboutPage />;
    if (page === "lookup") {
      return (
        <CredentialLookupPage
          key={locationKey}
          pathname={typeof window !== "undefined" ? window.location.pathname : "/credential"}
          search={typeof window !== "undefined" ? window.location.search : ""}
        />
      );
    }
    if (restoring) {
      return (
        <EmptyState
          title={EMPTY_STATES.restoring.title}
          body={EMPTY_STATES.restoring.body}
        />
      );
    }
    if (!isAuthenticated || page === "landing") {
      return (
        <Landing
          onStart={() => (isAuthenticated ? goLearnHome() : openAuth("signup"))}
          onSignIn={() => openAuth("signin")}
          onExploreCredentials={() => handleNavigate("lookup")}
        />
      );
    }
    if (stage === "profile") {
      return (
        <ProfileSetup
          account={account}
          error={onboardError}
          onContinue={handleProfileContinue}
        />
      );
    }
    if (stage === "wallet-optional") {
      return (
        <WalletOptional
          onConnect={() => {
            openModal();
            auth.dismissWalletPrompt();
          }}
          onSkip={() => auth.dismissWalletPrompt()}
        />
      );
    }
    if (page === "settings") {
      return (
        <SettingsPage
          account={account}
          address={wallet.address}
          isFuji={wallet.isFuji}
          theme={theme.theme}
          onToggleTheme={theme.toggleTheme}
          zoom={zoom.zoom}
          onCycleZoom={zoom.cycleZoom}
          reducedMotion={theme.reducedMotion}
          onToggleMotion={theme.setReducedMotion}
          onReset={handleFullReset}
          onConnectWallet={openModal}
          onDisconnectWallet={wallet.disconnect}
          onSignOut={() => {
            auth.signOut();
            setPage("landing");
          }}
        />
      );
    }
    if (page === "progress") {
      return (
        <ProgressPage
          address={wallet.address}
          walletName={wallet.walletName}
          chainId={wallet.chainId}
          isFuji={wallet.isFuji}
          sectionScores={sectionScores}
          totalPoints={totalPoints}
          spentPoints={spentPoints}
          acquiredPieces={acquiredPieces}
          attempts={attempts}
          publicClient={wallet.publicClient}
          onContinue={startSection}
          onLearn={goLearnHome}
          onPuzzle={() => {
            setView(VIEWS.PUZZLE);
            setPage("learn");
          }}
          onCredentials={() => setPage("credentials")}
          onLookup={openLookup}
        />
      );
    }
    if (page === "credentials") {
      return (
        <>
          {wallet.isConnected && !wallet.isFuji && (
            <NetworkGate
              chainId={wallet.chainId}
              switching={wallet.switching}
              error={wallet.error}
              onSwitch={() => wallet.switchToFuji().catch(() => {})}
            />
          )}
          <Certificate
            address={wallet.address}
            totalPoints={totalPoints}
            acquiredPieces={acquiredPieces}
            sectionScores={sectionScores}
            recipientName={recipientName || account?.name || ""}
            onRecipientName={setRecipientName}
            getWalletClient={wallet.getWalletClient}
            publicClient={wallet.publicClient}
            switchToFuji={wallet.switchToFuji}
            onRetry={handleFullReset}
            userImage={userImage}
            onLookup={openLookup}
          />
        </>
      );
    }
    if (view === VIEWS.QUIZ && activeSection) {
      return (
        <Quiz
          sectionId={activeSection}
          onComplete={handleQuizComplete}
          onBack={goLearnHome}
        />
      );
    }
    if (view === VIEWS.PUZZLE) {
      return (
        <PuzzleBoard
          totalPoints={totalPoints}
          spentPoints={spentPoints}
          acquiredPieces={acquiredPieces}
          onAcquirePiece={handleAcquirePiece}
          onContinue={() => {
            setView(VIEWS.CERTIFICATE);
            setPage("credentials");
          }}
          onBack={goLearnHome}
          userImage={userImage}
        />
      );
    }
    return (
      <>
        {!guideDismissed && (
          <FirstRunGuide
            steps={firstRunStatus({
              isAuthenticated,
              isConnected: wallet.isConnected,
              isFuji: wallet.isFuji,
              walletSkipped: Boolean(account?.walletPromptSeen && !wallet.address),
              completedSections,
              acquiredPieces,
            })}
            onStartEasy={() => startSection("easy")}
            onDismiss={() => {
              dismissFirstRunGuide(ownerId);
              setGuideDismissed(true);
            }}
          />
        )}
        <SectionSelect
          sectionScores={sectionScores}
          totalPoints={totalPoints}
          completedSections={completedSections}
          onSelectSection={startSection}
          onGoToPuzzle={() => setView(VIEWS.PUZZLE)}
        />
      </>
    );
  }

  return (
    <>
      <AppShell
        page={page}
        onNavigate={handleNavigate}
        isAuthenticated={isAuthenticated}
        account={account}
        wallet={wallet}
        theme={theme.theme}
        onToggleTheme={theme.toggleTheme}
        zoom={zoom.zoom}
        onCycleZoom={zoom.cycleZoom}
        walletModal={walletModal}
        onOpenAuth={openAuth}
        profile={{
          onUpdateAvatar: auth.updateAvatar,
          onChangePassword: auth.changePassword,
          onSetPassword: auth.setPassword,
          onDisconnectWallet: () => {
            wallet.disconnect();
            auth.unlinkWallet();
          },
          onOpenPreferences: () => handleNavigate("settings"),
          onSignOut: () => {
            auth.signOut();
            setPage("landing");
          },
        }}
      >
        {renderAppContent()}
      </AppShell>
      <AuthModal
        open={authOpen}
        view={authView}
        onChangeView={setAuthView}
        onClose={closeAuth}
        auth={auth}
        pendingEmail={account?.email}
        verificationToken={authView === "reset" ? new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("reset") || "" : ""}
      />
    </>
  );
}

export default App;
