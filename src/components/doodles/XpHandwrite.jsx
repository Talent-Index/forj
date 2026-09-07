import { useEffect, useState } from "react";
import { DoodleArrow } from "./DoodleArrow.jsx";
import { doodleTiming } from "./doodleTiming.js";
import { useReducedMotion } from "./useReducedMotion.js";

/**
 * Handwritten XP gain callout with optional count-up target.
 */
export function XpHandwrite({
  amount = 0,
  from = null,
  to = null,
  active = false,
  className = "",
} = {}) {
  const reduced = useReducedMotion();
  const start = from ?? Math.max(0, (to ?? amount) - amount);
  const end = to ?? start + amount;
  const [value, setValue] = useState(reduced || !active ? end : start);

  useEffect(() => {
    if (!active) {
      setValue(start);
      return undefined;
    }
    if (reduced) {
      setValue(end);
      return undefined;
    }
    const duration = doodleTiming.dramatic;
    const origin = performance.now();
    let frame;
    function tick(now) {
      const t = Math.min(1, (now - origin) / duration);
      const eased = 1 - (1 - t) ** 2;
      setValue(Math.round(start + (end - start) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, reduced, start, end]);

  if (!active && amount <= 0) return null;

  return (
    <div className={`xp-handwrite ${active ? "is-active" : ""} ${className}`.trim()} role="status">
      <span className="xp-handwrite-gain">+{amount} XP</span>
      <DoodleArrow trigger="immediate" once className="xp-handwrite-arrow" />
      <span className="xp-handwrite-total">{value.toLocaleString()} XP</span>
    </div>
  );
}

export default XpHandwrite;
