import { useState, useCallback, useEffect } from "react";
import { useWallet } from "./hooks/useWallet";
import WalletConnect from "./components/WalletConnect";
import SectionSelect from "./components/SectionSelect";
import Quiz from "./components/Quiz";
import PuzzleBoard from "./components/PuzzleBoard";
import Certificate from "./components/Certificate";
import Dashboard from "./components/Dashboard";
import Achievements from "./components/Achievements";
import Landing from "./components/Landing";
import NetworkGate from "./components/NetworkGate";
import { PIECE_COST } from "./data/questions";
import puzzleImage from "../images.jpeg";
import {
  PROGRESS_VIEWS,
  applySectionResult,
  clearProgress,
  emptyProgress,
  loadProgress,
  normalizeAddress,
  saveProgress,
} from "./utils/progress";

const VIEWS = PROGRESS_VIEWS;

function App() {
  const wallet = useWallet();
  const [view, setView] = useState(VIEWS.SECTIONS);
  const [activeSection, setActiveSection] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [spentPoints, setSpentPoints] = useState(0);
  const [acquiredPieces, setAcquiredPieces] = useState([]);
  const [sectionScores, setSectionScores] = useState({});
  const [completedSections, setCompletedSections] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [hydratedAddress, setHydratedAddress] = useState(null);
  const userImage = puzzleImage;
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
  }, []);

  useEffect(() => {
    if (!currentAddress) {
      setHydratedAddress(null);
      applyProgress(emptyProgress());
      return;
    }
    applyProgress(loadProgress(currentAddress));
    setHydratedAddress(currentAddress);
  }, [applyProgress, currentAddress]);

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
    });
  }, [
    activeSection,
    acquiredPieces,
    attempts,
    completedSections,
    currentAddress,
    progressReady,
    sectionScores,
    spentPoints,
    totalPoints,
    view,
  ]);

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
    setView(VIEWS.SECTIONS);
    setActiveSection(null);
  }, []);

  const handleAcquirePiece = useCallback((index) => {
    setAcquiredPieces((prev) => {
      if (prev.includes(index)) return prev;
      const next = [...prev, index];
      setSpentPoints(next.length * PIECE_COST);
      return next;
    });
  }, []);

  const handleFullReset = useCallback(() => {
    if (currentAddress) clearProgress(currentAddress);
    applyProgress(emptyProgress());
  }, [applyProgress, currentAddress]);

  if (wallet.restoring || (wallet.isConnected && !progressReady)) {
    return (
      <div className="landing">
        <section className="landing-hero">
          <p className="landing-subtitle">Restoring your progress…</p>
        </section>
      </div>
    );
  }

  if (!wallet.isConnected) {
    return <Landing wallet={wallet} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏔️ SkillForge</h1>
        <p className="tagline">
          Learn <span>Avalanche</span>. Earn Credentials.
        </p>
        <WalletConnect
          address={wallet.address}
          connecting={wallet.connecting}
          switching={wallet.switching}
          error={wallet.error}
          chainId={wallet.chainId}
          isFuji={wallet.isFuji}
          walletName={wallet.walletName}
          available={wallet.available}
          isMobile={wallet.isMobile}
          onConnect={wallet.connect}
          onDisconnect={wallet.disconnect}
          onSwitch={() => wallet.switchToFuji().catch(() => {})}
        />
      </header>

      {!wallet.isFuji && (
        <NetworkGate
          chainId={wallet.chainId}
          switching={wallet.switching}
          error={wallet.error}
          onSwitch={() => wallet.switchToFuji().catch(() => {})}
        />
      )}

      {wallet.isFuji && view === VIEWS.SECTIONS && (
        <SectionSelect
          sectionScores={sectionScores}
          totalPoints={totalPoints}
          completedSections={completedSections}
          onSelectSection={(id) => {
            setActiveSection(id);
            setView(VIEWS.QUIZ);
          }}
          onGoToPuzzle={() => setView(VIEWS.PUZZLE)}
        />
      )}

      {wallet.isFuji && view === VIEWS.QUIZ && activeSection && (
        <Quiz
          sectionId={activeSection}
          onComplete={handleQuizComplete}
          onBack={() => {
            setView(VIEWS.SECTIONS);
            setActiveSection(null);
          }}
        />
      )}

      {wallet.isFuji && view === VIEWS.PUZZLE && (
        <PuzzleBoard
          totalPoints={totalPoints}
          spentPoints={spentPoints}
          acquiredPieces={acquiredPieces}
          onAcquirePiece={handleAcquirePiece}
          onContinue={() => setView(VIEWS.CERTIFICATE)}
          onBack={() => setView(VIEWS.SECTIONS)}
          userImage={userImage}
        />
      )}

      {wallet.isFuji && view === VIEWS.CERTIFICATE && (
        <>
          <Certificate
            address={wallet.address}
            totalPoints={totalPoints}
            acquiredPieces={acquiredPieces}
            sectionScores={sectionScores}
            getWalletClient={wallet.getWalletClient}
            publicClient={wallet.publicClient}
            switchToFuji={wallet.switchToFuji}
            onRetry={handleFullReset}
            userImage={userImage}
          />
          <Dashboard
            attempts={attempts}
            totalPoints={totalPoints}
            acquiredPieces={acquiredPieces}
          />
          <Achievements
            sectionScores={sectionScores}
            acquiredPieces={acquiredPieces}
            attempts={attempts}
          />
        </>
      )}
    </div>
  );
}

export default App;
