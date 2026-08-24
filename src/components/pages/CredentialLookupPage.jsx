import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/primitives";
import EmptyState from "../EmptyState";
import CredentialDetails from "../CredentialDetails";
import { EMPTY_STATES } from "../../utils/onboarding";
import { CONTRACT_ADDRESS } from "../../utils/contract";
import { getFujiPublicClient } from "../../utils/fujiClient";
import {
  buildCredentialVerificationView,
  loadCredentialLookup,
  lookupQueryString,
  lookupShareUrl,
  parseLookupQuery,
} from "../../utils/credentialLookup";
import { CREDENTIAL_STATES } from "../../utils/credentialStatus";
import CredentialStatusBadge from "../CredentialStatusBadge";

function CredentialLookupPage({ initialQuery = "" }) {
  const [tokenInput, setTokenInput] = useState("");
  const [walletInput, setWalletInput] = useState("");
  const [query, setQuery] = useState(() => parseLookupQuery(initialQuery));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credential, setCredential] = useState(null);
  const [transactionHash, setTransactionHash] = useState("");

  useEffect(() => {
    const parsed = parseLookupQuery(initialQuery || (typeof window !== "undefined" ? window.location.search : ""));
    setQuery((current) =>
      current.tokenId === parsed.tokenId && current.wallet === parsed.wallet ? current : parsed
    );
    if (parsed.tokenId) setTokenInput(parsed.tokenId);
    if (parsed.wallet) setWalletInput(parsed.wallet);
  }, [initialQuery]);

  useEffect(() => {
    let cancelled = false;
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
    () => (credential ? buildCredentialVerificationView(credential, { transactionHash }) : null),
    [credential, transactionHash]
  );

  function submit(event) {
    event.preventDefault();
    const next = parseLookupQuery(lookupQueryString({
      tokenId: tokenInput.trim(),
      wallet: walletInput.trim(),
    }));
    const href = lookupQueryString(next) || (typeof window !== "undefined" ? window.location.pathname : "/");
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", href);
    }
    setQuery(next);
  }

  const shareUrl = view
    ? lookupShareUrl({ tokenId: view.tokenId, wallet: view.holderWallet })
    : "";

  return (
    <div className="page credential-lookup">
      <header className="page-header">
        <p className="kicker">Credential verification</p>
        <h1>Look up a credential</h1>
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
          title="Contract not configured"
          body="Set VITE_CREDENTIAL_CONTRACT to the Fuji SkillForgeCredential address."
        />
      )}

      {loading && <p role="status">Reading credential from Fuji…</p>}

      {!loading && error === "not-found" && (
        <EmptyState
          title={EMPTY_STATES.noLookup.title}
          body={EMPTY_STATES.noLookup.body}
        />
      )}
      {!loading && error === "invalid" && (
        <EmptyState
          variant="error"
          title="Invalid lookup"
          body="Enter a token ID starting at 1, or a 0x holder wallet address."
        />
      )}
      {!loading && error === "empty" && !view && (
        <p className="meta-line">Enter a token ID or wallet, then look up the on-chain record.</p>
      )}

      {view && (
        <section className="section-block">
          <CredentialDetails view={view} />
          {shareUrl && (
            <p className="meta-line">
              Share this record:{" "}
              <a href={lookupQueryString({ tokenId: view.tokenId, wallet: view.holderWallet })}>
                {shareUrl}
              </a>
            </p>
          )}
        </section>
      )}
    </div>
  );
}

export default CredentialLookupPage;
