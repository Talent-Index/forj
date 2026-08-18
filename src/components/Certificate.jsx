import { useState } from "react";
import {
  PUZZLE_SIZE,
  PUZZLE_LABELS,
  TOTAL_PIECES,
  sections,
} from "../data/questions";
import {
  CONTRACT_ADDRESS,
  buildMintData,
  puzzleToMask,
  FUJI_CHAIN_ID,
  FUJI_EXPLORER_TX,
} from "../utils/contract";
import { QUESTIONS_PER_QUIZ } from "../utils/quiz";
import { resolveCredentialImageUri } from "../utils/ipfs";
import { playFinishSound } from "../utils/sounds";
import { CREDENTIAL_EXPLAINER, EMPTY_STATES, ERROR_STATES } from "../utils/onboarding";
import { useOnChainCredential } from "../hooks/useOnChainCredential";
import EmptyState from "./EmptyState";
import CredentialRecord from "./CredentialRecord";

function Certificate({
  address,
  totalPoints,
  acquiredPieces,
  sectionScores,
  getWalletClient,
  publicClient,
  switchToFuji,
  onRetry,
  userImage,
}) {
  const [minting, setMinting] = useState(false);
  const [mintTx, setMintTx] = useState(null);
  const [mintError, setMintError] = useState(null);
  const { credential: onChainCredential, loading: loadingCredential, reload: loadOnChainCredential } =
    useOnChainCredential(address, publicClient);

  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const easyCorrect = sectionScores.easy?.correct ?? 0;
  const mediumCorrect = sectionScores.medium?.correct ?? 0;
  const hardCorrect = sectionScores.hard?.correct ?? 0;
  const totalCorrect = easyCorrect + mediumCorrect + hardCorrect;
  const totalQuestions = sections.reduce((sum) => sum + QUESTIONS_PER_QUIZ, 0);

  const [certId] = useState(() =>
    address
      ? `SF-${address.slice(2, 8).toUpperCase()}-${puzzleToMask(acquiredPieces).toString(16).toUpperCase()}`
      : "SF-LOCAL"
  );

  async function handleMint() {
    if (!CONTRACT_ADDRESS) {
      setMintError("Contract not deployed. Run: npm run deploy:fuji and set VITE_CREDENTIAL_CONTRACT.");
      return;
    }
    setMinting(true);
    setMintError(null);
    try {
      await switchToFuji();
      const client = await getWalletClient();
      const [account] = await client.getAddresses();
      const currentChainId = publicClient ? await publicClient.getChainId() : null;
      if (currentChainId !== FUJI_CHAIN_ID) {
        throw new Error("Please switch your wallet to Avalanche Fuji (43113) before minting.");
      }

      const mask = puzzleToMask(acquiredPieces);
      const imageUri = resolveCredentialImageUri(userImage);
      const data = buildMintData({
        totalPoints,
        puzzleMask: mask,
        easyCorrect,
        mediumCorrect,
        hardCorrect,
        imageData: imageUri,
      });

      const hash = await client.sendTransaction({
        account,
        to: CONTRACT_ADDRESS,
        data,
        chain: client.chain,
      });

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== "success") {
          throw new Error("Mint transaction failed on-chain.");
        }
      }

      setMintTx(hash);
      playFinishSound();
      await loadOnChainCredential();
    } catch (err) {
      setMintError(err.displayMessage || err.shortMessage || err.message || "Mint failed");
    } finally {
      setMinting(false);
    }
  }

  const pct = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const statusLabel = onChainCredential?.attested ? "Issuer attested" : "Claimed";

  return (
    <div className="certificate">
      <p className="kicker">Certificate unlocked</p>
      <h1>Avalanche Fundamentals</h1>
      <p className="cert-honesty">{CREDENTIAL_EXPLAINER.body}</p>

      {Object.keys(sectionScores).length === 0 && (
        <EmptyState
          icon="📜"
          title={EMPTY_STATES.noQuizzes.title}
          body="You can still preview this certificate. Take a quiz first if you want scores on-chain."
        />
      )}
      {acquiredPieces.length === 0 && (
        <EmptyState
          icon="🧩"
          title={EMPTY_STATES.noPieces.title}
          body={EMPTY_STATES.noPieces.body}
        />
      )}

      {address && (
        <p className="meta-line">Completed by {address.slice(0, 6)}...{address.slice(-4)}</p>
      )}

      <div className="stat-row">
        <div>
          <p className="kicker">Score</p>
          <p className="stat-value">{pct}%</p>
        </div>
        <div>
          <p className="kicker">Points</p>
          <p className="stat-value">{totalPoints}</p>
        </div>
        <div>
          <p className="kicker">Credential status</p>
          <p className={onChainCredential?.attested ? "status-attested" : "status-claimed"}>{statusLabel}</p>
        </div>
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
          <span className="mint-success">
            ✅ Minted!{" "}
            <a href={`${FUJI_EXPLORER_TX}${mintTx}`} target="_blank" rel="noreferrer">
              View on Snowtrace
            </a>
          </span>
        )}
      </div>

      {(loadingCredential || onChainCredential) && (
        <div className="onchain-credential">
          <h3>Your On-Chain Credential</h3>
          {loadingCredential && <p>Loading credential from Fuji…</p>}
          {!loadingCredential && onChainCredential && (
            <CredentialRecord credential={onChainCredential} />
          )}
        </div>
      )}
      {!loadingCredential && !onChainCredential && !mintTx && (
        <EmptyState
          icon="⛓️"
          title={EMPTY_STATES.noCredential.title}
          body={EMPTY_STATES.noCredential.body}
        />
      )}

      <div className="certificate-actions">
        <button
          className="btn-primary btn-mint"
          onClick={handleMint}
          disabled={minting || !!mintTx || !CONTRACT_ADDRESS}
        >
          {minting
            ? "Minting..."
            : mintTx
              ? "✅ Minted On-Chain"
              : CONTRACT_ADDRESS
                ? "⛓️ Mint Credential On Avalanche"
                : "⛓️ Mint (Deploy contract first)"}
        </button>
        <button className="btn-secondary" onClick={onRetry}>
          🔄 Try Again
        </button>
      </div>
      {mintError && (
        <EmptyState
          variant="error"
          icon="⚠️"
          title={ERROR_STATES.mint.title}
          body={`${mintError} ${ERROR_STATES.mint.body}`}
        />
      )}
      {!CONTRACT_ADDRESS && (
        <p className="deploy-hint">
          Deploy the smart contract with <code>npm run deploy:fuji</code> to enable on-chain minting.
        </p>
      )}
    </div>
  );
}

export default Certificate;
