import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/primitives";
import EmptyState from "../EmptyState";
import CredentialDetails from "../CredentialDetails";
import CredentialQr from "../CredentialQr";
import CredentialStatusBadge from "../CredentialStatusBadge";
import { EMPTY_STATES } from "../../utils/onboarding";
import { CONTRACT_ADDRESS } from "../../utils/contract";
import { getFujiPublicClient } from "../../utils/fujiClient";
import { isCredentialId } from "../../utils/credentialModel";
import { normalizeAddress } from "../../utils/progress";
import { CREDENTIAL_STATES } from "../../utils/credentialStatus";
import {
  buildCredentialVerificationView,
  evaluateCredentialVerification,
  loadCredentialLookup,
  lookupShareUrl,
  parseCredentialLocation,
  publicCredentialPath,
} from "../../utils/credentialLookup";

function CredentialLookupPage({ pathname = "", search = "" }) {
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

  function submit(event) {
    event.preventDefault();
    const rawToken = tokenInput.trim();
    const rawWallet = walletInput.trim();
    if (rawToken && !isCredentialId(rawToken) && !normalizeAddress(rawWallet)) {
      setQuery({ tokenId: "", wallet: "", invalidPathId: true });
      setError("invalid");
      return;
    }
    const next = {
      tokenId: isCredentialId(rawToken) ? rawToken : "",
      wallet: normalizeAddress(rawWallet) || "",
      invalidPathId: false,
    };
    const href = publicCredentialPath(next);
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", href);
    }
    setQuery(next);
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

  const verification = view?.verification;
  const metadata = view?.metadata;

  return (
    <div className="page credential-lookup">
      <header className="page-header">
        <p className="kicker">Public credential verification</p>
        <h1>Credential lookup</h1>
        <p className="lede">
          Read a SkillForge credential from Avalanche Fuji by token ID or holder wallet.
          Looking it up does not make a self-claimed score issuer-attested.
        </p>
        <p className="certificate-status-row">
          <CredentialStatusBadge status={CREDENTIAL_STATES.claimed} />
          <CredentialStatusBadge status={CREDENTIAL_STATES.attested} />
        </p>
      </header>

      <form className="section-block recipient-form" onSubmit={submit}>
        <label className="recipient-label" htmlFor="lookup-token">Token ID</label>
        <input
          id="lookup-token"
          className="recipient-input"
          value={tokenInput}
          onChange={(event) => setTokenInput(event.target.value)}
          placeholder="Example: 1"
          inputMode="numeric"
        />
        <label className="recipient-label" htmlFor="lookup-wallet">Holder wallet</label>
        <input
          id="lookup-wallet"
          className="recipient-input"
          value={walletInput}
          onChange={(event) => setWalletInput(event.target.value)}
          placeholder="0x…"
          autoComplete="off"
          spellCheck="false"
        />
        <Button type="submit">Look up credential</Button>
      </form>

      {!CONTRACT_ADDRESS && (
        <EmptyState
          title="Lookup unavailable"
          body="Credential lookup is not available until the Fuji contract is configured."
        />
      )}

      {loading && <p role="status">Reading credential from Fuji…</p>}

      {!loading && error === "not-found" && (
        <>
          <div className="verification-state verification-state-none verification-ownership-unknown">
            <p className="kicker">Credential verification</p>
            <h2>Verification state</h2>
            <p>Not found</p>
            <p className="meta-line">{missingVerification?.summary}</p>
          </div>
          <EmptyState
            title={EMPTY_STATES.noLookup.title}
            body={EMPTY_STATES.noLookup.body}
          />
        </>
      )}
      {!loading && error === "invalid" && (
        <EmptyState
          variant="error"
          title="Invalid credential identifier"
          body="Enter a token ID starting at 1, or a 0x holder wallet address."
        />
      )}
      {!loading && error === "owner-mismatch" && (
        <EmptyState
          variant="error"
          title="Holder does not match"
          body="This token exists on Fuji, but the on-chain holder is not the wallet in the URL."
        />
      )}
      {!loading && !error && !view && (
        <p className="meta-line">Enter a token ID or wallet, then look up the on-chain record.</p>
      )}

      {view && (
        <section className="section-block">
          {verification && (
            <div className={`verification-state verification-state-${verification.statusId} verification-ownership-${verification.ownership}`}>
              <p className="kicker">Credential verification</p>
              <h2>Verification state</h2>
              <p>
                {verification.onChain ? "On-chain record found" : "Not found"}
                {verification.statusLabel ? ` · ${verification.statusLabel}` : ""}
              </p>
              <p className="meta-line">{verification.summary}</p>
            </div>
          )}
          <CredentialDetails view={view} />
          {metadata && (metadata.description || metadata.attributes.length > 0 || metadata.image) && (
            <div className="credential-metadata">
              <h3>On-chain metadata</h3>
              {metadata.description && <p>{metadata.description}</p>}
              {metadata.image ? (
                <p className="meta-line">
                  Image: <span className="credential-mono">{metadata.image}</span>
                </p>
              ) : null}
              {metadata.attributes.length > 0 && (
                <ul className="credential-traits">
                  {metadata.attributes.map((trait) => (
                    <li key={`${trait.trait_type}-${trait.value}`}>
                      <span>{trait.trait_type}</span>
                      <strong>{String(trait.value)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {shareUrl && (
            <div className="credential-share">
              <h3>Shareable URL</h3>
              <p className="credential-share-url">
                <a href={publicCredentialPath({ tokenId: view.tokenId, wallet: query.wallet })}>
                  {shareUrl}
                </a>
              </p>
              <Button type="button" variant="secondary" onClick={copyShareUrl}>
                {copied ? "Copied" : "Copy URL"}
              </Button>
              <CredentialQr url={shareUrl} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default CredentialLookupPage;
