import { AnimatedDoodle } from "./AnimatedDoodle.jsx";

/**
 * Lightweight forge loading: hammer tap loop + caption.
 */
export function LoadingForge({
  label = "Forging…",
  size = 36,
  className = "",
} = {}) {
  return (
    <div className={`loading-forge-doodle ${className}`.trim()} role="status" aria-live="polite">
      <AnimatedDoodle
        type="hammer"
        animation="tap"
        trigger="loading"
        loop
        size={size}
        variant="accent"
        once={false}
      />
      <p className="kicker">{label}</p>
      <span className="loading-forge-underline" aria-hidden="true" />
    </div>
  );
}

export default LoadingForge;
