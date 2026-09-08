import { useEffect, useMemo, useState } from "react";
import EmptyState from "../EmptyState";
import forgeCertificate from "../../assets/forge-certificate.jpg";
import { CONTRACT_ADDRESS } from "../../utils/contract";
import { getFujiPublicClient } from "../../utils/fujiClient";
import { isCredentialId } from "../../utils/credentialModel";
import { normalizeAddress } from "../../utils/progress";
import {
  buildCredentialVerificationView,
  evaluateCredentialVerification,
  loadCredentialLookup,
  lookupShareUrl,
  parseCredentialLocation,
  publicCredentialPath,
} from "../../utils/credentialLookup";
import {
  AchievementSummaryStrip,
  CredentialActions,
  CredentialInformation,
  CredentialSearch,
  CredentialShowcase,
  LearnerPublicCard,
  LookupHero,
  QRCodeCard,
  SkillEvidencePanel,
  VerificationDetailsPanel,
  VerificationStatusBanner,
} from "../lookup/LookupPortalParts";

function parseScannedValue(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;
  try {
    const url = new URL(text, typeof window !== "undefined" ? window.location.origin : "https://forjora.local");
    const pathMatch = url.pathname.match(/\/credential(?:\/([^/]+))?$/i);
    if (pathMatch || url.pathname.includes("credential")) {
      const tokenFromPath = pathMatch?.[1] || "";
      const token = isCredentialId(tokenFromPath)
        ? tokenFromPath
        : isCredentialId(url.searchParams.get("token") || "")
          ? url.searchParams.get("token")
          : "";
      const wallet = normalizeAddress(url.searchParams.get("wallet") || "") || "";
      if (token || wallet) return { tokenId: token, wallet, invalidPathId: Boolean(tokenFromPath && !token) };
    }
  } catch {
    /* fall through */
  }
  if (isCredentialId(text)) return { tokenId: text, wallet: "", invalidPathId: false };
  if (normalizeAddress(text)) return { tokenId: "", wallet: normalizeAddress(text), invalidPathId: false };
  return null;
}

