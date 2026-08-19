import CredentialStatusBadge from "./CredentialStatusBadge";
import { VERIFICATION_FIELDS } from "../utils/credentialLookup";
import { shortAddress } from "../utils/learnerStats";

function HashValue({ value, href, empty = "Not found" }) {
  if (!value) return <span>{empty}</span>;
  const label = value.startsWith("0x") && value.length > 16 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value;
  if (!href) return <span>{label}</span>;
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

function CredentialDetails({ view }) {
  if (!view) return null;
  const rows = [
    { key: "title", label: "Credential title", value: view.title || "—" },
    {
      key: "holderWallet",
      label: "Holder wallet",
      value: view.holderWallet ? (
        <HashValue
          value={view.holderWallet}
          href={view.holderExplorerUrl}
          empty="—"
        />
      ) : (
        "—"
      ),
    },
    { key: "score", label: "Score", value: view.scoreLabel || "—" },
    {
      key: "difficulty",
      label: "Difficulty",
      value: view.difficultyDetail
        ? `${view.difficulty} · ${view.difficultyDetail}`
        : view.difficulty || "—",
    },
    {
      key: "status",
      label: "Credential status",
      value: (
        <span className="credential-details-status">
          <CredentialStatusBadge status={view.statusId} />
          <span>{view.status}</span>
        </span>
      ),
    },
    { key: "issuer", label: "Issuer", value: view.issuer || "—" },
    {
      key: "network",
      label: "Network",
      value: `${view.network} · ${view.chainId}`,
    },
    {
      key: "contractAddress",
      label: "Contract address",
      value: view.contractAddress ? (
        <HashValue
          value={view.contractAddress}
          href={`https://testnet.snowtrace.io/address/${view.contractAddress}`}
        />
      ) : (
        "—"
      ),
    },
    { key: "tokenId", label: "Token ID", value: view.tokenId ? `#${view.tokenId}` : "—" },
    {
      key: "transactionHash",
      label: "Transaction hash",
      value: (
        <HashValue
          value={view.transactionHash}
          href={view.transactionExplorerUrl}
          empty="Not indexed"
        />
      ),
    },
    {
      key: "explorerUrl",
      label: "Explorer link",
      value: view.explorerUrl ? (
        <a href={view.explorerUrl} target="_blank" rel="noreferrer">
          {view.explorerLabel}
        </a>
      ) : (
        "—"
      ),
    },
    {
      key: "metadataUrl",
      label: "Metadata link",
      value: view.metadataUrl ? (
        <a href={view.metadataUrl} target="_blank" rel="noreferrer">
          {view.metadataLabel || "Open tokenURI"}
        </a>
      ) : (
        "—"
      ),
    },
  ];

  return (
    <article className={`credential-details credential-record-${view.statusId || "claimed"}`}>
      <header className="credential-details-head">
        <CredentialStatusBadge status={view.statusId} />
        <h2>{view.title || "SkillForge credential"}</h2>
      </header>
      <p className="credential-record-honesty">{view.statusBody}</p>
      <p className="meta-line">
        {view.holderWalletShort || shortAddress(view.holderWallet) || "Holder unknown"}
        {view.scoreLabel ? ` · ${view.scoreLabel}` : ""}
      </p>
      <dl className="credential-details-list">
        {rows.map((row) => (
          <div key={row.key} data-field={row.key}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="visually-hidden">{VERIFICATION_FIELDS.join(" ")}</p>
    </article>
  );
}

export default CredentialDetails;
