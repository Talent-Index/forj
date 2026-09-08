import CredentialStatusBadge from "../CredentialStatusBadge";
import { CREDENTIAL_STATES } from "../../utils/credentialStatus";
import { TOTAL_PIECES } from "../../data/questions";
import { TIER_ROMAN } from "../../utils/achievementCatalog";

export function VaultHero({ stats }) {
  return (
    <header className="page-header vault-hero">
      <p className="kicker">My credentials</p>
      <h1>Credential vault</h1>
      <p className="lede">
        Proof of skills, path certificates, and optional Fuji on-chain records.
        Learning certificates are off-chain. Learner mints are Forjora claimed, not issuer-attested.
      </p>
      <div className="stat-row vault-stat-row" role="list">
        <div className="card stat-compact" role="listitem">
          <p className="kicker">Credentials</p>
          <p className="stat-value">{stats.credentialsEarned}</p>
        </div>
        <div className="card stat-compact" role="listitem">
          <p className="kicker">Issuer-attested</p>
          <p className="stat-value">{stats.attestedCount}</p>
        </div>
        <div className="card stat-compact" role="listitem">
          <p className="kicker">Skills</p>
          <p className="stat-value">{stats.skillsCount}</p>
        </div>
        <div className="card stat-compact" role="listitem">
          <p className="kicker">Highest level</p>
          <p className="stat-value vault-stat-level">{stats.highestLevel}</p>
        </div>
        <div className="card stat-compact" role="listitem">
          <p className="kicker">Puzzle</p>
          <p className="stat-value">
            {stats.puzzlePieces}/{stats.puzzleTotal || TOTAL_PIECES}
          </p>
        </div>
      </div>
    </header>
  );
}

