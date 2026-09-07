import { Doodle } from "./Doodle.jsx";
import { AnimatedDoodle } from "./AnimatedDoodle.jsx";
import { doodleTiming } from "./doodleTiming.js";

/**
 * Absolutely positioned decorative doodle cluster.
 * Dense fields animate only items with animate:true (perf).
 * Items with decorative:true hide on small screens via CSS.
 */
export function DoodleField({
  items = [],
  className = "",
  animate = false,
  trigger = "immediate",
  dense = false,
} = {}) {
  if (!items.length) return null;
  return (
    <div
      className={`doodle-field ${animate ? "is-animated" : ""} ${dense ? "is-dense" : ""} ${className}`.trim()}
      aria-hidden="true"
      data-doodle-count={items.length}
    >
      {items.map((item, index) => {
        const shouldAnimate = Boolean(
          item.animate ?? (animate && (!dense || index < 18))
        );
        return (
          <span
            key={`${item.type}-${index}-${item.top || ""}-${item.left || ""}`}
            className={`doodle-field-item ${item.decorative !== false ? "is-decorative" : ""} ${item.accent ? "is-accent" : ""}`.trim()}
            style={{
              top: item.top,
              left: item.left,
              right: item.right,
              bottom: item.bottom,
              transform: item.rotate ? `rotate(${item.rotate}deg)` : undefined,
            }}
          >
            {shouldAnimate ? (
              <AnimatedDoodle
                type={item.type}
                size={item.size || 28}
                variant={item.variant || "muted"}
                strokeWidth={item.strokeWidth || 1.6}
                animation={item.animation || "draw"}
                trigger={item.trigger || trigger}
                delay={item.delay ?? index * doodleTiming.stagger}
                once
              />
            ) : (
              <Doodle
                type={item.type}
                size={item.size || 28}
                variant={item.variant || "muted"}
                strokeWidth={item.strokeWidth || 1.6}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

export default DoodleField;
