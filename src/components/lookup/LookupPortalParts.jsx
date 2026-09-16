import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/primitives";
import EmptyState from "../EmptyState";
import CredentialDetails from "../CredentialDetails";
import CredentialQr from "../CredentialQr";
import CredentialStatusBadge from "../CredentialStatusBadge";
import CertificateArtifact from "../CertificateArtifact";
import { Doodle } from "../doodles";
import { EXPLORER_LINK_LABEL } from "../../utils/credentialStatus";
import { retrievalUrl } from "../../utils/credentialMetadata";
import { publicCredentialPath } from "../../utils/credentialLookup";
import { browserSupportsCameraScan, startCredentialQrScan } from "../../utils/credentialQrScan";
import { safeExternalHref } from "../../utils/frontendSecurity";
import { EMPTY_STATES } from "../../utils/onboarding";

export function LookupHero() {
  return (
    <header className="page-header lookup-hero">
      <h1>Credential Lookup</h1>
      <p className="lede">
        Verify a Forjora credential and explore the evidence behind it.
        Looking it up does not make a Forjora claimed score issuer-attested.
      </p>
    </header>
  );
}

export function CredentialSearch({
  tokenInput,
  walletInput,
  onTokenChange,
  onWalletChange,
  onSubmit,
  onClear,
  loading = false,
  disabled = false,
  onScanUrl,
}) {
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [showWallet, setShowWallet] = useState(Boolean(walletInput));
  const videoRef = useRef(null);
  const stopScanRef = useRef(null);
  const cameraOk = typeof window !== "undefined" && browserSupportsCameraScan();

  useEffect(
    () => () => {
      stopScanRef.current?.();
      stopScanRef.current = null;
    },
    []
  );

  useEffect(() => {
    if (walletInput) setShowWallet(true);
  }, [walletInput]);

  function stopScan() {
    stopScanRef.current?.();
    stopScanRef.current = null;
    setScanning(false);
  }

  async function startScan() {
    setScanError("");
    if (!cameraOk) {
      setScanError("Camera scanning is not available here. Paste a credential URL or enter a credential ID.");
      return;
    }
    setScanning(true);
    await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
    const stop = await startCredentialQrScan({
      video: videoRef.current,
      onDetect: (raw) => {
        setScanning(false);
        stopScanRef.current = null;
        onScanUrl?.(raw);
      },
      onError: (message) => {
        setScanError(message);
        setScanning(false);
        stopScanRef.current = null;
      },
    });
    stopScanRef.current = stop;
  }

  return (
    <section className="lookup-search" aria-label="Credential lookup">
      <form className="lookup-search-form" onSubmit={onSubmit}>
        <label className="lookup-search-label" htmlFor="lookup-token">
          Credential ID or share URL
        </label>
        <div className="lookup-verify-row">
          <input
            id="lookup-token"
            className="recipient-input lookup-verify-input"
            value={tokenInput}
            onChange={(event) => onTokenChange?.(event.target.value)}
            placeholder="Credential ID or paste share URL"
            inputMode="text"
            disabled={disabled || loading}
            autoComplete="off"
          />
          <Button type="submit" disabled={disabled || loading}>
            {loading ? "Verifying…" : "Verify"}
          </Button>
        </div>

        <div className="lookup-search-secondary">
          {cameraOk ? (
            !scanning ? (
              <Button type="button" variant="ghost" onClick={startScan} disabled={disabled || loading}>
                <Doodle type="certificate" size={14} variant="ink" /> Scan QR
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={stopScan}>
                Stop scan
              </Button>
            )
          ) : null}
          {tokenInput || walletInput ? (
            <button
              type="button"
              className="btn btn-ghost lookup-clear"
              onClick={onClear}
              disabled={loading}
            >
              Clear
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setShowWallet((open) => !open)}
            aria-expanded={showWallet}
          >
            {showWallet ? "Hide wallet filter" : "Optional wallet filter"}
          </button>
        </div>

        {showWallet ? (
          <div className="lookup-wallet-field">
            <label className="lookup-search-label" htmlFor="lookup-wallet">
              Holder wallet <span className="meta-line">(optional)</span>
            </label>
            <input
              id="lookup-wallet"
              className="recipient-input"
              value={walletInput}
              onChange={(event) => onWalletChange?.(event.target.value)}
              placeholder="0x…"
              autoComplete="off"
              spellCheck="false"
              disabled={disabled || loading}
            />
          </div>
        ) : null}

        {scanning ? (
          <div className="lookup-scan-live">
            <video ref={videoRef} className="lookup-scan-video" muted playsInline />
            <p className="meta-line">Point the camera at a Forjora credential QR code.</p>
          </div>
        ) : null}
        {scanError ? <p className="note" role="status">{scanError}</p> : null}
      </form>
    </section>
  );
}

export function VerificationStatusBanner({
  state,
  verification,
  queryLabel = "",
  onRetry,
}) {
  if (state === "loading") {
    return (
      <div className="verification-state verification-state-pending lookup-status" role="status">
        <p className="kicker">Credential lookup</p>
        <h2>Looking up on Fuji…</h2>
        <p className="meta-line">Reading the on-chain record.</p>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="verification-state verification-state-none lookup-status" role="alert">
        <h2>Invalid credential ID</h2>
        <p className="meta-line">Enter a credential ID, paste a share URL, or scan a QR code.</p>
        {onRetry ? (
          <div className="certificate-actions">
            <Button variant="secondary" onClick={onRetry}>Try again</Button>
          </div>
        ) : null}
      </div>
    );
  }

  if (state === "not-found") {
    return (
      <div className="verification-state verification-state-none lookup-status" role="status">
        <h2>Credential not found</h2>
        <p className="meta-line">Check the credential ID and try again.</p>
        {queryLabel ? (
          <p className="meta-line">
            No record for <span className="credential-mono">{queryLabel}</span>.
          </p>
        ) : null}
        <EmptyState
          title={EMPTY_STATES.noLookup.title}
          body={EMPTY_STATES.noLookup.body}
          doodle={EMPTY_STATES.noLookup.doodle}
          actionLabel={onRetry ? "Try again" : undefined}
          onAction={onRetry}
        />
      </div>
    );
  }

  if (state === "revoked") {
    return (
      <div className="verification-state verification-state-revoked lookup-status" role="alert">
        <h2>Credential revoked</h2>
        <p className="meta-line">
          This credential is no longer valid
          {queryLabel ? (
            <>
              {" "}
              (<span className="credential-mono">{queryLabel}</span>)
            </>
          ) : null}
          .
        </p>
      </div>
    );
  }

  if (state === "replaced") {
    return (
      <div className="verification-state verification-state-none lookup-status" role="status">
        <h2>This credential has been replaced by a newer credential</h2>
        <p className="meta-line">A newer on-chain record supersedes this one.</p>
      </div>
    );
  }

  if (state === "owner-mismatch" && verification) {
    return (
      <div
        className="verification-state verification-state-claimed verification-ownership-mismatch lookup-status"
        role="status"
      >
        <h2>Holder does not match</h2>
        <p className="meta-line">
          This token exists on Fuji, but the on-chain holder is not the wallet in the URL.
          The record below is still the live Fuji credential for this token ID.
        </p>
      </div>
    );
  }

  if (state === "found" && verification) {
    return null;
  }

  return null;
}

function publicSkills(view) {
  const skills = [];
  const attrs = view?.metadata?.attributes || [];
  for (const trait of attrs) {
    const key = String(trait.trait_type || "").toLowerCase();
    if (key.includes("skill") || key === "track" || key === "path") {
      const value = String(trait.value || "").trim();
      if (value) skills.push(value);
    }
  }
  return [...new Set(skills)].slice(0, 8);
}

function buildEvidence(view) {
  const rows = [];
  for (const check of view?.verification?.checks || []) {
    rows.push({ id: check.id, label: check.label, ok: check.ok });
  }
  if (Number.isInteger(view?.puzzlePieces) && Number.isInteger(view?.puzzleTotal)) {
    rows.push({
      id: "puzzle",
      label: `${view.puzzlePieces} / ${view.puzzleTotal} puzzle pieces collected`,
      ok: view.puzzlePieces >= view.puzzleTotal,
    });
  }
  if (view?.difficultyDetail) {
    rows.push({
      id: "difficulty",
      label: `Quiz seating · ${view.difficultyDetail}`,
      ok: true,
    });
  }
  return rows;
}

export function CredentialResultHeader({ view }) {
  if (!view) return null;
  const attested = view.statusId === "attested";
  return (
    <header className="lookup-result-header">
      <p className={`lookup-status-line ${attested ? "is-attested" : "is-claimed"}`}>
        <span className="lookup-status-mark" aria-hidden="true">
          {attested ? "✓" : "○"}
        </span>
        <span className="kicker">{attested ? "Issuer-Attested" : "Forjora Claimed"}</span>
      </p>
      <h2 className="lookup-credential-title">{view.title || "Forjora credential"}</h2>
      {view.difficulty ? <p className="lookup-credential-level">{view.difficulty}</p> : null}
      <div className="lookup-awarded">
        <p className="meta-line">Awarded to</p>
        <p className="lookup-awarded-name">{view.holderWalletShort || "Holder"}</p>
        <p className="meta-line">On-chain holder wallet</p>
        {safeExternalHref(view.holderExplorerUrl) ? (
          <a
            href={safeExternalHref(view.holderExplorerUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="meta-line"
          >
            View holder on Snowtrace
          </a>
        ) : null}
      </div>
      <div className="lookup-status-badge-row">
        <CredentialStatusBadge status={view.statusId} />
      </div>
    </header>
  );
}

export function CredentialShowcase({ view, artwork }) {
  if (!view) return null;
  const image = artwork || retrievalUrl(view.metadata?.image) || "";
  return (
    <section className="lookup-showcase" aria-label="Certificate preview">
      <h3 className="lookup-section-title">Certificate Preview</h3>
      <div className="lookup-certificate-frame">
        <CertificateArtifact
          artwork={image}
          recipientName={view.holderWalletShort || "Learner"}
          scorePercent={
            view.score != null && view.score !== "" && view.maxPoints
              ? Math.min(100, Math.round((Number(view.score) / Number(view.maxPoints)) * 100))
              : view.score != null && view.score !== ""
                ? Math.min(100, Math.round((Number(view.score) / 80) * 100))
                : 0
          }
          difficulty={view.difficulty || "…"}
          pathLabel={view.title || "Avalanche Developer Path"}
          credentialId={view.tokenId ? `#${view.tokenId}` : "…"}
          verificationStatus={view.statusId}
          walletAddress={view.holderWallet}
          chainId={view.chainId}
          contractAddress={view.contractAddress}
          metadataUri={view.metadataUrl}
          explorerUrl={view.explorerUrl}
          verificationUrl={publicCredentialPath({ tokenId: view.tokenId, wallet: view.holderWallet })}
          compact
          quiet
        />
      </div>
    </section>
  );
}

export function SkillEvidencePanel({ view }) {
  if (!view) return null;
  const skills = publicSkills(view);
  const evidence = buildEvidence(view);
  return (
    <>
      <section className="lookup-section" aria-label="Skills">
        <h3 className="lookup-section-title">Skills</h3>
        {skills.length ? (
          <ul className="lookup-skill-list">
            {skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        ) : (
          <p className="meta-line">Skill labels are not present on this credential&apos;s on-chain metadata.</p>
        )}
      </section>
      <section className="lookup-section" aria-label="Evidence">
        <h3 className="lookup-section-title">Evidence</h3>
        {evidence.length ? (
          <ul className="verification-checks lookup-evidence-list">
            {evidence.map((row) => (
              <li key={row.id} className={row.ok ? "is-ok" : "is-miss"}>
                {row.ok ? "✓" : "×"} {row.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="meta-line">Evidence is unavailable for this record.</p>
        )}
      </section>
    </>
  );
}

export function AchievementSummaryStrip({ view }) {
  if (!view) return null;
  const max = view.maxPoints || 80;
  const points = view.score !== "" && view.score != null ? view.score : null;
  return (
    <section className="lookup-section" aria-label="Credential snapshot">
      <h3 className="lookup-section-title">Credential Snapshot</h3>
      {points != null ? (
        <p className="lookup-snapshot-score">
          <span className="lookup-snapshot-number">
            {points} / {max}
          </span>
          <span className="kicker">Points</span>
        </p>
      ) : (
        <p className="meta-line">Points snapshot is not available on this record.</p>
      )}
      {view.difficultyRows?.length ? (
        <dl className="lookup-snapshot-rows">
          {view.difficultyRows.map((row) => (
            <div key={row.id}>
              <dt>{row.name}</dt>
              <dd>
                {row.correct} / {row.total}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p className="note">Recorded at mint time. This is not a live learning score.</p>
    </section>
  );
}

export function VerificationDetailsPanel({ view }) {
  if (!view) return null;
  return (
    <section className="lookup-section" aria-label="On-chain record">
      <h3 className="lookup-section-title">On-chain Record</h3>
      <dl className="lookup-def-list">
        <div>
          <dt>Network</dt>
          <dd>{view.network || "Avalanche Fuji"}</dd>
        </div>
        <div>
          <dt>Contract</dt>
          <dd>Forjora credential</dd>
        </div>
        {view.contractAddress ? (
          <div>
            <dt>Address</dt>
            <dd className="credential-mono">{view.contractAddress}</dd>
          </div>
        ) : null}
        <div>
          <dt>Token ID</dt>
          <dd className="credential-mono">{view.tokenId ? `#${view.tokenId}` : "…"}</dd>
        </div>
        {view.mintedLabel ? (
          <div>
            <dt>Minted</dt>
            <dd>{view.mintedLabel}</dd>
          </div>
        ) : null}
        <div>
          <dt>Issuer</dt>
          <dd>{view.issuer || "…"}</dd>
        </div>
        {view.transactionHash ? (
          <div>
            <dt>Transaction</dt>
            <dd>
              {safeExternalHref(view.transactionExplorerUrl) ? (
                <a href={safeExternalHref(view.transactionExplorerUrl)} target="_blank" rel="noopener noreferrer">
                  {view.transactionHash.slice(0, 10)}…{view.transactionHash.slice(-8)}
                </a>
              ) : (
                <span className="credential-mono">{view.transactionHash}</span>
              )}
            </dd>
          </div>
        ) : null}
      </dl>
      {safeExternalHref(view.explorerUrl) ? (
        <p className="lookup-explorer-link">
          <a href={safeExternalHref(view.explorerUrl)} target="_blank" rel="noopener noreferrer">
            {EXPLORER_LINK_LABEL} →
          </a>
        </p>
      ) : null}
      <details className="lookup-details-fold">
        <summary>Full verification fields</summary>
        <CredentialDetails view={view} />
      </details>
    </section>
  );
}

export function TrustExplainer({ view }) {
  if (!view) return null;
  const attested = view.statusId === "attested";
  const claimedCopy =
    "This credential exists on the Avalanche network. It was claimed by the learner and contains a snapshot of their credential data. It is not issuer-attested.";
  const attestedCopy =
    "This credential was minted using an authorized issuer signature.";
  return (
    <details className="lookup-trust-explainer">
      <summary>What does this status mean?</summary>
      <p>{attested ? attestedCopy : claimedCopy}</p>
      {view.statusBody ? <p className="meta-line">{view.statusBody}</p> : null}
      <p className="note">
        Finding a record proves the token exists on Fuji. It does not turn a claimed score into an issuer assessment.
      </p>
    </details>
  );
}

export function QRCodeCard({ shareUrl }) {
  if (!shareUrl) return null;
  return (
    <section className="lookup-section lookup-qr-card" aria-label="Share QR">
      <h3 className="lookup-section-title">Confirm this credential</h3>
      <p className="meta-line">Scan to open this public credential URL.</p>
      <div className="lookup-qr-frame">
        <CredentialQr url={shareUrl} label="QR code for this credential URL" />
      </div>
    </section>
  );
}

export function CredentialActions({
  shareUrl,
  path,
  copied,
  onCopy,
  onPrint,
}) {
  const linkedIn =
    shareUrl && typeof window !== "undefined"
      ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
      : "";

  return (
    <section className="lookup-section lookup-actions" aria-label="Share actions">
      <h3 className="lookup-section-title">Shareable URL</h3>
      {shareUrl ? (
        <p className="credential-share-url">
          <a href={path || shareUrl}>{shareUrl}</a>
        </p>
      ) : null}
      <div className="certificate-actions lookup-action-row">
        <Button type="button" variant="secondary" onClick={onCopy} disabled={!shareUrl}>
          {copied ? "Copied" : "Share"}
        </Button>
        <Button type="button" variant="ghost" onClick={onPrint}>
          Download
        </Button>
        {safeExternalHref(linkedIn) ? (
          <a className="btn btn-ghost" href={safeExternalHref(linkedIn)} target="_blank" rel="noopener noreferrer">
            Share to LinkedIn
          </a>
        ) : null}
      </div>
    </section>
  );
}


