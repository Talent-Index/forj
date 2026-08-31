import { useState, useCallback, useEffect, useRef } from "react";
import { useWallet } from "./hooks/useWallet";
import { useTheme } from "./hooks/useTheme";
import { useZoom } from "./hooks/useZoom";
import { useWalletModal } from "./hooks/useWalletModal";
import { useAuth } from "./hooks/useAuth";
import { useProgression } from "./hooks/useProgression";
import AppShell from "./components/layout/AppShell";
import Quiz from "./components/Quiz";
import PuzzleBoard from "./components/PuzzleBoard";
import Certificate from "./components/Certificate";
import Landing from "./components/Landing";
import NetworkGate from "./components/NetworkGate";
import EmptyState from "./components/EmptyState";
import AboutPage from "./components/pages/AboutPage";
import SettingsPage from "./components/pages/SettingsPage";
import ProgressPage from "./components/pages/ProgressPage";
import LearnPage from "./components/pages/LearnPage";
import LeaderboardPage from "./components/pages/LeaderboardPage";
import CredentialLookupPage from "./components/pages/CredentialLookupPage";
import AuthModal, { ProfileSetup } from "./components/auth/AuthModal";
import LegalPage from "./components/pages/LegalPage";
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
import { EMPTY_STATES } from "./utils/onboarding";
import { legalPageFromPath } from "./utils/legal";
import {
  parseCredentialLocation,
  parseLookupQuery,
  publicCredentialPath,
} from "./utils/credentialLookup";
import { migrateAndHydrate } from "./utils/backend/migrate";
import { writeQuizProgress } from "./utils/backend/progressSync";

const VIEWS = PROGRESS_VIEWS;
const PUBLIC_PAGES = new Set(["landing", "about", "lookup", "privacy", "terms"]);

