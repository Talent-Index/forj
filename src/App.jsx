import { useState, useCallback } from "react";
import { useWallet } from "./hooks/useWallet";
import WalletConnect from "./components/WalletConnect";
import SectionSelect from "./components/SectionSelect";
import Quiz from "./components/Quiz";
import PuzzleBoard from "./components/PuzzleBoard";
import Certificate from "./components/Certificate";
import Dashboard from "./components/Dashboard";
import Achievements from "./components/Achievements";
import Landing from "./components/Landing";
import { PIECE_COST } from "./data/questions";
import puzzleImage from "../images.jpeg";

const VIEWS = {
  SECTIONS: "sections",
  QUIZ: "quiz",
  PUZZLE: "puzzle",
  CERTIFICATE: "certificate",
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
  // The puzzle uses the bundled Build Games artwork; no image upload is needed.
  const userImage = puzzleImage;

  const handleQuizComplete = useCallback((result) => {
    setSectionScores((prev) => ({
      ...prev,
      [result.sectionId]: {
        correct: result.correct,
        total: result.total,
        pointsEarned: result.pointsEarned,
      },
    }));
    setTotalPoints((prev) => prev + result.pointsEarned);
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

  const handleRetry = useCallback(() => {
    setView(VIEWS.SECTIONS);
    setActiveSection(null);
  }, []);

  const handleFullReset = useCallback(() => {
    setView(VIEWS.SECTIONS);
    setActiveSection(null);
    setTotalPoints(0);
    setSpentPoints(0);
    setAcquiredPieces([]);
    setSectionScores({});
    setCompletedSections([]);
    setAttempts([]);
  }, []);

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
          error={wallet.error}
          onConnect={wallet.connect}
          onDisconnect={wallet.disconnect}
        />
      </header>

      {view === VIEWS.SECTIONS && (
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

      {view === VIEWS.QUIZ && activeSection && (
        <Quiz
          sectionId={activeSection}
          onComplete={handleQuizComplete}
          onBack={() => {
            setView(VIEWS.SECTIONS);
            setActiveSection(null);
          }}
        />
      )}

      {view === VIEWS.PUZZLE && (
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

      {view === VIEWS.CERTIFICATE && (
        <>
          <Certificate
            address={wallet.address}
            totalPoints={totalPoints}
            acquiredPieces={acquiredPieces}
            sectionScores={sectionScores}
            getWalletClient={wallet.getWalletClient}
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