export function SkillEvidence({ skills = [], evidence = [], title = "Skills demonstrated" }) {
  const rows = skills.length
    ? skills.map((skill) => ({ label: skill, ok: true }))
    : evidence.map((row) => ({ label: row, ok: true }));
  if (!rows.length) return null;
  return (
    <div className="skill-evidence">
      <p className="kicker">{title}</p>
      <ul className="skill-evidence-list">
        {rows.map((row) => (
          <li key={row.label}>
            <span className={row.ok ? "result-mark-ok" : "meta-line"} aria-hidden="true">
              {row.ok ? "✓" : "·"}
            </span>
            <span>{row.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CredentialFilterBar({
  filters,
  filterId,
  onFilter,
  sorts,
  sortId,
  onSort,
}) {
  return (
    <div className="vault-filter-bar">
      <div className="learn-filters" role="tablist" aria-label="Credential filters">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            role="tab"
            className={`learn-filter${filterId === filter.id ? " is-active" : ""}`}
            aria-selected={filterId === filter.id}
            onClick={() => onFilter?.(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <label className="vault-sort">
        <span className="visually-hidden">Sort credentials</span>
        <select
          className="recipient-input vault-sort-select"
          value={sortId}
          onChange={(event) => onSort?.(event.target.value)}
        >
          {sorts.map((sort) => (
            <option key={sort.id} value={sort.id}>
              {sort.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function statusBadgeFor(item) {
  if (item.statusId === "attested") return CREDENTIAL_STATES.attested;
  if (item.statusId === "claimed") return CREDENTIAL_STATES.claimed;
  return null;
}

function stateLabel(state) {
  if (state === "earned") return "Earned";
  if (state === "in-progress") return "In progress";
  return "Locked";
}

export function CredentialCard({
  item,
  onView,
  onVerify,
  onContinue,
  onShare,
}) {
  const badge = statusBadgeFor(item);
  return (
    <article className={`credential-card card is-${item.state} kind-${item.kind}`}>
      <div className="credential-card-head">
        <p className="kicker">{item.level}</p>
        <span className={`credential-card-state is-${item.state}`}>{stateLabel(item.state)}</span>
      </div>
      <h3>{item.name}</h3>
      <p className="meta-line">{item.track}</p>
      {badge ? <CredentialStatusBadge status={badge} /> : null}
      {item.state === "earned" ? (
        <>
          <SkillEvidence skills={item.skills?.slice(0, 4)} />
          {item.issuedLabel ? <p className="meta-line">{item.issuedLabel}</p> : null}
          {item.credentialId ? (
            <p className="meta-line credential-mono">{item.credentialId}</p>
          ) : null}
        </>
      ) : null}
      {item.state === "in-progress" ? (
        <>
          <div className="credential-card-progress">
            <p className="meta-line">Progress {item.progress?.percent || 0}%</p>
            <div className="progress-track" aria-hidden="true">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, item.progress?.percent || 0)}%` }}
              />
            </div>
            {item.kind === "path" || item.progress?.needed ? (
              <p className="meta-line">
                {item.progress?.seated ?? item.progress?.current ?? 0}
                {" / "}
                {item.progress?.needed ?? item.progress?.target ?? TOTAL_PIECES}
                {" pieces"}
              </p>
            ) : null}
          </div>
          {item.requirements?.length ? (
            <ul className="credential-card-reqs">
              {item.requirements.slice(0, 3).map((req) => (
                <li key={req}>{req}</li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
      {item.state === "locked" ? (
        <ul className="credential-card-reqs">
          {(item.requirements || ["Complete earlier path requirements"]).slice(0, 3).map((req) => (
            <li key={req}>○ {req}</li>
          ))}
        </ul>
      ) : null}
      <div className="credential-card-actions">
        {item.state === "earned" ? (
          <>
            <button type="button" className="btn btn-secondary" onClick={() => onView?.(item)}>
              View
            </button>
            {item.onChain ? (
              <button type="button" className="btn btn-ghost" onClick={() => onVerify?.(item)}>
                Look up
              </button>
            ) : null}
            {item.onChain && onShare ? (
              <button type="button" className="btn btn-ghost" onClick={() => onShare?.(item)}>
                Share
              </button>
            ) : null}
          </>
        ) : null}
        {item.state === "in-progress" ? (
          <button type="button" className="btn btn-secondary" onClick={() => onContinue?.(item)}>
            Continue
          </button>
        ) : null}
        {item.state === "locked" ? (
          <button type="button" className="btn btn-ghost" onClick={() => onContinue?.(item)}>
            View path
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function FeaturedCredential({
  item,
  onView,
  onVerify,
  onShare,
}) {
  if (!item) return null;
  const badge = statusBadgeFor(item);
  return (
    <section className="section-block featured-credential" aria-label="Featured credential">
      <p className="kicker">Featured credential</p>
      <div className="featured-credential-layout">
        <div className="featured-credential-copy">
          <p className="kicker">{item.level}</p>
          <h2>{item.name}</h2>
          <p className="meta-line">{item.track}</p>
          {badge ? <CredentialStatusBadge status={badge} /> : (
            <p className="meta-line">Off-chain learning certificate</p>
          )}
          <SkillEvidence skills={item.skills} />
          {item.issuedLabel ? <p className="meta-line">Issued: {item.issuedLabel}</p> : null}
          {item.credentialId ? (
            <p className="meta-line">
              Credential ID: <span className="credential-mono">{item.credentialId}</span>
            </p>
          ) : null}
          <div className="certificate-actions">
            <button type="button" className="btn btn-secondary" onClick={() => onView?.(item)}>
              View
            </button>
            {item.onChain ? (
              <button type="button" className="btn" onClick={() => onVerify?.(item)}>
                Look up on Fuji
              </button>
            ) : null}
            {item.onChain && onShare ? (
              <button type="button" className="btn btn-ghost" onClick={() => onShare?.(item)}>
                Share
              </button>
            ) : null}
          </div>
        </div>
        <div className="featured-credential-preview card" aria-hidden="true">
          <p className="certificate-brand">Forjora</p>
          <p className="kicker">{item.level}</p>
          <p className="featured-preview-title">{item.name}</p>
          <p className="meta-line">{item.onChain ? "On-chain path record" : "Path certificate"}</p>
        </div>
      </div>
    </section>
  );
}

export function CredentialDetail({
  item,
  recipientName = "Learner",
  onBack,
  onVerify,
  onShare,
  onContinue,
  children,
}) {
  if (!item) return null;
  const badge = statusBadgeFor(item);
  return (
    <div className="page vault-detail">
      <header className="page-header">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Back
        </button>
        <p className="kicker">
          {item.onChain
            ? (badge?.label || "On-chain credential")
            : "Learning certificate"}
        </p>
        <h1>{item.name}</h1>
        <p className="lede">
          {item.onChain
            ? "Fuji soulbound path snapshot. Looking it up does not make a claimed score issuer-attested."
            : "Off-chain path evidence. Not a Fuji mint and not issuer-attested."}
        </p>
        {badge ? <CredentialStatusBadge status={badge} /> : null}
      </header>

      <section className="section-block">
        {children}
        <p className="meta-line">Awarded to: {recipientName || "Learner"}</p>
        <p className="kicker">{item.level}</p>
        <SkillEvidence skills={item.skills} title="Skills" />
        <SkillEvidence evidence={item.evidence} title="Evidence" />
        {item.requirements?.length && item.state !== "earned" ? (
          <div className="skill-evidence">
            <p className="kicker">Requirements</p>
            <ul className="skill-evidence-list">
              {item.requirements.map((req) => (
                <li key={req}>
                  <span aria-hidden="true">○</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {item.credentialId ? (
          <p className="meta-line">
            Credential ID: <span className="credential-mono">{item.credentialId}</span>
          </p>
        ) : null}
        {item.issuedLabel ? <p className="meta-line">Issued: {item.issuedLabel}</p> : null}
        <div className="certificate-actions">
          {item.onChain ? (
            <>
              <button type="button" className="btn" onClick={() => onVerify?.(item)}>
                Look up credential
              </button>
              {onShare ? (
                <button type="button" className="btn btn-secondary" onClick={() => onShare?.(item)}>
                  Share
                </button>
              ) : null}
            </>
          ) : item.state !== "earned" ? (
            <button type="button" className="btn btn-secondary" onClick={() => onContinue?.(item)}>
              Continue learning
            </button>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={onBack}>
              Close
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export function VaultAchievementStrip({
  level,
  xp,
  streak,
  skills = [],
}) {
  return (
    <section className="section-block vault-achievement-strip" aria-label="Achievement summary">
      <p className="kicker">Achievement summary</p>
      <div className="stat-row vault-stat-row">
        <div className="card stat-compact">
          <p className="kicker">Level</p>
          <p className="stat-value">{level != null ? String(level).padStart(2, "0") : "-"}</p>
        </div>
        <div className="card stat-compact">
          <p className="kicker">XP</p>
          <p className="stat-value">{xp != null ? Number(xp).toLocaleString() : "-"}</p>
        </div>
        <div className="card stat-compact">
          <p className="kicker">Streak</p>
          <p className="stat-value">{streak != null ? `${streak}d` : "-"}</p>
        </div>
      </div>
      {skills.length ? (
        <ul className="vault-skill-chips">
          {skills.slice(0, 6).map((item) => (
            <li key={item.skillId || item.id}>
              {item.displayName}
              {item.tier != null && TIER_ROMAN?.[item.tier]
                ? ` ${TIER_ROMAN[item.tier]}`
                : item.tierLabel
                  ? ` · ${item.tierLabel}`
                  : ""}
            </li>
          ))}
        </ul>
      ) : (
        <p className="meta-line">Skill ladders appear as you prove them on the path.</p>
      )}
    </section>
  );
}