function CredentialLookupPage({ pathname = "", search = "", onHistoryChange }) {
  const location = useMemo(
    () =>
      parseCredentialLocation(
        pathname || (typeof window !== "undefined" ? window.location.pathname : "/"),
        search || (typeof window !== "undefined" ? window.location.search : "")
      ),
    [pathname, search]
  );
  const [tokenInput, setTokenInput] = useState(location.tokenId || "");
  const [walletInput, setWalletInput] = useState(location.wallet || "");
  const [query, setQuery] = useState(() => ({
    tokenId: location.tokenId,
    wallet: location.wallet,
    invalidPathId: location.invalidPathId,
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credential, setCredential] = useState(null);
  const [transactionHash, setTransactionHash] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setQuery((current) =>
      current.tokenId === location.tokenId &&
      current.wallet === location.wallet &&
      current.invalidPathId === location.invalidPathId
        ? current
        : {
            tokenId: location.tokenId,
            wallet: location.wallet,
            invalidPathId: location.invalidPathId,
          }
    );
    if (location.tokenId) setTokenInput(location.tokenId);
    if (location.wallet) setWalletInput(location.wallet);
  }, [location]);

  useEffect(() => {
    let cancelled = false;
    if (query.invalidPathId) {
      setCredential(null);
      setTransactionHash("");
      setError("invalid");
      setLoading(false);
      return undefined;
    }
    if (!query.tokenId && !query.wallet) {
      setCredential(null);
      setTransactionHash("");
      setError("");
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    setError("");
    setCredential(null);
    setTransactionHash("");
    loadCredentialLookup(getFujiPublicClient(), query)
      .then((result) => {
        if (cancelled) return;
        setCredential(result.credential);
        setTransactionHash(result.transactionHash || "");
        setError(result.error || "");
      })
      .catch(() => {
        if (!cancelled) {
          setCredential(null);
          setTransactionHash("");
          setError("not-found");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const view = useMemo(
    () =>
      credential
        ? buildCredentialVerificationView(credential, {
            transactionHash,
            query,
          })
        : null,
    [credential, transactionHash, query]
  );
  const missingVerification = useMemo(
    () => (credential ? null : evaluateCredentialVerification(null)),
    [credential]
  );

  function pushQuery(next) {
    const href = publicCredentialPath(next);
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", href);
      onHistoryChange?.(href);
    }
    setQuery(next);
  }

  function submit(event) {
    event.preventDefault();
    const rawToken = tokenInput.trim();
    const rawWallet = walletInput.trim();
    if (rawToken && !isCredentialId(rawToken) && !normalizeAddress(rawWallet)) {
      pushQuery({ tokenId: "", wallet: "", invalidPathId: true });
      setError("invalid");
      return;
    }
    pushQuery({
      tokenId: isCredentialId(rawToken) ? rawToken : "",
      wallet: normalizeAddress(rawWallet) || "",
      invalidPathId: false,
    });
  }

  function clearSearch() {
    setTokenInput("");
    setWalletInput("");
    pushQuery({ tokenId: "", wallet: "", invalidPathId: false });
    setError("");
    setCredential(null);
  }

  function handleScanUrl(raw) {
    const parsed = parseScannedValue(raw);
    if (!parsed) {
      setError("invalid");
      setQuery({ tokenId: "", wallet: "", invalidPathId: true });
      return;
    }
    if (parsed.tokenId) setTokenInput(parsed.tokenId);
    if (parsed.wallet) setWalletInput(parsed.wallet);
    pushQuery(parsed);
  }

  const shareUrl = view
    ? lookupShareUrl({ tokenId: view.tokenId, wallet: query.wallet || view.holderWallet })
    : lookupShareUrl({ tokenId: query.tokenId, wallet: query.wallet });

  async function copyShareUrl() {
    if (!shareUrl || typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  const verification = view?.verification;
  const queryLabel = query.tokenId
    ? `#${query.tokenId}`
    : query.wallet
      ? query.wallet
      : "";
  const hasQuery = Boolean(query.tokenId || query.wallet || query.invalidPathId);
  const resultState = loading
    ? "loading"
    : error === "invalid"
      ? "invalid"
      : error === "not-found"
        ? "not-found"
        : error === "owner-mismatch"
          ? "owner-mismatch"
          : error === "no-contract"
            ? "no-contract"
            : view
              ? "found"
              : "";

  return (
    <div className="page credential-lookup lookup-portal">
      <LookupHero />

      <CredentialSearch
        tokenInput={tokenInput}
        walletInput={walletInput}
        onTokenChange={setTokenInput}
        onWalletChange={setWalletInput}
        onSubmit={submit}
        onClear={clearSearch}
        loading={loading}
        disabled={!CONTRACT_ADDRESS}
        onScanUrl={handleScanUrl}
      />

      {!CONTRACT_ADDRESS && (
        <EmptyState
          title="Lookup unavailable"
          body="Credential lookup is not available until the Fuji contract is configured."
        />
      )}

      {CONTRACT_ADDRESS && !hasQuery && !loading ? (
        <p className="meta-line lookup-idle-note">
          Enter a token ID or wallet, then look up the on-chain record.
        </p>
      ) : null}

      {resultState === "no-contract" ? (
        <EmptyState
          title="Lookup unavailable"
          body="Credential lookup is not available until the Fuji contract is configured."
        />
      ) : null}

      {resultState === "owner-mismatch" ? (
        <VerificationStatusBanner
          state="owner-mismatch"
          verification={verification}
          queryLabel={queryLabel}
          onRetry={clearSearch}
        />
      ) : null}

      {resultState === "loading" ||
      resultState === "invalid" ||
      resultState === "not-found" ||
      resultState === "found" ? (
        <VerificationStatusBanner
          state={resultState}
          verification={
            resultState === "not-found"
              ? missingVerification
              : verification
          }
          queryLabel={queryLabel}
          onRetry={clearSearch}
        />
      ) : null}

      {resultState === "owner-mismatch" && verification ? (
        <VerificationStatusBanner
          state="found"
          verification={verification}
          queryLabel={queryLabel}
        />
      ) : null}

      {view && !loading && (resultState === "found" || resultState === "owner-mismatch") ? (
        <div className="lookup-result lookup-result-enter">
          <div className="lookup-result-layout">
            <div className="lookup-result-main">
              <CredentialShowcase view={view} artwork={forgeCertificate} />
              <CredentialInformation view={view} />
              <LearnerPublicCard view={view} />
            </div>
            <aside className="lookup-result-side">
              <SkillEvidencePanel view={view} />
              <AchievementSummaryStrip view={view} />
              <QRCodeCard shareUrl={shareUrl} />
              <CredentialActions
                shareUrl={shareUrl}
                path={publicCredentialPath({
                  tokenId: view.tokenId,
                  wallet: query.wallet,
                })}
                copied={copied}
                onCopy={copyShareUrl}
                onPrint={handlePrint}
              />
            </aside>
          </div>
          <VerificationDetailsPanel view={view} />
          {view.metadata &&
          (view.metadata.description || view.metadata.attributes.length > 0 || view.metadata.image) ? (
            <section className="section-block credential-metadata">
              <h2>On-chain metadata</h2>
              {view.metadata.description ? <p>{view.metadata.description}</p> : null}
              {view.metadata.image ? (
                <p className="meta-line">
                  Image: <span className="credential-mono">{view.metadata.image}</span>
                </p>
              ) : null}
              {view.metadata.attributes.length > 0 ? (
                <ul className="credential-traits">
                  {view.metadata.attributes.map((trait) => (
                    <li key={`${trait.trait_type}-${trait.value}`}>
                      <span>{trait.trait_type}</span>
                      <strong>{String(trait.value)}</strong>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default CredentialLookupPage;
