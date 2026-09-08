import { useMemo, useState } from "react";
import { TOTAL_PIECES } from "../../data/questions";
import {
  VAULT_FILTERS,
  VAULT_SORTS,
  buildCredentialVault,
  filterVaultItems,
  sortVaultItems,
} from "../../utils/credentialVault";
import { TIER_ROMAN } from "../../utils/achievementCatalog";
import EmptyState from "../EmptyState";
import ExistingCertificate from "../ExistingCertificate";
import CertificateArtifact from "../CertificateArtifact";
import CertificateViewer from "../achievements/CertificateViewer";
import { CredentialStatus, PuzzleProgress, PuzzleMilestoneList } from "../achievements";
import CredentialStatusBadge from "../CredentialStatusBadge";
import JigsawBoard from "../JigsawBoard";
import { Button } from "../ui/primitives";
import { AnimatedDoodle, Doodle, DoodleText } from "../doodles";
import { fragmentProgress } from "../../utils/fragments";
import { FRAGMENTS_PER_PIECE } from "../../utils/quizConfig";
import { CREDENTIAL_STATES } from "../../utils/credentialStatus";
import { publicCredentialPath } from "../../utils/credentialLookup";
import {
  CredentialCard,
  CredentialDetail,
  CredentialFilterBar,
  FeaturedCredential,
  VaultAchievementStrip,
  VaultHero,
} from "./VaultParts";

