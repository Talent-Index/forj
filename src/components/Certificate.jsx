import { useMemo, useState } from "react";
import { TOTAL_PIECES } from "../data/questions";
import {
  CONTRACT_ADDRESS,
  buildMintData,
  puzzleToMask,
  FUJI_CHAIN_ID,
  FUJI_EXPLORER_TX,
} from "../utils/contract";
import { resolveCredentialImageUri } from "../utils/ipfs";
import { playFinishSound } from "../utils/sounds";
import { CREDENTIAL_EXPLAINER, EMPTY_STATES, ERROR_STATES } from "../utils/onboarding";
import { useOnChainCredential } from "../hooks/useOnChainCredential";
import { validateRecipientName } from "../utils/recipient";
import { CREDENTIAL_SCHEMA_VERSION } from "../utils/credentialModel";
import EmptyState from "./EmptyState";
import CredentialRecord from "./CredentialRecord";
import CertificateArtifact, {
  certificateId,
  highestDifficulty,
  quizPercent,
} from "./CertificateArtifact";
import JigsawBoard from "./JigsawBoard";
import { Button } from "./ui/primitives";

function Certificate({
  address,
  totalPoints,
  acquiredPieces,
  sectionScores,
  recipientName = "",
  onRecipientName,
  getWalletClient,
  publicClient,
  switchToFuji,
  onRetry,
  userImage,
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
  const { credential: onChainCredential, loading: loadingCredential, reload: loadOnChainCredential } =
    useOnChainCredential(address, publicClient);

  const mask = puzzleToMask(acquiredPieces);
  const certId = useMemo(
    () => certificateId(address, mask.toString(16)),
    [address, mask]
  );
  const scorePercent = quizPercent(sectionScores);
  const difficulty = highestDifficulty(sectionScores);
  const verificationStatus = onChainCredential?.verificationStatus || "claimed";
  const issuedName = savedName.ok ? savedName.name : validateRecipientName(nameInput).name;

  async function handleMint() {
    if (!CONTRACT_ADDRESS) {
      setMintError("Contract not deployed. Run: npm run deploy:fuji and set VITE_CREDENTIAL_CONTRACT.");
      return;
    }
    if (!savedName.ok) {
      setMintError("Confirm a recipient name before minting.");
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

      const imageUri = resolveCredentialImageUri(userImage);
      const data = buildMintData({
        totalPoints,
        puzzleMask: mask,
        easyCorrect: sectionScores.easy?.correct ?? 0,
        mediumCorrect: sectionScores.medium?.correct ?? 0,
        hardCorrect: sectionScores.hard?.correct ?? 0,
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

  const artifact = (
    <CertificateArtifact
      artwork={userImage}
      recipientName={issuedName}
      scorePercent={scorePercent}
      difficulty={difficulty}
      credentialId={onChainCredential?.credentialId ? `#${onChainCredential.credentialId}` : certId}
      verificationStatus={verificationStatus}
      walletAddress={address}
      chainId={onChainCredential?.chainId || FUJI_CHAIN_ID}
      contractAddress={onChainCredential?.contractAddress || CONTRACT_ADDRESS}
      schemaVersion={onChainCredential?.version?.schema || CREDENTIAL_SCHEMA_VERSION}
      metadataUri={onChainCredential?.metadataUri}
      explorerUrl={onChainCredential?.explorerUrl}
      compact={phase === "preview"}
    />
  );

  return (
    <div className="page certificate">
      <header className="page-header">
        <p className="kicker">The credential</p>
        <h1>
          {phase === "forge"
            ? "Certificate in progress"
            : phase === "name"
              ? "Your certificate is ready"
              : phase === "preview"
                ? "Certificate preview"
                : "Forged certificate"}
        </h1>
        <p className="lede">{CREDENTIAL_EXPLAINER.body}</p>
      </header>

      {Object.keys(sectionScores).length === 0 && (
        <EmptyState
          title={EMPTY_STATES.noQuizzes.title}
          body="You can still preview the forge. Take a quiz first if you want scores on-chain."
        />
      )}
      {acquiredPieces.length === 0 && (
        <EmptyState
          title={EMPTY_STATES.noPieces.title}
          body={EMPTY_STATES.noPieces.body}
        />
      )}

      {phase === "forge" && (
        <section className="section-block">
          <p className="kicker">Jigsaw</p>
          <p className="stat-value">{acquiredPieces.length} / {TOTAL_PIECES} pieces</p>
          <JigsawBoard
            artwork={userImage}
            acquiredPieces={acquiredPieces}
            complete={false}
          />
          <p className="meta-line">Seat every piece in the forge, then return here to name the recipient.</p>
        </section>
      )}

      {phase === "name" && (
        <form className="section-block recipient-form" onSubmit={submitName}>
          <p>Who should this credential be issued to?</p>
          <label className="recipient-label" htmlFor="recipient-name">Recipient name</label>
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
          {nameError && <p className="recipient-error" role="alert">{nameError}</p>}
          <p className="meta-line">Required. Capitalization is kept as you type.</p>
          <Button type="submit">Continue</Button>
        </form>
      )}

      {phase === "preview" && (
        <section className="section-block">
          {artifact}
          <p className="meta-line">This name will appear on your credential.</p>
          <div className="quiz-nav quiz-nav-end">
            <Button variant="secondary" onClick={() => setPhase("name")}>Edit name</Button>
            <Button onClick={() => setPhase("issued")}>Confirm certificate</Button>
          </div>
        </section>
      )}

      {phase === "issued" && (
        <>
          <section className="section-block certificate-reveal">
            {artifact}
          </section>

          {(loadingCredential || onChainCredential) && (
            <section className="section-block">
              <h2>On-chain record</h2>
              {loadingCredential && <p role="status">Loading credential from Fuji…</p>}
              {!loadingCredential && onChainCredential && (
                <CredentialRecord credential={onChainCredential} />
              )}
            </section>
          )}
          {!loadingCredential && !onChainCredential && !mintTx && (
            <EmptyState
              title={EMPTY_STATES.noCredential.title}
              body={EMPTY_STATES.noCredential.body}
            />
          )}

          {mintTx && (
            <p className="mint-success">
              Minted.{" "}
              <a href={`${FUJI_EXPLORER_TX}${mintTx}`} target="_blank" rel="noreferrer">
                View transaction on Snowtrace
              </a>
            </p>
          )}

          <div className="certificate-actions">
            <Button
              onClick={handleMint}
              disabled={minting || !!mintTx || !CONTRACT_ADDRESS || !savedName.ok}
            >
              {minting
                ? "Minting..."
                : mintTx
                  ? "Minted on-chain"
                  : CONTRACT_ADDRESS
                    ? "Claim credential on Fuji"
                    : "Mint (deploy contract first)"}
            </Button>
            <Button variant="secondary" onClick={onRetry}>Start over</Button>
          </div>
          {mintError && (
            <EmptyState
              variant="error"
              title={ERROR_STATES.mint.title}
              body={`${mintError} ${ERROR_STATES.mint.body}`}
            />
          )}
          {!CONTRACT_ADDRESS && (
            <p className="deploy-hint">
              Deploy with <code>npm run deploy:fuji</code> to enable on-chain minting.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default Certificate;
