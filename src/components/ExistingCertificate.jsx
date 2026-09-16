import { LEARNING_PATHS } from "../data/learning";
import { TOTAL_PIECES } from "../data/questions";
import {
  CREDENTIAL_SCHEMA_VERSION,
} from "../utils/credentialModel";
import { CONTRACT_ADDRESS, FUJI_CHAIN_ID } from "../utils/contract";
import { retrievalUrl } from "../utils/credentialMetadata";
import { lookupShareUrl, publicCredentialPath } from "../utils/credentialLookup";
import { EMPTY_STATES } from "../utils/onboarding";
import { safeMediaSrc } from "../utils/frontendSecurity";
import {
  highestDifficulty,
  quizPercent,
  sectionScoresFromCredential,
} from "../utils/certificateView";
import { resolveCredentialStatus } from "../utils/credentialStatus";
import CertificateArtifact from "./CertificateArtifact";
import CredentialDetails from "./CredentialDetails";
import CredentialQr from "./CredentialQr";
import CredentialStatusBadge from "./CredentialStatusBadge";
import EmptyState from "./EmptyState";
import { Button } from "./ui/primitives";

const PATH_LABEL = LEARNING_PATHS[0]?.name || "Avalanche Developer Path";

function artworkSrc(credential, fallback) {
  const uri = credential?.imageUri || credential?.image || "";
  return safeMediaSrc(uri) || safeMediaSrc(retrievalUrl(uri)) || fallback || "";
}

function mintedDay(credential) {
  const iso = credential?.completion?.mintedAtIso || "";
  return iso ? iso.slice(0, 10) : "";
}

function ExistingCertificate({
  credential,
  view,
  loading = false,
  error = "",
  walletConnected = false,
  recipientName = "",
  artworkFallback = "",
  onLookup,
  onConnectWallet,
  showQr = true,
  actions = null,
}) {
  const status = resolveCredentialStatus(credential);
  const scores = sectionScoresFromCredential(credential);
  const sharePath = credential?.credentialId
    ? publicCredentialPath({
        tokenId: String(credential.credentialId),
        wallet: credential.walletAddress,
      })
    : "";
  const shareUrl = credential?.credentialId
    ? lookupShareUrl({
        tokenId: String(credential.credentialId),
        wallet: credential.walletAddress,
      })
    : "";
  const points = credential?.score?.totalPoints;
  const maxPoints = credential?.score?.maxPoints;
  const difficulty = highestDifficulty(scores);

  return (
    <section className="existing-certificate" aria-labelledby="existing-certificate-heading">
      <header className="existing-certificate-head">
        <h2 id="existing-certificate-heading">Your Fuji certificate</h2>
        <p className="lede">
          The live soulbound record for this wallet. Lookup proves the token exists; it does not make a claimed score issuer-attested.
        </p>
      </header>

      {!walletConnected ? (
        <>
          <EmptyState
            title="Connect a wallet to load it"
            body="Progress lives on your account. A wallet is only needed to read or mint the Fuji certificate."
            actionLabel={onConnectWallet ? "Connect wallet" : undefined}
            onAction={onConnectWallet}
          />
          {actions ? <div className="certificate-actions">{actions}</div> : null}
        </>
      ) : loading ? (
        <p role="status">Loading this wallet&apos;s Fuji certificate…</p>
      ) : !credential ? (
        <>
          <EmptyState
            title={EMPTY_STATES.noCredential.title}
            body={error || EMPTY_STATES.noCredential.body}
            doodle={EMPTY_STATES.noCredential.doodle}
          />
          {actions ? <div className="certificate-actions">{actions}</div> : null}
        </>
      ) : (
        <div className="existing-certificate-body">
          <p className="existing-certificate-status">
            <CredentialStatusBadge status={status} />
            <span className="meta-line">
              Token #{credential.credentialId}
              {mintedDay(credential) ? ` · ${mintedDay(credential)}` : ""}
              {` · ${credential.completion?.puzzlePieces ?? 0}/${TOTAL_PIECES} pieces`}
            </span>
          </p>

          <div className="existing-certificate-frame">
            <CertificateArtifact
              artwork={artworkSrc(credential, artworkFallback)}
              recipientName={recipientName}
              scorePercent={quizPercent(scores)}
              difficulty={difficulty}
              pathLabel={PATH_LABEL}
              credentialId={`#${credential.credentialId}`}
              verificationStatus={status.id}
              walletAddress={credential.walletAddress}
              chainId={credential.chainId || FUJI_CHAIN_ID}
              contractAddress={credential.contractAddress || CONTRACT_ADDRESS}
              schemaVersion={credential.version?.schema || CREDENTIAL_SCHEMA_VERSION}
              metadataUri={credential.metadataUri}
              explorerUrl={credential.explorerUrl}
              verificationUrl={sharePath}
              compact
              quiet
            />
          </div>

          <dl className="existing-certificate-summary">
            {points != null ? (
              <div>
                <dt>Score</dt>
                <dd>
                  {points}
                  {maxPoints ? ` / ${maxPoints}` : ""} pts
                  {difficulty ? ` · ${difficulty}` : ""}
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Network</dt>
              <dd>Avalanche Fuji</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{status.label}</dd>
            </div>
          </dl>

          <p className="note">
            {recipientName
              ? "Recipient name is from your account. It is not stored on-chain."
              : "Recipient name is not part of the on-chain record."}
          </p>

          <div className="certificate-actions">
            {onLookup ? (
              <Button
                variant="secondary"
                onClick={() => onLookup(credential.credentialId, credential.walletAddress)}
              >
                Open public lookup
              </Button>
            ) : null}
            {actions}
          </div>

          {view ? (
            <details className="existing-certificate-details">
              <summary>Full verification fields</summary>
              <CredentialDetails view={view} />
            </details>
          ) : null}

          {showQr && shareUrl ? (
            <div className="existing-certificate-qr">
              <CredentialQr url={shareUrl} />
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

export default ExistingCertificate;
