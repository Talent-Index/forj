import { useState, useCallback, useEffect } from "react";
import { useWallet } from "./hooks/useWallet";
import { useTheme } from "./hooks/useTheme";
import { useWalletModal } from "./hooks/useWalletModal";
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
import forgeCertificate from "./assets/forge-certificate.png";
import {
  PROGRESS_VIEWS,
  applySectionResult,
  clearProgress,
  emptyProgress,
  loadProgress,
  normalizeAddress,
  saveProgress,
} from "./utils/progress";
import { redeemPiece } from "./utils/puzzle";
import {
  EMPTY_STATES,
  dismissFirstRunGuide,
  firstRunStatus,
  isFirstRunGuideDismissed,
} from "./utils/onboarding";

const VIEWS = PROGRESS_VIEWS;

function App() {
  const wallet = useWallet();
  const theme = useTheme();
  const { closeModal, openModal, open } = useWalletModal();
  const walletModal = { open, openModal, closeModal };
  const [page, setPage] = useState("landing");
  const [view, setView] = useState(VIEWS.SECTIONS);
  const [activeSection, setActiveSection] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [spentPoints, setSpentPoints] = useState(0);
  const [acquiredPieces, setAcquiredPieces] = useState([]);
  const [sectionScores, setSectionScores] = useState({});
  const [completedSections, setCompletedSections] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [recipientName, setRecipientName] = useState("");
  const [hydratedAddress, setHydratedAddress] = useState(null);
  const [guideDismissed, setGuideDismissed] = useState(false);
  const userImage = forgeCertificate;
  const currentAddress = normalizeAddress(wallet.address);
  const progressReady = Boolean(currentAddress && hydratedAddress === currentAddress);

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
    if (!currentAddress) {
      setHydratedAddress(null);
      applyProgress(emptyProgress());
      setPage((current) => (current === "about" || current === "landing" ? current : "landing"));
      return;
    }
    applyProgress(loadProgress(currentAddress));
    setHydratedAddress(currentAddress);
    setGuideDismissed(isFirstRunGuideDismissed(currentAddress));
    setPage((current) => (current === "landing" ? "learn" : current));
    closeModal();
  }, [applyProgress, currentAddress, closeModal]);

  useEffect(() => {
    if (!progressReady) return;
    saveProgress(currentAddress, {
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
    currentAddress,
    progressReady,
    recipientName,
    sectionScores,
    spentPoints,
    totalPoints,
    view,
  ]);

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
    if (currentAddress) clearProgress(currentAddress);
    applyProgress(emptyProgress());
    setView(VIEWS.SECTIONS);
    setPage("learn");
  }, [applyProgress, currentAddress]);

  const goLearnHome = useCallback(() => {
    setView(VIEWS.SECTIONS);
    setActiveSection(null);
    setPage("learn");
  }, []);

  function handleNavigate(nextPage) {
    if (nextPage === "landing") {
      setPage(wallet.isConnected ? "learn" : "landing");
      return;
    }
    if (!wallet.isConnected && (nextPage === "learn" || nextPage === "progress" || nextPage === "credentials" || nextPage === "settings")) {
      openModal();
      setPage("landing");
      return;
    }
    if (nextPage === "learn") {
      setView(VIEWS.SECTIONS);
      setActiveSection(null);
    }
    setPage(nextPage);
  }

  const restoring = wallet.restoring || (wallet.isConnected && !progressReady);

  function renderContent() {
    if (restoring) {
      return (
        <EmptyState
          title={EMPTY_STATES.restoring.title}
          body={EMPTY_STATES.restoring.body}
        />
      );
    }
    if (page === "about") return <AboutPage />;
    if (!wallet.isConnected || page === "landing") {
      return (
        <Landing
          onStart={() => openModal()}
          onExplore={() => {
            const el = document.getElementById("how-it-works");
            el?.scrollIntoView({ behavior: theme.reducedMotion ? "auto" : "smooth" });
          }}
        />
      );
    }
    if (page === "settings") {
      return (
        <SettingsPage
          address={wallet.address}
          isFuji={wallet.isFuji}
          theme={theme.theme}
          onToggleTheme={theme.toggleTheme}
          reducedMotion={theme.reducedMotion}
          onToggleMotion={theme.setReducedMotion}
          onReset={handleFullReset}
          onDisconnect={wallet.disconnect}
        />
      );
    }
    if (!wallet.isFuji) {
      return (
        <NetworkGate
          chainId={wallet.chainId}
          switching={wallet.switching}
          error={wallet.error}
          onSwitch={() => wallet.switchToFuji().catch(() => {})}
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
        />
      );
    }
    if (page === "credentials") {
      return (
        <Certificate
          address={wallet.address}
          totalPoints={totalPoints}
          acquiredPieces={acquiredPieces}
          sectionScores={sectionScores}
          recipientName={recipientName}
          onRecipientName={setRecipientName}
          getWalletClient={wallet.getWalletClient}
          publicClient={wallet.publicClient}
          switchToFuji={wallet.switchToFuji}
          onRetry={handleFullReset}
          userImage={userImage}
        />
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
              isConnected: wallet.isConnected,
              isFuji: wallet.isFuji,
              completedSections,
              acquiredPieces,
            })}
            onStartEasy={() => startSection("easy")}
            onDismiss={() => {
              dismissFirstRunGuide(currentAddress);
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
    <AppShell
      page={page === "landing" ? "learn" : page}
      onNavigate={handleNavigate}
      isConnected={wallet.isConnected}
      wallet={wallet}
      theme={theme.theme}
      onToggleTheme={theme.toggleTheme}
      walletModal={walletModal}
    >
      {renderContent()}
    </AppShell>
  );
}

export default App;
