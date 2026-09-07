import { DOODLE_VIEWBOX, getDoodleGlyph } from "./doodleCatalog.js";

const VARIANT_CLASS = {
  ink: "doodle-ink",
  muted: "doodle-muted",
  accent: "doodle-accent",
  earth: "doodle-earth",
};

/**
 * Hand-drawn SVG accent. Decorative by default (aria-hidden).
 */
export function Doodle({
  type = "circle",
  size = 32,
  variant = "ink",
  animated = false,
  className = "",
  strokeWidth = 1.7,
  title = "",
} = {}) {
  const glyph = getDoodleGlyph(type);
  const variantClass = VARIANT_CLASS[variant] || VARIANT_CLASS.ink;
  const classes = [
    "doodle",
    variantClass,
    animated ? "doodle-draw" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      className={classes}
      width={size}
      height={size}
      viewBox={DOODLE_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title || undefined}
    >
      {title ? <title>{title}</title> : null}
      {(glyph.paths || []).map((d) => (
        <path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
        />
      ))}
      {(glyph.circles || []).map(([cx, cy, r]) => (
        <circle
          key={`${cx}-${cy}-${r}`}
          cx={cx}
          cy={cy}
          r={r}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          pathLength={1}
        />
      ))}
      {(glyph.lines || []).map(([x1, y1, x2, y2]) => (
        <line
          key={`${x1}-${y1}-${x2}-${y2}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          pathLength={1}
        />
      ))}
      {(glyph.polylines || []).map((points) => (
        <polyline
          key={points}
          points={points}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
        />
      ))}
    </svg>
  );
}

export default Doodle;
