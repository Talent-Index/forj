import { useDoodleTrigger } from "./useDoodleTrigger.js";
import { doodleTiming } from "./doodleTiming.js";

/**
 * Hand-drawn blockchain nodes connecting sequentially (verify language).
 * Honesty: label defaults to "On-chain" — pass "Attested" for issuer path only.
 */
export function BlockchainConnect({
  trigger = "viewport",
  active = false,
  once = true,
  delay = 0,
  label = "On-chain",
  showCheck = true,
  className = "",
} = {}) {
  const { ref, playing, reduced, handlers } = useDoodleTrigger(trigger, { once, active });

  return (
    <div
      ref={ref}
      className={[
        "blockchain-connect",
        playing ? "is-playing" : "",
        reduced ? "is-reduced" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--doodle-delay": `${delay}ms`, "--doodle-duration": `${doodleTiming.verify}ms` }}
      aria-hidden="true"
      {...handlers}
    >
      <svg viewBox="0 0 120 48" width="120" height="48" fill="none" className="blockchain-connect-svg">
        <circle className="bc-node bc-node-1" cx="16" cy="24" r="5" stroke="currentColor" strokeWidth="1.7" pathLength="1" />
        <path className="bc-link bc-link-1" d="M22 24 H42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" pathLength="1" />
        <circle className="bc-node bc-node-2" cx="48" cy="24" r="5" stroke="currentColor" strokeWidth="1.7" pathLength="1" />
        <path className="bc-link bc-link-2" d="M54 24 H74" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" pathLength="1" />
        <circle className="bc-node bc-node-3" cx="80" cy="24" r="5" stroke="currentColor" strokeWidth="1.7" pathLength="1" />
        <path className="bc-link bc-link-3" d="M80 30 V40" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" pathLength="1" />
        <circle className="bc-node bc-node-4" cx="80" cy="42" r="4" stroke="currentColor" strokeWidth="1.7" pathLength="1" />
        {showCheck ? (
          <path
            className="bc-check"
            d="M96 18 L102 26 L114 10"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            pathLength="1"
          />
        ) : null}
      </svg>
      {label ? <span className="blockchain-connect-label">{label}</span> : null}
    </div>
  );
}

export default BlockchainConnect;
