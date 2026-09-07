import { AnimatedDoodle } from "./AnimatedDoodle.jsx";
import { doodleTiming } from "./doodleTiming.js";

/**
 * Signature forge sequence: hammer → anvil → impact → diamond.
 */
export function ForgeSequence({
  trigger = "manual",
  active = false,
  once = true,
  size = 28,
  className = "",
  label = "",
  onComplete,
} = {}) {
  return (
    <div
      className={`forge-sequence ${active || trigger === "immediate" ? "is-active" : ""} ${className}`.trim()}
      role={label ? "status" : undefined}
      aria-label={label || undefined}
      style={{ "--doodle-duration": `${doodleTiming.forge}ms` }}
    >
      <AnimatedDoodle
        type="hammer"
        animation="tap"
        trigger={trigger}
        active={active}
        once={once}
        size={size}
        variant="accent"
        delay={0}
      />
      <AnimatedDoodle
        type="anvil"
        animation="draw"
        trigger={trigger}
        active={active}
        once={once}
        size={size}
        variant="muted"
        delay={doodleTiming.quick}
      />
      <span className="forge-sequence-impact" aria-hidden="true">
        <span /><span /><span />
      </span>
      <AnimatedDoodle
        type="diamond"
        animation="draw"
        trigger={trigger}
        active={active}
        once={once}
        size={size + 4}
        variant="accent"
        delay={doodleTiming.standard}
        onComplete={onComplete}
      />
      {label ? <p className="forge-sequence-label">{label}</p> : null}
    </div>
  );
}

export default ForgeSequence;
