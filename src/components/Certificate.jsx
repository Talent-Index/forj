import { useState } from "react";
import {
  PUZZLE_SIZE,
  PUZZLE_LABELS,
  TOTAL_PIECES,
  sections,
} from "../data/questions";
import {
  CONTRACT_ADDRESS,
  CREDENTIAL_ABI,
  buildMintData,
  puzzleToMask,
} from "../utils/contract";
import { playFinishSound } from "../utils/sounds";

function getGrade(totalCorrect, totalQuestions) {
  const pct = (totalCorrect / totalQuestions) * 100;
  if (pct >= 90) return "S — Avalanche Legend";
  if (pct >= 75) return "A — Subnet Master";
  if (pct >= 60) return "B — Chain Expert";
  if (pct >= 40) return "C — AVAX Scholar";
  return "D — Beginner";
}

function Certificate({
  address,
  totalPoints,
  acquiredPieces,
  sectionScores,
  getWalletClient,
  onRetry,
  userImage,
}) {
  const [minting, setMinting] = useState(false);
  const [mintTx, setMintTx] = useState(null);
  const [mintError, setMintError] = useState(null);

  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const easyCorrect = sectionScores.easy?.correct ?? 0;
  const mediumCorrect = sectionScores.medium?.correct ?? 0;
  const hardCorrect = sectionScores.hard?.correct ?? 0;
  const totalCorrect = easyCorrect + mediumCorrect + hardCorrect;
  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);

  const certId = address
    ? `SF-${address.slice(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
    : `SF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

  async function handleMint() {
    if (!CONTRACT_ADDRESS) {
      setMintError("Contract not deployed. Run: npm run deploy:fuji and set VITE_CREDENTIAL_CONTRACT.");
      return;
    }
    setMinting(true);
    setMintError(null);
    try {
      const client = await getWalletClient();
      const [account] = await client.getAddresses();
      const mask = puzzleToMask(acquiredPieces);
      let imageUri = userImage || "";
      const data = buildMintData({
        totalPoints,
        puzzleMask: mask,
        easyCorrect,
        mediumCorrect,
        hardCorrect,
        imageData: imageUri || "",
      });

      const hash = await client.sendTransaction({
        account,
        to: CONTRACT_ADDRESS,
        data,
        chain: client.chain,
      });
      setMintTx(hash);
      playFinishSound();
    } catch (err) {
      setMintError(err.shortMessage || err.message || "Mint failed");
    } finally {
      setMinting(false);
    }
  }

  const certStyle = userImage
    ? { backgroundImage: `url(${userImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : {};

  return (
    <div className="certificate" id="certificate-print" style={certStyle}>
      <div className="certificate-icon">🏔️</div>
      <h1>Certificate of Avalanche Competence</h1>
      <h2>SkillForge — Verifiable On-Chain Credential</h2>

      {address && (
        <p className="cert-wallet">Awarded to: {address.slice(0, 10)}...{address.slice(-8)}</p>
      )}

      <div className="certificate-score">{totalPoints} pts</div>
      <p className="cert-grade">Grade: {getGrade(totalCorrect, totalQuestions)}</p>

      <div className="cert-section-scores">
        <span>🟢 Easy: {easyCorrect}/5</span>
        <span>🟡 Medium: {mediumCorrect}/5</span>
        <span>🔴 Hard: {hardCorrect}/5</span>
      </div>

      <h3 className="cert-puzzle-title">Your Avalanche Puzzle</h3>
      <div
        className="cert-puzzle-grid"
        style={{ gridTemplateColumns: `repeat(${PUZZLE_SIZE}, 1fr)` }}
      >
        {Array.from({ length: TOTAL_PIECES }, (_, i) => {
          const acquired = acquiredPieces.includes(i);
          const row = Math.floor(i / PUZZLE_SIZE);
          const col = i % PUZZLE_SIZE;
          const bgPos = `${(col / (PUZZLE_SIZE - 1)) * 100}% ${(row / (PUZZLE_SIZE - 1)) * 100}%`;
          return (
            <div
              key={i}
              className={`cert-puzzle-piece ${acquired ? "piece-acquired" : "piece-missing"}`}
              style={userImage && acquired ? {
                backgroundImage: `url(${userImage})`,
                backgroundSize: `${PUZZLE_SIZE * 100}% ${PUZZLE_SIZE * 100}%`,
                backgroundPosition: bgPos,
                borderColor: acquired ? "#b7f0c2" : undefined,
                backgroundBlendMode: acquired ? "normal" : undefined,
              } : {}}
            >
              {!userImage && (acquired ? PUZZLE_LABELS[i] : "?")}
              {!acquired && !userImage && "?"}
            </div>
          );
        })}
      </div>
      <p className="cert-puzzle-legend">
        <span className="legend-acquired">■ Acquired</span>
        <span className="legend-missing">■ Not acquired</span>
      </p>

      <div className="certificate-details">
        <span>Awarded on: {date}</span>
        <span>Puzzle: {acquiredPieces.length}/{TOTAL_PIECES} pieces</span>
        <span>ID: {certId}</span>
        {mintTx && (
          <span className="mint-success">✅ Minted! Tx: {mintTx.slice(0, 14)}...</span>
        )}
      </div>

      <div className="certificate-actions">
        <button className="btn-primary" onClick={() => window.print()}>
          🖨️ Print Certificate
        </button>
        {CONTRACT_ADDRESS && (
          <button className="btn-primary btn-mint" onClick={handleMint} disabled={minting || !!mintTx}>
            {minting ? "Minting..." : mintTx ? "✅ Minted On-Chain" : "⛓️ Mint On Avalanche"}
          </button>
        )}
        <button className="btn-secondary" onClick={onRetry}>
          🔄 Try Again
        </button>
      </div>
      {mintError && <div className="mint-error">{mintError}</div>}
      {!CONTRACT_ADDRESS && (
        <p className="deploy-hint">
          Deploy the smart contract with <code>npm run deploy:fuji</code> to enable on-chain minting.
        </p>
      )}
    </div>
  );
}

export default Certificate;
