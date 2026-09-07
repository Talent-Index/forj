import { Doodle } from "./Doodle.jsx";

/**
 * Absolutely positioned decorative doodle cluster.
 * Items with decorative:true hide on small screens via CSS.
 */
export function DoodleField({ items = [], className = "" } = {}) {
  if (!items.length) return null;
  return (
    <div className={`doodle-field ${className}`.trim()} aria-hidden="true">
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
          <Doodle
            type={item.type}
            size={item.size || 28}
            variant={item.variant || "muted"}
            animated={Boolean(item.animated)}
            strokeWidth={item.strokeWidth || 1.6}
          />
        </span>
      ))}
    </div>
  );
}

export default DoodleField;
