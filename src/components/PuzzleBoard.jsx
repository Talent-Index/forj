import { useEffect, useState } from "react";
import { PIECE_COST, TOTAL_PIECES, MAX_POINTS } from "../data/questions";
import { TRACK_CERTIFICATES } from "../data/learning";
import { availablePoints, availablePointsForPiece, redeemPiece } from "../utils/puzzle";
import { certificateById } from "../utils/trackCertificates";
import { playCorrectSound } from "../utils/sounds";
import { EMPTY_STATES, ERROR_STATES, PUZZLE_EXPLAINER } from "../utils/onboarding";
import EmptyState from "./EmptyState";
import JigsawBoard from "./JigsawBoard";
import { Button } from "./ui/primitives";

const QUIZ_CERTS = TRACK_CERTIFICATES.filter((item) => item.kind === "quiz");

function PuzzleBoard({
  totalPoints,
  spentPoints,
  acquiredPieces,
  sectionScores = {},
  trackId = "fundamentals",
  onAcquirePiece,
  onContinue,
  onBack,
  userImage,
}) {
  const initial = certificateById(trackId)?.kind === "quiz" ? trackId : "fundamentals";
  const [activeId, setActiveId] = useState(initial);
  useEffect(() => {
    if (certificateById(trackId)?.kind === "quiz") setActiveId(trackId);
  }, [trackId]);
  const [lastUnlocked, setLastUnlocked] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [message, setMessage] = useState(null);
  const certificate = certificateById(activeId) || QUIZ_CERTS[0];
  const available = availablePoints(totalPoints, acquiredPieces);
  const spent = spentPoints ?? acquiredPieces.length * PIECE_COST;
  const complete = acquiredPieces.length === TOTAL_PIECES;
  const forgeCost = TOTAL_PIECES * PIECE_COST;
  const affordableIndexes = certificate.pieceIndexes.filter(
    (index) => availablePointsForPiece({ totalPoints, acquiredPieces, sectionScores }, index) >= PIECE_COST
  );

  function handleAcquire(index) {
    if (selectedIndex !== index) {
      setSelectedIndex(index);
      setMessage(null);
      return;
    }
    const result = redeemPiece({ totalPoints, acquiredPieces, sectionScores }, index);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage(null);
    setSelectedIndex(null);
    setLastUnlocked(index);
    playCorrectSound();
    onAcquirePiece(index);
  }

  return (
    <div className="page puzzle-board">
      <header className="page-header">
        <h1>{complete ? "Path assembled" : certificate.title}</h1>
      </header>

      <div className="quiz-nav">
        {QUIZ_CERTS.map((item) => (
          <Button
            key={item.id}
            variant={item.id === activeId ? "primary" : "secondary"}
            onClick={() => {
              setActiveId(item.id);
              setSelectedIndex(null);
              setMessage(null);
            }}
          >
            {item.quizLabel}
          </Button>
        ))}
      </div>

      <section className="section-block forge-progress">
        <p className="stat-value">{acquiredPieces.length} / {TOTAL_PIECES}</p>
        <p className="meta-line">
          {spent} / {forgeCost} seated · {available} leftover
        </p>
        <p className="meta-line">{PUZZLE_EXPLAINER.body}</p>
      </section>

      {available < PIECE_COST && acquiredPieces.length === 0 && (
        <EmptyState
          title={EMPTY_STATES.noPoints.title}
          body={EMPTY_STATES.noPoints.body}
          actionLabel="Learn"
          onAction={onBack}
        />
      )}
      {message && (
        <EmptyState
          variant="error"
          title={ERROR_STATES.puzzle.title}
          body={`${message} ${ERROR_STATES.puzzle.body}`}
        />
      )}
      {complete && (
        <p className="forge-complete-banner" role="status">Path certificate is ready to name.</p>
      )}

      <div className="puzzle-layout">
        <JigsawBoard
          artwork={userImage}
          acquiredPieces={acquiredPieces}
          complete={complete}
          interactive={!complete}
          lastUnlocked={lastUnlocked}
          selectedIndex={selectedIndex}
          activeIndexes={certificate.pieceIndexes}
          affordableIndexes={affordableIndexes}
          onSelect={handleAcquire}
        />
        <aside className="card">
          <p className="kicker">{certificate.quizLabel}</p>
          <p className="stat-value">{affordableIndexes.length}</p>
          <p className="meta-line">Pieces you can seat from this quiz</p>
          <p className="meta-line">{PIECE_COST} pts each. Max path score {MAX_POINTS}.</p>
          <div className="quiz-nav quiz-nav-end">
            <Button variant="secondary" onClick={onBack}>Back</Button>
            <Button onClick={onContinue} disabled={acquiredPieces.length === 0}>
              {complete ? "Reveal" : "Certificates"}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default PuzzleBoard;
