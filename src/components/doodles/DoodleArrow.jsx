import { useDoodleTrigger } from "./useDoodleTrigger.js";
import { doodleTiming } from "./doodleTiming.js";

/**
 * Hand-drawn arrow that draws line then arrowhead.
 * LEARN ─────────→ PRACTICE
 */
export function DoodleArrow({
  trigger = "viewport",
  active = false,
  once = true,
  delay = 0,
  className = "",
  label = "",
} = {}) {
  const { ref, playing, reduced, handlers } = useDoodleTrigger(trigger, { once, active });

  return (
    <span
      ref={ref}
      className={[
        "doodle-arrow",
        playing ? "is-playing" : "",
        reduced ? "is-reduced" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--doodle-delay": `${delay}ms`, "--doodle-duration": `${doodleTiming.draw}ms` }}
      aria-hidden={label ? undefined : true}
      aria-label={label || undefined}
      {...handlers}
    >
      <svg viewBox="0 0 96 24" width="96" height="24" fill="none" className="doodle-arrow-svg">
        <path
          className="doodle-arrow-line"
          d="M4 12 C28 10, 52 14, 72 12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          pathLength="1"
        />
        <path
          className="doodle-arrow-head"
          d="M68 6 L84 12 L68 18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          pathLength="1"
        />
      </svg>
    </span>
  );
}

export default DoodleArrow;
