import { useState, useCallback, useEffect } from "react";
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
  FUJI_CHAIN_ID,
  FUJI_EXPLORER_TX,
  FUJI_EXPLORER_TOKEN,
} from "../utils/contract";
import { QUESTIONS_PER_QUIZ } from "../utils/quiz";
import { resolveCredentialImageUri } from "../utils/ipfs";
import { playFinishSound } from "../utils/sounds";
import { CREDENTIAL_EXPLAINER, EMPTY_STATES, ERROR_STATES } from "../utils/onboarding";
import EmptyState from "./EmptyState";

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
  publicClient,
  switchToFuji,
  onRetry,
  userImage,
}) {
  const [minting, setMinting] = useState(false);
  const [mintTx, setMintTx] = useState(null);
  const [mintError, setMintError] = useState(null);
  const [onChainCredential, setOnChainCredential] = useState(null);
  const [loadingCredential, setLoadingCredential] = useState(Boolean(CONTRACT_ADDRESS));

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

  const loadOnChainCredential = useCallback(async () => {
    if (!CONTRACT_ADDRESS || !publicClient || !address) {
      setOnChainCredential(null);
      return;
    }

    setLoadingCredential(true);
    try {
      const tokenId = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CREDENTIAL_ABI,
        functionName: "credentialOf",
        args: [address],
      });

      if (!tokenId || tokenId === 0n) {
        setOnChainCredential(null);
        return;
      }

      const [data, tokenURI] = await Promise.all([
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CREDENTIAL_ABI,
          functionName: "credentials",
          args: [tokenId],
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CREDENTIAL_ABI,
          functionName: "tokenURI",
          args: [tokenId],
        }),
      ]);

      setOnChainCredential({
        tokenId: tokenId.toString(),
        totalPoints: data[0].toString(),
        puzzleMask: data[1].toString(),
        easyCorrect: Number(data[2]),
        mediumCorrect: Number(data[3]),
        hardCorrect: Number(data[4]),
        image: data[5],
        mintedAt: Number(data[6]),
        attested: Boolean(data[7]),
        tokenURI,
        explorerUrl: `${FUJI_EXPLORER_TOKEN}${CONTRACT_ADDRESS}?a=${tokenId.toString()}`,
      });
    } catch {
      setOnChainCredential(null);
    } finally {
      setLoadingCredential(false);
    }
  }, [address, publicClient]);

  useEffect(() => {
    loadOnChainCredential();
  }, [loadOnChainCredential]);

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

  const certStyle = userImage
    ? { backgroundImage: `url(${userImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : {};

  return (
    <div className="certificate" style={certStyle}>
      <div className="certificate-icon">🏔️</div>
      <h1>Certificate of Avalanche Competence</h1>
      <h2>SkillForge — On-Chain Record of Claimed Scores</h2>
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
            <>
              <p>Token #{onChainCredential.tokenId} · {onChainCredential.totalPoints} pts</p>
              <p>
                {onChainCredential.attested ? "Issuer-attested credential" : "Self-claimed score record"}
              </p>
              <p>
                Scores: Easy {onChainCredential.easyCorrect}/5 · Medium {onChainCredential.mediumCorrect}/5 · Hard {onChainCredential.hardCorrect}/5
              </p>
              <a href={onChainCredential.explorerUrl} target="_blank" rel="noreferrer">
                Open credential on Snowtrace
              </a>
            </>
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