function CredentialVault({
  acquiredPieces = [],
  sectionScores = {},
  progress = null,
  learningCtx = null,
  onChainCredential = null,
  verificationView = null,
  loadingCredential = false,
  credentialError = "",
  puzzleComplete = false,
  pathLabel = "Avalanche Developer Path",
  recipientName = "",
  issuedName = "",
  userImage,
  totalPoints = 0,
  puzzleFragments = 0,
  skillHighlights = [],
  masteryLines = [],
  onChainStatus = CREDENTIAL_STATES.claimed,
  certId = "",
  address = "",
  onLookup,
  onPuzzle,
  onLearn,
  onProgress,
  onConnectWallet,
  onContinuePathMint,
  savedNameOk = false,
}) {
  const [filterId, setFilterId] = useState("all");
  const [sortId, setSortId] = useState("newest");
  const [selectedId, setSelectedId] = useState(null);
  const [shareNote, setShareNote] = useState("");

  const vault = useMemo(
    () =>
      buildCredentialVault({
        acquiredPieces,
        sectionScores,
        progress,
        learningCtx,
        onChainCredential,
        puzzleComplete,
        pathLabel,
        recipientName: issuedName || recipientName,
      }),
    [
      acquiredPieces,
      sectionScores,
      progress,
      learningCtx,
      onChainCredential,
      puzzleComplete,
      pathLabel,
      issuedName,
      recipientName,
    ]
  );

  const visibleItems = useMemo(
    () => sortVaultItems(filterVaultItems(vault.items, filterId), sortId),
    [vault.items, filterId, sortId]
  );

  const selected = vault.items.find((item) => item.id === selectedId) || null;
  const fragments = fragmentProgress(puzzleFragments);
  const displayName = issuedName || recipientName || "Learner";

  function handleVerify(item) {
    if (item?.onChain && item.tokenId) {
      onLookup?.(item.tokenId, address);
      return;
    }
    onLookup?.();
  }

  async function handleShare(item) {
    if (!item?.onChain || !item.tokenId) return;
    const path = publicCredentialPath({ tokenId: item.tokenId, wallet: address });
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${path}`
        : path;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareNote("Share URL copied");
        window.setTimeout(() => setShareNote(""), 1600);
      } else {
        onLookup?.(item.tokenId, address);
      }
    } catch {
      onLookup?.(item.tokenId, address);
    }
  }

  function handleContinue(item) {
    if (item?.kind === "path") {
      if (puzzleComplete) onContinuePathMint?.(savedNameOk ? "preview" : "name");
      else onPuzzle?.();
      return;
    }
    if (item?.kind === "track" && item.raw?.quizId) {
      onPuzzle?.(item.raw.trackId);
      return;
    }
    onLearn?.();
  }

  if (selected) {
    return (
      <CredentialDetail
        item={selected}
        recipientName={displayName}
        onBack={() => setSelectedId(null)}
        onVerify={handleVerify}
        onShare={handleShare}
        onContinue={handleContinue}
      >
        {selected.kind === "path" && selected.onChain ? (
          <CertificateArtifact
            artwork={userImage}
            recipientName={displayName}
            pathLabel={pathLabel}
            credentialId={selected.credentialId || certId}
            verificationStatus={selected.statusId}
            walletAddress={address}
            compact
          />
        ) : null}
        {selected.kind === "learning" && selected.raw ? (
          <CertificateViewer
            certificate={selected.raw}
            recipientName={displayName}
            compact
          />
        ) : null}
        {selected.kind === "track" ? (
          <div className="card featured-credential-preview">
            <p className="certificate-brand">Forjora</p>
            <p className="kicker">{selected.level}</p>
            <p className="featured-preview-title">{selected.name}</p>
            <p className="meta-line">Track certificate · off-chain</p>
          </div>
        ) : null}
      </CredentialDetail>
    );
  }

  return (
    <div className="credential-vault">
      <VaultHero stats={vault.stats} />

      <section className="section-block credentials-journey" aria-label="Credential journey">
        <p className="kicker">Journey</p>
        <ol className="credentials-journey-steps">
          {[
            {
              id: "learn",
              label: "Learn",
              done: acquiredPieces.length > 0 || vault.stats.credentialsEarned > 0,
            },
            {
              id: "puzzle",
              label: "Puzzle",
              done: acquiredPieces.length > 0,
            },
            {
              id: "certs",
              label: "Certificates",
              done: vault.stats.credentialsEarned > 0,
            },
            {
              id: "path",
              label: "Path",
              done: puzzleComplete,
            },
            {
              id: "fuji",
              label: "Fuji",
              done: Boolean(onChainCredential),
              alert: puzzleComplete && !onChainCredential,
            },
          ].map((step) => (
            <li
              key={step.id}
              className={[step.done ? "is-done" : "", step.alert ? "has-alert" : ""]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="credentials-journey-label">{step.label}</span>
            </li>
          ))}
        </ol>
        <p className="meta-line">
          Learn → puzzle → certificates → optional claimed Fuji path snapshot.
        </p>
      </section>

      <ExistingCertificate
        credential={onChainCredential}
        view={verificationView}
        loading={loadingCredential}
        error={credentialError}
        walletConnected={Boolean(address)}
        recipientName={displayName}
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

      {vault.featured ? (
        <FeaturedCredential
          item={vault.featured}
          onView={(item) => setSelectedId(item.id)}
          onVerify={handleVerify}
          onShare={handleShare}
        />
      ) : null}

      <VaultAchievementStrip
        level={progress?.level}
        xp={progress?.xp}
        streak={progress?.currentStreak ?? progress?.streak}
        skills={skillHighlights}
      />

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
            <p className="lede">
              {TOTAL_PIECES} / {TOTAL_PIECES} pieces · Path certificate ready
            </p>
            <div className="certificate-actions">
              <Button onClick={() => onContinuePathMint?.(savedNameOk ? "preview" : "name")}>
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

      {(skillHighlights.length > 0 || masteryLines.length > 0) && (
        <section className="section-block">
          <h2>Skills demonstrated</h2>
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
        </section>
      )}

      <section className="section-block vault-grid-section">
        <h2>Vault</h2>
        <p className="meta-line">
          Track and learning certificates are off-chain. Fuji path records are claimed or issuer-attested.
        </p>
        <CredentialFilterBar
          filters={VAULT_FILTERS}
          filterId={filterId}
          onFilter={setFilterId}
          sorts={VAULT_SORTS}
          sortId={sortId}
          onSort={setSortId}
        />
        {shareNote ? <p className="meta-line" role="status">{shareNote}</p> : null}
        {vault.stats.credentialsEarned === 0 && filterId === "all" ? (
          <EmptyState
            doodle="certificate"
            title="Your credentials"
            body="You have not earned credentials yet. Complete learning tracks, collect puzzle pieces, and demonstrate mastery."
            actionLabel="Explore learning"
            onAction={onLearn}
          />
        ) : null}
        {visibleItems.length === 0 ? (
          <p className="meta-line">No credentials match this filter.</p>
        ) : (
          <div className="vault-grid">
            {visibleItems.map((item) => (
              <CredentialCard
                key={item.id}
                item={item}
                onView={(row) => setSelectedId(row.id)}
                onVerify={handleVerify}
                onContinue={handleContinue}
                onShare={handleShare}
              />
            ))}
          </div>
        )}
      </section>

      <section className="section-block path-credential-panel">
        <p className="kicker">Path credential</p>
        <h2>Claimed Fuji snapshot</h2>
        <p className="meta-line">
          One optional claimed mint after all sixteen pieces. Learning and track certificates stay off-chain.
        </p>
        <p className="stat-value">
          {acquiredPieces.length} / {TOTAL_PIECES} pieces
        </p>
        <div className="certificate-actions">
          {puzzleComplete ? (
            <Button onClick={() => onContinuePathMint?.(savedNameOk ? "preview" : "name")}>
              Name & mint path credential
            </Button>
          ) : (
            <Button onClick={() => onPuzzle?.()}>Continue forging</Button>
          )}
          {onLookup ? (
            <Button variant="secondary" onClick={() => onLookup()}>
              Look up a credential
            </Button>
          ) : null}
          {onProgress ? (
            <Button variant="ghost" onClick={onProgress}>
              <Doodle type="badge" size={14} variant="ink" /> Achievements
            </Button>
          ) : null}
        </div>
        {onChainCredential ? (
          <p className="certificate-status-row">
            <CredentialStatusBadge status={onChainStatus} />
            <span className="meta-line">Current on-chain status for this wallet</span>
          </p>
        ) : (
          <p className="meta-line">Learner mint is always Forjora claimed</p>
        )}
      </section>
    </div>
  );
}

export default CredentialVault;
