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
  applySectionResult,
  clearProgress,
  loadProgress,
  saveProgress,
} from "./utils/progress";

const VIEWS = {
  SECTIONS: "sections",
  QUIZ: "quiz",
  PUZZLE: "puzzle",
  CERTIFICATE: "certificate",
};

const EMPTY_PROGRESS = {
  view: VIEWS.SECTIONS,
  activeSection: null,
  totalPoints: 0,
  spentPoints: 0,
  acquiredPieces: [],
  sectionScores: {},
  completedSections: [],
  attempts: [],
};

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
  const userImage = puzzleImage;

  useEffect(() => {
    if (!wallet.address) return;
    const saved = loadProgress(wallet.address);
    if (!saved) {
      setView(VIEWS.SECTIONS);
      setActiveSection(null);
      setTotalPoints(0);
      setSpentPoints(0);
      setAcquiredPieces([]);
      setSectionScores({});
      setCompletedSections([]);
      setAttempts([]);
      return;
    }

    setView(saved.view || VIEWS.SECTIONS);
    setActiveSection(saved.activeSection || null);
    setSectionScores(saved.sectionScores || {});
    setTotalPoints(saved.totalPoints || 0);
    setSpentPoints(saved.spentPoints || 0);
    setAcquiredPieces(saved.acquiredPieces || []);
    setCompletedSections(saved.completedSections || []);
    setAttempts(saved.attempts || []);
  }, [wallet.address]);

  useEffect(() => {
    if (!wallet.address) return;
    saveProgress(wallet.address, {
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
    wallet.address,
    view,
    activeSection,
    totalPoints,
    spentPoints,
    acquiredPieces,
    sectionScores,
    completedSections,
    attempts,
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
    setAcquiredPieces((prev) => [...prev, index]);
    setSpentPoints((prev) => prev + PIECE_COST);
  }, []);

  const handleFullReset = useCallback(() => {
    if (wallet.address) clearProgress(wallet.address);
    setView(EMPTY_PROGRESS.view);
    setActiveSection(EMPTY_PROGRESS.activeSection);
    setTotalPoints(EMPTY_PROGRESS.totalPoints);
    setSpentPoints(EMPTY_PROGRESS.spentPoints);
    setAcquiredPieces(EMPTY_PROGRESS.acquiredPieces);
    setSectionScores(EMPTY_PROGRESS.sectionScores);
    setCompletedSections(EMPTY_PROGRESS.completedSections);
    setAttempts(EMPTY_PROGRESS.attempts);
  }, [wallet.address]);

  if (wallet.restoring) {
    return (
      <div className="landing">
        <section className="landing-hero">
          <p className="landing-subtitle">Restoring wallet session…</p>
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
