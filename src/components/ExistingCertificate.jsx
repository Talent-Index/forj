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

  return (
    <section className="section-block existing-certificate" aria-labelledby="existing-certificate-heading">
      <h2 id="existing-certificate-heading">Your Fuji certificate</h2>
      <p>
        The current soulbound record for this wallet. Forjora keeps one live token per wallet;
        a later mint replaces it. Lookup shows that the token exists — it is not issuer attestation.
      </p>

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
        <p role="status">Loading this wallet's Fuji certificate…</p>
      ) : !credential ? (
        <>
          <EmptyState
            title={EMPTY_STATES.noCredential.title}
            body={error || EMPTY_STATES.noCredential.body}
          />
          {actions ? <div className="certificate-actions">{actions}</div> : null}
        </>
      ) : (
        <>
          <p className="certificate-status-row">
            <CredentialStatusBadge status={status} />
            <span className="meta-line">
              Token #{credential.credentialId}
              {mintedDay(credential) ? ` · ${mintedDay(credential)} UTC` : ""}
              {` · ${credential.completion?.puzzlePieces ?? 0}/${TOTAL_PIECES} pieces`}
            </span>
          </p>
          <div className="existing-certificate-layout">
            <CertificateArtifact
              artwork={artworkSrc(credential, artworkFallback)}
              recipientName={recipientName}
              scorePercent={quizPercent(scores)}
              difficulty={highestDifficulty(scores)}
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
            />
            <div className="existing-certificate-record">
              {view ? <CredentialDetails view={view} /> : null}
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
              {showQr && shareUrl ? <CredentialQr url={shareUrl} /> : null}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default ExistingCertificate;
