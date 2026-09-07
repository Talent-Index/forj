import { useMemo, useState } from "react";
import { LEARNING_PATHS } from "../data/learning";
import { TOTAL_PIECES } from "../data/questions";
import {
  CONTRACT_ADDRESS,
  prepareClaimedMint,
  puzzleToMask,
  FUJI_CHAIN_ID,
  FUJI_EXPLORER_TX,
} from "../utils/contract";
import { isTxHash, safeExternalHref } from "../utils/frontendSecurity";
import { resolveCredentialImageUri } from "../utils/ipfs";
import { playFinishSound } from "../utils/sounds";
import { CREDENTIAL_EXPLAINER, ERROR_STATES } from "../utils/onboarding";
import { useOnChainCredential } from "../hooks/useOnChainCredential";
import { getFujiPublicClient } from "../utils/fujiClient";
import { validateRecipientName } from "../utils/recipient";
import { CREDENTIAL_SCHEMA_VERSION } from "../utils/credentialModel";
import { CREDENTIAL_STATES, LEARNER_MINT_STATUS, resolveCredentialStatus } from "../utils/credentialStatus";
import EmptyState from "./EmptyState";
import ExistingCertificate from "./ExistingCertificate";
import CertificateArtifact from "./CertificateArtifact";
import CredentialStatusBadge from "./CredentialStatusBadge";
import NetworkGate from "./NetworkGate";
import {
  certificateId,
  highestDifficulty,
  quizPercent,
} from "../utils/certificateView";
import JigsawBoard from "./JigsawBoard";
import TrackCertificateGallery from "./TrackCertificateGallery";
import { Button } from "./ui/primitives";
import { AnimatedDoodle, Doodle, DoodleText } from "./doodles";
import {
  PuzzleProgress,
  PuzzleMilestoneList,
  CertificateCard,
  CertificateViewer,
  CredentialStatus,
} from "./achievements";
import {
  evaluateLearningCertificates,
  highestSkillTiers,
} from "../utils/achievements";
import { fragmentProgress } from "../utils/fragments";
import { FRAGMENTS_PER_PIECE, FORGE_LEVEL_META } from "../utils/quizConfig";
import { TIER_ROMAN } from "../utils/achievementCatalog";
import { buildCredentialVerificationView, publicCredentialPath } from "../utils/credentialLookup";

const PATH_LABEL = LEARNING_PATHS[0]?.name || "Avalanche Developer Path";

function headerFor(phase, { minted, onChain, puzzleComplete }) {
  if (phase === "forge") {
    return {
      title: "Credentials",
      lede: puzzleComplete
        ? "Puzzle complete. Name the recipient, then optionally mint a claimed Fuji path snapshot. Track and learning certificates stay off-chain."
        : "Track certificates and learning certificates are path evidence. Seat all sixteen puzzle pieces to unlock naming and the optional claimed Fuji mint.",
    };
  }
  if (phase === "name") {
    return {
      title: "Name the recipient",
      lede: "This name appears on the certificate artwork. It is not written on-chain.",
    };
  }
  if (phase === "preview") {
    return {
      title: "Certificate preview",
      lede: "Confirm the claimed path certificate. Learner mint is always Forjora claimed — not issuer-attested.",
    };
  }
  if (minted || onChain) {
    return {
      title: "Credential forged",
      lede: CREDENTIAL_EXPLAINER.body,
    };
  }
  return {
    title: "Mint a claimed credential",
    lede: CREDENTIAL_EXPLAINER.body,
  };
}

