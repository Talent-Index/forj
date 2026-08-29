import { PRODUCT_NAME } from "../../utils/brand";

/**
 * Compact Forjora mark: abstract F / upward pathway from angular segments.
 * Uses currentColor for the charcoal body; accent class for the rising step.
 */
export function ForjoraIcon({ className = "", title = "" } = {}) {
  return (
    <svg
      className={`brand-mark ${className}`.trim()}
      viewBox="0 0 32 32"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title || undefined}
    >
      {title ? <title>{title}</title> : null}
      {/* Vertical spine — progress stem */}
      <path
        className="brand-mark-ink"
        fill="currentColor"
        d="M6 4h5.5v24H6z"
      />
      {/* Top pathway bar — peak / prove */}
      <path
        className="brand-mark-ink"
        fill="currentColor"
        d="M13 4h13l-4 5.5H13z"
      />
      {/* Mid pathway bar — build (accent) */}
      <path
        className="brand-mark-accent"
        fill="currentColor"
        d="M13 12.25h10l-4 5.5H13z"
      />
      {/* Lower pathway step — learn */}
      <path
        className="brand-mark-ink"
        fill="currentColor"
        d="M13 20.5h7l-4 5.5H13z"
      />
    </svg>
  );
}

export function BrandMark({ className = "", showWordmark = true } = {}) {
  return (
    <span className={`brand ${className}`.trim()}>
      <ForjoraIcon />
      {showWordmark ? <span className="brand-wordmark">{PRODUCT_NAME}</span> : null}
    </span>
  );
}

export default BrandMark;
