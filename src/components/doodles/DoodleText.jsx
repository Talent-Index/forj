import { useDoodleTrigger } from "./useDoodleTrigger.js";
import { doodleTiming } from "./doodleTiming.js";

/**
 * Handwritten underline / circle annotation for key words.
 */
export function DoodleText({
  children,
  mark = "underline",
  trigger = "viewport",
  active = false,
  once = true,
  delay = 0,
  className = "",
} = {}) {
  const { ref, playing, reduced, handlers } = useDoodleTrigger(trigger, { once, active });

  return (
    <span
      ref={ref}
      className={[
        "doodle-text",
        `doodle-text-${mark}`,
        playing ? "is-playing" : "",
        reduced ? "is-reduced" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--doodle-delay": `${delay}ms`, "--doodle-duration": `${doodleTiming.standard}ms` }}
      {...handlers}
    >
      <span className="doodle-text-word">{children}</span>
      <svg
        className="doodle-text-mark"
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {mark === "circle" ? (
          <ellipse
            cx="50"
            cy="6"
            rx="46"
            ry="4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            pathLength="1"
          />
        ) : (
          <path
            d="M2 7 C20 3, 40 10, 58 5 S90 9, 98 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            pathLength="1"
          />
        )}
      </svg>
    </span>
  );
}

export default DoodleText;