function pageFromLocation() {
  if (typeof window === "undefined") return "landing";
  const legal = legalPageFromPath(window.location.pathname);
  if (legal) return legal;
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
  const { linkWallet, verifyEmail } = auth;
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
  const [authOpen, setAuthOpen] = useState(false);
  const [authView, setAuthView] = useState("signup");
  const [authOobCode, setAuthOobCode] = useState("");
  const [authBanner, setAuthBanner] = useState("");
  const [onboardError, setOnboardError] = useState("");
  const [onboardBusy, setOnboardBusy] = useState(false);
  const [locationKey, setLocationKey] = useState(() =>
    typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`
  );
  const authActionHandled = useRef(false);
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
  }, { ready: progressReady, displayName: account?.name || "" });

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
      return undefined;
    }
    let cancelled = false;
    (async () => {
      let snapshot = loadProgress(ownerId);
      if (isEmptyProgress(snapshot) && wallet.address) {
        const fromWallet = loadProgress(wallet.address);
        if (!isEmptyProgress(fromWallet)) {
          saveProgress(ownerId, fromWallet);
          snapshot = fromWallet;
        }
      }
      if (auth.user) {
        try {
          const hydrated = await migrateAndHydrate(auth.user, snapshot);
          if (!cancelled && hydrated?.quiz) snapshot = hydrated.quiz;
        } catch {
          // Keep the local snapshot if backend sync is unavailable.
        }
      }
      if (cancelled) return;
      applyProgress(snapshot);
      setHydratedOwner(ownerId);
      if (snapshot.recipientName === "" && account?.name) {
        setRecipientName(account.name);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [account?.name, applyProgress, auth.user, ownerId, wallet.address]);

  useEffect(() => {
    if (!progressReady) return;
    const snapshot = {
      view,
      activeSection,
      totalPoints,
      spentPoints,
      acquiredPieces,
      sectionScores,
      completedSections,
      attempts,
      recipientName,
    };
    saveProgress(ownerId, snapshot);
    writeQuizProgress(ownerId, snapshot).catch(() => {});
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
    if (account?.id && wallet.address && account.walletAddress !== wallet.address) {
      linkWallet(wallet.address);
    }
  }, [account?.id, account?.walletAddress, linkWallet, wallet.address]);

  useEffect(() => {
    if (wallet.address && open) closeModal();
  }, [closeModal, open, wallet.address]);

  const goLearnHome = useCallback(() => {
    setView(VIEWS.SECTIONS);
    setActiveSection(null);
    setPage("learn");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || authActionHandled.current) return undefined;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode") || params.get("verifyEmail") || params.get("reset") || "";
    if (!mode && !params.get("verifyEmail") && !params.get("reset") && !params.get("oobCode")) {
      return undefined;
    }
    authActionHandled.current = true;
    if ((mode === "verifyEmail" || params.get("verifyEmail")) && oobCode) {
      setAuthOobCode(oobCode);
      setAuthView("verify");
      setAuthOpen(true);
      setAuthBanner("Confirming your email…");
      void verifyEmail(oobCode).then((result) => {
        if (!result?.ok) {
          setAuthBanner(result?.error || "Could not verify that link. Try resending the email.");
          setAuthView("verify");
          setAuthOpen(true);
          return;
        }
        if (result.signedIn && result.account?.emailVerified) {
          setAuthBanner(result.message || "Email verified.");
          setAuthOpen(false);
          goLearnHome();
          return;
        }
        setAuthBanner(result.message || "Email verified. Sign in to continue.");
        setAuthView("signin");
        setAuthOpen(true);
      });
    } else if (mode === "resetPassword" || params.get("reset")) {
      setAuthOobCode(oobCode);
      setAuthView("reset");
      setAuthBanner("Choose a new password for your account.");
      setAuthOpen(true);
    }
    ["mode", "oobCode", "apiKey", "lang", "verifyEmail", "reset"].forEach((key) => params.delete(key));
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
    window.history.replaceState({}, "", next);
    return undefined;
  }, [goLearnHome, verifyEmail]);

  const startSection = useCallback((id) => {
    setActiveSection(id);
    setView(VIEWS.QUIZ);
    setPage("learn");
    progression.startQuiz(id);
  }, [progression]);

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
  }, [progression]);

  const handleAcquirePiece = useCallback((index) => {
    setAcquiredPieces((prev) => {
      const result = redeemPiece({ totalPoints, acquiredPieces: prev }, index);
      if (!result.ok) return prev;
      setSpentPoints(result.spentPoints);
      progression.unlockPiece(index);
      return result.acquiredPieces;
    });
  }, [progression, totalPoints]);

  const handleFullReset = useCallback(() => {
    if (ownerId) {
      clearProgress(ownerId);
      progression.clear();
    }
    applyProgress(emptyProgress());
    setView(VIEWS.SECTIONS);
    setPage("learn");
  }, [applyProgress, ownerId, progression]);

  useEffect(() => {
    if (isAuthenticated && page === "landing") goLearnHome();
  }, [goLearnHome, isAuthenticated, page]);

  // Always dismiss the auth dialog once the learner is verified/signed in.
  useEffect(() => {
    if (!isAuthenticated || !authOpen) return;
    setAuthOpen(false);
    setAuthBanner("");
    setAuthOobCode("");
  }, [authOpen, isAuthenticated]);

  const openLookup = useCallback((tokenId = "", walletAddress = "") => {
    const href = publicCredentialPath({ tokenId, wallet: walletAddress });
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", href);
      setLocationKey(`${window.location.pathname}${window.location.search}`);
    }
    setPage("lookup");
  }, []);

  function openAuth(nextView = "signup") {
    setAuthBanner("");
    setAuthView(nextView);
    setAuthOpen(true);
  }

  function closeAuth() {
    setAuthOpen(false);
    setAuthBanner("");
  }

  function finishAuth() {
    setAuthOpen(false);
    setAuthBanner("");
    setAuthOobCode("");
    if (PUBLIC_PAGES.has(page) && page !== "landing") return;
    goLearnHome();
  }

  function openLegal(topic) {
    setAuthOpen(false);
    const path = topic === "terms" ? "/terms" : "/privacy";
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", path);
      setLocationKey(path);
    }
    setPage(topic === "terms" ? "terms" : "privacy");
  }

  useEffect(() => {
    function onPop() {
      setLocationKey(`${window.location.pathname}${window.location.search}`);
      const legal = legalPageFromPath(window.location.pathname);
      if (legal) {
        setPage(legal);
        return;
      }
      const location = parseCredentialLocation(window.location.pathname, window.location.search);
      if (location.isPublicRoute || location.tokenId || location.wallet) setPage("lookup");
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function handleNavigate(nextPage) {
    if (typeof window !== "undefined" && (nextPage === "privacy" || nextPage === "terms")) {
      const path = nextPage === "terms" ? "/terms" : "/privacy";
      window.history.pushState({}, "", path);
      setLocationKey(path);
      setPage(nextPage);
      return;
    }
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
      if (nextPage === "progress" || nextPage === "settings" || nextPage === "leaderboard") {
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
    if (onboardBusy) return;
    setOnboardError("");
    setOnboardBusy(true);
    try {
      const result = await auth.completeProfile(input);
      if (!result.ok) setOnboardError(result.error || "Could not save your name.");
    } catch (error) {
      setOnboardError(error.message || "Could not save your name.");
    } finally {
      setOnboardBusy(false);
    }
  }

  function renderAppContent() {
    if (page === "privacy") return <LegalPage topic="privacy" />;
    if (page === "terms") return <LegalPage topic="terms" />;
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
          signedIn={isAuthenticated}
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
          busy={onboardBusy}
          error={onboardError}
          onContinue={handleProfileContinue}
        />
      );
    }
    if (page === "settings") {
      return (
        <SettingsPage
          account={account}
          address={wallet.address}
          isFuji={wallet.isFuji}
          walletName={wallet.walletName}
          lastWalletId={wallet.lastWalletId}
          walletAvailable={wallet.available}
          theme={theme.theme}
          onToggleTheme={theme.toggleTheme}
          zoom={zoom.zoom}
          onCycleZoom={zoom.cycleZoom}
          reducedMotion={theme.reducedMotion}
          onToggleMotion={theme.setReducedMotion}
          onReset={handleFullReset}
          onConnectWallet={openModal}
          onReconnectWallet={() => wallet.connect(wallet.lastWalletId)}
          onDisconnectWallet={() => {
            wallet.disconnect();
            auth.unlinkWallet();
          }}
          onSignOut={() => {
            auth.signOut();
            setPage("landing");
          }}
          onDeleteAccount={async () => {
            const result = await auth.deleteAccount();
            if (result.ok) setPage("landing");
            return result;
          }}
          onUpdateAvatar={auth.updateAvatar}
          onChangePassword={auth.changePassword}
          onSetPassword={auth.setPassword}
          onUpdateProfile={auth.updateProfile}
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
          progression={progression}
        />
      );
    }
    if (page === "leaderboard") {
      return (
        <LeaderboardPage
          learnerId={ownerId}
          progression={progression}
          onToggleOptIn={(optIn) => progression.setLeaderboardPreference({
            optIn,
            displayName: account?.name || progression.state?.leaderboard?.displayName || "Learner",
          })}
          onLearn={goLearnHome}
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
            onClaimed={progression.claimCredential}
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
      <LearnPage
        progression={progression}
        sectionScores={sectionScores}
        totalPoints={totalPoints}
        completedSections={completedSections}
        onSelectSection={startSection}
        onGoToPuzzle={() => setView(VIEWS.PUZZLE)}
        onCompleteLesson={progression.completeLesson}
      />
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
        {progression.feedback?.length > 0 && (
          <div className="feedback-banner" role="status">
            {progression.feedback.slice(0, 3).map((item, index) => (
              <p key={`${item.kind}-${index}`}>
                {item.kind === "xp" && `+${item.amount} XP`}
                {item.kind === "level-up" && `Level ${item.level}`}
                {item.kind === "achievement" && `Achievement: ${item.name}`}
                {item.kind === "unlock" && `Unlocked ${item.scope}`}
                {item.kind === "streak-milestone" && `${item.days}-day streak`}
                {item.kind === "puzzle-complete" && "Puzzle complete"}
              </p>
            ))}
            <button type="button" className="btn btn-ghost" onClick={progression.clearFeedback}>Dismiss</button>
          </div>
        )}
        {renderAppContent()}
      </AppShell>
      <AuthModal
        open={authOpen}
        view={authView}
        onChangeView={(next) => {
          setAuthBanner("");
          setAuthView(next);
        }}
        onClose={closeAuth}
        onSuccess={finishAuth}
        auth={auth}
        pendingEmail={account?.email}
        oobCode={authOobCode}
        banner={authBanner}
        onOpenLegal={openLegal}
      />
    </>
  );
}

export default App;
