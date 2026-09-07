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

export function BrandMark({ className = "", showWordmark = true, showDiamond = false } = {}) {
  return (
    <span className={`brand ${className}`.trim()}>
      {showDiamond ? (
        <span className="brand-diamond" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="10" height="10" fill="none">
            <path d="M8 1.5 L14 8 L8 14.5 L2 8 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        </span>
      ) : null}
      <ForjoraIcon />
      {showWordmark ? <span className="brand-wordmark">{PRODUCT_NAME}</span> : null}
    </span>
  );
}

export default BrandMark;
