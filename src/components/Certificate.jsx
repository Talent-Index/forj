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
import CertificateArtifact from "./CertificateArtifact";
import CredentialStatusBadge from "./CredentialStatusBadge";
import NetworkGate from "./NetworkGate";
import {
  certificateId,
  highestDifficulty,
  quizPercent,
} from "../utils/certificateView";
import { Button } from "./ui/primitives";
import { highestSkillTiers } from "../utils/achievements";
import { FORGE_LEVEL_META } from "../utils/quizConfig";
import { buildCredentialVerificationView, publicCredentialPath } from "../utils/credentialLookup";
import CredentialVault from "./vault/CredentialVault";

const PATH_LABEL = LEARNING_PATHS[0]?.name || "Avalanche Developer Path";

function headerFor(phase, { minted, onChain, puzzleComplete }) {
  if (phase === "forge") {
    return {
      title: "Credential vault",
      lede: puzzleComplete
        ? "Puzzle complete. Browse path certificates, then optionally mint a claimed Fuji path snapshot. Track and learning certificates stay off-chain."
        : "Browse path certificates and puzzle progress. Seat all sixteen pieces to unlock naming and the optional claimed Fuji mint.",
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
      lede: "Confirm the claimed path certificate. Learner mint is always Forjora claimed, not issuer-attested.",
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
  const [phase, setPhase] = useState("forge");
  const [nameInput, setNameInput] = useState(savedName.name || recipientName || "");
  const [nameError, setNameError] = useState("");
  const [minting, setMinting] = useState(false);
  const [mintTx, setMintTx] = useState(null);
  const [mintError, setMintError] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
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
  const canMint = injectorConnected;
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
      {phase === "forge" ? (
        <CredentialVault
          acquiredPieces={acquiredPieces}
          sectionScores={sectionScores}
          progress={progress}
          learningCtx={learningCertCtx}
          onChainCredential={onChainCredential}
          verificationView={verificationView}
          loadingCredential={loadingCredential}
          credentialError={credentialError}
          puzzleComplete={puzzleComplete}
          pathLabel={PATH_LABEL}
          recipientName={recipientName}
          issuedName={issuedName}
          userImage={userImage}
          totalPoints={totalPoints}
          puzzleFragments={puzzleFragments}
          skillHighlights={skillHighlights}
          masteryLines={masteryLines}
          onChainStatus={onChainStatus}
          certId={certId}
          address={address}
          onLookup={onLookup}
          onPuzzle={onPuzzle}
          onLearn={onLearn}
          onProgress={onProgress}
          onConnectWallet={onConnectWallet}
          onContinuePathMint={setPhase}
          savedNameOk={savedName.ok}
        />
      ) : (
        <>
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
            <div className="certificate-actions">
              <Button variant="ghost" onClick={() => setPhase("forge")}>
                ← Back to vault
              </Button>
            </div>
          </header>

          {canMint && !isFuji && phase === "issued" ? (
            <NetworkGate
              chainId={chainId}
              switching={switchingNetwork}
              error={networkError}
              onSwitch={() => switchToFuji?.().catch(() => {})}
            />
          ) : null}

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
                  {onLookup && (mintTx || onChainCredential) ? (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        onLookup(
                          onChainCredential?.credentialId
                            ? String(onChainCredential.credentialId)
                            : "",
                          address
                        )
                      }
                    >
                      Open public lookup
                    </Button>
                  ) : null}
                  <Button variant="ghost" onClick={() => setPhase("forge")}>
                    Back to vault
                  </Button>
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
        </>
      )}
    </div>
  );
}

export default Certificate;
