import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/primitives";
import EmptyState from "../EmptyState";
import CredentialDetails from "../CredentialDetails";
import CredentialQr from "../CredentialQr";
import CredentialStatusBadge from "../CredentialStatusBadge";
import CertificateArtifact from "../CertificateArtifact";
import { AnimatedDoodle, BlockchainConnect, Doodle } from "../doodles";
import { CREDENTIAL_STATES, EXPLORER_LINK_LABEL } from "../../utils/credentialStatus";
import { retrievalUrl } from "../../utils/credentialMetadata";
import { publicCredentialPath } from "../../utils/credentialLookup";
import { safeExternalHref } from "../../utils/frontendSecurity";
import { EMPTY_STATES } from "../../utils/onboarding";

export function LookupHero() {
  return (
    <header className="page-header lookup-hero">
      <p className="kicker">Credential lookup</p>
      <h1>Credential verification</h1>
      <p className="lede">
        Confirm a Forjora on-chain credential and explore the skills it records.
        Looking it up does not make a Forjora claimed score issuer-attested.
      </p>
      <p className="certificate-status-row">
        <CredentialStatusBadge status={CREDENTIAL_STATES.claimed} />
        <CredentialStatusBadge status={CREDENTIAL_STATES.attested} />
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
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimer = useRef(null);

  useEffect(() => () => stopScan(), []);

  function stopScan() {
    if (scanTimer.current) {
      window.clearInterval(scanTimer.current);
      scanTimer.current = null;
    }
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function startScan() {
    setScanError("");
    if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
      setScanError("QR camera scan is not supported in this browser. Paste a credential URL or enter a token ID.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setScanning(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      scanTimer.current = window.setInterval(async () => {
        if (!videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const raw = codes?.[0]?.rawValue || "";
          if (!raw) return;
          stopScan();
          onScanUrl?.(raw);
        } catch {
          /* keep scanning */
        }
      }, 700);
    } catch {
      setScanError("Camera access was blocked. Enter a token ID or paste a share URL instead.");
      stopScan();
    }
  }

  return (
    <section className="section-block lookup-search" aria-label="Credential lookup">
      <form className="lookup-search-form" onSubmit={onSubmit}>
        <div className="lookup-search-fields">
          <label className="recipient-label" htmlFor="lookup-token">
            Credential ID
          </label>
          <div className="lookup-input-row">
            <input
              id="lookup-token"
              className="recipient-input"
              value={tokenInput}
              onChange={(event) => onTokenChange?.(event.target.value)}
              placeholder="Example: 1"
              inputMode="numeric"
              disabled={disabled || loading}
              autoComplete="off"
            />
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
          </div>
          <label className="recipient-label" htmlFor="lookup-wallet">
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
        <div className="lookup-search-actions">
          <Button type="submit" disabled={disabled || loading}>
            {loading ? "Looking up…" : "Look up credential"}
          </Button>
        </div>
      </form>

      <div className="lookup-or" aria-hidden="true">
        <span>or</span>
      </div>

      <div className="lookup-scan">
        {!scanning ? (
          <Button type="button" variant="secondary" onClick={startScan} disabled={disabled || loading}>
            <Doodle type="certificate" size={14} variant="ink" /> Scan QR code
          </Button>
        ) : (
          <div className="lookup-scan-live">
            <video ref={videoRef} className="lookup-scan-video" muted playsInline />
            <Button type="button" variant="ghost" onClick={stopScan}>
              Stop scan
            </Button>
          </div>
        )}
        {scanError ? <p className="note" role="status">{scanError}</p> : null}
      </div>

      <p className="meta-line lookup-search-note">
        Securely confirm credentials recorded through the Forjora learning ecosystem on Avalanche Fuji.
      </p>
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
      <div className="verification-state verification-state-pending" role="status">
        <p className="kicker">Credential lookup</p>
        <h2>Looking up on Fuji…</h2>
        <p className="meta-line">Reading the on-chain record.</p>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="verification-state verification-state-none" role="alert">
        <p className="kicker">Invalid credential ID</p>
        <h2>Invalid credential identifier</h2>
        <p className="meta-line">Enter a token ID starting at 1, or a 0x holder wallet address.</p>
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
      <div className="verification-state verification-state-none" role="status">
        <p className="kicker">Credential not found</p>
        <h2>No record found</h2>
        {queryLabel ? (
          <p className="meta-line">
            We could not find a credential matching <span className="credential-mono">{queryLabel}</span>.
          </p>
        ) : null}
        <p className="meta-line">{verification?.summary}</p>
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
      <div className="verification-state verification-state-revoked" role="alert">
        <p className="kicker">Credential revoked</p>
        <h2>This credential is no longer considered valid</h2>
        <p className="meta-line">
          Credential ID: <span className="credential-mono">{queryLabel || "—"}</span>
        </p>
      </div>
    );
  }

  if (state === "owner-mismatch" && verification) {
    return (
      <div className="verification-state verification-state-claimed verification-ownership-mismatch" role="status">
        <p className="kicker">Holder check</p>
        <h2>Holder does not match</h2>
        <p className="meta-line">
          This token exists on Fuji, but the on-chain holder is not the wallet in the URL.
          The record below is still the live Fuji credential for this token ID.
        </p>
      </div>
    );
  }

  if (!verification) return null;

  const attested = verification.statusId === "attested";
  return (
    <div
      className={`verification-state verification-state-${verification.statusId} verification-ownership-${verification.ownership} lookup-result-banner`}
      role="status"
    >
      <p className="kicker">Forjora on-chain record</p>
      <h2>{attested ? "Issuer-attested credential" : "Claimed credential"}</h2>
      {attested ? (
        <span className="lookup-seal" aria-hidden="true">
          <BlockchainConnect trigger="immediate" active label="Attested" showCheck />
          <AnimatedDoodle type="seal" animation="stamp" trigger="success" active size={48} variant="accent" delay={1200} />
        </span>
      ) : (
        <span className="lookup-seal" aria-hidden="true">
          <BlockchainConnect trigger="immediate" active label="On-chain" showCheck />
          <AnimatedDoodle type="certificate" animation="draw" trigger="success" active size={40} variant="muted" />
        </span>
      )}
      {verification.checks?.length ? (
        <ul className="verification-checks">
          {verification.checks.map((check) => (
            <li key={check.id} className={check.ok ? "is-ok" : "is-miss"}>
              {check.ok ? "✓" : "×"} {check.label}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="meta-line">{verification.summary}</p>
      <p className="note">
        Finding a record proves the token exists on Fuji. It does not turn a claimed score into an issuer assessment.
      </p>
    </div>
  );
}

function publicSkills(view) {
  const skills = [];
  const attrs = view?.metadata?.attributes || [];
  for (const trait of attrs) {
    const key = String(trait.trait_type || "").toLowerCase();
    if (key.includes("skill") || key === "track" || key === "path" || key === "difficulty") {
      skills.push(String(trait.value));
    }
  }
  if (view?.difficulty) skills.push(`${view.difficulty} path difficulty`);
  if (view?.scoreLabel) skills.push(`Quiz score · ${view.scoreLabel}`);
  if (view?.difficultyDetail) skills.push("Easy / Medium / Hard quiz evidence on-chain");
  return [...new Set(skills.filter(Boolean))].slice(0, 8);
}

export function CredentialShowcase({ view, artwork }) {
  if (!view) return null;
  const image = artwork || retrievalUrl(view.metadata?.image) || "";
  return (
    <section className="lookup-showcase section-block" aria-label="Credential showcase">
      <p className="kicker">Credential</p>
      <CertificateArtifact
        artwork={image}
        recipientName={view.holderWalletShort || "Learner"}
        scorePercent={
          view.score != null && view.score !== ""
            ? Math.min(100, Math.round((Number(view.score) / 80) * 100))
            : 0
        }
        difficulty={view.difficulty || "—"}
        pathLabel={view.title || "Avalanche Developer Path"}
        credentialId={view.tokenId ? `#${view.tokenId}` : "—"}
        verificationStatus={view.statusId}
        walletAddress={view.holderWallet}
        chainId={view.chainId}
        contractAddress={view.contractAddress}
        metadataUri={view.metadataUrl}
        explorerUrl={view.explorerUrl}
        verificationUrl={publicCredentialPath({ tokenId: view.tokenId, wallet: view.holderWallet })}
        compact
      />
    </section>
  );
}

export function CredentialInformation({ view }) {
  if (!view) return null;
  return (
    <section className="section-block lookup-info" aria-label="Credential information">
      <h2>Credential information</h2>
      <dl className="lookup-info-list">
        <div>
          <dt>Credential ID</dt>
          <dd className="credential-mono">{view.tokenId ? `#${view.tokenId}` : "—"}</dd>
        </div>
        <div>
          <dt>Credential</dt>
          <dd>{view.title || "Forjora credential"}</dd>
        </div>
        <div>
          <dt>Level</dt>
          <dd>{view.difficulty || "—"}</dd>
        </div>
        <div>
          <dt>Score</dt>
          <dd>{view.scoreLabel || "—"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <CredentialStatusBadge status={view.statusId} />
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function LearnerPublicCard({ view }) {
  if (!view) return null;
  return (
    <section className="section-block lookup-learner" aria-label="Earned by">
      <h2>Earned by</h2>
      <div className="lookup-learner-card card">
        <div className="lookup-learner-avatar" aria-hidden="true">
          <Doodle type="badge" size={28} variant="accent" />
        </div>
        <div>
          <p className="stat-value">{view.holderWalletShort || "Holder"}</p>
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
      </div>
      <p className="note">Only public on-chain holder data is shown. No email or private account fields.</p>
    </section>
  );
}

export function SkillEvidencePanel({ view }) {
  if (!view) return null;
  const skills = publicSkills(view);
  const evidence = (view.verification?.checks || []).map((check) => ({
    label: check.label,
    ok: check.ok,
  }));
  return (
    <>
      <section className="section-block lookup-skills" aria-label="Skills demonstrated">
        <h2>Skills demonstrated</h2>
        <p className="meta-line">Public evidence from the on-chain credential snapshot.</p>
        {skills.length ? (
          <ul className="lookup-skill-grid">
            {skills.map((skill) => (
              <li key={skill} className="card lookup-skill-chip">
                {skill}
              </li>
            ))}
          </ul>
        ) : (
          <p className="meta-line">Skill labels appear when present in on-chain metadata.</p>
        )}
      </section>
      <section className="section-block lookup-evidence" aria-label="Evidence">
        <h2>Evidence</h2>
        <ul className="verification-checks">
          {evidence.map((row) => (
            <li key={row.label} className={row.ok ? "is-ok" : "is-miss"}>
              {row.ok ? "✓" : "×"} {row.label}
            </li>
          ))}
          {view.scoreLabel ? (
            <li className="is-ok">✓ Path score recorded · {view.scoreLabel}</li>
          ) : null}
          {view.difficultyDetail ? (
            <li className="is-ok">✓ Difficulty counts · {view.difficultyDetail}</li>
          ) : null}
        </ul>
      </section>
    </>
  );
}

export function AchievementSummaryStrip({ view }) {
  if (!view) return null;
  return (
    <section className="section-block lookup-achievements" aria-label="Achievement summary">
      <h2>Achievement summary</h2>
      <p className="meta-line">On-chain snapshot only — not a live learner dashboard.</p>
      <div className="stat-row vault-stat-row">
        <div className="card stat-compact">
          <p className="kicker">Score</p>
          <p className="stat-value">{view.scoreLabel || "—"}</p>
        </div>
        <div className="card stat-compact">
          <p className="kicker">Difficulty</p>
          <p className="stat-value vault-stat-level">{view.difficulty || "—"}</p>
        </div>
        <div className="card stat-compact">
          <p className="kicker">Token</p>
          <p className="stat-value">{view.tokenId ? `#${view.tokenId}` : "—"}</p>
        </div>
      </div>
    </section>
  );
}

export function VerificationDetailsPanel({ view }) {
  if (!view) return null;
  return (
    <section className="section-block lookup-verification-details" aria-label="Lookup details">
      <h2>On-chain details</h2>
      <dl className="lookup-info-list">
        <div>
          <dt>Status</dt>
          <dd>
            <CredentialStatusBadge status={view.statusId} />
          </dd>
        </div>
        <div>
          <dt>Credential ID</dt>
          <dd className="credential-mono">{view.tokenId ? `#${view.tokenId}` : "—"}</dd>
        </div>
        <div>
          <dt>Issuer</dt>
          <dd>{view.issuer || "—"}</dd>
        </div>
        <div>
          <dt>Network</dt>
          <dd>{view.network || "Avalanche Fuji"}</dd>
        </div>
        <div>
          <dt>Contract</dt>
          <dd className="credential-mono">{view.contractAddress || "—"}</dd>
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
      <div className="certificate-actions">
        {safeExternalHref(view.explorerUrl) ? (
          <a className="btn btn-secondary" href={safeExternalHref(view.explorerUrl)} target="_blank" rel="noopener noreferrer">
            {EXPLORER_LINK_LABEL}
          </a>
        ) : null}
      </div>
      <CredentialDetails view={view} />
    </section>
  );
}

export function QRCodeCard({ shareUrl }) {
  if (!shareUrl) return null;
  return (
    <section className="section-block lookup-qr-card" aria-label="Share QR">
      <h2>Confirm this credential</h2>
      <p className="meta-line">Scan to open this public credential URL.</p>
      <div className="lookup-qr-frame card">
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
    <section className="section-block lookup-actions" aria-label="Share actions">
      <h2>Shareable URL</h2>
      {shareUrl ? (
        <p className="credential-share-url">
          <a href={path || shareUrl}>{shareUrl}</a>
        </p>
      ) : null}
      <div className="certificate-actions">
        <Button type="button" variant="secondary" onClick={onCopy} disabled={!shareUrl}>
          {copied ? "Copied" : "Copy lookup link"}
        </Button>
        <Button type="button" variant="ghost" onClick={onPrint}>
          Download / print certificate
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