function Certificate({
  address,
  totalPoints,
  acquiredPieces,
  sectionScores,
  recipientName = "",
  onClaimed,
  onRecipientName,
  getWalletClient,
  publicClient,
  switchToFuji,
  onRetry,
  userImage,
  onLookup,
  onPuzzle,
  onLearn,
  onProgress,
  onConnectWallet,
  progress = null,
  achievements = [],
  puzzleFragments = 0,
  isFuji = false,
  chainId = null,
  switchingNetwork = false,
  networkError = "",
  injectorConnected = false,
}) {
  const puzzleComplete = acquiredPieces.length >= TOTAL_PIECES;
  const savedName = validateRecipientName(recipientName);
  const [phase, setPhase] = useState(() => {
    if (!puzzleComplete) return "forge";
    if (!savedName.ok) return "name";
    return "preview";
  });
  const [nameInput, setNameInput] = useState(savedName.name || recipientName || "");
  const [nameError, setNameError] = useState("");
  const [minting, setMinting] = useState(false);
  const [mintTx, setMintTx] = useState(null);
  const [mintError, setMintError] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [openLearningCert, setOpenLearningCert] = useState(null);
  const readClient = publicClient || (address ? getFujiPublicClient() : null);
  const {
    credential: onChainCredential,
    transactionHash,
    loading: loadingCredential,
    error: credentialError,
    reload: loadOnChainCredential,
  } = useOnChainCredential(address, readClient);
  const verificationView = useMemo(
    () =>
      onChainCredential
        ? buildCredentialVerificationView(onChainCredential, {
            transactionHash: transactionHash || mintTx || "",
          })
        : null,
    [onChainCredential, transactionHash, mintTx]
  );

  const mask = puzzleToMask(acquiredPieces);
  const certId = useMemo(
    () => certificateId(address, mask.toString(16)),
    [address, mask]
  );
  const scorePercent = quizPercent(sectionScores);
  const difficulty = highestDifficulty(sectionScores);
  const onChainStatus = resolveCredentialStatus(onChainCredential);
  const previewStatus = CREDENTIAL_STATES[LEARNER_MINT_STATUS];
  const artifactStatus = onChainCredential ? onChainStatus : previewStatus;
  const issuedName = savedName.ok ? savedName.name : validateRecipientName(nameInput).name;
  const onChainImageUri = resolveCredentialImageUri(userImage);
  const minted = Boolean(mintTx) || Boolean(onChainCredential);
  const header = headerFor(phase, {
    minted,
    onChain: Boolean(onChainCredential),
    puzzleComplete,
  });
  const hasLookupAddress = Boolean(address);
  const canMint = injectorConnected;
  const fragments = fragmentProgress(puzzleFragments);
  const skillHighlights = highestSkillTiers(
    (achievements || []).filter((item) => item.family === "skills" && item.earned)
  );
  const learningCertCtx = useMemo(
    () => ({
      completedQuizzes: progress?.completedQuizzes || {},
      sectionScores: sectionScores || {},
      puzzleCount: acquiredPieces.length,
      puzzleComplete,
      hasCredential: Boolean(onChainCredential),
      completedTracks: progress?.completedTracks || {},
      completedPaths: progress?.completedPaths || {},
    }),
    [
      progress?.completedQuizzes,
      progress?.completedTracks,
      progress?.completedPaths,
      sectionScores,
      acquiredPieces.length,
      puzzleComplete,
      onChainCredential,
    ]
  );
  const learningCertificates = useMemo(
    () =>
      evaluateLearningCertificates(learningCertCtx, {
        recipientName: issuedName || recipientName || "Learner",
        learnerKey: address || issuedName || "LOCAL",
      }),
    [learningCertCtx, issuedName, recipientName, address]
  );
  const earnedLearningCerts = learningCertificates.filter((row) => row.earned);
  const masteryLines = ["easy", "medium", "hard", "master"]
    .map((id) => {
      const row = sectionScores?.[id];
      if (!row) return null;
      const total = Number(row.total) || 0;
      const correct = Number(row.correct) || 0;
      if (!total) return null;
      return {
        id,
        label: FORGE_LEVEL_META[id]?.forgeLabel || id,
        percent: Math.round((correct / total) * 100),
      };
    })
    .filter(Boolean);

  async function handleMint() {
    if (!CONTRACT_ADDRESS) {
      setMintError("The credential contract is not available yet.");
      return;
    }
    if (!savedName.ok) {
      setMintError("Confirm a recipient name before minting.");
      return;
    }
    if (!canMint) {
      setMintError("Connect a wallet on Avalanche Fuji to mint.");
      onConnectWallet?.();
      return;
    }
    setMinting(true);
    setMintError(null);
    try {
      await switchToFuji();
      const client = await getWalletClient();
      const [account] = await client.getAddresses();
      const currentChainId = publicClient ? await publicClient.getChainId() : null;
      const prepared = prepareClaimedMint({
        account,
        expectedAccount: address,
        chainId: currentChainId,
        totalPoints,
        puzzleMask: mask,
        easyCorrect: sectionScores.easy?.correct ?? 0,
        mediumCorrect: sectionScores.medium?.correct ?? 0,
        hardCorrect: sectionScores.hard?.correct ?? 0,
        imageData: onChainImageUri,
      });
      if (!prepared.ok) {
        throw new Error(prepared.error);
      }

      const hash = await client.sendTransaction({
        account: prepared.account,
        to: prepared.to,
        data: prepared.data,
        value: prepared.value,
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
      onClaimed?.();
      await loadOnChainCredential();
    } catch (err) {
      setMintError(err.displayMessage || err.shortMessage || err.message || "Mint failed");
    } finally {
      setMinting(false);
    }
  }

  function submitName(event) {
    event.preventDefault();
    const result = validateRecipientName(nameInput);
    if (!result.ok) {
      setNameError(result.error);
      return;
    }
    setNameError("");
    onRecipientName?.(result.name);
    setNameInput(result.name);
    setPhase("preview");
  }

  function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    onRetry?.();
  }

  const artifact = (
    <CertificateArtifact
      artwork={userImage}
      recipientName={issuedName}
      scorePercent={scorePercent}
      difficulty={difficulty}
      pathLabel={PATH_LABEL}
      credentialId={onChainCredential?.credentialId ? `#${onChainCredential.credentialId}` : certId}
      verificationStatus={artifactStatus.id}
      walletAddress={address}
      chainId={onChainCredential?.chainId || FUJI_CHAIN_ID}
      contractAddress={onChainCredential?.contractAddress || CONTRACT_ADDRESS}
      schemaVersion={onChainCredential?.version?.schema || CREDENTIAL_SCHEMA_VERSION}
      metadataUri={onChainCredential?.metadataUri}
      explorerUrl={onChainCredential?.explorerUrl}
      verificationUrl={
        onChainCredential?.credentialId
          ? publicCredentialPath({ tokenId: String(onChainCredential.credentialId), wallet: address })
          : ""
      }
      compact={phase === "preview"}
    />
  );

  return (
    <div className="page credentials-page">
      <header className="page-header">
        <p className="kicker">Forjora credentials</p>
        <h1>{header.title}</h1>
        <p className="lede">{header.lede}</p>
        <p className="certificate-status-row">
          <CredentialStatusBadge status={artifactStatus} />
          {onChainCredential ? (
            <span className="meta-line">On-chain status for this wallet</span>
          ) : (
            <span className="meta-line">Learner mint is always Forjora claimed</span>
          )}
        </p>
      </header>

      <section className="section-block credentials-journey" aria-label="Credential journey">
        <p className="kicker">Journey</p>
        <ol className="credentials-journey-steps">
          <li className={acquiredPieces.length > 0 || earnedLearningCerts.length ? "is-done" : ""}>
            Learn & assess
          </li>
          <li className={fragments.fragments > 0 || acquiredPieces.length > 0 ? "is-done" : ""}>
            XP & fragments
          </li>
          <li className={acquiredPieces.length > 0 ? "is-done" : ""}>
            Puzzle pieces
          </li>
          <li className={earnedLearningCerts.length > 0 ? "is-done" : ""}>
            Learning certificates
          </li>
          <li className={puzzleComplete ? "is-done" : ""}>Path snapshot</li>
          <li className={onChainCredential || mintTx ? "is-done" : ""}>Fuji mint</li>
        </ol>
        <p className="meta-line">
          The puzzle is the journey. Learning certificates are path proof. The Fuji mint is an optional claimed on-chain snapshot.
        </p>
      </section>

      <ExistingCertificate
        credential={onChainCredential}
        view={verificationView}
        loading={loadingCredential}
        error={credentialError}
        walletConnected={hasLookupAddress}
        recipientName={issuedName}
        artworkFallback={userImage}
        onLookup={onLookup}
        onConnectWallet={onConnectWallet}
      />

      {onChainCredential && verificationView ? (
        <section className="section-block">
          <CredentialStatus
            verificationStatus={onChainStatus.id}
            credentialId={
              onChainCredential.credentialId
                ? `#${onChainCredential.credentialId}`
                : certId
            }
            issuedLabel=""
            onVerify={onLookup}
          />
        </section>
      ) : null}

      {canMint && !isFuji && phase === "issued" ? (
        <NetworkGate
          chainId={chainId}
          switching={switchingNetwork}
          error={networkError}
          onSwitch={() => switchToFuji?.().catch(() => {})}
        />
      ) : null}

      {phase === "forge" && (
        <>
          <section className="section-block">
            <h2>Credential puzzle</h2>
            <PuzzleProgress
              puzzleCount={acquiredPieces.length}
              complete={puzzleComplete}
              onPuzzle={() => onPuzzle?.("fundamentals")}
            />
            <p className="meta-line">
              Fragments {fragments.fragments} · {fragments.towardNext}/{FRAGMENTS_PER_PIECE} toward next piece
              {" · "}
              {totalPoints} quiz pts seated toward Easy / Medium / Hard pieces
            </p>
            <PuzzleMilestoneList puzzleCount={acquiredPieces.length} />
            <div className="credentials-jigsaw">
              <JigsawBoard
                artwork={userImage}
                acquiredPieces={acquiredPieces}
                complete={puzzleComplete}
                showLabels={false}
              />
            </div>
            {puzzleComplete ? (
              <div className="card credentials-puzzle-complete">
                <AnimatedDoodle
                  type="diamond"
                  animation="achievement"
                  stages={["draw", "reveal", "stamp"]}
                  trigger="immediate"
                  size={28}
                  variant="accent"
                />
                <p className="kicker">
                  <DoodleText trigger="immediate" mark="underline">Puzzle complete</DoodleText>
                </p>
                <p className="lede">16 / 16 pieces · Achievement unlocked · Forjora path certificate ready</p>
                <p className="meta-line">
                  Name the recipient, then optionally mint a claimed Fuji record. Track and learning certificates above remain off-chain.
                </p>
                <div className="certificate-actions">
                  <Button onClick={() => setPhase(savedName.ok ? "preview" : "name")}>
                    Continue to path certificate
                  </Button>
                  {onProgress ? (
                    <Button variant="secondary" onClick={onProgress}>View achievements</Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="certificate-actions">
                <Button onClick={() => onPuzzle?.()}>Forge pieces</Button>
                {onLearn ? (
                  <Button variant="secondary" onClick={onLearn}>Learn</Button>
                ) : null}
              </div>
            )}
          </section>

          <section className="section-block">
            <h2>Skills demonstrated</h2>
            {skillHighlights.length || masteryLines.length ? (
              <>
                {skillHighlights.length > 0 ? (
                  <ul className="skill-achievement-list">
                    {skillHighlights.map((item) => (
                      <li key={item.skillId}>
                        <div className="skill-achievement-chip">
                          <span className="kicker">{item.displayName}</span>
                          <span className="stat-value">
                            {TIER_ROMAN[item.tier]} · {item.tierLabel}
                          </span>
                          <span className="meta-line">{item.skillLabel}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {masteryLines.length > 0 ? (
                  <ul className="credentials-mastery-list">
                    {masteryLines.map((row) => (
                      <li key={row.id}>
                        <span className="result-mark-ok">✓</span>
                        <span>{row.label}</span>
                        <span className="meta-line">{row.percent}% mastery</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <EmptyState
                doodle="hammer"
                title="Skills appear as you prove them"
                body="Assessments and tracks unlock skill ladders and mastery lines here."
                actionLabel="Explore learning"
                onAction={onLearn}
              />
            )}
          </section>

          <section className="section-block">
            <h2>Learning certificates</h2>
            <p className="meta-line">
              Formal path certificates (Foundation → Master). Not Fuji mints and not issuer-attested.
            </p>
            {earnedLearningCerts.length === 0 && learningCertificates.every((c) => !c.earned) ? (
              <EmptyState
                doodle="certificate"
                title="No learning certificates yet"
                body="Finish the required tracks and assessments to earn Foundation through Master path certificates."
                actionLabel="Explore learning"
                onAction={onLearn}
              />
            ) : null}
            <div className="track-cert-grid">
              {learningCertificates.map((cert) => (
                <CertificateCard
                  key={cert.id}
                  certificate={cert}
                  onOpen={setOpenLearningCert}
                />
              ))}
            </div>
            {openLearningCert ? (
              <div className="learning-cert-viewer">
                <CertificateViewer
                  certificate={openLearningCert}
                  recipientName={issuedName || recipientName || "Learner"}
                />
                {openLearningCert.earned ? (
                  <CredentialStatus
                    learningRecord
                    credentialId={openLearningCert.credentialId}
                    issuedLabel={openLearningCert.issuedLabel}
                    onVerify={onLookup}
                  />
                ) : null}
                <Button variant="secondary" onClick={() => setOpenLearningCert(null)}>
                  Close certificate
                </Button>
              </div>
            ) : null}
          </section>

          <TrackCertificateGallery
            acquiredPieces={acquiredPieces}
            sectionScores={sectionScores}
            progress={progress}
            recipientName={issuedName || recipientName}
            artwork={userImage}
            onForge={onPuzzle}
            onLearn={onLearn}
          />

          <section className="section-block path-credential-panel">
            <p className="kicker">Path credential</p>
            <h2>Claimed Fuji snapshot</h2>
            <p className="meta-line">
              One optional claimed mint after all sixteen pieces. Learning and track certificates stay off-chain.
            </p>
            <p className="stat-value">{acquiredPieces.length} / {TOTAL_PIECES} pieces</p>
            <p className="note">
              Easy seats 3, Medium 5, Hard 8 with quiz points. Fragments also convert into pieces (5 = 1).
            </p>
            <div className="certificate-actions">
              {puzzleComplete ? (
                <Button onClick={() => setPhase(savedName.ok ? "preview" : "name")}>
                  Name & mint path credential
                </Button>
              ) : (
                <Button onClick={() => onPuzzle?.()}>Continue forging</Button>
              )}
              {onProgress ? (
                <Button variant="secondary" onClick={onProgress}>
                  <Doodle type="badge" size={14} variant="ink" /> Achievements
                </Button>
              ) : null}
            </div>
          </section>
        </>
      )}

      {phase === "name" && (
        <form className="section-block recipient-form" onSubmit={submitName}>
          <p>Who should this certificate name?</p>
          <label className="auth-field" htmlFor="recipient-name">
            <span>Recipient name</span>
            <input
              id="recipient-name"
              className="recipient-input"
              value={nameInput}
              onChange={(event) => {
                setNameInput(event.target.value);
                setNameError("");
              }}
              placeholder="Example: Alex Mwangi"
              autoComplete="name"
              maxLength={48}
              required
            />
          </label>
          {nameError && <p className="recipient-error" role="alert">{nameError}</p>}
          <p className="note">Required. Capitalization is kept as you type. The name is not stored on-chain.</p>
          <Button type="submit">Continue</Button>
        </form>
      )}

      {phase === "preview" && (
        <section className="section-block">
          {artifact}
          <p className="note">This name will appear on your credential artwork.</p>
          <p className="note">{previewStatus.body}</p>
          {onChainStatus.id === "attested" && (
            <p className="note" role="status">{previewStatus.remintNote}</p>
          )}
          {!onChainImageUri && (
            <p className="note">
              Certificate artwork is not pinned yet. The credential still mints; explorers will not show an image.
            </p>
          )}
          <div className="quiz-nav quiz-nav-end">
            <Button variant="secondary" onClick={() => setPhase("name")}>Edit name</Button>
            <Button onClick={() => setPhase("issued")}>Continue to mint</Button>
          </div>
        </section>
      )}

      {phase === "issued" && (
        <>
          <section className="section-block certificate-reveal">
            {artifact}
          </section>

          <section className="section-block">
            <h2>{mintTx ? "Minted on Fuji" : "Claim on Fuji"}</h2>
            <p>{previewStatus.body}</p>
            {!canMint ? (
              <p className="note">Connect a wallet to publish this claimed snapshot. Learning does not require one.</p>
            ) : null}
            {onChainStatus.id === "attested" && !mintTx ? (
              <p className="note" role="status">{previewStatus.remintNote}</p>
            ) : null}
            {mintTx && isTxHash(mintTx) ? (
              <p className="mint-success" role="status">
                Minted.{" "}
                <a href={safeExternalHref(`${FUJI_EXPLORER_TX}${mintTx}`)} target="_blank" rel="noopener noreferrer">
                  View transaction on Snowtrace
                </a>
              </p>
            ) : null}
            {!onChainImageUri && (
              <p className="note">
                Pin certificate artwork as ipfs:// or https:// so Snowtrace can load the image.
              </p>
            )}
            {!CONTRACT_ADDRESS && (
              <p className="deploy-hint">On-chain minting is not available in this app yet.</p>
            )}
            {mintError && (
              <EmptyState
                variant="error"
                title={ERROR_STATES.mint.title}
                body={`${mintError} ${ERROR_STATES.mint.body}`}
              />
            )}
            <div className="certificate-actions">
              {!canMint ? (
                <Button onClick={onConnectWallet}>Connect wallet</Button>
              ) : (
                <Button
                  onClick={handleMint}
                  disabled={minting || !!mintTx || !CONTRACT_ADDRESS || !savedName.ok}
                >
                  {minting
                    ? "Minting..."
                    : mintTx
                      ? "Minted on-chain"
                      : CONTRACT_ADDRESS
                        ? "Claim Forjora claimed credential on Fuji"
                        : "Mint unavailable"}
                </Button>
              )}
              <Button variant="ghost" onClick={handleReset}>
                {confirmReset ? "Confirm reset local progress" : "Reset local progress"}
              </Button>
              {confirmReset ? (
                <Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>
              ) : null}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Certificate;
