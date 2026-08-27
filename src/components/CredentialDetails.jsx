import CredentialStatusBadge from "./CredentialStatusBadge";
import { VERIFICATION_FIELDS, VERIFICATION_LABELS } from "../utils/credentialLookup";
import { shortAddress } from "../utils/learnerStats";
import { safeExternalHref } from "../utils/frontendSecurity";

function HashValue({ value, href, empty = "Not found" }) {
  if (!value) return <span>{empty}</span>;
  const label = value.startsWith("0x") && value.length > 16 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value;
  const safeHref = safeExternalHref(href);
  if (!safeHref) return <span className="credential-mono">{label}</span>;
  return (
    <a className="credential-mono" href={safeHref} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}

function fieldValue(view, key) {
  switch (key) {
    case "title":
      return view.title || "—";
    case "holderWallet":
      return view.holderWallet ? (
        <HashValue value={view.holderWallet} href={view.holderExplorerUrl} empty="—" />
      ) : (
        "—"
      );
    case "score":
      return view.scoreLabel || view.score || "—";
    case "difficulty":
      return view.difficultyDetail
        ? `${view.difficulty} · ${view.difficultyDetail}`
        : view.difficulty || "—";
    case "status":
      return (
        <span className="credential-details-status">
          <CredentialStatusBadge status={view.statusId} />
          <span>{view.status}</span>
        </span>
      );
    case "issuer":
      return view.issuer || "—";
    case "network":
      return view.network ? `${view.network} · ${view.chainId}` : "—";
    case "contractAddress":
      return view.contractAddress ? (
        <HashValue
          value={view.contractAddress}
          href={safeExternalHref(`https://testnet.snowtrace.io/address/${view.contractAddress}`)}
        />
      ) : (
        "—"
      );
    case "tokenId":
      return view.tokenId ? `#${view.tokenId}` : "—";
    case "transactionHash":
      return (
        <HashValue
          value={view.transactionHash}
          href={view.transactionExplorerUrl}
          empty="Not indexed"
        />
      );
    case "explorerUrl":
      return safeExternalHref(view.explorerUrl) ? (
        <a href={safeExternalHref(view.explorerUrl)} target="_blank" rel="noopener noreferrer">
          {view.explorerLabel}
        </a>
      ) : (
        "—"
      );
    case "metadataUrl":
      return safeExternalHref(view.metadataUrl) ? (
        <a href={safeExternalHref(view.metadataUrl)} target="_blank" rel="noopener noreferrer">
          {view.metadataLabel || "Open tokenURI"}
        </a>
      ) : (
        "—"
      );
    default:
      return "—";
  }
}

function CredentialDetails({ view }) {
  if (!view) return null;

  return (
    <article className={`credential-details credential-record-${view.statusId || "claimed"}`}>
      <header className="credential-details-head">
        <p className="kicker">Credential verification</p>
        <CredentialStatusBadge status={view.statusId} />
        <h2>{view.title || "SkillForge credential"}</h2>
      </header>
      <p className="credential-record-honesty">{view.statusBody}</p>
      <p className="meta-line">
        {view.holderWalletShort || shortAddress(view.holderWallet) || "Holder unknown"}
        {view.scoreLabel ? ` · ${view.scoreLabel}` : ""}
      </p>
      <dl className="credential-details-list">
        {VERIFICATION_FIELDS.map((key) => (
          <div key={key} data-field={key}>
            <dt>{VERIFICATION_LABELS[key]}</dt>
            <dd>{fieldValue(view, key)}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export default CredentialDetails;
