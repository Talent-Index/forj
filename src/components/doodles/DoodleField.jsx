import { Doodle } from "./Doodle.jsx";
import { AnimatedDoodle } from "./AnimatedDoodle.jsx";
import { doodleTiming } from "./doodleTiming.js";

/**
 * Absolutely positioned decorative doodle cluster.
 * Items with decorative:true hide on small screens via CSS.
 */
export function DoodleField({
  items = [],
  className = "",
  animate = false,
  trigger = "immediate",
} = {}) {
  if (!items.length) return null;
  return (
    <div className={`doodle-field ${animate ? "is-animated" : ""} ${className}`.trim()} aria-hidden="true">
      {items.map((item, index) => (
        <span
          key={`${item.type}-${index}`}
          className={`doodle-field-item ${item.decorative !== false ? "is-decorative" : ""} ${item.accent ? "is-accent" : ""}`.trim()}
          style={{
            top: item.top,
            left: item.left,
            right: item.right,
            bottom: item.bottom,
            transform: item.rotate ? `rotate(${item.rotate}deg)` : undefined,
          }}
        >
          {animate || item.animate ? (
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
      ))}
    </div>
  );
}

export default DoodleField;
